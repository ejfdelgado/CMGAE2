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
from google.appengine.ext import ndb
from models import Pagina
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    NoExisteException, ParametrosIncompletosException, NoHayUsuarioException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun
from google.appengine.api.search import search
from datetime import datetime

LLAVE_INDICE = 'docs'

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
        output = {}
        output['tit'] = doc.field('tit').value
        output['desc'] = doc.field('desc').value
        output['img'] = doc.field('img').value
        output['usr'] = doc.field('usr').value
        output['path'] = doc.field('path').value
        output['date'] = time.mktime(doc.field('date').value.timetuple())
        output['id'] = doc.doc_id
        return output
        

@inyectarUsuario
@autoRespuestas
def DocHandler(request, ident, usuario=None):
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        if (ident == ''):
            idPagina = leerNumero(request.GET.get('pg', None))
            if (idPagina is None):
                index = search.Index(LLAVE_INDICE)
                if (usuario is not None):
                    elpath = leerRefererPath(request)
                    elUsuario = usuario.uid
                    
                    query_string = 'usr = '+elUsuario+' AND path = '+elpath
                    sort_date = search.SortExpression(
                        expression='date',
                        direction=search.SortExpression.DESCENDING,
                        default_value=None)
                    sort_options = search.SortOptions(expressions=[sort_date])
                    #cursor = search.Cursor(web_safe_string=cursor_string)
                    #options = search.QueryOptions(cursor=cursor)
                    query_options = search.QueryOptions(
                            limit=1,
                            sort_options=sort_options)
                    query = search.Query(query_string=query_string, options=query_options)
                    results = index.search(query)
                    datos = results.results
                    
                    #Este es el cursor para la siguiente búsqueda
                    #cursor = results.cursor
                    #cursor_string = cursor.web_safe_string
                    
                    if (len(datos) > 0):
                        #Ya existe y no lo debo crear
                        ans['valor'] = docToJson(datos[0])
                    else:
                        #Se debe crear
                        document = search.Document(
                                fields=[
                                    search.TextField(name='tit', value='', language='es'),
                                    search.TextField(name='desc', value='', language='es'),
                                    
                                    search.AtomField(name='img', value='', language='es'),
                                    search.AtomField(name='usr', value=elUsuario, language='es'),
                                    search.AtomField(name='path', value=elpath, language='es'),
                                    
                                    search.DateField(name='date', value=datetime.now()),
                                ])
                        index.put(document)
                        ans['valor'] = docToJson(document)
                else:
                    #Por ahora no se sabe qué hacer cuando no hay usuario logeado
                    raise NoHayUsuarioException()
            else:
                index = search.Index(LLAVE_INDICE)
                document = index.get(idPagina)
                ans['valor'] = docToJson(document)
        elif (ident == 'q'):
            ans['next'] = None;
            busqueda = {}
            busqueda['like'] = request.GET.get('like', None)
            busqueda['path'] = request.GET.get('path', None)
            busqueda['mio'] = request.GET.get('mio', '0')
            busqueda['n'] = leerNumero(request.GET.get('n', 10))
            busqueda['next'] = request.GET.get('next', None)#Para paginar
            ans['q'] = busqueda
            
            parametros = []
            sqltext = 'SELECT * FROM Pagina WHERE '
            ixparam = 1
            if (busqueda['path'] is not None):
                sqltext+='path = :'+str(ixparam)
                parametros.append(busqueda['path'])
                ixparam=ixparam+1;
            if (busqueda['mio'] == '1' and usuario is not None):
                sqltext+='usr = :'+str(ixparam)
                parametros.append(usuario.uid)
                ixparam=ixparam+1;
            if (busqueda['like'] is not None):
                #Pensar como hacer
                pass
                
            if (ixparam == 1):
                sqltext = 'SELECT * FROM Pagina '
                
            sqltext+=' ORDER BY date DESC'
            
            ans['sqltext'] = sqltext
            
            temporal = ndb.gql(sqltext, *parametros)
            if (busqueda['next'] is not None):
                datos, next_cursor, more = temporal.fetch_page(busqueda['n'], start_cursor=ndb.query.Cursor(urlsafe=busqueda['next']))
            else:
                datos, next_cursor, more = temporal.fetch_page(busqueda['n'])
            ans['ans'] = comun.to_dict(datos, None, True)
            if (more):
                ans['next'] = next_cursor.urlsafe()
        
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'PUT':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        peticion = simplejson.loads(request.raw_post_data)
        idPagina = leerNumero(ident)
        if (idPagina is not None):
            llave = ndb.Key('Pagina', idPagina)
            modelo = llave.get()
            if (modelo is not None):
                if (usuario is None or modelo.usr != usuario.uid):
                    raise NoAutorizadoException()
                else:
                    otro = comun.llenarYpersistir(Pagina, modelo, peticion, ['usr', 'path', 'date', 'id'], True)
                    ans['valor'] = otro
            else:
                raise NoExisteException()
        else:
            raise ParametrosIncompletosException()
        response.write(simplejson.dumps(ans))
        return response
    