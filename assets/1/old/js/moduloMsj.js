'use strict';

/*
Móddulo agnóstico a la interfaz que tiene la intención de mostrar mensajes
*/
define(['js/micodigo'], function (micodigo, qrcode, jsPDF) {

  return (function() {

    var enviar = function(mensaje, topico) {

      function controlador($scope, $mdDialog) {
        $scope.hide = function() {
          $mdDialog.hide();
        };

        $scope.cancel = function() {
          $mdDialog.cancel();
        };

        $scope.answer = function(answer) {
          $mdDialog.hide(answer);
        };
      };

      var pred = {
        titulo: 'Información',
        contenido: 'Texto',
        controlador: controlador,
        plantilla: 'modulos/inicio/modalDetalle.html',
        fullscreen: true,
        autocerrar: true,
        acciones: {
          'cancelar': {
            titulo: 'Cancelar',
            accion: function() {
              pred.diferido.reject();
            }
          },
          'aceptar': {
            titulo: 'Aceptar',
            accion: function(dato) {
              pred.diferido.resolve(dato);
            }
          }
        }
      };

      $.extend(true, pred, mensaje);

      if (!hayValor(pred.diferido)) {
        pred.diferido = $.Deferred();
      }

      var promesa = pred.diferido.promise();

      var retorno = {
        'mensaje': pred,
        'diferido': pred.diferido,
        'promesa': promesa,
      };

      $.publish(topico, [retorno]);

      return retorno;
    };

    var alertar = function(mensaje) {
      return enviar(mensaje, '/moduloMsj/alertar');
    };

    var confirmar = function(mensaje) {
      return enviar(mensaje, '/moduloMsj/confirmar');
    };

    var detalle = function(mensaje) {
      return enviar(mensaje, '/moduloMsj/detalle');
    };

    var actividad = function(mensaje) {
      return enviar(mensaje, '/moduloMsj/actividad');
    };

    return {
      'alertar': alertar,
      'confirmar': confirmar,
      'detalle': detalle,
      'actividad': actividad,
    };
  })();

});