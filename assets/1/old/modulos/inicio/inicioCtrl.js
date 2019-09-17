
'use strict';

define([
	'js/micodigo', 
	'js/moduloMsj', 
	'directivas/modelo3d', 
	'modulos/inicio/ListBottomSheetCtrl',
	'modulos/inicio/GridBottomSheetCtrl'
	].concat(LIB_BASICAS), 
	function (micodigo, moduloMsj) {
	//Para mapas usar <ng-map center="{{modelo.direccion}}"></ng-map>
	micodigo.register.controller('inicioCtrl', ['$scope', '$location', '$mdDialog', '$timeout', '$rootScope', 'rutasSrv', '$mdBottomSheet',
			function($scope, $location, $mdDialog, $timeout, $rootScope, rutasSrv, $mdBottomSheet) {
		$scope.modelo = {
			texto: 'Hola!',
			nombre: 'Edgar Delgado',
			descripcion: 'Yo amo el queso',
		};
		
		$scope.enviarMensaje = function() {
			var retorno = moduloMsj.detalle({

			});

			retorno.promesa.then(function(respuesta) {
				console.log('?', respuesta);
			});
		};

		$scope.probarActividad = function(prefijo) {
			var retorno = moduloMsj.actividad({contenido: prefijo+'10%'});
			setTimeout(function() {
				retorno.diferido.notify(prefijo+'50%');
			}, 3000);

			setTimeout(function() {
				retorno.diferido.resolve();
			}, 6000);
			//retorno.diferido.reject();
		};


	  $scope.showListBottomSheet = function() {
	    $scope.alert = '';
	    $mdBottomSheet.show({
	      templateUrl: 'modulos/inicio/bottom-sheet-list-template.html',
	      controller: 'ListBottomSheetCtrl'
	    }).then(function(clickedItem) {
	      $scope.alert = clickedItem['name'] + ' clicked!';
	    }).catch(function(error) {
	      // User clicked outside or hit escape
	    });
	  };

	  $scope.showGridBottomSheet = function() {
	    $scope.alert = '';
	    $mdBottomSheet.show({
	      templateUrl: 'modulos/inicio/bottom-sheet-grid-template.html',
	      controller: 'GridBottomSheetCtrl',
	      clickOutsideToClose: false
	    }).then(function(clickedItem) {
	      $mdToast.show(
	            $mdToast.simple()
	              .textContent(clickedItem['name'] + ' clicked!')
	              .position('top right')
	              .hideDelay(1500)
	          );
	    }).catch(function(error) {
	      // User clicked outside or hit escape
	    });
	  };

		$scope.redirigir = function() {
			//rutasSrv.ir('/crear', {llave: 'árbol'});
			//$scope.enviarMensaje();
			/*
			$scope.probarActividad('Procesando archivo... ');
			setTimeout(function() {
				$scope.probarActividad('Procesando algo... ');
			}, 1000);
			*/
		};

		$scope.$watch("modelo.editable",function(newValue,oldValue) {
			$("[editar-texto]").data('editable')($scope.modelo.editable);
		});
	}]);
});
