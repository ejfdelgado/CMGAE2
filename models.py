'''
Created on 20/01/2016

@author: Edgar
'''
import datetime
import time

from google.appengine.ext import ndb

def to_dict_(entidad, puntos=False):
    ans = {}
    for key in entidad._properties.keys():
        val = getattr(entidad, key)
        if (puntos):
            key2 = key.replace('/', '.')
        else:
            key2 = key
        if val != None and val.__class__ == datetime.datetime:
            ans[key2] = time.mktime(val.timetuple())
        else:
            ans[key2] = val
        
    ans['id'] = entidad.key.id()
    return ans

class Documento(ndb.Expando):
    _default_indexed = False
    def to_dict(self):
        return to_dict_(self)
    
class Pagina(ndb.Expando):
    date = ndb.DateTimeProperty(auto_now_add=True)
    usr = ndb.StringProperty()
    path = ndb.StringProperty()
    
    tit = ndb.StringProperty()
    desc = ndb.StringProperty()
    img = ndb.StringProperty()
    
    def to_dict(self, puntos):
        return to_dict_(self, puntos)

class Caracteristica(ndb.Expando):
    _default_indexed = False
    date = ndb.DateTimeProperty(auto_now_add=True)
    modif = ndb.DateTimeProperty(auto_now=True)
    
    def to_dict(self):
        return to_dict_(self)

class Configuracion(ndb.Expando):
    _default_indexed = False
    def to_dict(self):
        return to_dict_(self)
    
class ShortUrlM(ndb.Model):
    theurl = ndb.StringProperty()
    def to_dict(self):
        return to_dict_(self)
