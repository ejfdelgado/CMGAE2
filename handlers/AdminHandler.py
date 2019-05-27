# coding: utf-8
'''
Created on 25/05/2018

@author: Edgar
'''

import logging
from django.http import HttpResponse
from google.appengine.api import users
from google.appengine.api import memcache
from django.utils import simplejson
from google.appengine.ext import ndb
from models import Configuracion
from google.appengine.api import mail
import sys, traceback
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas

CORREO_ENVIOS = 'edgar.jose.fernando.delgado@gmail.com'

@inyectarUsuario
@autoRespuestas
def AdminHandler(request, ident, usuario=None):
    if request.method == 'GET':
        if ident == 'identidad':
            if (usuario is not None):
                response = HttpResponse("", content_type='application/json', status=200)
                response.write(simplejson.dumps({'id': usuario.miId, 'roles': usuario.roles}))
                return response
            else:
                return RespuestaNoAutorizado()
        else:
            #Zona de administradores
            if not enRolFun(usuario, ['admin']):
                raise NoAutorizadoException()
            if ident == 'clearmemcache':
                if not memcache.flush_all():
                    raise 'No se logro vaciar la memoria'
                else:
                    response.write(simplejson.dumps({'error':0}))
                return response
    