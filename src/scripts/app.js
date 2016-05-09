define(['require',
  'angularAMD',
  'angular-route',
  'angular-bootstrap',
  'bootstrap-slider', // ??
  'scripts/shared/main',
  'datetime-picker',
  'angular-animate',
  'jquery-slimscroll',
  'angular-storage',
  'scripts/shared/localize',
  'scripts/shared/directives',
  'scripts/shared/Nav',
  'scripts/shared/notifier',
  'scripts/webitel/webitel',
  'scripts/webitel/domainModel',
  'scripts/modules',
  'angular-clipboard',
  //'scripts/phone/phone',
  'smTable',
  'angular-confirm',
  'file-input',
  'jquery-spinner',
  'file-upload',
  'responsive-table',
  'multi-select',
  'tags-input',
    // TODO injector...
  'angular-sanitize',
  'videogular',

  'dashboard',
  'widget-iframe',
  'widget-base',
  'widget-link',
  'widget-markdown',
  'widget-mongodb',
  'ui-select',
  'google-chart',
  'xeditable'
   // TODO new dash..
  //'gridster'
  ], function (require, angularAMD) {
  //require()
  var app = angular.module("app", ['ngRoute', 'ngStorage', 'angular-clipboard', 'ngSanitize', 'com.2fdevs.videogular',  "com.2fdevs.videogular.plugins.controls", 'ui.select', 'xeditable',
    'adf', 'adf.widget.iframe',  'adf.widget.linklist', 'adf.widget.markdown', 'adf.structures.base', /*'adf.widget.mongodb',*/
    'wt.responsive', 'ngAnimate', 'smart-table', 'ui.bootstrap', 'ui.bootstrap.modal', "ui.bootstrap.datepicker", 'ui.bootstrap.datetimepicker', 'googlechart',
    'app.directives',
     'app.nav', 'app.controllers', 'app.localization', 'app.webitel',  'app.modules', 'ngTagsInput', 'app.notifier', 'angular-confirm', 'app.domain', 'angularFileUpload', 'multi-select']);
  
  var routes = ['dashboard', 'pages/404', 'pages/500', 'pages/lock-screen', 'pages/profile', 'pages/blank', 
    'pages/signin', 'pages/init', 'home'
    ];

  app.config(['$routeProvider', 'MODULES', function ($routeProvider, MODULES) {

    var setRoutes = function(route) {
      var config, url;
      url = '/' + route;
      config = {
        templateUrl: 'views/' + route + '.html'
      };
      $routeProvider.when(url, config);
      return $routeProvider;
    };
    routes.forEach(function(route) {
      return setRoutes(route);
    });

    angular.forEach(MODULES, function(value, key){
      if (value.disable) return;
      $routeProvider.when(value.href.replace(/#/, ''), 
        angularAMD.route({
          templateUrl: value.templateUrl, 
          controller: value.controller,
          controllerUrl: value.controllerUrl,
          reloadOnSearch: value.reloadOnSearch || false
        })
      );

      angular.forEach(value.routes, function(route) {

        var conf = angularAMD.route({
          templateUrl: route.templateUrl, 
          controller: route.controller,
          controllerUrl: route.controllerUrl,
          reloadOnSearch: route.reloadOnSearch || false
        });

        conf.method = route.method;
        $routeProvider.when(route.href, conf);
      })
    });


     return $routeProvider.when('/', {
        redirectTo: '/home'
      }).when('/404', {
        templateUrl: 'views/pages/404.html'
      }).otherwise({
        redirectTo: '/404'
      });
  }])
  .config(['$localStorageProvider',
    function ($localStorageProvider) {
        $localStorageProvider.setKeyPrefix('webitel_ui_');
    }])
  .run(run);

  run.$inject = ['$rootScope', '$location', '$http', 'webitel', '$localStorage', 'notifi', 'editableOptions'];
  function run($rootScope, $location, $http, webitel, $localStorage, notifi, editableOptions) {
      editableOptions.theme = 'bs3';
      var webitelSession = $localStorage.$default({
        "login": "root",
        "server": $location.protocol() + '://' + $location.host() + '/engine',
        "key": "",
        "token": ""
      });
      var _initPath = $location.__initPath = $location.$$path;

      if (!!webitelSession.key && !!webitelSession.token) {
        $location.path('pages/init');
        webitel.signin(webitelSession, function(err) {
          if (err) {
            notifi.error(err, 10000);
            return $location.path('/');
          };

          return $location.path(_initPath);
        })
      };

      $rootScope.$on('$locationChangeStart', function (event, next, current) {
        if (!webitel.connected() && !~next.indexOf('pages/init'))
          $location.path('pages/signin');
      });
  }
  
  return angularAMD.bootstrap(app);
});