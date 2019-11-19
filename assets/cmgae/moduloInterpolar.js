"use strict";

var moduloInterpolar = (function() {
	
	//[{v: [100, 200, 50], p: 0}, {v: [10, 700, 50], p: 1}]
	var map = function(p0, lista) {
		//1. Se encuentra el máximo p menor que p0
		var inicial = null;
		for (var i=0; i<lista.length; i++) {
			var actual = lista[i];
			if (actual.p <= p0 && (inicial === null || actual.p > inicial.p)) {
				inicial = actual;
			}
		}
		//2. Se encuentra el mínimo p mayor que p0
		var ultimo = null;
		for (var i=0; i<lista.length; i++) {
			var actual = lista[i];
			if (actual.p >= p0 && (ultimo === null || actual.p < ultimo.p)) {
				ultimo = actual;
			}
		}
		if (inicial === null && ultimo === null) {
			return null;
		}
		if (inicial !== null && ultimo == null) {
			return inicial.v.slice(0);
		}
		if (inicial === null && ultimo !== null) {
			return ultimo.v.slice(0);
		}
		//console.log(p0, JSON.stringify(inicial), JSON.stringify(ultimo));
		//Ninguno de los dos es nulo, se puede interpolar
		//3. Se define la función de interpolación
		var interpolar = function(v0, v1, paso) {
			var paso = ((Math.cos(Math.PI*paso) + 1) / 2);
			return (v0*(paso)+(1-paso)*v1);
		};
		
		var n1 = inicial.p;
		var n2 = p0;
		var n3 = ultimo.p;
		var total = n3 - n1;
		
		if (total == 0) {
			return ultimo.v.slice(0);
		}
		
		var avance = n2 - n1;
		var paso = avance/total;
		
		var lista1 = inicial.v;
		var lista2 = ultimo.v;
		var ans = [];
		for (var j=0; j<lista1.length; j++) {
			ans[j] = interpolar(lista1[j], lista2[j], paso);
		}
		return ans;
	};
	
	return {
		'map': map,
	};
})();

/*
var formula = [{v: [161, 255, 158], p: 0}, {v: [255, 253, 158], p: 0.5}, {v: [255, 158, 158], p: 1}];
var MAX = 100;
for (var i=0; i<MAX; i++) {
	var p = i/MAX;
	var ans = moduloInterpolar.map(p*1.2-0.1, formula);
	console.log((i+';'+ans[0]+';'+ans[1]).replace(/\./ig, ','));
}
*/