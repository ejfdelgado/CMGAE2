'use strict';
//https://github.com/fengyuanchen/cropperjs
//Resize image first of instancing cropper, in iOS it crashes
//Uso: <div editar-imagen-crop><img id="image" src="assets/img/picture.jpg"></div>

define(['js/micodigo', 'node_modules/cropperjs/dist/cropper'], function (micodigo, Cropper) {

	micodigo.register.directive("editarImagenCrop", ['CONSTANTES',
		function(CONSTANTES) {
	  return {
	    restrict: "A",
	    //require: "ngModel",
		transclude: true,
		templateUrl: function(elem, attr){
		  return 'directivas/editableImageCrop.html';
		},
		link: {
			pre:function(scope, elm, attr) {
				
			}, post:function(scope, elm, attr){
				scope.cropper = null;
				var imagenes = $(elm).find('img');
				if (imagenes.length > 0){
					var image = imagenes[0];
					
					scope.cropper = new Cropper(image, {
					  aspectRatio: 1 / 1,
					  viewMode: 2,//1 rop box to not exceed the size of the canvas, 2 fit, 3 fill
					  dragMode: 'crop',//crop move none
					  responsive: true,
					  autoCrop: false,
					  ready() {
						console.log('Listo!');
						console.log(JSON.stringify(scope.cropper.getImageData()));
						this.cropper.crop();
					  },
					  crop(event) {
						console.log(JSON.stringify(scope.cropper.getData()));
					  },
					});
				}
				
						//cropper.reset();
			//cropper.clear();
			//cropeer.replace('url');
			//cropper.destroy();
			//var text = cropper.getCroppedCanvas().toDataURL('image/jpeg');
			//console.log(text);
			/*
			cropper.getCroppedCanvas().toBlob(function(blob){
			  var formData = new FormData();
			  formData.append('croppedImage', blob);
			  console.log(blob)
			});
			*/
			}
		}
	  };
	}]);

});