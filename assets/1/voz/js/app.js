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

var moduloCapturaImagen = (function() {
	
	var capture;
	var MIP5 = null;
	var node = null;
	var diferido = null;
	var estado = 0;
	var misopciones = null;
	var DIMS = {
		W: 320,
		H: 240,
	};
	
	var sketch = function(p) {
		MIP5 = p;
	    p.setup = function() {
	    	DIMS.H = Math.min($(window).width(), $(window).height());
			p.createCanvas(DIMS.H, DIMS.H);
			capture = p.createCapture({
			    audio: false,
			    video: {
			      facingMode: "environment",
			    },
			});
			//capture = p.createCapture(p.VIDEO);
			//capture.size(DIMS.W, DIMS.H);
			capture.hide();
	    };
	    
	    p.draw = function() {
			var ancho;
			var alto;
			var dx = 0;
			var dy = 0;
			
			if (capture.height > capture.width) {
				//Más alto que ancho
				ancho = DIMS.H;
				alto = ancho * capture.height / capture.width;
				dy = -(alto - ancho)/2;
			} else {
				//Más ancho que alto
				alto = DIMS.H;
				ancho = alto * capture.width / capture.height;
				dx = -(ancho - alto)/2;
			}
			if (estado != 1) {
				p.background(255);
				p.image(capture, dx, dy, ancho, alto);
			}
		};
	};
	
	//moduloCapturaImagen.leer({dir: '', id: ''}).then(function() {})
	var leer = function(opciones) {
		estado = 0;
		misopciones = $.extend(true, {
			'padre': $('body'),
		}, opciones);
		diferido = $.Deferred();
		var template = '<div id="micamara">\
		    <div id="vid_container">\
		    </div>\
		    <div id="gui_controls">\
		        <button id="switchCameraButton" name="switch Camera" type="button" aria-pressed="true"></button>\
		        <button id="takePhotoButton" name="take Photo" type="button"></button>\
		        <button id="toggleFullScreenButton" name="toggle FullScreen" type="button" aria-pressed="false" style="display: block;"></button>\
		    </div>\
		</div>';
		
		//node = $('<div style="position: absolute; top: 0; z-index: 9; width: 100%; height: 100%; text-align: center; background: white; padding-top: 25px;"></div>');
		node = $(template);
		new p5(sketch, node.find('#vid_container')[0]);
		misopciones.padre.append(node);
		setTimeout(function() {
			node.find('canvas').css({'visibility': 'visible'});
		});
		
		node.find('#takePhotoButton').on('click', tomarFoto);
		node.find('#toggleFullScreenButton').on('click', cancelar);
		
		return diferido;
	};
	
	var tomarFoto = function() {
		estado = 1;
		var MIMEJPEG = "image/jpeg";
		var canvas = node.find('canvas')[0];
	    var dataUrl = canvas.toDataURL(MIMEJPEG);
	    modIdGen.nuevo().then(function(guid) {
		    var blob = moduloArchivos.dataURItoBlob(dataUrl);
		    moduloArchivos.subirArchivoMioDePagina({
		    	'dataFolder': misopciones.dir,
		    	'id': misopciones.id,
		    	'fileName': guid+'.jpg',
		    	'type': MIMEJPEG,
		    }, blob).then(function(ans) {
		    	cancelarBasico();
		    	diferido.resolve(ans);
		    }, function() {
		    	diferido.reject();
		    });
	    });
	};
	
	var cancelarBasico = function() {
		if (MIP5 != null) {
			MIP5.remove();
			node.remove();
			MIP5 = null;
		}
	};
	
	var cancelar = function() {
		cancelarBasico();
		diferido.reject();
	}
	
	return {
		'leer': leer,
		'cancelar': cancelar,
	};
})();

var moduloP5 = (function() {
	
	var NYQUIST = 22050;
	var MIP5 = null;
	
	var PARAMS = {
		PBVOL : 0.2,
		PBFREQ : 2,
		
		MINVOL : 0,
		MAXVOL : 500,
		
		MINFREQ : 500,
		MAXFREQ : 3000,
		
		THVOL : 40,
		THFREQ : 1100,
	};
	
	var mic, recorder, soundFile, analyzer, fft;
	var state = 0;//0 - parado, 1 - grabando
	var filtro = moduloFiltro(jQuery);
	var handlerNuevo = null;
	
	var setParams = function(nuevos) {
		$.extend(true, PARAMS, nuevos);
	};
	
	var getParams = function() {
		return PARAMS;
	};
	
  var sketch = function(p) {
	  MIP5 = p;
    p.setup = function(){
      p.createCanvas(400, 400);
      //p.background(200);
      //p.noFill();
      // create an audio in
      mic = new p5.AudioIn();
      
      // prompts user to enable their browser mic
      mic.start();

      // create a sound recorder
      recorder = new p5.SoundRecorder();

      // connect the mic to the recorder
      recorder.setInput(mic);
      
      analyzer = new p5.Amplitude();
      analyzer.setInput(mic);
      
      fft = new p5.FFT();
      fft.setInput(mic);

    }
    
    p.draw = function() {
		var spectrum = fft.analyze();
		var spectralCentroid = fft.getCentroid();
		var mean_freq_index = spectralCentroid/(NYQUIST/spectrum.length);
		var centroidplot = p.map(p.log(mean_freq_index), 0, p.log(spectrum.length), 0, p.width);
		var rms = 1000*mic.getLevel();

		filtro.escribir([rms, spectralCentroid], [PARAMS.PBVOL, PARAMS.PBFREQ]);
		var vectorDebug = filtro.leer();
		var vector = filtro.umbral([PARAMS.THVOL, PARAMS.THFREQ]);
		
		if (state == 0 && vector[0] === true && vector[1] === true) {
			//Se debe comenzar a grabar
			console.log('Inicia grabación');
			soundFile = new p5.SoundFile();
			recorder.record(soundFile);
			state = 1;
		} else if (state == 1 && vector[0] === false && vector[1] === false) {
			//Debe detener la grabación
			console.log('Finaliza grabación');
			recorder.stop();
			var soundBlob = soundFile.getBlob();
			if (typeof handlerNuevo == 'function') {
				handlerNuevo(soundBlob);
			}
			state = 0;
		}
		
		p.background(0);
		p.fill(255,255,255);// text is white
		
		p.text("rms: ", 10, 20);
		p.text(p.round(rms), 10, 40);
		
		p.text("centroid: ", 10, 60);
		p.text(p.round(spectralCentroid)+" Hz", 10, 80);
		
		p.text("rms*: ", 10, 100);
		p.text(p.round(vectorDebug[0]), 10, 120);
		  
		p.text("centroid*: ", 10, 140);
		p.text(p.round(vectorDebug[1]), 10, 160);
		
		p.fill(127);
		p.stroke(0);
		var max = Math.max(p.width, p.height)*1;
		
		var cx = p.map(rms, PARAMS.MINVOL, PARAMS.MAXVOL, 0, p.height);
		var cy = p.map(spectralCentroid, PARAMS.MINFREQ, PARAMS.MAXFREQ, 0, p.width);
		
		var cx2 = p.map(vectorDebug[0], PARAMS.MINVOL, PARAMS.MAXVOL, 0, p.height);
		var cy2 = p.map(vectorDebug[1], PARAMS.MINFREQ, PARAMS.MAXFREQ, 0, p.width);
		
		p.fill(0,0,255);
		p.ellipse(cx, cy, 10, 10);
		p.fill(255,0,0);
		p.ellipse(cx2, cy2, 10, 10);
		p.fill(0,255,0);
		p.ellipse(0, cy2, 10, 10);
		p.ellipse(cx2, 0, 10, 10);
	  
	};
  };
  
  //moduloP5.init($('body'));
  var init = function(padre, handlerLocal) {
	  handlerNuevo = handlerLocal;
	  var node = $('<div></div>');
	  new p5(sketch, node[0]);
	  padre.append(node);
	  setTimeout(function() {
		  node.find('canvas').css({'visibility': 'visible'});
	  });
  };
  
//moduloP5.activar();
  var activar = function() {
	  MIP5.getAudioContext().resume();
  };
  
  var play = function(blob) {
	  var url = URL.createObjectURL(blob);
	  var mySound = new p5.SoundFile(url, function() {
		  mySound.analyze();
		  mySound.getEnergy()
		  mySound.setVolume(1);
		  mySound.play();
	  });
  };
  
  return {
	  'init':init, 
	  'activar': activar,
	  'play': play,
	  'setParams': setParams,
	  'getParams': getParams,
  };
})(jQuery);

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
