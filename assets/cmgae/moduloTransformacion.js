"use strict";

var moduloTransformacion = (function($) {
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
})(jQuery);