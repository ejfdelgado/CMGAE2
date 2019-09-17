
'use strict';

define(['js/micodigo', 'js/moduloMsj', 'directivas/modelo3d'].concat(LIB_BASICAS), 
  function (micodigo, moduloMsj) {
  //Para mapas usar <ng-map center="{{modelo.direccion}}"></ng-map>
  micodigo.register.controller('GridBottomSheetCtrl', function($scope, $mdBottomSheet) {
  $scope.items = [
    { name: 'Hangout', icon: 'hangout' },
    { name: 'Mail', icon: 'mail' },
    { name: 'Message', icon: 'message' },
    { name: 'Copy', icon: 'copy2' },
    { name: 'Facebook', icon: 'facebook' },
    { name: 'Twitter', icon: 'twitter' },
  ];

  $scope.listItemClick = function($index) {
    var clickedItem = $scope.items[$index];
    $mdBottomSheet.hide(clickedItem);
  };
});

});