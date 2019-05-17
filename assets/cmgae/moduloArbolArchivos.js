
//Leer https://www.jstree.com/plugins/
if (!hayValor(moduloArbolArchivos)) {
var moduloArbolArchivos = (function(elem, elemEditor) {
	
	var tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
	var mapaTabs = {};
	var editorActual = null;
	
	var tabs = $( "#tabs" ).tabs({
		  'activate': function( event, ui ) {
			  //ui.newTab
			  var id = ui.newPanel.find('.pluginEditor').attr('id');
			  editorActual = mapaTabs[id];
		  },
    	  'beforeLoad': function( event, ui ) {
		      event.preventDefault();
		      return;
		  },
	});
	
	var actualizarAlturaTabsNav = function() {
		var altura = $($('#tabs').find( ".ui-tabs-nav" )).outerHeight(true);
		$('.pluginEditorInner>.ace_editor').css({top: altura});
	};
	
	$(window).on( "resize", function() {
		actualizarAlturaTabsNav();
	});
	
    tabs.on( "click", "span.ui-icon-close", function() {
    	var tabSeleccionado = $( this );
    	
    	//Se mira si ha cambiado o no
    	if (editorActual.editor.haCambiado()) {
    		//Se pide confirmar en caso que el hash haya cambiado
        	var promesaConf = moduloModales.confirmar('Perderá los cambios si no guarda');
        	promesaConf.then(function() {
        		cerrarTab(tabSeleccionado);
        	});
    	} else {
    		cerrarTab(tabSeleccionado);
    	}
    });
	
	jQuery(document).keydown(function(event) {
	        // If Control or Command key is pressed and the S key is pressed
	        // run save function. 83 is the key code for S.
	        if((event.ctrlKey || event.metaKey) && event.which == 83) {
	            // Save Function
	        	editorActual.editor.guardarArchivo();
	            event.preventDefault();
	            return false;
	        }
	    }
	);
	
	var darNombresHijos = function(nodo) {
		var hijos = copiarJSON(leerObj(nodo, 'children', []));
		for (let i=0; i<hijos.length; i++) {
			hijos[i] = moduloArchivos.darNombreId(hijos[i]);
		}
		return hijos;
	};
	
	var cerrarTab = function(elemTab) {
		var elLi = elemTab.closest( "li" );
	    var panelId = elLi.attr( "aria-controls" );
	    var elPanel = $( "#" + panelId );
	    var idReal = elPanel.find('.pluginEditor').attr('id');
	    elLi.remove();
	    elPanel.remove();
	    delete mapaTabs[idReal];
	    tabs.tabs( "refresh" );
	    actualizarAlturaTabsNav();
	};
	
    // Actual addTab function: adds new tab using the input from the form above
    function agregarTab(nombreArchivo, contenido, rutaUnica) {
    	
		var label = nombreArchivo,
		id = MD5('tab-'+rutaUnica),
		li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
    	
    	if (hayValor(mapaTabs[id])) {
    		mapaTabs[id].li.find('a').click();
    		return;
    	}
		
		tabs.find( ".ui-tabs-nav" ).append( li );
		tabs.tabs( "refresh" );
		
		var idReal = li.attr('aria-controls');
		
		var panelNuevo = $('#'+idReal); 
		panelNuevo.append( '<div id="' + id + '" class="pluginEditor"><div class="pluginEditorInner"></div></div>');
		
		mapaTabs[id] = {
			'li': li,
		};
		
		li.find('a').click();
		
		var instanciaEditorTexto = moduloEditorTexto($('#'+id+' .pluginEditorInner'));
		instanciaEditorTexto.abrirEditor(nombreArchivo, contenido, rutaUnica);
		
		mapaTabs[id]['editor'] = instanciaEditorTexto;
		
		actualizarAlturaTabsNav()
    };
	
	elem.on("changed.jstree", function (event, data) {
		if(data.selected.length) {
			var ref = data.instance.get_node(data.selected[0]);
		}
	});
	
	elem.bind("move_node.jstree", function (e, data) {
		console.log(data);
	});
    
	elem.on("rename_node.jstree", function (event, data) {
		var anterior = data.old;
		var nuevo = data.text;
		var elNodo = data.node;
		var refArbol = data.instance;
		
		if (elNodo.original.type == 'folder') {
			data.instance.set_id(elNodo, data.node.parent + nuevo + '/');
		} else {
			var viejoId = data.node.parent + anterior;
			var nuevoId = data.node.parent + nuevo;
			
			var funError = function() {
				elNodo.text = anterior;
				elNodo.original.text = anterior;
				refArbol.redraw([elNodo]);
				moduloModales.alertar('Ha ocurrido un error')
			};
			
			//Validar que otro no se llame igual
        	var padre = refArbol.get_node(data.node.parent);
        	var hermanos = darNombresHijos(padre);
        	if (estaEnLista(nuevo, hermanos)) {
        		funError();
        	} else {
				var promesa = moduloArchivos.renombrar(viejoId, nuevoId);
				$.when(promesa).then(function(datos) {
					if (datos.error != 0) {
						funError();
					} else {
						data.instance.set_id(elNodo, nuevoId);
					}
				}, funError);
        	}
		}
	});
	
	elem.on("load_node.jstree", function(event, data) {
        var refArbol = data.instance;
        //Se itera sobre los hijos buscando los nodos que son type file
        for (let i=0; i<data.node.children.length; i++) {
        	let elId = data.node.children[i];
        	let unNodo = refArbol.get_node(elId);
        	ajustarAspectoNodo(unNodo);
        }
    });
	
	
	elem.on("create_node.jstree", function(event, data) {
		ajustarAspectoNodo(data.node);
	});
	
	var ajustarAspectoNodo = function(unNodo) {
		if (unNodo.original.type == 'file') {
    		elem.jstree(true).set_icon(unNodo.id, "/assets/js/cmgae/jstree/file.png");
    	}
	};
	
	elem.on('dblclick','.jstree-anchor', function (e) {
	   var inst = $.jstree.reference(this),
	   ref = inst.get_node(this);
	   abrirNodo(ref);
	});
	
	var abrirNodo = function(ref) {
    	var promesaCargue = moduloArchivos.leerTextoPlano(ref.id);
    	$.when(promesaCargue).then(function(contenido) {
    		//TODO detectar que es error de que no existe, diferente a otro error
    		if (typeof(contenido) != 'string') {
    			contenido = '';
    		}
    		agregarTab(ref.text, contenido, ref.id);
    	}, function(obj) {
    		moduloModales.alertar(obj.msg);
    	});
	}
	
	var menuALaMedida = function($node) {
		var abrir = {
            "separator_before": false,
            "separator_after": false,
            "label": "Abrir",
            "action": function(data) {
            	var inst = $.jstree.reference(data.reference);
            	var ref = inst.get_node(data.reference);
            	abrirNodo(ref);
            }
        };
		var crearCarpeta = {
            "separator_before": false,
            "separator_after": false,
            "label": "Crear carpeta",
            "action": function(data) {
            	var nuevoNodo = {'text':'nuevo', 'type':'folder'};
                var inst = $.jstree.reference(data.reference),
                obj = inst.get_node(data.reference);
                inst.create_node(obj, nuevoNodo, "last", function (new_node) {
                    //new_node.data = {file: true};
                    setTimeout(function () { inst.edit(new_node); },0);
                });
            }
        };
		
		var crearArchivo = {
            "separator_before": false,
            "separator_after": false,
            "label": "Nuevo archivo",
            "action": function(data) {
            	var nuevoNodo = {'text':'nuevo', 'type':'file'};
                var inst = $.jstree.reference(data.reference),
                obj = inst.get_node(data.reference);
                nuevoNodo.id = obj.id+nuevoNodo.text;
                let promesaEscritura = moduloArchivos.escribirTextoPlano(nuevoNodo.id, '');
				$.when(promesaEscritura).then(function() {
	                inst.create_node(obj, nuevoNodo, "last", function (new_node) {
	                    //new_node.data = {file: true};
	                    setTimeout(function () { inst.edit(new_node); },0);
	                });
				});
            }
        };
		
		var renombrar = {
            "separator_before": false,
            "separator_after": false,
            "label": "Renombrar",
            "action": function(obj) {
            	var inst = $.jstree.reference(obj.reference);
            	inst.edit($node);
            }
        };
		
		var borrar = {
            "separator_before": false,
            "separator_after": false,
            "label": "Borrar",
            "action": function(data) {
            	var promesaConf = moduloModales.confirmar();
            	promesaConf.then(function() {
		        	var inst = $.jstree.reference(data.reference),
		        	obj = inst.get_node(data.reference);
	            	var promesa = moduloArchivos.borrar(obj.id);
	            	$.when(promesa).then(function(respuesta) {
	            		if (respuesta.error == 0) {
		            		var inst = $.jstree.reference(data.reference);
		                	inst.delete_node($node);
	            		} else {
	            			moduloModales.alertar('Ha ocurrido un error');
	            		}
	            	}, function() {
	            		moduloModales.alertar('Ha ocurrido un error');
	            	});
            	});
            }
        };
		
		var cargar = {
	        "separator_before": false,
	        "separator_after": false,
	        "label": "Subir",
	        "action": function(data) {
	        	var inst = $.jstree.reference(data.reference);
	        	var obj = inst.get_node(data.reference);
	        	var rutaDestino = quitarUltimoSlash(obj.id);
	        	var hijos = darNombresHijos(obj);
	        	var promesa = moduloArchivos.subirArchivo({
	        		auto: 'false', 
	        		tipos:'audio/*|video/*|image/*|text/*', 
	        		opcionesNegras: hijos,
	        		dataFolder:rutaDestino,
	        	});
	        	$.when(promesa).then(function(resultado) {
	        		var nombreArchivo = moduloArchivos.darNombreId(resultado.id);
	        		if (!estaEnLista(nombreArchivo, hijos)) {
		        		var nuevoNodo = {
		        				'text': nombreArchivo, 
		        				'type': 'file', 
		        				'id': moduloArchivos.normalizarId(resultado.id, false)
		        				};
		                inst.create_node(obj, nuevoNodo, "last", function (new_node) {
		                	
		                });
	        		}
	        	}, function() {
	        		moduloModales.alertar('Ha ocurrido un error');
	        	});
	        }
		};
		
		var copiarRuta = {
		        "separator_before": false,
		        "separator_after": false,
		        "label": "URL",
				"action": function(data) {
					var inst = $.jstree.reference(data.reference);
					var obj = inst.get_node(data.reference);
					var url = moduloArchivos.generarUrlDadoId(obj.id);
					if (urlContieneExtension(url, ['css', 'scss'])) {
						url = '<link rel="stylesheet" href="'+url+'"/>';
					} else if (urlContieneExtension(url, ['js'])) {
						url = '<script src="'+url+'"></script>'
					}
					copiarEnPortapapeles(url);
				}
		};
		
		var copiarRutaLocal = {
		        "separator_before": false,
		        "separator_after": false,
		        "label": "URL Local",
				"action": function(data) {
					var inst = $.jstree.reference(data.reference);
					var obj = inst.get_node(data.reference);
					var url = moduloArchivos.normalizarId(obj.id);
					url = eliminarPrefijo(url, moduloArchivos.darRaizPublica());
					if (urlContieneExtension(url, ['css', 'scss'])) {
						url = '<link rel="stylesheet" href="'+url+'"/>';
					} else if (urlContieneExtension(url, ['js'])) {
						url = '<script src="'+url+'"></script>'
					}
					copiarEnPortapapeles(url);
				}
		};
		
		var copiarRutaBruta = {
		        "separator_before": false,
		        "separator_after": false,
		        "label": "URL Bruta",
				"action": function(data) {
					var inst = $.jstree.reference(data.reference);
					var obj = inst.get_node(data.reference);
					var url = moduloArchivos.normalizarId(obj.id);
					copiarEnPortapapeles(url);
				}
		};
		
		var borrarCacheArchivo = {
		        "separator_before": false,
		        "separator_after": false,
		        "label": "Borrar Cache",
				"action": function(data) {
					var inst = $.jstree.reference(data.reference);
					var obj = inst.get_node(data.reference);
					var promesas = moduloArchivos.borrarCacheConId(obj.id);
					$.when(promesas, function() {
						
					}, function() {
						
					});
				}
		};
		
		//solo se deben poder mover archivos.
		if ($node.original.type == 'folder') {
	        return {
	            'CrearArchivo': crearArchivo,
	            'CrearCarpeta': crearCarpeta,
	            'Cargar': cargar,
	            "Borrar": borrar,//Solo si no tiene hijos
	        };
		} else if ($node.original.type == 'file') {
	        return {
	            'Abrir': abrir,
	            'copiarRuta': copiarRuta,
	            'copiarRutaLocal': copiarRutaLocal,
	            'copiarRutaBruta': copiarRutaBruta,
	            //'borrarCacheArchivo': borrarCacheArchivo,
	            'Renombrar': renombrar,
	            "Borrar": borrar,
	        };
		}
    };
    
	elem.jstree({
	  "core" : {
	    "check_callback" : true,
	    "themes" : { "stripes" : true },
        'data': {
            'url': function (node) {
            	return "/storage/jstreelist";
             },
             'dataType': "json",
			 "data" : function (node) {
				return { "id" : node.id };
			 }
           }
	    
	  },
	  'contextmenu': {
	        'items': menuALaMedida,
	    },
	  "plugins" : [
	    "contextmenu", "dnd", "search","json_data",
	    "state", "wholerow",
	  ]
	});
	
    $(document).keydown(function(e) {
        if (e.keyCode == 65 && e.ctrlKey) {
            moduloArchivos.crearBasico();
        }
    });
	
	return {
		'actualizarAlturaTabsNav': actualizarAlturaTabsNav,
	}
});
}