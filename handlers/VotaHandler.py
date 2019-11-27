# coding: utf-8
'''
Created on 26/11/2019

@author: Edgar
'''
import random
import logging
from django.http import HttpResponse
from google.appengine.api import memcache
from django.utils import simplejson
from google.appengine.ext import ndb
from models import ShortUrlM, Opinion, Contador, Pagina
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    ParametrosIncompletosException, NoExisteException, NoHayUsuarioException,\
    MalaPeticionException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun
from django.http import HttpResponseRedirect
from handlers.TuplaHandler import buscarTuplas, to_dict_simple, crearTuplas
import httplib2
from oauth2client.client import GoogleCredentials

_FIREBASE_SCOPES = [
    'https://www.googleapis.com/auth/firebase.database',
    'https://www.googleapis.com/auth/userinfo.email']

#https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/appengine/standard/firebase/firetactoe/rest_api.py
def _get_http():
    """Provides an authed http object."""
    http = httplib2.Http()
    # Use application default credentials to make the Firebase calls
    # https://firebase.google.com/docs/reference/rest/database/user-auth
    creds = GoogleCredentials.get_application_default().create_scoped(
        _FIREBASE_SCOPES)
    creds.authorize(http)
    return http

def firebase_post(path, value=None):
    """Add an object to an existing list of data.
    An HTTP POST allows an object to be added to an existing list of data.
    A successful request will be indicated by a 200 OK HTTP status code. The
    response content will contain a new attribute "name" which is the key for
    the child added.
    Args:
        path - the url to the Firebase list to append to.
        value - a json string.
    """
    response, content = _get_http().request(path, method='POST', body=value)
    return simplejson.loads(content)

def firebase_put(path, value=None):
    """Writes data to Firebase.

    An HTTP PUT writes an entire object at the given database path. Updates to
    fields cannot be performed without overwriting the entire object

    Args:
        path - the url to the Firebase object to write.
        value - a json string.
    """
    response, content = _get_http().request(path, method='PUT', body=value)
    return simplejson.loads(content)

def firebase_delete(path):
    """Removes the data at a particular path.
    An HTTP DELETE removes the data at a particular path.  A successful request
    will be indicated by a 200 OK HTTP status code with a response containing
    JSON null.
    Args:
        path - the url to the Firebase object to delete.
    """
    response, content = _get_http().request(path, method='DELETE')
    logging.info(response)
    logging.info(content)

@inyectarUsuario
@autoRespuestas
def VotaHandler(request, ident, usuario=None):
    if request.method == 'GET':
        usr = request.GET.get('u', None)
        pg = request.GET.get('pg', None)
        vot = request.GET.get('v', None)
        if (usr is None or pg is None or vot is None):
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
        
        rutaFirebase = 'https://proyeccion-colombia1.firebaseio.com/pgs/'+unapagina.usr+unapagina.path+'/'+pg+'/pubsub/sync'
        
        creacion = firebase_post(rutaFirebase+'.json', simplejson.dumps(simplejson.dumps(payloadModificacion)))
        firebase_delete(rutaFirebase+'/'+creacion['name']+'.json')
        
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        ans['msg'] = datos2[rutaVotacion+'.pregunta']+' '+datos['per.'+usr+'.humId']+' vota por "'+datos2[rutaVotacion+'.opciones.'+vot+'.txt']+'"'
        #ans['msg1'] = datos
        #ans['msg2'] = datos2
        #ans['creacion'] = creacion

        response.write(simplejson.dumps(ans))
        return response
    