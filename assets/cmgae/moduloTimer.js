if (!hayValor(moduloTimer)) {
	var moduloTimer = function(referencia) {
		var NOMBRE_DATA = 'moduloTimer';
		var refAnterior = referencia.data(NOMBRE_DATA);
		if (hayValor(refAnterior)) {
			return refAnterior;
		};
		
		var ESTADO = 0;
		var timer;
		var timerCurrent;
		var timerFinish;
		var timerSeconds;
		var diferido = null;
		
		//Asigna el timer en un valor dado
		var asignarPorcentaje = function (percent){
			referencia.html('<div class="percent"></div><div class="slice"'+(percent > 50?' class="gt50"':'')+'><div class="pie"></div>'+(percent > 50?'<div class="pie fill"></div>':'')+'</div>');
			var deg = 360/100*percent;
			referencia.find('.slice .pie').css({
				'-moz-transform':'rotate('+deg+'deg)',
				'-webkit-transform':'rotate('+deg+'deg)',
				'-o-transform':'rotate('+deg+'deg)',
				'transform':'rotate('+deg+'deg)'
			});
			var cuenta = timerSeconds*(100 - Math.round(percent))/100;
			referencia.find('.percent').text(parseInt(cuenta));
			
			if (percent > 50) {
				referencia.find('.slice').css({position: 'inherit'});
			} else {
				referencia.find('.slice').css({position: 'absolute'});
			}
		};

		var stopWatch = function (){
			var seconds = (timerFinish-(new Date().getTime()))/1000;
			if(seconds <= 0){
				asignarPorcentaje(100);
				clearInterval(timer);
				ESTADO = 0;
				diferido.resolve();
			} else {
				var percent = 100-((seconds/timerSeconds)*100);
				asignarPorcentaje(percent);
			}
		};
		
		var asingarTamanio = function (pixeles) {
			referencia.css('font-size',pixeles+'px');
		};
		
		var iniciar = function(segundos) {
			if(ESTADO == 0) {
				diferido = $.Deferred();
				ESTADO = 1;
				timerSeconds = segundos;
				timerCurrent = 0;
				timerFinish = new Date().getTime()+(timerSeconds*1000);
				timer = setInterval(stopWatch,50);
			}
			return diferido.promise();
		};
		
		var toggle = function (segundos) {
			if(ESTADO == 0){
				iniciar();
			} else {
				ESTADO = 0;
				clearInterval(timer);
			}
			return diferido.promise();
		};
		
		referencia.data(NOMBRE_DATA, {
			'toggle': toggle,
			'asignarPorcentaje': asignarPorcentaje,
			'iniciar': iniciar,
		});
		
		return referencia.data(NOMBRE_DATA);
	};
}