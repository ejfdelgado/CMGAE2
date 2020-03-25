app.directive('audioentrenador', [function () {
    return {
		restrict: 'A',
		scope: {
			tipo: '=tipo',
		},
		templateUrl: '/assets'+window.location.pathname+'/audioentrenador.html',
		link: function($scope, element, attrs) {
			
			var MIP5 = null;
			var mic = null;
			var mfcc_history = [];
			var recorder, soundFile, analyzer, fft;
			var state = 0;//0 - parado, 1 - grabando
			var visctx, viscanvas, visWIDTH, visHEIGHT;
			var DIMENSIONES = 13;
			var data, labels, N;
			var ss = 50.0; // scale for drawing

			// create neural net
			var layer_defs, net, trainer;
			
			function myinit() { }
			var PARAMS = {
				MFCC_HISTORY_MAX_LENGTH: 200,
				BOX_WIDTH: 1,
				BOX_HEIGHT: 20,
			};
			
			$scope.interno = {
				archivo: null,
			};
			
			$scope.entrenamiento = {};
			
			var sketch = function(p) {
				MIP5 = p;
				
				p.setup = function() {
					p.createCanvas ( PARAMS.BOX_WIDTH * PARAMS.MFCC_HISTORY_MAX_LENGTH, PARAMS.BOX_HEIGHT * 13 );

					if (typeof Meyda === "undefined") {
						console.log("Meyda could not be found! Have you included it?");
					} else {

					}
				};
				
				p.draw = function() {
			    	p.background(0);
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
				};
			};
			
			var detener = function() {
				if (MIP5 == null) {
					return;
				}
				analyzer.stop();
				mic.disconnect();
				mic.stop();
				MIP5.remove();
				$(element).find('.midivinterno').remove();
				MIP5 = null;
			};
			
			var reload = function() {
				layer_defs = [];
				layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:DIMENSIONES});//Se declara la dimensión de las entradas
				layer_defs.push({type:'fc', num_neurons:6, activation: 'tanh'});
				layer_defs.push({type:'fc', num_neurons:2, activation: 'tanh'});
				layer_defs.push({type:'softmax', num_classes:2});

				net = new convnetjs.Net();
				net.makeLayers(layer_defs);

				trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, momentum:0.1, batch_size:10, l2_decay:0.001});
			};
			
			function NPGinit(FPS){
				//takes frames per secont to run at
				
				canvas = $(element).find('.NPGcanvas').get(0);
				ctx = canvas.getContext('2d');
				WIDTH = canvas.width;
				HEIGHT = canvas.height;
				
				document.addEventListener('keydown', eventKeyDown, true);
				
				setInterval(NPGtick, 1000/FPS);
				
				myinit();
			}
			
			function eventKeyDown(e) {
				  var keycode = ('which' in e) ? e.which : e.keyCode;
				  keyDown(keycode);
				}
			
			function keyDown(key){
				console.log('key', key);
				if (key == 83) {
					//s
					var json = net.toJSON();
					var str = JSON.stringify(json);
					console.log(str);
				} else if (key == 76) {
					//l
					var myjson = {"layers":[{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"input"},{"out_depth":6,"out_sx":1,"out_sy":1,"layer_type":"fc","num_inputs":2,"l1_decay_mul":0,"l2_decay_mul":1,"filters":[{"sx":1,"sy":1,"depth":2,"w":{"0":0.6730647726475136,"1":0.4423637253134721}},{"sx":1,"sy":1,"depth":2,"w":{"0":1.3316213287730314,"1":-1.7303401957627191}},{"sx":1,"sy":1,"depth":2,"w":{"0":-2.6508169864701028,"1":-1.5852275043387856}},{"sx":1,"sy":1,"depth":2,"w":{"0":0.6916595553958305,"1":-1.403243486723663}},{"sx":1,"sy":1,"depth":2,"w":{"0":0.32052038008463624,"1":1.555705050303381}},{"sx":1,"sy":1,"depth":2,"w":{"0":1.8243147175755718,"1":2.4368004445417175}}],"biases":{"sx":1,"sy":1,"depth":6,"w":{"0":-0.7975748966148888,"1":2.6354334702871602,"2":3.4688553482490394,"3":3.4933668730607956,"4":3.6228503554382003,"5":3.0136282781007644}}},{"out_depth":6,"out_sx":1,"out_sy":1,"layer_type":"tanh"},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"fc","num_inputs":6,"l1_decay_mul":0,"l2_decay_mul":1,"filters":[{"sx":1,"sy":1,"depth":6,"w":{"0":5.057050183000219,"1":2.153485058666249,"2":4.33027945470676,"3":-3.4455570982597963,"4":3.289240228052259,"5":-2.388263108308716}},{"sx":1,"sy":1,"depth":6,"w":{"0":-2.274738837100848,"1":-0.5896330086244045,"2":-1.2099847447701702,"3":1.7012009053963906,"4":-1.3039412885242117,"5":1.796732334215926}}],"biases":{"sx":1,"sy":1,"depth":2,"w":{"0":-0.005393511577637624,"1":-0.8046901722556189}}},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"tanh"},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"fc","num_inputs":2,"l1_decay_mul":0,"l2_decay_mul":1,"filters":[{"sx":1,"sy":1,"depth":2,"w":{"0":-4.880545684236688,"1":3.3169342666437602}},{"sx":1,"sy":1,"depth":2,"w":{"0":4.218450842208072,"1":-2.0648094474616974}}],"biases":{"sx":1,"sy":1,"depth":2,"w":{"0":0.7047535960989859,"1":-0.704753596098985}}},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"softmax","num_inputs":2}]};
					net = new convnetjs.Net(); // create an empty network
					net.fromJSON(myjson); // load all parameters from JSON
				} else if (key == 49) {
					//1
					//Modifico la dimension 1
					d0++;
					if (d0 >= DIMENSIONES) {
						d0 = 0;
					}
					console.log(d0+' vs. '+d1);
				} else if (key == 50) {
					//2
					//Modifico la dimension 2
					d1++;
					if (d1 >= DIMENSIONES) {
						d1 = 0;
					}
					console.log(d0+' vs. '+d1);
				}
			}
			
			function updatenet() {
				  // forward prop the data

				  var start = new Date().getTime();

				  var x = new convnetjs.Vol(1,1,DIMENSIONES);
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
			function drawnet(){
			    
			    ctx.clearRect(0,0,WIDTH,HEIGHT);
			    
			    var netx = new convnetjs.Vol(1,1,DIMENSIONES);
			    // draw decisions in the grid
			    var density= 5.0;
			    var gridstep = 2;
			    var gridx = [];
			    var gridy = [];
			    var gridl = []; 
			    for(var x=0.0, cx=0; x<=WIDTH; x+= density, cx++) {
			      for(var y=0.0, cy=0; y<=HEIGHT; y+= density, cy++) {
			        //var dec= svm.marginOne([(x-WIDTH/2)/ss, (y-HEIGHT/2)/ss]);
			        netx.w[d0] = (x-WIDTH/2)/ss;
			        netx.w[d1] = (y-HEIGHT/2)/ss;
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
			      
			      drawCircle(data[i][d0]*ss+WIDTH/2, data[i][d1]*ss+HEIGHT/2, 2.0);

			      // also draw transformed data points while we're at it
			      netx.w[0] = data[i][d0];
			      netx.w[1] = data[i][d1]
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
			
			function drawCircle(x, y, r){
				  ctx.beginPath();
				  ctx.arc(x, y, r, 0, Math.PI*2, true); 
				  ctx.closePath();
				  ctx.stroke();
				  ctx.fill();
				}
			
			function NPGtick() {
			    updatenet();
			    drawnet();
			}
			
			var init = function() {
				detener();
				
				data = [];
				labels = [];
				
				var padre = $(element);
				var node = $('<div class="midivinterno"></div>');
				new p5(sketch, node[0]);
				padre.find('.vismeyda').append(node);
				setTimeout(function() {
				 node.find('canvas').css({'visibility': 'visible', 'width': '100%', 'height': '50px'});
				}, 0);
				
				//Red neuronal
			    viscanvas = padre.find('.viscanvas').get(0);
			    visctx = viscanvas.getContext('2d');
			    visWIDTH = viscanvas.width;
			    visHEIGHT = viscanvas.height;
				
			    reload();
			    NPGinit(20);
			};
			
			$scope.cargarArchivos = function(archivos) {
				if (!(archivos instanceof Array || archivos instanceof FileList)) {
					return;
				}
				$.each(archivos, function(i, unarchivo) {
					var diferido = $.Deferred();
					var unarchivo = archivos[i];
					var clase = /_clase(\d+)\./.exec(unarchivo.name);
					procesarUnArchivo(unarchivo, clase[1]);
				});
			};
			
			var procesarUnArchivo = function(archivo, clase) {
				//Se debe crear un elemento audio
				var nuevoAudio = $('<audio controls><source src="" type="audio/mp3"></audio>');
				$(element).append(nuevoAudio);
				nuevoAudio.find('source').attr('src', window.URL.createObjectURL(archivo));
				setTimeout(function() {
					const audioContext = new AudioContext();
					const htmlAudioElement = nuevoAudio.get(0);
					const source = audioContext.createMediaElementSource(htmlAudioElement);
					source.connect(audioContext.destination);
					analyzer = Meyda.createMeydaAnalyzer({
						"audioContext": audioContext,
						"source": source,
						"bufferSize": 512,
						"featureExtractors": ["mfcc","rms"],
						"callback": function( features ) {
					        var mfcc = features ["mfcc"];
					        var nuevo = vectorNormalizado(mfcc, false);
					        var hayDato = 0;
					        for (var j=0; j<nuevo.length; j++) {
					        	if (nuevo[j] != 0) {
					        		hayDato++;
					        	}
					        }
					        if (hayDato <= 7) {
					        	return;
					        }
					        
					        var rms = features ["rms"];
					        mfcc_history.push ( mfcc );
					        
					        var dif = (mfcc_history.length - PARAMS.MFCC_HISTORY_MAX_LENGTH);
					        if(dif > 0) {
					            mfcc_history.splice(0,dif) /* remove past mfcc values */
					        }
					        if (!($scope.entrenamiento[clase] instanceof Array)) {
					        	$scope.entrenamiento[clase] = [];
					        }
					        $scope.entrenamiento[clase].push(nuevo); 
					        //console.log(nuevo.join(';'));
					    },
					});
					htmlAudioElement.play();
					analyzer.start();
					htmlAudioElement.addEventListener('ended', function() {
						analyzer.stop();
						nuevoAudio.remove();
						$scope.$digest();
				    }, false);
				}, 0);
			};
			
			var MIN_CLAMP = [72,61,-779,-868,-1062,-895,-897,-832,-1042,-1233,-1257,-1258,-1034];
			var MAX_CLAMP = [7639,6184,3266,2550,1981,1474,964,982,1089,486,484,405,352];
			var MIN_OUT = -3;
			var MAX_OUT = 3;
		    var vectorNormalizado = function(vector, usarminmax) {
		    	if (vector instanceof Array) {
			    	var nuevo = [];
			    	for (var i=0; i<vector.length; i++) {
			    		if (usarminmax) {
			    			var dato = parseInt(vector[i]);
				    		var min = MIN_CLAMP[i];
				    		var max = MAX_CLAMP[i];
				    		var diff = (max-min);
				    		dato = ((dato-min)/diff);
				    		dato = ((dato)*(MAX_OUT - MIN_OUT) + MIN_OUT);
				    		nuevo.push(dato);
			    		} else {
				    		var dato = parseInt(vector[i]*100);
			    			nuevo.push(dato);
			    		}
			    	}
			    	return nuevo;
		    	} else {
		    		return null;
		    	}
		    };
			
			$scope.entrenar = function() {
				
				data.splice(0, data.length);
				labels.splice(0, labels.length);
				
				var MINS = [null,null,null,null,null,null,null,null,null,null,null,null,null];
				var MAXS = [null,null,null,null,null,null,null,null,null,null,null,null,null];
				
				var clases = Object.keys($scope.entrenamiento);
				for (var i=0; i<clases.length; i++) {
					var clase = clases[i];
					var datos = $scope.entrenamiento[clase];
					for(var k=0; k<datos.length; k++) {
						var undato = datos[k];
						undato = vectorNormalizado(undato, true);
						data.push(undato);
						labels.push(parseInt(clase));
						for (var n=0; n<undato.length; n++) {
							var undatico = undato[n];
							if (MINS[n] == null || undatico < MINS[n]) {
								MINS[n] = undatico;
							}
							if (MAXS[n] == null || undatico > MAXS[n]) {
								MAXS[n] = undatico;
							}
						}
					}
				}
				console.log(JSON.stringify(MINS));
				console.log(JSON.stringify(MAXS));
				N = labels.length;
				
			};
			
			init();
		}
    };
}]);