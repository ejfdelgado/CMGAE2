# coding: utf-8
'''
Created on 10/06/2019

@author: Edgar
'''

import time
import logging
from django.http import HttpResponse
from google.appengine.api import memcache
from django.utils import simplejson
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    NoExisteException, ParametrosIncompletosException, NoHayUsuarioException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun
from google.appengine.api.search import search
from datetime import datetime

LLAVE_INDICE = 'docs'
NO_BUSCABLES = ['usr', 'path', 'img']
IGNORAR = ['id']

def leerRefererPath(request):
    elhost = request.META['HTTP_HOST']
    elreferer = request.META['HTTP_REFERER']
    elindice = elreferer.find(elhost) + len(elhost)
    temp = request.META['HTTP_REFERER'][elindice:]
    indiceQuery = temp.find('?') 
    if (indiceQuery >= 0):
        temp = temp[:indiceQuery]
    indiceQuery = temp.find('#') 
    if (indiceQuery >= 0):
        temp = temp[:indiceQuery]
    return temp

def leerNumero(s):
    if (s is None):
        return s
    try:
        return int(s)
    except ValueError:
        return None

def docToJson(doc):
    if isinstance(doc, list):
        output = []
        for valor in doc:
            output.append(docToJson(valor))
        return output
    else:
        campos = doc.fields
        output = {}
        for campo in campos:
            if (isinstance(campo.value, datetime)):
                output[campo.name] = time.mktime(campo.value.timetuple())
            else:
                output[campo.name] = campo.value
        
        output['id'] = doc.doc_id
        return output

#Crea un documento nuevo
def recrearDocumento(idPagina, usuario, elpath, buscables={}, lenguaje='es'):
    campos = []
    buscables['usr'] = usuario
    buscables['path'] = elpath
    #logging.info(buscables)
    for key, value in buscables.iteritems():
        if (not key in IGNORAR):
            if (key in NO_BUSCABLES):
                campos.append(search.AtomField(name=key, value=value, language=lenguaje))
            else:
                campos.append(search.TextField(name=key, value=value, language=lenguaje))
            
    campos.append(search.DateField(name='date', value=datetime.now()))
    
    document = search.Document(
            doc_id=idPagina,
            fields=campos,
            language='es')
    
    return document
    
def complementarConsulta(index, query_string, n=10, cursor_string=None):
    sort_date = search.SortExpression(
        expression='date',
        direction=search.SortExpression.DESCENDING,
        default_value=None)
    sort_options = search.SortOptions(expressions=[sort_date])
    if (cursor_string is not None):
        cursor = search.Cursor(web_safe_string=cursor_string)
    else:
        cursor = search.Cursor()
    query_options = search.QueryOptions(
            limit=n,
            sort_options=sort_options,
            cursor=cursor)
    query = search.Query(query_string=query_string, options=query_options)
    results = index.search(query)
    return results

def autoCrearDoc(idPagina, usuario, elpath, buscables={}, lenguaje='es'):
    index = search.Index(LLAVE_INDICE)
    if (usuario is not None):
        if (idPagina is not None and len(idPagina.strip()) > 0):
            document = index.get(idPagina)
        else:
            query_string = 'usr = '+usuario.uid+' AND path = '+elpath
            results = complementarConsulta(index, query_string, 1)
            datos = results.results
            if (len(datos) > 0):
                document = datos[0]
            else:
                document = None
        
        if (document is not None):
            #Ya existe y no lo debo crear
            return document
        else:
            #Se debe crear
            document = recrearDocumento(idPagina, usuario.uid, elpath, buscables, lenguaje)
            index.put(document)
            return document
    else:
        #Por ahora no se sabe qué hacer cuando no hay usuario logeado
        #raise NoHayUsuarioException()
        pass

def borrar(idPagina, usuario):
    if (idPagina is not None or idPagina == ''):
        index = search.Index(LLAVE_INDICE)
        modelo = index.get(idPagina)
        if (modelo is not None):
            if (usuario is None or (len(modelo['usr']) > 0 and modelo.field('usr').value != usuario.uid)):
                raise NoAutorizadoException()
            else:
                index.delete(idPagina)
        else:
            raise NoExisteException()
    else:
        raise ParametrosIncompletosException()

def actualizar(idPagina, usuario, elpath, peticion):
    if (idPagina is not None or idPagina == ''):
        index = search.Index(LLAVE_INDICE)
        modelo = index.get(idPagina)
        if (modelo is not None):
            if (usuario is None or modelo.field('usr').value != usuario.uid):
                raise NoAutorizadoException()
            else:
                #Solo si ha cambiado la informacion se recrea
                viejo = docToJson(modelo)
                cambio = False
                for key, value in peticion.iteritems():
                    if key in viejo:
                        if (value != viejo[key]):
                            cambio = True
                            break
                    else:
                        cambio = True
                        break
                if (cambio):
                    nuevo = recrearDocumento(idPagina, usuario.uid, elpath, peticion)
                    index.put(nuevo)
                    return docToJson(nuevo)
                else:
                    return docToJson(modelo)
        else:
            raise NoExisteException()
    else:
        raise ParametrosIncompletosException()

def busquedaGeneral(request, usuario):
    ans = {}
    ans['error'] = 0
    ans['next'] = None;
    busqueda = {}
    busqueda['like'] = request.GET.get('like', '')
    busqueda['path'] = request.GET.get('path', None)
    busqueda['mio'] = request.GET.get('mio', '0')
    busqueda['n'] = leerNumero(request.GET.get('n', 10))
    busqueda['next'] = request.GET.get('next', None)#Para paginar
    #ans['q'] = busqueda
    
    index = search.Index(LLAVE_INDICE)
    #TODO Se debe borrar todo lo que no es alfanumerico AND OR
    query_string = busqueda['like']
    if (busqueda['path'] is not None):
        query_string+=' AND path='+busqueda['path']
    if (busqueda['mio'] == '1' and usuario is not None):
        query_string+=' AND usr='+usuario.uid
    
    if (query_string.startswith(' AND')):
        query_string = query_string[5:]
    
    ans['query_string']=query_string
    
    results = complementarConsulta(index, query_string, busqueda['n'], busqueda['next'])
    datos = results.results
    
    ans['valor'] = docToJson(datos)
    
    #Este es el cursor para la siguiente búsqueda
    cursor = results.cursor
    if (cursor is not None):
        cursor_string = cursor.web_safe_string
        ans['next'] = cursor_string
    return ans

@inyectarUsuario
@autoRespuestas
def DocHandler(request, ident, usuario=None):
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        if (ident == ''):
            idPagina = request.GET.get('pg', None)
            elpath = leerRefererPath(request)
            midocumento = autoCrearDoc(idPagina, usuario, elpath)
            ans['valor'] = docToJson(midocumento)
        elif (ident == 'q'):
            ans = busquedaGeneral(request, usuario)
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'PUT':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        peticion = simplejson.loads(request.raw_post_data)
        idPagina = ident
        elpath = leerRefererPath(request)
        ans['valor'] = actualizar(idPagina, usuario, elpath, peticion)
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'DELETE':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        idPagina = ident
        borrar(idPagina, usuario)
        response.write(simplejson.dumps(ans))
        return response
    