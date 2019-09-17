
var modRellax = (function() {
  var PATRONES_SUBDOMINIOS = [
    '(invitados)\\.([^\\.]+)',
  ];
  var rellax = null;

  var hayTexto = function(texto) {
    return (typeof texto == 'string' && texto.trim().length > 0);
  };

  var darUrlDeArchivo = function(id, predef, local) {
    if (typeof id == 'string' && id.length > 0) {
      return moduloArchivos.generarUrlDadoId(id, local);
    } else {
      return predef;
    }
  };

  var darUrlDeIdImagen = function(id) {
    return darUrlDeArchivo(id, '/assets/1/rsvp/img/def.svg', false);
  };

  var aplicarColorTexto = function(elemento, color, borde) {
    if (typeof color == 'string' && color.length > 0) {
      elemento.css({'color': color});
    }
    if (typeof borde == 'string' && borde.length > 0) {
      var col = borde;
      elemento.css({'text-shadow': '-1px -1px 0 '+col+', 1px -1px 0 '+col+', -1px 1px 0 '+col+', 1px 1px 0 '+col});
    }
  };

  var leerRespuesta = function(contenedor, $scope) {
    var quien = $.urlParam('quien');
    if (typeof quien == 'string') {
      if (quien in $scope.metadata.ctx2.invitados) {
        var destino = $scope.metadata.ctx2.invitados[quien];

        for (preg in destino.rtas) {
          var lista = destino.rtas[preg];
          for (var i=0; i<lista.length; i++) {
            contenedor.find('[data-preg="'+preg+'"][data-rta="'+lista[i]+'"]').addClass('btn-dark');
          }
        }
      }
    }
  };

  var render = function($scope) {
    if (rellax != null) {
      try {
        rellax.destroy();
      } catch(e) {

      }
    }

    var todo = $('#render-mi-parallax');
    if (todo.length == 0) {
      return;
    }
    todo.empty();
    var cont1 = $('<div class="parallax-col"></div>');
    todo.append(cont1);
    if (hayTexto($scope.metadata.ctx2.disenio.fuente)) {
      //Agrego la fuente si es necesario
      var nuevoEstilo = $("<style type='text/css'>@font-face {font-family: 'RSVP_LOCAL';font-style: normal;font-weight: 400;font-display: swap;src: url('"+darUrlDeArchivo($scope.metadata.ctx2.disenio.fuente, '', false)+"')}</style>");
      todo.append(nuevoEstilo);
    }

    var invitado = darInvitadoActual($scope);

    var MAPA_TEXTOS = [
      {'patron': /\$nombre/ig, 'llave': 'nom'},
    ];

    var remplazarTextos = function(entrada) {
      if (typeof entrada != 'string') {return entrada;}
      if (invitado != null) {
        for (var i=0; i<MAPA_TEXTOS.length; i++) {
          var remplazo = MAPA_TEXTOS[i];
          entrada = entrada.replace(remplazo.patron, invitado[remplazo.llave]);
        }
      }
      return entrada;
    };

    var secciones = utilidades.leerObj($scope.metadata.ctx2, 'disenio.secciones', []);
    for (var i=0; i<secciones.length; i++) {
      var miseccion = secciones[i];
      if (miseccion.ver) {
        var capas = utilidades.leerObj(miseccion, 'capas', []);

        var secelem = $('<div class="parallax-container"><div class="parallax-block"></div></div>');
        var secelem2 = $(secelem.children().first());
        if (miseccion.cuadrado) {
          secelem2.addClass('parallax-block-cube');
        }
        var estiloSec = '';
        var estiloSec2 = '';
        
        if (miseccion.conimg && typeof miseccion.img == 'string' && miseccion.img.length > 0) {
          estiloSec2+='background-image: url(\''+darUrlDeIdImagen(miseccion.img)+'\');';
        }

        if (miseccion.concolor2) {
          estiloSec+='background-image: linear-gradient('+miseccion.color1+', '+miseccion.color2+');';
        } else if (miseccion.concolor1) {
          estiloSec+='background-color: '+miseccion.color1+';';
        }

        estiloSec+='padding: '+miseccion.paddingh+'vw;';

        secelem.attr('style', estiloSec);
        secelem2.attr('style', estiloSec2);

        $.each(capas, function(j, micapa) {
          if (micapa.ver) {
            var estilos = '';

            var capaelem;

            if (micapa.tipo == 'img') {
              capaelem = $('<img class="rellax parallax-micapa">');
              capaelem.attr('src', darUrlDeIdImagen(micapa.img));
              var opcionesImagen = [micapa.img];
              if (typeof micapa.img2 == 'string' && micapa.img2.length > 0) {
            	  opcionesImagen.push(micapa.img2);
              }
              capaelem.on('tap click', function() {
            	 if (opcionesImagen.length > 0) {
            		 var temp = opcionesImagen.splice(0, 1);
            		 opcionesImagen.push(temp[0]);
            		 capaelem.attr('src', darUrlDeIdImagen(opcionesImagen[0]));
            	 }
            	 //Hago scroll lentamente hasta la siguiente seción
            	 checkearCargue(capaelem.attr('src'), function() {
            		 setTimeout(function() {
            			 var siguiente = capaelem.closest('.parallax-container').next();
                    	 scrollToElement(siguiente, capaelem.closest('.scrollable-content'));
            		 }, 500);
            	 });
              });
            } else if (micapa.tipo == 'preg') {
              capaelem = $('<div class="rellax parallax-micapa espregunta"><p class="mipregunta"></p><ul class="misrtas bootstrapiso"></ul></div>');
              var elemPregunta = capaelem.find('.mipregunta');
              var elemRtas = capaelem.find('.misrtas');

              elemPregunta.text(remplazarTextos(micapa.preg));
              if (micapa.tamPreg !== null && micapa.tamPreg !== undefined) {
                elemPregunta.css({'font-size': micapa.tamPreg+'%'});
              }
              aplicarColorTexto(elemPregunta, micapa.txtColor, micapa.txtColor2);
              
              //itero las respuestas y las agrego
              $.each(micapa.rtas, function(clave, rta) {
                var nueva = $('<li><button type="button" class="btn btn btn-light col-xs-12 mb-4"></button></li>');
                var boton = nueva.find('button');
                /*
                if (micapa.tamRes !== null && micapa.tamRes !== undefined) {
                  boton.css({'font-size': micapa.tamRes+'%'});
                }
                */
                boton.text(remplazarTextos(rta.txt));
                aplicarColorTexto(boton, micapa.txtColor, micapa.txtColor2);
                boton.attr('data-rta', clave);
                boton.attr('data-preg', micapa.id);
                elemRtas.append(nueva);

                leerRespuesta(capaelem, $scope);

                boton.on('click', function() {
                  var este = $(this);
                  var contenedor = este.closest('ul');
                  if (micapa.esunica) {
                    //Le quito el on a todos los demás
                    contenedor.find('.btn-dark').removeClass('btn-dark').addClass('btn-light');
                    este.addClass('btn-dark');
                  } else {
                    if (este.hasClass('btn-dark')) {
                      este.removeClass('btn-dark');
                      este.addClass('btn-light');
                    } else if (este.hasClass('btn-light')) {
                      este.removeClass('btn-light');
                      este.addClass('btn-dark');
                    }
                  }
                  escribirRespuesta(contenedor, $scope);
                });
              });
            }

            capaelem.attr('data-rellax-speed', micapa.vel/10);
            if (micapa.lim == 'up') {
              capaelem.attr('data-rellax-max', '0');
            } else if (micapa.lim == 'down') {
              capaelem.attr('data-rellax-min', '0');
            }
            estilos+='width: '+micapa.tam+'%;';
            if (typeof micapa.hort == 'string' && micapa.hort.length > 0) {
              estilos+=micapa.hort+': '+micapa.horv+'%;';
            }
            if (typeof micapa.vert == 'string' && micapa.vert.length > 0) {
              estilos+=micapa.vert+': '+micapa.verv+'%;';
            }
            capaelem.attr('style', estilos);
            secelem2.append(capaelem);
          }
        });
        cont1.append(secelem);
      }
    }

    var finales = {
      center: true,
      wrapper: '#render-mi-parallax',
    };

    rellax = new Rellax('.rellax', finales);
  };

  var guardarBasico = function($scope) {
    if (typeof angular == 'undefined') {
      angular = {
        toJson: JSON.stringify,
      };
    }
    var diferido2 = moduloPagina.guardar2(JSON.parse(angular.toJson($scope.metadata.ctx2)), PATRONES_SUBDOMINIOS);
    var diferido1 = moduloPagina.guardar(JSON.parse(angular.toJson($scope.metadata.ctx)));
    return all([diferido1.promise, diferido2.promise]);
  };

  var esSlave = function() {
    var sl = $.urlParam('sl');
    return sl == 'si';
  };

  var darInvitadoActual = function($scope) {
    var quien = $.urlParam('quien');
    if (typeof quien == 'string') {
      if (quien in $scope.metadata.ctx2.invitados) {
        var destino = $scope.metadata.ctx2.invitados[quien];
        return destino;
      }
    }
    return null;
  };

  var escribirRespuesta = function(contenedor, $scope) {
    //Busco el quiery param quien
    var destino = darInvitadoActual($scope);
    if (destino == null){return;}
    if (typeof destino.rtas == 'undefined') {
      destino.rtas = {};
    }

    //Itero los elementos 
    contenedor.find('[data-preg]').each(function(i, elem) {
      var respuesta = $(elem);
      var idPreg = respuesta.attr('data-preg');
      var idResp = respuesta.attr('data-rta');
      if (i == 0) {
        destino.rtas[idPreg] = [];
      }
      if (respuesta.hasClass('btn-dark')) {
        destino.rtas[idPreg].push(idResp);
      }
    });

    guardarBasico($scope);
  };
  
	var scrollToElement = function (destino, padre, milis, offset) {
		if (typeof offset != 'number') {
			offset = 0;
		}
		if (typeof milis != 'number') {
			milis = 1000;
		}
		var scrollTop = padre.scrollTop();
		var scrollFinal = scrollTop + destino.offset().top;
		padre.animate({scrollTop: scrollFinal}, milis);
	};
	
	var checkearCargue = function(url, callback) {
		var image = new Image();
		image.onload = function () {
			callback();
		}
		image.onerror = function () {
		}
		image.src = url;
	}

  return {
    'render': render,
    'guardarBasico': guardarBasico,
    'darInvitadoActual': darInvitadoActual,
    'escribirRespuesta': escribirRespuesta,
    'hayTexto': hayTexto,
    'darUrlDeArchivo': darUrlDeArchivo,
    'darUrlDeIdImagen': darUrlDeIdImagen,
    'scrollToElement': scrollToElement,
  };
})();
