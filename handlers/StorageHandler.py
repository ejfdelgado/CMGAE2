# coding: utf-8
from __future__ import with_statement

import logging
import os
import re
import sys, traceback
import uuid

from django.utils import simplejson
from django.http import HttpResponse
import cloudstorage as gcs
from cloudstorage.errors import NotFoundError
from google.appengine.api import app_identity
from handlers.respuestas import NoExisteException,\
    ParametrosIncompletosException, NoAutorizadoException, RespuestaNoAutorizado,\
    RespuestaParametrosIncompletos, RespuestaNoExiste
from handlers.seguridad import inyectarUsuario


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
    stats = gcs.listbucket(rutaCompleta, max_keys=tamanio, delimiter="/", marker=ultimo)
    while True:
        count = 0
        for stat in stats:
            count += 1
            ans.append(transformarRegistroDeArchivo(stat, raiz))
        
        if count != tamanio or count == 0:
            break
        stats = gcs.listbucket(rutaCompleta, max_keys=tamanio,
                               marker=stat.filename)
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

@inyectarUsuario
def StorageHandler(request, ident, usuario=None):
    if not ident == 'read':
        response = HttpResponse("", content_type='application/json')
    try:
        if request.method == 'GET':
            if (ident == 'jstreelist'):
                ruta = request.GET.get('id', '/')
                if (ruta == '#'):
                    ans = list_bucket('', 100, None)
                    nombreNodo = darNombreNodo(ruta)
                    nodo = [
                            {'text': nombreNodo, 'id': ruta, 'children': nodosJsTree(ans)}
                            ]
                    if (len(ans) > 0):
                        nodo[0]['type'] = 'folder'
                    response.write(simplejson.dumps(nodo))
                    
                else:
                    ans = list_bucket(ruta, 100, None)
                    response.write(simplejson.dumps(nodosJsTree(ans, ruta)))
            elif (ident == 'existe'):
                nombre = request.GET.get('name', None)
                metadatos = existe(nombre)
                if (metadatos is None):
                    raise ParametrosIncompletosException()
                response.write(simplejson.dumps({'error':0, 'metadata': metadatos}))
            elif (ident == 'list'):
                ruta = request.GET.get('ruta', '/')
                ultimo = request.GET.get('ultimo', None)
                tamanio = request.GET.get('tamanio', None)
                ans = list_bucket(ruta, tamanio, ultimo)
                response.write(simplejson.dumps({'error':0, 'all_objects': ans}))
            elif (ident == 'basic'):
                general(response)
            elif (ident == 'read'):
                nombre = request.GET.get('name', None)
                response = read_file(nombre)
            elif (ident == 'miruta'):
                if (usuario is not None):
                    response.write(simplejson.dumps({'error':0, 'url': usuario.darURLStorage()}))
                else:
                    response.write(simplejson.dumps({'error':0, 'url': '/public'}))
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
                delete_files(response, nombre)
        elif request.method == 'POST':
            archivo = request.FILES['file-0']
            uploaded_file_filename = archivo.name
            uploaded_file_content = archivo.read()
            uploaded_file_type = archivo.content_type
            nombreAnterior = request.POST.get('name', None)
            carpeta = request.POST.get('folder', '')
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
            response.write(simplejson.dumps({'error':0, 'id':nombre}))
    except NoAutorizadoException:
        return RespuestaNoAutorizado()
    except ParametrosIncompletosException:
        return RespuestaParametrosIncompletos()
    except NoExisteException:
        return RespuestaNoExiste()
    except Exception, e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        response = HttpResponse("", content_type='application/json', status=500)
        response.write(simplejson.dumps({'error':1, 'msg': 'Error de servidor: '+repr(traceback.format_tb(exc_traceback))+'->'+str(e)}))

    return response
