define(['app', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'modules/callflows/extension/extensionModel',
    'modules/calendar/calendarModel', 'modules/media/mediaModel', 'modules/acd/acdModel', 'modules/accounts/accountModel', 'modules/gateways/gatewayModel',
    'modules/callflows/diagram/diagram', 'css!modules/callflows/diagram/diagram.css'], function (app, aceEditor, callflowUtils) {

    app.controller('CallflowExtensionCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CallflowExtensionModel',
        'CalendarModel', 'MediaModel', 'AcdModel', 'AccountModel', 'GatewayModel',
        '$location', '$route', '$routeParams', '$confirm', '$window', 'TableSearch', '$timeout', 'cfpLoadingBar',
        function ($scope, webitel, $rootScope, notifi, CallflowExtensionModel, CalendarModel, MediaModel, AcdModel, AccountModel, GatewayModel, $location, $route, $routeParams, $confirm
            ,$window, TableSearch, $timeout, cfpLoadingBar) {
            $scope.domain = webitel.domain();
            $scope.cf = aceEditor.getStrFromJson([]);
            $scope.cfOnDisconnect = aceEditor.getStrFromJson([]);
            $scope.rowCollection = [];
            $scope.extension = {};
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

            $scope.canDelete = webitel.connection.session.checkResource('rotes/extension', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('rotes/extension', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('rotes/extension', 'c');

            $scope.viewMode = !$scope.canUpdate;
            
            $scope.view = function () {
                var id = $routeParams.id;
                var domain = $routeParams.domain;
                CallflowExtensionModel.item(id, domain, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    $scope.extension = res;
                    var cf = callflowUtils.replaceExpression(res.callflow);
                    var cfOnDisconnect = callflowUtils.replaceExpression(res.onDisconnect);
                    $scope.cf = aceEditor.getStrFromJson(cf);
                    $scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
                    disableEditMode();
                });
            };

            $scope.query = TableSearch.get('extensions');

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'extensions')
            });

            function initPage () {
                $scope.timeZones = callflowUtils.timeZones;
            };

            $scope.aceLoaded = aceEditor.init;

            $scope.canUpdate = webitel.connection.session.checkResource('rotes/default', 'u');

            $scope.closePage = closePage;
            $scope.edit = edit;
            $scope.save = save;
            $scope.reloadData = reloadData;
            $scope.openDiagram = openDiagram;
            $scope.saveDiagram = saveDiagram;
            $scope.createVisual = createVisual;
            $scope.disableVisual = disableVisual;
            $scope.onDebugDiagram = onDebugDiagram;

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
                    $scope.save();
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


            $scope.$watch('[extension,cf,cfOnDisconnect]', function(newValue, oldValue) {
                return $scope.isEdit = !!oldValue[0].id;
            }, true);

            $scope.cancel = function () {
                $scope.extension = angular.copy($scope.oldExtension);
                $scope.cf = angular.copy($scope.oldCf);
                $scope.cfDiagram = angular.copy($scope.oldCfDiagram);
                $scope.cfOnDisconnect = angular.copy($scope.oldCfOnDisconnect);
                if(!!$scope.cfDiagram)$scope.visualEnabled = true;
                disableEditMode();
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };


            function edit() {
                var id = $routeParams.id;
                var domain = $routeParams.domain;
                CallflowExtensionModel.item(id, domain, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    $scope.extension = res;
                    $scope.oldExtension = angular.copy(res);
                    var cf = callflowUtils.replaceExpression(res.callflow);
                    var cfOnDisconnect = callflowUtils.replaceExpression(res.callflow_on_disconnect);
                    $scope.cf = aceEditor.getStrFromJson(cf);
                    $scope.cfDiagram = angular.copy(res.cf_diagram);
                    $scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
                    $scope.oldCf = angular.copy($scope.cf);
                    $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
                    $scope.oldCfOnDisconnect = angular.copy($scope.cfOnDisconnect);
                    if(!!$scope.cfDiagram)$scope.visualCfEnabled = true;
                    disableEditMode();
                });
            };

            function save() {
                try {
                    function cb (err, res) {
                        if (err)
                            return notifi.error(err);

                        $scope.extension.__time = Date.now();
                        return edit();
                    };
                    // if(!$scope.visualCfEnabled) {
                    //     DiagramDesigner.init();
                    //     $scope.cfDiagram = CallflowDiagram.createDiagram(JSON.parse($scope.cf));
                    //     var cd = CallflowDiagram.getCallflowJSON();
                    //     $scope.cf = cd ? JSON.stringify(cd.callflowJson) : $scope.cf;
                    //     DiagramDesigner.removeDesigner();
                    // }
                    $scope.extension.cfDiagram = angular.copy($scope.cfDiagram);
                    $scope.extension.callflow = JSON.parse($scope.cf);
                    if ($scope.cfOnDisconnect) {
                        $scope.extension.onDisconnect = JSON.parse($scope.cfOnDisconnect);
                    } else {
                        $scope.extension.onDisconnect = [];
                    }

                    CallflowExtensionModel.update($scope.extension, $scope.domain, cb)
                } catch (e) {
                    notifi.error(e, 3000);
                }
            };

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.removeItem = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        CallflowExtensionModel.remove(row.id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData()
                        })
                    });
            }

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            });


            function reloadData () {
                if ($location.$$path !== '/callflows/extension')
                    return $scope.domain && initPage();

                if (!$scope.domain)
                    return $scope.rowCollection = [];

                $scope.isLoading = true;
                CallflowExtensionModel.list($scope.domain, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err);
                    var arr = [];
                    angular.forEach(res, function(item) {
                        arr.push(item);
                    });
                    $scope.rowCollection = arr;
                });
            };

            function closePage () {
                $location.path('/callflows/extension');
                //$window.history.back();
            };

            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();
        }])
});