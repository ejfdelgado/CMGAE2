# coding: utf-8
from __future__ import with_statement

import os
import re
import uuid
import logging

from django.utils import simplejson
from django.http import HttpResponse
import cloudstorage as gcs
from cloudstorage.errors import NotFoundError
from google.appengine.api import app_identity
from handlers.respuestas import NoExisteException,\
    ParametrosIncompletosException, NoAutorizadoException, \
    NoHayUsuarioException, MalaPeticionException
from handlers.seguridad import inyectarUsuario
from handlers.decoradores import autoRespuestas

MAX_TAMANIO_BYTES = 550*1024

def generarRuta(papa, hijo):
    papa = papa.replace('\\', '/').strip()
    hijo = hijo.replace('\\', '/').strip()
    #quito el ultimo slash
    if (papa.endswith('/')):
        papa = papa[:-1]
    if (not hijo.startswith('/')):
        hijo = '/'+hijo
    return papa+hijo

def transformarRegistroDeArchivo(registro, raiz):
    res = {}
    if (raiz is None):
        raiz = darRaizStorage()
    res['filename'] = registro.filename[len(raiz):]
    
    if (registro.is_dir):
        res['esDir'] = True
        res['mime'] = None
    else:
        res['esDir'] = False
        res['tamanio'] = registro.st_size
        res['mime'] = registro.content_type
        res['metadata'] = registro.metadata
        res['fecha'] = registro.st_ctime
    return res

def existe(filename):
    metadata = None
    completo = generarRuta(darRaizStorage(), filename)
    try:
        metadata = transformarRegistroDeArchivo(gcs.stat(completo), darRaizStorage())
    except(NotFoundError):
        metadata = None
    return metadata

def darRaizStorage():
    res = '/'+app_identity.get_default_gcs_bucket_name()
    return res

def read_file_interno(filename):
    completo = generarRuta(darRaizStorage(), filename)
    if (not existe(filename)):
        return None
    with gcs.open(completo) as cloudstorage_file:
        temp = cloudstorage_file.read()
        return temp
    
def read_file(filename):
    completo = generarRuta(darRaizStorage(), filename)
    try:
        metadata = gcs.stat(completo)
        mime = (metadata.content_type if metadata.content_type is not None else (metadata.mime if metadata.mime is not None else 'text/plain'))
        with gcs.open(completo) as cloudstorage_file:
            temp = cloudstorage_file.read()
            response = HttpResponse(temp, content_type=mime, status=200)
            return response
    except NotFoundError:
        raise NoExisteException()

def list_bucket(ruta, tamanio, ultimo):
    raiz = darRaizStorage()
    rutaCompleta = raiz + ruta
    ans = []
    if (tamanio is None):
        tamanio = 10
    else:
        tamanio = int(tamanio)
    if (ultimo is not None):
        ultimo = raiz + ultimo
    stats = gcs.listbucket(rutaCompleta, max_keys=tamanio, delimiter="/", marker=ultimo)
    for stat in stats:
        ans.append(transformarRegistroDeArchivo(stat, raiz))
    return ans;

def generarUID():
    return str(uuid.uuid4())

def general(response):
    bucket_name = os.environ.get('BUCKET_NAME', app_identity.get_default_gcs_bucket_name())
    response.write(simplejson.dumps({
                                     'error':0, 
                                     'content': 'Using bucket name: ' + bucket_name + '\n\n',
                                     'other':'Demo GCS Application running from Version: {}\n'.format(os.environ['CURRENT_VERSION_ID'])
                                     }))

def darNombreNodo(ruta):
    nombreNodo = 'Base'
    encontrado = re.search('/([^/]+?)/?$', ruta)
    if (not (encontrado is None)):
        nombreNodo = encontrado.group(1)
    return nombreNodo

def renombrar_archivo(response, viejo, nuevo):
    try:
        gcs.copy2(darRaizStorage()+viejo, darRaizStorage()+nuevo, {'x-goog-acl':'public-read'})
        gcs.delete(darRaizStorage()+viejo)
        response.write(simplejson.dumps({'error':0}))
    except:
        raise NoExisteException()#Aca puede ser otro error

def nodosJsTree(lista, excepto=None):
    nueva = []
    for nodo in lista:
        nuevo = {
                 'id':nodo['filename'],
                 'text':darNombreNodo(nodo['filename']),
                 'children':nodo['esDir'],
                 'mime':nodo['mime'],
                 'type':'folder' if nodo['esDir'] else 'file'
                 }
        if (excepto is None):
            nueva.append(nuevo)
        else:
            if (not nuevo['id'] == excepto):
                nueva.append(nuevo)
            
    return nueva

def delete_files(response, filename):
    try:
        gcs.delete(darRaizStorage()+filename)
        response.write(simplejson.dumps({'error':0}))
    except gcs.NotFoundError:
        raise NoExisteException()

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
                ans = list_bucket('', tamanio, ultimo)
                nombreNodo = darNombreNodo(ruta)
                nodo = [{'text': nombreNodo, 'id': ruta, 'children': nodosJsTree(ans)}]
                if (len(ans) > 0):
                    nodo[0]['type'] = 'folder'
                response.write(simplejson.dumps(nodo))
            elif (usuario_es_dueno(usuario, ruta)):
                ans = list_bucket(ruta, tamanio, ultimo)
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
        if (carpeta.endswith('/')):
            carpeta = carpeta[:-1]
        if (nombreAnterior is not None):
            if (not usuario_es_dueno(usuario, nombreAnterior)):
                raise NoAutorizadoException()
        else:
            if (not usuario_es_dueno(usuario, carpeta)):
                raise NoAutorizadoException()
        archivo = request.FILES['file-0']
        uploaded_file_filename = archivo.name
        uploaded_file_content = archivo.read()
        tamanio = len(uploaded_file_content)
        if (tamanio > MAX_TAMANIO_BYTES):
            raise MalaPeticionException()
        uploaded_file_type = archivo.content_type
        auto = request.POST.get('auto', 'true')
        if (auto == 'true'):
            #Genera nombres automáticamente usando generarUID
            #Implica que cda versión tiene un nombre diferente
            #Puede que se borre siempre la versión anterior, depende de la bandera no-borrar
            if (not nombreAnterior is None and request.POST.get('no-borrar', None) is None):
                try:
                    nombreAnterior = darRaizStorage()+nombreAnterior
                    gcs.delete(nombreAnterior)
                except:
                    pass
            nombre = darRaizStorage()+carpeta+'/'+generarUID()+'-'+uploaded_file_filename
        else:
            #Usa el nombre actual del archivo
            if (nombreAnterior is None):
                nombreAnterior = carpeta+'/'+uploaded_file_filename
            nombre = darRaizStorage()+nombreAnterior
        write_retry_params = gcs.RetryParams(backoff_factor=1.1)
        gcs_file = gcs.open(nombre,
                          'w',
                          content_type=uploaded_file_type,
                          options={
                                   'x-goog-meta-mime': uploaded_file_type,
                                   'x-goog-acl':'public-read'
                                   },
                          retry_params=write_retry_params)
        gcs_file.write(uploaded_file_content)
        gcs_file.close()
        response.write(simplejson.dumps({'error':0, 'id':nombre, 'tamanio': tamanio}))
    return response
