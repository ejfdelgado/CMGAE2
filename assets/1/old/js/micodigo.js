
'use strict';
//https://material.angularjs.org/1.1.9/demo/switch

define(['js/routeResolver'], function () {

  var micodigo = angular.module('micodigo', ['ngRoute', 'ngMaterial', 'ngMap', 'routeResolverServices'])
  .constant('CONSTANTES', {
      'RAIZ_ASSETS': $('base').attr('href').replace(/\/\s*$/i, ""),
      'EVENTO_FIN_TRANSICION': darNombreEventoFinTransicion(),
  })
  .config(['$locationProvider', '$routeProvider', 'CONSTANTES', 'routeResolverProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function($locationProvider, $routeProvider, CONSTANTES, routeResolverProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {
  	//https://code.angularjs.org/1.7.2/docs/error/$location/nobase
  	//$locationProvider.html5Mode(true).hashPrefix('!');

    var route = routeResolverProvider.route;

    micodigo.register =
    {
        controller: $controllerProvider.register,
        directive: $compileProvider.directive,
        filter: $filterProvider.register,
        factory: $provide.factory,
        service: $provide.service
    };

  	$routeProvider
  		.when('/', route.resolve('inicio'))
  		.when('/editar/:miId', route.resolve('detalle'))
  		.when('/crear', route.resolve('detalle'))
  		.otherwise({
  		  redirectTo:'/'
  	});

  }]).config(['$mdThemingProvider', '$mdIconProvider', 'CONSTANTES',
  function($mdThemingProvider, $mdIconProvider, CONSTANTES){
    $mdIconProvider
  	  .defaultIconSet("assets/svg/avatars.svg", 128)
  	  .icon("menu"       , "assets/svg/menu.svg"        , 24)
  	  .icon("share"      , "assets/svg/share.svg"       , 24)
  	  .icon("google_plus", "assets/svg/google_plus.svg" , 512)
  	  .icon("hangouts"   , "assets/svg/hangouts.svg"    , 512)
  	  .icon("twitter"    , "assets/svg/twitter.svg"     , 512)
  	  .icon("cake"    , "assets/svg/cake.svg"     , 512)
  	  .icon("favorite"    , "assets/svg/favorite.svg"     , 512)
  	  .icon("phone"      , "assets/svg/phone.svg"       , 512)
      .icon('share-arrow', 'assets/svg/share-arrow.svg', 24)
      .icon('upload', 'assets/svg/upload.svg', 24)
      .icon('copy', 'assets/svg/copy.svg', 24)
      .icon('print', 'assets/svg/print.svg', 24)
      .icon('hangout', 'assets/svg/hangout.svg', 24)
      .icon('mail', 'assets/svg/mail.svg', 24)
      .icon('message', 'assets/svg/message.svg', 24)
      .icon('copy2', 'assets/svg/copy2.svg', 24)
      .icon('facebook', 'assets/svg/facebook.svg', 24);
    $mdThemingProvider.theme('default')
  	  .primaryPalette('brown')
  	  .accentPalette('red');
  }]).run(['$rootScope', '$mdSidenav', 'CONSTANTES', 'modalesSrv',
  		function($rootScope, $mdSidenav, CONSTANTES, modalesSrv) {

        //Escucha a eventos del módulo de mensajes
        modalesSrv.on();

      	$rootScope.toggleSidebar = function() {
      		$mdSidenav('left').toggle();
      	};
        var nuevoEvento = function() {
          console.log('fin de animación');
          window.dispatchEvent(new Event('resize'));
        };

      	$rootScope.$on('$viewContentLoaded', function(event) {
      		//Acá se deben registrar todos los componentes que tienen animación y afectan a componentes que no se auto escalan
      		$('md-sidenav')
          .unbind(CONSTANTES.EVENTO_FIN_TRANSICION, nuevoEvento)
          .bind(CONSTANTES.EVENTO_FIN_TRANSICION, nuevoEvento);

          nuevoEvento();
      	});

  }]).controller('EncabezadoCtrl', ['$scope', '$location', 
  		function($scope, $location) {
  	console.log('Instanciando EncabezadoCtrl');
  	$scope.darTitulo = function() {
  		return 'AngularJS Material - Starter App';
  	};
  }]).controller('SideBarCtrl', ['$scope', '$location', '$q',
  		function($scope, $location, $q) {
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

  return micodigo;

});



