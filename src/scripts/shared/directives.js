define(['angular'],
    function (angular) {
  'use strict';

  var uniqueItems = function (data, key) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
      var value = data[i][key];
      if (result.indexOf(value) == -1) {
        result.push(value);
      }
    }
    return result;
  };
  angular.module('app.directives', []).directive('imgHolder', [
    function() {
      return {
        restrict: 'A',
        link: function(scope, ele, attrs) {
          return Holder.run({
            images: ele[0]
          });
        }
      };
    }
  ]).directive('customPage', function() {
    return {
      restrict: "A",
      controller: [
        '$scope', '$element', '$location', function($scope, $element, $location) {
          var addBg, path;
          path = function() {
            return $location.path();
          };
          addBg = function(path) {
            $element.removeClass('body-wide body-lock');
            switch (path) {
              case '/404':
              case '/pages/404':
              case '/pages/500':
              case '/pages/signin':
              case '/pages/signup':
              case '/pages/forgot-password':
              case '/pages/init':
                return $element.addClass('body-wide');
              case '/pages/lock-screen':
                return $element.addClass('body-wide body-lock');
            }
          };
          addBg($location.path());
          return $scope.$watch(path, function(newVal, oldVal) {
            if (newVal === oldVal) {
              return;
            }
            return addBg($location.path());
          });
        }
      ]
    };
  }).directive('uiColorSwitch', [
    function() {
      return {
        restrict: 'A',
        link: function(scope, ele, attrs) {
          return ele.find('.color-option').on('click', function(event) {
            var $this, hrefUrl, style;
            $this = $(this);
            hrefUrl = void 0;
            style = $this.data('style');
            if (style === 'loulou') {
              hrefUrl = 'styles/main.css';
              $('link[href^="styles/main"]').attr('href', hrefUrl);
            } else if (style) {
              style = '-' + style;
              hrefUrl = 'styles/main' + style + '.css';
              $('link[href^="styles/main"]').attr('href', hrefUrl);
            } else {
              return false;
            }
            return event.preventDefault();
          });
        }
      };
    }
  ]).directive('goBack', [
    function() {
      return {
        restrict: "A",
        controller: [
          '$scope', '$element', '$window', function($scope, $element, $window) {
            return $element.on('click', function() {
              return $window.history.back();
            });
          }
        ]
      };
    }
  ]).directive('uiTime', [
    function() {
      return {
        restrict: 'A',
        link: function(scope, ele) {
          var checkTime, startTime;
          startTime = function() {
            var h, m, s, t, time, today;
            today = new Date();
            h = today.getHours();
            m = today.getMinutes();
            s = today.getSeconds();
            m = checkTime(m);
            s = checkTime(s);
            time = h + ":" + m + ":" + s;
            ele.html(time);
            return t = setTimeout(startTime, 500);
          };
          checkTime = function(i) {
            if (i < 10) {
              i = "0" + i;
            }
            return i;
          };
          return startTime();
        }
      };
    }
  ]).directive('uiNotCloseOnClick', [
    function() {
      return {
        restrict: 'A',
        compile: function(ele, attrs) {
          return ele.on('click', function(event) {
            return event.stopPropagation();
          });
        }
      };
    }
  ]).directive('slimScroll', [
    function() {
      return {
        restrict: 'A',
        link: function(scope, ele, attrs) {
          return ele.slimScroll({
            height: attrs.scrollHeight || '100%'
          });
        }
      };
    }
  ]).directive( 'editInPlace', function() {
    return {
      restrict: 'E',
      scope: { value: '=' },
      template: '<span ng-click="edit()" ng-bind="value"></span><input ng-model="value"/>',
      link: function ( $scope, element, attrs ) {
        // Let's get a reference to the input element, as we'll want to reference it.
        var inputElement = angular.element( element.children()[1] );

        // This directive should have a set class so we can style it.
        element.addClass( 'edit-in-place' );

        // Initially, we're not editing.
        $scope.editing = false;

        // ng-click handler to activate edit-in-place
        $scope.edit = function () {
          $scope.editing = true;

          // We control display through a class on the directive itself. See the CSS.
          element.addClass( 'active' );

          // And we must focus the element.
          // `angular.element()` provides a chainable array, like jQuery so to access a native DOM function,
          // we have to reference the first element in the array.
          inputElement[0].focus();
        };

        // When we leave the input, we're done editing.
        inputElement.prop( 'onblur', function() {
          $scope.editing = false;
          element.removeClass( 'active' );
        });
      }
    };
  })
  .directive('autoScroll', function ($document, $timeout, $location) {
      return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            
              scope.okSaveScroll = true;

              scope.scrollPos = {};

              $document.bind('scroll', function () {

                // TODO move DOWN!!!
                  if ($(window).scrollTop() > 100) {
                    $('.scrollToTop').fadeIn();
                  } else {
                    $('.scrollToTop').fadeOut();
                  };

                  if (scope.okSaveScroll) {
                      scope.scrollPos[$location.path()] = $(window).scrollTop();
                  }
              });

              scope.scrollClear = function (path) {
                  scope.scrollPos[path] = 0;
              };

              scope.$on('$locationChangeSuccess', function (route) {
                  $timeout(function () {
                      $(window).scrollTop(scope.scrollPos[$location.path()] ? scope.scrollPos[$location.path()] : 0);
                      scope.okSaveScroll = true;
                  }, 500);
              });

              scope.$on('$locationChangeStart', function (event) {
                  scope.okSaveScroll = false;
              });
          }
      };
  })
  .directive( 'webitelVariables', function() {
    return {
      restrict: 'E',
      scope: { collection: '=', dictionary: '=', remvar: '=', onSave: '=onSave', onReload: '=onReload', disableAction: "=disableAction" },
      templateUrl: 'views/templates/variables.html',
      link: function ( $scope, element, attrs ) {
        if (!$scope.remvar)
          $scope.remvar = [];

        if (!$scope.collection)
          $scope.collection = [];

        $scope.editingData = {};
        $scope.add = function () {
          $scope.editingData[$scope.collection.push({key: "", value: "", _new: true}) - 1] = true;
        };


        $scope.edit = function (key, row) {
          $scope.editingData[key] = true;
        };
        $scope.save = function (key, row) {
          if (!row.value)
            return $scope.remove(key, row);

          $scope.editingData[key] = false;
        };

        function remove (key, row) {
          if (row.key)
            $scope.remvar.push(row.key);
          $scope.collection.splice(key, 1);
        }
        
        $scope.remove = function (key, row) {
          remove(key, row)
        };

        // if (!$scope.dictionary)
        // $scope.dictionary = [];
      }
    };
  })
  .directive('scrollOnClick', function() {
    return {
      restrict: 'A',
      link: function(scope, $elm, attrs) {
        $elm.on('click', function(event) {
          event.preventDefault();
          $('html, body').animate({ scrollTop: 0 }, 'slow');
          return false;
        });
      }
    }
  })
  .directive('searchWatchModel',function(){
    return {
      require:'^stTable',
      //scope:{
      //  searchWatchModel:'='
      //},
      link:function(scope, ele, attr, ctrl){
        scope.$watch(attr.searchWatchModel,function(val){
          ctrl.search(val);
        });
      }
    };
  })

  .directive('infiniteScroll',  [
    '$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {
      return {
        require: 'stTable',
        link: function(scope, elem, attrs, ctrl) {
          var checkWhenEnabled, handler, scrollDistance, scrollEnabled;

          var pagination = ctrl.tableState().pagination;
          var itemByPage = 40;

          $window = angular.element($window);
          scrollDistance = 0;
          if (attrs.infiniteScrollDistance != null) {
            scope.$watch(attrs.infiniteScrollDistance, function(value) {
              return scrollDistance = parseInt(value, 10);
            });
          }
          scrollEnabled = true;
          checkWhenEnabled = false;
          if (attrs.infiniteScrollDisabled != null) {
            scope.$watch(attrs.infiniteScrollDisabled, function(value) {
              scrollEnabled = !value;
              if (scrollEnabled && checkWhenEnabled) {
                checkWhenEnabled = false;
                return handler();
              }
            });
          }
          handler = function() {
            var elementBottom, remaining, shouldScroll, windowBottom;
            windowBottom = $window.height() + $window.scrollTop();
            elementBottom = elem.offset().top + elem.height();
            remaining = elementBottom - windowBottom;
            shouldScroll = remaining <= $window.height() * scrollDistance;
            if (shouldScroll && scrollEnabled) {
              ctrl.slice(pagination.start + itemByPage, itemByPage);
              if ($rootScope.$$phase) {

                return scope.$eval(attrs.infiniteScroll);
              } else {
                return scope.$apply(attrs.infiniteScroll);
              }
            } else if (shouldScroll) {
              return checkWhenEnabled = true;
            }
          };
          $window.on('scroll', handler);
          scope.$on('$destroy', function() {
            return $window.off('scroll', handler);
          });
        }
      };
    }
  ])
  .directive('webitelAudio', function () {
        return {
          restrict: 'AE',
          scope: { setSource: '=', onClose: "=" },
          templateUrl: '/views/templates/player.html',
          link: function ( $scope, element, attrs ) {
            
          },

          controller: function ($scope, $sce, $timeout) {
            var controller = $scope;
            controller.API = null;
            controller.show = false;
            controller.text = '';

            controller.setSource = function (source, autoPlay) {
              controller.show = true;
              controller.API.stop();
              controller.API.config.autoHideTime = 3000;
              controller.API.config.autoHide = true;

              controller.config.sources.length = 0;
              controller.config.sources = [{
                src: $sce.trustAsResourceUrl(encodeURI(source.src)),
                type: source.type
              }];
              controller.text = source.text || "";
              if (autoPlay)
                $timeout(controller.API.play.bind(controller.API), 100);
            };
            
            controller.onError = function (err) {
              if (err)
                controller.text = 'ERROR: ' + controller.text;
            };

            controller.onComplete = function () {
              controller.close()
            };

            controller.close = function () {
              controller.API.stop();
              controller.show = false;
              if (typeof controller.onClose == 'function')
                controller.onClose(controller.config.sources);
            };

            controller.onPlayerReady = function(API) {
              controller.API = API;
              controller.API.config = controller.config
            };

            controller.config = {
              sources: [
                //{src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/audios/videogular.mp3"), type: "audio/mpeg"},
                //{src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/audios/videogular.ogg"), type: "audio/ogg"}
              ],
              autoHide: true,
              autoHideTime: 3000,
              theme: {
                url: "styles/videogular.css"
              }
            };
          }
        };
  })

  .filter('groupBy',
    function () {
      return function (collection, key) {
        if (collection === null) return;
        return uniqueItems(collection, key);
      };
    });
});