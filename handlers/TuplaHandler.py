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
from models import ShortUrlM, Pagina, Tupla
from handlers.respuestas import RespuestaNoAutorizado, NoAutorizadoException,\
    ParametrosIncompletosException
from handlers.seguridad import inyectarUsuario, enRol, enRolFun
from handlers.decoradores import autoRespuestas
from handlers import comun

@ndb.transactional
def crearTuplas(idPagina, peticion):
    #Armo la llave padre
    paginaKey = ndb.Key(Pagina, idPagina)
    #Saco las llaves de la peticion
    llaves = []
    todas = []
    datosPayload = peticion['dat']
    for tupla in datosPayload:
        llaves.append(tupla)
        todas.append(tupla)
    
    temporal = ndb.gql('SELECT * FROM Tupla WHERE i = :1 and k IN :2 and ANCESTOR IS :3', idPagina, llaves, paginaKey).order(Tupla._key)
    datos, next_cursor, more = temporal.fetch_page(len(llaves))
    
    amodificar = []
    
    #Modifico los que existen
    for existente in datos:
        llaves.remove(existente.k)
        if (existente.v != datosPayload[existente.k]):
            if datosPayload[existente.k] is None:
                existente.v = None
            else:
                existente.v = comun.siempreUtf8(datosPayload[existente.k])
            amodificar.append(existente)
        
    #Itero los que toca crear...
    for llave in llaves:
        if (datosPayload[llave] is None):
            unatupla = Tupla(i=idPagina, k=llave, v=None, parent=paginaKey)
        else:
            unatupla = Tupla(i=idPagina, k=llave, v=comun.siempreUtf8(datosPayload[llave]), parent=paginaKey)
        amodificar.append(unatupla)
            
    if (len(amodificar) > 0):
        ndb.put_multi(amodificar)
    return len(amodificar)

@ndb.transactional
def borrarTuplas(idPagina, llaves):
    #Armo la llave padre
    paginaKey = ndb.Key(Pagina, idPagina)
    temporal = ndb.gql('SELECT * FROM Tupla WHERE i = :1 and k IN :2 and ANCESTOR IS :3', idPagina, llaves, paginaKey).order(Tupla._key)
    datos, next_cursor, more = temporal.fetch_page(len(llaves))
    
    llavesBorrar = []
    #tomo las llaves
    for dato in datos:
        llavesBorrar.append(dato.key)
    if (len(llavesBorrar) > 0):
        ndb.delete_multi(llavesBorrar)
    return len(llavesBorrar)

@inyectarUsuario
@autoRespuestas
def TuplaHandler(request, ident, usuario=None):
    
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        idPagina = request.GET.get('pg', None)
        if (ident == 'all'):
            if (idPagina is None):
                raise ParametrosIncompletosException()
            paginaKey = ndb.Key(Pagina, idPagina)
            sqltext = 'SELECT * FROM Tupla WHERE i = :page and ANCESTOR IS :padre'
            temporal = ndb.gql(sqltext, **{'page': idPagina, 'padre': paginaKey})
            siguiente = request.GET.get('next', None)
            n = comun.leerNumero(request.GET.get('n', 100))
            if (siguiente is not None):
                datos, next_cursor, more = temporal.fetch_page(n, start_cursor=ndb.query.Cursor(urlsafe=siguiente))
            else:
                datos, next_cursor, more = temporal.fetch_page(n)
            ans['ans'] = comun.to_dict(datos, None, True, ['id', 'i'])
            if (more):
                ans['next'] = next_cursor.urlsafe()
        response.write(simplejson.dumps(ans))
        return response
    elif request.method == 'POST':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        
        peticion = simplejson.loads(request.raw_post_data)
        if (not 'dat' in peticion):
            raise ParametrosIncompletosException()
        
        if (peticion['acc'] == '+'):
            #Se asume una lista de tuplas [{"a.b.c.v": "ass"}]
            ans['n'] = crearTuplas(ident, peticion)
        elif (peticion['acc'] == '-'):
            llaves = peticion['dat']
            ans['n'] = borrarTuplas(ident, llaves)
        
        response.write(simplejson.dumps(ans))
        return response