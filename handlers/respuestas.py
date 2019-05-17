'''
Created on 12/12/2017

@author: Edgar
'''

from django.http import HttpResponse
from django.utils import simplejson


class NoAutorizadoException(Exception):
    pass

class ParametrosIncompletosException(Exception):
    pass

class NoExisteException(Exception):
    pass

class RespuestaNoAutorizado(HttpResponse):
    def __init__(self):
        super(RespuestaNoAutorizado, self).__init__(simplejson.dumps({'error':403, 'msg':'No tiene permisos'}),'application/json')
        self.status_code = 403
        
class RespuestaParametrosIncompletos(HttpResponse):
    def __init__(self):
        super(RespuestaParametrosIncompletos, self).__init__(simplejson.dumps({'error':400, 'msg':'Faltan parametros'}),'application/json')
        self.status_code = 400

class RespuestaNoExiste(HttpResponse):
    def __init__(self):
        super(RespuestaNoExiste, self).__init__(simplejson.dumps({'error':204, 'msg':'No existe'}),'application/json')
        self.status_code = 204
