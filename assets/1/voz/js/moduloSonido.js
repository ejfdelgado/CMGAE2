"use strict";

var moduloSonido = (function($) {
	
	//webkitURL is deprecated but nevertheless
	URL = window.URL || window.webkitURL;

	var gumStream; 						//stream from getUserMedia()
	var rec; 							//Recorder.js object
	var input; 							//MediaStreamAudioSourceNode we'll be recording

	// shim for AudioContext when it's not avb. 
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	var audioContext //audio context to help us record
	
	var estado = null;

	function startRecording() {
		var diferido = $.Deferred();
		if (estado == null) {
			estado = 'pregrabando';
		    var constraints = { audio: true, video:false }
			navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
				audioContext = new AudioContext();
				console.log("Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz");
				gumStream = stream;
				input = audioContext.createMediaStreamSource(stream);
				rec = new Recorder(input,{numChannels:1});
				rec.record();
				estado = 'grabando';
				diferido.resolve();
			}).catch(function(err) {
				estado = null;
				diferido.reject();
			});
		} else {
			diferido.reject();
		}
	    return diferido;
	}

	function pauseRecording(){
		if (rec.recording){
			rec.stop();
			estado = 'pausado';
		}else{
			rec.record();
			estado = 'grabando';
		}
	}

	function stopRecording() {
		var diferido = $.Deferred();
		rec.stop();
		gumStream.getAudioTracks()[0].stop();
		rec.exportWAV(function(blob) {
			diferido.resolve(blob);
			
		});
		return diferido;
	}

	function createDownloadLink(blob, esURL) {
		
		var url;
		if (esURL === true) {
			url = blob;
		} else {
			url = URL.createObjectURL(blob);
		}
		
		var au = document.createElement('audio');
		var li = document.createElement('li');
		var link = document.createElement('a');

		//name of .wav file to use during upload and download (without extendion)
		var filename = new Date().toISOString();

		//add controls to the <audio> element
		au.controls = true;
		au.src = url;

		//save to disk link
		link.href = url;
		link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
		link.innerHTML = "Download";

		//add the new audio element to li
		li.appendChild(au);
		
		//add the filename to the li
		li.appendChild(document.createTextNode(filename+".wav "))

		//add the save to disk link to li
		li.appendChild(link);

		return li;
	}
	
	return {
		'start': startRecording,
		'pause': pauseRecording,
		'stop': stopRecording,
		'li': createDownloadLink,
	};
})(jQuery);