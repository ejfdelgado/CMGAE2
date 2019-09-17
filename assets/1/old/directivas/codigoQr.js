'use strict';

define(['js/micodigo', 'librerias/qrcode/jquery.qrcode.min'], 
  function (micodigo, qrcode) {
  //Uso: <div codigo-qr></div>
  micodigo.register.directive("codigoQr", [function() {
    return {
      restrict: "A",
      link: {
        pre: function(scope, element, attrs, ngModel) {
          
          $(element).qrcode({width: 256,height: 256,text: window.location.href});

          scope.descargar = function(opciones) {
            var predefinidos = {
                'nombre': 'micodigo.pdf',
                'alto': 792,
                'ancho': 612,
                'orientacion': 'portrait',
            };
            $.extend(true, predefinidos, opciones);
            var imgData = $(element).find('canvas')[0].toDataURL('image/jpeg');
            var doc = new jsPDF({
              orientation: predefinidos.orientacion,//portrait landscape
              unit: 'mm', //pt mm cm in
              format: [predefinidos.ancho, predefinidos.alto] //https://rawgit.com/MrRio/jsPDF/master/docs/jspdf.js.html#line47
            });
            
            doc.setFontSize(40);
            doc.text(35, 25, 'Paranyan loves jsPDF');
            doc.addImage(imgData, 'JPG', 15, 40, 256, 256);
            doc.save(predefinidos.nombre);
          };

          //Al darle click manda a descargar
          $(element).on('click', function() {
            scope.descargar();
          });
          
        },
        post: function(scope, element, attrs, ngModel) {
          
        }
      }
    };
  }]);
});