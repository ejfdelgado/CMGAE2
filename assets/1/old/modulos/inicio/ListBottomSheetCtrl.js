
'use strict';

define(['js/micodigo'].concat(LIB_BASICAS), 
  function (micodigo, moduloMsj) {
  //Para mapas usar <ng-map center="{{modelo.direccion}}"></ng-map>
  micodigo.register.controller('ListBottomSheetCtrl', function($scope, $mdBottomSheet) {

  $scope.items = [
    { name: 'Share', icon: 'share-arrow' },
    { name: 'Upload', icon: 'upload' },
    { name: 'Copy', icon: 'copy' },
    { name: 'Print this page', icon: 'print' },
  ];

  $scope.listItemClick = function($index) {
    var clickedItem = $scope.items[$index];
    $mdBottomSheet.hide(clickedItem);
  };
});
});