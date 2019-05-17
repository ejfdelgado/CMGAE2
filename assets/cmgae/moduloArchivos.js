
if (!hayValor(moduloArchivos)) {
var moduloArchivos = (function() {
	var MAX_FILE_SIZE = 550*1024;//en KB
	var PREFIJO_LOCAL = '/app_default_bucket';
	var PREFIJO_RAIZ_PUBLICA = '/public';
	
	var completarPredeterminados = function(atributos) {
		var mapa = {
			'maximoTamanio': MAX_FILE_SIZE,
			'tipos': 'image/*',
			'auto': 'true',
			'dataFolder': '/imagenesbasico',
		}
		for (let llave in mapa) {
			if (!hayValor(atributos[llave])) {
				atributos[llave] = mapa[llave];
			}
		}
		return atributos;
	};
	
	var subirArchivo = function(atributos) {
		var diferido = $.Deferred();
		atributos = completarPredeterminados(atributos);
		var temp = $('<input type="file" class="invisible" accept="'+atributos.tipos+'">');
	    temp.on("change", function (e) {
	        var file = e.target.files[0];
	        if (file.size > atributos.maximoTamanio) {
	        	alert('Archivo muy grande! debe ser menor a '+(atributos.maximoTamanio/(1024))+' KB');
	        	diferido.reject();
	        	return;
	        }
	        var subirReal = function() {
		        var reader = new FileReader();
		        reader.readAsDataURL(file);
		        var form = new FormData();
		        form.append('file-0', file);
		        form.append('folder', atributos.dataFolder);
		        if (hayValor(atributos.id)) {
		        	form.append('name', decodeURIComponent(atributos.id));
		        }
		        if (atributos.auto == 'false') {
		        	form.append('auto', 'false');
	        	}
		        
		        if (hayValor(atributos.url)) {
		        	console.log(atributos.url)
		        	let queryParams = darParametrosUrl(atributos.url);
		        	console.log(queryParams)
		        	if ('no-borrar' in queryParams) {
		        		form.append('no-borrar', 'true');
		        	}
		        }
		        //Sobra porque el servidor ya lo está capturando
		        //form.append('mime', file.type);
		        var diferidoAct = moduloActividad.on();
		        var peticion = {
			            url: '/storage/',
			            type: 'POST',
			            data: form,
			            headers:moduloHttp.darHeader(),
			            cache: false,
			            contentType: false,
			            processData: false,
			        };
		        miseguridad.insertarToken(peticion).then(function(peticion) {
			        $.ajax(peticion).done(function(data) {
			        	if (data.error != 0) {
			        		diferido.reject();
			        	} else {
			        		diferido.resolve(data);
			        	}
			        }).fail(function() {
			        	diferido.reject();
			        }).always(function() {
			        	diferidoAct.resolve();
			        });
		        });
	        };
	        
	        if (estaEnLista(file.name, atributos.opcionesNegras)) {
	        	var promesaConf = moduloMenus.confirmar();
	        	$.when(promesaConf).then(function() {
	        		subirReal();
	        	});
	        } else {
	        	subirReal();
	        }
	    });
	  temp.click();
	  return diferido.promise();
	}
	
	var escribirTextoPlano = function(id, contenido) {
		var diferido = $.Deferred();
		var extension = '.txt';
		var indicePunto = id.indexOf('.');
		var blobAttrs = { type: "text/plain"};
		if (indicePunto>=0) {
			let extension = id.substring(indicePunto);
			extension = extension.toLowerCase();
			if (extension.startsWith('.css') || extension.startsWith('.scss')) {
				blobAttrs.type = 'text/css';
			} else if (extension.startsWith('.js')) {
				blobAttrs.type = 'text/javascript';
			}
		}
		
		var file = new File([contenido], id, blobAttrs);
		var form = new FormData();
        form.append('file-0', file);
        form.append('auto', 'false');
        form.append('name', id);
        var diferidoAct = moduloActividad.on();
        var peticion = {
                url: '/storage/',
                type: 'POST',
                data: form,
                headers:moduloHttp.darHeader(),
                cache: false,
                contentType: false,
                processData: false,
            };
        miseguridad.insertarToken(peticion).then(function(peticion) {
            $.ajax(peticion).done(function(data) {
            	if (data.error != 0) {
            		diferido.reject();
            	} else {
            		diferido.resolve();
            	}
            }).fail(function() {
            	diferido.reject();
            }).always(function() {
            	diferidoAct.resolve();
            });
        });
		return diferido.promise();
	};
	
	var leerTextoPlano = function(id) {
		var diferido = $.Deferred();
		var diferidoAct = moduloActividad.on();
		var peticion = {
	            url: generarUrlDadoId(id, true),
	            type: 'GET',
	            cache: false,
	            dataType: 'text',
	        };
		miseguridad.insertarToken(peticion).then(function(peticion) {
	        $.ajax(peticion).done(function(data, a, b) {
	        	if (b.status == 204) {
	        		diferido.reject({'error': b.status, 'msg': b.statusText});
	        	} else {
	        		diferido.resolve(data);
	        	}
	        }).fail(function(jqXHR, textStatus, errorThrown) {
	        	diferido.reject({'error': textStatus, 'msg': textStatus+':'+errorThrown});
	        }).always(function() {
	        	diferidoAct.resolve();
	        });
		});
        return diferido.promise();
	};
	
	var darNombreId = function(unId) {
		var PATRON_NOMBRE = /(\/)([^\/]*)$/ig;
		var partes = PATRON_NOMBRE.exec(unId);
		if (partes == null) {return null;}
		return partes[2];
	};
	
	/*
	 * poner: Agrega el prefijo dependiendo de si es producción o local
	 * /app_default_bucket o RAIZ_CLOUD_STORAGE
	 */
	var normalizarId = function(unId, poner) {
		if (!hayValor(poner)) {
			poner = false;
		}
		var prefijo = null;
		if (moduloApp.esProduccion()) {
			prefijo = moduloApp.darRaizCloudStorage();
		} else {
			prefijo = PREFIJO_LOCAL;
		}
		if (poner === true) {
			if (!unId.startsWith(prefijo)) {
				unId = prefijo+unId;
			}
		} else {
			if (unId.startsWith(prefijo)) {
				unId = unId.substring(prefijo.length);
			}
		}
		return unId;
	};
	
	var generarUrlDadoId = function(unId, local) {
		var valor;
		if (local!= true && moduloApp.esProduccion()) {
			unId = normalizarId(unId, true);
			valor = 'http://storage.googleapis.com'+unId+'?' + new Date().getTime();
		} else {
			unId = normalizarId(unId);
			valor = '/storage/read?name='+encodeURIComponent(unId)
		}
		return valor;
	};
	
	var darIdDadoUrl = function(direccion) {
		if (!hayValor(direccion)) {return null;}
		if (moduloApp.esProduccion()) {
			var PATRON_GOOGLE_STORAGE = /^(https?:\/\/storage\.googleapis\.com)([^\?]+)(\?.*)?$/ig;
			let partes = PATRON_GOOGLE_STORAGE.exec(direccion);
			if (partes != null && partes.length >= 3) {
				return partes[2];
			}
		} else {
			var PATRON_LOCAL_STORAGE = /(\/storage\/read).*(name=)([^\?&]+)/ig;
			let partes = PATRON_LOCAL_STORAGE.exec(direccion);
			if (partes != null && partes.length >= 3) {
				return partes[3];
			}
		}
		return null;
	};
	
	var borrar = function(unId) {
		var url = '/storage/borrar?name=';
		url+=encodeURIComponent(unId);
		return moduloHttp.borrar(url);
	};
	
	var renombrar = function(viejo, nuevo) {
		var url = '/storage/renombrar?';
		url+='viejo='+encodeURIComponent(viejo);
		url+='&nuevo='+encodeURIComponent(nuevo);
		return moduloHttp.get(url);
	};
	
	var crearBasico = function() {
		var idIndex = PREFIJO_RAIZ_PUBLICA+'/index.html';
		var promesa = leerTextoPlano(idIndex);
		$.when(promesa).then(function(datos) {
			//Ya existe!
		}, function(objeto) {
			if (objeto.error == 204) {
				//Se busca crear
				var peticion = {
			            url: '/assets/cmgae/ejemplos/index.html',
			            type: 'GET',
			            cache: false,
			            dataType: 'text',
			        };
				miseguridad.insertarToken(peticion).then(function(peticion) {
					$.ajax(peticion).done(function(contenido) {
			        	let promesaEscritura = escribirTextoPlano(idIndex, contenido);
						$.when(promesaEscritura).then(function() {
							location.reload();
						});
			        });
				});
			}
		});
	};
	
	var borrarCacheRutaAtual = function() {
		return moduloHttp.borrar(location.pathname);
	};
	
	var borrarCacheConId = function(id) {
		var url = normalizarId(id);
		url = eliminarPrefijo(url, darRaizPublica());
		var promesas = {};
		promesas[0] = moduloHttp.borrar(url);
		if (url === '/index.html') {
			promesas[1] = moduloHttp.borrar('/');
		}
		return promesas;
	};
	
	var darRaizPublica = function() {
		return PREFIJO_RAIZ_PUBLICA;
	}
	
	return {
		'darNombreId': darNombreId,
		'normalizarId': normalizarId,
		'leerTextoPlano': leerTextoPlano,
		'escribirTextoPlano': escribirTextoPlano,
		'subirArchivo': subirArchivo,
		'generarUrlDadoId': generarUrlDadoId,
		'darIdDadoUrl': darIdDadoUrl,
		'borrar': borrar,
		'renombrar': renombrar,
		'completarPredeterminados': completarPredeterminados,
		'crearBasico': crearBasico,
		'darRaizPublica': darRaizPublica,
		'borrarCacheConId': borrarCacheConId,
		'borrarCacheRutaAtual': borrarCacheRutaAtual,
	};
})();
}
