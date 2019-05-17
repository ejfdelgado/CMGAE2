"use strict";

var moduloModales;
(function($) {

	console.log("Iniciando Módulo de modales JS");

	moduloModales = (function() {

		var error = function(datos) {
			//console.log(datos)
			var error = 'Ups, ha ocurrido un error inesperado.';
			if (datos) {
				if (utilidades.hayValorTexto(datos.error)) {
					error = datos.error;
				} else if (utilidades.hayValor(datos.responseJSON)) {
					if (utilidades.hayValorTexto(datos.responseJSON.message)) {
						error = datos.responseJSON.message;
					} else if (utilidades.hayValorTexto(datos.responseJSON.error)) {
						error = datos.responseJSON.error;
					}
				}
			}
			var temp = bootbox.alert({
			    title: "Error",
			    message: error,
			    className: 'bootstrap-iso',
			    buttons: {
			        ok: {
			            label: 'Aceptar',
			            className: 'btn-success'
			        }
			    },
			});
			ajustarScroll(temp);
		};

		var alertar = function(mensaje) {
			var diferido = $.Deferred();
			var temp = bootbox.alert({
			    title: "Alerta",
			    message: mensaje,
			    className: 'bootstrap-iso',
			    buttons: {
			        ok: {
			            label: 'Aceptar',
			            className: 'btn-success'
			        }
			    },
			    callback: function () {
			    	diferido.resolve();
			    }
			});
			ajustarScroll(temp);
			return diferido;
		};

		var info = function(mensaje, titulo) {
			if (!utilidades.hayValorTexto(titulo)) {
				titulo = 'Información';
			}
			var temp = bootbox.alert({
			    title: titulo,
			    message: mensaje,
			    className: 'bootstrap-iso',
			    buttons: {
			        ok: {
			            label: 'Aceptar',
			            className: 'btn-success'
			        }
			    },
			});
			ajustarScroll(temp);
		};

		var confirmar = function(mensaje) {
			if (!utilidades.hayValorTexto(mensaje)) {
				mensaje = "¿Está seguro de realizar esta acción?";
			}
			var diferido = $.Deferred();
			var temp = bootbox.confirm({
			    message: mensaje,
			    buttons: {
			        confirm: {
			            label: 'Sí',
			            className: 'btn-success'
			        },
			        cancel: {
			            label: 'No',
			            className: 'btn-danger'
			        }
			    },
			    callback: function (result) {
			    	if (result) {
			    		diferido.resolve();
			    	} else {
			    		diferido.reject();
			    	}
			    }
			});
			ajustarScroll(temp);
			return diferido.promise();
		};

		var ajustarScroll = function(temp) {
			temp.on('shown.bs.modal', function(e){
				var contenido = $('.modal-dialog .modal-content');
				var altura = contenido.outerHeight();

				var adminBarAltura = $('#wpadminbar').outerHeight();
				var topBarAltura = $('.pmoney.encabezado').outerHeight()
				var maxAltura = $(window).height();
				if (adminBarAltura != null) {
					maxAltura-=adminBarAltura;
				}
				if (topBarAltura != null) {
					maxAltura-=topBarAltura;
				}
				if (altura > maxAltura) {
					var elCuerpo = $('.modal-dialog .modal-content .modal-body');
					var elEncabezado = $('.modal-dialog .modal-content .modal-header');
					var elPie = $('.modal-dialog .modal-content .modal-footer');
					
					elCuerpo.addClass('con_scroll');
					elCuerpo.css({'max-height': (maxAltura-elEncabezado.outerHeight()-80-elPie.outerHeight())+'px'});
				}
			});
		};

		var notificar = function(mensaje, opciones) {
			var predeterminado = {
				globalPosition: 'bottom right', 
				className: 'info', //error warn
				autoHide: true,
			};
			if (typeof opciones != 'undefined') {
				$.extend(true, predeterminado, opciones);
			}
			//Se debe mirar si está abierto el chat
			var elChat = $('#mck-sidebox');
			var ancho = 0;
			var hayChat = (elChat.length > 0);
			var esVisible = false;
			if (hayChat) {
				esVisible = elChat.is(":visible");
			}
			if (hayChat && esVisible) {
				ancho = elChat.width() + 20;
			}
			//console.log('esVisible', esVisible, 'hayChat', hayChat, 'ancho', ancho);
			var nuevoEstilo = {'right': ancho+'px'};
			//console.log('css '+JSON.stringify(nuevoEstilo));
			//https://notifyjs.jpillora.com/
			$.notify(mensaje, predeterminado);
			$('.notifyjs-corner').css(nuevoEstilo);
		};

		return {
			'error': error,
			'alertar': alertar,
			'info': info,
			'confirmar': confirmar,
			'notificar': notificar,
			'ajustarScroll': ajustarScroll,
		}
	})();

}(jQuery));