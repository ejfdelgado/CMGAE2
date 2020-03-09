"use strict";

var moduloFiltro = (function($) {
	
	var actual = null;
	var tant = null;
	
	var aleatorio = function(min, max) {
		return min+(max-min)*Math.random();
	};
	
	var prueba = function() {
	
		var mousePos = {x:0, y:0};

		document.onmousemove = handleMouseMove;
		setInterval(getMousePosition, 100); // setInterval repeats every X ms

		function handleMouseMove(event) {
			var dot, eventDoc, doc, body, pageX, pageY;

			event = event || window.event; // IE-ism

			// If pageX/Y aren't available and clientX/Y are,
			// calculate pageX/Y - logic taken from jQuery.
			// (This is to support old IE)
			if (event.pageX == null && event.clientX != null) {
				eventDoc = (event.target && event.target.ownerDocument) || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = event.clientX +
				  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
				  (doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = event.clientY +
				  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
				  (doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			mousePos = {
				x: event.pageX,
				y: event.pageY
			};
		}
		function getMousePosition() {
			var pos = mousePos;
			if (!pos) {
				// We haven't seen any movement yet
			}
			else {
				// Use pos.x and pos.y
			}
		}
	
		var recursivo = function() {
			var ahora = new Date().getTime();
			var espera = aleatorio(10, 50);
			var senial = mousePos.x;
			escribir([senial], [1]);
			//console.log('ahora: '+ahora+', señal:'+senial+', espera:'+espera);
			//console.log(parseInt(leer()[0]));
			console.log(umbral(500)[0]);
			setTimeout(recursivo, espera);
		};
		
		recursivo();
	};
	
	//tune: cuánto debe disminuir por cada milisegundo que pasa
	var escribir = function(nuevo, tune) {
		var ahora = new Date().getTime();
		if (actual == null) {
			actual = nuevo.slice(0);
		} else {
			var diff = (ahora - tant);
			for (var i=0; i<nuevo.length; i++) {
				var v0 = actual[i];
				var v1 = nuevo[i];
				if (v1 > v0) {
					actual[i] = v1;
				} else {
					if (v0 > 0) {
						var calc = v0-tune[i]*diff;
						if (calc < 0) {
							actual[i] = 0;
						} else {
							actual[i] = calc;
						}
						
					}
				}
			}
		}
		tant = ahora;
	};
	
	var leer = function() {
		return actual;
	};
	
	var umbral = function(th) {
		var ans = [];
		for (var i=0; i<actual.length; i++) {
			ans[i] = actual[i] > th[i];
		}
		return ans;
	};
	
	return {
		'prueba': prueba,
		'leer': leer,
		'escribir': escribir,
		'umbral': umbral,
	};
});