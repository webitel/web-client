define(['app', 'scripts/webitel/utils', 'modules/gateways/gatewayModel', 'scripts/webitel/domainModel'], function (app, utils) {

    app.controller('GatewaysCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', '$route', '$location', 'GatewayModel', '$routeParams', 
            'DomainModel', '$timeout', '$confirm', 'TableSearch',
        function ($scope, webitel, $rootScope, notifi, $route, $location, GatewayModel, $routeParams, DomainModel, $timeout, $confirm,
                  TableSearch) {
   		$scope.domain = webitel.domain();
        $scope.gateway = {};

        $scope.isRoot = !webitel.connection.session.domain;

        $scope.canDelete = webitel.connection.session.checkResource('gateway', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('gateway', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('gateway', 'c');

        $scope.template = GatewayModel.template;

        $scope.displayedCollection = [];
        $scope.remParams = [];
        $scope.remVar = [];
        $scope.remIVar = [];
        $scope.remOVar = [];

        $scope.query = TableSearch.get('gateways');

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'gateways')
        });

        $scope.dictionary = [
            "auth-username",
            "caller-id-in-from",
            "extension",
            "proxy",
            "outbound-proxy",
            "expire-seconds",
            "retry-seconds",
            "from-user",
            "from-domain",
            "register-proxy",
            "contact-params",
            "register-transport"
        ];

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        $scope.$on('$destroy', function () {
            changeDomainEvent();
        });

        function pushRemParams (name) {
            if (~$scope.remParams.indexOf(name) )
                return;
            $scope.remParams.push(name);
        };

        var _handleArray = [];
        function handleAlias (template, gw) {
            angular.forEach(_handleArray, function (fn) {
                fn();
            });
            _handleArray.length = 0;
            if (!template.alias)
                return;
            // TODO;
            angular.forEach(template.alias, function (alias , key) {
                var h = $scope.$watch('gateway.attr.' + key, function (newVal, oldVal) {
                    angular.forEach(alias, function (pattern, params) {
                        setParamByName(params, GatewayModel.replaceParams(pattern, gw.attr));
                    });
                });
                _handleArray.push(h);
            })
        };

        function setParamByName (name, value) {
            if (!$scope.gateway || !$scope.gateway.params)
                return;
            var params = $scope.gateway.params;
            for (var i =0, len = params.length; i < len; i++) {
                if (params[i].key == name)
                    return params[i].value = value;
            };
        };

        $scope.$watch('gateway', function(newValue, oldValue) {
            if ($scope.gateway._new)
                return $scope.isEdit = $scope.isNew = true;

            return $scope.isEdit = !!oldValue.id;
        }, true);

        $scope.cancel = function () {
            $scope.gateway = angular.copy($scope.oldGateway);
            disableEditMode();
        };

        function disableEditMode () {
            $timeout(function () {
                $scope.isEdit = false;
            }, 0);
        };
            
        $scope.$watch('gateway.type', function (newVal, oldVal) {
            if (!newVal)
                return void 0;

            if (!$scope.template[newVal])
                return notifi.error(new Error('Bad type gw.'), 5000);

            var newTemplate = $scope.template[newVal]
                ;

            handleAlias(newTemplate, $scope.gateway);

            var params = $scope.gateway.params,
                i = params.length,
                item
                ;

            if (!oldVal && $scope.gateway.id)
                return;

            while (i--) {
                item = params[i];
                if ($scope.template.sipProvider.params.hasOwnProperty(item.key)
                    || $scope.template.sipTrunk.params.hasOwnProperty(item.key)
                    || $scope.template.skype.params.hasOwnProperty(item.key) ) {

                    pushRemParams(item.key);
                    $scope.gateway.params.splice(i, 1);
                };
            };


            angular.forEach(newTemplate.params, function (value, key) {
                $scope.gateway.params.push({
                    _new: true,
                    key: key,
                    value: value,
                });
            });

            angular.forEach(newTemplate.fields, function (item, key) {
                $scope.gateway.attr[key] = item.value ? item.value : ($scope.gateway.attr[key] || "");
            });

            handleAlias(newTemplate, $scope.gateway);
        });

        function reloadData (timeOut) {
            if ($location.$$path != '/gateways')
                return 0;
            $scope.isLoading = true;
            var _reload = function () {
                GatewayModel.list($scope.domain, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err);
                    $scope.rowCollection = res;
                });
            };

            if (timeOut > 0) {
                $timeout(_reload, timeOut)
            } else {
                _reload();
            }

        };

        $scope.$watch('domain', function(domainName) {
            $scope.domain = domainName;
            reloadData();
        });
        $scope.edit = edit;
        $scope.create = create;

        $scope.closePage = closePage;
        $scope.save = save;
        $scope.isLoading = false;
        $scope.reloadData = reloadData;
            
        $scope.getParametersViewError = function (form, key) {
            debugger
        }

        $scope.sortPositionFiled = function (obj) {
            var array = [];
            if (!obj)
                return array;

            Object.keys(obj).forEach(function (key) {
                // inject key into each object so we can refer to it from the template
                // obj[key].name = key;
                obj[key].fieldName = key;
                array.push(obj[key]);
            });
            // apply a custom sorting function
            array.sort(function (a, b) {
                return a.position - b.position;
            });
            return array;
        };

        $scope.viewPassword = false;

        $scope.toggleViewPassword = function () {
            $scope.viewPassword = !$scope.viewPassword;
        };


        $scope.removeItem = function (row) {
            $confirm({text: 'Are you sure you want to delete ' + row.id + ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    GatewayModel.remove(row.id, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);

                        return reloadData(3000)
                    })
                });
        };

        $scope.toggleGw = function (row) {
            var newState = row.reg,
            profile = row.profile;
            row.reg = !newState;
            var operation = newState ? 'up' : 'down';
            
            webitel.api("PUT", "/api/v2/gateway/" + row.id + '/' + operation + '?profile=' + row.profile,
             function (err, res) {
               if (err) 
                    return notifi.error(err, 5000);
                $scope.isLoading = true;
                 reloadData(3000);
                row.reg = newState; 
            });
        };

        var initTabs = {};
        $scope.selectTab  = function (varName) {
            return;
            if (initTabs[varName])
                return;

            GatewayModel.getVar($scope.gateway.id, varName, function (err, res) {
                debugger;
            });
        }

        $scope.domains = [];
        $scope.getDomains = function () {
            DomainModel.list(function (err, domains) {
                $scope.domains = [];
                angular.forEach(domains, function (item) {
                    $scope.domains.push(item.id);
                })
            })
        };
        
        function closePage() {
            $location.path('/gateways');
        };

        function save() {
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                if ($scope.gateway._new) {
                    return $location.path('/gateways/' + $scope.gateway.name + '/edit');
                } else {
                    $scope.gateway.__time = Date.now();
                    return edit();
                };
            };
            if (!$scope.gateway.id) {
                GatewayModel.add($scope.gateway, cb);
            } else {
                var updateValues = utils.diff($scope.gateway,  $scope.oldGateway);
                if (Object.keys(updateValues).length < 1 && $scope.remParams.length < 1)
                    return notifi.warn("No changes.", 5000);
                GatewayModel.update($scope.gateway, updateValues, $scope.remParams, cb)
            };
        };

        function edit () {
            var id = $routeParams.id;
            GatewayModel.item(id, $scope.domain, function (err, gw) {
                if (err)
                    return notifi.error(err, 5000);
                $scope.gateway = gw;
                $scope.oldGateway = angular.copy(gw);
                disableEditMode();
            })
        }

        function create() {
            $scope.gateway = GatewayModel.create();
            $scope.gateway._new = true;
            $scope.gateway.domain = $scope.domain;
        }

        $scope.init = function init () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            };
        }();

    }]);
});
