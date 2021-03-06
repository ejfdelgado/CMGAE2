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
from models import ShortUrlM, Opinion, Contador, Pagina
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    ParametrosIncompletosException, NoExisteException, NoHayUsuarioException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun
from django.http import HttpResponseRedirect


MAX_ATTRS_OPINION = 5

def escribirContador(idPagina, mapa, suma, tip, maxContadores):
    paginaKey = ndb.Key(Pagina, idPagina)
    params = {'tip': tip, 'sub': random.randint(0, maxContadores), 'parent': paginaKey}
    #Lo busco, si no existe lo creo
    consulta = 'SELECT * FROM Contador WHERE tip = :tip AND sub = :sub and ANCESTOR IS :parent'
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

@ndb.transactional
def borrarOpinion(idPagina, usuario, tip, maxContadores):
    if (usuario is None):
        raise NoHayUsuarioException()
    #Debo buscar la opinion asociada al id de la pagina actual
    paginaKey = ndb.Key(Pagina, idPagina)
    temporal = ndb.gql('SELECT * FROM Opinion WHERE usr = :1 AND tip = :2 and ANCESTOR IS :3', usuario.uid, tip, paginaKey)
    datos, next_cursor, more = temporal.fetch_page(1)
    if (len(datos) > 0):
        modelo = datos[0]
        if (modelo.usr != usuario.uid):
            raise NoAutorizadoException()
        else:
            vieja = comun.to_dict(modelo)
            modelo.key.delete()
            #Debo disminuir el contador de esa opinion vieja
            modificado = escribirContador(idPagina, vieja, -1, tip, maxContadores)

@ndb.transactional
def opinarLocal(idPagina, usuario, peticion, maxContadores):
    #Busca la opinion y la modifica o la crea
    paginaKey = ndb.Key(Pagina, idPagina)
    temporal = ndb.gql('SELECT * FROM Opinion WHERE usr = :1 AND tip = :2 and ANCESTOR IS :3', usuario.uid, peticion['tip'], paginaKey)
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
            contDec = escribirContador(idPagina, vieja, -1, peticion['tip'], maxContadores)
            #ans['dec'] = comun.to_dict(contDec)
            #Debo incrementar el contador de la nueva opinion valores
            contInc = escribirContador(idPagina, valores, 1, peticion['tip'], maxContadores)
            #ans['inc'] = comun.to_dict(contInc)
    else:
        #La debe crear
        miopinion = Opinion(usr=usuario.uid, tip=peticion['tip'], parent=paginaKey, **valores)
        miopinion.put()
        contInc = escribirContador(idPagina, valores, 1, peticion['tip'], maxContadores)

@inyectarUsuario
@autoRespuestas
def ContHandler(request, ident, usuario=None):
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        #Busco la opinion del usuario logeado y de la pagina actual
        idPagina = comun.leerNumero(request.GET.get('pg', None))
        tip = request.GET.get('tip', None)
        paginaKey = ndb.Key(Pagina, idPagina)
        if (ident == 'per'):
            temporal = ndb.gql('SELECT * FROM Opinion WHERE usr = :1 AND tip = :2 and ANCESTOR IS :3', usuario.uid, tip, paginaKey)
            datos, next_cursor, more = temporal.fetch_page(1)
            if (len(datos) > 0):
                ans['ans'] = comun.to_dict(datos[0])
            else:
                ans['ans'] = None
        elif (ident == 'pub'):
            #Paginar la consulta de todos los contadores de una pagina
            if (idPagina is None):
                raise ParametrosIncompletosException()
            sqltext = 'SELECT * FROM Contador WHERE tip = :tip and ANCESTOR IS :padre'
            temporal = ndb.gql(sqltext, **{'tip': tip, 'padre': paginaKey})
            siguiente = request.GET.get('next', None)
            n = comun.leerNumero(request.GET.get('n', 100))
            if (siguiente is not None):
                datos, next_cursor, more = temporal.fetch_page(n, start_cursor=ndb.query.Cursor(urlsafe=siguiente))
            else:
                datos, next_cursor, more = temporal.fetch_page(n)
            ans['ans'] = comun.to_dict(datos)
            if (more):
                ans['next'] = next_cursor.urlsafe()
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'POST':
        response = HttpResponse("", content_type='application/json', status=200)     
        ans = {}
        ans['error'] = 0
        
        maxContadores = comun.leerNumero(request.GET.get('max', 5))
        peticion = simplejson.loads(request.raw_post_data)
        idPagina = comun.leerNumero(ident)
        
        if (usuario is None):
            raise NoAutorizadoException()
        
        opinarLocal(idPagina, usuario, peticion, maxContadores)
        
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'DELETE':
        response = HttpResponse("", content_type='application/json', status=200)
        idPagina = comun.leerNumero(ident)
        tip = comun.leerNumero(request.GET.get('tip', None))
        maxContadores = comun.leerNumero(request.GET.get('max', 5))
        ans = {}
        ans['error'] = 0
        if (idPagina is not None):
            ans['dec'] = borrarOpinion(idPagina, usuario, tip, maxContadores)
        else:
            raise ParametrosIncompletosException()
        response.write(simplejson.dumps(ans))
        return response
        
    