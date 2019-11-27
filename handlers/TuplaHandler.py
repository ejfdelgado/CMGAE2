# coding: utf-8
'''
Created on 10/06/2019

@author: Edgar
'''
import re
import time
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
    
    lpatr = []
    if ('patr' in peticion and type(peticion['patr']) == list):
        for unpatron in peticion['patr']:
            lpatr.append(re.compile(unpatron))
    
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
            
    #Se asigna dominio y subdominio
    for unatupla in amodificar:
        dominio = ''
        subdominio = None
        for patron in lpatr:
            matches = patron.match(unatupla.k)
            if matches is not None:
                grupos = matches.groups()
                tamanio = len(grupos)
                if (tamanio>=1):
                    dominio = grupos[0]
                    if (tamanio>=2):
                        subdominio = grupos[1]
                break
        unatupla.d = dominio
        unatupla.sd = subdominio
                
        ndb.put_multi(amodificar)
    return len(amodificar)

@ndb.transactional
def borrarTuplas(idPagina, llaves):
    datos = buscarTuplas(idPagina, llaves)
    
    llavesBorrar = []
    #tomo las llaves
    for dato in datos:
        llavesBorrar.append(dato.key)
    if (len(llavesBorrar) > 0):
        ndb.delete_multi(llavesBorrar)
    return len(llavesBorrar)

@ndb.transactional
def borrarTuplasTodas(idPagina, n):
    #Armo la llave padre
    paginaKey = ndb.Key(Pagina, idPagina)
    temporal = ndb.gql('SELECT * FROM Tupla WHERE i = :1 and ANCESTOR IS :2', idPagina, paginaKey).order(Tupla._key)
    datos, next_cursor, more = temporal.fetch_page(n)
    
    llavesBorrar = []
    #tomo las llaves
    for dato in datos:
        llavesBorrar.append(dato.key)
    if (len(llavesBorrar) > 0):
        ndb.delete_multi(llavesBorrar)
    return len(llavesBorrar)

def buscarTuplas(idPagina, llaves):
    #Armo la llave padre
    paginaKey = ndb.Key(Pagina, idPagina)
    temporal = ndb.gql('SELECT * FROM Tupla WHERE i = :1 and k IN :2 and ANCESTOR IS :3', idPagina, llaves, paginaKey).order(Tupla._key)
    datos, next_cursor, more = temporal.fetch_page(len(llaves))
    return datos

def to_dict_simple(model, propio=None, puntos=False, ignorar=[]):
    temp = comun.to_dict(model, propio, puntos, ignorar)
    ans = {}
    for a in temp:
        try:
            ans[a['k']] = simplejson.loads(a['v'])
        except:
            ans[a['k']] = None
    return ans

@inyectarUsuario
@autoRespuestas
def TuplaHandler(request, ident, usuario=None):
    
    if request.method == 'GET':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        if (ident == 'all'):
            
            idPagina = request.GET.get('pg', None)
            dom = request.GET.get('dom', None)
            sdom = request.GET.get('sdom', None)
            siguiente = request.GET.get('next', None)
            n = comun.leerNumero(request.GET.get('n', 100))
            
            if (idPagina is None):
                raise ParametrosIncompletosException()
            paginaKey = ndb.Key(Pagina, idPagina)
            sqltext = 'SELECT * FROM Tupla WHERE i = :page and ANCESTOR IS :padre'
            parametros = {'page': idPagina, 'padre': paginaKey}
            if dom is not None:
                sqltext = sqltext + ' and d = :dom'
                parametros['dom'] = dom
            if sdom is not None:
                sqltext = sqltext + ' and sd = :sdom'
                parametros['sdom'] = sdom
            temporal = ndb.gql(sqltext, **parametros)
            if (siguiente is not None):
                datos, next_cursor, more = temporal.fetch_page(n, start_cursor=ndb.query.Cursor(urlsafe=siguiente))
            else:
                datos, next_cursor, more = temporal.fetch_page(n)
            ans['ans'] = comun.to_dict(datos, None, True, ['id', 'i', 'd', 'sd'])
            if (more):
                ans['next'] = next_cursor.urlsafe()
        elif (ident == 'fecha'):
            ans['unixtime'] = int(1000*time.time())
        elif (ident == 'next'):
            
            idPagina = request.GET.get('pg', None)
            dom = request.GET.get('dom', None)
            sdom = request.GET.get('sdom', None)
            
            if (idPagina is None or dom is None):
                raise ParametrosIncompletosException()
            paginaKey = ndb.Key(Pagina, idPagina)
            sqltext = 'SELECT * FROM Tupla WHERE i = :page and ANCESTOR IS :padre and d = :dom'
            parametros = {'page': idPagina, 'padre': paginaKey, 'dom': dom}
            if sdom is not None:
                sqltext = sqltext + ' and sd < :sdom'
                parametros['sdom'] = sdom
            sqltext = sqltext + ' ORDER BY sd DESC'
            temporal = ndb.gql(sqltext, **parametros)
            datos, next_cursor, more = temporal.fetch_page(1)
            ans['sql'] = sqltext
            if (len(datos) > 0):
                ans['ans'] = datos[0].sd
            else:
                ans['ans'] = None
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
    elif request.method == 'DELETE':
        response = HttpResponse("", content_type='application/json', status=200)
        ans = {}
        ans['error'] = 0
        idPagina = comun.leerNumero(ident)
        n = comun.leerNumero(request.GET.get('n', 100))
        if (idPagina is not None):
            ans['n'] = borrarTuplasTodas(ident, n)
        else:
            raise ParametrosIncompletosException()
        response.write(simplejson.dumps(ans))
        return response
