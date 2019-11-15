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

var siempreTexto = function(dato, pred) {
	if (typeof pred != 'string') {
		pred = '';
	}
	if (!utilidades.hayValorTexto(dato)) {return pred;}
	return dato;
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

				if (!esObj && anterior != null && valor !== undefined) {
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
							if (valor === undefined) {
								delete objetoActual[llave];
							} else {
								objetoActual[llave] = valor;
							}
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
				if (!hayValorTexto(sufijo)) {
					sufijo = '';
				}
			}
			return respuesta
		};

		var ajustarTamanioPantalla = function() {
			$(window).trigger('resize');
			setTimeout(function() {
				$(window).trigger('resize');
			});
		};

		var esMovil = function() {
			//Depende del ancho en el archivo theme-pmoney-movil.css
			if ($( window ).innerWidth() < 768) {
				return true;
			}
			return false;
		};

		var fillZeros = function(numero, nZeros) {
			var txtZ = new Array(nZeros).fill('0').join('');
			return (txtZ+numero).slice(-1*nZeros);
		};

		//Solo funciona si color está en el formato: "rgb(187, 242, 19)"
		var transparentize = function(color, opacity) {
			var alpha = opacity === undefined ? 0.5 : 1 - opacity;
			return Color(color).alpha(alpha).rgbString();
		};

		var openInNewTab = function (url) {
		  var win = window.open(url, '_blank');
		  win.focus();
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

		var escaparHtml = function(texto) {
			return $('<div>').text(texto).html();
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

		//Solo ejecuta la funFinal después de pasar un periodo de tiempo sin haber recibido un llamado
		//funFinal puede retornar un diferido
		//funFinal puede ejecutarse inmediatamente
		var tiposUltimosPeriodos = {};
		var encolar = function(tipo, funFinal, periodo, opciones) {
			opciones = $.extend(true, {}, {
				'reintentos': 0,
				'espera': 0,
			}, opciones);
			//console.log('encolar', tipo);
			var ahora = (new Date()).getTime();
			//Caso base, no existe antes
			if (!(tipo in tiposUltimosPeriodos)) {
				tiposUltimosPeriodos[tipo] = {'now': ahora, 'timer': null, 'dif': null};
			}
			var actual = tiposUltimosPeriodos[tipo];
			if (actual['now'] == null) {
				actual['now'] = ahora;
			}
			var diferencia = (ahora - actual['now']);

			var terminarTodo = function() {
				var temp = actual['dif'];
				actual['dif'] = null;
				actual['timer'] = null;
				actual['now'] = null;
				temp.resolve();
			};

			var funInterna = function() {
				actual['dif'] = $.Deferred();
				//console.log('llamando función final...');
				var temp = funFinal();
				if (typeof temp == 'object' && temp != null && typeof temp['always'] == 'function') {
					//Es diferido
					temp.then(function(){}, function() {
						//Falló, valida si toca reintentar...
						if (typeof opciones['reintentos'] == 'number' && opciones['reintentos'] > 0) {
							setTimeout(function() {
								opciones['reintentos']=opciones['reintentos']-1;
								encolar(tipo, funFinal, periodo, opciones);
							}, opciones['espera']);
						}
					});
					temp.always(function() {
						terminarTodo();
					});
				} else {
					terminarTodo();
				}
			};

			var cancelarTimer = function() {
				if (actual['timer'] != null) {
					clearTimeout(actual['timer']);
					actual['timer'] = null;
				}
			};

			if (actual['dif'] != null) {
				actual['dif'].then(function() {
					encolar(tipo, funFinal, periodo, opciones);
				});
			} else {
				if (diferencia < periodo) {
					cancelarTimer();
					//Se debe postergar el llamado...
					actual['now'] = ahora;
					actual['timer'] = setTimeout(funInterna, periodo);
				}
			}
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
			'darAnchoTexto': darAnchoTexto,
			'shuffle': shuffle,
			'agregarScript': agregarScript,
			'metadataGenerica': metadataGenerica,
			'metadataPdf': metadataPdf,
			'metadataExcel': metadataExcel,
			'darMetadataDeClase': darMetadataDeClase,
			'eliminarDuplicados': eliminarDuplicados,
			'aplanarLista': aplanarLista,
			'listaContieneLista': listaContieneLista,
			'ajustarTamanioPantalla': ajustarTamanioPantalla,
			'eliminarTextosVacios': eliminarTextosVacios,
			'extraerTextoEstructurado': extraerTextoEstructurado,
			'esMovil': esMovil,
			'fillZeros': fillZeros,
			'transparentize': transparentize,
			'openInNewTab': openInNewTab,
			'removerAcentosLower': removerAcentosLower,
			'nInterseccion': nInterseccion,
			'pegar': pegar,
			'crearIndiceBuscable': crearIndiceBuscable,
			'evaluarObjeto': evaluarObjeto,
			'escaparHtml': escaparHtml,
			'htmlDecode': htmlDecode,
			'scrollBottom': scrollBottom,
			'scrollToElement': scrollToElement,
			'encolar': encolar,
		};
	})();

}(jQuery));

var copiarEnPortapapeles = function(texto) {
  var aux = document.createElement("input");
  aux.setAttribute("value", texto);
  document.body.appendChild(aux);
  aux.select();
  document.execCommand("copy");
  document.body.removeChild(aux);
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
