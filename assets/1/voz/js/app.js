"use strict";


//contains various utility functions 
var cnnutil = (function(exports){

// a window stores _size_ number of values
// and returns averages. Useful for keeping running
// track of validation or training accuracy during SGD
var Window = function(size, minsize) {
 this.v = [];
 this.size = typeof(size)==='undefined' ? 100 : size;
 this.minsize = typeof(minsize)==='undefined' ? 20 : minsize;
 this.sum = 0;
}
Window.prototype = {
 add: function(x) {
   this.v.push(x);
   this.sum += x;
   if(this.v.length>this.size) {
     var xold = this.v.shift();
     this.sum -= xold;
   }
 },
 get_average: function() {
   if(this.v.length < this.minsize) return -1;
   else return this.sum/this.v.length;
 },
 reset: function(x) {
   this.v = [];
   this.sum = 0;
 }
}

// returns min, max and indeces of an array
var maxmin = function(w) {
 if(w.length === 0) { return {}; } // ... ;s

 var maxv = w[0];
 var minv = w[0];
 var maxi = 0;
 var mini = 0;
 for(var i=1;i<w.length;i++) {
   if(w[i] > maxv) { maxv = w[i]; maxi = i; } 
   if(w[i] < minv) { minv = w[i]; mini = i; } 
 }
 return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv:maxv-minv};
}

// returns string representation of float
// but truncated to length of d digits
var f2t = function(x, d) {
 if(typeof(d)==='undefined') { var d = 5; }
 var dd = 1.0 * Math.pow(10, d);
 return '' + Math.floor(x*dd)/dd;
}

exports = exports || {};
exports.Window = Window;
exports.maxmin = maxmin;
exports.f2t = f2t;
return exports;

})(typeof module != 'undefined' && module.exports);  // add exports to module.exports if in node.js

var mipredictor = (function($) {
	//https://cs.stanford.edu/people/karpathy/convnetjs/demo/classify2d.html
	
	var data, labels, N;
	var ss = 50.0; // scale for drawing

	// create neural net
	var layer_defs, net, trainer;
	
	function myinit() { }
	
	var reload = function() {
		layer_defs = [];
		layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});
		layer_defs.push({type:'fc', num_neurons:6, activation: 'tanh'});
		layer_defs.push({type:'fc', num_neurons:2, activation: 'tanh'});
		layer_defs.push({type:'softmax', num_classes:2});

		net = new convnetjs.Net();
		net.makeLayers(layer_defs);

		trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, momentum:0.1, batch_size:10, l2_decay:0.001});
	};
	
	function random_data(){
	  data = [];
	  labels = [];
	  for(var k=0;k<40;k++) {
	    data.push([convnetjs.randf(-3,3), convnetjs.randf(-3,3)]); labels.push(convnetjs.randf(0,1) > 0.5 ? 1 : 0);
	  }
	  N = labels.length;
	}
	
	function spiral_data() {
	  data = [];
	  labels = [];
	  var n = 100;
	  for(var i=0;i<n;i++) {
	    var r = i/n*5 + convnetjs.randf(-0.1, 0.1);
	    var t = 1.25*i/n*2*Math.PI + convnetjs.randf(-0.1, 0.1);
	    data.push([r*Math.sin(t), r*Math.cos(t)]);
	    labels.push(1);
	  }
	  for(var i=0;i<n;i++) {
	    var r = i/n*5 + convnetjs.randf(-0.1, 0.1);
	    var t = 1.25*i/n*2*Math.PI + Math.PI + convnetjs.randf(-0.1, 0.1);
	    data.push([r*Math.sin(t), r*Math.cos(t)]);
	    labels.push(0);
	  }
	  N = data.length;
	}
	
	function update(){
	  // forward prop the data

	  var start = new Date().getTime();

	  var x = new convnetjs.Vol(1,1,2);
	  //x.w = data[ix];
	  var avloss = 0.0;
	  for(var iters=0;iters<20;iters++) {
	    for(var ix=0;ix<N;ix++) {
	      x.w = data[ix];
	      var stats = trainer.train(x, labels[ix]);
	      avloss += stats.loss;
	    }
	  }
	  avloss /= N*iters;

	  var end = new Date().getTime();
	  var time = end - start;
	      
	  //console.log('loss = ' + avloss + ', 100 cycles through data in ' + time + 'ms');
	}
	
	var lix = 4; // layer id to track first 2 neurons of
	var d0 = 0; // first dimension to show visualized
	var d1 = 1; // second dimension to show visualized
	function draw(){
	    
	    ctx.clearRect(0,0,WIDTH,HEIGHT);
	    
	    var netx = new convnetjs.Vol(1,1,2);
	    // draw decisions in the grid
	    var density= 5.0;
	    var gridstep = 2;
	    var gridx = [];
	    var gridy = [];
	    var gridl = []; 
	    for(var x=0.0, cx=0; x<=WIDTH; x+= density, cx++) {
	      for(var y=0.0, cy=0; y<=HEIGHT; y+= density, cy++) {
	        //var dec= svm.marginOne([(x-WIDTH/2)/ss, (y-HEIGHT/2)/ss]);
	        netx.w[0] = (x-WIDTH/2)/ss;
	        netx.w[1] = (y-HEIGHT/2)/ss;
	        var a = net.forward(netx, false);
	        
	        if(a.w[0] > a.w[1]) ctx.fillStyle = 'rgb(250, 150, 150)';
	        else ctx.fillStyle = 'rgb(150, 250, 150)';

	        //ctx.fillStyle = 'rgb(150,' + Math.floor(a.w[0]*105)+150 + ',150)';
	        //ctx.fillStyle = 'rgb(' + Math.floor(a.w[0]*255) + ',' + Math.floor(a.w[1]*255) + ', 0)';
	        ctx.fillRect(x-density/2-1, y-density/2-1, density+2, density+2);

	        if(cx%gridstep === 0 && cy%gridstep===0) {
	          // record the transformation information
	          var xt = net.layers[lix].out_act.w[d0]; // in screen coords
	          var yt = net.layers[lix].out_act.w[d1]; // in screen coords
	          gridx.push(xt);
	          gridy.push(yt);
	          gridl.push(a.w[0] > a.w[1]); // remember final label as well
	        }
	      }
	    }

	    // draw axes
	    ctx.beginPath();
	    ctx.strokeStyle = 'rgb(50,50,50)';
	    ctx.lineWidth = 1;
	    ctx.moveTo(0, HEIGHT/2);
	    ctx.lineTo(WIDTH, HEIGHT/2);
	    ctx.moveTo(WIDTH/2, 0);
	    ctx.lineTo(WIDTH/2, HEIGHT);
	    ctx.stroke();

	    // draw representation transformation axes for two neurons at some layer
	    var mmx = cnnutil.maxmin(gridx);
	    var mmy = cnnutil.maxmin(gridy);
	    visctx.clearRect(0,0,visWIDTH,visHEIGHT);
	    visctx.strokeStyle = 'rgb(0, 0, 0)';
	    var n = Math.floor(Math.sqrt(gridx.length)); // size of grid. Should be fine?
	    var ng = gridx.length;
	    var c = 0; // counter
	    visctx.beginPath() 
	    for(var x=0;x<n;x++) {
	      for(var y=0;y<n;y++) {

	        // down
	        var ix1 = x*n+y;
	        var ix2 = x*n+y+1;
	        if(ix1 >= 0 && ix2 >= 0 && ix1 < ng && ix2 < ng && y<n-1) { // check oob
	          var xraw = gridx[ix1];
	          var xraw1 = visWIDTH*(gridx[ix1] - mmx.minv)/mmx.dv;
	          var yraw1 = visHEIGHT*(gridy[ix1] - mmy.minv)/mmy.dv;
	          var xraw2 = visWIDTH*(gridx[ix2] - mmx.minv)/mmx.dv;
	          var yraw2 = visHEIGHT*(gridy[ix2] - mmy.minv)/mmy.dv;
	          visctx.moveTo(xraw1, yraw1);
	          visctx.lineTo(xraw2, yraw2);
	        }

	        // and draw its color
	        if(gridl[ix1]) visctx.fillStyle = 'rgb(250, 150, 150)';
	        else visctx.fillStyle = 'rgb(150, 250, 150)';
	        var sz = density * gridstep;
	        visctx.fillRect(xraw1-sz/2-1, yraw1-sz/2-1, sz+2, sz+2);

	        // right
	        var ix1 = (x+1)*n+y;
	        var ix2 = x*n+y;
	        if(ix1 >= 0 && ix2 >= 0 && ix1 < ng && ix2 < ng && x <n-1) { // check oob
	          var xraw = gridx[ix1];
	          xraw1 = visWIDTH*(gridx[ix1] - mmx.minv)/mmx.dv;
	          yraw1 = visHEIGHT*(gridy[ix1] - mmy.minv)/mmy.dv;
	          xraw2 = visWIDTH*(gridx[ix2] - mmx.minv)/mmx.dv;
	          yraw2 = visHEIGHT*(gridy[ix2] - mmy.minv)/mmy.dv;
	          visctx.moveTo(xraw1, yraw1);
	          visctx.lineTo(xraw2, yraw2);
	        }
	 
	      }
	    }
	    visctx.stroke();

	    // draw datapoints.
	    ctx.strokeStyle = 'rgb(0,0,0)';
	    ctx.lineWidth = 1;
	    for(var i=0;i<N;i++) {
	      
	      if(labels[i]==1) ctx.fillStyle = 'rgb(100,200,100)';
	      else ctx.fillStyle = 'rgb(200,100,100)';
	      
	      drawCircle(data[i][0]*ss+WIDTH/2, data[i][1]*ss+HEIGHT/2, 5.0);

	      // also draw transformed data points while we're at it
	      netx.w[0] = data[i][0];
	      netx.w[1] = data[i][1]
	      var a = net.forward(netx, false);
	      var xt = visWIDTH * (net.layers[lix].out_act.w[d0] - mmx.minv) / mmx.dv; // in screen coords
	      var yt = visHEIGHT * (net.layers[lix].out_act.w[d1] - mmy.minv) / mmy.dv; // in screen coords
	      if(labels[i]==1) visctx.fillStyle = 'rgb(100,200,100)';
	      else visctx.fillStyle = 'rgb(200,100,100)';
	      visctx.beginPath();
	      visctx.arc(xt, yt, 5.0, 0, Math.PI*2, true); 
	      visctx.closePath();
	      visctx.stroke();
	      visctx.fill();
	    }
	}

	function mouseClick(x, y, shiftPressed, ctrlPressed){
	  //console.log(x, y);
	  // x and y transformed to data space coordinates
	  var xt = (x-WIDTH/2)/ss;
	  var yt = (y-HEIGHT/2)/ss;

	  if(ctrlPressed) {
	    // remove closest data point
	    var mink = -1;
	    var mind = 99999;
	    for(var k=0, n=data.length;k<n;k++) {
	      var dx = data[k][0] - xt;
	      var dy = data[k][1] - yt;
	      var d = dx*dx+dy*dy;
	      if(d < mind || k==0) {
	        mind = d;
	        mink = k;
	      }
	    }
	    if(mink>=0) {
	      console.log('splicing ' + mink);
	      data.splice(mink, 1);
	      labels.splice(mink, 1);
	      N -= 1;
	    }

	  } else {
	    // add datapoint at location of click
	    data.push([xt, yt]);
	    labels.push(shiftPressed ? 1 : 0);
	    N += 1;
	    //console.log(xt, yt, data.length, labels.length, N);
	  }

	}

	function keyDown(key){
	}

	function keyUp(key) {
	}
	
	//---------------------------------------------------------------------
	//Simple game engine
	//Author: Andrej Karpathy
	//License: BSD
	//This function does all the boring canvas stuff. To use it, just create functions:
	//update()          gets called every frame
	//draw()            gets called every frame
	//myinit()          gets called once in beginning
	//mouseClick(x, y)  gets called on mouse click
	//keyUp(keycode)    gets called when key is released
	//keyDown(keycode)  gets called when key is pushed

	var canvas;
	var ctx;
	var WIDTH;
	var HEIGHT; 
	var FPS;

	function drawBubble(x, y, w, h, radius)
	{
	  var r = x + w;
	  var b = y + h;
	  ctx.beginPath();
	  ctx.strokeStyle="black";
	  ctx.lineWidth="2";
	  ctx.moveTo(x+radius, y);
	  ctx.lineTo(x+radius/2, y-10);
	  ctx.lineTo(x+radius * 2, y);
	  ctx.lineTo(r-radius, y);
	  ctx.quadraticCurveTo(r, y, r, y+radius);
	  ctx.lineTo(r, y+h-radius);
	  ctx.quadraticCurveTo(r, b, r-radius, b);
	  ctx.lineTo(x+radius, b);
	  ctx.quadraticCurveTo(x, b, x, b-radius);
	  ctx.lineTo(x, y+radius);
	  ctx.quadraticCurveTo(x, y, x+radius, y);
	  ctx.stroke();
	}

	function drawRect(x, y, w, h){
	  ctx.beginPath();
	  ctx.rect(x,y,w,h);
	  ctx.closePath();
	  ctx.fill();
	  ctx.stroke();
	}

	function drawCircle(x, y, r){
	  ctx.beginPath();
	  ctx.arc(x, y, r, 0, Math.PI*2, true); 
	  ctx.closePath();
	  ctx.stroke();
	  ctx.fill();
	}

	//uniform distribution integer
	function randi(s, e) {
	  return Math.floor(Math.random()*(e-s) + s);
	}

	//uniform distribution
	function randf(s, e) {
	  return Math.random()*(e-s) + s;
	}

	//normal distribution random number
	function randn(mean, variance) {
	  var V1, V2, S;
	  do {
	    var U1 = Math.random();
	    var U2 = Math.random();
	    V1 = 2 * U1 - 1;
	    V2 = 2 * U2 - 1;
	    S = V1 * V1 + V2 * V2;
	  } while (S > 1);
	  X = Math.sqrt(-2 * Math.log(S) / S) * V1;
	  X = mean + Math.sqrt(variance) * X;
	  return X;
	}

	function eventClick(e) {
	    
	  //get position of cursor relative to top left of canvas
	  var x;
	  var y;
	  if (e.pageX || e.pageY) { 
	    x = e.pageX;
	    y = e.pageY;
	  } else { 
	    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
	    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
	  } 
	  x -= canvas.offsetLeft;
	  y -= canvas.offsetTop;
	  
	  //call user-defined callback
	  mouseClick(x, y, e.shiftKey, e.ctrlKey);
	}

	//event codes can be found here:
	//http://www.aspdotnetfaq.com/Faq/What-is-the-list-of-KeyCodes-for-JavaScript-KeyDown-KeyPress-and-KeyUp-events.aspx
	function eventKeyUp(e) {
	  var keycode = ('which' in e) ? e.which : e.keyCode;
	  keyUp(keycode);
	}

	function eventKeyDown(e) {
	  var keycode = ('which' in e) ? e.which : e.keyCode;
	  keyDown(keycode);
	}

	function NPGinit(FPS){
	  //takes frames per secont to run at
	  
	  canvas = document.getElementById('NPGcanvas');
	  ctx = canvas.getContext('2d');
	  WIDTH = canvas.width;
	  HEIGHT = canvas.height;
	  canvas.addEventListener('click', eventClick, false);
	  
	  //canvas element cannot get focus by default. Requires to either set 
	  //tabindex to 1 so that it's focusable, or we need to attach listeners
	  //to the document. Here we do the latter
	  document.addEventListener('keyup', eventKeyUp, true);
	  document.addEventListener('keydown', eventKeyDown, true);
	  
	  setInterval(NPGtick, 1000/FPS);
	  
	  myinit();
	}

	function NPGtick() {
	    update();
	    draw();
	}
	//---------------------------------------------------------------------
	var visctx, viscanvas, visWIDTH, visHEIGHT;
	var inicializar = function() {
		
	    viscanvas = document.getElementById('viscanvas');
	    visctx = viscanvas.getContext('2d');
	    visWIDTH = viscanvas.width;
	    visHEIGHT = viscanvas.height;
		
	    random_data();
	    reload();
	    NPGinit(20);
	};
	
	//mipredictor.spiral_data();
	return {
		'inicializar': inicializar,
		'spiral_data': spiral_data,
	};
})(jQuery);

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
