"use strict";

var utilidades;

var localizacion = (function($) {
    var darUbicacion = function() {
        var diferido = $.Deferred();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                diferido.resolve(position);
            });
        } else {
            diferido.reject();
        }
        return diferido.promise();
    };
    
    return {
        'darUbicacion': darUbicacion, 
    };
})(jQuery);

var mapear = function(dato, mapa, pred) {
	if (!utilidades.hayValorTexto(pred)) {
		pred = '';
	}
	if (!utilidades.hayValorTexto(dato)) {
		return pred;
	}
	var ans = mapa[dato];
	if (utilidades.hayValor(ans)) {
		return ans;
	}
	return pred;
};

var siempreTexto = function(dato, pred) {
	if (typeof pred != 'string') {
		pred = '';
	}
	if (!utilidades.hayValorTexto(dato)) {return pred;}
	return dato;
};

var esNumeroMayorQueCero = function(dato) {
	var temp = parseFloat(dato);
	if (!isNaN(temp)) {
		return dato > 0;
	}
	return false;
};

Number.prototype.toFixedNumber = function(x){
  var texto = this.toFixed(x);
  return parseFloat(texto);
}

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURIComponent(results[1]) || 0;
    }
}

jQuery.fn.setCursorPosition = function(pos) {
  this.each(function(index, elem) {
    if (elem.setSelectionRange) {
      elem.setSelectionRange(pos, pos);
    } else if (elem.createTextRange) {
      var range = elem.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  });
  return this;
};

jQuery.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

var all = function(array){
    var deferred = jQuery.Deferred();
    var fulfilled = 0, length = array.length;
    var results = [];

    if (length === 0) {
        deferred.resolve(results);
    } else {
        array.forEach(function(promise, i) {
            jQuery.when(promise()).then(function(value) {
                results[i] = value;
                fulfilled++;
                if(fulfilled === length){
                    deferred.resolve(results);
                }
            }, function() {
            	//Una falló
            	deferred.reject();
            });
        });
    }

    return deferred.promise();
};

Array.prototype.contiene = function(objeto) {
	if (!(typeof objeto == 'object')) {
		return -1;
	}
	try {
		var llaves = Object.keys(objeto);
		for (var i=0; i<this.length; i++) {
			var actual = this[i];
			if (typeof actual == 'object') {
				var iguales = 0;
				for (var j=0; j<llaves.length; j++) {
					var llave = llaves[j];
					if (actual[llave] == objeto[llave]) {
						iguales++;
					}
				}
				if (iguales == llaves.length) {
					return i;
				}
			}
		}
		return -1;
	} catch (e) {
		return -1;
	}
};

Array.prototype.estaEnLista = function(dato) {
	return (this.indexOf(dato) >= 0);
};

//Quito los que están en la lista pasada por parámetro a
Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) === -1;
    });
};

String.prototype.capitalize = function() {
	var temp = this.trim();
    return temp.charAt(0).toUpperCase() + temp.slice(1);
};

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

(function(a){typeof module!="undefined"&&module.exports?module.exports=a():typeof define=="function"&&typeof define.amd=="object"?define("json.sortify",a):JSON.sortify=a()})(function(){

var a=function(b){if(Array.isArray(b))return b.map(a);if(b instanceof Object){var c=[],d=[];return Object.keys(b).forEach(function(a){/^(0|[1-9][0-9]*)$/.test(a)?c.push(+a):d.push(a)}),c.sort(function(c,a){return c-a}).concat(d.sort()).reduce(function(c,d){return c[d]=a(b[d]),c},{})}return b},b=JSON.stringify.bind(JSON);return function sortify(c,d,e){var f=b(c,d,0);if(!f||f[0]!=="{"&&f[0]!=="[")return f;var g=JSON.parse(f);return b(a(g),null,e)}});

(function($) {

	console.log("Iniciando Untilidades JS");

	//---------------------------- comunes
	/* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
	 * http://benalman.com/
	 * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */
	(function(a){var b=a({});a.subscribe=function(){b.on.apply(b,arguments)},a.unsubscribe=function(){b.off.apply(b,arguments)},a.publish=function(){b.trigger.apply(b,arguments)}})(jQuery);

	utilidades = (function() {

		var is_null = function(valor) {
			return (valor === null || typeof valor === 'undefined');
		};

		var esNumero = function(dato) {
			return (typeof dato == 'number' || /^\d+$/.test(dato));
		};

		var esFlotante = function(dato) {
			return (typeof dato == 'number'  || /^\s*\d+([\.,]\d*)?\s*$/.test(dato));
		}

		var esFuncion = function (functionToCheck) {
		  var getType = {};
		  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
		};

		var esLista = function(value) {
		  return (value!==null && value !==undefined && value instanceof Array);
		};

		var esObjeto = function(obj) {
		  return (obj!==null && obj !==undefined && ((typeof obj) == 'object'));
		};

		var copiarJSON = function(obj) {
			if (typeof obj === 'undefined') {
				return undefined;
			}
			return JSON.parse(JSON.stringify(obj));
		};

		var aBooleano = function(texto) {
		  if (!hayValor(texto)) {return null;}
		  if (texto == 'true') return true;
		  if (texto == 'false') return false;
		  return null;
		};

		var hayValor = function(obj) {
		  return (obj!==null && obj !==undefined);
		};

		var hayValorTexto = function(obj) {
			if (!hayValor(obj)) {
				return false;
			}
			if (typeof obj != 'string') {
				return false;
			}
			if (obj.trim().length == 0) {
				return false;
			}
			return true;
		}

	  var leerMapaConPredefinidos = function($entrada, $mapa) {
	  	$.each($mapa, function($llave, $valor) {
	      var $temp = $entrada[$llave];
	      if (is_null($temp)) {
	        var $predeterminado = $valor;
	        if (!is_null($predeterminado)) {
	          $entrada[$llave] = $predeterminado;
	        }
	      }
	  	});
	   
	    return $entrada;
	  };


		var esMultilenguaje = function(entrada) {
			return /^(\S)+(\.\S+)+$/gim.test(entrada)
		};

		function darNumeroAleatorio(min, max) {
		    return Math.floor(Math.random() * (max - min + 1)) + min;
		};

		function decimalAHex(d, padding) {
		    var hex = Number(d).toString(16);
		    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

		    while (hex.length < padding) {
		        hex = "0" + hex;
		    }
		    return hex;
		};

		var darHtmlCompleto = function(elem) {
			return $('<div>').append(elem.clone()).html();
		};

		var darHtmlSeguro = function(texto) {
			return $('<div>').html(texto).html();
		};

		var deHtmlDarSoloTexto = function(texto) {
			return $('<div>').html(texto).text();
		};

		var leerObj = function(obj, nombres, predef, evitarInvocar) {
			if (!hayValor(nombres) || !esObjeto(obj)){return predef;}
			var partes;
			try {
				if (typeof nombres == 'number') {
					partes = [nombres];
				} else {
					partes = nombres.split('.');
				}
			} catch (e) {
				console.log('Error', e, 'nombres', nombres);
				return predef;
			}
			var objetoActual = obj;
			for (var i=0; i<partes.length; i++) {
				var llave = partes[i];
				if (esNumero(llave) && esLista(objetoActual)) {
					llave = parseInt(llave);
				}
				objetoActual = objetoActual[llave];
				if (i != (partes.length - 1) && !esObjeto(objetoActual)) {
					return predef;
				}
			}
			if (!hayValor(objetoActual)) {
				return predef;
			}
			if (evitarInvocar !== true && esFuncion(objetoActual)) {
				return objetoActual();
			}
			return objetoActual;
		};

		var asignarObj = function(miObjeto, nombres, valor) {
			var debug = true;
			//if (debug) {console.log('Asignando ', nombres, 'con', valor);}
			var partes = nombres.split('.');
			var objetoActual = miObjeto;
			var esUltimo;
			var esObj;
			var anterior = null;
			var llaveAnterior = null;
			var esNumeroLlave;
			for (var i=0; i<partes.length; i++) {
				var llave = partes[i];
				esNumeroLlave = esNumero(llave);
				if (esNumeroLlave) {
					llave = parseInt(llave);
				}
				esUltimo = (i == (partes.length-1));
				esObj = (typeof objetoActual == 'object');
				//if (debug) {console.log('i=',i, 'llave=',llave,'esUltimo=',esUltimo,'esObj=',esObj);}

				if (!esObj && anterior != null) {
					//if (debug) {console.log('Forza a que sea objeto');}
					//Forza a que sea un objeto
					var nuevo;
					if (esNumeroLlave) {
						nuevo = [];
					} else {
						nuevo = {};
					}
					anterior[llaveAnterior] = nuevo;
					objetoActual = nuevo;
					esObj = true;
				}

				if (esObj) {
					if (esUltimo) {
						//Última iteración
						if (esLista(objetoActual[llave]) && esLista(valor) && objetoActual[llave] !== valor) {
							objetoActual[llave].splice(0, objetoActual[llave].length);
							$.each(valor, function(i, eee) {
								objetoActual[llave].push(eee);
							});
						} else {
							objetoActual[llave] = valor;
						}
					} else {
						var tipoObj = (typeof objetoActual);
						if (tipoObj != 'object' || Object.keys(objetoActual).indexOf(''+llave) < 0 || 
							(objetoActual[llave] === null || tipoObj == 'undefined')) {
							//Si la llave no existe en el objeto actual o si es nulo o indefinido
							//if (debug) {console.log('Creando siguiente objeto');}
							if (esNumero(partes[i+1])) {
								objetoActual[llave] = [];
							} else {
								objetoActual[llave] = {};
							}
						}
						anterior = objetoActual;
						llaveAnterior = llave;
						objetoActual = objetoActual[llave];
					}
				} else {
					//if (debug) {console.log('Aborta en ', llave);}
					break;
				}
			}
		};

		var darSubrutas = function(llave) {
			var myRe = /([^\.]+)/ig;
			var lista = [];
			var todos = [];
			var result;
			while (result = myRe.exec(llave)) {
			    llave = llave.substring(myRe.lastIndex);
			    myRe.lastIndex = 0;
				todos.push(result[0]);
				lista.push(todos.join('.'));
			}
			return lista;
		};

		var darRutasObjeto = function(objOr, filtroObjetoAgregar) {
		  var ans = [];
		  var funcionRecursiva = function(obj, rutaActual) {
		    if (esObjeto(obj)) {
		      $.each(obj, function(llave, valor) {
		        var llaveSiguiente = null;
		        if (rutaActual === null) {
		          llaveSiguiente = llave;
		        } else {
		          llaveSiguiente = rutaActual+'.'+llave;
		        }
		        if (esFuncion(filtroObjetoAgregar) && filtroObjetoAgregar(valor)) {
		          ans.push(llaveSiguiente);
		        }
		        funcionRecursiva(valor, llaveSiguiente);
		      });
		    } else {
		      if (rutaActual !== null) {
		        if (esFuncion(filtroObjetoAgregar)) {
		          if (filtroObjetoAgregar(obj)) {
		            ans.push(rutaActual);
		          }
		        } else {
		          ans.push(rutaActual);
		        }
		      }
		    }
		  };

		  funcionRecursiva(objOr, null);
		  return ans;
		};

		var predefinir = function(objeto, ejemplo) {
			var llaves = darRutasObjeto(ejemplo);
			for (var i=0; i<llaves.length; i++) {
				var llave = llaves[i];
				if (!hayValor(leerObj(objeto, llave, null, true))) {
					var nuevo = leerObj(ejemplo, llave, null, true);
					asignarObj(objeto, llave, nuevo);
				}
			}
			return objeto;
		};

		var observarRutaActual = function(funcionCall) {
			var llave = 'emprendimiento.Avance.Valor';
			observarModelos([llave], function(rutaActual) {
				try {
					funcionCall(rutaActual[llave]);
				} catch (e) {
					console.error('Error invocando subfunción en observarRutaActual', e);
				}
			});
		};

		var esPrimeraVezEnPagina = function(funcionCall) {
			var llave = 'emprendimiento.Avance.Valor';
			observarModelos([llave], function(rutaActual) {
				try {
					funcionCall(rutaActual[llave] == moduloEnrutador.leerEstadoDeRutaActual());
				} catch (e) {
					console.error('Error invocando subfunción en observarRutaActual', e);
				}
			});
		};
		
		var observarModelos = function(listaLocal, funcionCall) {
			var textoConsulta = '{';
			for (var i=0; i<listaLocal.length; i++) {
				var refModelo = listaLocal[i];
				if (hayValorTexto(refModelo)) {
					textoConsulta+='"'+refModelo+'": {'+refModelo+'},';
				}
			}
			if (textoConsulta.endsWith(',')) {
				textoConsulta = textoConsulta.substring(0, textoConsulta.length-1);
			}
			textoConsulta+='}';
			procesarCondicionSi(textoConsulta, funcionCall, true);
		};

		var evaluarObjeto = function(expresion, objeto, predefinido, evaluar) {
			var PATRON = /{([a-z\d_\.]*)}/ig;
			var variables = [];
			do {
			    var m = PATRON.exec(expresion);
			    if (m) {
			    	var llave = m[1];
			    	if (Object.keys(variables).indexOf(llave) < 0) {
						variables.push(llave);
			    	}
			    }
			} while (m);

			var condicionArmada = expresion;

			condicionArmada = condicionArmada.replace(PATRON, function(texto, subllave) {
				return leerObj(objeto, subllave, null);
			});
			try {
				if (evaluar === false) {
					return condicionArmada;
				} else {
					return eval(condicionArmada);
				}
			} catch (e) {
				moduloDebug.error('No se pudo evaluar la expresión', condicionArmada);
				return predefinido;
			}
		};

		var procesarCondicionSi = function(datos, funcion, esJSON, esTexto) {

			var PREDEFINIDO_NEGOCIO = {
				'Servicio.Costos.Vez.Temporal': [],
			};

			if (!utilidades.hayValor(datos)) {
				//console.error('Al llamar procesarCondicionSi debe haber datos');
				return;
			}
			//console.log('procesarCondicionSi', datos);
			
			var PATRON = /{([a-z_]*)\.([a-z\d_\.]*)}/ig;

			var variables = {};

			do {
			    var m = PATRON.exec(datos);
			    if (m) {
			    	var dominio = m[1];
			    	var llave = m[2];
			    	if (Object.keys(variables).indexOf(dominio) < 0) {
			    		variables[dominio] = [];
			    	}
			    	variables[dominio].push(llave);
			    }
			} while (m);

			var valoresGlobales = {};

			var finalizar = function(condicionArmada, tipo) {
				//console.log('condicionArmada', condicionArmada, tipo);
				var resultado;
				try {
					if (esJSON) {
						resultado = JSON.parse(condicionArmada);
					} else if (esTexto) {
						resultado = condicionArmada;
					} else {
						resultado = eval(condicionArmada);
					}
				} catch (e) {
					console.error('Error procesando condicionArmada de '+datos, e);
				}
				try {
					funcion(resultado, tipo);
				} catch (e) {
					console.error('Error invocando subfunción en procesarCondicionSi de '+datos, e);
				}
			};

			var funcionGlobal = function(tipo) {
				//Se debe remplazar los valores en la expresión
				var condicionArmada = datos;
				condicionArmada = condicionArmada.replace(PATRON, function(texto, dominio, subllave) {
					//console.log('esTexto', esTexto)
					if (esTexto) {
						return valoresGlobales[dominio][subllave];
					} else {
						return JSON.stringify(valoresGlobales[dominio][subllave]);
					}
				});

				finalizar(condicionArmada, tipo);
			}

			//Se itera cada dominio
			var dominios = Object.keys(variables);
			if (dominios.length == 0) {
				//console.log('No se encontraron dominios');
				finalizar(datos, 0);
			}

			$.each(dominios, function(i, dominio) {
    			valoresGlobales[dominio] = {};
				var observadores = [];
				var listaVariables = variables[dominio];
				for (var j=0; j<listaVariables.length; j++) {
					var miLlave = listaVariables[j];
					var predefinido = null;
					if (miLlave in PREDEFINIDO_NEGOCIO) {
						predefinido = PREDEFINIDO_NEGOCIO[miLlave];
					}
					observadores.push({'llave': miLlave, 'predefinido': predefinido});
				}
    			var funcionLogica = function(a, b, tipo) {
    				//console.log('funcionLogica', tipo);
    				//console.log('dominio', dominio, JSON.stringify(observadores), '->', JSON.stringify(a));
    				valoresGlobales[dominio] = a;
    				funcionGlobal(tipo);
    			};
    			//console.log('dominio', dominio, JSON.stringify(observadores));
    			var miDominio = modeloPersistente.leer(dominio);
    			if (!utilidades.hayValor(miDominio)) {
    				throw 'El dominio '+dominio+' no existe para calcular la condición sí';
    			} else {
					miDominio.getStored(observadores).then(function(a, b) {
						funcionLogica(a, b, 0);
					});
					miDominio.on(observadores, function(a, b) {
						funcionLogica(a, b, 1);
					});
    			}
			});
		};

		var esAdmin = function() {
			try {
				if (WP_ES_ADMIN) {
					return true;
				} else {
					return false;
				}
			} catch (e) {
				return false;
			}
		};

		var esWpAdmin = function() {
			//return (location.href.indexOf('/wp-admin/') >= 0);
			try {
				return ('elementor-preview-iframe' == window.frameElement.id)
			} catch (e) {
				return false;
			}
			/*
			//Esto es equivalnte a preguntar si estamos dentro de un iframe
		    try {
		        return window.self !== window.top;
		    } catch (e) {
		        return true;
		    }
		    */
		};

		var validarFormulario = function(event, opciones) {
			//Se deben encontrar todos los inputs, leer el valor
			var predeterminado = {
				'alertar': true,
				'resaltar': true,
			};
			$.extend(true, predeterminado, opciones);
			opciones = predeterminado;
			opciones['respuesta'] = $.Deferred();
			var errores = 0;
			$('.input_pmoney_validable').each(function(i, elem) {
				var elemento = $(elem);
				if (elemento.closest('.pmoney_bloqueado').length == 0 && elemento.closest('.invisible').length == 0) {
					var validarFun = elemento.data('validar');
					if (utilidades.esFuncion(validarFun)) {
						try {
							var unError = validarFun(opciones);
							if (utilidades.esNumero(unError)) {
								errores += unError;
							}
						} catch (e) {
							console.error(e);
						}
					}
				}
			});
			//Se cuentas los errores del drag & drop
			var hayDragDrags = ($('[data-pdrag][data-modelo]').length > 0);
			if (hayDragDrags) {
				errores += $('.drop_incorrecto').length;
				errores += $('.drop_destino.drop_vacio').length;
			}

			var mostrarPrimerError = function() {
				scrollToElement('.mierror, .con_error, .items_con_error');
			};
			
			if (errores > 0) {
				//Lorena Cambiar el mensaje de error y decir que llene todas las celdas incluyendo los place holders si desea el mismo número.
				//moduloModales.error({error: 'Por favor verifique la información'});
				if (opciones.alertar === true) {
					moduloModales.error({error: 'Por favor diligencia todos los campos, incluidas las sugerencias que provee el sistema.'});
				}
				if (event != null && typeof event != 'undefined') {
					event.preventDefault();
				}
				if (opciones.resaltar) {
					//Lo llevo al primer dato resaltado!
					mostrarPrimerError();
				}
				opciones['respuesta'].resolve(false);
				return false;
			}
			opciones['respuesta'].resolve(true);
			return true;
		};

		var extraerTextoEstructurado = function(div, callback) {
			var ans = [];
			div.find('tr').each(function(i, fila) {
				ans[i] = [];
				var filaj = $(fila);
				filaj.find('td div,th div').each(function(j, col) {
					var colj = $(col);
					ans[i][j] = colj.text();
					if (typeof callback == 'function') {
						callback(i, j, ans[i][j], colj);
					}
				});
			});
			return ans;
		};

		var resaltarDatosDiferentes = function(div, estadoI, clases, opciones) {
			var maxfila = estadoI.length;
			if (maxfila > 0) {
				var maxCol = estadoI[0].length;
				extraerTextoEstructurado(div, function(i, j, valor, elem) {
					if (i<maxfila && j<maxCol) {
						if (!opciones.ignorarColumnas.estaEnLista(j) && !opciones.ignorarFilas.estaEnLista(i)) {
							if (valor != estadoI[i][j]) {
								for (var k=0; k<clases.length; k++) {
									elem.addClass(clases[k]);
								}
							}
						}
					}
				});
			}
			setTimeout(function() {
				for (var k=0; k<clases.length; k++) {
					var clase = clases[k];
					$(div.find('.'+clase)).removeClass(clase);
				}
			}, 2000);//Porque la clase dato_cambiado tiene 2s
		};

		var renderizarTabla = function(div, filas, columnas, eventos, primeraVez) {
			//Se extraen los datos de cada columna y fila
			var PREFIJO_LOG = 'RTAB: ';
			moduloDebug.info(PREFIJO_LOG+'renderizarTabla');
			var estadoI = extraerTextoEstructurado(div);
			div.empty();
			var LLAVE_VERSION_TABLA = 'tabla_version';
			if (!utilidades.hayValor(div.data(LLAVE_VERSION_TABLA))) {
				div.data(LLAVE_VERSION_TABLA, 0);
			}

			var erroresActuales = [];
			if (!utilidades.esLista(div.data('reporte_errores'))) {
				div.data('reporte_errores', []);
			}

			var base = $('<table><thead></thead><tbody></tbody></table>');
			var encabezado = base.find('thead');
			var cuerpo = base.find('tbody');
			//base.addClass("");

			var darTooltipNegativoCelda = function(miFila, nFil, nCol, miCelda, texto) {
				var explicaciones = miFila['exp'];
				if (!esLista(explicaciones)) {
					return;
				}

				var hayError = function(explicacion) {
					var condicion = explicacion['cond'];
					if (hayValorTexto(condicion)) {
						//se debe ejecutar la condición especial
						condicion = agregarIndices(condicion, 'i', nFil);
						condicion = agregarIndices(condicion, 'j', nCol);
						var resExp = eventos.evaluarExp(condicion);
						moduloDebug.info(condicion+'=>'+resExp);
						return resExp;
					} else {
						if (/(-).*(\d+)/ig.test(texto)) {
							return true;
						}
						return false;
					}
				};
				for (var i=0; i<explicaciones.length; i++) {
					var explicacion = explicaciones[i];
					if (explicacion['cols'].indexOf(nCol) >= 0) {
						var conError = hayError(explicacion);
						if (!conError) {
							continue;
						}
						var claseError = explicacion['clase'];
						if (hayValorTexto(claseError)) {
							miCelda.addClass(claseError);
						}

						var claseGrupo = explicacion['grupo'];
						if (erroresActuales.indexOf(claseGrupo) < 0) {
							erroresActuales.push(claseGrupo);
						}
						miCelda.addClass('manito');
						miCelda.attr('data-grp-err', claseGrupo);
						miCelda.attr('data-toggle', 'tooltip');
						miCelda.attr('title', explicacion['msg']);
						break;
					}
				}
			};

			//Itero las filas
			for (var i=0; i<filas.length; i++) {
				var miFila = filas[i];
				var fila = $('<tr></tr>');
				if (hayValor(miFila['clase'])) {
					fila.addClass(miFila['clase']);
				}
				if (i%2 == 0) {
					fila.addClass('fpar');
				} else {
					fila.addClass('fipar');
				}
				for (var j=0; j<columnas.length; j++) {
					var miColumna = columnas[j];
					var columna;
					if (i==0) {
						//El encabezado
						columna = $('<th><div></div></th>');
						columna.find('div').html(miColumna['titulo']);
						if (utilidades.hayValorTexto(miColumna['clases'])) {
							columna.addClass(miColumna['clases']);
						}
					} else {
						//El cuerpo
						columna = $('<td><div></div></td>');
						if (utilidades.hayValorTexto(miColumna['clasesBody'])) {
							columna.addClass(miColumna['clasesBody']);
						}
						if (j==0) {
							columna.find('div').html(miFila['titulo']);
							//columna.addClass('si_diccionario');//Lorena pidió que no se vea el diccionario en las tablas
							if (utilidades.hayValor(miFila['indent'])) {
								columna.addClass('indentar-'+miFila['indent']);
							}
						} else {
							
						}
					}
					if (j==0) {
						columna.addClass('headcol');
					}
					fila.append(columna);
					if (i>0 && j>0){
						var miCelda = columna.find('div');
						var texto = eventos.columna(i-1, j-1, miFila['modelo']);
						miCelda.html(texto);
						//Agregar errores posibles de rojos
						darTooltipNegativoCelda(miFila, i-1, j-1, miCelda, texto);
					}
				}
				if (i==0) {
					encabezado.append(fila);
				} else {
					cuerpo.append(fila);
				}
				if (utilidades.esFuncion(eventos.fila)) {
					eventos.fila(i, fila, miFila);
				}
			}

			var primeraColumna = base.find('.headcol');
			var divScroll = $('<div class="scrollx"></div>');
			divScroll.append(base);
			div.append(divScroll);

			var misTooltips = div.find('[data-toggle="tooltip"]');
			var misTooltipsPrimeros = [];

			var tablaPos = base.offset();

			var corregirTooltipsArrow = function() {
				$('.tooltip-arrow').removeAttr('style');
			};

			divScroll.bind('scroll', function() {
				var valor = divScroll.scrollLeft();
				primeraColumna.css({'left': valor+'px'});
				//Debo afectar todos los elementos que tienen algún tooltip
				var tam = misTooltipsPrimeros.length;
				for (var i=0; i<tam; i++) {
					$(misTooltipsPrimeros[i]).tooltip('show');
				}
				corregirTooltipsArrow();
			});

			//Se buscan las columnas diferentes
			var clases;
			//clases = ['shake-constant', 'shake-slow', 'dato_cambiado'];
			//clases = ['shake-constant', 'shake-vertical', 'dato_cambiado'];
			clases = ['dato_cambiado'];

			//Incremento la versión de la tabla
			var nuevaVersion = div.data(LLAVE_VERSION_TABLA)+1;
			div.data(LLAVE_VERSION_TABLA, nuevaVersion);
			div.attr('version_t', nuevaVersion);
			//Se activan todas las clases necesarias
			
			var erroresNuevos = erroresActuales.diff(div.data('reporte_errores'));
			setTimeout(function() {
				try {
					moduloDebug.info(PREFIJO_LOG+'Activar tooltips!');
					//Se activan los tooltips
					misTooltips.each(function() {
						var divCelda = $(this);
						divCelda.tooltip({
						'trigger': 'manual hover', 
						//'container': div.find('.scrollx')[0], 
						'container': divCelda[0], 
						'viewport': '.scrollx',
						'html': true,
						});
					});

					//Al cerrar un grupo de tooltips, cierro los del mismo grupo
					var desactivarDespuesDeHover = function() {
						misTooltips.on('hidden.bs.tooltip', function () {
							var indice;
							var miGrupo = $(this).attr('data-grp-err');
							var temp = div.find('[data-grp-err="'+miGrupo+'"][aria-describedby]:not(:hover)');
							indice = misTooltipsPrimeros.indexOf(this);
							if (indice >= 0) {misTooltipsPrimeros.splice(indice, 1);}
							if (misTooltipsPrimeros.length > 0) {
								var selector = '[data-grp-err="'+miGrupo+'"][aria-describedby]';
								var otros = div.find(selector);
								otros.each(function(k, elem) {
									indice = misTooltipsPrimeros.indexOf(this);
									if (indice >= 0) {misTooltipsPrimeros.splice(indice, 1);}
								});
							}
							temp.tooltip('hide');
						});
					};

					desactivarDespuesDeHover();

					if (erroresNuevos.length > 0) {

						//Se muestran automáticamente los errores rojos!
						for (var j=0; j<erroresNuevos.length; j++) {
							var unGrupo = erroresNuevos[j];
							var primero = div.find('[data-grp-err="'+unGrupo+'"].rojo').first();
							if (primero.length > 0) {
								primero.tooltip('show');
								misTooltipsPrimeros.push(primero[0]);
							}
						}
						corregirTooltipsArrow();
						moduloDebug.info(PREFIJO_LOG+'misTooltipsPrimeros.length', misTooltipsPrimeros.length);

						//Apago todos a los 10 segundos...
						setTimeout(function() {
							if (nuevaVersion == div.data(LLAVE_VERSION_TABLA)) {
								for (var i=0; i<misTooltipsPrimeros.length; i++) {
									$(misTooltipsPrimeros[i]).tooltip('hide');
								}
								misTooltipsPrimeros = [];
							}
						}, 10000);
					}
				} catch (e) {
					console.error(e);
				}
			}, 0);

			div.data('reporte_errores', erroresActuales);
			resaltarDatosDiferentes(div, estadoI, clases, {ignorarColumnas:[0], ignorarFilas: [0]});
		};

		var asignarPredefinidosTablas = function(dato, listaPredefinidos, prefijo) {
			var PREDEFINIDOS = {};

			for (var i=0; i<listaPredefinidos.length; i++) {
				var llave;
				llave = prefijo+'.'+listaPredefinidos[i]+'.Meses';
				PREDEFINIDOS[llave] = [];
				llave = prefijo+'.'+listaPredefinidos[i]+'.Anios';
				PREDEFINIDOS[llave] = [];
			}

			var llavesPred = Object.keys(PREDEFINIDOS);
			for (var i=0; i<llavesPred.length; i++) {
				var llave = llavesPred[i];
				var valor = PREDEFINIDOS[llave];
				if (leerObj(dato, llave, undefined) == undefined) {
					//console.log('Asignando predefinido para ', llave);
					utilidades.asignarObj(dato, llave, valor);
				}
			}
		};

		var darAnchoTexto = function(texto, fontSize, callback) {
			if (!hayValorTexto(texto)) {
				callback(0);
				return;
			}
			var test = $('<p class=""><span style="font-size:'+fontSize+'px !important; font-family: Arial, Sans-serif !important;">a</span></p>');
			$('body').append(test);
			var span = test.find('span');
			span.text(texto);
			setTimeout(function() {
				var ancho = span.width();
				test.remove();
				callback(ancho+6);
			}, 0);
		};

		var actualizarAchoInput = function(esteInput) {
			var params = {
				'min': 40,
				'font': 14,
				'pad': 0,
			};
			//Debo calcular el tamanio necesario según los textos
			darAnchoTexto(esteInput.val(), params.font, function(ancho) {
				var maximo = Math.max(params.min, ancho+(2*params.pad));
				esteInput.css({'max-width': maximo+'px', 'min-width': maximo+'px', 'width': maximo+'px'});
			});
		};

		var normalizarRuta = function(a) {
			a = a.trim();
			a = a.toLowerCase();
			a = a.replace(/\?.*$/g, '');//Quito los query params
			a = a.replace(/^\s*(https?:\/\/)/g, '');
			a = a.replace(/\/\s*$/g, '');

			return a;
		};

		//Compara dos rutas url
		var sonRutasIguales = function(a, b) {
			if (!hayValorTexto(a) || !hayValorTexto(b)) {
				return (a == b);
			}
			var inicio = normalizarRuta(WP_RAIZ);
			a = normalizarRuta(a);
			b = normalizarRuta(b);

			//Se quita el inicio
			if (a.startsWith(inicio)) {
				a = a.substring(inicio.length);
			}
			if (b.startsWith(inicio)) {
				b = b.substring(inicio.length);
			}
			if (a == '') {
				a = '/'+darRutaHome();
			}
			if (b == '') {
				b = '/'+darRutaHome();
			}

			//se debe agregar el tema del home
			return (a == b);
		};

		var darRutaHome = function() {
			//Buscar saar este dato de WordPress
			return 'estado-de-perdidas-y-ganancias';
		};

		var shuffle = function (array) {
		  var currentIndex = array.length, temporaryValue, randomIndex;

		  // While there remain elements to shuffle...
		  while (0 !== currentIndex) {

		    // Pick a remaining element...
		    randomIndex = Math.floor(Math.random() * currentIndex);
		    currentIndex -= 1;

		    // And swap it with the current element.
		    temporaryValue = array[currentIndex];
		    array[currentIndex] = array[randomIndex];
		    array[randomIndex] = temporaryValue;
		  }

		  return array;
		};

		//jQuery('*').highlight('costos', {class: 'midiccionario'});
		$.fn.highlight = function (word, options) {
			var option = $.extend({
				//background: "#ffff00",
				background: false,
				//color: "#000",
				color: false,
				bold: false,
				class: "",
				ignoreCase: true,
				wholeWord: true,
				tipo: 'SPAN',//Debe ser en mayúscula
				log: false,
			}, options);
			var findCnt = 0;

			if(this.length == 0){
				//throw new Error('Node was not found')
				return;
			}

			var $el = $('<'+option.tipo+'></'+option.tipo+'>');
			if (option.color) {
				$el.css({color: option.color});
			}
			if(option.bold){
				$el.css("font-weight", "bold");
			}
			if(option.background != ""){
				$el.css("background", option.background);
			}
			if(option.class != ""){
				$el.addClass(option.class);
			}

			var palabraReal = word;
			if(option.wholeWord){
				//var palabraReal = escapeRegExp(word);
				palabraReal = "\\b"+palabraReal+"\\b\\s*";
			}
			var re = new RegExp(palabraReal, option.ignoreCase == true ? 'gi':'g');

			this.each(function() {
				var nombreTag = this.tagName;
				var temp = $(this);
				if (nombreTag == 'A' || nombreTag == 'IFRAME' || nombreTag == 'SCRIPT' || nombreTag == 'INPUT') {return;}//Los que definitivamente no deben tener enlace...

				if (!temp.hasClass(option.class) && !temp.hasClass('nodicci') && temp.closest('.nodicci').length == 0) {
					//Para que no vuelva a recrear sobre el mismo
					var listaContenido = temp.contents();
					listaContenido.replaceWith(function(a, b) {
						var temp2 = $(this);
						//console.log('this', this.textContent);
						if ('#text' == this.nodeName) {
							//Acá se debe validar si el texto corresponde a algo que debe tener el span
							var content = this.textContent;
							if (content.trim().length == 0) {
								return temp2;
							}
							var nuevo = content.replace(re, function(t) {
								//findCnt++;
								var tam = t.length;
								t = t.trim();
								var diff = (tam - t.length);
								$el.attr('data-patron', word);
								$el.html(t);
								var respuesta = $el.get(0).outerHTML;
								//console.log('respuesta', respuesta, 'diff', diff);
								if (diff > 0) {
									respuesta = respuesta+Array(diff+1).join('&nbsp;');
									//console.log('respuesta', respuesta);
								}
								return respuesta;
							});
							//Retorna un texto
							//console.log(nuevo);
							return nuevo;
						} else {
							return temp2;
						}
					});
				}
			});
			return findCnt;

			function escapeRegExp(string){
				return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
			}
		};

		var darRaizApi = function() {
			var RAIZ_SRV = window.location.origin;

			if (/localhost/ig.test(RAIZ_SRV)) {
				RAIZ_SRV+='/wordpress/';
			} else {
				RAIZ_SRV+='/';
			}

			return RAIZ_SRV+"wp-json/util/v1";
		};

		var SCRIPTS_CARGADOS = {};

		var agregarScript = function(urlScript) {
			var diferido = $.Deferred();	
			if (urlScript instanceof Array) {
				var listaDiferidos = [];

				var indice = 0;
				var funcionRecursivaAgregarScript = function() {
					agregarScript(urlScript[indice]).promise().then(function() {
						indice++;
						if (indice == urlScript.length) {
							diferido.resolve();
						} else {
							funcionRecursivaAgregarScript();
						}
					});
				};

				funcionRecursivaAgregarScript();

				return diferido;
			} else {
				var rutaCompleta = WP_THEME_URI+urlScript;
				if (rutaCompleta in SCRIPTS_CARGADOS) {
					return SCRIPTS_CARGADOS[rutaCompleta];
				}
				SCRIPTS_CARGADOS[rutaCompleta] = diferido;
				$.getScript(rutaCompleta).then(function() {
					diferido.resolve();
				});
				return diferido;
			}
		};

		var exportarTabla = function(jTabla, tipo, nombreArchivo) {
			//console.log('exportarTabla', jTabla, tipo, nombreArchivo);

			var copiaTabla = $($('<div>').append(jTabla.clone()).html());

			var funcionLimpieza = function(i, elem) {
				var temp = $(elem);
				var dato = temp.text();
				dato = dato.replace(/[$\.,']/ig, '');
				dato = dato.replace(/(año )/ig, 'A');
				dato = dato.trim();
				temp.attr('class', null);
				if (dato == '-') {
					dato = '0';
				}

				temp.html(dato);
			};

			copiaTabla.find('td').each(funcionLimpieza);
			copiaTabla.find('th').each(funcionLimpieza);
			//console.log(copiaTabla.html());
			copiaTabla.addClass('invisible');
			$('body').append(copiaTabla);
			
			TableExport.prototype.charset = "charset=utf-8";
			TableExport.prototype.defaultFilename = nombreArchivo;
			if (copiaTabla.find('.tableexport-caption').length == 0) {
				var exportador = copiaTabla.tableExport({ "buttons": false });
			}
			copiaTabla.find('.tableexport-caption').css({display: 'none'});
			copiaTabla.find('.tableexport-caption button.'+tipo).click();
			
		};

		var PREFIJO_CLASE_EXPORTAR_PDF = 'exportar_indicadores_pdf_';
		var PREFIJO_CLASE_EXPORTAR_EXCEL = 'exportar_excel_';

		var metadataGenerica = function(datos, prefijo) {
			if (!hayValorTexto(prefijo)) {
				prefijo = '';
			}
			var texto = JSON.sortify(datos);
			var mibase64 = btoa(texto).replaceAll('=', '');
			var resultado = prefijo+mibase64;
			var prueba = atob(mibase64);
			console.log('ok?', prueba == texto);
			return resultado;
		};

		var metadataPdf = function(clase, nombreArchivo) {
			return metadataGenerica({c: clase, t: nombreArchivo}, PREFIJO_CLASE_EXPORTAR_PDF);
		};

		var metadataExcel = function(clase, nombreArchivo) {
			return metadataGenerica({c: clase, t: nombreArchivo}, PREFIJO_CLASE_EXPORTAR_EXCEL);
		};

		var diferidoPdfExcelConfigurados = $.Deferred();

		var hechoPdfExcelConfigurados = function() {
			return diferidoPdfExcelConfigurados.promise();
		};

		var darMetadataDeClase = function(elemento, prefijoClase) {
			var clases = elemento.attr('class');
			var patron = new RegExp('('+prefijoClase+')(\\S*)', 'ig');
			var grupos;
			var metadata = [];
			while((grupos = patron.exec(clases)) != null) {
				metadata.push(JSON.parse(atob(grupos[2])));
			}
			return metadata;
		};

		$(document).ready(function() {

			//Activar los exportar
			var libreriasPDF = ['/js/jspdf.min.js', '/js/html2canvas.min.js'];

			var createCanvas = function(width, height) {
			    var canvas = document.createElement('canvas');
			    canvas.width = width;
			    canvas.height = height;
			    return canvas;
			};

			var agregarEncabezado = function(opciones) {
				var URL_LOGO = WP_THEME_URI+opciones.url;
				var diferido = $.Deferred();

				var image = new Image();
				image.onload = function() {
					if (image.width > 0) {
						opciones.w = image.width;
					}
					if (image.height > 0) {
						opciones.h = image.height;
					}
					var canvas = createCanvas(opciones.w, opciones.h);
					var contexto = canvas.getContext("2d");
				    contexto.drawImage(image, 0, 0);
				    setTimeout(function() {
					    var imgData = canvas.toDataURL('image/jpeg');
					    var temp = {'src': imgData, 'w': canvas.width, 'h': canvas.height};
					    $.extend(true, temp, opciones);
					    diferido.resolve(temp);
				    });
				};
				image.src = URL_LOGO;
				return diferido.promise;
			};

			var funcionFinCarguePDF = function(metadata) {
				var diferidoGlobal = moduloActividad.on();
				//console.log(metadata);
				//Luego lo pongo en el pdf fit

				var tablasResponsive = null;

				var quitarResponsive = function(funFinal) {
					tablasResponsive = $('.mi-table-responsive');
					var miScroll = tablasResponsive.find('.scrollx');
					miScroll.scrollLeft(0);
					tablasResponsive.removeClass('mi-table-responsive');
					setTimeout(funFinal, 0);
				};

				var restaurarResponsive = function() {
					tablasResponsive.addClass('mi-table-responsive');
				};

				if (!metadata instanceof Array) {
					metadata = [metadata];
				}

				$.each(metadata, function(k, dato) {
	                quitarResponsive(function() {
						var listaDiferidos = [];

						//Agrego el encabezado
						listaDiferidos.push(agregarEncabezado({'url':'/img/encabezadoDocPanalLandsCape.jpg', 'w': 1601, 'h': 216}));

						$(dato.c).each(function(i, elem) {
							//Itero y convierto a imagen todo
							var diferido = $.Deferred();
							listaDiferidos.push(diferido.promise);
					  		var promesaHtml2Canvas = html2canvas(elem, {
					  			//scale: 4,
					  			background: '#FFFFFF',
					  			scale: 2,
					        });

					        promesaHtml2Canvas.then(function(canvas) {
					            var imgData = canvas.toDataURL('image/jpeg');
					            diferido.resolve({'src': imgData, 'w': canvas.width, 'h': canvas.height});
							});
						});

						$.when(all(listaDiferidos)).then(function(datos) {
							restaurarResponsive();
							var doc;
							//Se debe identificar si el contenido es más ancho que alto o al revés.
							var ANCHO_TEST = 100;
			                //el 3% es el margen izquierdo y derecho
			                var PORCENTAJE_MARGEN_H = 0.075;
			                //el 5% es el margen superior
			                var PORCENTAJE_MARGEN_V = 0.075;

			                var TAMANIO_PAGINA_LANDSCAPE = [297, 210];

							var sumaAnchos = ANCHO_TEST;
							var sumaAltos = 0;
							for (var i=0; i<datos.length; i++) {
								var imgData = datos[i];
								var pw = imgData.pw;
								if (typeof pw !== 'number') {
									pw = 1;
								}
								var proporcion = (pw*ANCHO_TEST/imgData.w);
								var altura = imgData.h*proporcion;
								sumaAltos+=altura;
							}
							var proporcionMedida = sumaAnchos/sumaAltos;
							var proporcionPagina = TAMANIO_PAGINA_LANDSCAPE[0]/TAMANIO_PAGINA_LANDSCAPE[1];
							//console.log('proporcionMedida', proporcionMedida, 'proporcionPagina', proporcionPagina);
							if (proporcionMedida < proporcionPagina) {
								//vertical
								var TAMANIO_PAGINA_PORTRAIT = utilidades.copiarJSON(TAMANIO_PAGINA_LANDSCAPE).reverse();
								doc = new jsPDF('p', 'mm', TAMANIO_PAGINA_PORTRAIT); //210mm wide and 297mm high
							} else {
								//horizontal
								doc = new jsPDF('l', 'mm', TAMANIO_PAGINA_LANDSCAPE);
							}

			                var anchoPagina = doc.internal.pageSize.width;

			                var margenH = PORCENTAJE_MARGEN_H*anchoPagina;
			                var width = (1-2*PORCENTAJE_MARGEN_H)*anchoPagina;
							var height = doc.internal.pageSize.height;
							var posicionAltura = height*PORCENTAJE_MARGEN_V;
							for (var i=0; i<datos.length; i++) {
								var imgData = datos[i];
								//console.log(JSON.stringify(imgData));
								var pw = imgData.pw;
								if (typeof pw !== 'number') {
									pw = 1;
								}
								var proporcion = (pw*width/imgData.w);
								var altura = imgData.h*proporcion;
								//console.log(width, altura);
			                	doc.addImage(imgData.src, 'JPEG', margenH, posicionAltura, width*pw, altura);
								posicionAltura+=altura;
							}
							
			                doc.save(dato.t);
			                diferidoGlobal.resolve();
						});
					});
				});
			};

			var validarExistenciaLibreriaExcel = function() {
				var diferido = $.Deferred();

				var funcionInternaValidacionLibExcel = function() {
					var temp = $('<div></div>').tableExport;
					if (typeof temp == 'function') {
						diferido.resolve();
					} else {
						setTimeout(funcionInternaValidacionLibExcel, 500);
					}
				};

				funcionInternaValidacionLibExcel();

				return diferido;
			};

			var libreriasExcel = ['/js/xlsx.core.min.js', '/js/FileSaver.min.js', '/js/tableexport.min.js'];
			var funcionFinCargueExcel = function(metadata) {
				//console.log(metadata);
				var diferidoGlobal = moduloActividad.on();
				setTimeout(function() {
					if (!metadata instanceof Array) {
						metadata = [metadata];
					}
					validarExistenciaLibreriaExcel().then(function() {
						for (var i=0; i<metadata.length; i++) {
							exportarTabla($(metadata[i].c), 'xlsx', metadata[i].t);
						}
						diferidoGlobal.resolve();
					});
				}, 0);
			};

			var funcionComunExportar = function(prefijo, librerias, callback) {
				var unDiferido = $.Deferred();
				var botones = $("div[class^='"+prefijo+"'],div[class*=' "+prefijo+"'],section[class^='"+prefijo+"'],section[class*=' "+prefijo+"']");
				if (botones.length > 0) {
					agregarScript(librerias).promise().then(function() {
						console.log('Scripts para exportar '+prefijo+' cargados exitosamente');
						botones.each(function(i, elem) {
							try {
								var temp = $(elem);
								var metadata = darMetadataDeClase(temp, prefijo);
								if (!esWpAdmin()) {
									var sensor;
									sensor = temp.find('.fa-print').closest('li');
									if (sensor.length == 0) {
										sensor = temp;
									}
									sensor.bind('click', function() {
										callback(metadata);
									});
								}
							} catch (e) {
								console.error('Reconfigurar botón para exportar.');
							}
						});
						unDiferido.resolve();
					});
				} else {
					unDiferido.resolve();
				}
				return unDiferido;
			};

			var diferido1 = funcionComunExportar(PREFIJO_CLASE_EXPORTAR_PDF, libreriasPDF, funcionFinCarguePDF);
			var diferido2 = funcionComunExportar(PREFIJO_CLASE_EXPORTAR_EXCEL, libreriasExcel, funcionFinCargueExcel);

			$.when(all([diferido1.promise, diferido2.promise])).then(function(datos) {
				diferidoPdfExcelConfigurados.resolve();
			});
		});

		var eliminarDuplicados = function(arr){
		    var unique_array = arr.filter(function(elem, index, self) {
		    	var unico = (index == self.indexOf(elem));
		        return unico;
		    });
		    return unique_array
		};

		var eliminarTextosVacios = function(arr){
		    var unique_array = arr.filter(function(elem, index, self) {
		        return (hayValorTexto(elem));
		    });
		    return unique_array
		};

		var aplanarLista = function(lista) {
			//console.log('aplanarLista '+JSON.stringify(lista));
			var listaDestino = [];
			for (var i=0; i<lista.length; i++) {
				var elem = lista[i];
				if (elem instanceof Array) {
					var temp = aplanarLista(elem);
					//Acá se concatena
					for (var j=0; j<temp.length; j++) {
						listaDestino.push(temp[j]);
					}
				} else {
					listaDestino.push(elem);
				}
			}
			listaDestino = eliminarDuplicados(listaDestino);
			//console.log('Retornando '+JSON.stringify(listaDestino));
			return listaDestino;
		};

		//macro = existentes
		var listaContieneLista = function(requeridos, macro, aplanarListas, sufijo) {
			if (aplanarListas === true) {
				requeridos = aplanarLista(requeridos);
				macro = aplanarLista(macro);
			}
			var interseccion = requeridos.filter(function(value) {
				return (macro.indexOf(value) >= 0);
			});
			var respuesta = (interseccion.length === requeridos.length);
			if (moduloDebug.esDebug()) {
				var diferencia = requeridos.diff(interseccion);
				console.log('requeridos:'+JSON.stringify(requeridos));
				console.log('evaluado:'+JSON.stringify(macro));
				if (!hayValorTexto(sufijo)) {
					sufijo = '';
				}
				console.log('ok? '+sufijo+' '+respuesta+' faltantes:'+JSON.stringify(diferencia, null, 4));
			}
			return respuesta
		};

		var ajustarTamanioPantalla = function() {
			$(window).trigger('resize');
			setTimeout(function() {
				$(window).trigger('resize');
			});
		};

		var ajustarFilasVisiblesTablas = function(refContTabla, filasPyG) {
			moduloEnrutador.leerAvanceCheck(true).then(function(partes) {
				//Se deben iterar todas las filas y contrastarlas con el requerimiento de la fila
				refContTabla.find('tbody tr').each(function(i, elem) {
					var miFila = $(elem);
					miFila.removeClass('fila_terminada');
					miFila.removeClass('fila_no_terminada');
					miFila.removeClass('fila_actual');
					miFila.removeClass('antes_de_fila_actual');
					var metadata = filasPyG[i+1];
					var requerimiento = metadata.prerrequisitos;
					requerimiento = moduloEnrutador.aplicarExcepcionPrerrequisitosRuta(null, requerimiento);
					var actual = metadata.actual;
					var rutaActual = moduloEnrutador.leerEstadoDeRutaActual();
					if (requerimiento instanceof Array) {
						//Se valida que la intersección sea completa
						if (utilidades.listaContieneLista(requerimiento, partes)) {
							miFila.addClass('fila_terminada');
							/*if (requerimiento.indexOf(rutaActual) >= 0) {
								miFila.addClass('fila_actual');
							}*/
						} else {
							miFila.addClass('fila_no_terminada');
						}
					}
					if (actual instanceof Array) {
						//Se valida que exista 
						if (actual.indexOf(rutaActual) >= 0) {
							miFila.addClass('fila_actual');
							miFila.removeClass('fila_no_terminada');
						}
						if (actual.length > 0) {
							miFila.find('td').first().addClass('hover_underline');
							miFila.find('td').first().bind('click', function() {
								moduloEnrutador.go(moduloEnrutador.estadoToUrl(actual[0]));
							});
							miFila.find('td').first().addClass('manito');
						}
					}
					ajustarTamanioPantalla();
				});
				refContTabla.find('tbody tr.fila_actual').prevAll().addClass('antes_de_fila_actual');
			});
		};

		var banderaActivacion = false;
		var activarTablaFlotante = function() {
			//console.log('activarTablaFlotante');
			var diferido = $.Deferred();
			//No se permite tabla flotante en esta página
			if ([
				'proyecciones-check',
				'estado-de-perdidas-y-ganancias',
				'balance-general',
				'flujo-de-caja',
				].estaEnLista(moduloEnrutador.leerEstadoDeRutaActual())) {
				//console.log('activarTablaFlotante resuelto false');
				diferido.resolve(false);
				return diferido;
			}
			if (banderaActivacion === true) {
				//console.log('activarTablaFlotante resuelto true ya se hizo o está en curso');
				var yaHayFunciones = (typeof jQuery('.tabla_flotante').data('flotanteOffBasico') == 'function');
				diferido.resolve(yaHayFunciones);
				return diferido;
			}
			banderaActivacion = true;
			var myWin = $(window);

			$(document).ready(function() {
				//console.log('activarTablaFlotante inicio');
				var GAP_BASICO = 10;
				var FACTOR_VISIBLE = 0.7;//1 permite siempre ver la tabla

				var leerEstadoPantalla = function() {
					var estado = {};
					estado['wh'] = window.innerHeight;
					estado['ww'] = window.innerWidth;
					return estado;
				};

				setTimeout(function() {
					var miEncabezado = $('.pmoney.encabezado');
					var myAdminBar = $('#wpadminbar');

					if (miEncabezado.length == 0) {
						miEncabezado = null;
					}
					if (myAdminBar.length == 0) {
						myAdminBar = null;
					}
					var alturaAdminBar = 0;
					var alturaEncabezado = 0;
					var GAP_COMPLETO = 0;
					var offsetTopInicial = 0;
					var offsetTopInicialSeccionAnterior = 0;
					var altura1 = 0;
					var altura2 = 0;

					$('.tabla_flotante').each(function(i, elem1) {
						var tabla = $(elem1);
						var seccion = tabla.closest('section');
						var seccionAnterior = seccion.prev();
						var estadoParametros = null;

						var onBasico = function(clase) {
							seccion.removeClass(clase);
							seccionAnterior.removeClass(clase);
						};

						var offBasico = function(clase) {
							seccion.addClass(clase);
							seccionAnterior.addClass(clase);
						};

						var on = function() {
							onBasico('tabla_no_flotante');
						};

						var off = function() {
							offBasico('tabla_no_flotante');
						};

						tabla.data('flotanteOn', on);
						tabla.data('flotanteOff', off);
						tabla.data('flotanteOnBasico', onBasico);
						tabla.data('flotanteOffBasico', offBasico);

						var estadoInicial = function() {
							seccion.css({'position': null, 'top': 0});
							seccionAnterior.css({'position': null, 'top': 0});

							seccion.removeClass('tabla_al_frente');
							seccionAnterior.removeClass('tabla_al_frente');

							//Podría agregar la clase tabla_no_flotante para impedir el efecto flotante
						};

						var estadoScroll = function(diff) {
							seccion.css({'position': 'relative', 'top': diff});
							seccionAnterior.css({'position': 'relative', 'top': diff});

							seccion.addClass('tabla_al_frente');
							seccionAnterior.addClass('tabla_al_frente');

							//Podría quitar la clase tabla_no_flotante para impedir el efecto flotante	
						};

						var hayNuevoEstado = function(asignar) {
							var nuevoEstado = leerEstadoPantalla();
							var nuevoEstadoTexto = JSON.sortify(nuevoEstado);
							if (JSON.sortify(estadoParametros) != nuevoEstadoTexto) {
								if (asignar) {
									estadoParametros = nuevoEstado;
								}
								return true;
							}
							return false;
						};

						var capturarParametros = function() {

							if (tabla.find('table').length == 0) {
								//console.log('flotante: no hay tabla');
								return;
							}

							if (!hayNuevoEstado(true)) {
								//console.log('flotante: el tamaño de la pantalla no ha cambiado');
								return;
							}
							//Realmente ha cambiado el tamaño de la pantalla
							window.scrollTo(0, 0);
							//console.log('capturarParametros '+JSON.sortify(estadoParametros));
							estadoInicial();
							setTimeout(function() {
								//Se deben capturar los parámetros
								if (miEncabezado != null) {
									alturaEncabezado = miEncabezado.outerHeight();
								}
								if (myAdminBar != null) {
									alturaAdminBar = myAdminBar.outerHeight();
								}
								GAP_COMPLETO = (GAP_BASICO + alturaAdminBar + alturaEncabezado);
								offsetTopInicial = seccion.offset().top;
								offsetTopInicialSeccionAnterior = seccionAnterior.offset().top;
								altura1 = seccion.outerHeight();
								altura2 = seccionAnterior.outerHeight();
								setTimeout(function() {
									if (hayNuevoEstado(false)) {
										//console.log('flotante: toca esperar a volver a capturar los parámetros porque el tamaño de pantalla cambió');
										return;
									}
									ajustar();
								}, 0);
							}, 0);
						};

						var ajustar = function() {
							if (estadoParametros == null) {
								//console.log('flotante: espera primero capturar parámetros');
								return;
							}
							//console.log('ajustar');
							var scroll = myWin.scrollTop();
							//console.log('ajustar scroll '+scroll);
							if (scroll == 0) {
								estadoInicial();
								return;
							}

							if (FACTOR_VISIBLE*window.innerHeight > (altura1 + altura2)) {
								var distancia = offsetTopInicial - scroll;
								var distanciaSeccionAnterior = offsetTopInicialSeccionAnterior - scroll;
								if (distanciaSeccionAnterior <= GAP_COMPLETO) {
									//Se deben mover, ¿cuánto?
									var diff = (GAP_COMPLETO - distanciaSeccionAnterior);
									if (diff > 0) {
										estadoScroll(diff);
									}
								}
							}

						};
					    setTimeout(function() {
					    	//console.log('activarTablaFlotante timeout 2');
							window.scrollTo(0, 0);
							//$(window).on("load", function() {
								//console.log('activarTablaFlotante load');
								window.scrollTo(0, 0);
								setTimeout(function() {
									//console.log('activarTablaFlotante timeout 3');
									capturarParametros();
									$(window).on("resize", capturarParametros);
									$(window).on("scroll", ajustar);
									//console.log('activarTablaFlotante resuelto true ok');
									diferido.resolve(true);//Esto podría ponerse antes...
								});
							//});
					    }, 0);
					});
				});
			});

			return diferido;
		};

		var esMovil = function() {
			//Depende del ancho en el archivo theme-pmoney-movil.css
			if ($( window ).innerWidth() < 768) {
				return true;
			}
			return false;
		};

		var llenarSelectRango = function(elSelect, llaves, valores, nZeros, vacio) {
			elSelect.empty();
			if (vacio === true) {
				elSelect.append($('<option value=""></option>'));
			}
			for (var i=0; i<llaves.length; i++) {
				var llave = llaves[i];
				var valor = valores[i];
				var opcion = $('<option value=""></option>');
				if (typeof nZeros == 'number') {
					llave = fillZeros(llave, nZeros);
				}
				opcion.attr('value', llave);
				opcion.text(valor);
				elSelect.append(opcion);
			}
		};

		var fillZeros = function(numero, nZeros) {
			var txtZ = new Array(nZeros).fill('0').join('');
			return (txtZ+numero).slice(-1*nZeros);
		};

		var darPatronOtros = function() {
			return /^\s*otros?[\s\W]*$/ig;
		}

		var selectContieneOtros = function(elSelect) {
			var hay = null
			elSelect.find('option').each(function(i, miOpcion) {
				var jOpcion = $(miOpcion);
				var texto = jOpcion.text();
				if (darPatronOtros().exec(texto) != null) {
					hay = jOpcion;
					return false;
				}
			});
			return hay;
		};

		var selectSeleccionoOtros = function(elSelect) {
			var opcion = selectContieneOtros(elSelect);
			if (opcion == null) {
				return false;
			}
			return elSelect.val() == opcion.attr('value');
		};

		//Solo funciona si color está en el formato: "rgb(187, 242, 19)"
		var transparentize = function(color, opacity) {
			var alpha = opacity === undefined ? 0.5 : 1 - opacity;
			return Color(color).alpha(alpha).rgbString();
		};

		var activarBotonesGuardar = function() {
			var funcionGuardar = function() {
				modeloPersistente.persistir(1).promise().then(function() {
					moduloModales.notificar("Hecho!");
				});
			};
			$('.boton_guardar i.fa-save, .boton_guardar').closest('li').unbind('click');
			$('.boton_guardar i.fa-save, .boton_guardar').closest('li').bind('click', funcionGuardar);
		};

		var activarBotonesPersonalizacion = function() {
			var LLAVE_TOGGLE_VER_VIDEOS = 'Personalizacion.toogleVerVideos';
			var PREDETERMINADO_VER_VIDEOS = 'true';
			var valorActual = null;
			var opciones = {
				'true': {
					'html': '<span class="elementor-icon-list-icon"><i class="fa fa-times" aria-hidden="true"></i></span><span class="elementor-icon-list-text">Omitir videos</span>',
				},
				'false': {
					'html': '<span class="elementor-icon-list-icon"><i class="fa fa-check" aria-hidden="true"></i></span><span class="elementor-icon-list-text">Activar videos</span>',
				},
			};
			var asignarValor = function(liOrigen, valor) {
				//console.log('Asignar Valor '+LLAVE_TOGGLE_VER_VIDEOS+' '+valor);
				valorActual = valor;
				var textoHtml;
				if (!Object.keys(opciones).estaEnLista(valor)) {
					valor = PREDETERMINADO_VER_VIDEOS;//Este es el valor predeterminado
				}
				liOrigen.html(opciones[valor].html);
			};
			var funcionTogglePropiedad = function(event) {
				var liOrigen = $(event.currentTarget);
				if (valorActual == PREDETERMINADO_VER_VIDEOS) {
					valorActual = 'false';
				} else {
					valorActual = PREDETERMINADO_VER_VIDEOS;
				}
				modeloPersistente.leer('emprendimiento').set(LLAVE_TOGGLE_VER_VIDEOS, valorActual);
			};
			var elLI = $('.boton_toggle_ver_video i.fa-times').closest('li');
			elLI.unbind('click', funcionTogglePropiedad);
			elLI.bind('click', funcionTogglePropiedad);
			
			//Se debe asignar el valor inicial del modelo
			var miEmprendimiento = modeloPersistente.leer('emprendimiento');
			miEmprendimiento.getStored(LLAVE_TOGGLE_VER_VIDEOS, PREDETERMINADO_VER_VIDEOS).then(function(valor) {
				asignarValor(elLI, valor);
			});
			miEmprendimiento.on(LLAVE_TOGGLE_VER_VIDEOS, function(evento, respuesta) {
				asignarValor(elLI, respuesta);
			});
		};

		var openInNewTab = function (url) {
		  var win = window.open(url, '_blank');
		  win.focus();
		};

		var autocomplete = function (inp, tabla, funcionAsignacion, funcionConsulta) {
		  /*the autocomplete function takes two arguments,
		  the text field element and an array of possible autocompleted values:*/
		  var currentFocus;
		  /*execute a function when someone writes in the text field:*/

		  var funcionBuscarReal = function(e) {
		      var a, b, i, val = inp.value;
		      if (utilidades.esFuncion(funcionAsignacion)) {
		      	funcionAsignacion(null, null);
		      }
		      /*close any already open lists of autocompleted values*/
		      closeAllLists();
		      if (!val) { return false;}
		      currentFocus = -1;
		      /*create a DIV element that will contain the items (values):*/
		      var contenedorAutoComplete = $(inp).closest('.autocomplete');
		      if (contenedorAutoComplete.length > 0) {
		      		//console.log('Hay contenedor de autocomplete');
			      	a = document.createElement("DIV");
			      	a.setAttribute("class", "autocomplete-items autocomplete-list");
			      	/*append the DIV element as a child of the autocomplete container:*/
			      	contenedorAutoComplete[0].appendChild(a);
		      } else {
		      		//console.log('NO hay contenedor de autocomplete');
		      		a = null;
		      }

		      //Se debe hacer el llamado al servicio
		      moduloCRUD.getBasico({'url': '/search_like?q='+encodeURIComponent(val)+'&tabla='+encodeURIComponent(tabla)}).then(function(rta) {
			      /*for each item in the array...*/
			      setTimeout(function() {
			      	if (typeof fbq != 'undefined') {
			      		fbq('track', 'Search', {'search_string': val, 'content_category': tabla});
			      	}
			      }, 0);
			      var arr = [];
			      var llaves = Object.keys(rta);
			      if (a != null) {
				      for (i = 0; i < llaves.length; i++) {
				      	var llave = llaves[i];
				      	var texto = rta[llave];
				        //check if the item starts with the same letters as the text field value:
				          //create a DIV element for each matching element:
				          b = document.createElement("DIV");
				          //make the matching letters bold:
				          b.innerHTML = "";
				          b.innerHTML += texto;
				          //insert a input field that will hold the current array item's value:
				          b.innerHTML += "<input type='hidden' value='" + llave + "'>";
				          //execute a function when someone clicks on the item value (DIV element):
			              b.addEventListener("click", function(e) {
				              //insert the value for the autocomplete text field:
				              var textoVisible = $(this).text();
				              var idNoVisible = this.getElementsByTagName("input")[0].value;
				              inp.value = textoVisible;
						      if (utilidades.esFuncion(funcionAsignacion)) {
						      	funcionAsignacion(idNoVisible, textoVisible);
						      }
				              //close the list of autocompleted values, (or any other open lists of autocompleted values:
				              closeAllLists();
				          });
				          a.appendChild(b);
				      }
				  } else {
				  	if (utilidades.esFuncion(funcionConsulta)) {
				  		funcionConsulta(rta);
				  	}
				  }
		      });
		  };

		  var validarAntesDeInvocar = function(funcionDespues, args) {
		  	var val = inp.value;
		  	setTimeout(function() {
		  		if (inp.value == val) {
		  			funcionDespues(args);
		  		}
		  	}, 500);
		  };

		  inp.addEventListener("input", function(e) {
		  	validarAntesDeInvocar(funcionBuscarReal, e);
		  });
		  /*execute a function presses a key on the keyboard:*/
		  inp.addEventListener("keydown", function(e) {
		      var x = $(inp).closest('.autocomplete').find('.autocomplete-list')[0];
		      if (x) x = x.getElementsByTagName("div");
		      if (e.keyCode == 40) {
		        /*If the arrow DOWN key is pressed,
		        increase the currentFocus variable:*/
		        currentFocus++;
		        /*and and make the current item more visible:*/
		        addActive(x);
		      } else if (e.keyCode == 38) { //up
		        /*If the arrow UP key is pressed,
		        decrease the currentFocus variable:*/
		        currentFocus--;
		        /*and and make the current item more visible:*/
		        addActive(x);
		      } else if (e.keyCode == 13) {
		        /*If the ENTER key is pressed, prevent the form from being submitted,*/
		        e.preventDefault();
		        if (currentFocus > -1) {
		          /*and simulate a click on the "active" item:*/
		          if (x) x[currentFocus].click();
		        }
		      }
		  });
		  function addActive(x) {
		    /*a function to classify an item as "active":*/
		    if (!x) return false;
		    /*start by removing the "active" class on all items:*/
		    removeActive(x);
		    if (currentFocus >= x.length) currentFocus = 0;
		    if (currentFocus < 0) currentFocus = (x.length - 1);
		    /*add class "autocomplete-active":*/
		    x[currentFocus].classList.add("autocomplete-active");
		  }
		  function removeActive(x) {
		    /*a function to remove the "active" class from all autocomplete items:*/
		    for (var i = 0; i < x.length; i++) {
		      x[i].classList.remove("autocomplete-active");
		    }
		  }
		  function closeAllLists(elmnt) {
		    /*close all autocomplete lists in the document,
		    except the one passed as an argument:*/
		    $(inp).closest('.autocomplete').find('.autocomplete-items').each(function(i, elem) {
		    	if (elem != elmnt) {
		    		$(elem).remove();
		    	}
		    });
		  }
		
			/*execute a function when someone clicks in the document:*/
			document.addEventListener("click", function (e) {
			    closeAllLists(e.target);
			});

			return funcionBuscarReal;
		};

		var crearRadio = function(valor, texto, nombreGrupo) {
			console.log('crear Radio valor '+valor);
			var temp = $('<label class="mi_radio"></label>');
			var input = $('<input type="radio" value="" name="">');
			temp.text(texto);
			input.attr('value', valor);
			input.attr('name', nombreGrupo);
			temp.prepend(input);
			return temp;
		};

		var crearIndiceBuscable = function(texto, negativa) {
			texto = removerAcentosLower(texto);
			texto = texto.replace(/[^\w\s]/g, '');//Quito signos de comas, asteriscos etc
			texto = texto.replace(/[\d]/g, '');//Quito números
			texto = texto.replace(/\s+/g, ' ');//Dejo solo un espacio
			texto = texto.trim();
			var tokens = texto.split(' ');//Parto por los espacios
			var uniqueNames = [];
			$.each(tokens, function(i, el) {
			    if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
			});
			uniqueNames = uniqueNames.diff(negativa);//Quito uniones
			return uniqueNames.join(' ');
		};

		var removerAcentosLower = function(inicial) {
			inicial = inicial.toLowerCase();
			inicial = inicial.replace(/ü/g, 'u');
			inicial = inicial.replace(/ñ/g, 'n');
			inicial = inicial.replace(/á/g, 'a');
	  		inicial = inicial.replace(/á/g, 'a');
	  		inicial = inicial.replace(/é/g, 'e');
	  		inicial = inicial.replace(/í/g, 'i');
	  		inicial = inicial.replace(/ó/g, 'o');
	  		inicial = inicial.replace(/ú/g, 'u');
	  		return inicial;
		};

		var generarTokensPal = function(texto, umbral) {
			var partes = texto.split(' ');
			var res = [];
			for (var k=0; k<partes.length; k++) {
				var parte = partes[k];
				var tam = parte.length;
				if (tam >= umbral) {
					var sinacentos = removerAcentosLower(parte);
					for (var l=umbral; l<=tam; l++) {
						var temp = sinacentos.substring(0, l);
						if (res.indexOf(temp) < 0) {
							res.push(temp);
						}
					}
				}
			}
			return res;
		};


		var pegar = function(funcionFinal) {
			var puedeLeerPortapapeles = (navigator.clipboard !== undefined);
			if (puedeLeerPortapapeles) {
				navigator.clipboard.readText()
				  .then(funcionFinal)
				  .catch(function(error) {
				    moduloModales.info('Error leyendo datos del portapapeles');
				  });
			} else {
				var config = {
					title: "Pegue el texto aquí:",
					className: 'bootstrap-iso',
					inputType: 'textarea',
					callback: funcionFinal,
				};
				bootbox.prompt(config);
			}
		};

		//Cuantifica la cantidad de elementos que son iguales entre dos arreglos 
		var nInterseccion = function(l1, l2) {
			var n = 0;
			for (var i=0; i<l1.length; i++) {
				if (l2.indexOf(l1[i]) >= 0) {
					n++;
				}
			}
			return n;
		};

		var eliminarDuplicadosAvanceTexto = function(texto) {
			if (!hayValorTexto(texto)) {
				return texto;
			}
			var partes = texto.split('|');
			partes = eliminarDuplicados(partes);
			partes = eliminarTextosVacios(partes);
			return partes.join('|');
		};

		var agregarIndices = function(expresion, llave, indice) {
			var patron = new RegExp('(\\['+llave+'([\\d\\-\\+]*)\\])', 'ig');
			expresion = expresion.replace(patron, function(a, b, c) {
				if (utilidades.hayValorTexto(c)) {
					return eval(indice+c);
				} else {
					return indice;
				}
			});
			return expresion;
		};

		var escaparHtml = function(texto) {
			return $('<div>').text(texto).html();
		};

		var resaltarDropsSiHayDrags = function() {
    		var hayDragDrags = ($('[data-pdrag][data-modelo]').length > 0);
    		//alert('hayDragDrags'+hayDragDrags);
			if (hayDragDrags) {
				//Le agrego a los drops una clase más
				var drops = $('.drop_destino.drop_vacio');
				//alert('drops:'+drops.length);
				drops.addClass('resaltar_drop');
			}
		};

		var htmlDecode = function(input){
			var e = document.createElement('div');
			e.innerHTML = input;
			return e.childNodes[0].nodeValue;
		};

		var scrollBottom = function() {
			console.log('scrollBottom');
			$("html, body").animate({ 'scrollTop': $(document).height() }, 1000);
		};

		var scrollToElement = function (consulta, milis, offset) {
			if (typeof offset != 'number') {
				offset = 0;
			}
			if (typeof milis != 'number') {
				milis = 1000;
			}
			var scrollTop = $(window).scrollTop();
			var minPos = 0;
			var tablaFlotante = $('.tabla_flotante');
			if (tablaFlotante.length == 1) {
				var seccion = tablaFlotante.closest('section');
				if (!seccion.hasClass('tabla_no_flotante_definitivo')) {
					//Sí flotante
					minPos = seccion.offset().top - scrollTop + seccion.height();
				}
			}
			if (minPos == 0) {
				//La posición mínima depende de la barra superior
				var encabezado = $('.pmoney.encabezado1 > .pmoney.encabezado');
				minPos = encabezado.offset().top - scrollTop + encabezado.height();
			}
			minPos+=offset;
			var primerElementoConError = $(consulta);
			if (primerElementoConError.length > 0) {
				primerElementoConError = primerElementoConError.first();
				var scrollFinal = (primerElementoConError.offset().top - minPos - 5);
				var diferenciaAbsoluta = Math.abs(scrollFinal - scrollTop);
				//console.log('scrollFinal', scrollFinal, 'diferenciaAbsoluta', diferenciaAbsoluta);
				if (scrollFinal < 0 || (scrollFinal > scrollTop && diferenciaAbsoluta < $(window).innerHeight()*0.5)) {
					return false;
				} else {
					$('html, body').animate({scrollTop: scrollFinal}, milis);
					return true;
				}
			} else {
				return false;
			}
		};

		var genericoUnidades = function(dato) {
			var MAPA = {
				'unidad':'Unidad (es)',
				'caja':'Caja (s)',
				'conjunto':'Conjunto (s)',
				'elemento':'Elemento (s)',
				'equipo':'Equipo (s)',
				'galón':'Galon (es)',
				'gramo':'Gramo (s)',
				'kilogramo':'Kilogramo (s)',
				'kit':'Kit (s)',
				'libra':'Libra (s)',
				'litro':'Litro (s)',
				'lote':'Lote (s)',
				'metro':'Metro (s)',
				'metro-cuadrado':'Metro (s) cuadrado (s)',
				'miligramo':'Miligramo (s)',
				'mililitro':'Mililitro (s)',
				'otro':'Otro (s)',
				'paquete':'Paquete (s)',
				'par':'Par (es)',
				'pieza':'Pieza (s)',
			};
			if (!(dato in MAPA)) {
				return 'unidad (es)';
			}
			return MAPA[dato];
		};

		return {
			'is_null':is_null,
			'esNumero': esNumero,
			'esFlotante': esFlotante,
			'esFuncion': esFuncion,
			'esLista': esLista,
			'esObjeto': esObjeto,
			'copiarJSON': copiarJSON,
			'aBooleano': aBooleano,
			'hayValor': hayValor,
			'hayValorTexto': hayValorTexto,
			'leerMapaConPredefinidos': leerMapaConPredefinidos,
			'esMultilenguaje': esMultilenguaje,
			'darNumeroAleatorio': darNumeroAleatorio,
			'decimalAHex': decimalAHex,
			'darHtmlCompleto': darHtmlCompleto,
			'darHtmlSeguro': darHtmlSeguro,
			'deHtmlDarSoloTexto': deHtmlDarSoloTexto,
			'leerObj': leerObj,
			'asignarObj': asignarObj,
			'darSubrutas': darSubrutas,
			'darRutasObjeto': darRutasObjeto,
			'predefinir': predefinir,
			'procesarCondicionSi': procesarCondicionSi,
			'observarModelos': observarModelos,
			'esAdmin': esAdmin,
			'esWpAdmin': esWpAdmin,
			'validarFormulario': validarFormulario,
			'renderizarTabla': renderizarTabla,
			'asignarPredefinidosTablas': asignarPredefinidosTablas,
			'actualizarAchoInput': actualizarAchoInput,
			'normalizarRuta': normalizarRuta,
			'sonRutasIguales': sonRutasIguales,
			'darAnchoTexto': darAnchoTexto,
			'darRutaHome': darRutaHome,
			'shuffle': shuffle,
			'observarRutaActual': observarRutaActual,
			'darRaizApi': darRaizApi,
			'esPrimeraVezEnPagina': esPrimeraVezEnPagina,
			'agregarScript': agregarScript,
			'metadataGenerica': metadataGenerica,
			'metadataPdf': metadataPdf,
			'metadataExcel': metadataExcel,
			'exportarTabla': exportarTabla,
			'darMetadataDeClase': darMetadataDeClase,
			'hechoPdfExcelConfigurados': hechoPdfExcelConfigurados,
			'eliminarDuplicados': eliminarDuplicados,
			'aplanarLista': aplanarLista,
			'listaContieneLista': listaContieneLista,
			'ajustarFilasVisiblesTablas': ajustarFilasVisiblesTablas,
			'ajustarTamanioPantalla': ajustarTamanioPantalla,
			'eliminarTextosVacios': eliminarTextosVacios,
			'activarTablaFlotante': activarTablaFlotante,
			'extraerTextoEstructurado': extraerTextoEstructurado,
			'esMovil': esMovil,
			'llenarSelectRango': llenarSelectRango,
			'fillZeros': fillZeros,
			'selectContieneOtros': selectContieneOtros,
			'selectSeleccionoOtros': selectSeleccionoOtros,
			'darPatronOtros': darPatronOtros,
			'transparentize': transparentize,
			'activarBotonesGuardar': activarBotonesGuardar,
			'openInNewTab': openInNewTab,
			'activarBotonesPersonalizacion': activarBotonesPersonalizacion,
			'autocomplete': autocomplete,
			'crearRadio': crearRadio,
			'removerAcentosLower': removerAcentosLower,
			'generarTokensPal': generarTokensPal,
			'nInterseccion': nInterseccion,
			'pegar': pegar,
			'crearIndiceBuscable': crearIndiceBuscable,
			'eliminarDuplicadosAvanceTexto': eliminarDuplicadosAvanceTexto,
			'evaluarObjeto': evaluarObjeto,
			'agregarIndices': agregarIndices,
			'escaparHtml': escaparHtml,
			'resaltarDropsSiHayDrags': resaltarDropsSiHayDrags,
			'htmlDecode': htmlDecode,
			'scrollBottom': scrollBottom,
			'scrollToElement': scrollToElement,
			'genericoUnidades': genericoUnidades,
		};
	})();

}(jQuery));

//Función que permite leer con predefinidos
var leer = function(dato, predefinido) {
	if (!utilidades.hayValor(dato)) {
		return predefinido;
	}
	return dato;
};

var strEqNoCase = function(a, b) {
	var hayA = utilidades.hayValorTexto(a);
	var hayB = utilidades.hayValorTexto(b);
	if (!hayA || !hayB) {
		if (!hayA && !hayB) {
			return true;
		}
		return false;
	}
	a = a.toLowerCase(a).trim();
	b = b.toLowerCase(b).trim();
	return (a == b);
};

var leerObj = function(obj, llave, predefinido, opciones) {
	var dato = utilidades.leerObj(obj, llave, predefinido, true);
	if (!utilidades.hayValor(dato)) {
		return predefinido;
	}
	var respuesta = dato;
	if (utilidades.hayValor(opciones)) {
		if (opciones.esNumero) {
			try {
				respuesta = parseFloat(dato);
			} catch (e) {
				respuesta = predefinido;
			}
		} else if (opciones.esPorcentaje) {
			try {
				respuesta = parseFloat(dato)/100;
			} catch (e) {
				respuesta = predefinido;
			}
		} else if (opciones.esBoolean) {
			try {
				respuesta = (dato === true || dato == 1 || dato == 'true');
			} catch (e) {
				respuesta = predefinido;
			}
		}

		if (typeof opciones.decimales == 'number' && typeof respuesta == 'number') {
			try {
				respuesta = respuesta.toFixedNumber(opciones.decimales);
			} catch (e) {
				respuesta = predefinido;
			}
		}
	}

	return respuesta;
};

var copyToClipboard = function(str) {
  var el = document.createElement('textarea');  // Create a <textarea> element
  el.value = str;                                 // Set its value to the string that you want copied
  el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
  el.style.position = 'absolute';                 
  el.style.left = '-9999px';                      // Move outside the screen to make it invisible
  document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
  var selected =            
    document.getSelection().rangeCount > 0        // Check if there is any content selected previously
      ? document.getSelection().getRangeAt(0)     // Store selection if found
      : false;                                    // Mark as false to know no selection existed before
  el.select();                                    // Select the <textarea> content
  document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
  document.body.removeChild(el);                  // Remove the <textarea> element
  if (selected) {                                 // If a selection existed before copying
    document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
    document.getSelection().addRange(selected);   // Restore the original selection
  }
};

var moduloTransformacion = (function() {
	var modos = {};
	
	var esNumero = function(dato) {
		if (typeof dato == 'number') {
			return true;
		}
		if (esTexto(dato) && /^\d+[.,]?\d*$/ig.test(dato)) {
			return true;
		}
		return false;
	}
	
	var esBooleano = function(dato) {
		return (typeof dato == 'boolean');
	}
	
	var esTexto = function(dato) {
		return (typeof dato == 'string');
	}	
	
	var hayValorEnLista = function(dato) {
		if (!esLista(dato)) {
			return false;
		}
		return dato.length > 0;
	}
	
	var hayValorEnObjeto = function(dato) {
		if (!esObjeto(dato, true)) {
			return false;
		}
		return Object.keys(dato).length > 0;
	};
	
	var hayValor = function(dato) {
		if (typeof dato == 'undefined' || dato === null) {
			return false;
		}
		return true;
	};
	
	var esLista = function(dato) {
		return dato instanceof Array;
	};
	
	var esObjeto = function(dato, estricto) {
		return (dato instanceof Object && (!estricto || !esLista(dato)));
	};
	
	var esFuncion = function(dato) {
		return (typeof dato == 'function');
	}
	
	var leer = function(dato, ruta) {
		var llaves = ruta.split('.');
		var actual = dato;
		for (var i=0; i<llaves.length; i++) {
			var llave = llaves[i];
			actual = actual[llave];
			if (!hayValor(actual)) {
				return null;
			}
		}
		return actual;
	};
	
	var iterarObjeto = function(objeto, funcion, ruta, original, padre, debug) {
		objeto = recrear(objeto);
		if (debug){console.log('objeto', recrear(objeto));}
		if (!hayValor(original)) {
			original = objeto;
		}
		var esRaiz = !hayValor(ruta);
		if (!esObjeto(objeto)) {
			//Es hoja de tipo básico
			if (esFuncion(funcion)) {
				funcion(ruta, objeto, original, padre)
			}
			return;
		}
		var llaves = Object.keys(objeto);
		if (debug){console.log('llaves', llaves);}
		for (var i=0; i<llaves.length; i++) {
			var llave = llaves[i];
			iterarObjeto(objeto[llave], funcion, esRaiz ? llave : ruta+'.'+llave, original, objeto, debug);
		}
	};
	
	var asignar = function(dato, ruta, valor) {
		//console.log('asignando', ruta, valor)
		var llaves = ruta.split('.');
		var actual = dato;
		
		var validarEstructura = function(mobjeto, mllave) {
			if (!esNumero(mllave) && esLista(mobjeto)) {
				console.log('a una lista se le va a asignar ', mllave)
				//Convertir esa lista en un objeto
				var ans = {};
				iterarObjeto(mobjeto, function(ruta, valor, original, padre) {
					asignar(ans, ruta, valor);
				});
				return ans;
			}
		};
		
		for (var i=0; i<llaves.length; i++) {
			var llave = llaves[i];
			
			if (i == (llaves.length - 1)) {
				actual[llave] = valor;
			} else {
				if (!hayValor(actual[llave])) {
					//Si el siguiente es un número, se crea la lista
					var llaveNumero = esNumero(llaves[i+1]);
					if (llaveNumero) {
						actual[llave] = [];
					} else {
						actual[llave] = {};
					}
				} else {
					var temp = validarEstructura(actual, llave);
					if (esObjeto(temp)) {
						//actual debe remplazarce con temp, pero se debe acceder al papa de actual para asignarle actual
						actual[llave] = temp;
					}				
				}
				actual = actual[llave];
			}
		}
	}
	
	var recrear = function(dato) {
		return JSON.parse(JSON.stringify(dato));
	}
	
	var modoBasico = (function() {
	
		var to = function(objeto) {
			var destino = null;
			if (esLista(objeto)) {
				destino = [];
			} else {
				destino = {};
			}
			var listas = [];
			iterarObjeto(objeto, function(ruta, valor, original, padre) {
				//console.log(ruta, leer(original, ruta));
				var patron = /(\d+)\.([^\d]*)$/ig;
				var grupos = patron.exec(ruta);
				if (grupos != null) {
					var ruta2 = ruta.replace(patron, '');
					var unaLista = ruta2.replace(/\.$/ig, '');
					if (listas.indexOf(unaLista) < 0) {
						listas.push(unaLista);
					}
					//Se debe volar el último número .1. y asignar la propiedad como una lista
					ruta2+=grupos[2]+'.'+grupos[1];//nombre.número
					asignar(destino, ruta2, valor);
				} else {
					asignar(destino, ruta, valor);
				}
				
			}, null, null, null, false);
			
			var terminado = {};
			iterarObjeto(destino, function(ruta, valor, original, padre) {
				//console.log('ruta', ruta, valor)
				var llaves = Object.keys(terminado);
				if (esLista(padre)) {
					//Busco la ruta anterior
					var patron = /\.(\d+)$/ig;
					var ruta2 = ruta.replace(patron, '');
					if (llaves.indexOf(ruta2) < 0) {
						terminado[ruta2] = [];
					}
					terminado[ruta2].push(valor);
				} else {
					terminado[ruta] = valor;
				}
			}, null, null, null, false);
			asignar(terminado, '__listas__', listas);
			return terminado;
		};
		
		var from = function(objeto) {
		
		};
	
		return {
			'to': to,
			'from': from,
		}
	})();
	
	var modoSimple = (function() {
		
		var to = function(objeto) {
			var respuesta = {};
			
			var llaves = utilidades.darRutasObjeto(objeto);
			for (var i=0; i<llaves.length; i++) {
				var llave = llaves[i];
				respuesta[llave] = utilidades.leerObj(objeto, llave, null);
			}
			return respuesta;
		}
		
		var from = function(objeto) {
			var respuesta = {};
			var llaves = Object.keys(objeto);
			for (var i=0; i<llaves.length; i++) {
				var llave = llaves[i];
				var dato = objeto[llave];
				utilidades.asignarObj(respuesta, 'ans.'+llave, dato);
			}
			return respuesta['ans'];
		};		
		
		return {
			'to': to,
			'from': from,
		}
	})();

	var registrar = function(llave, valor) {
		modos[llave] = valor;
	};
	
	var modo = function(llave) {
		return modos[llave];
	};
	
	registrar('basico', modoBasico);
	registrar('simple', modoSimple);
	
return {
	'registrar': registrar,
	'modo': modo,
}
})();

