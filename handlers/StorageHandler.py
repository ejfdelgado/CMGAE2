# coding: utf-8
from __future__ import with_statement

import os
import io
import re
import uuid
import logging

from apiclient.discovery import build
from oauth2client.client import GoogleCredentials
import googleapiclient.http
        
from django.utils import simplejson
from django.http import HttpResponse
from google.appengine.api import app_identity
from handlers.respuestas import NoExisteException,\
    ParametrosIncompletosException, NoAutorizadoException, \
    NoHayUsuarioException, MalaPeticionException, InesperadoException
from handlers.seguridad import inyectarUsuario
from handlers.decoradores import autoRespuestas
from _io import BytesIO

MAX_TAMANIO_BYTES = 550*1024

#https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/storage/api/crud_object.py
#https://developers.google.com/resources/api-libraries/documentation/storage/v1/python/latest/storage_v1.objects.html#list_next

def generarRutaSimple(hijo):
    hijo = hijo.replace('\\', '/').strip()
    if (hijo.startswith('/')):
        hijo = hijo[1:]
        
    prefijo = darBucketName()+'/'
    if (hijo.startswith(prefijo)):
        hijo = hijo[len(prefijo):]
    
    return hijo

def generarRuta(papa, hijo):
    papa = papa.replace('\\', '/').strip()
    hijo = hijo.replace('\\', '/').strip()
    #quito el ultimo slash
    if (papa.endswith('/')):
        papa = papa[:-1]
    if (not hijo.startswith('/')):
        hijo = '/'+hijo
    return papa+hijo

def existe(filename):
    try:
        return get_metadata(filename)
    except NoExisteException:
        return None

def darBucketName():
    #os.environ.get('BUCKET_NAME', app_identity.get_default_gcs_bucket_name())
    return app_identity.get_application_id()+'.appspot.com'

def darRaizStorage():
    #res = '/'+app_identity.get_default_gcs_bucket_name()
    return '/'+darBucketName()

def darCliente():
    credentials = GoogleCredentials.get_application_default()
    storage_client = build('storage', 'v1', credentials=credentials)
    return storage_client

def list_buckets():
    try:
        storage_client = darCliente()
        buckets = storage_client.buckets().list(project=app_identity.get_application_id()).execute()
        response = HttpResponse("", content_type='application/json')
        response.write(simplejson.dumps({'error':0, 'buckets': buckets}))
        return response
    except NotFoundError:
        raise MalaPeticionException()

def get_metadata_base(filename):
    
    storage_client = darCliente()
    
    try:
        respuesta = storage_client.objects().get(bucket=darBucketName(), object=generarRutaSimple(filename)).execute()
    except googleapiclient.errors.HttpError as error:
        if (error.resp.status == 404):
            return None
        else:
            raise InesperadoException()
    return respuesta

def get_metadata(filename):
    respuesta = get_metadata_base(filename)
    if (respuesta is None):
        raise NoExisteException()
    response = HttpResponse("", content_type='application/json')
    response.write(simplejson.dumps({'error':0, 'metadata': respuesta}))
    return response
        

def read_file_interno(filename):
    
    storage_client = darCliente()
    
    metadata = get_metadata_base(filename)
    
    if (metadata is None):
        return None
    
    stream = io.BytesIO()
    if (metadata['size'] == '0'):
        pass
    else:
        req = storage_client.objects().get_media(bucket=darBucketName(), object=generarRutaSimple(filename))
        downloader = googleapiclient.http.MediaIoBaseDownload(stream, req)
        done = False
        try:
            while done is False:
                status, done = downloader.next_chunk()
        except googleapiclient.errors.HttpError:
            raise InesperadoException()
        
    temp = stream.getvalue()
    
    return {'bin':temp, 'meta':metadata}

def read_file(filename):
    temp = read_file_interno(filename)
    if (temp is None):
        raise NoExisteException()

    response = HttpResponse(temp['bin'], content_type=temp['meta']['metadata']['mime'], status=200)
    return response

def list_bucket2(ruta, tamanio, ultimo, delimiter="/"):
    
    if (tamanio is None):
        tamanio = 10
    else:
        tamanio = int(tamanio)
    
    storage_client = darCliente()
    respuesta = storage_client.objects().list(bucket=darBucketName(), delimiter=delimiter, maxResults=tamanio, pageToken=ultimo, prefix=generarRutaSimple(ruta)).execute()
    
    nueva = []
    
    #itero las carpetas
    if ('prefixes' in respuesta):
        for carpeta in respuesta['prefixes']:
            nuevo = {
                     'esDir':True,
                     'mime':None,
                     'filename':'/'+carpeta,
                     }
            nueva.append(nuevo)
    #itero los archivos
    if ('items' in respuesta):
        for archivo in respuesta['items']:
            nuevo = {
                     'filename':'/'+archivo['name'],
                     'esDir':False,
                     'metadata':archivo['metadata'],
                     'mime':archivo['metadata']['mime'],
                     'tamanio':archivo['size'],
                     'fecha':archivo['timeCreated'],
                     }
            nueva.append(nuevo)
    
    if (len(nueva) > 0):
        if ('nextPageToken' in respuesta):
            nueva[len(nueva)-1]['next'] = respuesta['nextPageToken']
        else:
            nueva[len(nueva)-1]['next'] = None
    return nueva

def generarUID():
    return str(uuid.uuid4())

def general(response):
    bucket_name = darBucketName()
    response.write(simplejson.dumps({
                                     'error':0, 
                                     'content': 'Using bucket name: ' + bucket_name + '\n\n',
                                     'os': os.environ.get('BUCKET_NAME', app_identity.get_default_gcs_bucket_name()),
                                     'other':'Demo GCS Application running from Version: {}\n'.format(os.environ['CURRENT_VERSION_ID'])
                                     }))

def darNombreNodo(ruta):
    nombreNodo = 'Base'
    encontrado = re.search('/([^/]+?)/?$', ruta)
    if (not (encontrado is None)):
        nombreNodo = encontrado.group(1)
    return nombreNodo

def renombrar_archivo(response, viejo, nuevo):
    
    storage_client = darCliente()
    
    body = {
            
    }
    
    req1 = storage_client.objects().copy(
                                          sourceBucket=darBucketName(),
                                          destinationBucket=darBucketName(), 
                                          sourceObject=generarRutaSimple(viejo),
                                          destinationObject=generarRutaSimple(nuevo),
                                          body=body,
                                          destinationPredefinedAcl='publicRead',
                                          )
    req2 = storage_client.objects().delete(bucket=darBucketName(), object=generarRutaSimple(viejo))
    try:
        req1.execute()
        req2.execute()
        response.write(simplejson.dumps({'error':0}))
    except:
        #Aca puede ser otro error
        raise NoExisteException()

def nodosJsTree(lista, excepto=None):
    nueva = []
    lastToken = None
    for nodo in lista:
        nuevo = {
                 'id':nodo['filename'],
                 'text':darNombreNodo(nodo['filename']),
                 'children':nodo['esDir'],
                 'mime':nodo['mime'],
                 'type':'folder' if nodo['esDir'] else 'file'
                 }
        if ('next' in nodo):
            lastToken = nodo['next']
        if (excepto is None):
            nueva.append(nuevo)
        else:
            if (not nuevo['id'] == excepto):
                nueva.append(nuevo)
    
    #Si esta lista da vacía no hay manera de responder con el token!
    if (len(nueva) > 0):
        nueva[len(nueva) - 1]['next'] = lastToken
    
    return nueva

def delete_files(response, filename):
    
    storage_client = darCliente()
    
    metadata = get_metadata_base(filename)
    
    if (metadata is None):
        raise NoExisteException()
    
    req = storage_client.objects().delete(bucket=darBucketName(), object=generarRutaSimple(filename))
    try:
        req.execute()
    except googleapiclient.errors.HttpError:
        raise InesperadoException()
    response.write(simplejson.dumps({'error':0}))

def usuario_es_dueno(usuario, ruta):
    if (usuario is None):
        return False
    if (usuario.isAdmin()):
        return True
    miRaiz = '/usr/'+usuario.miId
    miBase = darRaizStorage()
    if (ruta.startswith(miBase)):
        ruta = ruta.replace(miBase, '')
    if (ruta.startswith(miRaiz)):
        return True
    return False

@inyectarUsuario
@autoRespuestas
def StorageHandler(request, ident, usuario=None):
    if not ident == 'read':
        response = HttpResponse("", content_type='application/json')
    if request.method == 'GET':
        if (ident == 'jstreelist'):
            if (usuario is None):
                raise NoHayUsuarioException()
            ruta = request.GET.get('id', '/')
            tamanio = int(request.GET.get('tamanio', None))
            ultimo = request.GET.get('ultimo', None)
            if (ruta == '#'):
                ans = list_bucket2('', tamanio, ultimo)
                nombreNodo = darNombreNodo(ruta)
                nodo = [{'text': nombreNodo, 'id': ruta, 'children': nodosJsTree(ans)}]
                if (len(ans) > 0):
                    nodo[0]['type'] = 'folder'
                response.write(simplejson.dumps(nodo))
            elif (usuario_es_dueno(usuario, ruta)):
                ans = list_bucket2(ruta, tamanio, ultimo)
                response.write(simplejson.dumps(nodosJsTree(ans, ruta)))
            elif (ruta == '/usr/'):
                response.write(simplejson.dumps([{'text': usuario.proveedor, 'id': '/usr/'+usuario.proveedor+'/', 'children': True}]))
            elif (ruta == '/usr/'+usuario.proveedor+'/'):
                response.write(simplejson.dumps([{'text': usuario.sufijo, 'id': '/usr/'+usuario.miId+'/', 'children': True}]))
            else:
                response.write(simplejson.dumps([]))
        elif (ident == 'existe'):
            nombre = request.GET.get('name', None)
            metadatos = existe(nombre)
            if (metadatos is None):
                raise ParametrosIncompletosException()
            response.write(simplejson.dumps({'error':0, 'metadata': metadatos}))
        elif (ident == 'basic'):
            general(response)
        elif (ident == 'read'):
            nombre = request.GET.get('name', None)
            response = read_file(nombre)
        elif (ident == 'meta'):
            nombre = request.GET.get('name', None)
            response = get_metadata(nombre)
        elif (ident == 'miruta'):
            if (usuario is not None):
                response.write(simplejson.dumps({'error':0, 'url': usuario.darURLStorage()}))
            else:
                raise NoHayUsuarioException()
        elif (ident == 'renombrar'):
            viejo = request.GET.get('viejo', None)                
            nuevo = request.GET.get('nuevo', None)
            if (viejo is None or nuevo is None):
                raise ParametrosIncompletosException()
            renombrar_archivo(response, viejo, nuevo)
        elif (ident == 'guid'):
            response.write(simplejson.dumps({'error':0, 'uid':generarUID()}))
        elif (ident == 'voice'):
            
            nombre = generarRutaSimple(request.GET.get('name', None))
            # Add credentials
            credentials = GoogleCredentials.get_application_default()
            service = build('speech', 'v1', credentials=credentials)
    
            # Methods available in: https://developers.google.com/resources/api-libraries/documentation/speech/v1/python/latest/index.html
            collection = service.speech()
    
            # Build the data structure JSON-like
            data = {}
            data['audio'] = {}
            data['audio']['uri'] = "gs://"+darBucketName()+'/'+nombre
            data['config'] = {}
            #data['config']['encoding'] = '<ENCODING>'
            data['config']['languageCode'] = 'es-mx'
            data['config']['enableSeparateRecognitionPerChannel'] = True
            data['config']['audioChannelCount'] = 2
            #data['config']['sampleRateHertz'] = <SAMPLE_RATE>
    
            # Build the request and execute it
            request = collection.recognize(body=data)
            res = request.execute()
            response.write(simplejson.dumps(res))
        elif (ident == 'text'):
            
            nombre = generarRutaSimple(request.GET.get('name', None))
            # Add credentials
            credentials = GoogleCredentials.get_application_default()
            service = build('images', 'v1', credentials=credentials)
    
            # Methods available in: https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate
            collection = service.images()
    
            # Build the data structure JSON-like
            data = {}
            data['image'] = {}
            data['image']['source'] = {}
            data['image']['source']['imageUri'] = "gs://"+darBucketName()+'/'+nombre
            
            data['features'] = []
            data['features'][0] = {}
            data['features'][0]['maxResults'] = 50
            data['features'][0]['type'] = 'DOCUMENT_TEXT_DETECTION'
            
            data['imageContext'] = {}
            data['imageContext']['cropHintsParams'] = {}
            data['imageContext']['cropHintsParams']['aspectRatios'] = [0.8,1,1.2]
    
            # Build the request and execute it
            request = collection.annotate(body=data)
            res = request.execute()
            response.write(simplejson.dumps(res))
        else:
            response.write(simplejson.dumps({'error':0}))
    elif request.method == 'DELETE':
        if (ident == 'borrar'):
            nombre = request.GET.get('name', None)
            if (not existe(nombre)):
                raise NoExisteException()
            if (not usuario_es_dueno(usuario, nombre)):
                raise NoAutorizadoException()
            delete_files(response, nombre)
    elif request.method == 'POST':
        nombreAnterior = request.POST.get('name', None)
        carpeta = request.POST.get('folder', '')
        auto = request.POST.get('auto', 'true')
        
        if (carpeta.endswith('/')):
            carpeta = carpeta[:-1]
        
            
        archivo = request.FILES['file-0']
        uploaded_file_filename = archivo.name
        uploaded_file_content = archivo.read()
        tamanio = len(uploaded_file_content)
        if (tamanio > MAX_TAMANIO_BYTES):
            raise MalaPeticionException()
        uploaded_file_type = archivo.content_type
        
        storage_client = darCliente()
        
        if (auto == 'true'):
            #Genera nombres automáticamente usando generarUID
            #Implica que cda versión tiene un nombre diferente
            #Puede que se borre siempre la versión anterior, depende de la bandera no-borrar
            if (nombreAnterior is not None and request.POST.get('no-borrar', None) is None):
                if (usuario_es_dueno(usuario, nombreAnterior)):
                    try:
                        req2 = storage_client.objects().delete(bucket=darBucketName(), object=generarRutaSimple(nombreAnterior))
                        req2.execute()
                    except:
                        pass
                else:
                    #Debería en algún lugar registrarse que se debe borrar este archivo uerfano
                    pass
            if (not usuario_es_dueno(usuario, carpeta)):
                raise NoAutorizadoException()
            nombre = carpeta+'/'+generarUID()+'-'+uploaded_file_filename
        else:
            #Usa el nombre actual del archivo
            if (nombreAnterior is None):
                if (not usuario_es_dueno(usuario, carpeta)):
                    raise NoAutorizadoException()
                nombreAnterior = carpeta+'/'+uploaded_file_filename
            else:
                if (not usuario_es_dueno(usuario, nombreAnterior)):
                    raise NoAutorizadoException()
            nombre = nombreAnterior
        
        body = {
            'name': generarRutaSimple(nombre),
            'mimeType': uploaded_file_type,
            'metadata': {
                         'mime': uploaded_file_type,
                         }
        }
        fd = BytesIO(uploaded_file_content)
        
        req = storage_client.objects().insert(
                                              bucket=darBucketName(), 
                                              body=body,
                                              media_body=googleapiclient.http.MediaIoBaseUpload(fd, uploaded_file_type),
                                              predefinedAcl='publicRead',
                                              )
        try:
            req.execute()
        except googleapiclient.errors.HttpError:
            raise InesperadoException()
        response.write(simplejson.dumps({'error':0, 'id':nombre, 'tamanio': tamanio}))
        
    return response
