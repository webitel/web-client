/**
 * Created by igor on 23.11.16.
 */

"use strict";

define(['app', 'modules/cdr/libs/fileSaver', 'async', 'modules/callflows/blacklists/blacklistsModel'], function (app, fileSaver, async) {
    app.controller('BlackListCtrl', ['$scope', 'webitel', 'TableSearch', '$rootScope', '$location', 'BlacklistModel', 'notifi',
    '$route', '$routeParams', '$confirm',
    function ($scope, webitel, TableSearch, $rootScope, $location, BlacklistModel, notifi, $route, $routeParams, $confirm) {

        $scope.domain = webitel.domain();

        $scope.blacklist = {};

        $scope.canDelete = webitel.connection.session.checkResource('blacklist', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('blacklist', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('blacklist', 'c');

        $scope.isLoading = false;
        $scope.query = TableSearch.get('blacklists');

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'blacklists')
        });

        $scope.displayedCollection = [];

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


        $scope.closePage = closePage;
        $scope.reloadData = reloadData;
        $scope.edit = edit;
        $scope.create = create;
        $scope.remove = remove;

        function closePage() {
            $location.path('/callflows/blacklists');
        }
        
        function edit() {
            var id = $routeParams.id;
            var domain = $routeParams.domain;

            $scope.blacklist.name = id;
            $scope.isEdit = true;
        }
        
        function create() {
            $scope.isNew = true;
        }

        function remove(blackListName) {
            $confirm({text: 'Are you sure you want to delete ' + blackListName + ' blacklist ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    BlacklistModel.remove($scope.domain, blackListName, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);

                        notifi.info('Removed ' + blackListName + ' blacklist.', 2000);
                        $scope.reloadData();
                    });
                });
        }

        function reloadData () {
            if ($location.$$path != '/callflows/blacklists')
                return 0;

            if (!$scope.domain)
                return $scope.rowCollection = [];
            $scope.isLoading = true;
            BlacklistModel.list($scope.domain, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err, 5000);
                var arr = [];
                angular.forEach(res, function(item) {
                    arr.push(item);
                });
                $scope.rowCollection = arr;
            });
        }

        $scope.export = function () {
            var _page = 1,
                txt = "";

            var option = {
                sort: {},
                filter: undefined,
                pageNumber: _page,
                limit: 80
            };

            function end() {
                $scope.processImport = false;
            }

            $scope.processImport = true;

            function onData(err, data) {
                if (err) {
                    end();
                    return notifi.error(err, 5000);
                }

                angular.forEach(data, function (item) {
                    txt += item.number + '\n';
                });

                if (data.length < option.limit) {
                    var blob = new Blob([txt], {
                        type: "text/plain"
                    });
                    fileSaver(blob, $scope.blacklist.name + '.csv');
                    end();
                } else {
                    option.pageNumber++;
                    BlacklistModel.numbers($scope.blacklist.name, $scope.domain, option, onData);
                }
            }

            BlacklistModel.numbers($scope.blacklist.name, $scope.domain, option, onData);
        };

        $scope.processImport = false;
        $scope.progress = 0;
        $scope.progressCount = 0;
        $scope.maxProgress = 0;

        $scope.fileCsvOnLoad = function (content) {
            var numbers = content.split(/\n/);
            var count = $scope.progress = 0;
            $scope.maxProgress = numbers.length;
            async.eachSeries(
                numbers,
                function (item, cb) {
                    $scope.processImport = true;
                    $scope.progress = Math.round(100 * $scope.progressCount++ / $scope.maxProgress);
                    if (item) {
                        count++;
                        BlacklistModel.add($scope.domain, $scope.blacklist.name, item, cb)
                    } else {
                        cb()
                    }
                },
                function (err) {
                    if (err)
                        notifi.error(err, 10000);
                    else notifi.info('Import ' + count + ' numbers.', 2000);
                    $scope.processImport = false;
                    reloadData()
                }
            )
        };


        $scope.init = function init () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            }
        }();


    }]);
    
    app.controller('BlackListNumbersCtrl', ['$scope', 'BlacklistModel', 'notifi', '$timeout', '$confirm', '$location',
    function ($scope, BlacklistModel, notifi, $timeout, $confirm, $location) {
        var _tableState = {};

        $scope.number = "";
        $scope.reloadData = function () {
            _tableState.pagination.start = 0;
            $scope.callServer(_tableState)
        };

        var nexData = true;
        $scope.isLoading = false;
        var _page = 1;
        $scope.CountItemsByPage = 80;
        $scope.numbersRowCollection = [];

        function search() {
            if (!$scope.isNew)
                $scope.reloadData();
        }

        var timer;

        $scope.addNumber = function (number) {
            if (!number)
                return notifi.error(new Error("Number is required!"), 5000);

            BlacklistModel.add($scope.domain, $scope.blacklist.name, number, function (err, res) {
                if (err)
                    return notifi.error(err);

                if ($scope.isNew) {
                    return $location.path('/callflows/blacklists/' + $scope.blacklist.name + '/edit');
                }

                $scope.reloadData();
            });
        };

        $scope.changeNumberCtrl = function (keyCode, number) {
            $timeout.cancel(timer);
            if (keyCode == 13) {
                search()
            } else {
                $scope.number = number;
                timer = $timeout(search, 500)
            }
        };

        $scope.removeNumber = function (number) {
            $confirm({text: 'Are you sure you want to delete ' + number + ' number ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    BlacklistModel.removeNumber($scope.domain, $scope.blacklist.name, number, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);

                        notifi.info('Removed ' + number + ' number.', 2000);
                        $scope.reloadData();
                    });
                });
        };

        $scope.callServer = function (tableState) {
            if ($scope.isLoading) return void 0;
            _tableState = tableState;

            $scope.isLoading = true;

            var option = {
                sort: {},
                filter: $scope.number ? {number: $scope.number} : undefined,
                pageNumber: _page,
                limit: $scope.CountItemsByPage
            };

            if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                _page = 1;
                nexData = true;
                $scope.numbersRowCollection = [];
                $scope.count = '';
            }

            console.debug("Page:", _page);
            option.pageNumber = _page;

            if (tableState.sort.predicate)
                option.sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

            BlacklistModel.numbers($scope.blacklist.name, $scope.domain, option, function (err, data) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err);

                _page++;

                $scope.numbersRowCollection = $scope.numbersRowCollection.concat(data);
            })
        };


    }])
});