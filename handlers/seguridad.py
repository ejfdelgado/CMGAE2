# coding: utf-8
'''
Created on 22/04/2018

@author: Edgar
'''
import logging
from django.http import HttpResponse
from google.appengine.api import users
import os
from google.appengine.api import app_identity
from google.appengine.api.app_identity import get_application_id
from handlers.respuestas import NoAutorizadoException, NoHayUsuarioException,\
    RespuestaNoHayUsuario, RespuestaNoAutorizado
from handlers import comun

class Usuario:
    
    def __init__(self, request):
        self.id_token = _get_token(request)
        self.roles = []
        self.metadatos = None
        if (self.id_token is not None):
            try:
                self.metadatos = verify_firebase_token(self.id_token, get_application_id())
                #TODO mirar cómo cargar los permisos de un usuario
                self.roles = ['editor']
                self.miId = self.darId();
                
                if (comun.indexOf([
                                   'google.com/edgar.jose.fernando.delgado@gmail.com'
                                   ], self.miId) >= 0):
                    self.roles.append('admin')
            except:
                pass
    
    def darId(self):
        respuesta = None
        if (self.metadatos is not None):
            contenedor = self.metadatos['payload']['firebase']
            identidades = contenedor['identities']
            respuesta = contenedor['sign_in_provider']+'/'
            if (identidades.has_key('email')):
                respuesta+=identidades['email'][0]
            elif (identidades.has_key('phone')):
                respuesta+=identidades['phone'][0]
        return respuesta
        
    def darUsername(self):
        respuesta = None
        if (self.metadatos is not None):
            contenedor = self.metadatos['payload']['firebase']
            identidades = contenedor['identities']
            respuesta = {'dominio': contenedor['sign_in_provider']}
            if (identidades.has_key('email')):
                respuesta['usuario'] = identidades['email'][0]
            elif (identidades.has_key('phone')):
                respuesta['usuario'] = identidades['phone'][0]
        return respuesta
    
    def darURLStorage(self, completa=False):
        identificacion = self.miId
        ans = None
        if (identificacion is not None):
            ans = '/usr/'+identificacion
            if (completa):
                ans = darRaizStorageSeg()+ans
        return ans

    def esDuenioDeUrl(self, rutaStorage):
        if (rutaStorage is None):
            return True
        opc1 = self.darURLStorage(False)
        opc2 = self.darURLStorage(True)
        return (rutaStorage.startswith(opc1) or rutaStorage.startswith(opc2))

    def enRol(self, roles):
        return not set(roles).isdisjoint(self.roles) 

def darRaizStorageSeg():
    res = '/'+app_identity.get_default_gcs_bucket_name()
    return res

#Anotación que inyecta el usuario
def inyectarUsuario(funcion):
    def decorador(*args, **kwargs):
        kwargs['usuario'] = Usuario(args[0]) 
        return funcion(*args, **kwargs)
    return decorador

def enRol(roles):
    def enRolImpl(funcion):
        def decorador(*args, **kwargs):
            usuario = kwargs['usuario']
            try:
                enRolFun(usuario, roles)
                return funcion(*args, **kwargs)
            except NoHayUsuarioException:
                return RespuestaNoHayUsuario()
            except NoAutorizadoException:
                return RespuestaNoAutorizado()
            except:
                return HttpResponse(status=401)
        return decorador
    return enRolImpl

#, rutaStorage=None
#elif (rutaStorage is None or not usuario.esDuenioDeUrl(rutaStorage) and )
def enRolFun(usuario, roles=[]):
    #logging.info('rutaStorage:')
    #logging.info(rutaStorage)
    if (len(roles) == 0):
        return True
    if (usuario is None):
        raise NoHayUsuarioException()
    else:
        if (usuario.enRol(['admin'])):
            #Lo deja pasar siempre al admin
            return True
        elif (not usuario.enRol(roles)):
            raise NoAutorizadoException()
    return True

def base64url_decode(s):
    """ Decode base64 encoded strings with stripped trailing '=' """
    import base64
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))

def unpack_jwt_token(token):
    """ Splits and decodes a JWT into a header, payload and signature. """
    import json
    encoded_header, encoded_payload, encoded_signature = token.split('.')
    
    header = json.loads(base64url_decode(encoded_header))
    payload = json.loads(base64url_decode(encoded_payload))
    signature = base64url_decode(encoded_signature)
    
    return header, payload, signature

def get_google_certificate(key_id):
    """ Get Google Service Account certificate for specific key ID. """
    import httplib
    import json
    c = httplib.HTTPSConnection("www.googleapis.com")
    c.request("GET", "/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
    response = c.getresponse()

    cert_str = response.read()
    cert_obj = json.loads(cert_str)
    cert = cert_obj.get(key_id)

    return cert

def verify_signature_rs256(token, cert):
    """ Verifies an RS256 token using a public-key PEM certificate. """
    from binascii import a2b_base64
    from Crypto.Hash import SHA256 
    from Crypto.PublicKey import RSA
    from Crypto.Signature import PKCS1_v1_5 
    from Crypto.Util.asn1 import DerSequence

    # Split token into message and signature sections.
    message, signature = token.rsplit('.', 1)
    
    # Convert from PEM to DER.
    pem = cert
    lines = pem.replace(" ",'').split()
    der = a2b_base64(''.join(lines[1:-1]))

    # Extract subjectPublicKeyInfo field from X.509 certificate (see RFC3280).
    cert = DerSequence()
    cert.decode(der)
    tbsCertificate = DerSequence()
    tbsCertificate.decode(cert[0])
    subjectPublicKeyInfo = tbsCertificate[6]

    # Initialize RSA key.
    rsakey = RSA.importKey(subjectPublicKeyInfo)

    # Verify signature
    signer = PKCS1_v1_5.new(rsakey)
    digest = SHA256.new(message)

    # Assumes the data is base64 encoded to begin with
    return signer.verify(digest, base64url_decode(signature)) is True

class TokenException(Exception):
    """ Exceptions relating to token validation. """
    pass

def verify_firebase_token(token, firebase_project_id):
    # From: http://stackoverflow.com/a/37492640
    # If you'd like to verify client ID tokens without using the official Firebase
    # Node.js or Java libraries (which have built-in verification methods), you
    # will need to ensure the ID token (which is a JWT) conforms to the following:
    import datetime
    
    # Split token into header, payload, and signature sections.
    header, payload, signature = unpack_jwt_token(token)
    
    # Its decoded header has an alg (algorithm) claim equal to "RS256".
    if header['alg'] != 'RS256':
        raise TokenException("Token must use algorithm 'RS256'.")

    # Its decoded payload has an aud (audience) claim equal to your Firebase project ID.
    if payload['aud'] != firebase_project_id:
        raise TokenException("Token audience did not match project ID.")

    # Its decoded payload has an iss (issuer) claim equal to "https://securetoken.google.com/<projectId>".
    if payload['iss'] != 'https://securetoken.google.com/' + firebase_project_id:
        raise TokenException("Token issuer did not match Google Secure Token URL For project ID.")

    # Its decoded payload has a non-empty string sub (subject) claim. Note that this is the uid for that Firebase user.
    if not payload['sub']:
        raise TokenException("Token had empty subject claim.")

    # Its decoded header has a kid (key ID) claim that corresponds to one of the public keys listed at https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com.
    try:
        cert = get_google_certificate(header['kid'])    
    except KeyError:
        raise TokenException("Token Key ID did not match any known Google Service Account public keys.")

    # Check that token is not expired.
    expiration_time = datetime.datetime.utcfromtimestamp(int(payload['exp']))
    if (expiration_time <= datetime.datetime.utcnow()):
        raise TokenException("Token is already expired.")
    
    # Use a JWT library to verify the token with the public key to prove the token was signed with the public keys' corresponding private key.
    if not verify_signature_rs256(token, cert):
        raise TokenException("Token signature did not match payload.")
    
    # If all of the above checks pass, then the token is valid.
    return {'header': header, 'payload': payload}

def _get_token(request):
    """Get the auth token for this request.
    Auth token may be specified in either the Authorization header or
    as a query param (either access_token or bearer_token).  We'll check in
    this order:
      1. Authorization header.
      2. bearer_token query param.
      3. access_token query param.
    Args:
      request: The current request, or None.
    Returns:
      The token in the request or None.
    """
    auth_header = os.environ.get('HTTP_AUTHORIZATION')
    if auth_header:
        allowed_auth_schemes = ('OAuth', 'Bearer')
        for auth_scheme in allowed_auth_schemes:
            if auth_header.startswith(auth_scheme):
                return auth_header[len(auth_scheme) + 1:]
        return None
    if request and hasattr(request, 'get_unrecognized_field_info'):
        for key in ('bearer_token', 'access_token'):
            token, _ = request.get_unrecognized_field_info(key)
            if token:
                return token
    return None
