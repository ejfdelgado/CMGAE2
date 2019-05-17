if (!hayValor(moduloHttp)) {
	var moduloHttp = (function() {
		
		var call = function(url, metodo, encabezados, usarCache, payload, params) {
			if (!hayValor(usarCache)) {
				usarCache = false;
			}
			if (hayValor(params)) {
				url += '?'+$.param(params);
			}
			var diferido = $.Deferred();
		    var diferidoAct = moduloActividad.on();
		    var peticion = {
		        'url': url,
		        'type': metodo,
		        'cache': usarCache,
		        'headers': {},
		    };
		    if (hayValor(encabezados)) {
		    	peticion.headers = encabezados;
		    }
		    if (hayValor(payload)) {
		    	peticion.data = JSON.stringify(payload),
		    	peticion.headers.contentType = "application/json; charset=utf-8";
		    }
		    miseguridad.insertarToken(peticion).then(function(peticion) {
			    $.ajax(peticion).done(function(datos) {        	
			    	diferido.resolve(datos);
			    }).fail(function() {
			    	diferido.reject();
			    }).always(function() {
			    	diferidoAct.resolve();
			    });
		    });

			return diferido.promise();
		};
		
		var get = function(url, usarCache, params) {
			return call(url, 'GET', null, usarCache, null, params)
		};
		
		var borrar = function(url) {
			return call(url, 'DELETE')
		};
		
		var put = function(url, payload, params) {
			return call(url, 'PUT', null, false, payload, params);
		};
		
		var post = function(url, payload, params) {
			return call(url, 'POST', darHeader(), false, payload, params);
		};
		
		var darToken = function() {
			return $('[name="csrfmiddlewaretoken"]').val();
		};
		
		var darHeader = function() {
			return {
            	'X-CSRFToken':darToken(),
            };
		};
		
		return {
			'get': get,
			'post': post,
			'put': put,
			'borrar': borrar,
			'darToken': darToken,
			'darHeader': darHeader,
		}
	})();
}