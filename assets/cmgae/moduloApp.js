if (!hayValor(moduloApp)) {
var moduloApp = (function() {
	
	var props = {
		'URL_LOGIN': URL_LOGIN,
		'URL_LOGOUT': URL_LOGOUT,
		'HAS_USER': HAS_USER,
		'IS_ADMIN': IS_ADMIN,
		'AMBIENTE': AMBIENTE,
		'RAIZ_CLOUD_STORAGE': RAIZ_CLOUD_STORAGE,
	};
	
	var esPruebas = function() {
		return props.AMBIENTE == 'pruebas';
	};
	
	var esProduccion = function() {
		return props.AMBIENTE == 'produccion';
	};
	
	var esAdmin = function() {
		return props.IS_ADMIN;
	};
	
	var esUsuario = function() {
		return props.HAS_USER;
	};
	
	var darRaizCloudStorage = function() {
		return props.RAIZ_CLOUD_STORAGE;
	};
	
	var login = function() {
		moduloActividad.on();
		window.location.href = props.URL_LOGIN;
	};
	
	var logout = function() {
		moduloActividad.on();
		window.location.href = props.URL_LOGOUT;
	};
	
    var abrirBarraEdicion = function() {
  	  if ($('body').data('Midgard-midgardToolbar').options.display === 'full') {
  		  $('body').data('Midgard-midgardToolbar').__proto__.hide();
  		  $('body').data('Midgard-midgardToolbar').options.display = 'minimized';
  	  } else {
  		  $('body').data('Midgard-midgardToolbar').__proto__.show();
  		  $('body').data('Midgard-midgardToolbar').options.display = 'full';
  	  }
  	};
	
	var borrarCache = function () {
	  var diferido = $.Deferred();
	  var diferidoAct = moduloActividad.on();
	  $.ajax({
		  type: "GET",
		  url: "/act/clearmemcache",
		  data: JSON.stringify({}),
		  contentType: "application/json; charset=utf-8",
		})
		.done(function( msg ) {
			diferido.resolve();
		})
		.fail(function( jqXHR, textStatus ) {
			diferido.reject();
		})
		.always(function() {
			diferidoAct.resolve();
		});
	  return diferido.promise();
	};
	
	var inicializar = function() {
		var diferido = $.Deferred();
		diferido.resolve();
		return diferido.promise();
	};
	
	var enviarCorreo = function(datos) {
		var promesa = moduloHttp.put('/act/correo', datos);
		return promesa;
	};
	
	return {
		'esAdmin': esAdmin,
		'esUsuario': esUsuario,
		'login': login,
		'logout': logout,
		'borrarCache': borrarCache,
		'abrirBarraEdicion': abrirBarraEdicion,
		'esProduccion': esProduccion,
		'esPruebas': esPruebas,
		'darRaizCloudStorage': darRaizCloudStorage,
		'enviarCorreo': enviarCorreo,
	};
	
})();
}