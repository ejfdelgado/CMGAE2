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
from models import ShortUrlM
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun
from django.http import HttpResponseRedirect

CORREO_ENVIOS = 'edgar.jose.fernando.delgado@gmail.com'

BASE_CONVERSION = 36

def digit_to_char(digit):
    if digit < 10:
        return str(digit)
    return chr(ord('a') + digit - 10)

def str_base(number,base):
    if number < 0:
        return '-' + str_base(-number, base)
    (d, m) = divmod(number, base)
    if d > 0:
        return str_base(d, base) + digit_to_char(m)
    return digit_to_char(m)

@inyectarUsuario
@autoRespuestas
def ShortUrlHandler(request, ident, usuario=None):
    
    if request.method == 'GET':
        
        miId = int(ident, BASE_CONVERSION)
        llave = ndb.Key('ShortUrlM', miId)
        modelo = llave.get()
        urlredireccion = '/'
        if (modelo is not None):
            urlredireccion = modelo.theurl
        response = HttpResponseRedirect(urlredireccion)
        #response = HttpResponse("", content_type='application/json', status=200)
        #response.write(simplejson.dumps(comun.to_dict(modelo)))
        return response
    elif request.method == 'POST':
        response = HttpResponse("", content_type='application/json', status=200)
        peticion = simplejson.loads(request.raw_post_data)
        theurl = peticion['theurl']
        
        ans = {}
        ans['error'] = 0
        ans['theurl'] = theurl
        #Primero toca hacer la prueba de si existe previamente la url larga
        temporal = ndb.gql('SELECT * FROM ShortUrlM WHERE theurl = :1', theurl)
        datos, next_cursor, more = temporal.fetch_page(1)
        if (len(datos) > 0):
            #Ya existe y no lo debo crear
            ans['id'] = str_base(datos[0].key.id(), BASE_CONVERSION)
        else:
            #Se debe crear
            unaurl = ShortUrlM(theurl=theurl)
            unaurl.put()
            ans['id'] = str_base(unaurl.key.id(), BASE_CONVERSION)
        response.write(simplejson.dumps(ans))
        return response
        
    