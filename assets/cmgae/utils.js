
var moduloCrossBrowser = (function() {
	var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	
	var esiOS = function() {
		return iOS;
	};
	
	return {
		esiOS: esiOS,
	};
})();

var asignarTituloPagina = function(titulo) {
	if (!hayValor(titulo)) {return;}
    $(document).ready(function() {
        document.title = titulo;
    });
};

var agregarLinkDinamico = function(src, callback) {	
    var s = document.createElement('link');
   	s.rel = 'stylesheet';
    s.href = src;
    s.type="text/css";
    s.async = false;
    s.onload = function() {
    	diferidoAct.resolve();
    	if (esFuncion(callback)) {
    		callback();
    	}
    };
    var diferidoAct = moduloActividad.on();
    document.head.appendChild(s);
};

var hayValor = function(valor) {
	return (valor != undefined && valor != null && (!(typeof valor == 'string') || valor.trim().length > 0));
};

var esFuncion = function(algo) {
	return (typeof algo == 'function')
};

var esNumero = function(dato) {
	return (typeof dato == 'number' || /^\d+$/.test(dato));
};

var esBoolean = function(variable) {
	return (typeof(variable) === "boolean");
}

var esObjeto = function(value) {
	return (typeof value == 'object' && value !== null);
};

var esLista = function(value) {
	return (hayValor(value) && value instanceof Array);
};

var estaEnLista = function(valor, lista) {
	if (!esLista(lista)){return false;}
	return (lista.indexOf(valor) >= 0);
};

var copiarJSON = function(dato) {
	if (typeof dato == 'undefined') {return null;}
	return JSON.parse(JSON.stringify(dato));
};

var esMultilenguaje = function(entrada) {
	return /^(\S)+(\.\S+)+$/gim.test(entrada)
};

function darNumeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function decimalAHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
};

var darHtmlCompleto = function(elem) {
	return $('<div>').append(elem.clone()).html();
};

var darHtmlSeguro = function(texto) {
	return $('<div>').html(texto).html();
};

var deHtmlDarSoloTexto = function(texto) {
	return $('<div>').html(texto).text();
};

var darColorAleatorio = function(min, max) {
  if (!esNumero(min)) {min = 0;}
  if (!esNumero(max)) {max = 255;}
  if (min<0){min=0;}
  if (max>255){max=255;}
  var color = '#';
  for (var i = 0; i < 3; i++) {
    color += decimalAHex(darNumeroAleatorio(min, max));
  }
  return color;
};

var quitarUltimoSlash = function(rutaDestino) {
	rutaDestino = rutaDestino.trim();
	if (rutaDestino.endsWith('/')) {
		rutaDestino = rutaDestino.substring(0, rutaDestino.length-1);
	}
	return rutaDestino;
}

var leerObj = function(obj, nombres, predef, evitarInvocar) {
	if (!hayValor(nombres) || !esObjeto(obj)){return predef;}
	var partes = nombres.split('.');
	var objetoActual = obj;
	for (let i=0; i<partes.length; i++) {
		var llave = partes[i];
		if (esNumero(llave) && esLista(objetoActual)) {
			llave = parseInt(llave);
		}
		objetoActual = objetoActual[llave];
		if (i != (partes.length - 1) && !esObjeto(objetoActual)) {
			return predef;
		}
	}
	if (!hayValor(objetoActual)) {
		return predef;
	}
	if (evitarInvocar !== true && esFuncion(objetoActual)) {
		return objetoActual();
	}
	return objetoActual;
};

var asignarObj = function(raiz, nombres, valor) {
	var partes = nombres.split('.');
	var objetoActual = raiz;
	for (var i=0; i<partes.length; i++) {
		var llave = partes[i];
		if (esNumero(llave)) {
			llave = parseInt(llave);
		}
		if (esObjeto(objetoActual)) {
			if (i == (partes.length-1)) {
				if (esLista(objetoActual[llave]) && esLista(valor) && objetoActual[llave] !== valor) {
					objetoActual[llave].splice(0, objetoActual[llave].length);
					$.each(valor, function(i, eee) {
						objetoActual[llave].push(eee);
					});
				} else {
					objetoActual[llave] = valor;
				}
			} else {
				if (Object.keys(objetoActual).indexOf(''+llave) < 0 || (objetoActual[llave] == null)) {
					if (esNumero(partes[i+1])) {
						objetoActual[llave] = [];
					} else {
						objetoActual[llave] = {};
					}
				}
				objetoActual = objetoActual[llave];
			}
		}
	}
};

var darRutasObjeto = function(objOr, filtroObjetoAgregar) {
  var ans = [];
  var funcionRecursiva = function(obj, rutaActual) {
    if (esObjeto(obj)) {
      $.each(obj, function(llave, valor) {
        var llaveSiguiente = null;
        if (rutaActual === null) {
          llaveSiguiente = llave;
        } else {
          llaveSiguiente = rutaActual+'.'+llave;
        }
        if (esFuncion(filtroObjetoAgregar) && filtroObjetoAgregar(valor)) {
          ans.push(llaveSiguiente);
        }
        funcionRecursiva(valor, llaveSiguiente);
      });
    } else {
      if (rutaActual !== null) {
        if (esFuncion(filtroObjetoAgregar)) {
          if (filtroObjetoAgregar(obj)) {
            ans.push(rutaActual);
          }
        } else {
          ans.push(rutaActual);
        }
      }
    }
  };

  funcionRecursiva(objOr, null);
  return ans;
};

var predefinir = function(objeto, ejemplo) {
	var llaves = darRutasObjeto(ejemplo);
	for (let i=0; i<llaves.length; i++) {
		let llave = llaves[i];
		if (!hayValor(leerObj(objeto, llave, null, true))) {
			let nuevo = leerObj(ejemplo, llave, null, true);
			asignarObj(objeto, llave, nuevo);
		}
	}
	return objeto;
};

/*
Función que facilita la configuración de listas de datos con Midgard
La configuración de listas es algo como:
{
	'Caracteristica': {
		ejemplo: '#CaracteristicaEjemplo',
		campos: [
		         {nombre:'imagen', tipo:'Text'},
		         {nombre:'titulo', tipo:'TextSimple'},
		         {nombre:'contenido', tipo:'nuevo'},
		],
		listas: [{nombre:'lista1'}],
	}
}
 */
var configurarListasEditor = function (vie, configuracionListas) {
    vie.use(new vie.RdfaService());
    
    for (let tipoNombre in configuracionListas) {
    	let tipoNombreRel = tipoNombre+'Rel';
    	let unTipo = configuracionListas[tipoNombre];
    	let confCampos = [];
    	for (let i=0; i<unTipo.campos.length; i++) {
    		let unCampo = unTipo.campos[i];
    		confCampos.push({'id': unCampo.nombre, 'range': unCampo.tipo, 'min': 0, 'max': 1});
    	}
    	vie.types.add(tipoNombre, confCampos);
    	for (let j=0; j<unTipo.listas.length; j++) {
    		let elem = unTipo.listas[j];
    		vie.types.add(elem.nombre, [{id:tipoNombreRel, range:tipoNombre, min: 0, max: -1}]);
    	}
    	vie.service('rdfa').setTemplate(tipoNombre, tipoNombreRel, jQuery(unTipo.ejemplo).html());
    }
};

var tieneAtributo = function(elem, name) {
	var attr = elem.attr(name);
	return (typeof attr !== typeof undefined && attr !== false)
};

var activarConteoRegresivo = function() {
	//Countdown
	//<script src="/assets/js/comun/jquery.countdown.min.js"></script>
	//<div dateProperty="regresivo" data-value="{% buscar leng dicci tipo nodo 'regresivo' '1480809600' %}"><h1 class="mycountdown" data-format="yyyy/MM/dd" data-count-format="%D d&iacute;as %H:%M:%S"></h1></div>
	$('.mycountdown').each(function(i, obj) {
		var self = $(obj);
		var inicio = self.text();
		var formato = self.attr('data-count-format');
		self.countdown(inicio, function(event) {
			$(this).text(event.strftime(formato));
		});
	});
};

var jsonToHtml = function(val) {
	return JSON.stringify(val, null, 4).replace('\n', '<br/>');
};

var copiarEnPortapapeles = function(texto) {
  var aux = document.createElement("input");
  aux.setAttribute("value", texto);
  document.body.appendChild(aux);
  aux.select();
  document.execCommand("copy");
  document.body.removeChild(aux);
};

var darParametrosUrl = function(str) {
	if (!hayValor(str)) {
		str = location.search
	}
	var regex = /([^&=?]+)=([^&=?]+)/ig;
	var result;
	var res = {};
	while ((result = regex.exec(str)) ) {
		if (!esLista(res[result[1]])) {
			res[result[1]] = [];
		}
		res[result[1]].push(result[2]);
	}
	return res;
};

var urlContieneExtension = function(url, tipos) {
	url = url.toLowerCase();
	for (let i=0; i<tipos.length; i++) {
		if (url.indexOf('.'+tipos[i]) >= 0) {
			return true;
		}
	}
	return false;
};

var eliminarPrefijo = function(texto, prefijo) {
	if (!hayValor(texto)){return '';}
	if (!hayValor(prefijo)){return texto;}
	if (texto.startsWith(prefijo)) {
		return texto.substring(prefijo.length, texto.length);
	}
};

/**
*
*  MD5 (Message-Digest Algorithm)
*  http://www.webtoolkit.info/
*
**/
/**
*
*  MD5 (Message-Digest Algorithm)
*  http://www.webtoolkit.info/
*
**/
var MD5 = function (string) {
    function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }
    function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }
    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }
    function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
    function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
    function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
    function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };
    function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    };
    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };
    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;
    string = Utf8Encode(string);
    x = ConvertToWordArray(string);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }
    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
    return temp.toLowerCase();
};

var irAlFinal = function() {
	$('html, body').scrollTop( $(document).height() );
}

//Patron observer
//$.publish('millave', 'hello');
//$.subscribe('millave', function(event, data) {console.log(data);});
var patronObservable = function() {
    var o = $({});
    $.each({
        trigger: 'publish',
        on: 'subscribe',
        off: 'unsubscribe'
    }, function(key, val) {
        $[val] = function() {
            o[key].apply(o, arguments);
        };
    });
};
patronObservable();
