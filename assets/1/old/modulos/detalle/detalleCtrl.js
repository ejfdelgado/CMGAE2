'use strict';

define(['js/micodigo'].concat(LIB_BASICAS), 
  function (micodigo) {

    micodigo.register.controller('detalleCtrl', ['$scope', 'rutasSrv', 
      function($scope, rutasSrv) {
        rutasSrv.contexto().then(function(ctx) {
          console.log('ctx', ctx);  
        });
    }]);

    micodigo.register.controller('nuevoCtrl', ['rutasSrv', 
      function(rutasSrv) {
        rutasSrv.contexto().then(function(ctx) {
          console.log('ctx', ctx);  
        });
        
    }]);
});