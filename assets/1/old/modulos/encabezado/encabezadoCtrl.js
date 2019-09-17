'use strict';

define(['js/micodigo'], 
  function (micodigo) {
    micodigo.register.controller('encabezadoCtrl', ['$scope', '$location', 
      function($scope, $location) {
    console.log('Instanciando EncabezadoCtrl');
    $scope.darTitulo = function() {
      return 'AngularJS Material - Starter App';
    };
  }]);
});