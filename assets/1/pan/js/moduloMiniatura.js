var moduloMiniatura = (function() {

	var generarGeometria = function(tamanio) {
		var raiz2 = 1.4142135623730951;
		var radio = tamanio*raiz2;
		var pasos = 400;
		var geometry = new THREE.Geometry();
		
		//El centro 0
		geometry.vertices.push(new THREE.Vector3(0, 0, 0));
		
		var pasoUV = 1/pasos;
		var pasoUV2 = pasoUV/2;
		for (var i=0; i<=pasos; i++) {
			var angulo = 2*Math.PI*(i/pasos);
			var x = radio*Math.cos(angulo);
			var y = radio*Math.sin(angulo);
			geometry.vertices.push(new THREE.Vector3( x, y, 0));
			if (i > 0) {
				geometry.faces.push(new THREE.Face3(0, i, i+1));
				var minx = pasoUV*(i-1);
				var maxx = pasoUV*(i);
				var midx = minx+pasoUV2;
				var uvs1 = [new THREE.Vector2(midx, 0), new THREE.Vector2(minx, 1), new THREE.Vector2(maxx, 1)];
				geometry.faceVertexUvs[0].push(uvs1);
			}
		}
		
		geometry.computeVertexNormals();
		geometry.normalsNeedUpdate = true;
		
		return geometry;
	};

	var tinyPlanet = function (url, maxWidth) {
		var diferido = $.Deferred();
		var MIME = 'image/jpg';

		var recuperarArchivo = function(canvas) {
			var dataURL = canvas.toDataURL(MIME);
			//console.log(dataURL)
			var blobBin = atob(dataURL.split(',')[1]);
			var array = [];
			for(var i = 0; i < blobBin.length; i++) {
				array.push(blobBin.charCodeAt(i));
			}
			var file = new Blob([new Uint8Array(array)], {type: MIME});
			return file;
		};
		
		var canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		//var canvas = document.getElementById("c");
		canvas.width = maxWidth;
		canvas.height = maxWidth;
		
		  var width = maxWidth;
		  var height = maxWidth;
		  const renderer = new THREE.WebGLRenderer({canvas});
		  const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
		  camera.position.z = 100;

		  const scene = new THREE.Scene();

		  var geometry = generarGeometria(maxWidth/2);
		  const cubes = [];  // just an array we can use to rotate the cubes
		  const loader = new THREE.TextureLoader();
		  var cargador = loader.load(url, function() {
			  const material = new THREE.MeshBasicMaterial({
				map: cargador,
			  });
			  const cube = new THREE.Mesh(geometry, material);
			  cube.position.x = 0;
			  cube.position.y = 0;
			  cube.position.z = 0;
			  scene.add(cube);
			  scene.background = new THREE.Color( 0xffffff );
			  cubes.push(cube);  // add to our list of cubes to rotate
			  function resizeRendererToDisplaySize(renderer) {
				const width = canvas.clientWidth;
				const height = canvas.clientHeight;
				const needResize = canvas.width !== width || canvas.height !== height;
				if (needResize) {
				  renderer.setSize(width, height, false);
				}
				return needResize;
			  }
			  function render(time) {
				if (resizeRendererToDisplaySize(renderer)) {
				  camera.aspect = canvas.clientWidth / canvas.clientHeight;
				  camera.updateProjectionMatrix();
				}
				renderer.render(scene, camera);
				//requestAnimationFrame(render);
				var archivo = recuperarArchivo(canvas);
				document.body.removeChild(canvas);
				diferido.resolve(archivo);
			  }
			  setTimeout(function() {
				requestAnimationFrame(render);
			  },0);
		  });
		  return diferido;
	};
	
	return {
		'tinyPlanet': tinyPlanet,
	};
})();