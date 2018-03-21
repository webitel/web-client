define(['app', 'scripts/webitel/utils', 'modules/callflows/editor', 'modules/callflows/callflowUtils',
    'modules/cdr/libs/fileSaver', 'moment', 'modules/gateways/gatewayModel', 'modules/dialer/dialerModel', 'modules/acd/acdModel',
    'modules/calendar/calendarModel',  'modules/cdr/libs/json-view/jquery.jsonview', 'modules/cdr/fileModel',
    'modules/accounts/accountModel', 'modules/media/mediaModel', 'modules/gateways/gatewayModel', 'modules/dialer/agentModel', 'modules/dialer/memberTemplate', 'css!modules/dialer/dialer.css',
    'modules/accounts/accounts', 'modules/callflows/diagram/diagram', 'css!modules/callflows/diagram/diagram.css'
], function (app, utils, aceEditor, callflowUtils, fileSaver, moment) {


    function moveUp (arr, value, by) {
        if (!arr)
            arr = [];

        var index = arr.indexOf(value),
            newPos = index - (by || 1);

        if(index === -1)
            throw new Error("Element not found in array");

        if(newPos < 0)
            newPos = 0;

        arr.splice(index,1);
        arr.splice(newPos,0,value);
    }
    function moveDown(arr, value, by) {
        if (!arr)
            arr = [];
        var index = arr.indexOf(value),
            newPos = index + (by || 1);

        if(index === -1)
            throw new Error("Element not found in array");

        if(newPos >= arr.length)
            newPos = arr.length;

        arr.splice(index, 1);
        arr.splice(newPos,0, value);
    }

    function timeToString(time) {
        if (time)
            return new Date(time).toLocaleString();
    }

    app.controller('DialerCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DialerModel', '$location', '$route', '$routeParams',
        '$confirm', 'TableSearch', '$timeout', '$modal', 'CalendarModel', 'AccountModel', '$q', '$filter', 'MediaModel', 'GatewayModel', 'AcdModel', 'cfpLoadingBar', 'FileUploader',
        function ($scope, webitel, $rootScope, notifi, DialerModel, $location, $route, $routeParams, $confirm, TableSearch,
                  $timeout, $modal, CalendarModel, AccountModel, $q, $filter, MediaModel, GatewayModel, AcdModel, cfpLoadingBar, FileUploader) {

            $scope.canDelete = webitel.connection.session.checkResource('dialer', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('dialer', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('dialer', 'c');

            $scope.canCreateTemplate = webitel.connection.session.checkResource('dialer/templates', 'r');

            $scope.domain = webitel.domain();
            $scope.dialer = {};

            $scope.isLoading = false;

            $scope.diagramOpened = false;
            $scope.cfDiagram = null;

            $scope.$watch('isLoading', function (val) {
                if (val) {
                    cfpLoadingBar.start()
                } else {
                    cfpLoadingBar.complete()
                }
            });

            $scope.viewMode = !$scope.canUpdate;

            $scope.view = function () {
                $scope.viewMode = true;
                edit();
            };


            $scope.query = TableSearch.get('dialer');
           // $scope.cf = aceEditor.getStrFromJson([]);
            $scope.aceLoaded = aceEditor.init;

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'dialer')
            });

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                webitel.connection.instance.unServerEvent('DC::CHANGE_STATE', true, changeStateEvent);
                changeDomainEvent();
                $timeout.cancel(timerId)
            });
            
            var changeStateEvent = function (e) {
                if ($scope.dialer && $scope.dialer._id) {
                    edit();
                    $scope.checkDoNotClickButton = false;
                }
            };

            webitel.connection.instance.onServerEvent('DC::CHANGE_STATE', changeStateEvent, {all:true});

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            });

            $scope.$watch('[dialer,cf]', function(newValue, oldValue) {
                if ($scope.dialer._new)
                    return $scope.isEdit = $scope.isNew = true;

                $scope.textStateAction = $scope.dialer.active ?  'STOP' : 'RUN';
                return $scope.isEdit = !!oldValue[0]._id;
            }, true);

            $scope.$watch('dialer.resources', function(newValue, oldValue) {
                if ($scope.dialer._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue;
            }, true);

            $scope.cancel = function () {
                $scope.dialer = angular.copy($scope.oldDialer);
                $scope.cf = angular.copy($scope.oldCf);

                if ($scope.dialer.resources)
                    $scope.activeResource = $scope.dialer.resources[0];
                disableEditMode();
            };

            $scope.reloadData = reloadData;
            $scope.removeItem = removeItem;
            $scope.create = create;
            $scope.save = save;
            $scope.closePage = closePage;
            $scope.edit = edit;
            $scope.openDiagram = openDiagram;
            $scope.saveDiagram = saveDiagram;
            $scope.createVisual = createVisual;
            $scope.disableVisual = disableVisual;

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

            $scope.mediaFiles = [];
            $scope.getMediaFiles = function () {
                MediaModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.mediaFiles = [{
                        id: -2,
                        name: 'Empty'
                    }];
                    if (angular.isArray(res)) {
                        res.forEach(function (item) {
                            $scope.mediaFiles.push({
                                id: item._id,
                                uri: utils.mediaToUri(item),
                                name: item.name
                            })
                        })
                    }
                });
            };
            $scope.mediaChanged = function(item){
                if(item.id === -2){
                    $scope.dialer.playbackFile = null;
                }
            };

            $scope.activeProcessDialer = false;

            $scope.textStateAction = '';

            $scope.toDateString = function (date) {
                if (date)
                    return new Date(date).toLocaleString();
                return '';
            };

            var timerId = null;
            $scope.checkDoNotClickButton = false;
            $scope.setProcessDialer = function (v) {
                var state = v.active ? 3 : 1;
                var active = v.active;
                var tryCount = 0;
                var setState = function (err) {
                    if (err)
                        return;
                    $scope.checkDoNotClickButton = true;
                    DialerModel.setState($scope.dialer._id, $scope.dialer.domain, state, function (err, res) {
                        if (err)
                            return notifi.error(err);

                        var tick = function () {
                            if ($scope.dialer.active !== active) {
                                $scope.checkDoNotClickButton = false;
                                $timeout.cancel(timerId);
                                if (active)
                                    notifi.info('Stop dialer ' + $scope.dialer.name, 2000);
                                return;
                            };
                            edit();
                            tryCount++;
                            timerId = $timeout(tick, 1500);
                        };
                        // timerId = $timeout(tick, 1500);
                        if (active)
                            return notifi.info('Please wait...', 10000);
                        else return notifi.info('Please wait... Set ready', 2000);

                    });
                };


                if ($scope.isEdit) {
                    $confirm({text: 'Save changes ' + v.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                        .then(function() {
                            save(setState);
                        });
                    return;
                };

                if (active) {
                    $confirm({text: 'Stop dialer ' + v.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                        .then(setState);
                    return;
                }
                setState();
            };

            function initCalendars(cb){
                CalendarModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.data;
                    angular.forEach(data, function (v) {
                        c.push(v.name);
                    });
                    cb(c);
                });
            }


            function initMedia(cb){
                MediaModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res;
                    angular.forEach(data, function (v) {
                        c.push(v.name);
                    });
                    cb(c);
                });
            }

            function initDirectory(cb){
                AccountModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.info;
                    Object.keys(data).forEach(function (v) {
                        c.push(v);
                    });
                    cb(c);
                });
            }

            function initGateway(cb){
                GatewayModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    var g = [];
                    res.forEach(function(item){
                        g.push(item.name);
                    });
                    cb(g);
                });
            }

            function initAcd(cb){
                AcdModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res;
                    angular.forEach(data, function (v) {
                        c.push(v.name);
                    });
                    cb(c);

                });
            }

            $scope.downloadCfScheme = function () {
                DialerModel.item($scope.dialer._id, $scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    utils.saveJsonToPc(res._cfDiagram, res.name + '.json');
                });
            };

            var uploader = $scope.uploader = new FileUploader();
            uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
                console.info('onWhenAddingFileFailed', item, filter, options);
            };
            uploader.onAfterAddingFile = function(item) {
                console.info('onAfterAddingFile', item);

                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var data = JSON.parse(event.target.result);
                        if(!data.id)
                            return;
                        $scope.cfDiagram = data;
                        $scope.openDiagram(true);
                        $scope.$apply();
                    } catch (e) {
                        notifi.error(e, 10000);
                    }
                };
                reader.readAsText(item._file);
            };

            function disableVisual() {
                $scope.visualCfEnabled = false;
                $scope.cfDiagram = null;
                $scope.oldCfDiagram = null;
            }

            function onDebugDiagram() {
                CallflowDiagram.onDebug.trigger({})
            }

            function saveDiagram() {
                var cfGetter = CallflowDiagram.getCallflowJSON();
                $scope.visualCfEnabled = true;
                // $scope.diagramOpened = false;
                // CallflowDiagram.clearReducer();
                // DiagramDesigner.removeDesigner();
                if(cfGetter){
                    $scope.cf = aceEditor.getStrFromJson(cfGetter.callflowJson);
                    $scope.cfDiagram = cfGetter.callflowModel;
                    $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
                }
            }

            function createVisual(){
                DiagramDesigner.init();
                $scope.cfDiagram = CallflowDiagram.createDiagram(JSON.parse($scope.cf));
                $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
                var cd = CallflowDiagram.getCallflowJSON();
                $scope.cf = cd ? aceEditor.getStrFromJson(cd.callflowJson) : aceEditor.getStrFromJson($scope.cf);
                DiagramDesigner.removeDesigner();
                $scope.visualCfEnabled = true;
            }

            function openDiagram(value) {
                $scope.diagramOpened = value;
                if(value) {
                    window.removeEventListener('keydown', window.keydownDiagramListener);
                    DiagramDesigner.init();
                    CallflowDiagram.setWebitelParams({
                        media: initMedia,
                        calendar: initCalendars,
                        acd: initAcd,
                        directory: initDirectory,
                        gateway: initGateway
                    });
                    setTimeout(function(){
                        if(!!$scope.cfDiagram){
                            CallflowDiagram.updateModel($scope.cfDiagram);
                            CallflowDiagram.onNodeSelected(null);
                        }
                        else CallflowDiagram.updateModel({
                            id: webitel.guid(),
                            offsetX: 0,
                            offsetY: 0,
                            zoom: 100,
                            links: [],
                            nodes: []
                        });
                    }, 100);

                }
                else{
                    CallflowDiagram.updateModel();
                    CallflowDiagram.clearReducer();
                    $scope.cfDiagram = angular.copy($scope.oldCfDiagram);
                    DiagramDesigner.removeDesigner();
                }
            }
            
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
                            resources[i].dialedNumber = result.value;
                            return resources[i].disabled = result.disabled;
                        }
                    }
                }, function () {

                });
            };

            $scope.editResourceDestination = function (resource, viewMode) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourcePage.html',
                    controller: 'DialerResourceCtrl',
                    resolve: {
                        viewMode: function () {
                            return viewMode;
                        },
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
                        return $scope.activeResource.destinations.push(result.value);

                    for (var i = 0; i < destinations.length; i++) {
                        if (destinations[i].$$hashKey == result.id) {
                            return $scope.activeResource.destinations[i] = result.value
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
            
            $scope.setDialStringPosition = function (resources, value, up) {
                up ? moveUp(resources, value) : moveDown(resources, value);
            };

            function save (callback) {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.dialer._new) {
                        return $location.path('/queue/dialer/' + res + '/edit');
                    } else {
                        $scope.dialer.__time = Date.now();
                        return edit(callback);
                    };
                };
                $scope.dialer._cfDiagram = angular.copy($scope.cfDiagram);
                if ($scope.cf)
                    $scope.dialer._cf = JSON.parse($scope.cf);
                if ($scope.dialer._new) {
                    DialerModel.add($scope.dialer, cb);
                } else {
                    var updateValues = utils.diff($scope.dialer,  $scope.oldDialer);
                    DialerModel.update($scope.dialer._id, $scope.dialer.domain, Object.keys(updateValues), $scope.dialer, cb);
                }
            }

            $scope.clone = function () {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);
                    return $location.path('/queue/dialer/' + res + '/edit');
                };
                $scope.dialer._cfDiagram = angular.copy($scope.cfDiagram);
                if ($scope.cf)
                    $scope.dialer._cf = JSON.parse($scope.cf);
                delete $scope.dialer._id;
                DialerModel.add($scope.dialer, cb);
            }

            function create() {
                $scope.dialer = DialerModel.create();
                var domain = $routeParams.domain;
                $scope.dialer.domain = domain;
                $scope.dialer._new = true;
                var cf = [];
                $scope.cf = aceEditor.getStrFromJson(cf);
            };

            function closePage() {
                $location.path('/queue/dialer');
            }
            
            $scope.gotoUrl = function (url) {
                $location.path(url);
            };

            function edit (callback) {
                $scope.isLoading = true;
                var id = $routeParams.id;
                var domain = $routeParams.domain;

                var index = $scope.dialer && $scope.dialer.resources && $scope.dialer.resources.indexOf($scope.activeResource);
                if (index < 0)
                    index = 0;

                DialerModel.item(id, domain, function(err, item) {
                    $scope.isLoading = false;
                    if (err) {
                        return notifi.error(err, 5000);
                    };
                    $scope.oldDialer = angular.copy(item);
                    $scope.dialer = item;
                    var cf = callflowUtils.replaceExpression(item._cf);
                    $scope.cf = aceEditor.getStrFromJson(cf);
                    $scope.oldCf = angular.copy($scope.cf);
                    $scope.cfDiagram = angular.copy(item._cfDiagram);
                    $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
                    $scope._activeProcessDialer = angular.copy(item.active);
                    $scope.activeResource = $scope.dialer.resources && $scope.dialer.resources[index];
                    if(!!$scope.cfDiagram)$scope.visualCfEnabled = true;
                    disableEditMode();
                    if (typeof callback === 'function') callback(err, item);
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
                if ($location.$$path !== '/queue/dialer')
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

            $scope.setSource = null;

            $scope.selAgents = {};
            $scope.selTiers = {};
            $scope.agents = [];
            $scope.tiers = [];
            $scope.agentList = {};

            $scope.agentStrategy = [
                {
                    name: "Random",
                    val: "random"
                },
                {
                    name: "With fewest calls",
                    val: "with_fewest_calls"
                },
                {
                    name: "With least talk time",
                    val: "with_least_talk_time"
                },
                {
                    name: "Longest idle agent",
                    val: "longest_idle_agent"
                },
                {
                    name: "With least utilization",
                    val: "with_least_utilization"
                }
            ];
            $scope.numberStrategy = [
                {
                    name: "Top-down",
                    val: "top-down"
                },
                {
                    name: "By priority",
                    val: "by-priority"
                }
            ];

            $scope.membersStrategy = [
                {
                    name: "Strict circuit",
                    val: "strict-circuit"
                },
                {
                    name: "Next tries circuit",
                    val: "next-tries-circuit"
                }
            ];

            $scope.addTiers = function (all) {
                var collection = all ? $scope.agents : $scope.selAgents;
                if (!collection.length) {
                    angular.forEach(collection, function (i, key) {
                        if (!i) return;
                        if (!~$scope.dialer.agents.indexOf(key)) {
                            $scope.dialer.agents.push(key);
                        }
                    })
                } else {
                    angular.forEach(collection, function (i) {
                        if (!~$scope.dialer.agents.indexOf(i.id)) {
                            $scope.dialer.agents.push(i.id);
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
                if (!$scope.dialer)
                    return false;
                return !~$scope.dialer.agents.indexOf(a.id);
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
                    return $scope.dialer.agents = [];
                }

                var collection = $scope.selTiers;
                angular.forEach(collection, function (i, key) {
                    if (!i) return;
                    if (~$scope.dialer.agents.indexOf(key)) {
                        $scope.dialer.agents.splice($scope.dialer.agents.indexOf(key), 1);
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
                        if (!i.agent || i.agent === "false") {
                            return;
                        }
                        $scope.agents.push(i);
                        agentsIds.push(i.id);
                    });

                    if (angular.isArray($scope.dialer.agents)) {
                        for (var i = 0; i < $scope.dialer.agents.length; i++)
                            if (!~agentsIds.indexOf($scope.dialer.agents[i]))
                                $scope.dialer.agents.splice(i, 1)
                    }
                })
            };

            /*

             Idle: 0,
             Work: 1,
             Sleep: 2,
             ProcessStop: 3,
             End: 4

             */

            $scope.diealerStates = [
                {
                    val: 0,
                    name: "Idle"
                },
                {
                    val: 1,
                    name: "Work"
                },
                {
                    val: 2,
                    name: "Sleep"
                },
                {
                    val: 3,
                    name: "Process stop"
                },
                {
                    val: 4,
                    name: "End"
                }
            ];
            
            $scope.stateDialerToString = function (stateNumber) {
                for (var i = 0, len = $scope.diealerStates.length; i < len; i++) {
                    if ($scope.diealerStates[i].val == stateNumber)
                        return $scope.diealerStates[i].name
                }
            };
            //$scope.diealerTypes = ["progressive", "predictive", "auto dialer"];
            $scope.diealerTypes = ["Voice Broadcasting", "Progressive Dialer", "Predictive Dialer"];

            var _mapCode = {
                causesError: "CODE_RESPONSE_ERRORS",
                causesRetry: "CODE_RESPONSE_RETRY",
                causesOK: "CODE_RESPONSE_OK",
                causesMinus: "CODE_RESPONSE_MINUS_PROBE"
            };
            
            $scope.resetCause = function () {
                $confirm({text: 'Are you sure you want to reset causes ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        $scope.dialer.causesError = angular.copy(DialerModel.CODE_RESPONSE_ERRORS);
                        $scope.dialer.causesRetry = angular.copy(DialerModel.CODE_RESPONSE_RETRY);
                        $scope.dialer.causesOK = angular.copy(DialerModel.CODE_RESPONSE_OK);
                        $scope.dialer.causesMinus = angular.copy(DialerModel.CODE_RESPONSE_MINUS_PROBE);
                    });
            };

            $scope.loadCause = function (query, fieldName) {
                var result = $q.defer();
                var data = DialerModel.ALL_CODE;
                angular.forEach(_mapCode, function (v, key) {

                    if ($scope.dialer[key]) {
                        var m = $scope.dialer[key].map(function (v) {
                            if (v.text)
                                return v.text;
                            return v;
                        });
                        data = diffArray(data, m);
                    }
                });

                data = $filter('filter')(data, query);
                result.resolve(data);
                return result.promise;
            };

            $scope.selectTabStats = function () {
                window.dispatchEvent(new Event('resize'));
            };
            
            $scope.resetProcess = function (id, domain) {
                DialerModel.resetProcess(id, domain, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    var data = res && (res.data || res.info);
                    if (!data)
                        return notifi.error('No response from server.');

                    if (data.n === 0) {
                        return notifi.warn('Please stop dialer. And try now.', 5000)
                    } else {
                        return notifi.info('OK.', 2000)
                    }
                })
            };

            // region Communication type logic

            $scope.rangeType = {};
            $scope._hourError = false;
            $scope._editRangeRowKey = null;
            $scope._editRangeRowRow = {};
            
            $scope.editRangeName = function (rowName, key) {
                $scope._editRangeRowRow = {
                    "name": rowName.name,
                    "code": rowName.code
                };
                $scope._editRangeRowKey = key;
            };
            
            $scope.saveRangeName = function (newRow, oldRow, communications) {
                if (!newRow.name || !newRow.code) {
                    return showError('Bad name or code');
                }

                if (angular.isArray(communications)) {
                    for (var i = 0; i < communications.length; i++)
                        if (oldRow !== communications[i] && communications[i].code == newRow.code)
                            return showError('Bad code')
                }

                oldRow.name = newRow.name;
                oldRow.code = newRow.code;
                $scope._editRangeRowRow = {};
                $scope._editRangeRowKey = null;
            };

            $scope.removeRangeName = function (key, types) {
                types.splice(key, 1);
            };

            $scope.editRangeRow = function (row, key) {
                var startTime = getHourAndMinuteFromTimeOfDay(row.startTime);
                var endTime = getHourAndMinuteFromTimeOfDay(row.endTime);
                $scope._editRangeRowRow = {
                    "startHour": startTime.hour,
                    "startMinute": startTime.minute,
                    "endHour": endTime.hour,
                    "endMinute": endTime.minute,
                    "attempts": row.attempts,
                    "priority": row.priority || 0
                };
                $scope._editRangeRowKey = key;
            };

            $scope.saveRangeRow = function (range, communications) {
                var row = validateRange($scope._editRangeRowRow, communications, range);
                if (!row) {
                    return showError('Bad range');
                }

                var idx = findIndexFromRows(range, communications);
                communications[idx] = row;
                $scope._editRangeRowRow = {};
                $scope._editRangeRowKey = null;
            };
            
            $scope.addRangeType = function (range, communications) {

                if (!range.code) {
                    //TODO error
                    return showError('Bad code');
                }

                if (!communications)
                    $scope.dialer.communications = communications = {types: []};

                var type = findTypeInCommunications(range.code, communications);
                if (!type) {
                    type = {
                        name: range.name,
                        code: range.code,
                        ranges: []
                    };
                    communications.types.push(type);
                }

                if (!type.ranges) {
                    type.ranges = []
                }

                var _range = validateRange(range, type.ranges);
                if (!_range)
                    return showError('Bad hours');

                type.ranges.push(_range);
            };
            
            $scope.removeRange = function (row, range, key) {
                row.ranges.splice(key, 1);
                if (row.ranges.length === 0) {
                    var idx = findTypeIdInCommunications(row.code, $scope.dialer.communications);
                    if (isFinite(idx)) {
                        $scope.dialer.communications.types.splice(idx, 1);
                    } else {
                        //TODO
                        throw 'Bad name';
                    }
                }
            };

            function showError(err) {
                notifi.error(err, 2000);
                $scope._hourError = true;
                $timeout(function () {
                    $scope._hourError = false;
                }, 2000);
            }

            function validateRange(range, ranges, _curentRange) {
                if (!range)
                    return null;

                if (!isFinite(range.startHour) || !isFinite(range.startMinute) ||
                    !isFinite(range.endHour) || !isFinite(range.endMinute) ||
                    !isFinite(range.attempts) )
                    return null;

                var startTime = (+range.startHour * 60) + (+range.startMinute);
                var endTime = (+range.endHour * 60) + (+range.endMinute);

                if (endTime <= startTime)
                    return null;

                var max = Math.max(startTime, endTime),
                    min = Math.min(startTime, endTime)
                    ;

                for (var i = 0, len = ranges.length; i < len; i++)
                    if (_curentRange !== ranges[i] && betweenLine(max, min, ranges[i].startTime, ranges[i].endTime))
                        return null;

                return {
                    "startTime": startTime,
                    "endTime": endTime,
                    "attempts": range.attempts,
                    "priority": range.priority
                }
            }

            //TODO move utils
            function betweenLine(maxA, minA, bX, bY) {
                return Math.min(maxA, Math.max(bX, bY)) >=
                    Math.max(minA, Math.min(bX, bY))
            }
            //TODO move utils
            function addZero (n) {
                return n < 10 ? '0' + n : '' + n;
            }

            function findIndexFromRows (row, rows) {
                for (var i = 0, len = rows.length; i < len; i++)
                    if (rows[i] === row)
                        return i;

            }
            //TODO move utils
            $scope.minuteOfDayToString = function (time) {
                var hm = getHourAndMinuteFromTimeOfDay(time);
                return addZero(hm.hour) + ':' + addZero(hm.minute);
            };
            //TODO move utils
            function getHourAndMinuteFromTimeOfDay (time) {
                return {
                    hour: Math.floor((time / 60) % 24),
                    minute: time % 60
                }
            }

            function findTypeInCommunications(code, communications) {
                if (angular.isArray(communications && communications.types)) {
                    for (var item of communications.types) {
                        if (item.code === code)
                            return item;
                    }
                }
            }
            function findTypeIdInCommunications(code, communications) {
                if (angular.isArray(communications && communications.types)) {
                    for (var i = 0; i <  communications.types.length; i++) {
                        if (communications.types[i].code === code)
                            return i;
                    }
                }
            }

            $scope.getNumber = function (num) {
                var arr = [];
                for (var i = 0; i < num; i++)
                    if (i < 10)
                        arr.push('0' + i);
                    else arr.push('' + i);
                return arr;
            };



            // endregion

            function diffArray(a1, a2) {
                return a1.filter(function(i) {return a2.indexOf(i) < 0;});
            }

    }]);
    
    app.controller('DialerResourceCtrl', ["$scope", '$modalInstance', 'resource', 'domain', 'viewMode', 'GatewayModel', 'notifi',
        function ($scope, $modalInstance, resource, domain, viewMode, GatewayModel, notifi) {
        $scope.resource = angular.copy(resource);
        $scope.viewMode = viewMode;

        var id = resource.$$hashKey;

        $scope.ok = function () {
            if (!$scope.resource.dialString || (!$scope.resource.gwName && $scope.resource.gwProto === 'sip')) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close({value: $scope.resource, id: id}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.Types = ["sip", "sipUri"];

        $scope.gateways = [];

        GatewayModel.list(null, function (err, res) {
            if (err)
                return notifi.error(err);
            $scope.gateways = [];
            angular.forEach(res, function (v) {
                $scope.gateways.push(v.id)
            });
        });
    }]);

    app.controller('MembersDialerCtrl', ['$scope', 'DialerModel', '$modal', '$confirm', 'notifi', 'FileUploader', 'webitel',
        'cfpLoadingBar',
        function ($scope, DialerModel, $modal, $confirm, notifi, FileUploader, webitel, cfpLoadingBar) {
        var _tableState = {};
        $scope.reloadData = function () {
            _tableState.pagination.start = 0;
            $scope.callServer(_tableState)
        };

        var showResetLogBtn = !webitel.connection.session.domain;

        var nexData = true;
        $scope.isLoading = false;
        $scope.$watch('isLoading', function (val) {
            if (val) {
                cfpLoadingBar.start()
            } else {
                cfpLoadingBar.complete()
            }
        });

        var _page = 1;
        $scope.CountItemsByPage = 40;
        $scope.membersRowCollection = [];

        var checkDialerLoad = true;

        $scope.communicationTypes = [];
        $scope.$watch('dialer', function (dialer) {
            if (dialer && dialer._id) {
                if (dialer.communications && angular.isArray(dialer.communications.types))
                    $scope.communicationTypes = dialer.communications.types;

                if (!checkDialerLoad)
                    return;

                _tableState = {
                    "sort": {},
                    "search": {},
                    "pagination": {
                        "start": 0,
                        "totalItemCount": 0
                    }
                };
                checkDialerLoad = false;
                $scope.callServer(_tableState);
            }
        }, true);

        var getCommunicationDisplayName = function (code) {
            if (!code)
                return '-';

            var communicationTypes = $scope.communicationTypes;

            for (var i = 0; i < communicationTypes.length; i++)
                if (communicationTypes[i].code === code)
                    return communicationTypes[i].name;

            return 'error type: ' + code;
        };

        $scope.getCommunicationDisplayName = getCommunicationDisplayName;

        $scope.timeToString = timeToString;

        $scope.callServer = function (tableState) {
            if ($scope.isLoading || checkDialerLoad) return void 0;
            _tableState = tableState;

            $scope.isLoading = true;

            var option = {
                sort: {},
                filter: tableState.search.predicateObject || {},
                page: _page,
                limit: $scope.CountItemsByPage,
                columns: ["createdOn", "_nextTryTime", "name", "priority", "timezone", "communications", "_endCause", "_lock", "_waitingForResultStatusCb"]
            };

            if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                _page = 1;
                nexData = true;
                $scope.membersRowCollection = [];
                $scope.count = '';
                DialerModel.members.count($scope.domain, $scope.dialer._id, option, function (err, res) {
                    if (err)
                        return ;
                    $scope.count = res;
                })
            };

            console.debug("Page:", _page);
            option.page = _page;


            if (tableState.sort.predicate)
                option.sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

            DialerModel.members.list($scope.domain, $scope.dialer._id, option, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err);

                _page++;

                $scope.membersRowCollection =  $scope.membersRowCollection.concat(res);

            });
        };

        function removeMembers() {
            $confirm({text: 'Are you sure you want to delete ' + ($scope.count || 0) + ' members ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    DialerModel.members.removeMulti($scope.dialer._id, _tableState.search.predicateObject, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);
                        notifi.info('Remove ' + res.n + ' members.', 5000);
                        $scope.reloadData();
                    });
                });
        }

        $scope.removeMembers = removeMembers;
        $scope.removeMember = function (row, index) {
            $confirm({text: 'Are you sure you want to delete resource ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    DialerModel.members.remove($scope.domain, $scope.dialer._id, row._id, function (err) {
                        if (err)
                            return notifi.error(err, 5000);

                        $scope.membersRowCollection.splice(index, 1);
                    })
                });
        };
        
        $scope.addMember = function () {
            var modalInstance = $modal.open({
                animation: true,
                windowClass: "large-modal-window",
                templateUrl: '/modules/dialer/memberPage.html',
                controller: 'MemberDialerPageCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                            member: null,
                            dialerId: $scope.dialer._id,
                            domain: $scope.domain,
                            communications: $scope.dialer.communications && $scope.dialer.communications.types
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
                templateUrl: '/modules/dialer/memberPage.html',
                windowClass: "large-modal-window",
                controller: 'MemberDialerPageCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                            viewMode: viewMode,
                            member: member,
                            dialerId: $scope.dialer._id,
                            setSource: $scope.setSource,
                            domain: $scope.domain,
                            communications: $scope.dialer.communications && $scope.dialer.communications.types
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

        $scope.TimeZones = utils.timeZones;
        $scope.CommunicationStatuses = [
            {
                name: "Null",
                val: 0
            },
            {
                name: "One",
                val: 1
            }
        ];
        $scope.CommunicationStates = [
            {
                name: "Active",
                val: 0
            },
            {
                name: "End",
                val: 2
            }
        ];

        $scope.progress = 0;
        $scope.progressCount = 0;
        $scope.processImport = false;


        $scope.showResetPage = function () {


            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/resetMemberPage.html',
                controller: function ($scope, $modalInstance, notifi, options) {
                    $scope.dateOpenedControl = false;
                    $scope.showResetLogBtn = options.showResetLogBtn;

                    $scope.changeDate = function () {
                        if (!$scope.remFromDate) {
                            $scope.count = 0;
                            return;
                        }

                        DialerModel.members.countEndMembers(options.domain, options.dialerId, $scope.remFromDate.getTime(), function (err, count) {
                            if (err)
                                return notifi.error(err, 5000);

                            $scope.count = count;
                        });
                    };


                    var date = new Date();
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setMilliseconds(0);

                    $scope.remFromDate = date;

                    $scope.openDate = function ($event) {
                        return $event.preventDefault(),
                            $event.stopPropagation(),
                            $scope.dateOpenedControl = !0
                    };

                    $scope.count = 0;



                    $scope.ok = function (clearLog) {
                       $modalInstance.close({
                           domain: options.domain,
                           dialerId: options.dialerId,
                           dateFrom: $scope.remFromDate.getTime(),
                           clearLog: clearLog
                       }, 5000);
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                    $scope.changeDate();
                },
                resolve: {
                    options: function () {
                        return {
                            domain: $scope.domain,
                            dialerId: $scope.dialer._id,
                            showResetLogBtn: showResetLogBtn
                        };
                    }
                }
            });

            modalInstance.result.then(function (result) {

                DialerModel.members.reset(result.dialerId, result.domain, result.clearLog, result.dateFrom, function (err, count) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.reloadData();
                    return notifi.info('OK: reset ' + count + ' members.', 5000);
                })
                
            }, function () {

            });
        }

    }]);


    
    app.controller('MemberDialerPageCtrl', ['$scope', '$modalInstance', 'notifi', 'DialerModel', 'options', 'fileModel',
    function ($scope, $modalInstance, notifi, DialerModel, options, fileModel) {

        if (options && options.member) {
            DialerModel.members.item(options.domain, options.dialerId, options.member._id, function (err, data) {
                if (err)
                    return notifi.error(err);
                $scope.member = data;
            });
        } else {

            $scope.member = {
                _new: true,
                communications: [],
                _variables: []
            };
        };

        $scope.viewMode = options.viewMode;
        
        $scope.addCommunication = function (member) {
            $scope.inserted = {
                number: ''
            };
            member.communications.push($scope.inserted);
        };
        $scope.removeCommunication = function (index) {
            $scope.member.communications.splice(index, 1);
        };

        $scope.setSource = null;

        $scope.communicationTypes = options.communications;

        $scope.displayCommunicationType = function (code, codes) {
            if (!code) return '-';

            if (angular.isArray(codes)) {
                for (var i = 0; i < codes.length; i++)
                    if (codes[i].code === code)
                        return codes[i].name
            }

            return 'error type: ' + code
        };

        $scope.checkCommunicationNumber = function (number) {
            if (!number)
                return 'Number is required'
        };

        $scope.TimeZones = utils.timeZones;

        $scope.timeToString = timeToString;

        $scope.showJsonPreview = function(id) {
            fileModel.getJsonObject(id, function(err, res) {


                var jsonData = JSON.stringify(res);

                var jsonWindow = window.open("", id, "width=800, height=600");

                if (jsonWindow) {

                    // додаємо розмітку у вікно для перегляду json обєкта і кнопки для скачування
                    jsonWindow.document.write(
                        '<button id="save-cdrJSON" style="position: fixed; right: 0; z-index: 1;">Save</button>' +
                        '<div id="cdr-jsonViewver"></div>' +
                        '<style type="text/css">' +
                        'body { margin: 0; padding: 0; background: #e7ebee; }' +
                        '</style>'
                    );

                    $('#cdr-jsonViewver', jsonWindow.document).JSONView(JSON.parse(jsonData, {collapsed: false}));

                    $('#save-cdrJSON', jsonWindow.document).off("click");
                    $('#save-cdrJSON', jsonWindow.document).on("click", function () {

                        var textFileAsBlob = new Blob([jsonData], {type: 'application/json'}),
                            downloadLink = document.createElement("a");

                        downloadLink.download = $scope.currentRowId.slice(2) + ".json";
                        downloadLink.innerHTML = "Download File";

                        if (window.webkitURL !== null) {
                            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                        }
                        else {
                            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                            downloadLink.onclick = destroyClickedElement;
                            downloadLink.style.display = "none";
                            document.body.appendChild(downloadLink);
                        }
                        downloadLink.click();
                    });
                }
                else {
                    notify.warning("Please, allow popup window!", 5000);
                    return;
                }
            })
        };

        $scope.secToString = function (sec) {
            if (!isFinite(sec))
                return '';
            return utils.secondsToString(sec)
        };

        $scope.play = play;

        function play(log) {
            var uri = fileModel.getUri(log.callUUID, null, log.steps[0].time, "mp3");
            options.setSource({
                src: uri,
                type: 'audio/mpeg',
                text: log.session
            }, true);
        }

        $scope.ok = function () {
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);
                var ins = res.insertedIds && res.insertedIds[0];
                if (ins) {
                    $scope.member._id = ins;
                }
                $modalInstance.close({value: $scope.member}, 5000);
            };

            if (options.member && options.member._id) {
                DialerModel.members.update(options.domain, options.dialerId, options.member._id, $scope.member, cb);
            } else {
                DialerModel.members.add(options.domain, options.dialerId, $scope.member, cb);
            };
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        
        $scope.openDate = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.dateOpenedControl = true;
        };
        
        $scope.changeDate = function () {
            $scope.member.expire = $scope.member._expire ? $scope.member._expire.getTime() : null;
        };
    }]);
    
    app.controller('StatsDialerCtrl', ['$scope', 'DialerModel', 'AgentModel', 'notifi', 'webitel', '$routeParams',
        '$interval', '$timeout', '$confirm', '$modal',
        function ($scope, DialerModel, AgentModel, notifi, webitel, $routeParams, $interval, $timeout, $confirm, $modal) {
            var _applyAgentLiveSatesTimerId = null;

            var aggCause = [
                {
                    $facet: {
                        "byTypeStateStart": [
                            {
                                $unwind: "$communications"
                            },
                            {
                                $match: {"communications.state": 0}
                            },
                            {
                                $group: {
                                    _id: '$communications.type',
                                    count: {
                                        $sum: 1
                                    }
                                }
                            }

                        ],
                        "causeByAttempt": [
                            {
                                $unwind: "$_log"
                            },
                            {
                                $match: {"_log.cause": {$ne: null}}
                            },

                            {
                                $group: {
                                    _id: '$_log.cause',
                                    count: {
                                        $sum: 1
                                    }
                                }
                            },
                            {
                                $sort: {count: -1}
                            },

                            {
                                $group: {
                                    _id: 0,
                                    keys : { $push : "$_id" },
                                    sumValues : { $push : "$count" },
                                    total : { $sum : "$count" }
                                }
                            },
                            {
                                "$project" : {
                                    "keys" : "$keys",
                                    "sumValues" : "$sumValues",
                                    "percentages" : { "$map" : { "input" : "$sumValues", "as" : "s", "in" : { "$divide" : ["$$s", "$total"] } } } }
                            }

                        ],
                        "callbackStatus": [
                            {$unwind: "$_log"},
                            {
                                $match: {"_log.callback": {$ne: null}}
                            },
                            {
                                $group: {
                                    _id: '$_log.callback.data.success',
                                    count: {
                                        $sum: 1
                                    }
                                }
                            }
                        ],
                        "callbackDescription": [
                            {$unwind: "$_log"},
                            {
                                $match: {"_log.callback": {$ne: null}}
                            },
                            {
                                $group: {
                                    _id: '$_log.callback.data.description',
                                    count: {
                                        $sum: 1
                                    }
                                }
                            }
                        ],
                        "byCause": [
                            {
                                $group: {
                                    _id: '$_endCause',
                                    count: {
                                        $sum: 1
                                    }
                                }
                            },
                            {
                                $sort: {count: -1}
                            }
                        ]
                    }
                }
            ];

            var dialerStates = [
                "Idle",
                "Work",
                "Sleep",
                "Process stop",
                "End"
            ];

            $scope.canUpdateAgent = webitel.connection.session.checkResource('account', 'u');

            $scope.domain = $routeParams.domain;
            $scope.id = $routeParams.id;


            function secToString(sec) {
                if (!isFinite(sec))
                    return '--:--';
                return utils.secondsToString(sec, true)
            };

            $scope.secToString = secToString;

            $scope.agentDisplayedCollection = [];

            var timerId = null;
            var communicationTypes = {};
            
            function reload() {
                if (timerId) {
                    $timeout.cancel(timerId);
                }
                if (document.hidden) {
                    timerId = $timeout(reload, 25000);
                    return;
                }

                DialerModel.item($scope.id, $scope.domain, function(err, item) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.dialer = item;
                    communicationTypes = {};
                    if (item.communications) {
                        angular.forEach(item.communications.types, function (v) {
                            communicationTypes[v.code] = v.name;
                        })
                    }

                    $scope.dialerStateStr = dialerStates[item.state];
                    reloadCause();
                    setStats($scope.dialer.stats, $scope.dialer.amd);
                    loadResources($scope.dialer.resources, $scope.dialer.stats);
                    loadAgents($scope.dialer.domain, $scope.dialer.agents, $scope.dialer.skills);

                    timerId = $timeout(reload, 15000);
                });
            }

            $scope.cleanStats = function () {
                $confirm({text: 'Are you sure you want to clean statistic ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        DialerModel.cleanStatistic($scope.id, $scope.domain, function (err, res) {
                            if (err)
                                return notifi.error(err, 5000);

                            reload();
                            notifi.info("Clean statistics", 5000);
                        })
                    });

            };

            $scope.onSelectTabPleaseResize = function () {
                $timeout(function(){
                    window.dispatchEvent(new Event('resize'));
                }, 0);
            };

            $scope.reload = reload;
            $scope.resources = [];
            function loadResources(resources, stats) {
                var usedResources = (stats && stats.resource) || {};
                if (angular.isArray(resources)) {
                    for (var i = 0; i < resources.length; i++) {
                        if (angular.isArray(resources[i].destinations)) {
                            var destinations = resources[i].destinations;
                            for (var j = 0; j < destinations.length; j++) {
                                if (usedResources.hasOwnProperty(destinations[j].uuid)) {
                                    destinations[j].usedPercent = (usedResources[destinations[j].uuid] * 100) / destinations[j].limit;
                                    destinations[j].usedCount = usedResources[destinations[j].uuid];

                                    if (destinations[j].usedPercent < 50) {
                                        destinations[j].class = 'progress-bar-success'
                                    } else if (destinations[j].usedPercent < 75) {
                                        destinations[j].class = 'progress-bar-warning'
                                    } else {
                                        destinations[j].class = 'progress-bar-danger'
                                    }
                                }
                            }
                        }
                    }
                    $scope.resources = resources;
                }
            }

            $scope.sumAgentsStates = {
                "LOGGED-OUT": 0,
                "WAITING": 0,
                "BUSY": 0,
                "ON-BREAK": 0
            };

            function resetAgentSummaryByDialer() {
                $scope.sumAgentCallCount = 0;
                $scope.gotAgentCount = 0;
                $scope.sumAgentATT = 0;
                $scope.sumAgentASA = 0;
                $scope.sumUtilization = 0;
                $scope.loggedAgentInDay = 0;
                $scope.sumIdleAgents = 0;
            }

            resetAgentSummaryByDialer();

            function sortAgentStatsBySec(a1, a2) {
                if (a1.sec > a2.sec) {
                    return -1;
                } else if (a1.sec < a2.sec) {
                    return 1;
                }
                return 0;
            }

            function loadAgents(domain, agents, skills) {
                function joinDomain (agent) {
                    return agent + '@' + domain
                }

                AgentModel.stats($scope.id, agents.map(joinDomain), skills, domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.sumAgentsStates = {
                        "LOGGED-OUT": 0,
                        "WAITING": 0,
                        "BUSY": 0,
                        "ON-BREAK": 0
                    };

                    resetAgentSummaryByDialer();

                    $scope.agentDisplayedCollection = res.map(function (item) {
                        var date = Date.now();
                        item.stateName = getAgentSummaryState(item.state, item.status);
                        item.last_set_stats = item.last_set_stats * 1000;
                        item.active = +item.active * 1000;
                        $scope.sumAgentsStates[item.stateName]++;
                        item.ready_time = Math.max( (item.last_bridge_end  + item.wrap_up_time) * 1000 , item.ready_time * 1000);
                        item.wt = item.ready_time - date > 0;

                        $scope.gotAgentCount++;
                        $scope.sumAgentCallCount += item.call_count || 0;
                        $scope.sumAgentATT += ((item.call_time_sec / item.call_count) || 0);
                        $scope.sumAgentASA += ((item.connected_time_sec / item.call_count) || 0);

                        var avgIdleSec = 0;

                        if (item.status && item.last_set_stats && item.active > 0) {
                            //TODO
                            //dialer[item.status] = (dialer[item.status] | 0) + Math.round((Date.now() - item.last_set_stats) / 1000);

                            if (item.state === 'Waiting' && (item.status === 'Available' || item.status === 'Available (On Demand)')) {

                                if (item.ready_time < date)
                                    item.idle_sec += Math.round((date - Math.max(item.ready_time, item.active || 0, item.last_set_stats)  ) / 1000);

                            } else if (item.status === "On Break") {
                                item.on_break_sec += Math.round((date - Math.max(item.last_set_stats, item.active || 0)) / 1000);
                            } else if (item.state === "Reserved") {
                                item.call_time_sec += Math.round((date - Math.max(item.last_set_stats, item.active || 0)) / 1000);
                            }
                        }

                        if (item.idle_sec) {
                            var cc = (item.call_count - (item.missed_call || 0));
                            if (item.call_count && cc > 0) {
                                avgIdleSec = Math.round(item.idle_sec / cc);
                            } else {
                                avgIdleSec = item.idle_sec;
                            }
                            $scope.sumIdleAgents += avgIdleSec;
                        }

                        var busy = item.call_time_sec + item.connected_time_sec + item.wrap_time_sec;
                        var utilization =  0;

                        if (  (busy +  item.idle_sec) ) {
                            //TODO
                            utilization = ( ( busy / ( busy +  item.idle_sec)) ) * 100;
                            $scope.sumUtilization += utilization;
                            $scope.loggedAgentInDay++;
                        }


                        var stats = [
                            {
                                sec: busy,
                                cls: {
                                    'background-color': '#bf2a22'
                                },
                                text: 'Busy: ' + secToString(busy)
                            },
                            {
                                // sec: (dialer.Available || 0) + (dialer['Available (On Demand)'] || 0) - dialer.callTimeSec,
                                sec: item.idle_sec,
                                cls: {
                                    'background-color': '#57c17b'
                                },
                                // text: 'Available: ' + secToString(dialer.Available || dialer['Available (On Demand)'])
                                text: 'Available: ' + secToString(item.idle_sec)
                            },
                            {
                                sec: item.on_break_sec,
                                cls: {
                                    'background-color': '#f39c12'
                                },
                                text: 'On Break: ' + secToString(item.on_break_sec)
                            }
                        ].sort(sortAgentStatsBySec);

                        var sum = stats[0].sec + stats[1].sec + stats[2].sec;

                        stats[0].cls['height'] = ( (stats[0].sec * 100 / sum) || 0) + '%';
                        stats[1].cls['height'] = ( (stats[1].sec * 100 / sum) || 0) + '%';
                        stats[2].cls['height'] = ( (stats[2].sec * 100 / sum) || 0) + '%';

                        item.class = getAgentClass(item.state, item.status);
                        item.lastChange = Math.round((date - Math.max(item.last_set_stats, item.active)) / 1000);
                        item.lastChangeTime = Math.max(item.last_set_stats, item.active);
                        item.number = item.name.split('@')[0];
                        item.avgIdleSec = avgIdleSec;
                        item.stats = stats;
                        item.utilization = utilization;


                        return item
                    });
                })
            }
            $scope.toLocaleTimeString = function (time) {
                if (!time)
                    return '---';
                var date = new Date(time);
                return date.toLocaleTimeString() + '\n' + date.toLocaleDateString()
            };

            function getAgentClass(state, status) {
                if (state === 'Waiting' && (status === 'Available' || status === 'Available (On Demand)')) {
                    return 'bg-success'
                } else if (status === 'Logged Out') {
                    return 'bg-gray'
                } else if (state === 'Idle' || state === 'Reserved') {
                    return 'bg-danger'
                } else {
                    return 'bg-warning'
                }
            };
            $scope.getAgentClass = getAgentClass;

            function getAgentSummaryState (state, status) {
                if (state === 'Waiting' && (status === 'Available' || status === 'Available (On Demand)')) {
                    return 'WAITING'
                } else if (status === 'Logged Out') {
                    return 'LOGGED-OUT'
                } else if (status === 'On Break') {
                    return 'ON-BREAK'
                } else {
                    return 'BUSY'
                }
            }

            function fnOnUserStatusChange(e) {
                var agent = findAgent(e['CC-Agent']);
                if (agent) {
                    agent.status = e['CC-Agent-Status'];
                    agent.stateName = getAgentSummaryState(agent.state, agent.status);
                    agent.lastChangeTime = Date.now();
                    //agent.class = getAgentClass(agent.state, agent.status);
                }
            }

            function fnOnUserStateChange(e) {
                var agent = findAgent(e['CC-Agent']);
                if (agent) {
                    agent.state = e['CC-Agent-State'];
                    agent.stateName = getAgentSummaryState(agent.state, agent.status);
                    agent.lastChangeTime = Date.now();
                   // $('#agent-' + agent.id).
                   // agent.class = getAgentClass(agent.state, agent.status);
                }
            }

            var stateSettings = {
                "WAITING": {
                    color: "#57c17b"
                },
                "ON-BREAK": {
                    color: "#f39c12"
                },
                "LOGGED-OUT": {
                    color: "rgba(171, 171, 171, 0.36)"
                },
                "BUSY": {
                    color: "#bf4048"
                }
            };

            function clearAgentLiveState() {
                $scope.liveAgentsStates = {
                    "WAITING": 0,
                    "BUSY": 0,
                    "ON-BREAK": 0,
                    "LOGGED-OUT": 0
                };
            }

            $scope.showAgentStatus = {
                "WAITING": true,
                "BUSY": true,
                "ON-BREAK": true,
                "LOGGED-OUT": true
            };

            clearAgentLiveState();

            $scope.historyCollection = [];

            $scope.timeToString = timeToString;
            DialerModel.listHistory($scope.domain, $scope.id, {}, function (err, data) {
                if (err)
                    return notifi.error(err, 5000);

                $scope.historyCollection = $scope.historyCollection.concat(data)
            });

            
            function findAgent(id) {
                var agents = $scope.agentDisplayedCollection;
                if (angular.isArray(agents)) {
                    for (var i = 0; i < agents.length; i++ ) {
                        if (agents[i].name === id) {
                            return agents[i];
                        }
                    }
                }
            }

            var liveAgentsStates = [];

            $scope.$on('$destroy', function () {
                if (timerId) {
                    console.log('DESTROY TIMER timerId');
                    $timeout.cancel(timerId);
                }
                if (_applyAgentLiveSatesTimerId) {
                    console.log('DESTROY TIMER _applyAgentLiveSatesTimerId');
                    $timeout.cancel(_applyAgentLiveSatesTimerId);
                }

                unSubscribeGridEvents();
            });

            webitel.connection.instance.onServerEvent("CC::AGENT-STATE-CHANGE", fnOnUserStateChange,  {all: true});
            webitel.connection.instance.onServerEvent("CC::AGENT-STATUS-CHANGE", fnOnUserStatusChange,  {all: true});
            
            function unSubscribeGridEvents() {
                webitel.connection.instance.unServerEvent('CC::AGENT-STATE-CHANGE', {all: true}, fnOnUserStateChange);
                webitel.connection.instance.unServerEvent('CC::AGENT-STATUS-CHANGE', {all: true}, fnOnUserStatusChange);
            }

            function setStats(stats, amd) {

                if (!stats) {
                    stats = {}
                }

                if (angular.isNumber(stats.predictAdjust)) {
                    $scope.predictAdjustChart.data.measures = $scope.predictAdjustChart.data.markers = [Math.round(stats.predictAdjust * 100 / 1000)];
                } else if  ($scope.dialer && $scope.dialer.parameters.predictAdjust) {
                    $scope.predictAdjustChart.data.measures = $scope.predictAdjustChart.data.markers = [Math.round($scope.dialer.parameters.predictAdjust * 100 / 1000)];
                }

                $scope.activeCalls = (stats.active) || 0;
                $scope.connectRate = ((stats.callCount) / (stats.bridgedCall));
                if (!isFinite($scope.connectRate)) {
                    $scope.connectRate = 0;
                }

                $scope.awt = 0;
                if (stats.waitSec && stats.connectedCall) {
                    $scope.awt = Math.round((stats.waitSec / stats.connectedCall));
                }

                $scope.abandoned = ((stats.predictAbandoned * 100) / stats.callCount) || 0;

                $scope.attempts = (stats.callCount || 0);
                $scope.bridgedCall = (stats.bridgedCall || 0);
                $scope.connectedCall = (stats.connectedCall || 0);

                var amdAbandoned = 0;
                if (amd.enabled) {
                    if (stats.amd && isFinite(stats.amd.MACHINE)) {
                        amdAbandoned += stats.amd.MACHINE;
                        if (!amd.allowNotSure && isFinite(stats.amd.NOTSURE)) {
                            amdAbandoned += stats.amd.NOTSURE;
                        }
                    }
                }

                $scope.sl = ((stats.predictAbandoned * 100) / ($scope.connectedCall - amdAbandoned) ) || 0;

                $scope.lastProcessOnDate = null;
                $scope.lastProcessOnTime = null;
                $scope.processState = null;
                if (stats.readyOn) {
                    var date = new Date(stats.readyOn);
                    $scope.lastProcessOnDate = date.toLocaleDateString();
                    $scope.lastProcessOnTime = date.toLocaleTimeString();
                    $scope.processState = 1;
                } else if (stats.stopOn) {
                    var date = new Date(stats.stopOn);
                    $scope.lastProcessOnDate = date.toLocaleDateString();
                    $scope.lastProcessOnTime = date.toLocaleTimeString();
                }

                if (stats.amd) {
                    var data = [];
                    var notMachine = 0;

                    for (var key in stats.amd) {
                        if (key !== 'MACHINE') {
                            notMachine += stats.amd[key]
                        }
                        data.push({
                            key: key,
                            y: stats.amd[key]
                        })
                    }

                    var m = stats.amd["MACHINE"];
                    if (m) {
                        $scope.amdMachine = ((m - (stats.amd["CANCEL"] || 0)) * 100) /  $scope.connectedCall ;
                    } else {
                        $scope.amdMachine = 0;
                    }


                    $scope.amdState.data = data;
                }
            }

            $scope.causeCartCompleteStr = "";

            $scope.predictAdjustChart = {
                data: {
                    "ranges": [0, 100],
                    "rangeLabels": ["Min", "Max"],
                    "measures": [0],
                    "measureLabels": ["Current"],
                    "markers": [0],
                    "markerLabels": ["Current"]
                },
                options: {
                    chart: {
                        type: 'bulletChart',
                        margin: {
                            top: 10,
                            right: 20,
                            bottom: 10,
                            left: 20
                        },
                        tooltip: {
                            enabled: true,
                            valueFormatter: function (d) {
                                return d3.format(',f')(d)
                            }
                        }
                    },
                    title: {
                        enable: false,
                        text: ""
                    }
                }
            };

            $scope.causeCartComplete = {
                data: {

                },
                options: {
                    chart: {
                        type: 'bulletChart',
                        margin: {
                            top: 10,
                            right: 20,
                            bottom: 10,
                            left: 20
                        },
                        tooltip: {
                            enabled: true,
                            valueFormatter: function (d) {
                                return d3.format(',f')(d)
                            }
                        }
                    },
                    title: {
                        enable: false,
                        text: ""
                    }
                }
            };
            $scope.causeCart = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "Members by end cause"
                    },
                    chart: {
                        type: 'discreteBarChart',
                        height: 480,
                        margin : {
                            top: 20,
                            right: 20,
                            bottom: 150,
                            left: 50
                        },
                        // yDomain: [0, 100],
                        x: function(d){return d.label;},
                        y: function(d){return d.value;},
                        showValues: true,
                        valueFormat: function(d){
                            return d3.format(',d')(d);
                        },

                        duration: 500,
                        xAxis: {
                            rotateYLabel: true,
                            rotateLabels: 45,
                            fontSize: 10
                        },
                        yAxis: {
                            axisLabel: 'Count',
                            axisLabelDistance: 0,
                            tickFormat: function(d){
                                return d3.format(',d')(d);
                            }
                        }
                    }
                }
            };
            $scope.causeByAttemptCart = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "TOP 10 hangup causes"
                    },
                    chart: {
                        type: 'discreteBarChart',
                        height: 480,
                        margin : {
                            top: 20,
                            right: 20,
                            bottom: 150,
                            left: 50
                        },
                        // yDomain: [0, 100],
                        x: function(d){return d.label;},
                        y: function(d){return d.value;},
                        showValues: true,
                        valueFormat: function(d){
                            return d3.format(',.2%')(d);
                        },

                        duration: 500,
                        xAxis: {
                            rotateYLabel: true,
                            rotateLabels: 45,
                            fontSize: 10
                        },
                        yAxis: {
                            // axisLabel: '%',
                           // axisLabelDistance: 0,
                            showMaxMin: false,
                            tickFormat: function(d){
                                return d3.format(',.0%')(d);
                            }
                        }
                    }
                }
            };
            $scope.byCommunicationWaitingType = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "Communication types"
                    },
                    chart: {
                        type: 'pieChart',
                        height: 350,
                        margin : {
                            top: 5,
                            right: 0,
                            bottom: 0,
                            left: 0
                        },
                        donut: true,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showValues: true,
                        showLegend: false,
                        valueFormat: function(d){
                            return d3.format(',d')(d);
                        },

                        duration: 500,
                        xAxis: {
                            axisLabel: 'Type'
                        },
                        yAxis: {
                            axisLabel: 'Count',
                            axisLabelDistance: 0,
                            tickFormat: function(d){
                                return d3.format(',d')(d);
                            }
                        }
                    }
                }
            };
            $scope.callbackType = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "Callback success"
                    },
                    chart: {
                        type: 'pieChart',
                        height: 350,
                        margin : {
                            top: 5,
                            right: 0,
                            bottom: 0,
                            left: 0
                        },
                        donut: true,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showValues: true,
                        showLegend: false,
                        valueFormat: function(d){
                            return d3.format(',d')(d);
                        },

                        duration: 500,
                        xAxis: {
                            axisLabel: 'Type'
                        },
                        yAxis: {
                            axisLabel: 'Count',
                            axisLabelDistance: 0,
                            tickFormat: function(d){
                                return d3.format(',d')(d);
                            }
                        }
                    }
                }
            };
            
            $scope.amdState = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "AMD"
                    },
                    chart: {
                        type: 'pieChart',
                        margin: {
                            top: 5,
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
                        // pie: {
                        //     startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
                        //     endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
                        // },
                        height: 350,
                        x: function(d){
                            return d.key;
                        },
                        y: function(d){
                            return d.y;
                        },
                        showLabels: true,
                        showLegend: false,
                        //  donutRatio: 0.3,
                        donut: true,
                        // transitionDuration: 500,
                        // labelThreshold: 0.02,
                        // legendPosition: "right"
                    }
                }
            };
            $scope.accountState = {
                data: [
                    {
                        key: 'State',
                        values: liveAgentsStates
                    }
                ],
                options: {
                    "chart": {
                        "type": "multiBarHorizontalChart",
                        "height": 250,
                        "showControls": false,
                        "showValues": true,
                        "showLegend": false,
                        "showXAxis": false,
                        margin : {
                            top: 10,
                            right: 20,
                            bottom: 50,
                            left: 5
                        },
                        valueFormat: function (d) {
                            return d3.format(',f')(d)
                        },
                        "barColor": function (i) {
                            if (stateSettings.hasOwnProperty(i.x)) {
                                return stateSettings[i.x].color;
                            }
                        },
                        //  "duration": 500,
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
                            tickFormat: function (d) {
                                return d3.format(',f')(d)
                            }
                        }
                    }
                }
            };
            $scope.callbackByDescription = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "Callback description"
                    },
                    chart: {
                        type: 'discreteBarChart',
                        height: 480,
                        margin : {
                            top: 20,
                            right: 20,
                            bottom: 150,
                            left: 50
                        },
                        // yDomain: [0, 100],
                        x: function(d){return d.label;},
                        y: function(d){return d.value;},
                        showValues: true,
                        valueFormat: function(d){
                            return d3.format(',d')(d);
                        },
                        duration: 500,
                        xAxis: {
                            rotateYLabel: true,
                            rotateLabels: 45,
                            fontSize: 10
                        },
                        yAxis: {
                            axisLabel: 'Count',
                            axisLabelDistance: 0,
                            tickFormat: function(d){
                                return d3.format(',d')(d);
                            }
                        }
                    }
                }
            };


            $scope.amdMachine = 0;

            function reloadCause() {
                if (!$scope.id || !$scope.domain)
                    return notifi.error(new Error("Bad parameters (id, domain is required)."));

                // DialerModel.members.aggregate(domain, id, aggCountLock, function (err, res) {
                //     if (err)
                //         return notifi.error(err);
                //     var calls = 0;
                //     if (res && res[0])
                //         calls = res[0].count;
                //
                //
                //     $scope.chartActiveCall = {
                //         type: "Gauge",
                //         options: {
                //             'height':'300',
                //             'width':'100%',
                //             max: maxCall,
                //             min: 0,
                //
                //             redFrom: 0,
                //             redTo: Math.ceil(maxCall * 75 / 100),
                //             yellowFrom: Math.ceil(maxCall * 75 / 100),
                //             yellowTo: Math.ceil(maxCall * 90 / 100),
                //             greenFrom: Math.ceil(maxCall * 90 / 100),
                //             greenTo: maxCall,
                //             minorTicks: 5
                //         },
                //         data: [
                //             ['Label', 'Value'],
                //             ['Members', calls]
                //         ]
                //     }
                // });

                DialerModel.members.aggregate($scope.domain, $scope.id, aggCause, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    var rows = [];
                    var rowsNumberTypeStart = [];
                    var rowsCauseByAttempt = [];
                    var rowsCallbackStatus = [];
                    var rowsCallbackDescription = [];

                    var waiting = 0;
                    var end = 0;

                    var byCause = res[0].byCause;
                    var byTypeStateStart = res[0].byTypeStateStart;
                    var causeByAttempt = res[0].causeByAttempt;
                    var callbackStatus = res[0].callbackStatus;
                    var callbackDescription = res[0].callbackDescription;

                    angular.forEach(byCause, function (item) {

                        if (!item._id) {
                            // rows.push({
                            //     label: "WAITING",
                            //     value: item.count
                            // });
                            waiting = item.count;
                        } else {
                            rows.push({
                                label: item._id,
                                value: item.count
                            });
                            end += item.count;
                        }

                    });

                    var _attempt = causeByAttempt && causeByAttempt[0];
                    if (_attempt && _attempt.keys) {
                        for (var i = 0, len = _attempt.keys.length; i < len && i < 10; i++) {
                            rowsCauseByAttempt.push({
                                label: _attempt.keys[i],
                                count: _attempt.sumValues[i],
                                value: _attempt.percentages[i]
                            });
                        }
                    }

                    angular.forEach(byTypeStateStart, function (item) {

                        if (!item._id) {
                            rowsNumberTypeStart.push({
                                key: "EMPTY",
                                y: item.count
                            });
                        } else {
                            rowsNumberTypeStart.push({
                                key: communicationTypes[item._id] ? communicationTypes[item._id] : "EMPTY",
                                y: item.count
                            });
                        }

                    });
                    
                    angular.forEach(callbackStatus, function (item) {
                        if (item._id === null) {
                            rowsCallbackStatus.push({
                                key: "Timeout old",
                                y: item.count
                            });
                        } else {
                            rowsCallbackStatus.push({
                                key: item._id,
                                y: item.count
                            });
                        }
                    });

                    angular.forEach(callbackDescription, function (item) {

                        if (item._id) {
                            rowsCallbackDescription.push({
                                label: item._id,
                                value: item.count
                            });
                        }
                    });

                    $scope.causeCartComplete.data = {
                        "ranges": [0, end + waiting],
                        "rangeLabels": ["Start", "Total"],
                        "measures": [end],
                        "measureLabels": ["Done"],
                        "markers": [waiting],
                        "markerLabels": ["Waiting"]
                    };
                    if ((end + waiting) > 0) {
                        $scope.causeCartCompleteStr = ((end * 100) / (end + waiting) ).toFixed(2) + '% members completed';
                    } else {
                        $scope.causeCartCompleteStr = '0% members completed';
                    }

                    $scope.causeCart.data = [
                        {
                            key: "End cause",
                            values: rows
                        }
                    ];

                    $scope.causeByAttemptCart.data = [
                        {
                            key: "Cause",
                            values: rowsCauseByAttempt
                        }
                    ];
                    $scope.callbackByDescription.data = [
                        {
                            key: "Description",
                            values: rowsCallbackDescription
                        }
                    ];

                    $scope.byCommunicationWaitingType.data = rowsNumberTypeStart;
                    $scope.callbackType.data = rowsCallbackStatus;
                });
            };

            $scope.changeStatus = function (accountId) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/accounts/changeStatus.html',
                    controller: 'AccountStateCtrl',
                    // size: 'md',
                    resolve: {
                        options: function () {
                            return {
                                id: accountId,
                                domain: $scope.domain,
                                state: '',
                                status: '',
                                descript: '',
                                isAgent: true,
                                disableConsoleStatus: true
                            };
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    if (result.update) {
                        // reloadData();

                    }
                }, function () {

                });
            };

            function _applyAgentLiveSates() {
                if (_applyAgentLiveSatesTimerId) {
                    $timeout.cancel(_applyAgentLiveSatesTimerId);
                }
                if (document.hidden) {
                    _applyAgentLiveSatesTimerId = $timeout(_applyAgentLiveSates, 500);
                    return;
                }
                clearAgentLiveState();
                var date = Date.now();
                angular.forEach($scope.agentDisplayedCollection, function (item) {
                    item.lastChange = Math.floor((date - item.lastChangeTime) / 1000);
                    item.wt = item.ready_time - date > 0;
                    $scope.liveAgentsStates[item.stateName]++;
                });

                liveAgentsStates = [];
                angular.forEach($scope.liveAgentsStates, function (val, key) {
                    liveAgentsStates.push({
                        x: key,
                        y: val
                    })
                });

                $scope.accountState.data[0].values = liveAgentsStates;
                _applyAgentLiveSatesTimerId = $timeout(_applyAgentLiveSates, 500);
                // $scope.$apply();
            }
            _applyAgentLiveSates();
            reload();

    }]);

    app.controller('DialerResourceDialStringCtrl', ['$scope', '$modalInstance', 'resource',
        function ($scope, $modalInstance, resource) {

        $scope.dialedNumber = angular.copy(resource.dialedNumber);
        $scope.disabled = angular.copy(resource.disabled);

        var id = resource.$$hashKey;

        $scope.ok = function () {
            if (!$scope.dialedNumber) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close({value: $scope.dialedNumber, id: id, disabled: $scope.disabled}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);

    app.filter('cdrExportColumns', function ($filter) {
        return function (items, m) {
            var res = {};
            angular.forEach(items, function (v, k) {
                if (v.hasOwnProperty('filter')) {
                    for (var key in v.filter) {
                        if (m.hasOwnProperty(key) && m[key] === v.filter[key]) {
                            res[k] = v;
                        }
                    }
                } else {
                    res[k] = v;
                }
            });
            return res;
        }
    })
});
