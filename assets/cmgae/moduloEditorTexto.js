//Leer https://ace.c9.io/build/kitchen-sink.html
if (!hayValor(moduloEditorTexto)) {
var moduloEditorTexto = (function(ele) {
	var idLocal = 'pluginEditor-'+(new Date().getTime());
	var idActual = null;
	var hashActual = null;
	
	var destruirEditor = function() {
		ele.empty();
		var nuevo = $('<div/>', {id: idLocal});
		ele.append(nuevo);
		hashActual = null;
	};
	  
	var abrirEditor = function(nombre, contenido, id) {
		idActual = id;
		var mapaTipos = [
		    {'patron': /.*\.js/ig, 'editor': 'ace/mode/javascript'},
		    {'patron': /.*\.html/ig, 'editor': 'ace/mode/html'},
		    {'patron': /.*\.json/ig, 'editor': 'ace/mode/json'},
		    {'patron': /.*\.css/ig, 'editor': 'ace/mode/css'},
		    {'patron': /.*\.scss/ig, 'editor': 'ace/mode/scss'},
		    {'patron': /.*\.xml/ig, 'editor': 'ace/mode/xml'},
		];
		destruirEditor();
	    var editor = ace.edit(idLocal);
	    editor.setValue(contenido);
	    editor.setTheme("ace/theme/monokai");
	    
	    hashActual = MD5(contenido);
	    /*
	    editor.commands.addCommand({
	        name: 'comandoGuardar',
	        bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
	        exec: function(editor) {
            	guardarArchivo();
	        },
	        readOnly: true // false if this command should not apply in readOnly mode
	    });
	    */
	    for (let i=0; i<mapaTipos.length; i++) {
	    	let unTipo = mapaTipos[i];
	    	if (unTipo.patron.test(nombre)) {
	    		editor.getSession().setMode(unTipo.editor);
	    	}
	    }
	};
	
	var guardarArchivo = function() {
		if (!haCambiado()) {
			moduloMenus.info('menus.mensajes.sincambios');
			return;
		}
		var editor = ace.edit(idLocal);
		var promesasTodas = moduloArchivos.borrarCacheConId(idActual);
		var contenido = editor.getValue();
		promesasTodas['guardado'] = moduloArchivos.escribirTextoPlano(idActual, contenido); 
		$.when(promesasTodas).then(function() {
			moduloMenus.info('menus.mensajes.guardado');
			hashActual = MD5(contenido);
		}, function() {
			alert('Error subiendo el archivo');
		});
	};
	
	var haCambiado = function() {
		var editor = ace.edit(idLocal);
		return (hashActual != MD5(editor.getValue()));
	};
	
	return {
		abrirEditor: abrirEditor,
		destruirEditor: destruirEditor,
		guardarArchivo: guardarArchivo,
		haCambiado: haCambiado,
	};
});
}
