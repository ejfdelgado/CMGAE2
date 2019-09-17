require.config({
    baseUrl: '',
    urlArgs: 'v=1.0',
});

var LIB_BASICAS = [
'directivas/editarTexto',
'directivas/editarImagenCrop',
'directivas/codigoQr',
'directivas/appActividad',
];

require(
    [
        'js/routeResolver',
        'js/micodigo',
        'js/moduloMsj',
        'servicios/modalesSrv',
        'servicios/rutasSrv',
    ],
    function () {
        angular.bootstrap(document, ['micodigo']);
    });
