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
    
	var usuarioActual = null;

    function getRecaptchaMode() {
      // Quick way of checking query params in the fragment. If we add more config
      // we might want to actually parse the fragment as a query string.
      return location.hash.indexOf('recaptcha=invisible') !== -1 ?
          'invisible' : 'normal';
    }

    console.log('Inicializando firebase auth');
    // Initialize Firebase
    var config = {};
    var CLIENT_ID = null;

    var getUiConfig = function() {
      return {
        'callbacks': {
          // Called when the user has been successfully signed in.
          'signInSuccess': function(user, credential, redirectUrl) {
        	  usuarioActual = user;
        	  $.publish('miseguridad.login', user);
        	  // Do not redirect.
        	  return false;
          }
        },
        // Opens IDP Providers sign-in flow in a popup.
        'signInFlow': 'popup',
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
            }
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
            usuarioActual = null;
            $.publish('miseguridad.logout');
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
        	}
        	temp.resolve(peticion);
    	});
    	return temp.promise();
    };
    
    var darToken = function() {
    	var temp = $.Deferred();
    	if (hayValor(usuarioActual)) {
    		usuarioActual.getIdToken().then(function(accessToken) {
    			temp.resolve(accessToken);
			}, function() {
				temp.resolve(null);
			});
    	} else {
    		temp.resolve(null);
    	}
        return temp.promise();
    };
    
    var mostrarToken = function(user) {
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
              document.getElementById('sign-in-status').textContent = 'Signed in';
              document.getElementById('sign-in').textContent = 'Sign out';
              document.getElementById('sign-in').onclick = salir;
              document.getElementById('account-details').textContent = JSON.stringify({
                displayName: displayName,
                email: email,
                emailVerified: emailVerified,
                phoneNumber: phoneNumber,
                photoURL: photoURL,
                uid: uid,
                accessToken: accessToken,
                providerData: providerData
              }, null, '  ');
              
              $('#call-action').on('click', function() {
                $.ajax({
    				type: "GET",
    				url: "/act/identidad",
                    headers: { 
                      'Authorization': 'Bearer ' + accessToken
                    },
    			}).done(function (msg) {
    				console.log(msg);
    			}).fail(function (jqXHR, textStatus) {
    				console.log('error');
    			}).always(function () {
    				
    			});
              });
            });
          } else {
            // User is signed out.
            document.getElementById('sign-in-status').textContent = 'Signed out';
            document.getElementById('sign-in').textContent = 'Sign in';
            document.getElementById('account-details').textContent = 'null';
          }
    };
    
    var initApp = function() {
    	firebase.auth().onAuthStateChanged(function(user) {
    		usuarioActual = user;
    		mostrarToken(usuarioActual);
    	}, function(error) {
    		usuarioActual = null;
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
      };
    })(jQuery);