"use strict";

var moduloSonidos = (function($) {
	
	var createAudio = function (source, volume, loop) {
	  var audio = new Audio(source)

	  audio.volume = volume / 100;
	  audio.loop = loop;

	  return audio;
	};

	var sonidos = {};

	//Prefetched sounds
	var lista = [
		//'cube-up.mp3',
		//'cube-down.mp3',
	];

	var inicializar = function() {
		for (var i=0; i<lista.length; i++) {
			var llave = lista[i];
			var uri = WP_THEME_URI+'/sonidos/'+llave;
			sonidos[llave] = createAudio(uri, 100, false);
		}
	};

	inicializar();

	//moduloSonidos.play('cube-up.mp3');
	//moduloSonidos.play('cube-down.mp3');
	var play = function(llave) {
		var ref = sonidos[llave];

		var isPlaying = ref.currentTime > 0 && !ref.paused && !ref.ended 
		    && ref.readyState > 2;

		if (!isPlaying) {
		  ref.play();
		}
	};

	var stopAll = function() {
		var llaves = Object.keys(sonidos);
		for (var i=0; i<llaves.length; i++) {
			var llave = llaves[i];
			var sonido = sonidos[llave];
			sonido.pause();
			sonido.currentTime = 0;
		}
	}

	return {
		'play': play,
		'stopAll': stopAll,
	}
})(jQuery);