# coding: utf-8
'''
Created on 10/06/2019

@author: Edgar
'''
import random
import logging
from django.http import HttpResponse
from google.appengine.api import memcache
from django.utils import simplejson
from google.appengine.ext import ndb
from models import ShortUrlM, Opinion, Contador
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    ParametrosIncompletosException, NoExisteException, NoHayUsuarioException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun
from django.http import HttpResponseRedirect

MAX_ATTRS_OPINION = 5

def escribirContador(idPagina, mapa, suma):
    params = {'page': idPagina, 'sub': random.randint(0,MAX_ATTRS_OPINION)}
    #Lo busco, si no existe lo creo
    consulta = 'SELECT * FROM Contador WHERE page = :page AND sub = :sub '
    for indice in range(MAX_ATTRS_OPINION):
        llave = 'v'+str(indice)
        consulta = consulta+' AND '+llave+ ' = :'+llave
        params[llave] = mapa[llave]
    temporal = ndb.gql(consulta, **params)
    datos, next_cursor, more = temporal.fetch_page(1)
    if (len(datos) > 0):
        micontador = datos[0]
        comun.llenarYpersistir(Contador, micontador, {'n': micontador.n+suma})
    else:
        params['n'] = suma
        micontador = Contador(**params)
        micontador.put()
    return micontador

#@ndb.transactional
def borrarOpinion(idPagina, usuario):
    if (usuario is None):
        raise NoHayUsuarioException()
    #Debo buscar la opinion asociada al id de la pagina actual
    temporal = ndb.gql('SELECT * FROM Opinion WHERE usr = :1 AND page = :2', usuario.uid, idPagina)
    datos, next_cursor, more = temporal.fetch_page(1)
    if (len(datos) > 0):
        modelo = datos[0]
        if (modelo.usr != usuario.uid):
            raise NoAutorizadoException()
        else:
            vieja = comun.to_dict(modelo)
            modelo.key.delete()
            #Debo disminuir el contador de esa opinion vieja
            modificado = escribirContador(idPagina, vieja, -1)

#@ndb.transactional(xg=True)
def opinarLocal(idPagina, usuario, peticion):
    #Busca la opinion y la modifica o la crea
    temporal = ndb.gql('SELECT * FROM Opinion WHERE usr = :1 AND page = :2', usuario.uid, idPagina)
    datos, next_cursor, more = temporal.fetch_page(1)
    miopinion = None
    lista = peticion['v']
    valores = {}
    for indice in range(MAX_ATTRS_OPINION):
        llave = 'v'+str(indice)
        if (indice < len(lista)):
            valores[llave] = lista[indice]
        else:
            valores[llave] = None
    if (len(datos) > 0):
        miopinion = datos[0]
        vieja = comun.to_dict(miopinion)
        comun.llenarYpersistir(Opinion, miopinion, valores)
        #Si la opinion ha cambiado o es nueva
        haCambiado = False
        for indice in range(MAX_ATTRS_OPINION):
            llave = 'v'+str(indice)
            if (vieja[llave] != valores[llave]):
                haCambiado = True
                break
        if (haCambiado):
            #Debo disminuir el contador de esa opinion vieja
            contDec = escribirContador(idPagina, vieja, -1)
            #ans['dec'] = comun.to_dict(contDec)
            #Debo incrementar el contador de la nueva opinion valores
            contInc = escribirContador(idPagina, valores, 1)
            #ans['inc'] = comun.to_dict(contInc)
    else:
        #La debe crear
        miopinion = Opinion(usr=usuario.uid, page=idPagina, **valores)
        miopinion.put()
        contInc = escribirContador(idPagina, valores, 1)

@inyectarUsuario
@autoRespuestas
def ContHandler(request, ident, usuario=None):
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)       
        ans = {}
        ans['error'] = 0
        #Busco la opinion del usuario logeado y de la pagina actual
        idPagina = comun.leerNumero(request.GET.get('pg', None))
        if (ident == 'per'):
            temporal = ndb.gql('SELECT * FROM Opinion WHERE usr = :1 AND page = :2', usuario.uid, idPagina)
            datos, next_cursor, more = temporal.fetch_page(1)
            if (len(datos) > 0):
                ans['ans'] = comun.to_dict(datos[0])
            else:
                ans['ans'] = None
        elif (ident == 'pub'):
            #Paginar la consulta de todos los contadores de una pagina
            if (idPagina is None):
                raise ParametrosIncompletosException()
            sqltext = 'SELECT * FROM Contador WHERE page = :page'
            temporal = ndb.gql(sqltext, **{'page': idPagina})
            siguiente = request.GET.get('next', None)
            n = comun.leerNumero(request.GET.get('n', 10))
            if (siguiente is not None):
                datos, next_cursor, more = temporal.fetch_page(n, start_cursor=ndb.query.Cursor(urlsafe=siguiente))
            else:
                datos, next_cursor, more = temporal.fetch_page(n)
            ans['ans'] = comun.to_dict(datos, None, True)
            if (more):
                ans['next'] = next_cursor.urlsafe()
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'POST':
        response = HttpResponse("", content_type='application/json', status=200)     
        ans = {}
        ans['error'] = 0
        
        peticion = simplejson.loads(request.raw_post_data)
        idPagina = comun.leerNumero(ident)
        
        if (usuario is None):
            raise NoAutorizadoException()
        
        opinarLocal(idPagina, usuario, peticion)
        
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'DELETE':
        response = HttpResponse("", content_type='application/json', status=200)
        idPagina = comun.leerNumero(ident)
        ans = {}
        ans['error'] = 0
        if (idPagina is not None):
            ans['dec'] = borrarOpinion(idPagina, usuario)
        else:
            raise ParametrosIncompletosException()
        response.write(simplejson.dumps(ans))
        return response
        
    