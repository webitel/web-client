define(['app', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'scripts/webitel/utils', 'modules/callflows/public/publicModel',
    'modules/calendar/calendarModel', 'modules/media/mediaModel', 'modules/acd/acdModel', 'modules/accounts/accountModel',
	'tags-input', 'modules/callflows/diagram/diagram', 'css!modules/callflows/diagram/diagram.css'
	], function (app, aceEditor, callflowUtils, utils) {

	//app.extend( "ngTagsInput" );

	app.controller('CallflowPublicCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CallflowPublicModel',
		'CalendarModel', 'MediaModel', 'AcdModel', 'AccountModel',
    	'$location', '$route', '$routeParams', '$confirm', 'FileUploader', 'TableSearch', '$timeout', 'cfpLoadingBar', '$modal',
        function ($scope, webitel, $rootScope, notifi, CallflowPublicModel, CalendarModel, MediaModel, AcdModel, AccountModel, $location, $route, $routeParams, $confirm
        	,FileUploader, TableSearch, $timeout, cfpLoadingBar, $modal) {

        	$scope.domain = webitel.domain();
        	$scope.public = {};
			$scope.cf = aceEditor.getStrFromJson([]);
			$scope.cfOnDisconnect = aceEditor.getStrFromJson([]);
        	var editor;
	        $scope.rowCollection = [];
	        $scope.rowColflection = [];
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

			$scope.query = TableSearch.get('public');

			$scope.$watch("query", function (newVal) {
				TableSearch.set(newVal, 'public')
			});

	        function initPage () {
				$scope.timeZones = callflowUtils.timeZones;
	        };

			$scope.aceLoaded = function(_editor) {
				// Options
				aceEditor.init(_editor);
			};


			$scope.$watch('[public,cf,cfOnDisconnect]', function(newValue, oldValue) {
				if ($scope.public._new)
					return $scope.isEdit = $scope.isNew = true;

				return $scope.isEdit = !!oldValue[0].id;
			}, true);

			$scope.cancel = function () {
				$scope.public = angular.copy($scope.oldPublic);
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

	        $scope.canDelete = webitel.connection.session.checkResource('rotes/public', 'd');
	        $scope.canUpdate = webitel.connection.session.checkResource('rotes/public', 'u');
	        $scope.canCreate = webitel.connection.session.checkResource('rotes/public', 'c');

			$scope.viewMode = !$scope.canUpdate;
			$scope.view = function () {
				var id = $routeParams.id;
				var domain = $routeParams.domain;
				CallflowPublicModel.item(id, domain, function (err, res) {
					if (err)
						return notifi.error(err);
					$scope.public = res;
					$scope.oldPublic = angular.copy(res);
					var cf = callflowUtils.replaceExpression(res.callflow);
					var cfOnDisconnect = callflowUtils.replaceExpression(res.onDisconnect);
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

			// region File
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

            function createVisual(){
                DiagramDesigner.init();
                $scope.cfDiagram = CallflowDiagram.createDiagram(JSON.parse($scope.cf));
                $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
                var cd = CallflowDiagram.getCallflowJSON();
                $scope.cf = cd ? aceEditor.getStrFromJson(cd.callflowJson) : aceEditor.getStrFromJson($scope.cf);
                DiagramDesigner.removeDesigner();
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
                    if($scope.public.name && $scope.public.fs_timezone)$scope.save();
                }
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
                    setTimeout(function() {
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

                } else {
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
						str = "Updated: " + res.name;
					} else {
						str = "Created: " + res.data.name;
					}
					return notifi.success(str, 2000);
				};

				if (update) {
					CallflowPublicModel.update(data, $scope.domain, cb)
				} else {
					CallflowPublicModel.add(data, $scope.domain, cb);
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
						CallflowPublicModel.item(data.id, $scope.domain, function (err, res) {
							if (err)
								return notifi.error(err, 3000);

							uploadJson(data, !!res);
						});
					} catch (e) {
						notifi.error(e, 10000);
					}
				};
				reader.readAsText(item._file);
			};
			// endregion

	        function create() {
	        	$scope.public = CallflowPublicModel.create();
	        	$scope.public._new = true;
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
                    number = $scope.public.destination_number[0].text;
                    id = $scope.public.id;
                    domain = $scope.public.domain;
                } catch (e) {
                    console.error(e)
                }

				if (!number) {
					notifi.error("No route number!", 5000);
					return;
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
						$scope.data = {
                            caller: options.caller,
                            destination: ""
						};

                        $scope.ok = function (clearLog) {
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
                        CallflowPublicModel.debug(id, observeCallUuid, result.caller, domain, number, callback)
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
                $scope.initDiagramParams();
	            var id = $routeParams.id;
	            var domain = $routeParams.domain;	        	
	        	CallflowPublicModel.item(id, domain, function (err, res) {
	        		if (err)
	        			return notifi.error(err);
	        		$scope.public = res;
	        		$scope.oldPublic = angular.copy(res);
	        		var cf = callflowUtils.replaceExpression(res.callflow);
	        		var cfOnDisconnect = callflowUtils.replaceExpression(res.callflow_on_disconnect);
					$scope.cf = aceEditor.getStrFromJson(cf);
					$scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
                    $scope.cfDiagram = angular.copy(res.cf_diagram);
                    $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
					$scope.oldCf = angular.copy($scope.cf);
					$scope.oldCfOnDisconnect = angular.copy($scope.cfOnDisconnect);
                    if(!!$scope.cfDiagram)$scope.visualCfEnabled = true;
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

						if ($scope.public._new) {
							return $location.path('/callflows/public/' + res.info + '/edit');
						} else {
							$scope.public.__time = Date.now();
							return edit();
						};
					};
					if(typeof($scope.public.destination_number)==='string'){
						$scope.public.destination_number = $scope.public.destination_number.split(",");
					}
                    // if(!$scope.visualCfEnabled) {
                    //     DiagramDesigner.init();
                    //     $scope.cfDiagram = CallflowDiagram.createDiagram(JSON.parse($scope.cf));
                    //     var cd = CallflowDiagram.getCallflowJSON();
                    //     $scope.cf = cd ? JSON.stringify(cd.callflowJson) : $scope.cf;
                    //     DiagramDesigner.removeDesigner();
                    // }
                    $scope.public.cfDiagram = angular.copy($scope.cfDiagram);
	        		$scope.public.callflow = JSON.parse($scope.cf);
					if ($scope.cfOnDisconnect) {
						$scope.public.onDisconnect = JSON.parse($scope.cfOnDisconnect);
					} else {
						$scope.public.onDisconnect = [];
					}
		        	if (!$scope.public.id) {
	        			CallflowPublicModel.add($scope.public, $scope.domain, cb)
		        	} else {
		        		CallflowPublicModel.update($scope.public, $scope.domain, cb)
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
                    CallflowPublicModel.remove(row.id, $scope.domain, function (err) {
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
	            if ($location.$$path != '/callflows/public')
	                return $scope.domain && initPage();

				if (!$scope.domain)
					return $scope.rowCollection = [];

				$scope.isLoading = true;
				CallflowPublicModel.list($scope.domain, function (err, res) {
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
	        	$location.path('/callflows/public');
	        	//$window.history.back();
        	};

	        $scope.init = function init () {
	            if (!!$route.current.method) {
	                return $scope[$route.current.method]();
	            };
	        }();
    }])
});
