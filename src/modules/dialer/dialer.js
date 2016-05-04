define(['app', 'async', 'scripts/webitel/utils', 'modules/callflows/editor', 'modules/gateways/gatewayModel',  'modules/dialer/dialerModel'], function (app, async, utils, aceEditor) {

    app.controller('DialerCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DialerModel', '$location', '$route', '$routeParams',
        '$confirm', 'TableSearch', '$timeout', '$modal',
        function ($scope, webitel, $rootScope, notifi, DialerModel, $location, $route, $routeParams, $confirm, TableSearch,
                  $timeout, $modal) {

            $scope.canDelete = webitel.connection.session.checkResource('dialer', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('dialer', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('dialer', 'c');
            $scope.domain = webitel.domain();
            $scope.dialer = {};

            $scope.query = TableSearch.get('dialer');

            $scope.cf = aceEditor.getStrFromJson([
                {
                    "setVar": [
                        "ringback=$${us-ring}",
                        "transfer_ringback=$${uk-ring}",
                        "hangup_after_bridge=true",
                        "continue_on_fail=true"
                    ]
                },
                {
                    "recordSession": "start"
                },
                {
                    "bridge": {
                        "endpoints": [
                            {
                                "name": "101",
                                "type": "user"
                            }
                        ]
                    }
                },
                {
                    "recordSession": "stop"
                },
                {
                    "answer": ""
                },
                {
                    "sleep": "1000"
                },
                {
                    "voicemail": {
                        "user": "101"
                    }
                }
            ]);
            $scope.aceLoaded = aceEditor.init;

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'dialer')
            });

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            });

            $scope.reloadData = reloadData;
            $scope.removeItem = removeItem;
            $scope.closePage = closePage;
            $scope.edit = edit;

            $scope.rowCollection = [];
            $scope.activeResource = {};
            
            $scope.setActiveResource = function (resource) {
                $scope.activeResource = resource;
            };

            function closePage() {
                $location.path('/dialer');
            };

            function edit () {
                var id = $routeParams.id;
                var domain = $routeParams.domain;


                DialerModel.item(id, domain, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    };
                    $scope.oldDialer = angular.copy(item);
                    $scope.dialer = item;
                    disableEditMode();
                });
            }

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };

            function getData () {
                if ($scope.isLoading) return void 0;

                $scope.isLoading = true;
                DialerModel.list($scope.domain, 0, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.rowCollection = res;
                });
            };

            function removeItem(row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        DialerModel.remove(row._id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData()
                        })
                    });
            }

            function reloadData () {
                if ($location.$$path != '/dialer')
                    return 0;

                if (!$scope.domain)
                    return $scope.rowCollection = [];

                return getData();
            };


            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();


            $scope.diealerStates = ["state1", "state2"];
            $scope.diealerTypes = ["progressive", "predictive"];

            $scope.editResource = function (resource) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourcePage.html',
                    controller: 'DialerResourceCtrl',
                    resolve: {
                        resource: function () {
                            return resource;
                        },
                        domain: function () {
                            return $scope.domain
                        }
                    }
                });

                modalInstance.result.then(function (result) {

                }, function () {

                });
            }

    }]);
    
    app.controller('DialerResourceCtrl', ["$scope", '$modalInstance', 'resource', 'domain', 'GatewayModel', 'notifi',
        function ($scope, $modalInstance, resource, domain, GatewayModel, notifi) {
        $scope.resource = resource;
        $scope.ok = function () {
            if (!$scope.resource.gwName || !$scope.resource.dialString) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close($scope.resource, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.gateways = [];

        GatewayModel.list(domain, function (err, res) {
            if (err)
                return notifi.error(err);
            $scope.gateways = [];
            angular.forEach(res, function (v) {
                $scope.gateways.push(v.id)
            });
        });
    }]);
});
