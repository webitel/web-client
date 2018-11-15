define(['app', 'scripts/webitel/utils',  'async', 'modules/devices/deviceModel', 'modules/cdr/cdrModel', 'css!modules/accounts/account.css'], function (app, utils, async) {

    app.controller('DevicesCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DeviceModel', '$route', '$location', '$routeParams',
        '$confirm', '$timeout', 'TableSearch', '$modal', 'cfpLoadingBar',
        function ($scope, webitel, $rootScope, notifi, DeviceModel, $route, $location, $routeParams, $confirm, $timeout, TableSearch, $modal,
                  cfpLoadingBar) {
        $scope.domain = webitel.domain();
        $scope.device = {};


        $scope.canDelete = webitel.connection.session.checkResource('hotdesk', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('hotdesk', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('hotdesk', 'c');


        $scope.viewMode = !$scope.canUpdate;
            
        $scope.view = function () {
            var id = $routeParams.id;
            var domain = $routeParams.domain;

            DeviceModel.item(domain, id, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                }
                $scope.device = item;
                disableEditMode();
            });
        };

       // $scope.remVar = [];
        $scope.isLoading = false;

        $scope.$watch('isLoading', function (val) {
            if (val) {
                cfpLoadingBar.start()
            } else {
                cfpLoadingBar.complete()
            }
        });

        $scope.options = {
            multiInsert: false
        };



        $scope.query = TableSearch.get('device'); //$routeParams.search;

        $scope.changePanel = function (panelStatistic) {
            $scope.panelStatistic = !!panelStatistic;
        };

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'device')
        });

        $scope.displayedCollection = [];

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        $scope.$on('$destroy', function () {
            changeDomainEvent();
        });

        function reloadData () {
            if ($location.$$path != '/directory/devices')
                return 0;

            if (!$scope.domain)
                return $scope.rowCollection = [];
            $scope.isLoading = true;
            DeviceModel.list($scope.domain, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err, 5000);
                var arr = [];
                angular.forEach(res.data || res.info, function(item) {
                    arr.push(item);
                });
                $scope.rowCollection = arr;
            });
        };

        $scope.$watch('device', function(newValue, oldValue) {
            if ($scope.device._new)
                return $scope.isEdit = $scope.isNew = true;

            return $scope.isEdit = !!oldValue.id;
        }, true);

        $scope.cancel = function () {
            $scope.device = angular.copy($scope.oldDevice);
            disableEditMode();
        };

        function disableEditMode () {
            $timeout(function () {
                $scope.isEdit = false;
            }, 0);
        };

        $scope.$watch('domain', function(domainName) {
            $scope.domain = domainName;
            reloadData();
        });
        $scope.edit = edit;
        $scope.create = create;
        $scope.reloadData = reloadData;

        $scope.closePage = closePage;
        $scope.save = save;

        $scope.genPassword = function (ac) {
            ac.password = genString(16);
        };

        function onCopied() {
            return notifi.info("Copy", 1000);
        }

        function onCopiedFail(err) {
            return notifi.error(err, 5000);
        }

        $scope.onCopied = onCopied;
        $scope.onCopiedFail = onCopiedFail;

        function genString(num) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < num; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }

        $scope.removeItem = function (row) {
            $confirm({text: 'Are you sure you want to delete ' + row.id+ ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    DeviceModel.remove(row.id, $scope.domain, function (err) {
                        if (err)
                            return notifi.error(err, 5000);
                        reloadData()
                    })
                });
        };
        
        function closePage() {
            $location.path('/directory/devices');
        };

        $scope.convertToDate = function(timestamp){
            if(timestamp && timestamp != 0)
                return new Date(+timestamp*1000).toString().split("GMT")[0];
            else return "";
        }

        function save(exit) {
            // TODO
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                if ($scope.device._new) {
                    return $location.path('/directory/devices/' + $scope.device.id + '/edit');
                } else {
                    $scope.device.__time = Date.now();
                    return edit();
                }
            };
            if ($scope.device.alias && $scope.device.alias.length>0) {
                var tags = [];
                angular.forEach($scope.device.alias, function (item) {
                    if (item)
                        tags.push(item.text);
                });
                if(typeof $scope.device.alias === 'object') $scope.device.alias = tags.join(',');
            }
            $scope.device.mac = $scope.device.mac ? $scope.device.mac.toLowerCase() : "";
            if ($scope.device._new) {
                if ($scope.options.multiInsert) {
                    if (+$scope.options.to > +$scope.device.id) {
                        var iterator = +$scope.device.id;
                        var ids = [];
                        while (iterator <= +$scope.options.to)
                            ids.push(iterator++);

                        async.eachSeries(ids, function (id, cb) {
                            $scope.device.id = id;
                            DeviceModel.add($scope.device, function (err) {
                                if (err)
                                    return cb(err);

                                notifi.info('Created: ' + id, 1000);
                                cb();
                            });
                        }, cb)
                    } else {
                        notifi.error('Bad from or to', 2000);
                    }
                } else {
                    DeviceModel.add($scope.device, cb);
                }
            } else {
                DeviceModel.update($scope.device, $scope.domain,/* updateValues, $scope.remVar, */cb)
            }
        };

        function edit () {
            $scope.viewMode = false;
            var id = $routeParams.id;
            var domain = $routeParams.domain;

            $scope.isLoading = true;
            DeviceModel.item(domain, id, function(err, item) {
                $scope.isLoading = false;
                if (err) {
                    return notifi.error(err, 5000);
                };

                $scope.device = item;
                $scope.device.last_in = $scope.convertToDate($scope.device.last_in);
                $scope.device.last_out =$scope.convertToDate($scope.device.last_out);

                $scope.oldDevice = angular.copy(item);
                disableEditMode();
            });
        }
        function create() {
            var domain = $routeParams.domain;
            $scope.device.domain = domain;
            $scope.device._new = true;
            //$scope.device.variables = [];
            $scope.device.alias = [];
        };

        $scope.init = function init () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            };
        }();

    }]);
});