'''
Created on 12/12/2017

@author: Edgar
'''

from django.http import HttpResponse
from django.utils import simplejson

class NoHayUsuarioException(Exception):
    pass

class NoAutorizadoException(Exception):
    pass

class MalaPeticionException(Exception):
    pass

class ParametrosIncompletosException(Exception):
    pass

class NoExisteException(Exception):
    pass

class InesperadoException(Exception):
    pass

class RespuestaNoHayUsuario(HttpResponse):
    def __init__(self):
        super(RespuestaNoHayUsuario, self).__init__(simplejson.dumps({'error':403, 'msg':'Se requiere usuario logeado'}),'application/json')
        self.status_code = 403

class RespuestaNoAutorizado(HttpResponse):
    def __init__(self):
        super(RespuestaNoAutorizado, self).__init__(simplejson.dumps({'error':403, 'msg':'No tiene permisos'}),'application/json')
        self.status_code = 403
        
class RespuestaMalaPeticion(HttpResponse):
    def __init__(self):
        super(RespuestaMalaPeticion, self).__init__(simplejson.dumps({'error':403, 'msg':'No se acepta esta peticion'}),'application/json')
        self.status_code = 400
        
class RespuestaParametrosIncompletos(HttpResponse):
    def __init__(self):
        super(RespuestaParametrosIncompletos, self).__init__(simplejson.dumps({'error':400, 'msg':'Faltan parametros'}),'application/json')
        self.status_code = 400

class RespuestaNoExiste(HttpResponse):
    def __init__(self):
        super(RespuestaNoExiste, self).__init__(simplejson.dumps({'error':204, 'msg':'No existe'}),'application/json')
        self.status_code = 204
        
class RespuestaInesperado(HttpResponse):
    def __init__(self):
        super(RespuestaInesperado, self).__init__(simplejson.dumps({'error':500, 'msg':'Error inesperado'}),'application/json')
        self.status_code = 500        
