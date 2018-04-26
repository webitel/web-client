define(['app', 'scripts/webitel/utils',  'async', 'modules/devices/deviceModel', 'modules/cdr/cdrModel', 'css!modules/accounts/account.css'], function (app, utils, async) {

    app.controller('DevicesCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DeviceModel', '$route', '$location', '$routeParams',
        '$confirm', '$timeout', 'TableSearch', '$modal', 'cfpLoadingBar',
        function ($scope, webitel, $rootScope, notifi, DeviceModel, $route, $location, $routeParams, $confirm, $timeout, TableSearch, $modal,
                  cfpLoadingBar) {
        $scope.domain = webitel.domain();
        $scope.device = {};
        //$scope.userVariables = utils.switchVar;


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

        $scope.vendors = [
            {
                name: "Grandstream",
                models: [
                    {
                        displayName: "GXP16XX",
                        name: "GXP16XX"
                    }
                ]
            },
            {
                name: "Polycom",
                models: [
                    {
                        displayName: "VVX411",
                        name: "VVX"
                    }
                ]
            },
            {
                name: "Yealink",
                models: [
                    {
                        displayName: "T22",
                        name: "T22"
                    }
                ]
            }
        ];
        $scope.vendorsField =[];
        $scope.modelsField =[];

        $scope.getVendors = function(){
            $scope.vendors.forEach(function(item){
                $scope.vendorsField.push(item.name);
            });
            // if(!$scope.device.vendor){
            //     $scope.device.vendor = $scope.vendorsField[0];
            // }
            $scope.getModels(true);
        };

        $scope.getModels = function(first){
            $scope.modelsField = [];
            if(!$scope.device.vendor)
                return;
            var vendor = $scope.vendors.filter(function(item){
                return item.name === $scope.device.vendor;
            })[0];
            $scope.modelsField = vendor.models;
            if(first && !$scope.device.model){
                $scope.device.model = $scope.modelsField[0];
            }
            // } else if (!first) {
            //     $scope.device.model = $scope.modelsField[0];
            // } else if (first && $scope.device.model){
            //     $scope.device.model = $scope.modelsField.filter(function (item) {
            //         return item.name === $scope.device.model;
            //     })[0];
            // }
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

        // if (!$route.current.method) {
        //
        //     var findAccountInRowCollection = function (id, domain) {
        //         if (!$scope.rowCollection)
        //             return;
        //
        //         for (var i = 0, len = $scope.rowCollection.length; i < len; i++)
        //             if ($scope.rowCollection[i].id == id && $scope.rowCollection[i].domain == domain)
        //                 return $scope.rowCollection[i];
        //     };
        //
        //     var fnOnUserStatusChange = function (e) {
        //         if (e["Account-Domain"] != $scope.domain)
        //             return;
        //
        //         // var $row = $("#account-" + e["Account-User"]);
        //         // // TODO ??? perf
        //         // $row.find('td.account-state span').removeClass().addClass(e['Account-User-State'].toLocaleLowerCase()).text(e['Account-User-State']);
        //         // $row.find('td.account-status span').removeClass().addClass(e['Account-Status'].toLocaleLowerCase()).text(e['Account-Status']);
        //         var descript = e['Account-Status-Descript'] || "";
        //         // $row.find('td.account-descript').text(decodeURIComponent(descript));
        //
        //         var user = findAccountInRowCollection(e["Account-User"], e["Account-Domain"]);
        //         if (user) {
        //             user.state = e['Account-User-State'];
        //             user.status = e['Account-Status'];
        //             user.descript = descript;
        //             $scope.$apply();
        //         }
        //     };
        //
        //
        //     webitel.connection.instance.onServerEvent("ACCOUNT_STATUS", fnOnUserStatusChange);
        //
        // };
        //
        // function unSubscribeGridEvents() {
        //     if (!$route.current.method) {
        //         webitel.connection.instance.unServerEvent("ACCOUNT_STATUS", null, fnOnUserStatusChange);
        //     }
        // }

        $scope.$on('$destroy', function () {
            changeDomainEvent();
          //  unSubscribeGridEvents();
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
                //var updateValues = utils.diff($scope.device,  $scope.oldDevice);
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
                $scope.getModels(true);
                // var v = $scope.vendors.filter(function (vendor) {
                //     return item.vendor === vendor.name;
                // })[0];
                // $scope.device.model = v.models.filter(function (model) {
                //     return item.model === model.name;
                // })[0];
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