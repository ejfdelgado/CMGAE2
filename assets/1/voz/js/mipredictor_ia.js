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