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
        
        /* only push mfcc where some audio is present */
        //if ( rms > PARAMS.THVOL/1000 ) { 
            mfcc_history.push ( mfcc ) 
        //}
        
        var dif = (mfcc_history.length - PARAMS.MFCC_HISTORY_MAX_LENGTH);
        if(dif > 0) {
            mfcc_history.splice(0,dif) /* remove past mfcc values */
        }
    };
    
    var moduloPeriodico;
	
  var sketch = function(p) {
	  MIP5 = p;
	  
	  moduloPeriodico = (function() {
		  var MIN_T = 1000;//una palabra es de mínimo un segundo
		  var MAX_T = 5000;//una frase es de 5 segundos máximo
		  
		  var primero = null;
		  var segundo = null;
		  var escuchando = false;
		  
		  var cancelarTimers = function() {
			if (primero != null) {
				clearTimeout(primero);
				primero = null;
			}
			if (segundo != null) {
				clearTimeout(segundo);
				segundo = null;
			}
		  };
		  
		  var comenzar = function(ignorarAnterior) {
			  cancelarTimers();
			  nuevaGrabacion(ignorarAnterior);
			  escuchando = false;
			  primero = setTimeout(function() {
				  escuchando = true;
			  }, MIN_T);
			  segundo = setTimeout(function() {
				  comenzar();
			  }, MAX_T);
		  };
		  
		  var tic = function() {
			  if (escuchando === true) {
				  comenzar();
			  }
		  };
		  
		  var detener = function() {
			  cancelarTimers();
		  };
		  
		  return {
			  'comenzar': comenzar,
			  'tic': tic,
			  'detener': detener,
		  }
	  })();
	  
    p.setup = function() {
    	console.log('setup');
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
      
      moduloPeriodico.comenzar(true);
    };
    
    p.draw = function() {
    	p.background(0);
    	//p.fill(255,255,255);
    	
    	var data = mfcc_history;
        for(var i = 0; i < data.length; i++ ) {
        	if (data[i] !== null) {
	            for(var j = 0; j < data [i].length; j++ ) {
	              // setting fill color
	              if ( data [i] [j] >= 0 ) p.fill ( 100, data[i][j] * 100, 100 )
	              else p.fill( 100, 100, - data[i][j] * 100 )
	
	              p.noStroke();
	              p.rect(i * PARAMS.BOX_WIDTH, j * PARAMS.BOX_HEIGHT, PARAMS.BOX_WIDTH, PARAMS.BOX_HEIGHT);
	            }
        	} else {
        		for(var j = 0; j < 13; j++ ) {
  	              // setting fill color
        		  p.fill ( 100, 100, 100 );//For null values...
  	              p.noStroke();
  	              p.rect(i * PARAMS.BOX_WIDTH, j * PARAMS.BOX_HEIGHT, PARAMS.BOX_WIDTH, PARAMS.BOX_HEIGHT);
  	            }
        	}
          }
        
        //Esto se debe invocar cuando es una pausa
        var ultimo = data[data.length-1];
        console.log(vectorNormalizado(ultimo));
        //moduloPeriodico.tic();
    };
    
    p.mouseClicked = function() {
    	
    };
    
    var vectorNormalizado = function(vector) {
    	if (vector instanceof Array) {
	    	var nuevo = [];
	    	for (var i=0; i<vector.length; i++) {
	    		nuevo.push(parseInt(vector[i]*100));
	    	}
	    	return nuevo.join(';');
    	} else {
    		return null;
    	}
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
    
    var nuevaGrabacion = function(ignorarAnterior) {
    	
    	if (ignorarAnterior !== true) {
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
    	}
    	soundFile = new p5.SoundFile();
        recorder.record(soundFile);
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
	  moduloPeriodico.detener();
	  analyzer.stop();
	  recorder.stop();
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