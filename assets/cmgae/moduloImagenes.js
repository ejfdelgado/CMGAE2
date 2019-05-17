if (!hayValor(moduloImagenes)) {
	var moduloImagenes = (function() {
		var PATRON_FONDO = /(background-image\s*:\s*url\s*\(\s*['"]?)([^'^"]*?)(\s*['"]?\))\s*(!\s*important)?\s*(;)?/ig;
		
		var asignarSrc = function(elem, unId, esEstilo) {
			var valor = moduloArchivos.generarUrlDadoId(unId);
			if (esEstilo) {
				//Se trata de una imagen de fondo
				let original = elem.attr('style');
				original = original.replace(PATRON_FONDO, '');
				original = original.trim();
				if (hayValor(original) && !original.endsWith(';')) {
					original = original+';';
				}
				original+='background-image: url(\''+valor+'\') !important;';
				elem.attr('style', original);
				return original;
			} else {
				elem.attr('src', valor);
			}
			return valor;
		};

		var darUrlAnterior = function(elem, esEstilo) {
			var direccion = null;
			if (esEstilo) {
				let original = elem.attr('style');
				let partesEstilo = PATRON_FONDO.exec(original);
				if (partesEstilo != null && partesEstilo.length > 3) {
					direccion = partesEstilo[2];
				}
			} else {
				direccion = elem.attr('src');
			}
			return direccion;
		};

		var darIdAnterior = function(elem, esEstilo) {
			var direccion = darUrlAnterior(elem, esEstilo);
			return moduloArchivos.darIdDadoUrl(direccion);
		};
		
		var darValoresCargue = function(self) {
			var props = moduloArchivos.completarPredeterminados({});
			//Se valida si el html declara un tamaño máximo específico
			try {
				var valorDataMax = self.attr('data-max');
				if (hayValor(valorDataMax)) {
					props.maximoTamanio = parseInt(valorDataMax)*1024;
				}
			} catch(e2) {
				console.log('Intentó determinar tamaño máximo de imagen pero falló');
			}
			//Se valida si el html declara una carpeta específica
			var attrDataFolder = self.attr('data-carpeta');
			if (typeof attrDataFolder !== typeof undefined && attrDataFolder !== false) {
				attrDataFolder = attrDataFolder.trim();
				if (hayValor(attrDataFolder)) {
					if (attrDataFolder.charAt(0)!='/') {
						attrDataFolder = '/'+attrDataFolder;
					}
					props.dataFolder += attrDataFolder;
				}
			}
			return props;
		};
		
		return {
			'asignarSrc': asignarSrc,
			'darIdAnterior': darIdAnterior,
			'darUrlAnterior': darUrlAnterior,
			'darValoresCargue': darValoresCargue,
		};
	})();
}