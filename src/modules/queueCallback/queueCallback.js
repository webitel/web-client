/**
 * Created by igor on 18.04.17.
 */

"use strict";

define(['app', 'scripts/webitel/utils', 'modules/queueCallback/queueCallbackModel', 'modules/queueCallback/memberModel',
'modules/accounts/accountModel'], function (app, utils) {
    app.controller("QueueCallbackCtrl", ['$scope', '$modal', '$routeParams', '$filter',
        '$location', '$route', 'notifi', '$confirm', 'webitel', 'TableSearch', '$timeout', '$rootScope', 'QueueCallbackModel',
        'AccountModel',
        function ($scope, $modal, $routeParams, $filter, $location, $route, notifi, $confirm, webitel, TableSearch,
                  $timeout, $rootScope, QueueCallbackModel, AccountModel) {

            var self = $scope;
            $scope.displayedCollection = [];
            $scope.isLoading = false;

            $scope.domain = webitel.domain();

            $scope.canDelete = true || webitel.connection.session.checkResource('callback', 'd');
            $scope.canUpdate = true || webitel.connection.session.checkResource('callback', 'u');
            $scope.canCreate = true || webitel.connection.session.checkResource('callback', 'c');

            $scope.viewMode = !$scope.canUpdate;

            $scope.selAgents = {};
            $scope.selTiers = {};
            $scope.agents = [];
            $scope.tiers = [];
            $scope.agentList = {};

            $scope.changePanel = function (panelStatistic) {
                $scope.panelStatistic = !!panelStatistic;
            };

            $scope.query = TableSearch.get('callback');

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'callback');
            });

            self.queueCallback = {agents: []};

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                if ($scope.tableState)
                    reloadData();
            }, true);

            $scope.$watch('queueCallback', function(newValue, oldValue) {
                if ($scope.queueCallback._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue.id;
            }, true);

            $scope.cancel = function () {
                $scope.queueCallback = angular.copy($scope.oldQueueCallback);
                disableEditMode();
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            }

            self.reloadData = reloadData;
            self.closePage = closePage;
            self.create = create;
            self.save = save;
            self.edit = edit;
            self.removeItem = removeItem;
            self.callServer = getData;

            function removeItem(row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        QueueCallbackModel.remove(row.id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData();
                        });
                    });
            }

            function create() {
                $scope.queueCallback._new = true;
            };

            function save() {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.queueCallback._new) {
                        return $location.path('/queue/callback/' + res.data.id + '/edit');
                    } else {
                        $scope.queueCallback.__time = Date.now();
                        return edit();
                    };
                };
                if ($scope.queueCallback._new) {
                    QueueCallbackModel.add(angular.copy($scope.queueCallback), $scope.domain, cb);
                } else {
                    QueueCallbackModel.update($scope.queueCallback, $scope.queueCallback.id, $scope.domain, cb);
                }
            }

            function edit () {
                var id = $routeParams.id;
                var domain = $scope.domain;

                QueueCallbackModel.item(id, domain, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    };

                    $scope.oldQueueCallback = angular.copy(item);
                    $scope.queueCallback = item;
                    if (!$scope.queueCallback.agents) {
                        $scope.queueCallback.agents = [];
                    }
                    disableEditMode();
                });
            }

            function closePage() {
                $location.path('/queue/callback');
            }


            function reloadData () {
                $scope.tableState.pagination.start = 0;
                getData($scope.tableState)
            }

            var _page = 1;
            var nexData = true;
            var col = encodeURIComponent(JSON.stringify({
                name: 1,
                description: 1,
                id: 1
            }));
            var maxNodes = 40;
            function getData(tableState) {
                $scope.tableState = tableState;
                if ($scope.isLoading) return void 0;

                if (!$scope.domain) {
                    _page = 1;
                    nexData = true;
                    $scope.rowCollection = [];
                    $scope.count = 0;
                    return
                }

                if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                    _page = 1;
                    nexData = true;
                    $scope.rowCollection = [];
                    $scope.count = 0;
                }
                if (!nexData) return void 0;

                console.debug("Page:", _page);
                $scope.isLoading = true;
                var sort ={};

                if (tableState.sort.predicate)
                    sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

                $scope.isLoading = true;
                sort = encodeURIComponent(JSON.stringify(sort));
                var filter = undefined;
                if ($scope.query) {
                    filter = encodeURIComponent(JSON.stringify({
                        name: $scope.query
                    }));
                }

                QueueCallbackModel.list({
                    columns: col,
                    limit: maxNodes,
                    page: _page,
                    filter: filter,
                    sort: sort,
                    domain: $scope.domain
                }, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);

                    _page++;
                    var data = res.data || [];
                    nexData = data.length === maxNodes;
                    $scope.rowCollection = $scope.rowCollection.concat(data);
                });

            }


            $scope.addTiers = function (all) {
                var collection = all ? $scope.agents : $scope.selAgents;
                if (!collection.length) {
                    angular.forEach(collection, function (i, key) {
                        if (!i) return;
                        if (!~$scope.queueCallback.agents.indexOf(key)) {
                            $scope.queueCallback.agents.push(key);
                        }
                    })
                } else {
                    angular.forEach(collection, function (i) {
                        if (!~$scope.queueCallback.agents.indexOf(i.id)) {
                            $scope.queueCallback.agents.push(i.id);
                        }
                    })
                }
                $scope.selAgents = {};
                $scope.selTiers = {};
            };

            $scope.getCountAgents = function (agents) {
                if (agents && agents.length > 0) {
                    var i = 0;
                    angular.forEach(agents, function (agent) {
                        if (isAgentInTier(agent)) {
                            i++;
                        }
                    });
                    return i;
                }
                return 0;
            };

            function isAgentInTier(a) {
                if (!$scope.queueCallback)
                    return false;
                return !~$scope.queueCallback.agents.indexOf(a.id);
            }

            $scope.copyList = function (list, skipTiers, filename) {
                var text = 'number,name,state,status,role\n';
                angular.forEach(list, function (item) {
                    if (skipTiers && !isAgentInTier(item)) {
                        return;
                    }

                    if (typeof item === 'string') {
                        item = findAgentById(item);
                        if (!item) {
                            console.error('findAgentById not found ', item);
                            return;
                        }
                    }
                    text += item.id + ',' + item.name + ',' + item.state + ',' + item.status + ',' + item.role + '\n';
                });

                utils.saveDataToDisk(text, filename + '.csv', 'text/csv');
            };

            function findAgentById(agentId) {
                var agents = $scope.agents;
                if (!angular.isArray(agents)) {
                    return null;
                }

                for (var i = 0; i < agents.length; i++) {
                    if (agents[i].id === agentId)
                        return agents[i]
                }
            }

            $scope.isAgentInTier = isAgentInTier;

            $scope.removeTiers = function (all) {
                if (all) {
                    $scope.selTiers = {};
                    return $scope.queueCallback.agents = [];
                }

                var collection = $scope.selTiers;
                angular.forEach(collection, function (i, key) {
                    if (!i) return;
                    if (~$scope.queueCallback.agents.indexOf(key)) {
                        $scope.queueCallback.agents.splice($scope.queueCallback.agents.indexOf(key), 1);
                    }
                });
                $scope.selAgents = {};
                $scope.selTiers = {};
            };

            var agentsIds = [];

            $scope.loadAgents = function () {
                AccountModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var data =  $scope.agentList = res.data || res.info;
                    agentsIds = [];
                    angular.forEach(data, function (i) {
                        /*
                        if (!i.agent || i.agent === "false") {
                            return;
                        }
                        */
                        $scope.agents.push(i);
                        agentsIds.push(i.id);
                    });

                    if (angular.isArray($scope.queueCallback.agents)) {
                        for (var i = 0; i < $scope.queueCallback.agents.length; i++)
                            if (!~agentsIds.indexOf($scope.queueCallback.agents[i]))
                                $scope.queueCallback.agents.splice(i, 1)
                    }
                })
            };



            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                }
            }();

        }]);

    app.controller('MemberCallbackCtrl', ['$scope', 'MemberCallbackModel', '$modal', '$confirm', 'notifi', 'FileUploader', 'webitel',
        'cfpLoadingBar',
        function ($scope, MemberCallbackModel, $modal, $confirm, notifi, FileUploader, webitel, cfpLoadingBar) {

            $scope.canDeleteMember = true || webitel.connection.session.checkResource('callback/members', 'd');
            $scope.canUpdateMember = true || webitel.connection.session.checkResource('callback/members', 'u');
            $scope.canCreateMember = true || webitel.connection.session.checkResource('callback/members', 'c');

            $scope.viewModeMember = !$scope.canUpdateMember;

            $scope.$watch('isLoading', function (val) {
                if (val) {
                    cfpLoadingBar.start()
                } else {
                    cfpLoadingBar.complete()
                }
            });


            $scope.membersRowCollection = [];
            $scope.member = {};
            $scope.reloadMemberData = reloadMemberData;

            var _page = 1;
            var nexData = true;
            var col = encodeURIComponent(JSON.stringify({
                number: 1,
                href: 1,
                done: 1,
                id: 1
            }));
            var maxNodes = 40;

            $scope.callServer = getData;
            function getData(tableState) {
                if ($scope.isLoading) return void 0;

                if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                    _page = 1;
                    nexData = true;
                    $scope.membersRowCollection = [];
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
                if(tableState.search.predicateObject){
                    delete tableState.search.predicateObject.$;
                    if(tableState.search.predicateObject.done){
                        var search = angular.copy(tableState.search.predicateObject);
                        search.done = search.done == "true" ? true : false;
                    }
                }

                var filter = encodeURIComponent(JSON.stringify(search||{}))

                MemberCallbackModel.list({
                    columns: col,
                    filter: filter,
                    sort: sort,
                    limit: maxNodes,
                    page: _page,
                    domain: $scope.domain
                }, $scope.queueCallback.id, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);

                    _page++;
                    nexData = res.length === maxNodes;
                    $scope.membersRowCollection = $scope.membersRowCollection.concat(res);
                });

            }
           // $scope.getMembers = getMembers;
            function reloadMemberData () {
                /*if ($location.$$path != '/queueCallback')
                    return 0;*/
                if (!$scope.domain)
                    return $scope.membersRowCollection = [];

                $scope.tableState.pagination.start = 0;

                getData($scope.tableState);

            }
            // $scope.$watch('queueCallback', function(newValue, oldValue) {
            //     if(newValue&&Object.keys(newValue).length!==0 && !$scope.isNew && newValue.id != oldValue.id)
            //         reloadMemberData();
            // }, true);

           $scope.addMember = function () {
                var modalInstance = $modal.open({
                    animation: true,
                    windowClass: "large-modal-window",
                    templateUrl: '/modules/queueCallback/memberEditPage.html',
                    controller: 'MemberPageCtrl',
                    size: 'lg',
                    resolve: {
                        options: function () {
                            return {
                                queue: $scope.queueCallback,
                                domain: $scope.domain,
                                widgetId: $scope.queueCallback.widgetId
                            };
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    var member = {};
                    angular.forEach(result.value, function (v, k) {
                        member[k] = v;
                    });
                    $scope.membersRowCollection = [].concat(member, $scope.membersRowCollection);
                }, function () {

                });
            };

            $scope.editMember = function (member, index, viewMode) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/queueCallback/memberEditPage.html',
                    windowClass: "large-modal-window",
                    controller: 'MemberPageCtrl',
                    size: 'lg',
                    resolve: {
                        options: function () {
                            return {
                                viewMode: viewMode,
                                member: member,
                                queue: $scope.queueCallback,
                                domain: $scope.domain,
                                widgetId: $scope.queueCallback.widgetId
                            };
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    var member = result.value;
                    angular.forEach(member, function (v, k) {
                        $scope.membersRowCollection[index][k] = v;
                    });
                }, function () {

                });
            };

            $scope.removeMember = function (row, index) {
                $confirm({text: 'Are you sure you want to delete resource ' + row.number + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        MemberCallbackModel.remove(row.id, $scope.queueCallback.id, $scope.domain,  function (err) {
                            if (err)
                                return notifi.error(err, 5000);

                            $scope.membersRowCollection.splice(index, 1);
                        })
                    });
            };

        }]);
    app.controller('MemberPageCtrl', ['$scope', '$confirm', '$modalInstance', 'notifi', 'MemberCallbackModel', 'options',
        function ($scope, $confirm, $modalInstance, notifi, MemberCallbackModel, options) {
            $scope.commentsRowCollection = [];
            $scope.displayedCommentCollection = [];
            //$scope.logsRowCollection = [];
            $scope.displayedLogsRowCollection = [];
            $scope.comment = {text: ""};
            $scope.doneAt = {};
            $scope.calop = false;

            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);

            $scope.openDate = function () {$scope.calop = !$scope.calop;}
            $scope.onChangeDate = function (val) {
                if (val)
                    $scope.member.callback_time = val.getTime();
            };
            $scope.callback_time = today;
            if (options && options.member) {
                MemberCallbackModel.item(options.member.id, options.queue.id, options.domain, function (err, data) {
                    if (err)
                        return notifi.error(err);
                    $scope.member = data;
                    if($scope.member.done_at) $scope.doneAt = {value:convertToDate($scope.member.done_at)};
                    if($scope.member.callback_time) $scope.callback_time = convertToDate($scope.member.callback_time);
                    else{$scope.member.callback_time = $scope.callback_time.getTime();}
                    if($scope.member.comments){
                        $scope.commentsRowCollection = $scope.member.comments;
                        $scope.commentsRowCollection.reverse();
                    }
                    if($scope.member.comments){
                        $scope.commentsRowCollection = $scope.member.comments;
                        $scope.commentsRowCollection.reverse();
                    }
                });
            } else {
                $scope.member = {
                    _new: true,
                    queue_id: options.queue.id,
                    domain: options.domain,
                    callback_time: $scope.callback_time.getTime()
                    //widgetId: options.widgetId
                };
            }

            //$scope.isAdd = false;
            function addComment() {
                if($scope.comment.text){
                    var cb = function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);
                        //$scope.commentsRowCollection = [].concat(res.data, $scope.commentsRowCollection);
                        $scope.commentsRowCollection.unshift(res.data);
                        $scope.comment.text = "";
                    };
                    MemberCallbackModel.addComment($scope.comment, options.queue.id, $scope.member.id, options.domain, cb)
                }
            }
            function editComment(row){
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);
                    row._editMode = false;
                };
                var data = {
                    text: row.text
                };
                MemberCallbackModel.updateComment(data, options.queue.id, options.member.id, row.id, options.domain, cb);
            }
            function commentEditMode(row){
                row._editMode = true;
            }
            function deleteComment(row, index){
                $confirm({text: 'Are you sure you want to delete resource ' + row.text + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        MemberCallbackModel.removeComment(options.queue.id, $scope.member.id, row.id, options.domain,  function (err) {
                            if (err)
                                return notifi.error(err, 5000);

                            $scope.commentsRowCollection.splice(index, 1);
                        })
                    });
            }
            function convertToDate(timestamp){
                if(timestamp)
                    return new Date(+timestamp).toString().split("GMT")[0];
                else return new Date();
            }
            function ok () {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);
                    var ins = res.data;
                    if (ins) {
                        $scope.member.id = ins.id;
                    }
                    $modalInstance.close({value: $scope.member}, 5000);
                };

                if (options.member && options.member.id) {
                    MemberCallbackModel.update($scope.member, options.queue.id, options.member.id, options.domain, cb);
                } else {
                    MemberCallbackModel.add($scope.member, options.queue.id,  options.domain, cb);
                };
            };
            function cancel () {
             $modalInstance.dismiss('cancel');
            };

            $scope.convertToDate = convertToDate;
            $scope.cancel = cancel;
            $scope.ok = ok;
            $scope.addComment = addComment;
            $scope.deleteComment = deleteComment;
            $scope.editComment = editComment;
            $scope.commentEditMode = commentEditMode;

        }]);
});