define(['app', 'async', 'scripts/webitel/utils', 'modules/callflows/editor', 'modules/gateways/gatewayModel',  'modules/dialer/dialerModel', 'modules/calendar/calendarModel'], function (app, async, utils, aceEditor) {

    app.controller('DialerCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DialerModel', '$location', '$route', '$routeParams',
        '$confirm', 'TableSearch', '$timeout', '$modal', 'CalendarModel',
        function ($scope, webitel, $rootScope, notifi, DialerModel, $location, $route, $routeParams, $confirm, TableSearch,
                  $timeout, $modal, CalendarModel) {

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
            $scope.activeResource = null;
            
            $scope.setActiveResource = function (resource) {
                $scope.activeResource = resource;
            };
            
            $scope.getDefaultResourceDestination = function () {
                return {
                    gwName: "",
                    dialString: "",
                    gwProto: "sip",
                    order: 0,
                    limit: 0,
                    enabled: true
                }
            };
            $scope.getDefaultResource = getDefaultResource;

            function getDefaultResource(dialString) {
                return {
                    dialedNumber: dialString || "",
                    destinations: []
                }
            };
            
            $scope.getCalendars = function () {
                CalendarModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.data;
                    angular.forEach(data, function (v) {
                        c.push({
                            "id": v._id,
                            "name": v.name
                        });
                    });
                    $scope.calendars = c;

                });
            };
            
            $scope.editResourceDialString = function (resource) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourceDialString.html',
                    controller: 'DialerResourceDialStringCtrl',
                    resolve: {
                        resource: function () {
                            return resource;
                        }
                    }
                });

                modalInstance.result.then(function (result) {

                    if (!$scope.dialer.resources)
                        $scope.dialer.resources = [];

                    if (!result.id) {
                        var resource = getDefaultResource(result.value);
                        $scope.activeResource = resource;
                        return $scope.dialer.resources.push(resource);
                    };

                    var resources = $scope.dialer.resources;
                    for (var i = 0; i < resources.length; i++) {
                        if (resources[i].$$hashKey == result.id) {
                            return resources[i].dialedNumber = result.value
                        }
                    }
                }, function () {

                });
            };

            $scope.editResourceDestination = function (resource) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourcePage.html',
                    controller: 'DialerResourceCtrl',
                    resolve: {
                        resource: function () {
                            return resource;
                        },
                        domain: function () {
                            return $scope.domain;
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    if (!$scope.activeResource.destinations)
                        $scope.activeResource.destinations = [];

                    var destinations = $scope.activeResource.destinations;
                    if (!result.id)
                        return destinations.push(result.value);

                    for (var i = 0; i < destinations.length; i++) {
                        if (destinations[i].$$hashKey == result.id) {
                            return destinations[i] = result.value
                        }
                    }
                }, function () {

                });
            };
            
            $scope.removeResource = function (key, resource) {
                var resources = $scope.dialer.resources;
                $confirm({text: 'Are you sure you want to delete resource ' + resource.dialedNumber + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        resources.splice(key, 1);
                    });
            };
            
            $scope.removeResourceDestination = function (key, resource) {
                var scope = this;
                $confirm({text: 'Are you sure you want to delete resource ' + resource.dialString + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        for (var i = 0, des = scope.activeResource.destinations, len = des.length; i < len; i++) {
                            if (des[i] == resource)
                                return scope.activeResource.destinations.splice(i, 1)
                        }

                    });

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

                    $scope.activeResource = $scope.dialer.resources && $scope.dialer.resources[0]
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

    }]);
    
    app.controller('DialerResourceCtrl', ["$scope", '$modalInstance', 'resource', 'domain', 'GatewayModel', 'notifi',
        function ($scope, $modalInstance, resource, domain, GatewayModel, notifi) {
        $scope.resource = angular.copy(resource);
        var id = resource.$$hashKey;

        $scope.ok = function () {
            if (!$scope.resource.dialString || (!$scope.resource.gwName && $scope.resource.gwProto == 'sip')) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close({value: $scope.resource, id: id}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.Types = ["sip", "sipUri"];

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
    
    app.controller('DialerResourceDialStringCtrl', ['$scope', '$modalInstance', 'resource',
        function ($scope, $modalInstance, resource) {

        $scope.dialedNumber = angular.copy(resource.dialedNumber);

        var id = resource.$$hashKey;

        $scope.ok = function () {
            if (!$scope.dialedNumber) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close({value: $scope.dialedNumber, id: id}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }])
});
