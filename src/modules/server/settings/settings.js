/**
 * Created by igor on 06.09.16.
 */

"use strict";

define(['app', 'scripts/webitel/utils', 'modules/server/settings/settingsModel'], function (app, utils) {

    app.controller('ServerSettingsCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$timeout', 'ServerSettingsModel', '$confirm', 'cfpLoadingBar',
        function ($scope, $modal, webitel, $rootScope, notifi, $timeout, ServerSettingsModel, $confirm, cfpLoadingBar) {
            $scope.openDate = function($event, attr) {
                angular.forEach($scope.dateOpenedControl, function (v, key) {
                    if (key !== attr)
                        $scope.dateOpenedControl[key] = false;
                });
                return $event.preventDefault(),
                    $event.stopPropagation(),
                    $scope.dateOpenedControl[attr] = !0
            };
            $scope.executeDelNonExistentFile = false;
            $scope.executeDelFile = false;
            $scope.dateOpenedControl = {};
            $scope.dateOptions = {
                "year-format": "'yy'",
                "starting-day": 1
            };
            $scope.isLoading = false;

            $scope.quickDateRange = {
                'Today': [moment().startOf('day'), moment().endOf('day')],
                'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
                'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            };

            $scope.startDate = $scope.quickDateRange['Today'][0].toDate();
            $scope.endDate = $scope.quickDateRange['Today'][1].toDate();

            $scope.setQuickDateRange = function (v) {
                $scope.startDate = v[0].toDate();
                $scope.endDate = v[1].toDate();
                $scope.reloadDumpData();
            };

            //$scope.setQuickDateRange($scope.quickDateRange.Today);

            $scope.fsModules = ["amqp", "callcenter"];

            $scope.reloadProcess = false;
            
            $scope.reload = function (name) {
                $scope.reloadProcess = true;
                ServerSettingsModel.reload(name, function (err, res) {
                    $scope.reloadProcess = false;
                    if (err)
                        return notifi.error(err, 5000);

                    return notifi.info('Reload ' + name + ': ' + res.info, 5000);
                })
            };

            $scope.cache = function (action) {
                $scope.reloadProcess = true;
                ServerSettingsModel.cache(action, function (err, res) {
                    $scope.reloadProcess = false;
                    if (err)
                        return notifi.error(err, 5000);

                    return notifi.info('HTTP ' + action + ': ' + res.info, 5000);
                })
            };
            
            $scope.runDelFiles = function (params) {
                if (!params.from || !params.to) {
                    return notifi.error(new Error('Bad date!'), 5000);
                }
                var from = params.from.getTime(),
                    to = params.to.getTime()
                    ;
                if (to <= from) {
                    params.to = null;
                    return notifi.error(new Error('Date to must > from!'), 5000);
                }
                $confirm({text: 'WARNING: Are you sure you want to delete files from: ' + params.from.toLocaleDateString()
                + ' to ' + params.to.toLocaleDateString() + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        ServerSettingsModel.removeFiles(from, to, function (err, result) {

                            if (err) {
                                return notifi.error(err, 5000);
                            }

                            return notifi.info(result.info, 10000);
                        })
                    });
            };

            $scope.runDelNonExistentFile = function (params) {
                if (!params.from || !params.to) {
                    return notifi.error(new Error('Bad date!'), 5000);
                }
                var from = params.from.getTime(),
                    to = params.to.getTime()
                    ;
                if (to <= from) {
                    params.to = null;
                    return notifi.error(new Error('Date to must > from!'), 5000);
                }

                ServerSettingsModel.removeNonExistentFiles(from, to, function (err, result) {

                    if (err) {
                        return notifi.error(err, 5000);
                    }

                    return notifi.info(result.info, 10000);
                })

            }

            $scope.tcpDumpModal = function(isEdit, row){
                var modalInstance = $modal.open({
                    animation: true,
                    backdrop: false,
                    templateUrl: '/modules/server/sipDump/sipDumpModal.html',
                    resolve: {
                        domainName: function () {
                            return $scope.domain;
                        }
                    },
                    controller: function ($modalInstance, $scope) {
                        var self = $scope;

                        self.isEdit = isEdit;
                        if(self.isEdit){
                            self.duration = row.duration;
                            self.filtr = row.filter;
                            self.description = row.description;
                            self.id = row.id;
                        }
                        else{
                            self.duration = 0;
                            self.filtr = '';
                            self.description = '';
                        }

                        self.ok = function () {
                            if(isEdit){
                                $modalInstance.close({
                                    id: self.id,
                                    description: self.description
                                });
                            }
                            else{
                                $modalInstance.close({
                                    duration: self.duration,
                                    filter: self.filtr,
                                    description: self.description
                                });
                            }
                        };

                        self.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                });

                modalInstance.result.then(function (option) {
                    if(isEdit){
                        ServerSettingsModel.updateDump(option.id, option.description, function (err, res) {
                            if(err)
                                return notifi.error(err);
                            $scope.reloadDumpData();
                        });
                    }
                    else{
                        ServerSettingsModel.addDump(option, function (err, res) {
                            if(err)
                                return notifi.error(err);
                            $scope.reloadDumpData();
                        });
                    }
                });
            };

            $scope.$watch('isLoading', function (val) {
                if (val) {
                    cfpLoadingBar.start()
                } else {
                    cfpLoadingBar.complete()
                }
            });

            var _page = 1;
            var nexData = true;
            var col = encodeURIComponent(JSON.stringify({
                filter: 1,
                duration: 1,
                description: 1,
                created_on: 1,
                id: 1
            }));
            var maxNodes = 40;

            $scope.callServer = getData;

            function getData(tableState) {
                if ($scope.isLoading) return void 0;

                if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                    _page = 1;
                    nexData = true;
                    $scope.rowCollection = [];
                    $scope.count = 0;
                }
                console.debug("Page:", _page);

                $scope.tableState = tableState;

                $scope.isLoading = true;
                var sort ={};

                if (tableState.sort.predicate)
                    sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

                $scope.isLoading = true;
                sort = encodeURIComponent(JSON.stringify(sort));

                ServerSettingsModel.list({
                    from: Math.round($scope.startDate.getTime()/1000),
                    to: Math.round($scope.endDate.getTime()/1000),
                    columns: col,
                    sort: sort,
                    limit: maxNodes,
                    page: _page
                }, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);

                    _page++;
                    nexData = res.data.length === maxNodes;
                    $scope.rowCollection = $scope.rowCollection.concat(res.data);
                    $scope.rowCollection.forEach(function(row){
                        var date = new Date();
                        var timestamp = Math.round(date.getTime()/1000);
                        var substract = (parseInt(row.created_on) + row.duration) - timestamp;
                        if(substract > 0){
                            row.timer = substract;
                        }
                        else{
                            row.timer = 0;
                        }
                    })

                });

            }

            $scope.reloadDumpData  = function() {
                $scope.tableState.pagination.start = 0;
                getData($scope.tableState);
            };

            $scope.onChangeDate = function (val) {
                if (val)
                    $scope.reloadDumpData();
            };

            $scope.removeDump = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.filter + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        ServerSettingsModel.deleteDump(row.id, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            $scope.reloadDumpData();
                        });
                    });
            };


        }
    ]);
});