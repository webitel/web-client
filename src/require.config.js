require.config({
  baseUrl: './',
  paths: {
  	'app': 'scripts/app',
    'jquery': 'bower_components/jquery/dist/jquery.min',
    'angularAMD': 'bower_components/angularAMD/angularAMD.min',
    'angular': 'bower_components/angular/angular.min',
    'angular-route': 'bower_components/angular-route/angular-route.min',
    'angular-bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls.min',
    'bootstrap-slider': 'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min',
    'jquery-slimscroll': 'bower_components/jquery.slimscroll/jquery.slimscroll.min',
    'angular-animate': 'bower_components/angular-animate/angular-animate.min',
    'angular-storage': 'bower_components/ngstorage/ngStorage.min',
    'angular-notifier': 'bower_components/angular-notifier/dist/angular-notifier.min',
    'webitel-library': 'scripts/webitel/webitelLib',
    'angular-confirm': 'bower_components/angular-confirm/angular-confirm',
    'smTable': 'bower_components/smart-table/dist/smart-table',
    'jquery-spinner': 'bower_components/jquery-spinner/dist/jquery.spinner.min',
    'nav-tree': 'bower_components/angular-bootstrap-nav-tree/dist/abn_tree_directive',
    'angular-ui-notification': 'bower_components/angular-ui-notification/dist/angular-ui-notification.min',
    'file-upload': 'bower_components/angular-file-upload/dist/angular-file-upload.min',
    'file-input': 'bower_components/bootstrap-file-input/bootstrap.file-input',
    'responsive-table': 'bower_components/angular-responsive-tables/release/angular-responsive-tables.min',
    'multi-select': 'bower_components/angular-multi-select/angular-multi-select.min',
    'async': 'bower_components/asyn/dist/async.min',
    'ace': 'bower_components/ace-builds/src-min-noconflict/ace',
    'ext-language_tools': 'bower_components/ace-builds/src-min-noconflict/ext-language_tools',
    'ui-ace': 'bower_components/angular-ui-ace/ui-ace',
    'tags-input': 'bower_components/ng-tags-input/ng-tags-input.min',
    'angular-clipboard': 'bower_components/angular-clipboard/angular-clipboard',

    'angular-sanitize': 'bower_components/angular-sanitize/angular-sanitize.min',
    'videogular': 'bower_components/videogular/videogular.min',
    'videogular-controls': 'bower_components/videogular-controls/vg-controls.min',
    'videogular-overlay-play': 'bower_components/videogular-overlay-play/vg-overlay-play.min',
    'videogular-buffering': 'bower_components/videogular-buffering/vg-buffering.min',
    'datetime-picker': 'bower_components/bootstrap-ui-datetime-picker/dist/datetime-picker',
    'xeditable': 'bower_components/angular-xeditable/js/xeditable.min',

    'google-chart': 'bower_components/angular-google-chart/ng-google-chart.min',
    // TODO ijector
    'dashboard': 'bower_components/angular-dashboard-framework/dist/angular-dashboard-framework',
    'sortable': 'bower_components/Sortable/Sortable.min',
    'widget-iframe': 'modules/dashboard/widget/iframe/dist/adf-widget-iframe',
    'widget-base': 'modules/dashboard/widget/structures-base/dist/adf-structures-base.min',
    'widget-link': 'modules/dashboard/widget/linklist/dist/adf-widget-linklist.min',
    'widget-markdown': 'modules/dashboard/widget/markdown/dist/adf-widget-markdown.min',
    'angular-markdown': 'bower_components/angular-markdown-directive/markdown',
    'widget-mongodb': 'modules/dashboard/widget/mongodb/mongodb',
    'showdown': 'bower_components/showdown/compressed/Showdown.min',

    // TODO
    'jquery-builder': 'modules/cdr/libs/jquery-builder/query-builder.standalone',
    'moment': 'modules/cdr/libs/jquery-builder/moment.min',
    'extendext': 'modules/cdr/libs/jquery-builder/jquery.extendext.min',
    'doT': 'modules/cdr/libs/jquery-builder/doT',
    'bootstrap-datepicker': 'modules/cdr/libs/bootstrap/bootstrap-datepicker.min',
    'bootstrap-select': 'modules/cdr/libs/bootstrap/bootstrap-select.min',
    'bootstrap-selectize': 'modules/cdr/libs/bootstrap/selectize.min',

    'ui-select': 'bower_components/ui-select/dist/select.min'
    // END TODO

    //new dash
    //'gridster': 'modules/dashboard2/angular-gridster/dist/angular-gridster.min'
  },

  shim: {
    angular: {
      deps: ['jquery'],
      exports: 'angular'
    },

    'ui-select': {
      deps: ['angular', 'css!bower_components/ui-select/dist/select.min.css']
    },
    //TODO
    //'gridster': ['angular', 'css!modules/dashboard2/angular-gridster/dist/angular-gridster.min.css'],
    'xeditable': ['angular', 'css!bower_components/angular-xeditable/css/xeditable.min.css'],

    'jquery-builder': ['jquery', 'extendext', 'moment', 'doT', 'bootstrap-select', 'bootstrap-slider', 'bootstrap-selectize'],
    'sortable': ['jquery'],
    'angular-clipboard': ['angular'],
    'angular-sanitize': ['angular'],
    'videogular': ['angular', 'angular-sanitize', 'videogular-controls', 'videogular-overlay-play', 'videogular-buffering'],
    'videogular-controls': ['angular'],
    'videogular-overlay-play': ['angular'],
    'videogular-buffering': ['angular'],
    'datetime-picker': ['angular', 'angular-bootstrap'],

    'angular-markdown': ['angular', 'showdown'],
    'widget-link': ['angular', 'dashboard'],
    'widget-mongodb': ['angular', 'dashboard'],
    'widget-markdown': ['angular', 'dashboard', 'angular-markdown'],
    'widget-iframe': ['angular', 'dashboard', 'css!modules/dashboard/widget/iframe/dist/adf-widget-iframe.css'],
    'widget-base': ['angular', 'dashboard'],
    'dashboard': ['angular', 'sortable', 'css!bower_components/angular-dashboard-framework/dist/angular-dashboard-framework.min.css'],
    'tags-input': ['angular'],
    'google-chart': ['angular'],
    'ui-ace': ['angular', 'ace'],
    'ext-language_tools': ['ace'],
    'multi-select': ['angular', 'css!bower_components/angular-multi-select/angular-multi-select.css'],
    'responsive-table': ['angular', 'css!bower_components/angular-responsive-tables/release/angular-responsive-tables.min.css'],
    'file-upload': ['angular'],
    'file-input': ['angular-bootstrap'],
    'angular-ui-notification': ['angular', 'css!bower_components/angular-ui-notification/dist/angular-ui-notification.min.css'],
    'nav-tree': ['angular', 'css!bower_components/angular-bootstrap-nav-tree/dist/abn_tree.css'],
    'jquery-spinner': ['jquery'],
    'smTable': ['angular'],
    'jquery-slimscroll': ['jquery'],
    'angular-notifier': ['angular'],
    'angularAMD': ['angular'],
    'angular-confirm': ['angular'],
    'angular-route': ['angular'],
    'angular-bootstrap': ['angular'],
    'bootstrap-slider': ['angular'],
    'angular-animate': ['angular'],
    'angular-storage': ['angular'],
    'webitel-library': ['jquery'],
  },
  deps: ['app'],
  map: {
    '*': {
      'css': 'bower_components/require-css/css.min' // or whatever the path to require-css is
    }
  },
  waitSeconds: 60
});