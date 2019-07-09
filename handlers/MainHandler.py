# coding: utf-8
from __future__ import with_statement

import logging
import os
import re
import sys, traceback
import uuid

from django.http import HttpResponse
from django.utils import simplejson
from django.views.generic.simple import direct_to_template
from google.appengine.api import memcache
from google.appengine.api import users
from google.appengine.ext import ndb
from handlers.respuestas import *

from scss import Compiler
from handlers import StorageHandler
from handlers import comun

from settings import TEMPLATE_DIRS
from handlers.seguridad import inyectarUsuario
from handlers.PageHandler import buscarPagina

LENGUAJE_PRED = 'esp'
PREFIJO_MEMCACHE_ADMIN = '@'
PREFIJO_MEMCACHE_RUTAS = '$'
LISTA_PATRONES = [
                 {'bin': True, 'mime': 'application/octet-stream', 'patron': re.compile("^\.(woff2?|ttf|png|jpg|bmp|wav|mp3|ogg|midi?|bin|dat|kml|gif)$", re.IGNORECASE)},
                 {'bin': False, 'mime': 'text/xml', 'patron': re.compile("^\.(xml)$", re.IGNORECASE)},
                 {'bin': False, 'mime': 'text/plain', 'patron': re.compile("^\.(txt|csv)$", re.IGNORECASE)},
                 {'bin': False, 'mime': 'text/css', 'patron': re.compile("^\.(css|scss)$", re.IGNORECASE)},
                 {'bin': False, 'mime': 'text/javascript', 'patron': re.compile("^\.(js)$", re.IGNORECASE)},
                 {'bin': True, 'mime': 'image/svg+xml', 'patron': re.compile("^\.(svg)$", re.IGNORECASE)},
                 ]

def agregarRutaParaMemcache(raiz, nueva):
    llaveAyuda = PREFIJO_MEMCACHE_RUTAS+raiz
    anterior = memcache.get(llaveAyuda)
    if not isinstance(anterior, list):
        anterior = [nueva]
        memcache.set(llaveAyuda, anterior)
    else:
        if not nueva in anterior:
            anterior.append(nueva)
            memcache.set(llaveAyuda, anterior)

def borrarRutasDeMemcache(raiz, actual):
    llaveAyuda = PREFIJO_MEMCACHE_RUTAS+raiz
    lista = memcache.get(llaveAyuda)
    if not isinstance(lista, list):
        lista = [actual]
    else:
        if not actual in lista:
            lista.append(actual)
    lista.append(llaveAyuda)
    memcache.delete_multi(lista)

def rutaExiste(ruta):
    valor = 0;
    if (ruta is not None and len(str(ruta).strip())>0):
        if (StorageHandler.existe(StorageHandler.generarRuta('/public', ruta)) is not None):
            valor = 1
        elif (os.path.isfile(os.path.join(TEMPLATE_DIRS[0], ruta))):
            valor = 2
    return valor;

def leerRuta(ruta):
    ubicacion = rutaExiste(ruta)
    if (ubicacion == 0):
        return None
    elif (ubicacion == 1):
        return StorageHandler.read_file_interno(StorageHandler.generarRuta('/public', ruta))
    elif (ubicacion == 2):
        completo = ''
        for words in open(os.path.join(TEMPLATE_DIRS[0], ruta), 'r').readlines():
            completo = completo + words
        return completo

def procesarTemplate(ruta, base):
    respuesta = {'nodos':[], 'busquedas':[]}
    #completo = leerRuta(ruta)
    #if (completo is None):
    #    return respuesta
    return respuesta
def generarVariablesUsuario(var_full_path, leng):
    texto = '<script>\n'
    usuario = users.get_current_user()
    login_url = users.create_login_url(var_full_path)
    logout_url = users.create_logout_url(var_full_path)
    
    texto += 'var LENGUAJE = "'+leng+'";\n'
    texto += 'var LENGUAJE_PRED = "'+LENGUAJE_PRED+'";\n'
    texto += 'var URL_LOGIN = "'+login_url+'";\n'
    texto += 'var URL_LOGOUT = "'+logout_url+'";\n'
    texto += 'var RAIZ_CLOUD_STORAGE = "'+StorageHandler.darRaizStorage()+'";\n'
    
    if os.getenv('SERVER_SOFTWARE', '').startswith('Google App Engine/'):
        texto += 'var AMBIENTE = "produccion";\n'
    else:
        texto += 'var AMBIENTE = "pruebas";\n'
    
    if (usuario is None):
        texto += 'var HAS_USER = false;\n'
        texto += 'var EMAIL_USER = "";\n'
        texto += 'var IS_ADMIN = false;\n'

    else:
        texto += 'var HAS_USER = true;\n'
        texto += 'var EMAIL_USER = "'+usuario.email()+'";\n'
        if (users.is_current_user_admin()):
            texto += 'var IS_ADMIN = true;\n'
        else:
            texto += 'var IS_ADMIN = false;\n'
    texto += '</script>\n'
    return texto
#Encargado de renderizar los archivos estáticos dinámicos
@inyectarUsuario
def MainHandler(request, data, usuario):
    try:
        #incluye los parametros del get no va a ignorar el lenguaje (solo se usa para memcache)
        var_full_path = request.get_full_path()
        llaveParaMemcache = var_full_path
        if users.is_current_user_admin():
            llaveParaMemcache = PREFIJO_MEMCACHE_ADMIN+llaveParaMemcache
        #incluye hasta la ? o # y va a ignorar el lenguaje
        var_path = request.path
        
        if request.method == 'GET':
            leng = re.findall('^(\/leng-)([a-zA-Z]{3})(\/)', var_path)
            
            if (len(leng) > 0):
                leng = leng[0][1].lower()
                var_path = var_path[9:]
                data = data[9:]
            else:
                leng = LENGUAJE_PRED
            
            puntoExtension = data.rfind('.')
            extension = data[puntoExtension:]
            mime = 'text/html'
            esBinario = False
            for tipo in LISTA_PATRONES:
                if (tipo['patron'].match(extension)):
                    mime = tipo['mime']
                    if tipo['bin']:
                        esBinario = True
                    break
            if not esBinario:
                mime = mime+'; charset=utf-8'
            
            if False:#Usar cache
                anterior = memcache.get(llaveParaMemcache)
                if (anterior):
                    return HttpResponse(anterior, content_type=mime)
            
            #Se lee el template para saber cuales ids se deben buscar de la base de datos
            if (not esBinario):
                llavesEntidades = []
                identificadores = []
                module = __import__('models')
                
                #Buscar un template valido para la url
                ruta = data
                varRutaExiste = 0
                #0. Primero se mira si tal vez existe la ruta exacta
                varRutaExiste = rutaExiste(ruta)
                if (varRutaExiste == 0):
                    #1. Se le quita la extensión
                    if (puntoExtension >= 0):
                        ruta = ruta[:puntoExtension]
                    #2. Se itera por los diferentes slash y se mira si existe template
                    ultimoIndice = len(ruta)
                    
                    while True:
                        rutaParcial = ruta[:ultimoIndice]+'.html'
                        ultimoIndice = ruta.rfind('/', 0, ultimoIndice)
                        varRutaExiste = rutaExiste(rutaParcial)
                        if (not (varRutaExiste == 0) or ultimoIndice <= 0):
                            break
                else:
                    rutaParcial = ruta
                
                #Si no encontró se queda con el index
                if (varRutaExiste == 0 and ultimoIndice <= 0):
                    data = 'index.html'
                else:
                    data = rutaParcial
                    
                todo = procesarTemplate(data, var_path)
                
                for parte in todo['nodos']:
                    class_ = getattr(module, parte['tipo'])
                    identificadores.append(ndb.Key(class_, parte['id']))
                    
                llavesEntidades = todo['busquedas']
                
                #Se leen las entidades
                list_of_entities = ndb.get_multi(identificadores)
                dicci = {}
                for entidad in list_of_entities:
                    if entidad is not None:
                        nombreClase = entidad.__class__.__name__
                        if not dicci.has_key(nombreClase):
                            dicci[nombreClase] = {}
                        dicci[nombreClase][entidad.key.id()] = entidad.to_dict()
                
                entidades = {}
                cursores = {}
                
                data_q = request.GET.get('data-q', None)
                data_next = request.GET.get('data-next', None)
                id_pagina = request.GET.get('pg', None)
                
                for llaveEntidad in llavesEntidades:
                    objeto_busqueda = simplejson.loads(llaveEntidad)
                    if (data_q == llaveEntidad and not data_next == None):
                        objeto_busqueda['next'] = data_next
                    objeto = comun.buscarGQL(objeto_busqueda)
                    entidades[llaveEntidad] = comun.to_dict(objeto['datos'])
                    if (objeto.has_key('next')):
                        cursores[llaveEntidad] = objeto['next']
                
                if (id_pagina is not None):
                    try:
                        detalle = buscarPagina(request, usuario, True)
                        detalle['tit'] = simplejson.loads(detalle['tit'])
                        detalle['desc'] = simplejson.loads(detalle['desc'])
                        detalle['q'] = simplejson.loads(detalle['q'])
                        detalle['img'] = simplejson.loads(detalle['img'])
                    except:
                        detalle = {'tit': 'pais.tv','desc': 'pais.tv','img': 'pais.tv',}
                else:
                    detalle = None
                
                context = {
                    'admin':users.is_current_user_admin(),
                    'path':var_path,
                    'detalle': detalle,
                }
                
                respuesta = direct_to_template(request, data, context, mime)
                
                if (extension.startswith(".scss")):
                    for llave in request.GET.keys():
                        valor = request.GET.get(llave)
                        respuesta.content = comun.remplazar(respuesta.content, llave, valor)
                    respuesta.content = Compiler().compile_string(respuesta.content)
                #Siempre se codifica utf-8
                respuesta.content = comun.siempreUtf8(respuesta.content)
            else:
                respuesta = StorageHandler.read_file(data)
            
            if (respuesta.status_code == 204):
                #significa que no existe
                return respuesta
            
            
            memcache.set(llaveParaMemcache, respuesta.content)
            agregarRutaParaMemcache(request.path, llaveParaMemcache)
            
            if (not esBinario):
                respuesta.content = comun.remplazar(respuesta.content, '__USER__', generarVariablesUsuario(var_full_path, leng), True)
                
            return respuesta
        elif request.method == 'DELETE':
            #Borra rutas específicas de memcache
            response = HttpResponse("", content_type='application/json')
            borrarRutasDeMemcache(request.path, llaveParaMemcache)
            response.write(simplejson.dumps({'error':0}))
    except Exception, e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        response = HttpResponse("", content_type='application/json', status=500)
        response.write(simplejson.dumps({'error':1, 'msg': 'Error de servidor: '+repr(traceback.format_tb(exc_traceback))+'->'+str(e)}))
    return response
