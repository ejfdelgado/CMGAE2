"use strict";

var moduloP5 = (function() {
	
	var mic, recorder, soundFile, analyzer, fft;
	var state = 0;
	
  var sketch = function(p) {
    p.setup = function(){
      p.createCanvas(710, 400);
      //p.background(200);
      p.noFill();
      // create an audio in
      mic = new p5.AudioIn();
      
      // prompts user to enable their browser mic
      mic.start();

      // create a sound recorder
      recorder = new p5.SoundRecorder();

      // connect the mic to the recorder
      recorder.setInput(mic);
      
      analyzer = new p5.Amplitude();
      analyzer.setInput(mic);
      
      fft = new p5.FFT();
      fft.setInput(mic);

      // this sound file will be used to
      // playback & save the recording
      soundFile = new p5.SoundFile();

      p.text('keyPress to record', 20, 20);
    }
    
    p.draw = function() {
    	
    	  p.background(200);
    	  p.noFill();
    	  var spectrum = fft.analyze();

    	  p.beginShape();
    	  for (var i = 0; i < spectrum.length; i++) {
    	    p.vertex(i, p.map(spectrum[i], 0, 255, p.height, 0));
    	  }
    	  p.endShape();
    	  
    	  var nyquist = 22050;
    	  var spectralCentroid = fft.getCentroid();
    	  var mean_freq_index = spectralCentroid/(nyquist/spectrum.length);

    	  var centroidplot = p.map(p.log(mean_freq_index), 0, p.log(spectrum.length), 0, p.width);
    	  
    	  p.stroke(255,0,0); // the line showing where the centroid is will be red

    	  p.rect(centroidplot, 0, p.width / spectrum.length, p.height)
    	  p.noStroke();
    	  p.fill(255,255,255);  // text is white
    	  p.text("centroid: ", 10, 20);
    	  p.text(p.round(spectralCentroid)+" Hz", 10, 40);
    	  
    	  //var todo = Math.ceil(fft.getEnergy(20, 20000));
    	  //var voz = Math.ceil(fft.getEnergy(300, 3400));
    	  // Obtén la amplitud RMS (root mean square)
    	  var rms = mic.getLevel();
    	  //var rms = analyzer.getLevel();

    	  p.text("rms: ", 10, 60);
    	  p.text(100*rms, 10, 80);
    	  /*
    	  p.text("todo: ", 10, 60);
    	  p.text(todo, 10, 80);
    	  p.text("voz: ", 10, 100);
    	  p.text(voz, 10, 120);
    	  */
      

	  p.fill(127);
	  p.stroke(0);
	  // Dibuja una elipse con su tamaño proporcional al volumen
	  var max = Math.max(p.width, p.height)*1;
	  p.ellipse(p.width / 2, p.height / 2, 10 + rms * max, 10 + rms * max);
	  
	};
    
    //p.keyPressed = function() {
	p.mousePressed = function() {
    	p.getAudioContext().resume();
    	
    	/*
	  // make sure user enabled the mic
	  if (state === 0 && mic.enabled) {

	    // record to our p5.SoundFile
	    recorder.record(soundFile);

	    p.background(255,0,0);
	    p.text('Recording!', 20, 20);
	    state++;
	  } else if (state === 1) {
	    p.background(0,255,0);

	    // stop recorder and
	    // send result to soundFile
	    recorder.stop();

	    p.text('Stopped', 20, 20);
	    state++;
	  } else if (state === 2) {
	    soundFile.play(); // play the result!
	    //p.saveSound(soundFile, 'mySound.wav');
	    state++;
	  }
	  */
	}
  };
  var node = $('<div></div>');
  new p5(sketch, node[0]);
  $('body').append(node);
  
  var play = function(blob) {
	  var url = URL.createObjectURL(blob);
	  var mySound = new p5.SoundFile(url, function() {
		  mySound.analyze();
		  mySound.getEnergy()
		  mySound.setVolume(1);
		  mySound.play();
	  });
  };
  
  return {
	  'play': play,
  };
})(jQuery);

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

	function createDownloadLink(blob) {
		
		var url = URL.createObjectURL(blob);
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
		link.innerHTML = "Save to disk";

		//add the new audio element to li
		li.appendChild(au);
		
		//add the filename to the li
		li.appendChild(document.createTextNode(filename+".wav "))

		//add the save to disk link to li
		li.appendChild(link);
		
		//upload link
		var upload = document.createElement('a');
		upload.href="#";
		upload.innerHTML = "Upload";
		upload.addEventListener("click", function(event){
			  var xhr=new XMLHttpRequest();
			  xhr.onload=function(e) {
			      if(this.readyState === 4) {
			          console.log("Server returned: ",e.target.responseText);
			      }
			  };
			  var fd=new FormData();
			  fd.append("audio_data",blob, filename);
			  xhr.open("POST","upload.php",true);
			  xhr.send(fd);
		})
		li.appendChild(document.createTextNode (" "))//add a space in between
		li.appendChild(upload)//add the upload link to li

		return li;
	}
	
	return {
		'start': startRecording,
		'pause': pauseRecording,
		'stop': stopRecording,
		'li': createDownloadLink,
	};
})(jQuery);
