define(['app', 'async', 'scripts/webitel/utils', 'modules/acd/acdModel', 'modules/accounts/accountModel', 'modules/media/mediaModel'], function (app, async, utils) {

    app.controller('ACDCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'AcdModel', '$location', '$route', 'AccountModel', '$routeParams',
        '$confirm', 'TableSearch', '$timeout', 'MediaModel', '$q',
        function ($scope, webitel, $rootScope, notifi, AcdModel, $location, $route, AccountModel, $routeParams, $confirm, TableSearch,
                  $timeout, MediaModel, $q) {

            $scope.canDelete = webitel.connection.session.checkResource('cc/queue', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('cc/queue', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('cc/queue', 'c');

            $scope.canCreateTiers = webitel.connection.session.checkResource('cc/tiers', 'c');
            $scope.canUpdateTiers = webitel.connection.session.checkResource('cc/tiers', 'u');
            $scope.canDeleteTiers = webitel.connection.session.checkResource('cc/tiers', 'd');
            $scope.canReadTiers   = webitel.connection.session.checkResource('cc/tiers', 'r');

            $scope.domain = webitel.domain();
            $scope.queue = {};

            $scope.displayedCollection = [];

            $scope.query = TableSearch.get('acd');

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'acd')
            });


            $scope.$watch('queue', function(newValue, oldValue) {
                if ($scope.queue._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue.id;
            }, true);

            $scope.cancel = function () {
                $scope.queue = angular.copy($scope.oldQueue);
                disableEditMode();
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };


            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                 closePage();
            });

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.edit = edit;
            $scope.create = create;
            $scope.reloadData = reloadData;

            $scope.closePage = closePage;
            $scope.save = save;

            $scope.tiers = [];
            $scope.agents = [];
            $scope.agentsList = [
            ];
            
            $scope.setTierPos = function (tier, isUp, $event) {
                $event.stopPropagation();
                var pos = isUp ? +tier.position + 1 : +tier.position - 1;
                if (pos <= 0)
                    return notifi.error(new Error("Value must be zero based integer number!"));

                AcdModel.setPos($scope.queue.id, tier.agent, $scope.domain, pos, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    tier.position = pos;
                    //reloadTiers($scope.queue.id)
                });
                return true;
            };

            $scope.setTierLvl = function (tier, isUp, $event) {
                $event.stopPropagation();
                var lvl = isUp ? +tier.level + 1 : +tier.level - 1;
                if (lvl <= 0)
                    return notifi.error(new Error("Value must be zero based integer number!"));

                AcdModel.setLvl($scope.queue.id, tier.agent, $scope.domain, lvl, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    tier.level = lvl;
                });
                return true;
            };
            
            $scope.toggleQueueStatus = function (queue, id) {
                var newState = queue.enable;
                var name = queue.name || id;
                queue.enable = !newState;
                $confirm({text: 'Update state ' + name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        AcdModel.setState(name, newState, $scope.domain, function (err, res) {
                            if (err)
                                return notifi.error(err);

                            queue.enable = newState;

                        });
                    });

            };

            $scope.reloadTiers = reloadTiers;

            $scope.selAgents = {};
            $scope.selTiers = {};
            $scope.progress = null;

            $scope.addTiers = function (all) {
                var addTiers = [];
                var collection = all ? $scope.agents : $scope.selAgents;
                var iteration = 0;
                var allCount = collection.length ? collection.length : Object.keys(collection).length;
                $scope.progress = allCount + '/' + iteration;

                angular.forEach(collection, function (value, key) {
                    if (!all && value)
                        return addTiers.push(key);

                    if (all && value)
                        return addTiers.push(value.id);
                });

                async.eachSeries(addTiers, 
                    function (item, cb) {
                        $scope.progress = allCount + '/' + iteration++;
                        AcdModel.addTier($scope.queue.id, item, $scope.domain, cb);
                    },
                    function (err) {
                        $scope.progress = null;
                        if (err)
                            return notifi.error(err);
                        reloadTiers($scope.queue.id);
                        return notifi.info('Create: ' + addTiers.join(',') + ' tiers.', 1000)
                    }
                );
            };

            $scope.removeTiers = function (all) {
                var removeTiers = [];
                var collection = all ? $scope.tiers : $scope.selTiers;
                var iteration = 0;
                var allCount = collection.length ? collection.length : Object.keys(collection).length;
                $scope.progress = allCount + '/' + iteration;
                angular.forEach(collection, function (value, key) {
                    if (!all && value)
                        return removeTiers.push(key.split('@')[0]);

                    if (all && value)
                        return removeTiers.push(value.agent.split('@')[0]);
                });

                async.eachSeries(removeTiers,
                    function (item, cb) {
                        $scope.progress = allCount + '/' + iteration++;
                        AcdModel.removeTier($scope.queue.id, item, $scope.domain, cb);
                    },
                    function (err) {
                        $scope.progress = null;
                        if (err)
                            return notifi.error(err);
                        reloadTiers($scope.queue.id);
                        return notifi.info('Remove: ' + removeTiers.join(',') + ' tiers.', 1000)
                    }
                );
            };

            var cacheMedia = null;
            $scope.getMedia = function (str) {
                if (cacheMedia)
                    return cacheMedia;

                var result = $q.defer();
                MediaModel.list($scope.domain, function (err, res) {
                    var media;
                    if (err) {
                        cacheMedia = [{name: "$${hold_music}"}];
                    } else {
                        cacheMedia = [{name: '$${hold_music}'}].concat(res);
                    }

                    return result.resolve(cacheMedia);
                });
                return result.promise;
            };
            
            $scope.onSelectMedia = function (item, $model) {
                if (item.type) {
                    $scope.queue['moh-sound'] = utils.mediaToUri(item);
                } else {
                    $scope.queue['moh-sound'] = item.name;
                }
            };

            $scope.removeItem = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        AcdModel.remove(row.name, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData()
                        })
                    });
            };

            function reloadTiers (queueId) {
                var agents = [],
                    tiers = [],
                    _selAgents = {}
                    ;
                $scope.selAgents = {};
                $scope.selTiers = {};
                function init(ags, tis) {
                    angular.forEach(tis, function (item) {
                        var aId = item.agent.split('@')[0];
                        if (ags[aId]) {
                            item.state = ags[aId].state;
                            item.status = ags[aId].status;
                            item.name = ags[aId].name;
                        };
                        item.level = +item.level;
                        item.position = +item.position;

                        tiers.push(item);
                        _selAgents[aId] = true;
                    });
                    angular.forEach(ags, function (item, key) {
                        if (!_selAgents[key] && item.agent == 'true')
                            agents.push(item)
                        ;
                    });

                    $scope.tiers = tiers;
                    $scope.agents = agents;
                };

                AccountModel.list($scope.domain, function (err, resAgents) {
                    if (err)
                        return notifi.error(err);

                    AcdModel.listTiers(queueId, $scope.domain, function (err, resTiers) {
                        if (err)
                            return notifi.error(err);

                        init(resAgents.data || resAgents.info, resTiers)
                    });
                });
            };

            function edit() {
                var id = $routeParams.id;
                var domain = $routeParams.domain;

                AcdModel.item(id, domain, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    $scope.queue = res;
                    $scope.queue.id  = id;
                    $scope.oldQueue = angular.copy($scope.queue);
                    reloadTiers($scope.queue.id);
                    disableEditMode();
                })
            };
            function save() {
                if ($scope.queue._new) {
                    AcdModel.add($scope.queue, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err, 10000);

                        return $location.path('/acd/' + $scope.queue.id  + '/edit');
                    });
                } else {
                    var updateValues = utils.diff($scope.queue,  $scope.oldQueue);
                    AcdModel.update($scope.queue.id, $scope.domain, updateValues, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);
                        $scope.queue.__time = Date.now();
                        return edit();
                    })
                }
            };
            function create() {
                $scope.queue = AcdModel.create();
                $scope.queue._new = true;
            };
            function closePage() {
                $location.path('/acd');
            };

            function reloadData () {
                if ($location.$$path != '/acd')
                    return 0;

                if (!$scope.domain)
                    return $scope.rowCollection = [];
                $scope.isLoading = true;
                AcdModel.list($scope.domain, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.rowCollection = res;
                });
            };

            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();
    }])
});
