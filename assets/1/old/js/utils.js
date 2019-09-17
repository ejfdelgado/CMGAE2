'use strict';
//---------------------------- comunes
/* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
 * http://benalman.com/
 * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */
(function(a){var b=a({});a.subscribe=function(){b.on.apply(b,arguments)},a.unsubscribe=function(){b.off.apply(b,arguments)},a.publish=function(){b.trigger.apply(b,arguments)}})(jQuery)

function darNombreEventoFinTransicion(){
  var t,
      el = document.createElement("fakeelement");

  var transitions = {
    "transition"      : "transitionend",
    "OTransition"     : "oTransitionEnd",
    "MozTransition"   : "transitionend",
    "WebkitTransition": "webkitTransitionEnd"
  }

  for (t in transitions){
    if (el.style[t] !== undefined){
      return transitions[t];
    }
  }
};

var esFuncion = function (functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
};

var esLista = function(value) {
  return (value!==null && value !==undefined && value instanceof Array);
};

var esObjeto = function(obj) {
  return (obj!==null && obj !==undefined && ((typeof obj) == 'object'));
};

var copiarJSON = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var aBooleano = function(texto) {
  if (!hayValor(texto)) {return null;}
  if (texto == 'true') return true;
  if (texto == 'false') return false;
  return null;
};

var hayValor = function(obj) {
  return (obj!==null && obj !==undefined);
};

var encriptar = function(ctx, clave) {
  var texto = JSON.stringify(ctx);//JSON -> string
  if (!hayValor(clave)) {
    clave="anonimo";
  }
  texto = CryptoJS.AES.encrypt(texto, clave).toString();//string -> AES
  //texto = btoa(texto);//AES -> base64
  return texto;
};

var desencriptar = function(ctx, clave) {
  if (!hayValor(clave)) {
    clave="anonimo";
  }
  ctx = CryptoJS.AES.decrypt(ctx, clave).toString(CryptoJS.enc.Utf8);//AES -> string
  return JSON.parse(ctx);
};