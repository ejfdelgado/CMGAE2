"use strict";

var moduloSonido = (function($) {
	
	//webkitURL is deprecated but nevertheless
	URL = window.URL || window.webkitURL;

	var gumStream; 						//stream from getUserMedia()
	var rec; 							//Recorder.js object
	var input; 							//MediaStreamAudioSourceNode we'll be recording

	// shim for AudioContext when it's not avb. 
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	var audioContext //audio context to help us record
	
	var estado = null;

	function startRecording() {
		var diferido = $.Deferred();
		if (estado == null) {
			estado = 'pregrabando';
		    var constraints = { audio: true, video:false }
			navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
				audioContext = new AudioContext();
				console.log("Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz");
				gumStream = stream;
				input = audioContext.createMediaStreamSource(stream);
				rec = new Recorder(input,{numChannels:1});
				rec.record();
				estado = 'grabando';
				diferido.resolve();
			}).catch(function(err) {
				estado = null;
				diferido.reject();
			});
		} else {
			diferido.reject();
		}
	    return diferido;
	}

	function pauseRecording(){
		if (rec.recording){
			rec.stop();
			estado = 'pausado';
		}else{
			rec.record();
			estado = 'grabando';
		}
	}

	function stopRecording() {
		var diferido = $.Deferred();
		rec.stop();
		gumStream.getAudioTracks()[0].stop();
		rec.exportWAV(function(blob) {
			diferido.resolve(blob);
			
		});
		return diferido;
	}

	function createDownloadLink(blob, esURL) {
		
		var url;
		if (esURL === true) {
			url = blob;
		} else {
			url = URL.createObjectURL(blob);
		}
		
		var au = document.createElement('audio');
		var li = document.createElement('li');
		var link = document.createElement('a');

		//name of .wav file to use during upload and download (without extendion)
		var filename = new Date().toISOString();

		//add controls to the <audio> element
		au.controls = true;
		au.src = url;

		//save to disk link
		link.href = url;
		link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
		link.innerHTML = "Download";

		//add the new audio element to li
		li.appendChild(au);
		
		//add the filename to the li
		li.appendChild(document.createTextNode(filename+".wav "))

		//add the save to disk link to li
		li.appendChild(link);

		return li;
	}
	
	return {
		'start': startRecording,
		'pause': pauseRecording,
		'stop': stopRecording,
		'li': createDownloadLink,
	};
})(jQuery);

var moduloReproduccion = (function($) {
	
	  var MAX_KEYS = 5;
	  var buffer = {};
	  
	  var actual = null;
	  var llaveActual = null;
	  
	  var cacheOrdenada = null;
	  var invalidarCache = function() {
		  cacheOrdenada = null;
	  };
	  
	  var darSiguienteLlave = function(llave, hist) {
		  darLlavesOrdenadas(hist);
		  var indice = cacheOrdenada.lista.indexOf(llave);
		  if (cacheOrdenada.lista.length > (indice + 1)) {
			  return cacheOrdenada.lista[indice+1];
		  } else {
			  //Se acabó
			  return null;
		  }
	  };
	  
	  var darLlavesOrdenadas = function(hist) {
		  if (cacheOrdenada !== null) {
			  return cacheOrdenada;
		  }
		var lista = [];
		var mapa = {};
		var jerarquia1 = hist;
		var llaves1 = Object.keys(jerarquia1);
		for (var i=0; i<llaves1.length; i++) {
			var llave1 = llaves1[i];
			var obj1 = jerarquia1[llave1];
			
			var jerarquia2 = obj1.det;
			var llaves2 = Object.keys(jerarquia2);
			for (var j=0; j<llaves2.length; j++) {
				var llave2 = llaves2[j];
				var obj2 = jerarquia2[llave2];
				lista.push(llave2);
				mapa[llave2] = obj2;
			}
		}
		lista = lista.sort();
		cacheOrdenada = {'lista': lista, 'mapa': mapa};
		return cacheOrdenada;
	  };
	  
	  var precargarAudios = function(llave, hist) {
		  if (llave === null) {
			  return;
		  }
		  //Se buscan las llaves en orden después de llave
		  //Se llena el buffer hasta el máximo
		  var llavesNecesitadas = [];
		  var ultima = llave;
		  llavesNecesitadas.push(ultima);
		  while (llavesNecesitadas.length < MAX_KEYS) {
			  ultima = darSiguienteLlave(ultima, hist);
			  if (ultima == null) {
				  break;
			  }
			  llavesNecesitadas.push(ultima);
		  }
		  
	      //borro las llaves que no están en las que necesito
		  var llavesEnBuffer = Object.keys(buffer);
		  for (var i=0; i<llavesEnBuffer.length; i++) {
			  var llave = llavesEnBuffer[i];
			  if (llavesNecesitadas.indexOf(llave) < 0){
				  delete buffer[llave];
			  }
		  }
		  
		  //Agrego al buffer todos los audios
		  for (var i=0; i<llavesNecesitadas.length; i++) {
			  var llave = llavesNecesitadas[i];
			  if (!(llave in buffer)) {
				  var objeto = cacheOrdenada.mapa[llave];
				  var audio = moduloSonidos.createAudio(objeto.aud, 100, false);
				  buffer[llave] = audio;
			  }
		  }
	  };
	  
	  var audioEnCurso = null;
	  var loopReproducir = function(hist) {
		  if (llaveActual == null) {
			  return;
		  }
		  var misonido = buffer[llaveActual];
		  misonido.play();
		  audioEnCurso = misonido;
		  misonido.onended = function() {
			  audioEnCurso = null;
			  //Busca el siguiente
			  if (llaveActual != null) {
				  llaveActual = darSiguienteLlave(llaveActual, hist);
				  setTimeout(function() {
					  precargarAudios(llaveActual, hist);
				  }, 0);
				  if (llaveActual != null) {
				  	loopReproducir(hist);
				  }
			  }
		  };
	  };
	  
	  var reproducir = function(llave, hist) {
		  stop();
		  llaveActual = llave;
		  loopReproducir(hist);
	  };
	  
	  var play = function(llave, hist) {
		  precargarAudios(llave, hist);
		  //Se lanza el audio que reproduce
		  
		  reproducir(llave);
	  };
	  
	  var stop = function() {
		  llaveActual = null;
		  if (audioEnCurso != null) {
			  audioEnCurso.pause();
			  audioEnCurso.currentTime = 0;
			  audioEnCurso = null;
		  }
	  };
	  
	return {
		'play': play,
		'stop': stop,
		'invalidarCache': invalidarCache,
	};
})(jQuery);