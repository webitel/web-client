define(['app', 'async', 'modules/accounts/accountModel', 'modules/vMail/vMailModel'], function (app, async) {

    app.controller('VoiceMailCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'AccountModel', 'VoiceMailModel', '$confirm',
        function ($scope, webitel, $rootScope, notifi, AccountModel, VoiceMailModel, $confirm) {

            $scope.canDelete = webitel.connection.session.checkResource('vmail', 'd') || webitel.connection.session.checkResource('vmail', 'do');
            $scope.canUpdate = webitel.connection.session.checkResource('vmail', 'u') || webitel.connection.session.checkResource('vmail', 'uo');
            $scope.canAllList = webitel.connection.session.checkResource('vmail', 'r');

            $scope.domain = webitel.domain();

            $scope.users = [];
            $scope.mails = [];
            $scope.menu = '';

            $scope.state = {
                user: {},
                selected: [],
                isLoading: false,
                newCount: 0,
                all: 0
            };

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.$watch('state.user', function (val) {
                refreshData(val.id, $scope.domain);
            });

            $scope.setState = function (state, ids, user) {
                if (ids.length === 0) {
                    return;
                }
                $scope.state.isLoading = true;
                async.eachSeries(
                    ids,
                    function (id, cb) {
                        VoiceMailModel.setState(user.id, $scope.domain, id, state, cb)
                    },
                    function (err) {
                        if (err)
                            notifi.error(err, 5000);

                        $scope.state.isLoading = false;
                        refreshData(user.id, $scope.domain)
                    }
                )
            };

            $scope.remove = function (ids, user) {
                if (ids.length === 0) {
                    return;
                }

                $confirm({text: 'Are you sure you want to remove ' + ids.length + ' record ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        $scope.state.isLoading = true;
                        async.eachSeries(
                            ids,
                            function (id, cb) {
                                VoiceMailModel.remove(user.id, $scope.domain, id, cb)
                            },
                            function (err) {
                                if (err)
                                    notifi.error(err, 5000);

                                $scope.state.isLoading = false;
                                refreshData(user.id, $scope.domain)
                            }
                        )
                    });
            };

            function refreshData(id, domain) {
                $scope.mails = [];
                $scope.state.newCount = 0;
                $scope.state.all = 0;
                $scope.state.selected = [];

                if (id && domain) {
                    VoiceMailModel.list(id, domain, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);

                        var data = res.info || res.data;
                        angular.forEach(data, function (item) {
                            if (item.readOn == 0) {
                                item.state = 'new';
                                $scope.state.newCount++;
                            } else {
                                item.state = '';
                            }
                            $scope.state.all++;
                            $scope.mails.push(item);
                        });
                    });
                }
            }

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                var _u = webitel.connection.session.username.split('@')[0];
                if (domainName) {
                    if (!$scope.canAllList) {
                        if (webitel.connection.session.domain) {

                            $scope.state.user = {
                                id: _u,
                                name: _u
                            };
                            $scope.users.push({
                                id: _u,
                                name: _u
                            })
                        }
                        return;
                    }
                    AccountModel.list(domainName, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);

                        var users = res && (res.info || res.data);
                        clearState();
                        angular.forEach(users, function (item, key) {
                            $scope.users.push({
                                id: item.id,
                                name: item.name
                            });

                            if (key === _u) {
                                $scope.state.user = {
                                    id: item.id,
                                    name: item.name
                                }
                            }
                        })
                    });
                } else {
                    clearState()
                }
            });
            
            function clearState() {
                $scope.users = [];
                $scope.state.user = {};
            }
            
            $scope.select = function (type) {
                $scope.state.selected = [];
                switch (type) {
                    case 'all':
                        angular.forEach($scope.mails, function (item) {
                            item.selected = true;
                            selectItem(item.uuid);
                        });
                        break;
                    case 'new':
                        angular.forEach($scope.mails, function (item) {
                            if (item.readOn == 0) {
                                item.selected = true;
                                selectItem(item.uuid);
                            } else {
                                item.selected = false;
                            }
                        });
                        break;
                    case 'read':
                        angular.forEach($scope.mails, function (item) {
                            if (item.readOn == 0) {
                                item.selected = false;
                            } else {
                                item.selected = true;
                                selectItem(item.uuid);
                            }
                        });
                        break;
                }

            };

            function selectItem(id) {

                var pos = $scope.state.selected.indexOf(id);
                if (~pos) {
                    $scope.state.selected.splice(pos, 1);
                } else {
                    $scope.state.selected.push(id);
                }
                return true;
            }
            $scope.selectItem = selectItem;

            $scope.epohTimeToString = function (epoh) {
                if (!epoh)
                    return '-';
                return new Date(epoh * 1000).toLocaleString();
            };
    }]);
    
    app.filter('voiceMailSection', function () {
        return function (input, menu) {
            if (input.length > 0) {
                if (menu === 'new') {
                    return input.filter(function (item) {
                        return item.readOn == 0
                    })
                } else if (menu === 'read') {
                    return input.filter(function (item) {
                        return item.readOn > 0
                    })
                }
            }

            return input
        }
    })
});
