define(['angular'], function  (angular) {

  var dateLocaleFormats = {
        "ar-sa": "dd/MM/yy",
        "bg-bg": "dd.M.yyyy",
        "ca-es": "dd/MM/yyyy",
        "zh-tw": "yyyy/M/d",
        "cs-cz": "d.M.yyyy",
        "da-dk": "dd-MM-yyyy",
        "de-de": "dd.MM.yyyy",
        "el-gr": "d/M/yyyy",
        "en-us": "M/d/yyyy",
        "fi-fi": "d.M.yyyy",
        "fr-fr": "dd/MM/yyyy",
        "he-il": "dd/MM/yyyy",
        "hu-hu": "yyyy. MM. dd.",
        "is-is": "d.M.yyyy",
        "it-it": "dd/MM/yyyy",
        "ja-jp": "yyyy/MM/dd",
        "ko-kr": "yyyy-MM-dd",
        "nl-nl": "d-M-yyyy",
        "nb-no": "dd.MM.yyyy",
        "pl-pl": "yyyy-MM-dd",
        "pt-br": "d/M/yyyy",
        "ro-ro": "dd.MM.yyyy",
        "ru-ru": "dd.MM.yyyy",
        "hr-hr": "d.M.yyyy",
        "sk-sk": "d. M. yyyy",
        "sq-al": "yyyy-MM-dd",
        "sv-se": "yyyy-MM-dd",
        "th-th": "d/M/yyyy",
        "tr-tr": "dd.MM.yyyy",
        "ur-pk": "dd/MM/yyyy",
        "id-id": "dd/MM/yyyy",
        "uk-ua": "dd.MM.yyyy",
        "be-by": "dd.MM.yyyy",
        "sl-si": "d.M.yyyy",
        "et-ee": "d.MM.yyyy",
        "lv-lv": "yyyy.MM.dd.",
        "lt-lt": "yyyy.MM.dd",
        "fa-ir": "MM/dd/yyyy",
        "vi-vn": "dd/MM/yyyy",
        "hy-am": "dd.MM.yyyy",
        "az-latn-az": "dd.MM.yyyy",
        "eu-es": "yyyy/MM/dd",
        "mk-mk": "dd.MM.yyyy",
        "af-za": "yyyy/MM/dd",
        "ka-ge": "dd.MM.yyyy",
        "fo-fo": "dd-MM-yyyy",
        "hi-in": "dd-MM-yyyy",
        "ms-my": "dd/MM/yyyy",
        "kk-kz": "dd.MM.yyyy",
        "ky-kg": "dd.MM.yy",
        "sw-ke": "M/d/yyyy",
        "uz-latn-uz": "dd/MM yyyy",
        "tt-ru": "dd.MM.yyyy",
        "pa-in": "dd-MM-yy",
        "gu-in": "dd-MM-yy",
        "ta-in": "dd-MM-yyyy",
        "te-in": "dd-MM-yy",
        "kn-in": "dd-MM-yy",
        "mr-in": "dd-MM-yyyy",
        "sa-in": "dd-MM-yyyy",
        "mn-mn": "yy.MM.dd",
        "gl-es": "dd/MM/yy",
        "kok-in": "dd-MM-yyyy",
        "syr-sy": "dd/MM/yyyy",
        "dv-mv": "dd/MM/yy",
        "ar-iq": "dd/MM/yyyy",
        "zh-cn": "yyyy/M/d",
        "de-ch": "dd.MM.yyyy",
        "en-gb": "dd/MM/yyyy",
        "es-mx": "dd/MM/yyyy",
        "fr-be": "d/MM/yyyy",
        "it-ch": "dd.MM.yyyy",
        "nl-be": "d/MM/yyyy",
        "nn-no": "dd.MM.yyyy",
        "pt-pt": "dd-MM-yyyy",
        "sr-latn-cs": "d.M.yyyy",
        "sv-fi": "d.M.yyyy",
        "az-cyrl-az": "dd.MM.yyyy",
        "ms-bn": "dd/MM/yyyy",
        "uz-cyrl-uz": "dd.MM.yyyy",
        "ar-eg": "dd/MM/yyyy",
        "zh-hk": "d/M/yyyy",
        "de-at": "dd.MM.yyyy",
        "en-au": "d/MM/yyyy",
        "es-es": "dd/MM/yyyy",
        "fr-ca": "yyyy-MM-dd",
        "sr-cyrl-cs": "d.M.yyyy",
        "ar-ly": "dd/MM/yyyy",
        "zh-sg": "d/M/yyyy",
        "de-lu": "dd.MM.yyyy",
        "en-ca": "dd/MM/yyyy",
        "es-gt": "dd/MM/yyyy",
        "fr-ch": "dd.MM.yyyy",
        "ar-dz": "dd-MM-yyyy",
        "zh-mo": "d/M/yyyy",
        "de-li": "dd.MM.yyyy",
        "en-nz": "d/MM/yyyy",
        "es-cr": "dd/MM/yyyy",
        "fr-lu": "dd/MM/yyyy",
        "ar-ma": "dd-MM-yyyy",
        "en-ie": "dd/MM/yyyy",
        "es-pa": "MM/dd/yyyy",
        "fr-mc": "dd/MM/yyyy",
        "ar-tn": "dd-MM-yyyy",
        "en-za": "yyyy/MM/dd",
        "es-do": "dd/MM/yyyy",
        "ar-om": "dd/MM/yyyy",
        "en-jm": "dd/MM/yyyy",
        "es-ve": "dd/MM/yyyy",
        "ar-ye": "dd/MM/yyyy",
        "en-029": "MM/dd/yyyy",
        "es-co": "dd/MM/yyyy",
        "ar-sy": "dd/MM/yyyy",
        "en-bz": "dd/MM/yyyy",
        "es-pe": "dd/MM/yyyy",
        "ar-jo": "dd/MM/yyyy",
        "en-tt": "dd/MM/yyyy",
        "es-ar": "dd/MM/yyyy",
        "ar-lb": "dd/MM/yyyy",
        "en-zw": "M/d/yyyy",
        "es-ec": "dd/MM/yyyy",
        "ar-kw": "dd/MM/yyyy",
        "en-ph": "M/d/yyyy",
        "es-cl": "dd-MM-yyyy",
        "ar-ae": "dd/MM/yyyy",
        "es-uy": "dd/MM/yyyy",
        "ar-bh": "dd/MM/yyyy",
        "es-py": "dd/MM/yyyy",
        "ar-qa": "dd/MM/yyyy",
        "es-bo": "dd/MM/yyyy",
        "es-sv": "dd/MM/yyyy",
        "es-hn": "dd/MM/yyyy",
        "es-ni": "dd/MM/yyyy",
        "es-pr": "dd/MM/yyyy",
        "am-et": "d/M/yyyy",
        "tzm-latn-dz": "dd-MM-yyyy",
        "iu-latn-ca": "d/MM/yyyy",
        "sma-no": "dd.MM.yyyy",
        "mn-mong-cn": "yyyy/M/d",
        "gd-gb": "dd/MM/yyyy",
        "en-my": "d/M/yyyy",
        "prs-af": "dd/MM/yy",
        "bn-bd": "dd-MM-yy",
        "wo-sn": "dd/MM/yyyy",
        "rw-rw": "M/d/yyyy",
        "qut-gt": "dd/MM/yyyy",
        "sah-ru": "MM.dd.yyyy",
        "gsw-fr": "dd/MM/yyyy",
        "co-fr": "dd/MM/yyyy",
        "oc-fr": "dd/MM/yyyy",
        "mi-nz": "dd/MM/yyyy",
        "ga-ie": "dd/MM/yyyy",
        "se-se": "yyyy-MM-dd",
        "br-fr": "dd/MM/yyyy",
        "smn-fi": "d.M.yyyy",
        "moh-ca": "M/d/yyyy",
        "arn-cl": "dd-MM-yyyy",
        "ii-cn": "yyyy/M/d",
        "dsb-de": "d. M. yyyy",
        "ig-ng": "d/M/yyyy",
        "kl-gl": "dd-MM-yyyy",
        "lb-lu": "dd/MM/yyyy",
        "ba-ru": "dd.MM.yy",
        "nso-za": "yyyy/MM/dd",
        "quz-bo": "dd/MM/yyyy",
        "yo-ng": "d/M/yyyy",
        "ha-latn-ng": "d/M/yyyy",
        "fil-ph": "M/d/yyyy",
        "ps-af": "dd/MM/yy",
        "fy-nl": "d-M-yyyy",
        "ne-np": "M/d/yyyy",
        "se-no": "dd.MM.yyyy",
        "iu-cans-ca": "d/M/yyyy",
        "sr-latn-rs": "d.M.yyyy",
        "si-lk": "yyyy-MM-dd",
        "sr-cyrl-rs": "d.M.yyyy",
        "lo-la": "dd/MM/yyyy",
        "km-kh": "yyyy-MM-dd",
        "cy-gb": "dd/MM/yyyy",
        "bo-cn": "yyyy/M/d",
        "sms-fi": "d.M.yyyy",
        "as-in": "dd-MM-yyyy",
        "ml-in": "dd-MM-yy",
        "en-in": "dd-MM-yyyy",
        "or-in": "dd-MM-yy",
        "bn-in": "dd-MM-yy",
        "tk-tm": "dd.MM.yy",
        "bs-latn-ba": "d.M.yyyy",
        "mt-mt": "dd/MM/yyyy",
        "sr-cyrl-me": "d.M.yyyy",
        "se-fi": "d.M.yyyy",
        "zu-za": "yyyy/MM/dd",
        "xh-za": "yyyy/MM/dd",
        "tn-za": "yyyy/MM/dd",
        "hsb-de": "d. M. yyyy",
        "bs-cyrl-ba": "d.M.yyyy",
        "tg-cyrl-tj": "dd.MM.yy",
        "sr-latn-ba": "d.M.yyyy",
        "smj-no": "dd.MM.yyyy",
        "rm-ch": "dd/MM/yyyy",
        "smj-se": "yyyy-MM-dd",
        "quz-ec": "dd/MM/yyyy",
        "quz-pe": "dd/MM/yyyy",
        "hr-ba": "d.M.yyyy.",
        "sr-latn-me": "d.M.yyyy",
        "sma-se": "yyyy-MM-dd",
        "en-sg": "d/M/yyyy",
        "ug-cn": "yyyy-M-d",
        "sr-cyrl-ba": "d.M.yyyy",
        "es-us": "M/d/yyyy"
};

  angular.module('app.localization', []).factory('localize', [
    '$http', '$rootScope', '$window', function($http, $rootScope, $window) {
      var localize;
      localize = {
        language: '',
        url: void 0,
        resourceFileLoaded: false,
        successCallback: function(data) {
          localize.dictionary = data;
          localize.resourceFileLoaded = true;
          return $rootScope.$broadcast('localizeResourcesUpdated');
        },
        setLanguage: function(value) {
          localize.language = value.toLowerCase().split("-")[0];
          return localize.initLocalizedResources();
        },
        setUrl: function(value) {
          localize.url = value;
          return localize.initLocalizedResources();
        },
        buildUrl: function() {
          if (!localize.language) {
            localize.language = ($window.navigator.userLanguage || $window.navigator.language).toLowerCase();
            localize.language = localize.language.split("-")[0];
          }
          return 'i18n/resources-locale_' + localize.language + '.js';
        },
        initLocalizedResources: function() {
          var url;
          url = localize.url || localize.buildUrl();
          return $http({
            method: "GET",
            url: url,
            cache: false
          }).success(localize.successCallback).error(function() {
            return $rootScope.$broadcast('localizeResourcesUpdated');
          });
        },
        getLocalizedString: function(value) {
          var result, valueLowerCase;
          result = void 0;
          if (localize.dictionary && value) {
            valueLowerCase = value.toLowerCase();
            if (localize.dictionary[valueLowerCase] === '') {
              result = value;
            } else {
              result = localize.dictionary[valueLowerCase];
            }
          } else {
            result = value;
          }
          return result;
        }
      };
      return localize;
    }
  ]).directive('i18n', [
    'localize', function(localize) {
      var i18nDirective;
      i18nDirective = {
        restrict: "EA",
        updateText: function(ele, input, placeholder) {
          var result;
          result = void 0;
          if (input === 'i18n-placeholder') {
            result = localize.getLocalizedString(placeholder);
            return ele.attr('placeholder', result);
          } else if (input.length >= 1) {
            result = localize.getLocalizedString(input);
            return ele.text(result);
          }
        },
        link: function(scope, ele, attrs) {
          scope.$on('localizeResourcesUpdated', function() {
            return i18nDirective.updateText(ele, attrs.i18n, attrs.placeholder);
          });
          return attrs.$observe('i18n', function(value) {
            return i18nDirective.updateText(ele, value, attrs.placeholder);
          });
        }
      };
      return i18nDirective;
    }
  ]).controller('LangCtrl', [
    '$scope', 'localize', function($scope, localize) {
      $scope.lang = 'English';
      $scope.setLang = function(lang) {
        switch (lang) {
          case 'English':
            localize.setLanguage('EN-US');
            break;
          case 'Русский язык':
            localize.setLanguage('RU-RU');
            break;
          case 'Українська':
            localize.setLanguage('UA-UA');
            break;
        }
        return $scope.lang = lang;
      };
      return $scope.getFlag = function() {
        var lang;
        lang = $scope.lang;
        switch (lang) {
          case 'English':
            return 'flags-american';
          case 'Русский язык':
            return 'flags-russia';
          case 'Українська':
            return 'flags-ukraine';
        }
      };
    }
  ]).factory('dateLocalize', ['$locale', function ($locale) {
      return dateLocalize = {
          getLocaleDefaultDateFormat: function () {
              return (dateLocaleFormats[$locale.id] || 'en-us');
          },
          getLocaleDefaultDateTimeFormat: function () {
              return (dateLocalize.getLocaleDefaultDateFormat()) + " HH:mm";
          }

      }
  }]);
})