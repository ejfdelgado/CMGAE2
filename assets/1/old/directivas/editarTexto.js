'use strict';

define(['js/micodigo'], function (micodigo) {
	//Uso: <div editar-texto ng-model="modelo.texto"></div><p>{{modelo | json}}</p>
	micodigo.register.directive("editarTexto", [function() {
	  return {
	    restrict: "A",
	    require: "ngModel",
	    link: {
	    	pre: function(scope, element, attrs, ngModel) {
					var esEditable = false;
					var editable = function(es) {
						esEditable = (es === true);
						if (esEditable) {
							$(element).attr("contenteditable", true);
						} else {
							$(element).removeAttr('contenteditable');
						}
					};
					
					var read = function() {
						ngModel.$setViewValue(element.html());
					};

					ngModel.$render = function() {
						element.html(ngModel.$viewValue || "");
					};

					element.bind("blur keyup change", function() {
						scope.$apply(read);
					});
					
					//Debe tener un evento de escucha que sepa si el módulo de seguridad tiene los permisos o no para editar
					//Debe además poder preguntarle al módulo de seguridad si actualmente es editable
					
					$(element).data('editable', editable);
		    },
		    post: function(scope, element, attrs, ngModel) {
		    	
		    }
	    }
	  };
	}]);
});