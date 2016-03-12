define(['angular', 'config', 'scripts/shared/notifier', 'scripts/modules'], function (angular, config) {
  	angular.module('app.controllers', ['app.notifier', 'app.modules'])
	  	.controller('AppCtrl', ['$scope', '$rootScope', '$localStorage', 'webitel', 'MODULES', '$location', '$anchorScroll',
			function($scope, $rootScope, $localStorage, webitel, MODULES, $location, $anchorScroll) {
	  	  var $window;
			$scope.modules = [];
			webitel.onConnect.then(function (session) {
				$scope.main.roleName = session.roleName;
				$scope.main.name = session.username;
				$scope.main.acl = session.acl;
				$scope.admin.domain = session.domain;

				var modules = [];
				angular.forEach(MODULES, function (item) {
					if ((session.checkResource(item.acl, 'r') || session.checkResource(item.acl, 'ro')) && !item.hide) {
						if ($location.__initPath.indexOf(item.href.substr(1)) === 0)
							item.class = 'active'
							;
						item.visible = true;
						if (item.routes) {
							angular.forEach(item.routes, function(link) {
								link.list = session.checkResource(link.acl, 'r')
							})
						};
						modules.push(item);
					}
				});

				console.debug('init modules: ', modules);
				$scope.modules = modules;
			});
			
	      $window = $(window);
	      $scope.main = {
	        brand: 'Webitel',
		    licenseManager: config.licenseManager,
	        name: '',
	        roleName: '',
	        acl: {}
	      };
	      $scope.pageTransitionOpts = [
	        {
	          name: 'Scale up',
	          "class": 'ainmate-scale-up'
	        }, {
	          name: 'Fade up',
	          "class": 'animate-fade-up'
	        }, {
	          name: 'Slide in from right',
	          "class": 'ainmate-slide-in-right'
	        }, {
				  name: 'Flip Y',
				  "class": 'animate-flip-y'
			  }
	      ];
	      $scope.admin = {
	        layout:  $localStorage.layout || "boxed",
	        menu: $localStorage.menu || "horizontal",
	        fixedHeader: typeof $localStorage.fixedHeader == "undefined" ? true : !!$localStorage.fixedHeader,
	        fixedSidebar: typeof $localStorage.fixedSidebar == "undefined" ? true : !!$localStorage.fixedSidebar,
			  //TODO
	        pageTransition: $scope.pageTransitionOpts[0]
	      };

			$scope.scrollToTop = function () {
				debugger
			}
	      $scope.$watch('admin', function(newVal, oldVal) {
			  $localStorage.layout = newVal.layout;
			  $localStorage.menu = newVal.menu;
			  $localStorage.fixedHeader = newVal.fixedHeader;
			  $localStorage.fixedSidebar = newVal.fixedSidebar;
			  if (newVal.pageTransition)
			  	$localStorage.pageTransition = newVal.pageTransition;

	        if (newVal.menu === 'horizontal' && oldVal.menu === 'vertical') {
	          $rootScope.$broadcast('nav:reset');
	          return;
	        }
	        if (newVal.fixedHeader === false && newVal.fixedSidebar === true) {
	          if (oldVal.fixedHeader === false && oldVal.fixedSidebar === false) {
	            $scope.admin.fixedHeader = true;
	            $scope.admin.fixedSidebar = true;
	          }
	          if (oldVal.fixedHeader === true && oldVal.fixedSidebar === true) {
	            $scope.admin.fixedHeader = false;
	            $scope.admin.fixedSidebar = false;
	          }
	          return;
	        }
	        if (newVal.fixedSidebar === true) {
	          $scope.admin.fixedHeader = true;
	        }
	        if (newVal.fixedHeader === false) {
	          $scope.admin.fixedSidebar = false;
	        }
	      }, true);

	  	}])
		.controller('SigninCtrl', ['$scope', 'webitel', '$localStorage', '$location', 'notifi',
		 function ($scope, webitel, $localStorage, $location, notifi) {
			 webitel.destroyLocalSession();
			var _ = $localStorage;

			$scope.login = _.login;
			$scope.server = _.server;

			$scope.signin = function () {
				webitel.signin({
					"login": $scope.login,
					"server": $scope.server,
					"password": $scope.password
				}, function(err) {
					$scope.password = '';
					if (err) {
						return notifi.error(err, 5000)
					}
					$location.path('/');
				})
			}
		}])
	  	.controller('HeaderCtrl', ['$scope', 'webitel', '$location', '$element', '$route', function($scope, webitel, $location, $element, $route) {
	  		$scope.signout = function () {
	  			webitel.signout(function () {
					window.location.href = "/"
	  			});
	  		};
	  	}])
	  	.controller('NavDomainsCtrl', ['$scope', 'webitel', 'DomainModel', '$timeout',
	  		function($scope, webitel, DomainModel, $timeout) {
	  		$scope.changeDomains = function () {
				webitel.changeDomains();
			};

			$scope.searchText = '';
			$scope.selectedDomain = null;// 'Select domain...';
				
			$scope.$watch('selectedDomain', function (newVal) {
				if (!newVal)
					return $scope.selectedDomain = 'Select domain...';
				return $scope.selectedDomain = newVal;
			});

			$timeout(function() {
				$scope.selectedDomain = webitel.domain() || $scope.selectedDomain ;
			}, 0);

			$scope.domainsList = [];
			$scope.selectDomain = function (domain) {
				$scope.selectedDomain = domain.name;
				webitel.changeDomain(domain)
			};

			$scope.showDomains = function() {
				DomainModel.list(function(err, res) {
					if (err) {
						//TODO notif
						alert(err)
					};

					$scope.domainsList = [{name: "", id: "All domains"}].concat(res);
				})
			}
	  	}])
		.controller('NavContainerCtrl', ['$scope', function($scope) {
			
		}])
		// TODO, delete ???
		.controller('NavCtrl', [
	    '$scope', '$rootScope', 'MODULES', '$location', 'webitel', function($scope, $rootScope, MODULES, $location, webitel) {
			console.debug('subscribe -> session:create');
			webitel.onConnect.then(function (session) {
				var modules = [];
				angular.forEach(MODULES, function (item) {
					if (session.checkResource(item.acl, 'r') && !item.hide) {
						if ($location.__initPath.indexOf(item.href.substr(1)) === 0)
							item.class = 'active'
							;
						item.visible = true;	
						if (item.routes) {
							angular.forEach(item.routes, function(link) {
								link.list = session.checkResource(link.acl, 'r')
							})
						};
						modules.push(item);
					}
				});
				// TODO  иногда не отображаються модули, походу вебител быстро соединяеться.
				console.debug('init modules: ', modules);
				$scope.modules = modules;
			});
			$scope.modules = MODULES;

	    }])
	    .controller('DashboardCtrl', ['$scope', function($scope) {}])
		.controller('HomeCtrl', ['$scope', 'webitel', function ($scope, webitel) {
			webitel.onConnect.then(function (session) {
				debugger
			})
		}]);
})	