if (!hayValor(moduloHttp)) {
	var moduloHttp = (function() {
		
		var call = function(url, metodo, encabezados, usarCache, payload, params, actividad) {
			if (!hayValor(usarCache)) {
				usarCache = false;
			}
			if (hayValor(params)) {
				url += '?'+$.param(params);
			}
			var diferido = $.Deferred();
		    var diferidoAct = null;
		    if (actividad !== false) {
		    	diferidoAct = moduloActividad.on();
		    }
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
		    var siempre = function(peticion) {
			    $.ajax(peticion).done(function(datos) {        	
			    	diferido.resolve(datos);
			    }).fail(function() {
			    	diferido.reject();
			    }).always(function() {
			    	if (diferidoAct !== null) {
			    		diferidoAct.resolve();
			    	}
			    });
		    };
		    miseguridad.insertarToken(peticion).then(siempre, siempre);

			return diferido.promise();
		};
		
		var get = function(url, usarCache, params, actividad) {
			return call(url, 'GET', null, usarCache, null, params, actividad)
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