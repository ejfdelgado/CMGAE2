'''
Created on 5/03/2016

@author: Edgar
'''
import datetime
import os
import re

from google.appengine.ext import ndb


fechaAhora = datetime.datetime.now() - datetime.timedelta(hours=5)
DATETIME_NOW = fechaAhora.strftime("%Y, %m, %d, %H, %M, %S")
DATETIME_NOW_LAST = fechaAhora.strftime("%Y, %m, %d, 23, 59, 59")
DATETIME_NOW_FIRST = fechaAhora.strftime("%Y, %m, %d, 0, 0, 0")
DATE_NOW = fechaAhora.strftime("%Y, %m, %d")

def esProduccion():
    return os.getenv('SERVER_SOFTWARE', '').startswith('Google App Engine/')

def diferenciarIdDeQueryParam(ident):
    encontrado = re.search('^([^\?]*)(\?)?(.*)?$', ident)
    respuesta = {'identificador': ident, 'parametros': {}}
    if (not (encontrado is None)):
        respuesta['identificador'] = encontrado.group(1)
        pattern = re.compile(r'([^&=?]+)=([^&=?]+)')
        for (llave, valor) in re.findall(pattern, encontrado.group(3)):
            if (not llave in respuesta['parametros']):
                respuesta['parametros'][llave] = [valor]
            else:
                respuesta['parametros'][llave].append(valor)
    return respuesta

def llenarYpersistir(class_, nuevo, todo, leng):
    for key, value in todo.iteritems():
        renombrar = False
        attributo = getattr(class_, key, None)
        attributo2 = getattr(nuevo, key, None)
        if attributo != None and attributo.__class__ == ndb.model.DateTimeProperty:
            value = datetime.datetime.fromtimestamp(float(value))
        if attributo != None and attributo.__class__ == ndb.model.IntegerProperty:
            value = int(value)
        if issubclass(class_, ndb.Expando):
            if attributo != None and (attributo.__class__ == ndb.model.StringProperty or attributo.__class__ == ndb.model.TextProperty):
                #Si la clase tiene definido el campo
                renombrar = True
            else:
                if attributo2 != None:
                    #Si la instancia ya tiene el campo
                    if isinstance(attributo2, str) or isinstance(attributo2, unicode):
                        renombrar = True;
                else:
                    #Si la instancia no tiene el campo
                    if isinstance(value, str) or isinstance(value, unicode):
                        renombrar = True
        if renombrar and not leng == None:
            key=key+'_'+leng
        setattr(nuevo, key, value)
    nuevo.put()
    todo = to_dict(nuevo)
    return todo

def buscarGQL(objeto):
    
    busqueda = objeto['q']
    busqueda = busqueda.replace("__DATETIMENOW__", "DATETIME("+DATETIME_NOW+")")
    busqueda = busqueda.replace("__DATETIMENOWLAST__", "DATETIME("+DATETIME_NOW_LAST+")")
    busqueda = busqueda.replace("__DATETIMENOWFIRST__", "DATETIME("+DATETIME_NOW_FIRST+")")
    busqueda = busqueda.replace("__DATENOW__", "DATE("+DATE_NOW+")")
    
    temporal = ndb.gql(busqueda)#usar ndb.gql(busqueda, title="algo") 
    if (objeto.has_key('next') and len(objeto['next']) > 0):
        datos, next_cursor, more = temporal.fetch_page(objeto['n'] if objeto.has_key('n') else 100, start_cursor=ndb.query.Cursor(urlsafe=objeto['next']))
    else:
        datos, next_cursor, more = temporal.fetch_page(objeto['n'] if objeto.has_key('n') else 100)
    ans = {"datos": datos}
    if (more):
        ans['next'] = next_cursor.urlsafe()
    return ans

def buscarGQL2(objeto):
    busqueda = objeto['q']
    temporal = ndb.gql(busqueda, **objeto['argumentos'])
    if (objeto.has_key('next') and len(objeto['next']) > 0):
        datos, next_cursor, more = temporal.fetch_page(objeto['n'] if objeto.has_key('n') else 100, start_cursor=ndb.query.Cursor(urlsafe=objeto['next']))
    else:
        datos, next_cursor, more = temporal.fetch_page(objeto['n'] if objeto.has_key('n') else 100)
    ans = {"datos": datos}
    if (more):
        ans['next'] = next_cursor.urlsafe()
    return ans

def to_dict(model, propio=None):
    if model == None:
        return None
    if isinstance(model, list):
        output = []
        for valor in model:
            output.append(to_dict(valor, propio))
    else:
        if (propio == None):
            output = model.to_dict()
        else:
            output = getattr(model, propio)()
    return output

def siempreUtf8(a):
    return darUnicode(a).encode('utf-8')
def darUnicode(a):
    if isinstance(a, unicode):
        return a
    tipos = ['utf-8', 'ascii', 'utf-16', 'latin1', 'utf-32']
    for tipo in tipos:
        try:
            return a.decode(tipo)
        except:
            pass
    return None
def remplazar(a, b, c, autf8=False):
    #todo lo trabajamos en unicode
    a = darUnicode(a)
    b = darUnicode(b)
    c = darUnicode(c)
    if autf8:
        return a.replace(b, c).encode('utf-8')
    else:
        return a.replace(b, c)