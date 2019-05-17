
var moduloHistoria = (function() {
	var OFFSET_VISIBLE = 0;//Porcentaje de la altura de la ventana
	var ALTO = $( window ).height();
	var ANCHO = $( window ).width();
	
	var EXPRESION = '(\\s*|\\d|(maxx)|(maxy)|\\*|-|\\+|\\.)+';
	var EXPRESIONSE = '(\\d|(maxx)|(maxy)|\\*|-|\\+|\\.)+';//No acepta espacios
	var DOSCAMPOS = '\\(\\s*('+EXPRESION+')\\s*(px)?\\s*,\\s*('+EXPRESION+')(px)?\\s*\\)';
	var DOSCAMPOSNP = '('+EXPRESIONSE+')\\s*(px)?\\s*('+EXPRESIONSE+')(px)?';
	var UNCAMPO = '\\(\\s*('+EXPRESION+')\\s*(deg|rad|px)?\\s*\\)';
	var UNCAMPONP = '('+EXPRESIONSE+')\\s*(deg|rad|px)?';
	var TRANSFORM = '[^;]?\\s*transform\\s*:.*?';
	
	var PATRONES = {
		'translate': {
			'p': new RegExp('('+TRANSFORM+'translate\\s*'+DOSCAMPOS+')', 'ig'), 
			'borrar': new RegExp('(translate\\s*'+DOSCAMPOS+')', 'ig'), 
			'defs': ['transform', '-ms-transform', '-webkit-transform'], 
			'grupos': [2,7],
			'par': true,
			'pre': 'translate',
			'sep': ',',
			'uni': 'px',//Siempre se interpretará en px
		},
		'btranslate': {
			'p': new RegExp('(background-position\\s*:\\s*'+DOSCAMPOSNP+'\\s*[;$])', 'ig'), 
			'borrar': new RegExp('(background-position\\s*:\\s*'+DOSCAMPOSNP+'\\s*[;$])', 'ig'), 
			'defs': ['background-position'], 
			'grupos': [2,7],
			'par': false,
			'pre': '',
			'sep': ' ',
			'uni': 'px',
		},
		'rotate': {
			'p': new RegExp('('+TRANSFORM+'rotate\\s*'+UNCAMPO+')', 'ig'), 
			'borrar': new RegExp('(rotate\\s*'+UNCAMPO+')', 'ig'), 
			'defs': ['transform', '-ms-transform', '-webkit-transform'], 
			'grupos': [2],
			'par': true,
			'pre': 'rotate',
			'sep': ' ',
			'uni': 'deg',
		},
		'scale1': {
			'p': new RegExp('('+TRANSFORM+'scale\\s*'+UNCAMPO+')', 'ig'), 
			'borrar': new RegExp('(scale\\s*'+UNCAMPO+')', 'ig'), 
			'defs': ['transform', '-ms-transform', '-webkit-transform'], 
			'grupos': [2],
			'par': true,
			'pre': 'scale',
			'sep': ' ',
			'uni': '',
		},
		'scale2': {
			'p': new RegExp('('+TRANSFORM+'scale\\s*'+DOSCAMPOS+')', 'ig'), 
			'borrar': new RegExp('(scale\\s*'+DOSCAMPOS+')', 'ig'), 
			'defs': ['transform', '-ms-transform', '-webkit-transform'], 
			'grupos': [2, 7],
			'par': true,
			'pre': 'scale',
			'sep': ',',
			'uni': '',
		},
		'bscale1': {
			'p': new RegExp('(background-size\\s*:\\s*'+UNCAMPONP+'\\s*[;$])', 'ig'), 
			'borrar': new RegExp('(background-size\\s*:\\s*'+UNCAMPONP+'\\s*[;$])', 'ig'), 
			'defs': ['background-size', '-webkit-background-size', '-moz-background-size', '-o-background-size'], 
			'grupos': [2],
			'par': false,
			'pre': '',
			'sep': ' ',
			'uni': 'px',
		},
		'bscale2': {
			'p': new RegExp('(background-size\\s*:\\s*'+DOSCAMPOSNP+'\\s*[;$])', 'ig'), 
			'borrar': new RegExp('(background-size\\s*:\\s*'+DOSCAMPOSNP+'\\s*[;$])', 'ig'), 
			'defs': ['background-size'], 
			'grupos': [2,7],
			'par': false,
			'pre': '',
			'sep': ' ',
			'uni': 'px',
		},
	};
	
	var inicializar = function() {
		//1. Se itera el dom buscando la clase principal
		$('.mostrar-historia').each(function(i, elem) {
			var jelem = $(elem);
			if (jelem.data('ok') !== true) {
				//Se asegura que se itere solo una vez
				
				//Se esconden los demás hijos
				var hijos = jelem.children();
				hijos.addClass('invisible');
				
				var OFFSET = jelem.attr('data-historia-offset');
				if (!esNumero(OFFSET)) {
					OFFSET = 0;
				}
				
				var leerGrupos = function(todo, grupos) {
					var ans = []
					for (let i=0; i<grupos.length; i++) {
						let temp = todo[grupos[i]];
						temp = temp.replace(/maxx/ig, ANCHO);
						temp = temp.replace(/maxy/ig, ALTO);
						try {
							temp = eval(temp);
							ans.push(temp);
						} catch (e) {
							console.log('No se pudo evaluar:', temp);
						}
					}
					return ans;
				};
				
				var procesarExpresion = function(patron, estilo) {
					patron.p.lastIndex = 0;
					var m;
					var ans = null;
					do {
					    m = patron.p.exec(estilo);
					    if (m) {
					    	ans = leerGrupos(m, patron.grupos);
					    }
					} while (m);
					return ans;
				};
				
				var procesarEstilo = function(jelem) {
					
					var estilo = jelem.attr('style');
					if (hayValor(estilo)) {
						var metadata = {};
						for (let llavePatron in PATRONES) {
							let unPatron = PATRONES[llavePatron];
							let calculado = procesarExpresion(unPatron, estilo);
							if (hayValor(calculado)) {
								unPatron.borrar.lastIndex = 0;
								estilo = estilo.replace(unPatron.borrar, '');
								metadata[llavePatron] = calculado;
							}
						}
						estilo = estilo.replace(new RegExp('transform\\s*:.*?[;$]', 'ig'), '');
						jelem.attr('style', estilo);
						//console.log('estilo final:', estilo);
						//console.log(JSON.stringify(metadata));
						jelem.data('pinterpol', metadata);
					}
				};
				
				//Se pre-procesan los estilos
				hijos.each(function(i, elem) {
					var jelem = $(elem);
					procesarEstilo(jelem);
				});
				
				//Se clona el primer hijo
				var pHijo = jelem.children(":first").clone();
				var tipoHijo = pHijo[0].tagName;
				
				//Se agrega
				jelem.append(pHijo);
				//Solo se muestra el primer hijo
				pHijo.removeClass('invisible');
				
				jelem.data('darIndicePonderado', function(ponderacion) {
					var ans = parseInt(ponderacion*(hijos.length-OFFSET));
					if (ans < 0) {
						ans = 0;
					}
					if (ans >= hijos.length) {
						ans = hijos.length-1;
					}
					return ans;
				});
				
				jelem.data('darSubPonderado', function(indice, ponderacion) {
					let tam = (hijos.length-OFFSET);
					let ans = (ponderacion-(indice/tam))*tam;
					if (ans > 1) {
						ans = 1;
					}
					return ans;
				});
				
				//Se agrega la función de actualización
				jelem.data('act', function(datos) {
					var internos = {
						'pos': jelem.offset(),
						'altura': jelem.height(),
					};
					internos.ymin = internos.pos.top;
					internos.ymax = internos.pos.top + internos.altura;
					//1. Se mira si está visible
					internos.vExtSup = (internos.ymin >= datos.ymin && internos.ymin <= datos.ymax);
					internos.vExtInf = (internos.ymax >= datos.ymin && internos.ymax <= datos.ymax);
					internos.vis = internos.vExtInf || internos.vExtSup;
					
					var ext1 = (internos.ymin - datos.alturaVentana - datos.offset);
					var ext2 = (internos.ymax - datos.offset);
					var modo = 0;
					if (modo == 0) {
						//Desde que aparece
						internos.p2 = ponderar(datos.scroll, ext1, ext2);
					} else if (modo == 1) {
						//Solo cuando está todo visible
						internos.p2 = ponderar(datos.scroll, ext1+internos.altura, ext2-internos.altura);
					}
					internos.p2Inv = (1-internos.p2);
					internos.i2 = jelem.data('darIndicePonderado')(internos.p2);
					
					//Se calcula el hijo ponderado
					var hijoPonderado = $(hijos[internos.i2]);
					internos.i2sp = jelem.data('darSubPonderado')(internos.i2, internos.p2);
					internos.i2spInv = (1-internos.i2sp);
					
					
					//console.log(internos.p2, internos.i2, internos.i2sp);
					//Se aplican los estilos del hijo ponderado
					var estiloPonderado = hijoPonderado.attr('style');
					var estadoActual = {};
					var datos1 = hijoPonderado.data('pinterpol');
					if (internos.i2 < (hijos.length - 1)) {
						var hijoPonderadoAnterior = $(hijos[internos.i2+1]);
						var datos2 = hijoPonderadoAnterior.data('pinterpol');
						//Se generan los estilos interpolados
						for (let llavePatron in datos2) {
							let datoActual = datos2[llavePatron];
							let datoAnterior = datos1[llavePatron];
							if (hayValor(datoActual)) {
								if (hayValor(datoAnterior)) {
									//Se interpola
									estadoActual[llavePatron] = [];
									for (let k=0; k<datoActual.length; k++) {
										estadoActual[llavePatron][k] = parseInt(datoActual[k]*internos.i2sp + datoAnterior[k]*internos.i2spInv);
									}
								} else {
									//No se interpola
									estadoActual[llavePatron] = copiarJSON(datoActual);
								}
							}
						}
					} else {
						//Se debe aplicar los estilos del único actual
						estadoActual = copiarJSON(datos1);
					}
					let mapaFinal = {};
					//1. Se agrupan
					for (let llavePatron in estadoActual) {
						let unPatron = PATRONES[llavePatron];
						let lista = estadoActual[llavePatron];
						for (let j=0; j<lista.length; j++) {
							lista[j]=lista[j]+unPatron.uni;
						}
						for (let m=0; m<1; m++){//unPatron.defs.length
							let estiloNom = unPatron.defs[m];
							if (!(estiloNom in mapaFinal)) {
								mapaFinal[estiloNom] = [];
							}
							let temp = lista.join(unPatron.sep);
							if (unPatron.par) {
								temp = '('+temp+')';
							}
							mapaFinal[estiloNom].push(unPatron.pre+temp);
						}
					}
					
					//2. Se generan los estilos
					for (let llaveEstilo in mapaFinal) {
						let nuevoEstilo = ' ';
						let subMapa = mapaFinal[llaveEstilo]
						nuevoEstilo+=llaveEstilo+': ';
						for (let m=0; m<subMapa.length; m++) {
							nuevoEstilo+=subMapa[m]+' ';
						}
						estiloPonderado+=nuevoEstilo+';';
					}
					
					pHijo.attr('style', estiloPonderado);
					
					//Se aplican todas las clases del hijo excepto la de invisible
					var clasesPonderadas = hijoPonderado.attr('class');
					pHijo.attr('class', clasesPonderadas);
					pHijo.removeClass('invisible');
					
					//Se pasa el texto ponderado
					pHijo.html(hijoPonderado.html());
					
					//Se pasa la fuente de la imagen
					if (tipoHijo == 'IMG') {
						pHijo.attr('src', hijoPonderado.attr('src'));
					}
					
					//jelem.find('.hdebug').text(JSON.stringify(internos));
				});
				
				jelem.data('ok', true);
			}
		});
		
		$(window).on("scroll resize", refrescar);
	};
	
	//ext2 debe ser mayor que ext1
	var ponderar = function(val, ext1, ext2) {
		if (ext1 >= ext2) {
			return 0;
		}
		if (val < ext1) {
			return 0;
		}
		if (val > ext2) {
			return 1;
		}
		return (val - ext1)/(ext2 - ext1);
	};
	
	var valorFlecha = true;
	
	var refrescar = function(){
		var datos = {
			'scroll': $(window).scrollTop(),
			'alturaVentana': $( window ).height(),
			//'alturaDocumento': $( document ).height(),
		};
		if (valorFlecha === true && datos.scroll > (datos.alturaVentana/5)) {
			valorFlecha = false;
			$('.abc-flecha').addClass('invisible');
		}
		datos.offset = parseInt(datos.alturaVentana*OFFSET_VISIBLE);
		datos.ymin = (datos.scroll + datos.offset);
		datos.ymax = (datos.scroll + datos.alturaVentana - datos.offset);
		$('.mostrar-historia').each(function(i, elem) {
			var jelem = $(elem);
			if (typeof jelem.data('act') === 'function') {
				jelem.data('act')(datos);
			}
		});
	};
	
	$( document ).ready(function() {
		inicializar();
		refrescar();
	});
	
	return {
		'inicializar': inicializar
	}
})();