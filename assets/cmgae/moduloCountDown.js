"use strict";

var moduloCountDown = (function() {
	
		var instancia = function(funcionRefresco) {
			var ultimoTimeout = null;
			var CONTEO = 0;
			var PERIODO = 1;
			var pendiente = null;

			
			function addZero(i) {
			  if (i < 10) {
				i = "0" + i;
			  }
			  return i;
			}
			
			var formatearTiempo = function(segundos) {
				var horas = Math.floor(segundos/3600);
				segundos-=3600*horas;
				var minutos = Math.floor(segundos/60);
				segundos-=60*minutos;
				var salida = ''+addZero(parseInt(segundos));
				if (minutos > 0 || horas > 0) {
					salida = addZero(minutos)+':'+salida;
				}
				if (horas > 0) {
					salida = addZero(horas)+':'+salida;
				}
				return salida;
			};
			
			var destruirTimeout = function() {
				if (ultimoTimeout != null) {
					clearTimeout(ultimoTimeout);
					ultimoTimeout = null;
				}
			};
			
			var startTimer = function(segundos) {
				if (typeof segundos == 'undefined') {
					if (typeof pendiente == 'number') {
						segundos = pendiente;
					} else {
						console.log('Se esperaba que el primer parámetro fuera el número de segundos que desea contabilizar');
						return;
					}
				} else {
					stop();
				}
				pendiente = segundos;
				destruirTimeout();
				funcionRefresco('inicio');
				var iterativa = function() {
					var detalle = {
						txt: formatearTiempo(pendiente-CONTEO),
						avance: (1-(CONTEO/pendiente)),
					};
					CONTEO+=PERIODO;
					if (CONTEO > pendiente) {
						PERIODO = (pendiente - (CONTEO - PERIODO));
						CONTEO = pendiente;
					}
					funcionRefresco('paso', detalle);
					if (CONTEO <= pendiente) {
						ultimoTimeout = setTimeout(function() {
							if (CONTEO == pendiente) {
								stop();
							} else {
								iterativa();
							}
						}, 1000*PERIODO);
					} else {
						stop();
					}
				};
				iterativa();
			};
			
			var stop = function() {
				CONTEO = 0;
				destruirTimeout();
				var detalle = {
					'txt': formatearTiempo(0),
				};
				funcionRefresco('fin', detalle);
				pendiente = null;
			};
			
			var agregar = function(segundos) {
				if (pendiente !== null) {
					pendiente += segundos;
				}
			};
			
			var pause = function() {
				destruirTimeout();
			};
			
			return {
				'start': startTimer,
				'agregar': agregar,
				'stop': stop,
				'pause': pause,
			};
		};
		
		return {
			'crear': instancia,
		}
	})();

var moduloDonaCountDown = (function($) {
	
	//var COLORES = [{v: [161, 255, 158], p: 0}, {v: [255, 253, 158], p: 0.5}, {v: [255, 158, 158], p: 1}];
	var COLORES = [{v: [120], p: 0}, {v: [0], p: 1}];
	var TEMPLATE = '<div class="countdownTimerP">\
		<div class="countdownTimer">\
			<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">\
				 <g>\
					<circle cx="1" cy="1" r="1" stroke-width="0" fill="none" stroke="grey" class="circle afuera" />\
					<circle cx="1" cy="1" r="1" stroke-width="1" fill="none" class="circle_animation" />\
					<circle cx="1" cy="1" r="1" stroke-width="1" fill="none" stroke="grey" class="circle adentro" />\
				 </g>\
			</svg>\
			<span class="timeNumber"></span>\
		</div>\
	</div>';

	var inicializar = function(elem, opciones) {
		
		opciones = $.extend(true, {
			borde: 15,
		}, opciones);
		
		var imagen = elem.find('img');
		
		if (imagen.length == 0) {
			return;
		}
		
		if (elem.find('.countdownTimer').length > 0) {
			return;
		}
		
		var recalcularDimensiones = function() {
			var lado = imagen.width();
			var radio = (lado+opciones.borde)/2;
			var anchoTotal = lado+2*opciones.borde;
			var medioAncho = anchoTotal/2;
			MAX_LENGTH = 2*Math.PI*radio;
			var miSVG = elem.find('svg');
			miSVG.attr('width', anchoTotal);
			miSVG.attr('height', anchoTotal);
			miSVG.find('circle').attr('cx', medioAncho);
			miSVG.find('circle').attr('cy', medioAncho);
			
			miSVG.find('circle.afuera').attr('r', lado*0.5+opciones.borde);
			miSVG.find('circle.adentro').attr('r', lado*0.5);
			
			var circle_animation = miSVG.find('circle.circle_animation');
			circle_animation.attr('r', (lado+opciones.borde)*0.5);
			circle_animation.attr('stroke-width', opciones.borde);
			circle_animation.css({
				'stroke-dasharray': MAX_LENGTH,
				'stroke-dashoffset': MAX_LENGTH,
			});
			
			elem.find('.countdownTimer').css({
				'left': -1*(opciones.borde)+'px',
				'top': -1*(lado+opciones.borde+4)+'px',
			});
			
			var tamTexto = (lado/4);
			elem.find('.timeNumber').css({
				'font-size': tamTexto.toFixed(0)+'px',
				'top': ((lado-tamTexto)*0.5+opciones.borde-5).toFixed(0)+'px',
			});
		};
		
		elem.append($(TEMPLATE));
		
		var principal = elem.find('.countdownTimer');
		var MAX_LENGTH;
		var dona = principal.find('.circle_animation');
		var tiempito = principal.find('.timeNumber');
		
		recalcularDimensiones();
		
		var conteo = moduloCountDown.crear(function(evento, detalle) {
			if (evento == 'inicio') {
				dona.css({'stroke-dashoffset': MAX_LENGTH });
			} else if (evento == 'fin') {
				tiempito.html(detalle.txt);
				dona.css({'stroke-dashoffset': 0});
			} else if (evento == 'paso') {
				//Debo recorrer desde MAX_LENGTH hasta cero en X segundos en periodos de PERIODO
				tiempito.html(detalle.txt);
				var colorcito = moduloInterpolar.map(1-detalle.avance, COLORES);
				dona.css({'stroke-dashoffset': (MAX_LENGTH)*detalle.avance, 'stroke': 'hsl('+colorcito[0]+',100%,50%)'});
			}
		});
		return conteo;
	};
	
	return {
		'inicializar': inicializar,
	};
})(jQuery);

//var conteo = moduloDonaCountDown.inicializar($('#pruebaCount'));