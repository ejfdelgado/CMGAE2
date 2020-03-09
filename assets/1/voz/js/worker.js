onmessage = function(e) {
	  var soundBlob = e.data[0];
	  var darFuncionCargue = e.data[1];
	  
      darFuncionCargue()({
          auto: 'false', 
          fileName: (new Date().getTime())+'.wav',
          dataFolder:'/sonidos',
        }, soundBlob).then(function(metadata) {
      	  console.log(metadata);
          var contenido = {'url': moduloArchivos.generarUrlDadoId(metadata.id)};
          //Pide el texto!
  		var url = '/storage/voice?';
  		url+=$.param({'name': metadata.id});
  		moduloHttp.get(url).then(function(voice) {
  			contenido.det = voice;
  			postMessage(contenido);
  		});
        }, function() {
      	  
        });
};