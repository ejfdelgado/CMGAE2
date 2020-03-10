"use strict";

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
		
		THRESHOLD_RMS: 0.01,
		MFCC_HISTORY_MAX_LENGTH: 200,
		BOX_WIDTH: 1,
		BOX_HEIGHT: 20,
	};
	
	var node = null;
	var mic = null;
	var mfcc_history = [];
	var recorder, soundFile, analyzer, fft;
	var state = 0;//0 - parado, 1 - grabando
	var filtro = moduloFiltro(jQuery);
	var handlerNuevo = null;
	
	var setParams = function(nuevos) {
		$.extend(true, PARAMS, nuevos);
	};
	
	var getParams = function() {
		return PARAMS;
	};
	
    var callbackMeyda = function( features ) {
        var mfcc = features ["mfcc"];
        var rms = features ["rms"];
        
        if ( rms > PARAMS.THVOL/1000 ) { 
            mfcc_history.push ( mfcc ) /* only push mfcc where some audio is present */
        }
        
        var dif = (mfcc_history.length - PARAMS.MFCC_HISTORY_MAX_LENGTH);
        if(dif > 0) {
            mfcc_history.splice(0,dif) /* remove past mfcc values */
        }
    };
	
  var sketch = function(p) {
	  MIP5 = p;
	  
    p.setup = function() {
    	p.createCanvas ( PARAMS.BOX_WIDTH * PARAMS.MFCC_HISTORY_MAX_LENGTH, PARAMS.BOX_HEIGHT * 13 );
      //p.createCanvas(400, 400);
      //p.background(200);
      //p.noFill();
      // create an audio in
      mic = new p5.AudioIn();
      
      // prompts user to enable their browser mic
      mic.start(function() {
    	  //console.log(mic);
          if (typeof Meyda === "undefined") {
        	  console.log("Meyda could not be found! Have you included it?");
          } else {
        	  analyzer = Meyda.createMeydaAnalyzer({
        	    "audioContext": mic.mediaStream.context,
        	    "source": mic,
        	    "bufferSize": 512,
        	    "featureExtractors": ["mfcc","rms"],
        	    "callback": callbackMeyda,
        	  });
        	  analyzer.start();
        	}
      });

      // create a sound recorder
      recorder = new p5.SoundRecorder();

      // connect the mic to the recorder
      recorder.setInput(mic);
    }
    
    p.draw = function() {
    	p.background(0);
    	//p.fill(255,255,255);
    	
    	var data = mfcc_history;
        for(var i = 0; i < data.length; i++ ) {
            for(var j = 0; j < data [i].length; j++ ) {
              // setting fill color
              if ( data [i] [j] >= 0 ) p.fill ( 100, data[i][j] * 100, 100 )
              else p.fill( 100, 100, - data[i][j] * 100 )

              p.noStroke();
              p.rect(i * PARAMS.BOX_WIDTH, j * PARAMS.BOX_HEIGHT, PARAMS.BOX_WIDTH, PARAMS.BOX_HEIGHT);
            }
          }
        
        
    };
    
   //TODO Esto es una simulación de lo que realmente meyda debería hacer 
    p.mouseClicked = function() {
    	nuevaGrabacion();
    };
    
    
    var blobATexto = function(soundBlob) {
    	var diferido = $.Deferred();
    	moduloArchivos.darFuncionCargue()({
    		actividad: false,
            auto: 'false', 
            fileName: (new Date().getTime())+'.wav',
            dataFolder:'/sonidos',
          }, soundBlob).then(function(metadata) {
        	  console.log(metadata);
            var contenido = {'url': moduloArchivos.generarUrlDadoId(metadata.id)};
            //Pide el texto!
    		var url = '/storage/voice?';
    		url+=$.param({'name': metadata.id});
    		moduloHttp.get(url, undefined, undefined, false).then(function(voice) {
    			contenido.det = voice;
    			diferido.resolve(contenido);
    		}, function() {
    			diferido.reject();
    		});
          }, function() {
        	  diferido.rejet();
          });
    	return diferido;
    };
    
    var nuevaGrabacion = function() {
    	
    	if ([null, undefined].indexOf(soundFile) < 0) {
    		//Ya había una grabación, la debe guardar
			recorder.stop();
			var soundBlob = soundFile.getBlob();
			blobATexto(soundBlob).then(function(resultado) {
			    if (typeof handlerNuevo == 'function') {
			    	 modIdGen.nuevo().then(function(idAudio) {
			    		 resultado.id = idAudio;
			    		 handlerNuevo(resultado);
			    	 });
			    }
			});
    	}
    	soundFile = new p5.SoundFile();
        recorder.record(soundFile);
    };
    
    p.drawOld = function() {
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
	  node = $('<div></div>');
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
  
  var detener = function() {
	  analyzer.stop();
	  mic.disconnect();
	  mic.stop();
	  MIP5.remove();
	  node.remove();
	  MIP5 = null;
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
	  'detener': detener,
	  'play': play,
	  'setParams': setParams,
	  'getParams': getParams,
  };
})(jQuery);