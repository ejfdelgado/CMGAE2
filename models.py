'''
Created on 20/01/2016

@author: Edgar
'''
import datetime
import time

from google.appengine.ext import ndb

def to_dict_(entidad, puntos=False, ignorar=[]):
    ans = {}
    for key in entidad._properties.keys():
        if (key in ignorar):
            continue
        val = getattr(entidad, key)
        if (puntos):
            key2 = key.replace('/', '.')
        else:
            key2 = key
        if val != None and val.__class__ == datetime.datetime:
            ans[key2] = time.mktime(val.timetuple())
        else:
            ans[key2] = val
    if (not ('id' in ignorar)):
        ans['id'] = entidad.key.id()
    return ans
    
class Pagina(ndb.Expando):
    date = ndb.DateTimeProperty(auto_now_add=True)
    act = ndb.DateTimeProperty(auto_now=True)
    usr = ndb.StringProperty()
    path = ndb.StringProperty()
    pwd = ndb.StringProperty()
    
    tit = ndb.StringProperty()
    desc = ndb.StringProperty()
    img = ndb.StringProperty()
    
    kw = ndb.StringProperty()
    aut = ndb.StringProperty()
    
    def to_dict(self, puntos, ignorar=[]):
        return to_dict_(self, puntos, ignorar)

class Configuracion(ndb.Expando):
    _default_indexed = False
    def to_dict(self, puntos, ignorar=[]):
        return to_dict_(self, puntos, ignorar)
    
class ShortUrlM(ndb.Model):
    theurl = ndb.StringProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)
    
    def to_dict(self, puntos, ignorar=[]):
        return to_dict_(self, puntos, ignorar)

class Opinion(ndb.Model):
    usr = ndb.StringProperty()
    tip = ndb.StringProperty()
    modif = ndb.DateTimeProperty(auto_now=True)
    
    v0 = ndb.StringProperty()
    v1 = ndb.StringProperty()
    v2 = ndb.StringProperty()
    v3 = ndb.StringProperty()
    v4 = ndb.StringProperty()
    
    
    def to_dict(self, puntos, ignorar=[]):
        return to_dict_(self, puntos, ignorar)

class Contador(ndb.Expando):
    tip = ndb.StringProperty()
    sub = ndb.IntegerProperty()
    n = ndb.IntegerProperty()
    
    v0 = ndb.StringProperty()
    v1 = ndb.StringProperty()
    v2 = ndb.StringProperty()
    v3 = ndb.StringProperty()
    v4 = ndb.StringProperty()
    
    def to_dict(self, puntos, ignorar=[]):
        return to_dict_(self, puntos, ignorar)
    
    
class Tupla(ndb.Model):
    #idPagina/path
    i = ndb.StringProperty()
    #key, llave. Incluye el id de usuarios especificos despues de u.
    k = ndb.StringProperty()
    #valor
    v = ndb.StringProperty()
    #dominio
    d = ndb.StringProperty()
    #subdominio
    sd = ndb.StringProperty()
    
    def to_dict(self, puntos, ignorar=[]):
        return to_dict_(self, puntos, ignorar)
    
