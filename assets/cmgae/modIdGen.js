
var modIdGen = (function(){
	var	RANDOM_SPACE = 3;
	var MAX_LENGTH_ORD_TEXT = 11+Math.ceil(RANDOM_SPACE*0.63);
	var RANDOM_SPACE_MULT = Math.pow(10, RANDOM_SPACE);
	var DIFF_GMT_5 = 5*60*60*1000;

	var nuevo = function(epoch, esInicio) {
		var diferido = $.Deferred();
		if (typeof epoch == 'number') {
			if (typeof esInicio == 'boolean') {
				if (esInicio === true) {
					epoch = darInicioDia(epoch);
				} else {
					epoch = darFinDia(epoch);
				}
				diferido.resolve(num2ord(epoch, esInicio));
			} else {
				diferido.resolve(num2ord(epoch));
			}
		} else {
			modIdGen.ahora().then(function(fecha) {
				diferido.resolve(num2ord(fecha, esInicio));
			});
		}
		return diferido;
	};
	
	var nuevoIni = function(epoch) {
		return nuevo(epoch, true);
	};
	
	var nuevoFin = function(epoch) {
		return nuevo(epoch, false);
	};	
	
	var num2ord = function(num, esInicio) {
		if (typeof num == 'number') {
			var nuevo;
			if (typeof esInicio == 'boolean') {
				if (esInicio === true) {
					nuevo = (num*RANDOM_SPACE_MULT);
				} else {
					nuevo = (num*RANDOM_SPACE_MULT)+(RANDOM_SPACE_MULT-1);
				}
			} else {
				nuevo = (num*RANDOM_SPACE_MULT)+Math.floor(Math.random()*RANDOM_SPACE_MULT);
			}
			//console.log(num, nuevo);
			var temp = (nuevo).toString(36);
			var diff = MAX_LENGTH_ORD_TEXT - temp.length;
			if (diff > 0) {
				temp = (new Array(diff).join('0'))+(temp);
			}
			return temp;
		}
		return null;
	};
	
	var num2ordIni = function(num) {
		return num2ord(num, true);
	};
	
	var num2ordFin = function(num) {
		return num2ord(num, false);
	};

	var prueba = function() {
		var MAGNITUD_PRUEBA = 1000000;
		for (var i=0; i<1000; i++) {
			var prueba1 = Math.floor(Math.random() * MAGNITUD_PRUEBA);
			var prueba2 = Math.floor(Math.random() * MAGNITUD_PRUEBA);
			
			var con1 = modIdGen.num2ord(prueba1);
			var con2 = modIdGen.num2ord(prueba2);
			if (prueba1 > prueba2 && con1 > con2) {
				//console.log('ok', prueba1, prueba2, con1, con2);
			} else if (prueba1 < prueba2 && con1 < con2) {
				//console.log('ok', prueba1, prueba2, con1, con2);
			} else if (prueba1 == prueba2 && con1 == con2) {
				//console.log('ok', prueba1, prueba2, con1, con2);
			} else {
				console.log('error', prueba1, prueba2, con1, con2);
			}
		}

		modIdGen.ahora().then(function(fecha){
			
			var inicioDia = modIdGen.darInicioDia(fecha);
			var inicioMes = modIdGen.darInicioMes(fecha);
			var finDia = modIdGen.darFinDia(fecha);
			var finMes = modIdGen.darFinMes(fecha);
			
			console.log(fecha, modIdGen.epoch2Text2(fecha), 'fecha y hora actual');
			console.log(inicioDia, modIdGen.epoch2Text2(inicioDia), 'inicio del día');
			console.log(finDia, modIdGen.epoch2Text2(finDia), 'fin del día');
			console.log(inicioMes, modIdGen.epoch2Text2(inicioMes), 'inicio del mes');
			console.log(finMes, modIdGen.epoch2Text2(finMes), 'fin del mes');
			
			var inicioDiaId = modIdGen.num2ordIni(inicioDia);
			var inicioMesId = modIdGen.num2ordIni(inicioMes);
			var finDiaId = modIdGen.num2ordFin(finDia);
			var finMesId = modIdGen.num2ordFin(finMes);
			
			modIdGen.nuevoIni(fecha).then(function(inicioDiaId2) {
				console.log(inicioDiaId == inicioDiaId2);
			});
			modIdGen.nuevoFin(fecha).then(function(finDiaId2) {
				console.log(finDiaId == finDiaId2);
			});
			
			
			for (var i=0; i<10; i++) {
				modIdGen.nuevo().then(function(nuevoId) {
					console.log(nuevoId, inicioDiaId <= nuevoId, inicioMesId <= nuevoId, nuevoId <= finDiaId, nuevoId <= finMesId);
				});
			}
		});
		
		modIdGen.edad(new Date(1985, 12-1, 4)).then(function(anios) {
			console.log('anios', anios);
		});
	};
	
	//Retorna un diferido con la fecha
	var diferenciaFechaServidor = null;
	var diferidoInvocacion = null;
	var ahora = function() {
		var diferido = $.Deferred();
		
		var sincronizar = function() {
			diferidoInvocacion = $.Deferred();
			var URL_GET_DATE = '/api/tup/fecha';
			$.ajax({
			  url: URL_GET_DATE,
			  data: null,
			  success: function(rta) {
				var temp = rta.unixtime;
				diferenciaFechaServidor = new Date().getTime() - temp;
				diferido.resolve(temp);
				diferidoInvocacion.resolve();
			  },
			  dataType: 'json',
			});
		};
		
		var usarDiferencia = function() {
			var temp = new Date().getTime();
			diferido.resolve(temp - diferenciaFechaServidor);
		};
		
		if (diferenciaFechaServidor == null) {
			if (diferidoInvocacion == null) {
				sincronizar();
			} else {
				diferidoInvocacion.then(function() {
					//Ya se puede usar la diferencia
					usarDiferencia();
				});
			}
		} else {
			usarDiferencia();
		}
		
		return diferido;
	};
	
	function edad(birthday) { // birthday is a date
		var diferido = $.Deferred();
		ahora().then(function(fecha) {
			var ageDifMs = fecha - birthday.getTime();
			var ageDate = new Date(ageDifMs); // miliseconds from epoch
			var ans = Math.abs(ageDate.getUTCFullYear() - 1970);
			diferido.resolve(ans);
		});
		return diferido;
	}
	
	function addZero(i) {
	  if (i < 10) {
	    i = "0" + i;
	  }
	  return i;
	}
	
	//Solo año/mes/día
	var epoch2Text = function(tiempo) {
		if (typeof tiempo == 'number') {
			var fecha = new Date(tiempo);
			return fecha.getFullYear()+'/'+(fecha.getMonth()+1)+'/'+fecha.getDate();
		} else {
			return '';
		}
	};

	//Año/mes/día hora:mm:ss
	var epoch2Text2 = function(tiempo) {
		if (typeof tiempo == 'number') {
			var fecha = new Date(tiempo);
			return fecha.getFullYear()+'/'+addZero(fecha.getMonth()+1)+'/'+addZero(fecha.getDate())+' '+addZero(fecha.getHours())+':'+addZero(fecha.getMinutes())+':'+addZero(fecha.getSeconds());
		} else {
			return '';	
		}
	};
	
	var darInicioMes = function(epoch) {
		var start = new Date(epoch);
		var firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
		return firstDay.getTime();
	};
	
	var darFinMes = function(epoch) {
		var start = new Date(epoch);
		var lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
		lastDay.setHours(23,59,59,999);
		return lastDay.getTime();
	};

	var darInicioDia = function(epoch) {
		var start = new Date(epoch);
		start.setHours(0,0,0,0);
		return start.getTime();
	};

	var darFinDia = function(epoch) {
		var end = new Date(epoch);
		end.setHours(23,59,59,999);
		return end.getTime();
	};
	
	return {
		'epoch2Text': epoch2Text,
		'epoch2Text2': epoch2Text2,
		'darInicioDia': darInicioDia,
		'darFinDia': darFinDia,
		'darInicioMes': darInicioMes,
		'darFinMes': darFinMes,
		'nuevo': nuevo,
		'nuevoIni': nuevoIni,
		'nuevoFin': nuevoFin,
		'num2ord': num2ord,
		'prueba': prueba,
		'ahora': ahora,
		'edad': edad,
		'num2ordIni': num2ordIni,
		'num2ordFin': num2ordFin,
	};
})();