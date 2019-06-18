# coding: utf-8
'''
Created on 10/06/2019

@author: Edgar
'''

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
from handlers import comun, DocHandler

LIGTH_WEIGHT_KEYS = ['tit', 'desc', 'img', 'q']

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

def filtrarParametros(request, filtro):
    buscables={}
    if isinstance(request,dict):
        for key in filtro:
            if (key in request):
                buscables[key] = request[key]
    else:
        for key in filtro:
            buscables[key] = request.GET.get(key, None)
    return buscables

@inyectarUsuario
@autoRespuestas
def PageHandler(request, ident, usuario=None):
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        if (ident == ''):
            idPagina = comun.leerNumero(request.GET.get('pg', None))
            buscables=filtrarParametros(request, LIGTH_WEIGHT_KEYS)
            elpath = leerRefererPath(request)
            if (idPagina is None):
                if (usuario is not None):
                    elUsuario = usuario.uid
                    
                    temporal = ndb.gql('SELECT * FROM Pagina WHERE usr = :1 and path = :2 ORDER BY date DESC', elUsuario, elpath)
                    datos, next_cursor, more = temporal.fetch_page(1)
                    unapagina = None
                    if (len(datos) > 0):
                        #Ya existe y no lo debo crear
                        unapagina = datos[0]
                    else:
                        #Se debe crear
                        unapagina = Pagina(usr=elUsuario, path=elpath, **buscables)
                        unapagina.put()
                    ans['valor'] = comun.to_dict(unapagina, None, True)
                    buscables=filtrarParametros(ans['valor'], LIGTH_WEIGHT_KEYS)
                    DocHandler.autoCrearDoc(str(unapagina.key.id()), usuario, elpath, buscables)
                else:
                    #Por ahora no se sabe qué hacer cuando no hay usuario logeado
                    raise NoHayUsuarioException()
            else:
                llave = ndb.Key('Pagina', idPagina)
                unapagina = llave.get()
                #Validar que exista el buscable
                DocHandler.autoCrearDoc(str(unapagina.key.id()), usuario, elpath, buscables)
                ans['valor'] = comun.to_dict(unapagina, None, True)
        elif (ident == 'q'):
            ans = DocHandler.busquedaGeneral(request, usuario)
            todo = request.GET.get('todo', None)
            if (todo is not None):
                ids = []
                for undoc in ans['valor']:
                    ids.append(undoc['id'])
                laspaginas = ndb.get_multi([ndb.Key('Pagina', comun.leerNumero(k)) for k in ids])
                ans['valor'] = comun.to_dict(laspaginas, None, True)
        elif (ident == 'q2'):
            ans['next'] = None;
            busqueda = {}
            busqueda['path'] = request.GET.get('path', None)
            busqueda['mio'] = request.GET.get('mio', '0')
            busqueda['n'] = comun.leerNumero(request.GET.get('n', 10))
            busqueda['next'] = request.GET.get('next', None)#Para paginar
            #ans['q'] = busqueda
            
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
        idPagina = comun.leerNumero(ident)
        if (idPagina is not None):
            llave = ndb.Key('Pagina', idPagina)
            modelo = llave.get()
            if (modelo is not None):
                if (usuario is None or modelo.usr != usuario.uid):
                    raise NoAutorizadoException()
                else:
                    otro = comun.llenarYpersistir(Pagina, modelo, peticion, ['usr', 'path', 'date', 'id'], True)
                    elpath = leerRefererPath(request)
                    buscables=filtrarParametros(peticion, LIGTH_WEIGHT_KEYS)
                    #Optimizar, si no ha cambiado, no recrear
                    DocHandler.actualizar(str(idPagina), usuario, elpath, buscables)
                    
                    ans['valor'] = otro
            else:
                raise NoExisteException()
        else:
            raise ParametrosIncompletosException()
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'DELETE':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        idPagina = comun.leerNumero(ident)
        if (idPagina is not None):
            llave = ndb.Key('Pagina', idPagina)
            modelo = llave.get()
            if (modelo is not None):
                if (usuario is None or modelo.usr != usuario.uid):
                    raise NoAutorizadoException()
                else:
                    modelo.key.delete()
                    DocHandler.borrar(str(idPagina), usuario)
            else:
                raise NoExisteException()
        else:
            raise ParametrosIncompletosException()
        response.write(simplejson.dumps(ans))
        return response
    