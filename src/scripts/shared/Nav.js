define(['angular'], function  (angular) {
  'use strict';
  angular.module('app.nav', []).directive('toggleNavCollapsedMin', [
    '$rootScope', '$localStorage', function($rootScope, $localStorage) {
      return {
        restrict: 'A',
        link: function(scope, ele, attrs) {
          var app;
          app = $('#app');
          if ($localStorage.navMin) {
            app.addClass('nav-collapsed-min');
          };

          return ele.on('click', function(e) {
            if (app.hasClass('nav-collapsed-min')) {
              app.removeClass('nav-collapsed-min');
            } else {
              app.addClass('nav-collapsed-min');
              $rootScope.$broadcast('nav:reset');
            }
            $localStorage.navMin = app.hasClass('nav-collapsed-min');
            return e.preventDefault();
          });
        }
      };
    }
  ]).directive('collapseNav', ['$timeout',
    function($timeout) {
      return {
        restrict: 'A',
       // controller: 'NavCtrl',
      //  template: '<li ng-repeat="(key, value) in modules" class="{{value.class}}">    <a href="{{value.href}}"><i class="{{value.iconClass}}"></i><span>{{value.caption}}</span></a>    <ul style="" ng-if="value.list">         <li  ng-repeat="(keyList, valueList) in value.routes">            <a href="{{valueList.href}}"><i class="fa fa-angle-right"></i><span data-i18n="">{{value.caption}}</span></a>        </li>    </ul>    <i ng-if="value.list" class="fa fa-angle-down icon-has-ul-h"></i>    <i ng-if="value.list" class="fa fa-angle-right icon-has-ul"></i></li>',
        link: function(scope, ele, attrs) {
          $timeout(function() {
            var $a, $aRest, $app, $lists, $listsRest, $nav, $window, Timer, prevWidth, updateClass;
            $window = $(window);
            $lists = ele.find('ul').parent('li');
            if ($lists.length < 1) return;

            $lists.append('<i class="fa fa-angle-down icon-has-ul-h"></i><i class="fa fa-angle-right icon-has-ul"></i>');
            $a = ele.children('a');
            $listsRest = ele.children('li').not($lists);
            $aRest = $listsRest.children('a');
            $app = $('#app');
            $nav = $('#nav-container');
            $a.on('click', function(event) {
              var $parent, $this;
              if ($app.hasClass('nav-collapsed-min') || ($nav.hasClass('nav-horizontal') && $window.width() >= 768)) {
                return false;
              }
              $this = $(this);
              $parent = $this.parent('li');
              $lists.not($parent).removeClass('open').find('ul').slideUp();
              $parent.toggleClass('open').find('ul').slideToggle();
              return event.preventDefault();
            });
            $aRest.on('click', function(event) {
              return $lists.removeClass('open').find('ul').slideUp();
            });
            scope.$on('nav:reset', function(event) {
              return $lists.removeClass('open').find('ul').slideUp();
            });
            Timer = void 0;
            prevWidth = $window.width();
            updateClass = function() {
              var currentWidth;
              currentWidth = $window.width();
              if (currentWidth < 768) {
                $app.removeClass('nav-collapsed-min');
              }
              if (prevWidth < 768 && currentWidth >= 768 && $nav.hasClass('nav-horizontal')) {
                $lists.removeClass('open').find('ul').slideUp();
              }
              return prevWidth = currentWidth;
            };
            return $window.resize(function() {
              var t;
              clearTimeout(t);
              return t = setTimeout(updateClass, 300);
            });
          });
        }
      };
    }
  ]).directive('highlightActive', [
    function() {
      return {
        restrict: "A",
        controller: [
          '$scope', '$element', '$attrs', '$location', function($scope, $element, $attrs, $location) {
            var highlightActive, links, path;
            links = $element.find('a');
            path = function() {
              return $location.path();
            };
            highlightActive = function(links, path) {
              path = '#' + path;
              return angular.forEach(links, function(link) {
                var $li, $link, href;
                $link = angular.element(link);
                $li = $link.parent('li');
                href = $link.attr('href');
                if ($li.hasClass('active')) {
                  $li.removeClass('active');
                }
                if (path.indexOf(href) === 0) {
                  return $li.addClass('active');
                }
              });
            };
            highlightActive(links, $location.path());
            return $scope.$watch(path, function(newVal, oldVal) {
              if (newVal === oldVal) {
                return;
              }
              links = $element.find('a');
              return highlightActive(links, $location.path());
            });
          }
        ]
      };
    }
  ]).directive('toggleOffCanvas', [
    function() {
      return {
        restrict: 'A',
        link: function(scope, ele, attrs) {
          return ele.on('click', function() {
            return $('#app').toggleClass('on-canvas');
          });
        }
      };
    }
  ]);

});