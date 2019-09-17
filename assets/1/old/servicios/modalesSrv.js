'use strict';

/*
Módulo encargado de mostrar modales con material design de angular
*/
define(['js/micodigo'], function (micodigo) {
  micodigo.factory('modalesSrv', ['$filter', '$mdDialog',
    function($filter, $mdDialog) {
    
    var alertar = function(e, mensaje) {
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.body))
          .clickOutsideToClose(true)
          .title(mensaje.mensaje.titulo)
          .textContent(mensaje.mensaje.contenido)
          .ariaLabel('Alert Dialog Demo')
          .ok(mensaje.mensaje.acciones.aceptar.titulo)
      ).then(function() {
        mensaje.mensaje.acciones.aceptar.accion();
      });
    };

    var confirmar = function(e, mensaje) {
      var confirm = $mdDialog.confirm()
      .title(mensaje.mensaje.titulo)
      .textContent(mensaje.mensaje.contenido)
      .ariaLabel('Lucky day')
      .ok(mensaje.mensaje.acciones.aceptar.titulo)
      .cancel(mensaje.mensaje.acciones.cancelar.titulo)
      $mdDialog.show(confirm).then(function() {
        mensaje.mensaje.acciones.aceptar.accion();
      }, function() {
        mensaje.mensaje.acciones.cancelar.accion();
      });
    };

    var detalle = function(e, mensaje) {
      $mdDialog.show({
        controller: mensaje.mensaje.controlador,
        templateUrl: mensaje.mensaje.plantilla,
        parent: angular.element(document.body),
        clickOutsideToClose:mensaje.mensaje.autocerrar,
        fullscreen: mensaje.mensaje.fullscreen // Only for -xs, -sm breakpoints.
      })
      .then(function(answer) {
        mensaje.mensaje.acciones.aceptar.accion(answer);
      }, function() {
        mensaje.mensaje.acciones.cancelar.accion();
      });
    };

    var on = function() {
      $.subscribe("/moduloMsj/alertar", alertar);
      $.subscribe("/moduloMsj/confirmar", confirmar);
      $.subscribe("/moduloMsj/detalle", detalle);
    };

    var off = function() {
      $.unsubscribe("/moduloMsj/alertar", alertar);
      $.unsubscribe("/moduloMsj/confirmar", confirmar);
      $.unsubscribe("/moduloMsj/detalle", detalle);
    };

    return {
      'alertar' : alertar,
      'confirmar' : confirmar,
      'detalle' : detalle,
      'on': on,
      'off': off,
    };
  }]);
});
