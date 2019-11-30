'''
Created on 29/11/2019

@author: Edgar
'''
import logging

from django.utils import simplejson
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
    
    
#
def publicar(usr, path, pg, objeto):
    rutaFirebase = 'https://proyeccion-colombia1.firebaseio.com/pgs/'+usr+path+'/'+pg+'/pubsub/sync'
    creacion = firebase_post(rutaFirebase+'.json', simplejson.dumps(simplejson.dumps(objeto)))
    firebase_delete(rutaFirebase+'/'+creacion['name']+'.json')