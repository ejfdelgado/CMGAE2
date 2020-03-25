app.directive("directvozmichart", function () {
        return {
            restrict: "C",
            require: "ngModel",
            link: function (scope, element, attrs, ngModel) {

                ngModel.$render = function () {
                    console.log('directvozmichart', JSON.stringify(ngModel.$viewValue), element);
                    var miModelo = ngModel.$viewValue;

                    var opciones = miModelo.opciones;
                    var llavesOpciones = Object.keys(opciones);
                    var COLORES = [];
                    var LABELS = [];
                    for (var i=0; i<llavesOpciones.length; i++) {
                      var llaveOpcion = llavesOpciones[i];
                      var unaOpcion = opciones[llaveOpcion];
                      COLORES.push(unaOpcion.rgb);
                      LABELS.push('');
                    }

                    var horizontalBarChartData = {
                        labels: LABELS,
                        datasets: [{
                          label: '',
                          backgroundColor: COLORES,
                          borderColor: COLORES,
                          borderWidth: 1,
                          data: miModelo.resultado.data,
                        }]
                      };
                    var config = {
                      indexLabelFontSize: 20,
                      type: 'bar',
                      data: horizontalBarChartData,
                      options: {
                        // Elements options apply to all of the options unless overridden in a dataset
                        // In this case, we are setting the border of each horizontal bar to be 2px wide
                        elements: {
                          rectangle: {
                            borderWidth: 2,
                          }
                        },
                        responsive: true,
                        title: {
                          display: false,
                        },
                        aspectRatio: 2,
                        scales: {
                          xAxes: [{
                            display: true,
                            ticks: {
                              beginAtZero: true,
                              max: 100,
                              fontSize: 20,
                            },
                          }],
                          yAxes: [{
                            display: true,
                            ticks: {
                              beginAtZero: true,
                              max: 100,
                            },
                          }]
                        },
                        legend: {
                          display: false,
                        },
                      }
                    };
                    var ctx = element[0].getContext('2d');
                    var miDona = new Chart(ctx, config);

                };
            }
        };
    });