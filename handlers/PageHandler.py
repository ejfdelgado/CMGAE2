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
    NoExisteException, ParametrosIncompletosException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun

def leerRefererPath(request):
    elhost = request.META['HTTP_HOST']
    elreferer = request.META['HTTP_REFERER']
    elindice = elreferer.find(elhost) + len(elhost)
    return request.META['HTTP_REFERER'][elindice:]

def leerNumero(s):
    if (s is None):
        return s
    try:
        return int(s)
    except ValueError:
        return None

@inyectarUsuario
@autoRespuestas
def PageHandler(request, ident, usuario=None):
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        #logging.info(request.META)
        idPagina = leerNumero(request.GET.get('pg', None))
        ans = {}
        ans['error'] = 0
        if (idPagina is None):
            if (usuario is not None):
                elpath = leerRefererPath(request)
                elUsuario = usuario.uid
                
                temporal = ndb.gql('SELECT * FROM Pagina WHERE usr = :1 and path = :2 ORDER BY date DESC', elUsuario, elpath)
                datos, next_cursor, more = temporal.fetch_page(1)
                if (len(datos) > 0):
                    #Ya existe y no lo debo crear
                    ans['valor'] = comun.to_dict(datos[0], None, True)
                else:
                    #Se debe crear
                    unapagina = Pagina(usr=elUsuario, path=elpath)
                    unapagina.put()
                    ans['valor'] = comun.to_dict(unapagina, None, True)
            else:
                #No hay usuario logeado
                pass
        else:
            llave = ndb.Key('Pagina', idPagina)
            unapagina = llave.get()
            ans['valor'] = comun.to_dict(unapagina, None, True)
        
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
    