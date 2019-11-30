# coding: utf-8
'''
Created on 26/11/2019

@author: Edgar
'''
import logging
from django.http import HttpResponse
from django.utils import simplejson
from google.appengine.ext import ndb
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    ParametrosIncompletosException, NoExisteException, NoHayUsuarioException,\
    MalaPeticionException
from handlers.seguridad import inyectarUsuario
from handlers.decoradores import autoRespuestas
from handlers import comun
from handlers.TuplaHandler import buscarTuplas, to_dict_simple, crearTuplas
from handlers.fbpubsub import publicar

import base64
import hashlib
from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Cipher.AES import AESCipher

import random
import string

def randomStringDigits(stringLength=7):
    """Generate a random string of letters and digits """
    lettersAndDigits = string.ascii_letters + string.digits
    return ''.join(random.choice(lettersAndDigits) for i in range(stringLength))

def randomString(stringLength=8):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

class AESCipher(object):

    def __init__(self, key): 
        self.bs = AES.block_size
        self.key = hashlib.sha256(key.encode()).digest()

    def encrypt(self, raw):
        raw = self._pad(raw)
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return base64.b64encode(iv + cipher.encrypt(raw.encode()))

    def decrypt(self, enc):
        enc = base64.b64decode(enc)
        iv = enc[:AES.block_size]
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return self._unpad(cipher.decrypt(enc[AES.block_size:])).decode('utf-8')

    def _pad(self, s):
        return s + (self.bs - len(s) % self.bs) * chr(self.bs - len(s) % self.bs)

    @staticmethod
    def _unpad(s):
        return s[:-ord(s[len(s)-1:])]

def darPassDePg(pg):
    idPagina = comun.leerNumero(pg)
    llave = ndb.Key('Pagina', idPagina)
    unapagina = llave.get()
    if (unapagina.pwd is None):
        unapagina.pwd = randomString(8)
        unapagina.put()
    return unapagina.pwd

#http://proyeccion-colombia1.appspot.com/api/v?enc=esto%20es%20secreto&pg=5714368087982080
#http://proyeccion-colombia1.appspot.com/api/v?dec=G3Tm1ShRhQIvuLvUIBHut5mVTbpf0oKfcMbtLaYm5Ps=&pg=5714368087982080
#http://proyeccion-colombia1.appspot.com/api/v?pg=5714368087982080&u=dfd233&v=afg3245e
@inyectarUsuario
@autoRespuestas
def VotaHandler(request, ident, usuario=None):
    response = HttpResponse("", content_type='application/json', status=200)
    ans = {}
    ans['error'] = 0
    if request.method == 'GET':
        
        pg = request.GET.get('pg', None)
        enc = request.GET.get('enc', None)
        dec = request.GET.get('dec', None)
        if (pg is None):
            raise ParametrosIncompletosException()

        if (enc is not None):
            pas = darPassDePg(pg)
            ans['pas'] = pas 
            motor = AESCipher(pas)
            ans['ans'] = motor.encrypt(enc);
            response.write(simplejson.dumps(ans))
            return response
        elif (dec is not None):
            pas = darPassDePg(pg)
            ans['pas'] = pas 
            motor = AESCipher(pas)
            ans['ans'] = motor.decrypt(dec);
            response.write(simplejson.dumps(ans))
            return response
        
        usr = request.GET.get('u', None)
        vot = request.GET.get('v', None)
        if (usr is None or vot is None):
            raise ParametrosIncompletosException()
        
        consulta = [
                    'per.'+usr+'.humId',
                    'per.'+usr+'.nom',
                    'global.votacion',
                    ]
        
        datos = buscarTuplas(pg, consulta)
        datos = to_dict_simple(datos, None, True, ['id', 'i', 'd', 'sd'])
        
        
        if ((not ('global.votacion' in datos)) or datos['global.votacion'] is None):
            raise MalaPeticionException()
        rutaVotacion = datos['global.votacion']
        
        consulta = [
                    rutaVotacion+'.pregunta',
                    rutaVotacion+'.opciones.'+vot+'.txt',
                    ]
        
        datos2 = buscarTuplas(pg, consulta)
        datos2 = to_dict_simple(datos2, None, True, ['id', 'i', 'd', 'sd'])
        
        payloadModificacion = {"dat":{
                            rutaVotacion+'.resultado.u.'+usr: simplejson.dumps(vot)
                            },"acc":"+"}
        crearTuplas(pg, payloadModificacion)
        
        llave = ndb.Key('Pagina', comun.leerNumero(pg))
        unapagina = llave.get()
        
        publicar(unapagina.usr, unapagina.path, pg, payloadModificacion)
        
        ans['msg'] = datos2[rutaVotacion+'.pregunta']+' '+datos['per.'+usr+'.humId']+' vota por "'+datos2[rutaVotacion+'.opciones.'+vot+'.txt']+'"'
        #ans['msg1'] = datos
        #ans['msg2'] = datos2
        #ans['creacion'] = creacion

        response.write(simplejson.dumps(ans))
        return response
    