
var moduloTokenizar = (function() {
	
	var tokenizarSimple = function(untexto, umbralmin, umbralmax, listaNegra) {
		if (typeof untexto != 'string') {
			return [];
		}
		untexto = untexto.toLowerCase();
		untexto = untexto.replace(/[^\w\d\sá-úü]/g, '');
		var etapa1 = untexto.split(' ');

		//Se parte en más pedazos
		etapa1 = generarTokensPal(etapa1, umbralmin);

		if (!(listaNegra instanceof Array)) {
			listaNegra = [];
		}
		if (!(typeof umbralmin == 'number')) {
			umbralmin = 0;
		}
		etapa1 = etapa1.filter(function(elem, index, self) {
			if (!(index == self.indexOf(elem))) {
				//Elimino duplicados
				return false;
			}
			if(elem.length < umbralmin || elem.length > umbralmax) {
				//Se verifica que se cumpla el umbral mínimo
				return false;
			}
			if (listaNegra.indexOf(elem) >= 0) {
				return false;
			}
			return true;
		});
		
		return etapa1;
	};

	//Partes es un arreglo, luego retorna otro arreglo
	var generarTokensPal = function(partes, umbral) {
		var res = [];
		for (var k=0; k<partes.length; k++) {
			var parte = partes[k];
			var tam = parte.length;
			if (tam >= umbral) {
				for (var l=umbral; l<=tam; l++) {
					var temp = parte.substring(0, l);
					if (res.indexOf(temp) < 0) {
						res.push(temp);
					}
				}
			}
		}
		return res;
	};

	//Se debe retornar una lista de textos con todos
	var tokenizarTextos = function(untexto, umbralmin, listaNegra, maxlength) {
		var ans = [];
		var temp = tokenizarSimple(untexto, umbralmin, maxlength, listaNegra);

		//Ordenar de mayor a menor longitud de texto para luego distribuir
		temp = temp.sort(function(a, b) {
			return b.length - a.length;
		});
		//Algorítmo:
		//Se sacan de la lista principal los textos más grandes hasta que se desborda el tamaño máximo maxlength
		do {
			var buffer = temp.splice(0, 1);
			while ((buffer+' '+temp[0]).length < maxlength) {
				buffer+=' '+temp.splice(0, 1);
			}
			//Mientras se pueda...
			do {
				//Se mira el tamaño que falta por llenar
				var espacio = (maxlength - buffer.length) - 1;
				//Se busca el primer elemento de ese tamaño o menos	
				var encontrado = false;
				for (var i=0; i<temp.length; i++) {
					if (temp[i].length <= espacio) {
						buffer+=' '+temp.splice(i, 1);
						encontrado = true;
						break;
					}
				}
			} while (encontrado);
			//console.log(buffer);
			ans.push(buffer.trim());
		} while (temp.length > 0);
		
		return ans;
	};

	var resaltarTokensEnTexto = function(texto, tokens, gap) {
		var funcionDarIndices = function(token, frase) {
			var inicial = frase.indexOf(token);
			var ultimo = inicial+token.length;
			var pi = inicial;
			inicial-=gap;
			ultimo+=gap;
			if (inicial < 0) {
				inicial = 0;
			}
			if (ultimo >= frase.length) {
				ultimo = frase.length - 1;
			}
			return [inicial, ultimo, [token]];
		};

		var misIndices = [];
		for (var i=0; i<tokens.length; i++) {
			var token = tokens[i];
			var indices = funcionDarIndices(token, texto);
			//console.log(JSON.stringify(indices));
			misIndices.push(indices);
		}
		//Se unen los grupos que tienen intersección
		var indiceGrupos = 0;
		while (indiceGrupos < misIndices.length) {
			var grupo1 = misIndices[indiceGrupos];
			//miro de aquí en adelante que no exista intersección
			var i = (indiceGrupos + 1);
			while (i<misIndices.length) {
				var grupo2 = misIndices[i];
				if (grupo2[0] <= grupo1[1] && grupo2[1] >= grupo1[0]) {
					//console.log('Hay match, Toca unir', JSON.stringify(grupo1), JSON.stringify(grupo2));
					grupo1[0] = Math.min(grupo1[0], grupo2[0]);
					grupo1[1] = Math.max(grupo1[1], grupo2[1]);
					grupo1[2] = grupo1[2].concat(grupo2[2]);
					//Elimino el grupo 2
					misIndices.splice(i, 1);
					i = (indiceGrupos + 1);
				} else {
					i++;
				}
			}
			indiceGrupos++;
		}
		//console.log(JSON.stringify(misIndices));
		//Extraigo los grupos y los uno con ...
		var textoFinal = '';
		for (var i=0; i<misIndices.length; i++) {
			var miGrupo = misIndices[i];
			textoFinal+='... ';
			var contenido = texto.substring(miGrupo[0], miGrupo[1]);
			for (var j=0; j<miGrupo[2].length; j++) {
				contenido = contenido.replace(miGrupo[2][j], '<b>'+miGrupo[2][j]+'</b>');
			}
			textoFinal+=contenido;
		}
		return textoFinal;
	};

	var probar = function() {
		var tokens1 = ['video', 'juegos'];
		var texto1 = "Esto es una prueba de video para poder hacer facilmente lo que uno no sabe de juegos y que toto salga correctamente me gustan los videos";
		var gap1 = 15;//caraceres alrededor
		var MIN_TAM_TOKENS = 3;
		var MAX_TAM_CONSOLIDADO = 20;
		var LISTA_NEGRA_TOKENS;
		LISTA_NEGRA_TOKENS = ['de', 'en', 'con', 'para', 'el', 'él', 'la', 'sin', 'mas', 'ella', 'ellos', 'es', 'un', 'una'];
		LISTA_NEGRA_TOKENS = [];

		console.log(resaltarTokensEnTexto(texto1, tokens1, gap1));
		console.log(JSON.stringify(tokenizarTextos('Esto es una prueba para saber si esto sirve o no, es un texto largo con 1 numero y otro 11 por allá lejos. Mi chigüiro es hermoso', MIN_TAM_TOKENS, LISTA_NEGRA_TOKENS, MAX_TAM_CONSOLIDADO), null, 4));

	};

	return {
		'resaltarTokensEnTexto': resaltarTokensEnTexto,
		'tokenizarTextos': tokenizarTextos,
		'probar': probar,
		'generarTokensPal': generarTokensPal,
	};
})();