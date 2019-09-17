'use strict';

define(['js/micodigo'], 
  function (micodigo) {
    micodigo.register.controller.then('sidebarCtrl', ['$scope', '$location', '$q', '$rootScope', 'CONSTANTES',
      function($scope, $location, $q, $rootScope, CONSTANTES) {
    console.log('Instanciando SideBarCtrl');
    $scope.modelo = {
      items: [],
    };
    $scope.darItems = function() {
      var diferido = $q.defer();
      diferido.resolve([
        {
          'img': 'assets/svg/avatar-1.svg',
          'txt': 'Lia Luogo',
        },
        {
          'img': 'assets/svg/avatar-4.svg',
          'txt': 'Edgar Delgado',
        }
      ]);
      return diferido.promise;
    };
    $scope.darItems().then(function(nuevaLista) {
      $scope.modelo.items = nuevaLista;
    });
  }]);
});