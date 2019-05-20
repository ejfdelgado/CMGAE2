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
from handlers.respuestas import RespuestaNoAutorizado
from handlers.seguridad import inyectarUsuario

CORREO_ENVIOS = 'edgar.jose.fernando.delgado@gmail.com'

@inyectarUsuario
def AdminGeneral(request, ident, usuario=None):
    response = HttpResponse("", content_type='application/json')
    try:
        if request.method == 'GET':
            if ident == 'identidad':
                if (usuario is not None):
                    response = HttpResponse("", content_type='application/json', status=200)
                    response.write(simplejson.dumps({'token': usuario.metadatos, 'username': usuario.darUsername()}))
                    return response
                else:
                    return RespuestaNoAutorizado()
            if not users.is_current_user_admin():
                return HttpResponse(status=401)
            if ident == 'clearmemcache':
                if not memcache.flush_all():
                    raise 'No se logro vaciar la memoria'
                else:
                    response.write(simplejson.dumps({'error':0}))
                return response
    except Exception, e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        response = HttpResponse("", content_type='application/json', status=500)
        response.write(simplejson.dumps({'error':1, 'msg': 'Error de servidor: '+repr(traceback.format_tb(exc_traceback))+'->'+str(e)}))
        return response