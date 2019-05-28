# coding: utf-8
from handlers.respuestas import *
import sys
import traceback

#Anotación que hace manejo de errores
def autoRespuestas(funcion):
    def decorador(*args, **kwargs):
        try:
            return funcion(*args, **kwargs)
        except NoAutorizadoException:
            return RespuestaNoAutorizado()
        except ParametrosIncompletosException:
            return RespuestaParametrosIncompletos()
        except NoExisteException:
            return RespuestaNoExiste()
        except NoHayUsuarioException:
            return RespuestaNoHayUsuario()
        except MalaPeticionException:
            return RespuestaMalaPeticion()
        except Exception, e:
            response = HttpResponse("", content_type='application/json')
            exc_type, exc_value, exc_traceback = sys.exc_info()
            response.status_code = 500
            response.write(simplejson.dumps({'error':1, 'msg': 'Error de servidor: '+repr(traceback.format_tb(exc_traceback))+'->'+str(e)}))
            return response
    return decorador