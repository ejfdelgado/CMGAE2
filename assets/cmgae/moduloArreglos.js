
Array.prototype.contiene = function(objeto) {
	if (!(typeof objeto == 'object')) {
		return -1;
	}
	try {
		var llaves = Object.keys(objeto);
		for (var i=0; i<this.length; i++) {
			var actual = this[i];
			if (typeof actual == 'object') {
				var iguales = 0;
				for (var j=0; j<llaves.length; j++) {
					var llave = llaves[j];
					if (actual[llave] == objeto[llave]) {
						iguales++;
					}
				}
				if (iguales == llaves.length) {
					return i;
				}
			}
		}
		return -1;
	} catch (e) {
		return -1;
	}
};

Array.prototype.estaEnLista = function(dato) {
	return (this.indexOf(dato) >= 0);
};

//Quito los que están en la lista pasada por parámetro a
Array.prototype.diff = function (a) {
	if (!(a instanceof Array)) {
		return this;
	}
    return this.filter(function (i) {
        return a.indexOf(i) === -1;
    });
};
Array.prototype.restar = Array.prototype.diff;

/*Elimina duplicados de la lista*/
Array.prototype.sindup = function () {
	return this.filter(function(elem, index, self) {
		var unico = (index == self.indexOf(elem));
		return unico;
	});
};