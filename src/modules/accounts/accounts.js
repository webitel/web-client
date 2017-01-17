define(['app', 'scripts/webitel/utils',  'async', 'modules/accounts/accountModel', 'css!modules/accounts/account.css'], function (app, utils, async) {

    app.controller('AccountsCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'AccountModel', '$route', '$location', '$routeParams',
        '$confirm', '$timeout', 'TableSearch', '$modal',
        function ($scope, webitel, $rootScope, notifi, AccountModel, $route, $location, $routeParams, $confirm, $timeout, TableSearch, $modal) {
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
        $scope.options = {
            multiInsert: false
        };

        $scope.query = TableSearch.get('account'); //$routeParams.search;

        $scope.changePanel = function (panelStatistic) {
            $scope.panelStatistic = !!panelStatistic;
        };

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'account')
        });

        $scope.displayedCollection = [];

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        if (!$route.current.method) {
            
            var findAccountInRowCollection = function (id, domain) {
                if (!$scope.rowCollection)
                    return;

                for (var i = 0, len = $scope.rowCollection.length; i < len; i++)
                    if ($scope.rowCollection[i].id == id && $scope.rowCollection[i].domain == domain)
                        return $scope.rowCollection[i];
            };

            var fnOnUserStatusChange = function (e) {
                if (e["Account-Domain"] != $scope.domain)
                    return;

                // var $row = $("#account-" + e["Account-User"]);
                // // TODO ??? perf
                // $row.find('td.account-state span').removeClass().addClass(e['Account-User-State'].toLocaleLowerCase()).text(e['Account-User-State']);
                // $row.find('td.account-status span').removeClass().addClass(e['Account-Status'].toLocaleLowerCase()).text(e['Account-Status']);
                var descript = e['Account-Status-Descript'] || "";
                // $row.find('td.account-descript').text(decodeURIComponent(descript));

                var user = findAccountInRowCollection(e["Account-User"], e["Account-Domain"]);
                if (user) {
                    user.state = e['Account-User-State'];
                    user.status = e['Account-Status'];
                    user.descript = descript;
                    $scope.$apply();
                }
            };
            var fnOnUserOnline = function (e) {
                if (e["User-Domain"] != $scope.domain)
                    return;
                var user = findAccountInRowCollection(e["User-ID"], e["User-Domain"]);
                if (user) {
                    user.online = true;
                    $scope.$apply();
                }
                // $("#account-" + e["User-ID"] + ' .account-online span').removeClass().addClass('true')
            };
            var fnOnUserOffline = function (e) {
                if (e["User-Domain"] != $scope.domain)
                    return;

                var user = findAccountInRowCollection(e["User-ID"], e["User-Domain"]);
                if (user) {
                    user.online = false;
                    $scope.$apply();
                }
                // $("#account-" + e["User-ID"] + ' .account-online span').removeClass().addClass('false')
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

        $scope.viewPassword = false;
        $scope.genPassword = function (ac) {
            ac.password = genString(16);
        };

        $scope.toggleViewPassword = function () {
            $scope.viewPassword = !$scope.viewPassword;
        };

        function genString(num) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_+";

            for( var i=0; i < num; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }

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
                }
            };
            if ($scope.account._new) {
                if ($scope.options.multiInsert) {
                    if (+$scope.options.to > +$scope.account.id) {
                        var iterator = +$scope.account.id;
                        var ids = [];
                        while (iterator <= +$scope.options.to)
                            ids.push(iterator++);

                        async.eachSeries(ids, function (id, cb) {
                            $scope.account.id = id;
                            AccountModel.add($scope.account, function (err) {
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
                    AccountModel.add($scope.account, cb);
                }
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

        $scope.changeStatus = function (row) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/accounts/changeStatus.html',
                controller: 'AccountStateCtrl',
                // size: 'md',
                resolve: {
                    options: function () {
                        var state, status, id, isAgent, domain;
                        if (row) {
                            id = row.id;
                            domain = row.domain;
                            state = row.state;
                            status = row.status;
                            isAgent = row.agent === 'true';
                        } else {
                            // TODO page
                        }
                        return {
                            id: id,
                            domain: domain,
                            state: state,
                            status: status,
                            isAgent: isAgent
                        };
                    }
                }
            });

            modalInstance.result.then(function (result) {
                if (result.update) {
                    reloadData();
                }
            }, function () {

            });
        };
            
        $scope.showImportPage = function () {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/accounts/importCsv.html',
                controller: AccountImportCtrl,
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                        };
                    }
                }
            });

            modalInstance.result.then(function (result) {

                if (result.headers)
                    result.data.shift();

                async.eachSeries(result.data,
                    function (item, cb) {
                        createAccountFromTemplate(item, result.template, cb)
                    },
                    
                    function (err) {
                        if (err)
                            return notifi.error(err);
                    }
                )

            });

            function createAccountFromTemplate(data, template, cb) {
                var account = AccountModel.create();
                var updateValues = {};
                angular.forEach(template, function (val, key) {
                    if (key === 'variables') {
                        angular.forEach(template.variables, function (val, key) {
                            account.variables.push({
                                key: key,
                                value: data[template.variables[key]]
                            })
                        });

                        if (account.variables && account.variables.length > 0)
                            updateValues.variables = account.variables;

                    } else {
                        var _val = data[template[key]];
                        if (key === "cc-agent") {
                            if (!isNaN(_val)) {
                                _val = +_val > 0;
                            } else {
                                _val = _val.toLowerCase() === 'true'
                            }
                        }
                        updateValues[key] = account[key] = _val
                    }
                });

                if (!account.id)
                    return cb();

                findAgentInCollection($scope.domain, account.id, function (err, data) {
                    if (err) {
                        notifi.error(err, 5000);
                        return cb()
                    }

                    if (data) {
                        angular.extend(account, data);
                        delete updateValues.id;
                        AccountModel.update(account, $scope.domain, updateValues, $scope.remVar, function (err, res) {
                            if (err) {
                                notifi.error(err, 5000);
                            } else {
                                notifi.info('Updated ' + account.id, 5000);
                            }
                            return cb()
                        })
                    } else {
                        account.domain = $scope.domain;
                        AccountModel.add(account, function (err, res) {
                            if (err) {
                                notifi.error(err, 5000);
                            } else {
                                notifi.info('Created ' + account.id, 5000);
                            }
                            return cb()
                        })
                    }
                });
            }


            function findAgentInCollection(domainName, id, cb) {
                if (!$scope.rowCollection)
                    return cb(null, null);

                for (var i = 0; i < $scope.rowCollection.length; i++) {
                    if ($scope.rowCollection[i].id == id) {
                        return AccountModel.item(domainName, id, cb)
                    }
                }
                return cb(null, null)
            }
        }
    }]);

    
    function AccountImportCtrl($scope, $modalInstance, notifi) {
        $scope.settings = {
            separator: ';',
            headers: true,
            charSet: 'utf-8',
            data: [],
            template: {}
        };

        $scope.previewData = [];
        $scope.columns = [];


        $scope.fileCsvOnLoad = function (data) {
            var members = utils.CSVToArray(data, $scope.settings.separator);
            $scope.settings.data = members;
            $scope.columns = [];

            $scope.previewData = members.slice(0, 5);

            for (var i = 0; i < $scope.previewData[0].length; i++)
                $scope.columns.push({
                    id: i,
                    value: ""
                });
        };

        $scope.ok = function () {
            var template = {
                id: null,
                variables: {}
            };

            angular.forEach($scope.columns, function (item) {
                var c = $scope.AccountColumns[item.value];
                if (c) {
                    if (!c.type) {
                        template[c.field] = item.id;
                    } else if (c.type === 'variable' && item.varName) {
                        template.variables[item.varName] = item.id;
                    }
                }
            });
            if (template.id === null)
                return notifi.error(new Error('Bad settings.'), 5000);

            $scope.settings.template = template;
            $modalInstance.close($scope.settings, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.AccountColumns = {
            "id": {
                selected: false,
                name: "Number (Id)",
                field: 'id'
            },
            "password": {
                selected: false,
                name: "Password",
                field: 'password'
            },
            "vm-password": {
                selected: false,
                name: "Access PIN",
                field: 'vm-password'
            },
            "variable_account_role": {
                selected: false,
                name: "Role",
                field: 'variable_account_role'
            },
            "variable_effective_caller_id_name": {
                selected: false,
                name: "Name",
                field: 'variable_effective_caller_id_name'
            },
            "variable": {
                "name": "Variable",
                "field": "variable",
                "type": "variable",
                "value": "",
                "varName": ""
            },
            "cc-agent": {
                name: "Agent",
                field: "cc-agent"
            },
            "cc-agent-contact": {
                name: "Call timeout",
                field: "cc-agent-contact"
            },
            "cc-agent-wrap-up-time": {
                name: "Wrap up time",
                field: "cc-agent-wrap-up-time"
            },
            "cc-agent-max-no-answer": {
                name: "Max no answer",
                field: "cc-agent-max-no-answer"
            },
            "cc-agent-busy-delay-time": {
                name: "Busy delay time",
                field: "cc-agent-busy-delay-time"
            },
            "cc-agent-reject-delay-time": {
                name: "Reject delay time",
                field: "cc-agent-reject-delay-time"
            },
            "cc-agent-no-answer-delay-time": {
                name: "No answer delay time",
                field: "cc-agent-no-answer-delay-time"
            }
        };

        $scope.CharSet = utils.CharSet;
    }
    
    app.controller('AccountStatisticCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
        var timerId = null;
        $scope.$watch('$parent.panelStatistic', function(val){
            if (val)
                $timeout(function(){
                    window.dispatchEvent(new Event('resize'));
                }, 0);
        });
        $scope.data;
        $scope.$watch('$parent.rowCollection', function (val) {
            $timeout.cancel(timerId);
            timerId = $timeout(function () {
                updateState(val);
            }, 500);
        }, true);

        var stateSettings = {
            "ONHOOK": {
                color: "#309570"
            },
            "ISBUSY": {
                color: "#e9422e"
            },
            "NONREG": {
                color: "#f3f3f3"
            }
        };
        var statusSettings = {
            "NONE": {
                color: "#f3f3f3"
            },
            "DND": {
                color: "#e9422e"
            },
            "ONBREAK": {
                color: "#fac552"
            },
            "AGENT": {
                color: "#e9422e"
            }
        };

        function updateState(collection) {
            accountState.data =  [
            ];
            accountStatus.data =  [
            ];
            accountOnline.data =  [
                {
                    key: "Online",
                    y: 0
                },
                {
                    key: "Offline",
                    y: 0
                }
            ];

            var state = {}, status = {};
            angular.forEach(collection, function (item) {
                // if (accountState.data.length > 10) return
                if (state.hasOwnProperty(item.state)) {
                    state[item.state]++
                } else {
                    state[item.state] = 1
                }
                if (status.hasOwnProperty(item.status)) {
                    status[item.status]++
                } else {
                    status[item.status] = 1
                }

                accountOnline.data[item.online ? 0 : 1].y++;
            });

            accountState.data.push({
                key: 'State',
                values: []
            });
            angular.forEach(stateSettings, function (item, key) {
                accountState.data[0].values.push({
                    x: key,
                    y: state[key] || 0
                })
            });

            angular.forEach(statusSettings, function (item, key) {
                accountStatus.data.push({
                    key: key,
                    y: status[key] || 0
                })
            });


            $timeout(function () {
                $scope.$apply();
            });
        }

        var accountState = $scope.accountState = {
            options: {
                "chart": {
                    "type": "multiBarHorizontalChart",
                    "height": 250,
                    "showControls": false,
                    "showValues": true,
                    "showLegend": false,
                    valueFormat: function (d) {
                        return d3.format(',f')(d)
                    },
                    "barColor": function (i) {
                        if (stateSettings.hasOwnProperty(i.x)) {
                            return stateSettings[i.x].color;
                        }
                    },
                    "duration": 500,
                    tooltip: {
                        enabled: true,
                        valueFormatter: function (d) {
                            return d3.format(',f')(d)
                        }
                    },
                    "xAxis": {
                        "showMaxMin": false
                    },
                    "yAxis": {
                        "axisLabel": "Values",
                        tickFormat: function (d) {
                            return d3.format(',f')(d)
                        }
                    }
                }
            }
        };

        var accountStatus = $scope.accountStatus = {
            options: {
                chart: {
                    type: 'pieChart',
                    margin: {
                        top: 40,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
                    tooltip: {
                        enabled: true,
                        valueFormatter: function (d) {
                            return d3.format(',f')(d)
                        }
                    },
                    height: 350,
                    x: function(d){
                        return d.key;
                    },
                    y: function(d){
                        return d.y;
                    },
                    color: function (i) {
                        if (statusSettings.hasOwnProperty(i.key)) {
                            return statusSettings[i.key].color;
                        }
                    },
                    showLabels: true,
                    showLegend: true,
                    donutRatio: 0.3,
                    donut: true,
                    transitionDuration: 500,
                    labelThreshold: 0.02,
                    legendPosition: "right",
                    legend: {
                        vers: 'furious'
                    }
                },
                data: [] // {key, y}
            }
        };

        var accountOnline = $scope.accountOnline = {
            options: {
                chart: {
                    type: 'pieChart',
                    height: 350,
                    donut: true,
                    x: function(d){return d.key;},
                    y: function(d){return d.y;},
                    showLabels: true,
                    color: function (i) {
                        return i.key == 'Online' ?  "#309570" : "#e9422e";
                    },
                    tooltip: {
                        enabled: true,
                        valueFormatter: function (d) {
                            return d3.format(',f')(d)
                        }
                    },
                    donutRatio: 0.3,
                    pie: {
                        startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
                        endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
                    },
                    duration: 500,
                    legendPosition: "right",
                    legend: {
                        vers: 'furious'
                    },
                    legend: {
                        margin: {
                            top: 5,
                            right: 70,
                            bottom: 5,
                            left: 0
                        }
                    }
                }
            }
        };
    }]);

    app.controller('AccountStateCtrl', ['$scope', 'options', '$modalInstance', 'AcdModel', 'notifi', 'AccountModel',
    function ($scope, options, $modalInstance, AcdModel, notifi, AccountModel) {
        $scope.states = ["ONHOOK", "ISBUSY"];
        $scope.statuses = ["DND", "ONBREAK"];

        $scope.agentStates = ["Waiting", "Idle"];
        $scope.agentStatuses = ["Logged Out", "Available", "Available (On Demand)", "On Break"];

        $scope.isAgent = options.isAgent;

        var agentDump = {};
        
        $scope.initAgent = function () {
            AcdModel.getAgentParams(options.id, options.domain, function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                $scope.ac.agent = {
                    state: res.state,
                    status: res.status
                };

                agentDump = {
                    state: res.state,
                    status: res.status
                };
            })
        };

        $scope.ac = {
            state: options.state,
            status: options.state == $scope.states[0] ? null : options.status,
            agent: {
                state: null,
                status: null
            }
        };
        
        $scope.changeUser = function () {
            var status = $scope.ac.state == $scope.states[0] ? $scope.states[0] : $scope.ac.status;
            AccountModel.setStatus(options.id, options.domain, status, function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                $modalInstance.close({update: true}, 5000);
            });
        };
        
        $scope.changeAgent = function () {

            async.waterfall([
                function (cb) {
                    if (agentDump.state != $scope.ac.agent.state) {
                        AcdModel.setAgentState(options.id, options.domain, $scope.ac.agent.state, cb)
                    } else {
                        cb(null, {});
                    }
                },

                function (res, cb) {
                    if (agentDump.status != $scope.ac.agent.status) {
                        AcdModel.setAgentStatus(options.id, options.domain, $scope.ac.agent.status, cb)
                    } else {
                        cb(null);
                    }
                }
            ], function (err, res) {
                if (err)
                    return notifi.error(err);
                notifi.info('Ok: change agent ' + options.id, 3000);
                $modalInstance.close({update: true}, 5000);
            });
        };

        $scope.isNonReg = $scope.ac.state == 'NONREG';
        
        $scope.$watch('ac.state', function (val) {
            if (val == $scope.states[0]) {
                $scope.ac.status = null;
            }
        });

        $scope.accountId = options.id;

        $scope.ok = function () {
            $modalInstance.close({}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
});