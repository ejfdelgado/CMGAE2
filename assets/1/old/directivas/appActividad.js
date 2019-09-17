'use strict';

define(['js/micodigo'], 
  function (micodigo, qrcode) {
  //Uso: <div app-actividad></div>
  micodigo.register.directive("appActividad", [function() {
    return {
      restrict: "A",
    templateUrl: function(elem, attr){
      return 'directivas/appActividad.html';
    },
      link: {
        pre: function(scope, element, attrs, ngModel) {
          scope.tareas = [];

          var actividad = function(e, datos) {
            var llave = {texto: datos.mensaje.contenido};
            var actualizar = function() {
              setTimeout(function() {
                scope.$apply();
              }, 0); 
            }

            var esconder = function() {
              var indice = scope.tareas.indexOf(llave);
              scope.tareas.splice(indice, 1);
              actualizar();
            };

            var error = function() {
              
            };

            var exito = function() {

            };

            var progreso = function(valor) {
              var indice = scope.tareas.indexOf(llave);
              scope.tareas[indice].texto = valor;
              actualizar();
            };

            //datos.promesa.done(exito);
            datos.promesa.progress(progreso);
            //datos.promesa.fail(error);
            datos.promesa.always(esconder);

            scope.tareas.push(llave);
          };
          $.subscribe("/moduloMsj/actividad", actividad);
        },
        post: function(scope, element, attrs, ngModel) {
          
        }
      }
    };
  }]);
});