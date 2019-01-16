define(['angular', 'config', 'contributors', 'qrcode', 'scripts/shared/notifier', 'scripts/modules'], function (angular, config, contributors, qrcode) {
    angular.module('app.controllers', ['app.notifier', 'app.modules'])
        .controller('AppCtrl', ['$scope', '$rootScope', '$localStorage', 'webitel', 'MODULES', '$location', 'localize',
            function($scope, $rootScope, $localStorage, webitel, MODULES, $location, localize) {
                var $window;
                $scope.modules = [];
                webitel.onConnect.then(function (session) {
                    $scope.main.roleName = session.roleName;
                    $scope.main.name = session.username;
                    $scope.main.acl = session.acl;
                    $scope.admin.domain = session.domain;
                    localize.setLanguage('EN');

                    $scope.addHotLinks = [];
                    $scope.notifications = webitel.notify.getLink();
                    var modules = [];
                    $scope.main.viewLicense = session.checkResource('license', 'ro') || session.checkResource('license', 'r');
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

                            if (session.checkResource(item.acl, 'c') && item.routes) {
                                for (var i = 0; i < item.routes.length; i++) {
                                    if (item.routes[i].method === 'create') {
                                        $scope.addHotLinks.push({
                                            href: item.routes[i].href,
                                            caption: item.routes[i].caption || item.caption,
                                            isDomain: item.acl === 'domain',
                                            iconClass: item.routes[i].iconClass || item.iconClass
                                        })
                                    }
                                }
                            }

                            modules.push(item);
                        }
                    });

                    console.debug('init modules: ', modules);
                    $scope.modules = modules;

                });

                $scope.viewSpinner = true;
                $rootScope.setViewSpinner = function (val) {
                    $scope.viewSpinner = !!val;
                };

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
                    layout:  $localStorage.layout || "wide",
                    menu: $localStorage.menu || "vertical",
                    fixedHeader: typeof $localStorage.fixedHeader === "undefined" ? true : !!$localStorage.fixedHeader,
                    fixedSidebar: typeof $localStorage.fixedSidebar === "undefined" ? true : !!$localStorage.fixedSidebar,
                    //TODO
                    pageTransition: $scope.pageTransitionOpts[0]
                };


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
                $scope.isLoading = false;

                $scope.twoFactorAuthentication = false;

                $scope.cancelInputCode = function() {
                    $scope.twoFactorAuthentication = false;
                    $scope.password = "";
                };

                $scope.authenticate = function() {
                    $scope.signin();
                };

                $scope.signin = function () {
                    $scope.isLoading = true;
                    webitel.signin({
                        "login": $scope.login,
                        "server": $scope.server,
                        "password": $scope.password,
                        "code": $scope.code
                    }, function(err) {
                        $scope.isLoading = false;

                        if (err && err.statusCode === 301) {
                            $scope.twoFactorAuthentication = true;
                            return;
                        }

                        if (!$scope.twoFactorAuthentication)
                            $scope.password = '';

                        $scope.code = '';
                        if (err) {
                            return notifi.error(err, 5000)
                        }
                        $location.path('/');
                    })
                }
            }])
        .controller('HeaderCtrl', ['$scope', 'webitel', '$modal', '$rootScope', 'MODULES', 'notifi', function($scope, webitel, $modal, $rootScope, MODULES, notifi) {
            $scope.signout = function () {
                webitel.signout(function () {
                    window.location.href = "/"
                });
            };

            $scope.isSelectedDomain = function () {
                return !!webitel.domain();
            };

            $scope.$watch('addHotLinks', function (newVal) {
                if (newVal && newVal.length > 0) {
                    $scope.addLinks = newVal;
                }
            });

            $scope.addLinks = [];

            $scope.showContributors = function () {
                $modal.open({
                    templateUrl: 'views/contributors.html',
                    controller: function ($scope) {
                        angular.forEach(contributors, function (value, key) {
                            $scope[key] = value;
                        });
                    },
                    resolve: {
                    }
                });
            };

            $scope.showTwoFactorAuthenticationWindow = function () {
                $modal.open({
                    templateUrl: 'views/dialogs/qrCode.html',
                    backdrop: 'static',
                    controller: 'twoFactorAuthentication',
                    resolve: {

                    }
                });

            };

        }])
        .controller('twoFactorAuthentication', function ($scope, notifi, webitel, $confirm) {
            $scope.isLoading = false;
            $scope.settings = null;
            $scope.root = {
                code: ""
            };
            $scope.stage = 0;
            var getData = function(code, cb) {
                $scope.isLoading = true;
                webitel.api('get', '/api/v2/settings/security?code=' + code, null, function(err, res) {
                    $scope.isLoading = false;
                    return cb(err, res);
                });
            };

            var generateNewSecret = function (code) {
                $scope.isLoading = true;
                webitel.api('put', '/api/v2/settings/security?code=' + (code ? code : "") , {generateNewSecretKey: true}, function(err, data) {
                    $scope.isLoading = false;
                    if (err && err.statusCode !== 301) {
                        return notifi.error(err, 5000)
                    } else if (err && err.statusCode === 301) {
                        $confirm({name: 'Code'},  {size: 'sm', templateUrl: 'views/dialogs/input.html' })
                            .then(
                                function(result) {
                                    if (result && result.value) {
                                        generateNewSecret(result.value);
                                    }
                                },
                                function () {

                                }
                            );
                        return;
                    }

                    $scope.settings = data;
                });
            };

            $scope.generateNewSecret = function () {
                $confirm({text: 'Are you sure you want to generate new secret key?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        generateNewSecret("")
                    });
            };

            var setEnable = function(code, enabled) {
                $scope.isLoading = true;
                webitel.api('put', '/api/v2/settings/security?code=' + (code ? code : "") , {setEnable: enabled}, function(err, data) {
                    $scope.isLoading = false;
                    if (err && err.statusCode !== 301) {
                        return notifi.error(err, 5000)
                    } else if (err && err.statusCode === 301) {
                        $confirm({name: 'Code'},  {size: 'sm', templateUrl: 'views/dialogs/input.html' })
                            .then(
                                function(result) {
                                    if (result && result.value) {
                                        setEnable(result.value, enabled);
                                    }
                                },
                                function () {

                                }
                            );
                        return;
                    }

                    $scope.settings = data;
                });
            };
            $scope.setEnable = function (enabled) {
                setEnable("", enabled);
            };

            var resultOfData = function (err, data) {
                if (err && err.statusCode !== 301) {
                    $scope.root = {
                        code: ""
                    };
                    return notifi.error(err, 5000)
                } else if (err && err.statusCode === 301) {
                    $scope.stage = 1;
                    return;
                }

                $scope.stage = 2;
                $scope.settings = data;
            };

            getData("", resultOfData);

            $scope.getData = function (code) {
                getData(code, resultOfData)
            };

        })
        .directive('qrCode', function() {
            return {
                restrict: 'E',
                scope: { code: '=' },
                template: '<div></div>',
                link: function ($scope, $elem) {
                    var qr = null;
                    $scope.$watch("code", function (val) {
                        if (!val && qr) {
                            qr.clear();
                            return;
                        }

                        if (!qr) {
                            qr = new qrcode($elem[0], "" + val);
                        } else {
                            qr.makeCode(val);
                        }

                    });

                    $scope.$on('$destroy', function() {
                        qr.clear();
                    });
                }
            }
        })
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

        .controller('NavCtrl', [
            '$scope', function($scope) {
            }])
        .controller('DashboardCtrl', ['$scope', function($scope) {}])
        .controller('HomeCtrl', ['$scope', function ($scope) {

        }]);
});