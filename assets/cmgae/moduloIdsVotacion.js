"use strict";

var moduloIdsVotacion = (function() {
	var MAPEO_VOTACION = [
		{"t":"a", "h": 0},//0
		{"t":"b", "h": 35},//1
		{"t":"c", "h": 59},//2
		{"t":"d", "h": 89},//3
		{"t":"e", "h": 120},//4
		{"t":"f", "h": 173},//5
		{"t":"g", "h": 210},//6
		{"t":"h", "h": 237},//7
		{"t":"i", "h": 270},//8
		{"t":"j", "h": 304},//9
	];
	
	/* accepts parameters
	 * h  Object = {h:x, s:y, v:z}
	 * OR 
	 * h, s, v
	 * 0 <= h, s, v <= 1
	*/
	function HSVtoRGB(h, s, v) {
	    var r, g, b, i, f, p, q, t;
	    if (arguments.length === 1) {
	        s = h.s, v = h.v, h = h.h;
	    }
	    i = Math.floor(h * 6);
	    f = h * 6 - i;
	    p = v * (1 - s);
	    q = v * (1 - f * s);
	    t = v * (1 - (1 - f) * s);
	    switch (i % 6) {
	        case 0: r = v, g = t, b = p; break;
	        case 1: r = q, g = v, b = p; break;
	        case 2: r = p, g = v, b = t; break;
	        case 3: r = p, g = q, b = v; break;
	        case 4: r = t, g = p, b = v; break;
	        case 5: r = v, g = p, b = q; break;
	    }
	    return {
	        r: Math.round(r * 255),
	        g: Math.round(g * 255),
	        b: Math.round(b * 255)
	    };
	}
	
	var darId = function(idActual, NUM_PREGUNTAS) {
		var idLista = Math.floor((MAPEO_VOTACION.length-1)*idActual/(NUM_PREGUNTAS-1));
		var ans = MAPEO_VOTACION[idLista];
		ans.rgb = HSVtoRGB(ans.h/360, 1, 1);
		return ans;
	};
	
	return {
		'id': darId,
	};
})();