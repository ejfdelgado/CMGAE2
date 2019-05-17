'''
Created on 20/01/2016

@author: Edgar
'''
import datetime
import time

from google.appengine.ext import ndb


def to_dict_(entidad):
    ans = {}
    for key in entidad._properties.keys():
        val = getattr(entidad, key)
        if val != None and val.__class__ == datetime.datetime:
            ans[key] = time.mktime(val.timetuple())
        else:
            ans[key] = val
        
    ans['id'] = entidad.key.id()
    return ans

class Documento(ndb.Expando):
    _default_indexed = False
    def to_dict(self):
        return to_dict_(self)

class lista(ndb.Expando):
    _default_indexed = False
    def to_dict(self):
        return to_dict_(self)

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
