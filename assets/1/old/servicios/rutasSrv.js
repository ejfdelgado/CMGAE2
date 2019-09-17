'use strict';

/*
Módulo encargado de mostrar modales con material design de angular
*/
define(['js/micodigo'], function (micodigo) {
  micodigo.factory('rutasSrv', ['$q', '$location',
    function($q, $location) {
      var QUERY_PARAM_CTX = 'ctx';

      var darUrlDestino_ = function() {
        return location.origin+location.pathname;
      };

      var ir = function(estado, objeto, nuevaPestania) {
        var ctx = null;
        if (typeof objeto !== 'undefined') {
          ctx = encriptar(objeto);
        }
        var obj = {};
        obj[QUERY_PARAM_CTX] = ctx;
        var queryParams = '?'+QUERY_PARAM_CTX+'='+ctx;
        if (nuevaPestania == true) {
          var nuevaUrl = darUrlDestino_()+'#!'+estado+queryParams;
          return window.open(nuevaUrl, "_blank");
        } else {
          $location.path(estado);
          $location.search(QUERY_PARAM_CTX, ctx);
        }
      };

      var contexto = function(quejarse) {
        var diferido = $q.defer();
        var params = $location.search();
        var temp = params[QUERY_PARAM_CTX];
        if (hayValor(temp)) {
          try {
            temp = desencriptar(temp);
            diferido.resolve(temp);
          } catch(e) {
            if (quejarse) {
              diferido.reject(e);
            } else {
              diferido.resolve(null);
            }
          }
        } else {
          if (quejarse) {
            diferido.reject(null);
          } else {
            diferido.resolve(null);
          }
        }
        return diferido.promise;
      };

      return {
        'ir': ir,
        'contexto': contexto,
      };
}]);

});