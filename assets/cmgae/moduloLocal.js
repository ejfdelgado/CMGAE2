
if (!hayValor(moduloLocal)) {
	var moduloLocal = (function() {
		var props = {
			'lengua': LENGUAJE,
			'lenguapred': LENGUAJE_PRED,
		};
		
		var datos = null;
		
		var inicializar = function() {
			var diferido = $.Deferred();
			var promesa = moduloHttp.get('/assets/cmgae/local/'+props.lengua+'.json');
			$.when(promesa).then(function(nuevos) {
				datos = JSON.parse(nuevos);
				diferido.resolve();
			});
			//Se formatean las fechas
			epochAFechaElem($('body'));
			activarBotonesLenguaje();
			return diferido.promise();
		};
		
		var traducir = function(llave) {
			if (!esObjeto(datos)) {return llave;}
			return leerObj(datos, llave, llave);
		};
		
		var procesarElemento = function(elem) {
			$.each(elem.find('.traducir'), function(i, hijoB) {
				var hijo = $(hijoB);
				var llave = hijo.text();
				if (esMultilenguaje(llave)) {
					var traducido = traducir(llave);
					if (traducido != llave) {
						hijo.html(traducido);
					}
				}
			});
		};
		
		var epochAFecha = function (objeto, formato1) {
			var fechaTexto = objeto.attr("data-value");
			if (fechaTexto) {
				var fecha = new Date(0);
				try {
					fecha.setUTCSeconds(parseInt(fechaTexto));
				} catch (e) {}
				objeto.find("[data-format]").each(function(index, element) {
					var actual = $(element);
					var formato = actual.attr("data-format");
					var formateado = $.format.date(fecha.getTime(), formato);
					actual.text(formateado);
				});
				if (formato1 !== undefined)
					return $.format.date(fecha.getTime(), formato1);
			}
			return "";
		};

		var epochAFechaElem = function (elemento){
			elemento.find("[dateProperty]").each(function(index, element) {
				var actual = $(element);
				epochAFecha(actual);
			});
		};
		
		var activarBotonesLenguaje = function() {
			$('[data-lenguaje]').each(function(i, elem) {
				var self = $(elem);
				var lenguaje = self.attr('data-lenguaje');
				self.off('click', '**');
				self.on('click', function() {
					var matchCampo = /(http)(s?)(:)(\/\/)(.*?)(\/)((leng-)(.*?)(\/))?(.*)/g.exec(window.location);
					if (matchCampo) {
						var nuevo = '';
						var primeravez = true;
						var actual = matchCampo[9];
						var es_predeterminado = (lenguaje === props.lenguapred);
						for (var i=1; i<matchCampo.length; i++) {
							var temp = matchCampo[i];
							if (i <= 6 || i >= 11) {
								if (temp !== undefined) {
									nuevo += temp;
								}
							} else {
								if (es_predeterminado) {
									if (actual === undefined) {
										return;
									}
								} else {
									if (actual === lenguaje) {
										return;
									}
								}
								if (!es_predeterminado && primeravez) {
									nuevo += 'leng-'+lenguaje+'/';
									primeravez = false;
								}
							}
						}
						window.location = nuevo;
					}
				});
			});
		};
		
		return {
			'inicializar': inicializar,
			'traducir': traducir,
			'procesarElemento': procesarElemento,
			'epochAFechaElem': epochAFechaElem,
		};
	})();
}