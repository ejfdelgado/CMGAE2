
var gulp = require('gulp')
, uglify = require("gulp-uglify")
, concat = require("gulp-concat")
, gulpCopy = require("gulp-copy")
, babel = require("gulp-babel");

gulp.task('default', function() {  
	
  gulp.src([
	'./assets/cmgae/utils.js',
	'./assets/cmgae/modIdGen.js',
	'./assets/cmgae/moduloArreglos.js',
	'./assets/cmgae/moduloTokenizar.js',
	'./assets/cmgae/utilidades.js',
	'./assets/cmgae/seguridad.js',
	'./assets/cmgae/moduloTransformacion.js',
	'./assets/cmgae/moduloSonidos.js',
    './assets/cmgae/moduloActividad.js',
    './assets/cmgae/moduloModales.js',
    './assets/cmgae/moduloHttp.js',
    './assets/cmgae/moduloLocal.js',
    './assets/cmgae/moduloEditorTexto.js',
	'./assets/cmgae/moduloArchivos.js',
	'./assets/cmgae/moduloArbolArchivos.js',
	'./assets/cmgae/moduloApp.js',
	'./assets/cmgae/moduloImagenes.js',
	'./assets/cmgae/moduloHistoria.js',
	'./assets/cmgae/moduloJuegoVista.js',
	'./assets/cmgae/moduloTimer.js',
	'./assets/cmgae/moduloInterpolar.js',
	'./assets/cmgae/moduloCountDown.js',
  ]).pipe(concat('modulos.min.js'))
    .pipe(babel())
    //.pipe(uglify())
    .pipe(gulp.dest('assets/dist'));
  
});
