"use strict";

var moduloCapturaImagen = (function() {
	
	var capture;
	var MIP5 = null;
	var node = null;
	var diferido = null;
	var estado = 0;
	var misopciones = null;
	var stream;
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
			}, function(streamRef) {
				stream = streamRef;
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
			stream.getTracks().forEach(function(track) {
			  track.stop();
			});
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