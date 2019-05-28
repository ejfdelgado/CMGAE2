/*

Recordar:
https://console.developers.google.com/apis/credentials
En OAuth 2.0 client IDs:
Agregar los dominios desde donde se puede acceder.

Para probar en local:
En el archivo:
C:\Windows\System32\Drivers\etc\hosts
Agregar el dominio de desarrollo
127.0.0.1       proyeccion-colombia1.appspot.com

EN Run Configurations:
"${workspace_loc:CMGAE2}" --admin_port=9000 --port 80 --enable_host_checking=false

 */
var  miseguridad = (function($) {
	console.log('Inicializando firebase auth');
	
	// Initialize Firebase
	var config = {};
	var CLIENT_ID = null;
	var diferidoFirebase = $.Deferred();
	var diferidoDatos = $.Deferred();
	var datosLocales = {};

	var borrarDatos = function() {
		datosLocales = {
			id: null,
			usr: null,
			roles: [],
		};
	};
	
	function getRecaptchaMode() {
		// Quick way of checking query params in the fragment. If we add more config
		// we might want to actually parse the fragment as a query string.
		return location.hash.indexOf('recaptcha=invisible') !== -1 ?
				'invisible' : 'normal';
	}
	
	var then = function(funExito, funError) {
		return diferidoDatos.then(funExito, funError);
	};
	
	var recargarDatos = function(usuario) {
		datosLocales.usr = usuario;
		insertarToken({
			type: "GET",
			url: "/adm/identidad",
		}).then(function(peticion) {
			$.ajax(peticion).done(function (msg) {
				$.extend(true, datosLocales, msg);
				diferidoDatos.resolve(datosLocales);
			}).fail(function (jqXHR, textStatus) {
				borrarDatos();
				diferidoDatos.reject(datosLocales);
			});
		}, function() {
			borrarDatos();
			diferidoDatos.reject(datosLocales);
		});
		return diferidoDatos;
	};

	var getUiConfig = function() {
		return {
			'callbacks': {
				// Called when the user has been successfully signed in.
				'signInSuccess': function(user, credential, redirectUrl) {
					diferidoFirebase = $.Deferred();
					diferidoDatos = $.Deferred();
					recargarDatos(user).then(function() {
						$.publish('miseguridad.login', user);
						location.reload();
					});
					// Do not redirect.
					return false;
				}
			},
			// Opens IDP Providers sign-in flow in a popup.
			'signInFlow': 'popup',
			//'tosUrl': '/tos/terminos',
			//'privacyPolicyUrl': '/tos/privacidad',
			'signInOptions': [
			                  // TODO(developer): Remove the providers you don't need for your app.
			                  {
			                	  provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			                	  // Required to enable this provider in One-Tap Sign-up.
			                	  authMethod: 'https://accounts.google.com',
			                	  // Required to enable ID token credentials for this provider.
			                	  clientId: CLIENT_ID
			                  },
			                  {
			                	  provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
			                	  scopes :[
			                	           'public_profile',
			                	           'email',
			                	           //'user_likes',
			                	           //'user_friends'
			                	           ]
			                  },
			                  firebase.auth.TwitterAuthProvider.PROVIDER_ID,
			                  firebase.auth.GithubAuthProvider.PROVIDER_ID,
			                  {
			                	  provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
			                	  // Whether the display name should be displayed in Sign Up page.
			                	  requireDisplayName: true
			                  },
			                  {
			                	  provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			                	  recaptchaParameters: {
			                		  size: getRecaptchaMode()
			                	  },
			                	  defaultCountry: 'CO',
			                  }
			                  ],
			                  // Terms of service url.
			                  'tosUrl': 'https://www.google.com',
			                  'credentialHelper': CLIENT_ID && CLIENT_ID != 'YOUR_OAUTH_CLIENT_ID' ?
			                		  firebaseui.auth.CredentialHelper.GOOGLE_YOLO :
			                			  firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
		};
	};

	var salir = function() {
		var promesa = firebase.auth().signOut();
		promesa.then(function() {
			// Sign-out successful.
			console.log('Salida exitosa');
			borrarDatos();
			$.publish('miseguridad.logout');
			location.reload();
		}, function(error) {
			// An error happened.
			console.log('No se logró salir');
		});
		return promesa;
	};

	var insertarToken = function(peticion) {
		var temp = $.Deferred();
		darToken().then(function(accessToken) {
			if (accessToken != null) {
				if (!('headers' in peticion)) {
					peticion.headers = {};
				}
				peticion.headers['Authorization'] = 'Bearer ' + accessToken;
				temp.resolve(peticion);
			} else {
				temp.reject(peticion);
			}
		}, function() {
			temp.reject(peticion);
		});
		return temp;
	};

	var darToken = function() {
		var temp = $.Deferred();
		diferidoFirebase.then(function(usr) {
			if (hayValor(usr)) {
				usr.getIdToken().then(function(accessToken) {
					temp.resolve(accessToken);
				}, function() {
					temp.resolve(null);
				});				
			} else {
				temp.reject(null);
			}
		}, function() {
			temp.reject(null);
		});
		return temp;
	};

	var mostrarToken = function() {
		var user = datosLocales.usr;
		if (user) {
			// User is signed in.
			var displayName = user.displayName;
			var email = user.email;
			var emailVerified = user.emailVerified;
			var photoURL = user.photoURL;
			var uid = user.uid;
			var phoneNumber = user.phoneNumber;
			var providerData = user.providerData;
			user.getIdToken().then(function(accessToken) {
				$('#firebaseui-auth-container').addClass('invisible');
				$('#sign-in-status').html('Signed in');
				$('#account-details').html(JSON.stringify({
					displayName: displayName,
					email: email,
					emailVerified: emailVerified,
					phoneNumber: phoneNumber,
					photoURL: photoURL,
					uid: uid,
					accessToken: accessToken,
					providerData: providerData,
					interno: datosLocales,
				}, null, 4));

				$('#call-action').on('click', function() {

				});
			});
		} else {
			// User is signed out.
			$('#sign-in-status').html('Signed out');
			$('#account-details').html('null');
		}
	};

	var initApp = function() {
		firebase.auth().onAuthStateChanged(function(user) {
			if (user == null) {
				diferidoFirebase.reject();
			} else {
				diferidoFirebase.resolve(user);
			}
		}, function(error) {
			diferidoFirebase.reject();
		});
		
		diferidoFirebase.then(function(user) {
			recargarDatos(user).then(function() {
				$('#sign-in').html('Sign out');
				$('#sign-in').on('click', salir);
				mostrarToken();
			});
		}, function() {
			borrarDatos();
			$('#sign-in').html('Sign in');
			$('#sign-in').off('click');
			$('#sign-in').on('click', function() {
				$('#firebaseui-auth-container').removeClass('invisible');
			});
		});
	};

	$(document).ready(function() {
		//Se lee la configuración dinámicamente desde un archivo JSON
		$.ajax({
			dataType: "json",
			url: "/firebase.json",
			success: function(datos) {
				//La configuración
				$.extend(true, config, datos.config);
				//El cliente
				CLIENT_ID = datos.CLIENT_ID;
				firebase.initializeApp(config);
				// Initialize the FirebaseUI Widget using Firebase.
				var ui = new firebaseui.auth.AuthUI(firebase.auth());
				// The start method will wait until the DOM is loaded.
				var refTag = '#firebaseui-auth-container'; 
				if ($(refTag).length > 0) {
					ui.start(refTag, getUiConfig());
				}
				initApp();
			}
		});
	});

	var darId = function() {
		return moduloHttp.get('/storage/miruta');
	}

	return {
		'logout': salir,
		'darToken': darToken,
		'insertarToken': insertarToken,
		'darId': darId,
		'then': then,
	};
})(jQuery);