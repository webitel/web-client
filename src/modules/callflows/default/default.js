define(['app', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'scripts/webitel/utils', 'modules/callflows/default/defaultModel',
    'modules/calendar/calendarModel', 'modules/media/mediaModel', 'modules/acd/acdModel', 'modules/accounts/accountModel',
		'ui-ace', 'modules/callflows/diagram/diagram', 'css!modules/callflows/diagram/diagram.css'
	], function (app, aceEditor, callflowUtils, utils) {
    app.controller('CallflowDefaultCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CallflowDefaultModel',
		'CalendarModel', 'MediaModel', 'AcdModel', 'AccountModel',
    	'$location', '$route', '$routeParams', '$confirm', '$window', 'FileUploader', '$filter', 'TableSearch', '$timeout',
		'cfpLoadingBar', '$modal',
        function ($scope, webitel, $rootScope, notifi, CallflowDefaultModel, CalendarModel, MediaModel, AcdModel, AccountModel, $location, $route, $routeParams, $confirm
        	,$window, FileUploader, $filter, TableSearch, $timeout, cfpLoadingBar, $modal) {
        	$scope.domain = webitel.domain();

			$scope.cf = aceEditor.getStrFromJson([]);
			$scope.cfOnDisconnect = aceEditor.getStrFromJson([]);
			$scope.default = {};
	        $scope.rowCollection = [];
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

			$scope.query = TableSearch.get('defaults');

			$scope.$watch("query", function (newVal) {
				TableSearch.set(newVal, 'defaults')
			});

			$scope.$watch('[default,cf,cfOnDisconnect]', function(newValue, oldValue) {
				if ($scope.default._new)
					return $scope.isEdit = $scope.isNew = true;

				return $scope.isEdit = !!oldValue[0].id;
			}, true);

			$scope.cancel = function () {
				$scope.default = angular.copy($scope.oldDefault);
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

			$scope.aceLoaded = function(_editor) {
				// Options
				aceEditor.init(_editor);
			};

			// $scope.default = CallflowDefaultModel.create();

	        function initPage () {
				$scope.timeZones = callflowUtils.timeZones;

				//editor = aceEditor.create('callflowJSONEditor');
	        };

	        $scope.canDelete = webitel.connection.session.checkResource('rotes/default', 'd');
	        $scope.canUpdate = webitel.connection.session.checkResource('rotes/default', 'u');
	        $scope.canCreate = webitel.connection.session.checkResource('rotes/default', 'c');

			$scope.viewMode = !$scope.canUpdate;
			$scope.view = function () {
				initPage();
				var id = $routeParams.id;
				var domain = $routeParams.domain;
				CallflowDefaultModel.item(id, domain, function (err, res) {
					if (err)
						return notifi.error(err);
					$scope.default = res;
					var cf = callflowUtils.replaceExpression(res.callflow);
					var cfOnDisconnect = callflowUtils.replaceExpression(res.callflow_on_disconnect);
					$scope.cf = aceEditor.getStrFromJson(cf);
					$scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
					disableEditMode();
				});
			};


	        $scope.closePage = closePage;
	        $scope.edit = edit;
	        $scope.create = create;
	        $scope.save = save;
	        $scope.reloadData = reloadData;
            $scope.openDiagram = openDiagram;
            $scope.saveDiagram = saveDiagram;
            $scope.createVisual = createVisual;
            $scope.disableVisual = disableVisual;
            $scope.initCalendars = initCalendars;
            $scope.initMedia = initMedia;
            $scope.initDirectory = initDirectory;
            $scope.initAcd = initAcd;
            $scope.initDiagramParams = initDiagramParams;
            $scope.onDebugDiagram = onDebugDiagram;

			$scope.downloadScheme = function (row) {
				utils.saveJsonToPc(row, row.name + '.json');
			};

			function initDiagramParams(){
                $scope.initCalendars();
                $scope.initMedia();
                $scope.initDirectory();
                $scope.initAcd();
			}

            function initCalendars(){
                CalendarModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.data;
                    angular.forEach(data, function (v) {
                        c.push(v.name);
                    });
                    $scope.calendars = c;

                });
            }

            function initMedia(){
                MediaModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res;
                    angular.forEach(data, function (v) {
                        c.push(v.name);
                    });
                    $scope.media = c;

                });
            }

            function initDirectory(){
				AccountModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.info;
                    Object.keys(data).forEach(function (v) {
                        c.push(v);
                    });
                    $scope.accounts = c;

                });
            }

            function initAcd(){
                AcdModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res;
                    angular.forEach(data, function (v) {
                        c.push(v.name);
                    });
                    $scope.acd = c;

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
                    if($scope.default.name && $scope.default.destination_number && $scope.default.fs_timezone)$scope.save();
                }
            }

            function createVisual(){
                DiagramDesigner.init();
                $scope.cfDiagram = CallflowDiagram.createDiagram(JSON.parse($scope.cf));
                $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
                var cd = CallflowDiagram.getCallflowJSON();
                $scope.cf = cd ? aceEditor.getStrFromJson(cd.callflowJson) : aceEditor.getStrFromJson($scope.cf);
                DiagramDesigner.removeDesigner();
            }

            function openDiagram(value) {
                $scope.diagramOpened = value;
                if(value) {
					window.removeEventListener('keydown', window.keydownDiagramListener);
					DiagramDesigner.init();

                    CallflowDiagram.onDebug.subscribe(openDebugWindow);

                    CallflowDiagram.setWebitelParams({
                        media: $scope.media || [],
                        calendar: $scope.calendars || [],
                        acd: $scope.acd || [],
                        directory: $scope.accounts || []
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

			function uploadJson (data, update) {
				function cb(err, res) {
					if (err)
						return notifi.error(err, 5000);

					reloadData();
					var str;
					if (update) {
						str = "Updated: " + res.data.name;
					} else {
						str = "Created: new id " + res.data.id;
					}
					return notifi.success(str, 2000);
				};

				if (update) {
					CallflowDefaultModel.update(data, $scope.domain, cb)
				} else {
					CallflowDefaultModel.add(data, $scope.domain, cb);
				}
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
						data.fs_timezone = {
							id: data.fs_timezone
						};
						CallflowDefaultModel.item(data.id, $scope.domain, function (err, res) {
							if (err && err.statusCode !== 404)
								return notifi.error(err, 3000);

							uploadJson(data, !!res);
						});
					} catch (e) {
						notifi.error(e, 10000);
					}
				};
				reader.readAsText(item._file);
			};

			$scope.up = function (row) {
                CallflowDefaultModel.move(row.id, $scope.domain, true, function (err) {
                    if (err)
                        return notifi.error(err, 1000);
                    reloadData();
                })
			};

			$scope.down = function (row) {
                CallflowDefaultModel.move(row.id, $scope.domain, false, function (err) {
					if (err)
						return notifi.error(err, 1000);
                    reloadData();
                })
			};


	        function create() {
				initPage();
	        	$scope.default = CallflowDefaultModel.create();
				$scope.default._new = true;
				//editor._setJson([{"setVar": []}]);
	        }


	        //TODO
            var subscribeLogEvent = false;
            var observeCallUuid = "";
            var observeCallPrevAppId = "";
            function fnNotificationLog(e) {
                switch (e.action) {
                    case "log":
                        return notifi.info(e['message'], 5000);
                    case "execute":

                        if (e.uuid === observeCallUuid) {
                            $('.basic-node.executed').removeClass('executed');

                            if (e["app-id"] === "end") {
                                observeCallUuid = "";
                                observeCallPrevAppId = "";
                            }

                            $('div[data-nodeid=' + e['app-id'] + ']').children().addClass("executed");

                            (function (cid, pid) {
                                var id = findLinkId(cid, pid);
                                var elem = $('svg g g path[data-linkid=' + id + ']').prev();
                                if (!id) return;

                                elem.attr('executed-link', 'true');
                                setTimeout(function () {
                                    elem.attr('executed-link', 'false');
                                }, 1500);
                            })(e['app-id'], observeCallPrevAppId);

                            observeCallPrevAppId = e['app-id'];
                        }
                }
            }


            function findNodeByType(type) {
                var nodes = $scope.cfDiagram.nodes;
                i = nodes.length;
                while (i--) {
                    if (nodes[i].type === type) {
                        return nodes[i].id;
                    }
                }
            }

            function findLinkId(currentApp, prevApp) {
                var i = 0;
                if (!prevApp) {
                    prevApp = findNodeByType("start");
                }

                var links = $scope.cfDiagram.links;
                i = links.length;
                while (i--) {
                    if (links[i].target === currentApp && links[i].source === prevApp) {
                        return links[i].id
                    }
                }
            }

            function openDebugWindow() {
                var number;
                var id;
                var domain;
                observeCallUuid = webitel.guid();

                try {
                    id = $scope.default.id;
                    domain = $scope.default.domain;
                } catch (e) {
                    console.error(e)
                }

                if (!domain) {
                    notifi.error("No route domain!", 5000);
                    return;
                }

                if (!id) {
                    notifi.error("No route id!", 5000);
                    return;
                }

                function callback (err, res) {
                    if (err)
                        return notifi.error(err, 8000);
                }

                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/callflows/debugDialog.html',
                    controller: function ($scope, $modalInstance, options) {
                        $scope.visCaller = true;
                        $scope.visDestination = true;
                        $scope.data = {
                            caller: options.caller,
                            destination: ""
                        };

                        $scope.ok = function () {
                            $modalInstance.close($scope.data, 5000);
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        options: function () {
                            return {
                                visCaller: true,
                                caller: webitel.connection.session.domain ? webitel.connection.session.id : ""
                            };
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    setDebugMode(id, function () {
                        CallflowDefaultModel.debug(id, observeCallUuid, result.caller, domain, result.destination, callback)
                    });
                }, function () {

                });
            }

            function setDebugMode(id, cb) {
                if (subscribeLogEvent)
                    return cb && cb();
                subscribeLogEvent = true;
                webitel.connection.instance.onServerEvent("SE::BROADCAST", fnNotificationLog,  {id: id, name: "log"}, cb);
                $scope.$on('$destroy', function () {
                    webitel.connection.instance.unServerEvent('SE::BROADCAST', {}, fnNotificationLog);
                });
            }


            function edit() {
				initPage();
                $scope.initDiagramParams();

	            var id = $routeParams.id;
	            var domain = $routeParams.domain;	        	
	        	CallflowDefaultModel.item(id, domain, function (err, res) {
	        		if (err)
	        			return notifi.error(err);
	        		$scope.default = res;
	        		$scope.oldDefault = angular.copy(res);
	        		var cf = callflowUtils.replaceExpression(res.callflow);
	        		var cfOnDisconnect = callflowUtils.replaceExpression(res.callflow_on_disconnect);
					$scope.cf = aceEditor.getStrFromJson(cf);
                    $scope.cfDiagram = angular.copy(res.cf_diagram);
                    $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
					$scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
					$scope.oldCf = angular.copy($scope.cf);
					$scope.oldCfOnDisconnect = angular.copy($scope.cfOnDisconnect);
                    if(!!$scope.cfDiagram)$scope.visualCfEnabled = true;
                    if(!!$scope.cfOnDisconnectDiagram)$scope.visualOnDiscEnabled = true;
					disableEditMode();

                    if (res.debug && res.id) {
                        setDebugMode(res.id)
                    }
	        	});
	        };

	        function save() {
	        	try {
	        		function cb (err, res) {
	        			if (err) 
        					return notifi.error(err);

						if ($scope.default._new) {
							return $location.path('/callflows/default/' + res.data.id + '/edit');
						} else {
							$scope.default.__time = Date.now();
							return edit();
						};
	        		};
                    // if(!$scope.visualCfEnabled) {
                    //     DiagramDesigner.init();
                    //     $scope.cfDiagram = CallflowDiagram.createDiagram(JSON.parse($scope.cf));
                    //     var cd = CallflowDiagram.getCallflowJSON();
                    //     $scope.cf = cd ? JSON.stringify(cd.callflowJson) : $scope.cf;
                    //     DiagramDesigner.removeDesigner();
                    // }
                    $scope.default.cfDiagram = angular.copy($scope.cfDiagram);
	        		$scope.default.callflow = JSON.parse($scope.cf);
					if ($scope.cfOnDisconnect) {
						$scope.default.callflow_on_disconnect = JSON.parse($scope.cfOnDisconnect);
					} else {
						$scope.default.callflow_on_disconnect = [];
					}
		        	if (!$scope.default.id) {
	        			CallflowDefaultModel.add($scope.default, $scope.domain, cb)
		        	} else {
		        		CallflowDefaultModel.update($scope.default, $scope.domain, cb)
		        	}
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
                    CallflowDefaultModel.remove(row.id, $scope.domain, function (err) {
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
	            if ($location.$$path !== '/callflows/default')
	                return $scope.domain;

				if (!$scope.domain)
					return $scope.rowCollection = [];

				$scope.isLoading = true;
				CallflowDefaultModel.list($scope.domain, function (err, res) {
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
	        	$location.path('/callflows/default');
	        	//$window.history.back();
        	};

	        $scope.init = function init () {
	            if (!!$route.current.method) {
	                return $scope[$route.current.method]();
	            };
	        }();
    }])
});
