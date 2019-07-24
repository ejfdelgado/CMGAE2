
if (!hayValor(moduloJuegoVista)) {
	
	//Responde: ¿cuántas personas eligieron una pregunta dada?
	var totalizarSumaRespuestas = function(metadata) {
		var totales = {};
		if (hayValor(metadata.jugadores)) {
			let llavePregunta = metadata.idPregunta;
			let respuestas = metadata.preguntaActual.respuestas;
			let llavesRespuestas = Object.keys(respuestas);
			$.each(metadata.jugadores, function(jugador, unJugador) {
				//Se cruza cada jugador con la elección
				if (hayValor(unJugador.respuestas)) {
					var eleccion = unJugador.respuestas[llavePregunta];
					if (hayValor(eleccion)) {
						if (estaEnLista(''+eleccion, llavesRespuestas)) {
							if (!esNumero(totales[eleccion])) {
								totales[eleccion] = 1;
							} else {
								totales[eleccion]+=1;
							}
						}
					}
				}
			});
		}
		return totales;
	};
	
	var regenerarPuntajes = function(datos) {
		console.log('regenerarPuntajes');
		if (hayValor(datos.jugadores)) {
			$.each(datos.jugadores, function(jugador, unJugador) {
				//Se cruza cada jugador con los puntajes
				unJugador.puntos = 0;
				if (hayValor(unJugador.respuestas)) {
					$.each(unJugador.respuestas, function(llavePregunta, valorRespuesta) {
						if (hayValor(datos.juego.preguntas[llavePregunta])) {
							var posibles = datos.juego.preguntas[llavePregunta].respuestas;
							if (hayValor(posibles[valorRespuesta])) {
								unJugador.puntos+=parseInt(posibles[valorRespuesta].puntos);
							}
						}
					});
				}
			});
		}
	};
	
	var pluginsModuloVistaJuego = {
		'score': {
			boton: {icono:'fa-star', color: 'btn-default'},
			programa: function(metadata) {
				return {
					'url': '/assets/cmgae/juego/modos/score.html', 
					'funInicio': function(plantilla) {
						regenerarPuntajes(metadata);
						return $(plantilla);
					},
					'lista': metadata.jugadores,
					'funIter': function(plantilla, i, llave, unJugador) {
						plantilla = plantilla.replace('$1', darHtmlSeguro(unJugador.apodo));
						plantilla = plantilla.replace('$2', unJugador.puntos);
						var nuevo = $(plantilla);
						nuevo.find('.abc-chao').on('click', function() {
							metadata.moduloJuego.borrarJugador(llave);
						});
						return nuevo;
					},
					'funOrdenar': function(a, b) {
						return a.puntos-b.puntos;
					}
				};
			},
		},
		'reloj': {
			boton: {icono:'fa-clock-o', color: 'btn-danger'},
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/reloj.html', 
					'recargarHtml': false,
					'funInicio':function(plantilla) {
						plantilla = plantilla.replace('$1', darHtmlSeguro(metadata.preguntaActual.texto));
						return $(plantilla);
					},
					'funFinalizar':function() {
						var elTimer = moduloTimer($('div.timer')); 
						var segundos = utilidades.leerObj(metadata, 'preguntaActual.segundos', 10);
						var promesa = elTimer.iniciar(segundos);
						metadata.moduloJuego.publicarJuego();
						$.when(promesa).then(function() {
							metadata.moduloJuego.terminarJuego();
						});
					},
				};
			},
		},
		'historia': {
			boton: {icono:'fa-question', color: 'btn-info'},
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/historia.html', 
					'recargarHtml': false,
					'funInicio':function(plantilla) {
						asignarTituloPagina(metadata.preguntaActual.titulo);//TODO el título no llega, ¿por qué?
						plantilla = plantilla.replace('$1', metadata.preguntaActual.href);
						plantilla = plantilla.replace('$3', darHtmlSeguro(metadata.preguntaActual.respuesta));
						return $(plantilla);
					},
					'lista':metadata.preguntaActual.respuestas,
					'funFinalizar': function() {
						$('.mi-boton-final').on('click', function() {
							if (esFuncion(metadata.moduloJuego.usuarioEligeRespuesta)) {
								metadata.moduloJuego.usuarioEligeRespuesta();
							}
						});
					},
					'funIter':function(plantilla, i, llave, elemento) {
						plantilla = plantilla.replace('$2', darHtmlSeguro(elemento.texto));
						plantilla = plantilla.replace('$4', i);
						var nuevo = $(plantilla);
						var miInput = nuevo.find('input')[0]; 
						var funcionFinal = function() {
							//Hacer exluyentes las demás
							nuevo.parent().find('input').each(function(i, elem) {
								if (elem != miInput) {
									elem.checked = false;
								}
							});
							//Mostrar el botón del final si hay al menos una opción
							var tam = nuevo.parent().find('input:checked').length;
							if (tam == 0) {
								$('.mi-boton-final').addClass('invisible');
							} else {
								metadata.moduloJuego.usuarioTomaRespuesta(llave, elemento, nuevo, metadata.preguntaActual.id);
								$('.mi-boton-final').removeClass('invisible');
							}
						};
						nuevo.on('click', funcionFinal);
						nuevo.click(funcionFinal);
						return nuevo;
					}
				};
			},
		},
		'pregunta': {
			boton: {icono:'fa-question', color: 'btn-info'},
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/pregunta.html', 
					'recargarHtml': false,
					'funInicio':function(plantilla) {
						plantilla = plantilla.replace('$1', darHtmlSeguro(metadata.preguntaActual.texto));
						plantilla = plantilla.replace('$3', darHtmlSeguro(metadata.preguntaActual.respuesta));
						return $(plantilla);
					},
					'lista':metadata.preguntaActual.respuestas,
					'funIter':function(plantilla, i, llave, elemento) {
						plantilla = plantilla.replace('$2', darHtmlSeguro(elemento.texto));
						var nuevo = $(plantilla);
						nuevo.find('.panel-body').css('background-color', elemento.color);
						var funcionFinal = function() {
							if (esFuncion(metadata.moduloJuego.usuarioEligeRespuesta)) {
								metadata.moduloJuego.usuarioEligeRespuesta(llave, elemento, nuevo, metadata.preguntaActual.id);
							}
						};
						nuevo.on('doubletap', funcionFinal);
						nuevo.dblclick(funcionFinal);
						return nuevo;
					}
				};
			},
		},
		'blanco': {
			boton: null,
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/blanco.html', 
					'recargarHtml': true,
					'funInicio':function(plantilla) {
						return $(plantilla);
					}
				};
			},
		},
		'respuesta': {
			boton: {icono:'fa-check', color: 'btn-primary'},
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/respuesta.html', 
					'recargarHtml': false,
					'funInicio':function(plantilla) {
						plantilla = plantilla.replace('$1', darHtmlSeguro(metadata.preguntaActual.respuesta));
						return $(plantilla);
					}
				};
			},
		},
		'barras': {
			boton: {icono:'fa-bar-chart', color: 'btn-danger'},
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/barras.html', 
					'funInicio': function(plantilla) {
						plantilla = plantilla.replace('$1', darHtmlSeguro(metadata.preguntaActual.texto));
						return $(plantilla);
					},
					'recargarHtml': false,
					'funFinalizar':function() {
						//1. Se crea la data
						if (!hayValor(metadata.data)) {
							metadata.data = {
							  labels: [],
							  datasets: [{
							    label: "# de Personas",
							    backgroundColor: "rgba(255,99,132,0.2)",
							    borderColor: "rgba(255,99,132,1)",
							    borderWidth: 2,
							    hoverBackgroundColor: "rgba(255,99,132,0.4)",
							    hoverBorderColor: "rgba(255,99,132,1)",
							    data: [],
							  }]
							};
						}
						
						metadata.data.labels = [];
						metadata.data.datasets[0].data = [];
						
						var totales = totalizarSumaRespuestas(metadata);
						
						$.each(metadata.preguntaActual.respuestas, function(llave, valor) {
							metadata.data.labels.push(valor.texto);
							if (esNumero(totales[llave])) {
								metadata.data.datasets[0].data.push(totales[llave]);
							} else {
								metadata.data.datasets[0].data.push(0);
							}
						});

						//2. Se crean las opciones
						if (!hayValor(metadata.chart)) {
							var options = {
								responsive: true,
			                    legend: {position: 'top',},
			                    maintainAspectRatio: false,
							  scales: {
							    yAxes: [{
							      stacked: true,
							      gridLines: {
							        display: true,
							        color: "rgba(255,99,132,0.2)"
							      }
							    }],
							    xAxes: [{
							      gridLines: {
							        display: false
							      }
							    }]
							  }
							};
							//Se inicializar el chart
							metadata.chart = Chart.Bar('chart', {
							  options: options,
							  data: metadata.data,
							});
						} else {
							metadata.chart.update();
						}
					}
				};
			},
		},
		'dona': {
			boton: {icono:'fa-pie-chart', color: 'btn-danger'},
			programa: function(metadata) {
				return {
					'url':'/assets/cmgae/juego/modos/dona.html', 
					'funInicio': function(plantilla) {
						plantilla = plantilla.replace('$1', darHtmlSeguro(metadata.preguntaActual.texto));
						return $(plantilla);
					},
					'recargarHtml': false,
					'funFinalizar':function() {
						//1. Se crea la data
						if (!hayValor(metadata.config)) {
							metadata.config = {
						        type: 'doughnut',
						        data: {
						            datasets: [{
						                data: [],
						                backgroundColor: [],
						                label: '# de Personas'
						            }],
						            labels: []
						        },
						        options: {
						            responsive: true,
						            legend: {
						                position: 'top',
						            },
						            title: {
						                display: true,
						                text: ''
						            },
						            animation: {
						                animateScale: true,
						                animateRotate: true
						            }
						        }
						    };
						}
						
						metadata.config.data.labels = [];
						metadata.config.data.datasets[0].data = [];
						
						var totales = totalizarSumaRespuestas(metadata);
						
						$.each(metadata.preguntaActual.respuestas, function(llave, valor) {
							metadata.config.data.labels.push(valor.texto);
							metadata.config.data.datasets[0].backgroundColor.push(valor.color);
							if (esNumero(totales[llave])) {
								metadata.config.data.datasets[0].data.push(totales[llave]);
							} else {
								metadata.config.data.datasets[0].data.push(0);
							}
						});

						//2. Se crean las opciones
						if (!hayValor(metadata.chart)) {
					        var ctx = document.getElementById("chart-area").getContext("2d");
					        metadata.chart = new Chart(ctx, metadata.config);
							//Se inicializar el chart
						} else {
							metadata.chart.update();
						}
					}
				};
			},
		},
	};
	
	var moduloJuegoVista = function(jElem, jElemHead, juego, moduloJuego) {
		var datos = {
			elem: $(jElem),
			elemHead: $(jElemHead),
			juego: juego,
			jugadores: null,
			modo: null,
			idPregunta: null,
			preguntaActual: null,
			moduloJuego: moduloJuego,
			metadata: null,
			ultimaPlantilla: null,
			ultimaPregunta: null,
		};
		
		var asignarModuloJuego = function(moduloJuego) {
			datos.moduloJuego = moduloJuego;
		};
		
		var asignarPreguntaActual = function(idPregunta, preguntaActual) {
			datos.idPregunta = idPregunta;
			datos.preguntaActual = preguntaActual;
		};
		
		var botones = {};
		var modos = {};
		
		for (let llave in pluginsModuloVistaJuego) {
			let unPlugin = pluginsModuloVistaJuego[llave];
			botones[llave] = unPlugin.boton;
			modos[llave] = unPlugin.programa;
		}
		
		var actualizar = function() {
			var temp = modos[datos.modo](datos.metadata);
			if (hayValor(temp)) {
				remplazarContenido(temp);
			} else {
				//Solo borra todo
				datos.elem.empty();
			}
		};
		
		var asignarModo = function(llave) {
			console.log('asignarModo', llave);
			if (!estaEnLista(llave, Object.keys(modos))) {
				return;
			}
			if (datos.modo !== llave) {
				//Se recrea la metadata
				datos.metadata = {};
			}
			datos.metadata['idPregunta'] = datos.idPregunta;
			datos.metadata['preguntaActual'] = datos.preguntaActual;
			datos.metadata['moduloJuego'] = datos.moduloJuego;
			datos.metadata['jugadores'] = datos.jugadores;
			datos.metadata['juego'] = datos.juego;
			
			datos.modo = llave;
			actualizar();
		};
		
		var asignarPrimerModo = function() {
			console.log('asignarPrimerModo');
			asignarModo(Object.keys(datos.preguntaActual.vistas)[0]);
		};
		
		var asignarJugadores = function(jugadores) {
			console.log('asignarJugadores', datos.modo)
			datos.jugadores = jugadores;
			//Pide actualizar el modo actual
			if (!hayValor(datos.modo)) {
				asignarPrimerModo();
			} else {
				asignarModo(datos.modo);
			}
		};
		
		var remplazarContenido = function(props) {
			if (!hayValor(props.recargarHtml)) {
				props.recargarHtml = true;
			}
			
			var funcionDespues = function(plantilla, tieneContenido) {
				console.log('funcionDespues', tieneContenido);
				datos.ultimaPlantilla = props.url;
				datos.ultimaPregunta = datos.idPregunta;
				if (tieneContenido) {
					datos.elem.empty();
					if (esFuncion(props.funInicio)) {
						datos.elem.append(props.funInicio(plantilla, datos.metadata));
					} else {
						datos.elem.append($(plantilla));
					}
				}
				if (hayValor(props.lista)) {
					var listaValores = [];
					var llavesLlaves = [];
					$.each(props.lista, function(llaveLista, valorLista) {
						listaValores.push(valorLista);
						llavesLlaves.push(llaveLista);
					});
					if (esFuncion(props.funOrdenar)) {
						listaValores.sort(props.funOrdenar);
					}
					var repetido = datos.elem.find('.abc-repetir');
					if (repetido.length > 0) {
						repetido.removeClass('abc-repetir');
						repetido.removeClass('invisible');
						var plantilla = darHtmlCompleto(repetido);
						$.each(listaValores, function(i, unJugador) {
							var nuevo = props.funIter(plantilla, i, llavesLlaves[i], unJugador, datos.metadata);
							repetido.after(nuevo);
						});
						repetido.remove();
					}
				}
				
				var funcionEsperarImagenes = function(elem) {
					elem.find('img').each(function(){
						var imagen = $(this);
					    var imgSrc = imagen.attr("src"); //get the image src so it can be put back in to convince IE to run the .load() function correctly
					    var diferidoAct = moduloActividad.on();
					    if (moduloCrossBrowser.esiOS()) {
						    var checkearfin = function() {
						    	var tam = imagen.height();
						    	if (tam > 0) {
						    		diferidoAct.resolve();
						    	} else {
						    		setTimeout(checkearfin, 500);
						    	}
						    };
						    checkearfin();
					    } else {
						    $(this).load(function(){
						        //do something as the images are loaded (eg, count them to make sure they're all loaded then run a callback)
						    	diferidoAct.resolve();
						    }).attr("src", imgSrc); //makes .load() work in IE when images are cached
					    }
					});
				};
				
				//mira si se deben cargar htmls externos
				$('[data-incluir]').each(function(i, elem) {
					var jelem = $(elem);
					var incluirHref = jelem.attr('data-incluir');
					if (hayValor(incluirHref)) {
						var promesaIncluir = moduloHttp.get(incluirHref, true);
						promesaIncluir.then(function(contenidoIncluir) {
							jelem.html(contenidoIncluir);
							funcionEsperarImagenes(jelem);
							moduloHistoria.inicializar();
						});
					}
				});
				
				if (esFuncion(props.funFinalizar)) {
					props.funFinalizar(datos.metadata);
				}
			};
			
			if (
					props.recargarHtml == false && 
					datos.ultimaPlantilla == props.url &&
					datos.ultimaPregunta == datos.idPregunta) {
				funcionDespues(null, false);
			} else {
				var promesa = moduloHttp.get(props.url, true);
				promesa.then(function(plantilla) {
					funcionDespues(plantilla, true);
				});
			}
		};
		
		var generarBoton = function(llave, config) {
			if (!hayValor(config)){return null;}
			var boton = $('<button type="button" class="btn abc-jugar"><i class="fa" aria-hidden="true"></i></button>');
			boton.addClass(config.color);
			boton.find('i').addClass(config.icono);
			boton.on('click', function() {
				asignarModo(llave);
			});
			return boton;
		};
		
		var regenerarBotonesVista = function(pregunta) {
			datos.elemHead.empty();
			$.each(pregunta.vistas, function(llave, val) {
				var boton = generarBoton(llave, botones[llave]);
				if (hayValor(boton)) {
					datos.elemHead.append(boton);
				}
			})
		};
		
		//Va a una pregunta específica
		var irA = function(indice) {
			datos.idPregunta = datos.juego.orden[indice];
			datos.preguntaActual = datos.juego.preguntas[datos.idPregunta];
			$.each(datos.preguntaActual.respuestas, function(llave, valor) {
				valor.color = darColorAleatorio(180);
			});
			regenerarBotonesVista(datos.preguntaActual);
			asignarPrimerModo();
		};
		
		return {
			'asignarJugadores': asignarJugadores,
			'irA': irA,
			'asignarModo': asignarModo,
			'asignarPreguntaActual': asignarPreguntaActual,
			'asignarModuloJuego': asignarModuloJuego,
			'asignarPrimerModo': asignarPrimerModo,
			'actualizar': actualizar,
		};
	};
}