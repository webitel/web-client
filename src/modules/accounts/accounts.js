define(['app', 'scripts/webitel/utils',  'async', 'modules/accounts/accountModel', 'css!modules/accounts/account.css'], function (app, utils, async) {

    app.controller('AccountsCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'AccountModel', '$route', '$location', '$routeParams',
        '$confirm', '$timeout', 'TableSearch',
        function ($scope, webitel, $rootScope, notifi, AccountModel, $route, $location, $routeParams, $confirm, $timeout, TableSearch) {
        $scope.domain = webitel.domain();
        $scope.account = {};
        $scope.userVariables = utils.switchVar;
        $scope.canDelete = webitel.connection.session.checkResource('account', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('account', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('account', 'c');

        $scope.canReadQueue = webitel.connection.session.checkResource('cc/queue', 'r');
        $scope.canCreateTier = webitel.connection.session.checkResource('cc/tiers', 'c');
        $scope.canDeleteTier = webitel.connection.session.checkResource('cc/tiers', 'd');

        $scope.remVar = [];
        $scope.roles = [];
        $scope.queues = {};
        $scope.isLoading = false;

        $scope.query = TableSearch.get('account'); //$routeParams.search;

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'account')
        });

        $scope.displayedCollection = [];

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        if (!$route.current.method) {

            var fnOnUserStatusChange = function (e) {
                if (e["Account-Domain"] != $scope.domain)
                    return;

                var $row = $("#account-" + e["Account-User"]);
                // TODO ??? perf
                $row.find('td.account-state span').removeClass().addClass(e['Account-User-State'].toLocaleLowerCase()).text(e['Account-User-State']);
                $row.find('td.account-status span').removeClass().addClass(e['Account-Status'].toLocaleLowerCase()).text(e['Account-Status']);
                var descript = e['Account-Status-Descript'] || "";
                $row.find('td.account-descript').text(decodeURIComponent(descript));

            };
            var fnOnUserOnline = function (e) {
                if (e["User-Domain"] != $scope.domain)
                    return;
                $("#account-" + e["User-ID"] + ' .account-online span').removeClass().addClass('true')
            };
            var fnOnUserOffline = function (e) {
                if (e["User-Domain"] != $scope.domain)
                    return;
                $("#account-" + e["User-ID"] + ' .account-online span').removeClass().addClass('false')

            };

            webitel.connection.instance.onServerEvent("ACCOUNT_STATUS", fnOnUserStatusChange);
            webitel.connection.instance.onServerEvent("ACCOUNT_ONLINE", fnOnUserOnline);
            webitel.connection.instance.onServerEvent("ACCOUNT_OFFLINE", fnOnUserOffline);

        };

        function unSubscribeGridEvents() {
            if (!$route.current.method) {
                webitel.connection.instance.unServerEvent("ACCOUNT_STATUS", null, fnOnUserStatusChange);
                webitel.connection.instance.unServerEvent("ACCOUNT_ONLINE", null, fnOnUserOnline);
                webitel.connection.instance.unServerEvent("ACCOUNT_OFFLINE", null, fnOnUserOffline);
            }
        }

        $scope.$on('$destroy', function () {
            changeDomainEvent();
            unSubscribeGridEvents();
        });

        function reloadData () {
            if ($location.$$path != '/accounts')
                return 0;

            if (!$scope.domain)
                return $scope.rowCollection = [];
            $scope.isLoading = true;
            AccountModel.list($scope.domain, function (err, res) {
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

        function findTier(array, queueName) {
            for (var i in array)
                if (array[i].queue == queueName)
                    return array[i]
        };

        $scope.$watch('account', function(newValue, oldValue) {
            if ($scope.account._new)
                return $scope.isEdit = $scope.isNew = true;

            return $scope.isEdit = !!oldValue.id;
        }, true);

        $scope.cancel = function () {
            $scope.account = angular.copy($scope.oldAccount);
            disableEditMode();
        };

        function disableEditMode () {
            $timeout(function () {
                $scope.isEdit = false;
            }, 0);
        };

        function toggleTier(queueName, queue) {

            if (!queue)
                return ;
            var newState = queue.active;
            queue.active = !queue.active;
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);
                queue.active = newState;
            };

            if (newState)
                return AccountModel.addTier(queueName, $scope.account.id, $scope.domain, cb);
            else return AccountModel.removeTier(queueName, $scope.account.id, $scope.domain, cb)

        };

        var loadQueues = false;
        function reloadTabQueue() {
            if (loadQueues) return;
            $scope.queues = {};
            async.waterfall([
                function (cb) {
                    AccountModel.getQueueList($scope.domain, cb);
                },
                function (queues, cb) {
                    AccountModel.getTierList($scope.account.id, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);
                        return cb(null, {queues: queues, tiers: res});
                    })
                }
            ], function (err, res) {
                if (err)
                    return notifi.error(err, 5000);
                var grid = {};
                loadQueues = true;
                angular.forEach(res.queues, function (item) {
                    var _tier = findTier(res.tiers, item.name);
                    grid[item.name] = {
                        strategy: item.strategy,
                        enable: item.enable,
                        active: _tier ? true : false,
                        tier: _tier
                    };
                });

                $scope.queues = grid;
            })



        }

        $scope.$watch('domain', function(domainName) {
            $scope.domain = domainName;
            reloadData();
        });
        $scope.edit = edit;
        $scope.create = create;
        $scope.reloadData = reloadData;
        $scope.reloadTabQueue = reloadTabQueue;
        $scope.toggleTier = toggleTier;

        $scope.closePage = closePage;
        $scope.save = save;
        $scope.getRoles = getRoles;

        $scope.removeItem = function (row) {
            $confirm({text: 'Are you sure you want to delete ' + row.id+ ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    AccountModel.remove(row.id, $scope.domain, function (err) {
                        if (err)
                            return notifi.error(err, 5000);
                        reloadData()
                    })
                });
        };
        
        function closePage() {
            $location.path('/accounts');
        };

        function save(exit) {
            // TODO
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                if ($scope.account._new) {
                    return $location.path('/accounts/' + $scope.account.id + '/edit');
                } else {
                    $scope.account.__time = Date.now();
                    return edit();
                };
            };
            if ($scope.account._new) {
                AccountModel.add($scope.account, cb);
            } else {
                var updateValues = utils.diff($scope.account,  $scope.oldAccount);
                AccountModel.update($scope.account, $scope.domain, updateValues, $scope.remVar, cb)
            }
        };

        function edit () {
            var id = $routeParams.id;
            var domain = $routeParams.domain;


            AccountModel.item(domain, id, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                };
                $scope.oldAccount = angular.copy(item);
                $scope.account = item;
                disableEditMode();
            });
        }
        function create() {
            $scope.account = AccountModel.create();
            var domain = $routeParams.domain;
            $scope.account.domain = domain;
            $scope.account._new = true;
        };

        function getRoles() {
            AccountModel.getRoles(function (err, res) {
                if (err)
                    return notifi.error(err);
                $scope.roles = res;
            })
        };

        $scope.init = function init () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            };
        }();
    }]);
});