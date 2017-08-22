define(['app', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'scripts/webitel/utils', 'modules/callflows/default/defaultModel',
		'ui-ace', 'modules/callflows/diagram/diagram', 'css!modules/callflows/diagram/diagram.css'
	], function (app, aceEditor, callflowUtils, utils) {
    app.controller('CallflowDefaultCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CallflowDefaultModel',
    	'$location', '$route', '$routeParams', '$confirm', '$window', 'FileUploader', '$filter', 'TableSearch', '$timeout',
		'cfpLoadingBar',
        function ($scope, webitel, $rootScope, notifi, CallflowDefaultModel, $location, $route, $routeParams, $confirm
        	,$window, FileUploader, $filter, TableSearch, $timeout, cfpLoadingBar) {
        	$scope.domain = webitel.domain();

			$scope.cf = aceEditor.getStrFromJson([]);
			$scope.cfOnDisconnect = aceEditor.getStrFromJson([]);
			$scope.default = {},
	        $scope.rowCollection = [];
	        $scope.isLoading = false;
            $scope.diagramOpened = false;
            $scope.cfDiagram = {};

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

				return $scope.isEdit = !!oldValue[0]._id;
			}, true);

			$scope.cancel = function () {
				$scope.default = angular.copy($scope.oldDefault);
				$scope.cf = angular.copy($scope.oldCf);
                $scope.cfDiagram = angular.copy($scope.oldCfDiagram);
				$scope.cfOnDisconnect = angular.copy($scope.oldCfOnDisconnect);
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
					var cfOnDisconnect = callflowUtils.replaceExpression(res.onDisconnect);
					//$scope.cfDiagram = res.cfDiagram;
					$scope.cf = aceEditor.getStrFromJson(cf);
					$scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
					//if(!!$scope.cfDiagram)$scope.visualEnabled = true;
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
            $scope.disableVisual = disableVisual;

			$scope.downloadScheme = function (row) {
				utils.saveJsonToPc(row, row.name + '.json');
			};

            function disableVisual() {
                $scope.visualEnabled = false;
                $scope.cfDiagram = null;
            }

			function saveDiagram() {
				var cfGetter = getCallflowJSON();
				$scope.diagramOpened = false;
                $scope.cf = aceEditor.getStrFromJson(cfGetter.callflowJson);
                $scope.cfDiagram = cfGetter.callflowModel;
                CallflowDiagram.clearReducer();
                DiagramDesigner.removeDesigner();
                $scope.visualEnabled = true;
            }

            function openDiagram(value) {
                $scope.diagramOpened = value;
                if(value) {
					DiagramDesigner.init();
                    setTimeout(function(){
                        if(!!$scope.cfDiagram)CallflowDiagram.updateModel($scope.cfDiagram);
                        else CallflowDiagram.updateModel({
                            id: webitel.guid(),
                            offsetX: 0,
                            offsetY: 0,
                            zoom: 100,
                            links: [],
                            nodes: []
                        });
                    }, 1);

                }
                else{
                    CallflowDiagram.updateModel();
                    CallflowDiagram.clearReducer();
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
						CallflowDefaultModel.item(data._id, $scope.domain, function (err, res) {
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

			$scope.up = function (row) {
				var newOrder = row.order - 1;
				var array = $filter('orderBy')($scope.rowCollection, 'order');
				for (var i in array) {
					if (array[i]._id == row._id) {
						newOrder = (array[+i - 1] && array[+i - 1].order) -1;
						break;
					};
				};
				if (isNaN(newOrder))
					return;
				CallflowDefaultModel.incOrder($scope.domain, row.order, 1, function (err, res) {
					if (err)
						return notifi.error(err, 10000);

					CallflowDefaultModel.setOrder(row._id, $scope.domain, newOrder, function (err, res) {
						if (err)
							return notifi.error(err, 10000);

						reloadData();
					});
				});
			};

			$scope.down = function (row) {
				var newOrder = row.order - 1;
				var array = $filter('orderBy')($scope.rowCollection, 'order');
				for (var i in array) {
					if (array[i]._id == row._id) {
						newOrder = (array[+i + 1] && array[+i + 1].order) + 1;
						break;
					};
				};
				if (isNaN(newOrder))
					return;
				CallflowDefaultModel.incOrder($scope.domain, row.order, -1, function (err, res) {
					if (err)
						return notifi.error(err, 10000);

					CallflowDefaultModel.setOrder(row._id, $scope.domain, newOrder, function (err, res) {
						if (err)
							return notifi.error(err, 10000);

						reloadData();
					});
				});
			};


	        function create() {
				initPage();
	        	$scope.default = CallflowDefaultModel.create();
				$scope.default._new = true;
				//editor._setJson([{"setVar": []}]);
	        };

	        function edit() {
				initPage();
	            var id = $routeParams.id;
	            var domain = $routeParams.domain;	        	
	        	CallflowDefaultModel.item(id, domain, function (err, res) {
	        		if (err)
	        			return notifi.error(err);
	        		$scope.default = res;
	        		$scope.oldDefault = angular.copy(res);
	        		var cf = callflowUtils.replaceExpression(res.callflow);
	        		var cfOnDisconnect = callflowUtils.replaceExpression(res.onDisconnect);
					$scope.cf = aceEditor.getStrFromJson(cf);
                    $scope.cfDiagram = res.cfDiagram;
                    $scope.oldCfDiagram = angular.copy($scope.cfDiagram);
					$scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
					$scope.oldCf = angular.copy($scope.cf);
					$scope.oldCfOnDisconnect = angular.copy($scope.cfOnDisconnect);
                    if(!!$scope.cfDiagram)$scope.visualEnabled = true;
					disableEditMode();
	        	});
	        };

	        function save() {
	        	try {
	        		function cb (err, res) {
	        			if (err) 
        					return notifi.error(err);

						if ($scope.default._new) {
							return $location.path('/callflows/default/' + res.info + '/edit');
						} else {
							$scope.default.__time = Date.now();
							return edit();
						};
	        		};

                    $scope.default.cfDiagram = $scope.cfDiagram;
	        		$scope.default.callflow = JSON.parse($scope.cf);
					if ($scope.cfOnDisconnect) {
						$scope.default.onDisconnect = JSON.parse($scope.cfOnDisconnect);
					} else {
						$scope.default.onDisconnect = [];
					}
		        	if (!$scope.default._id) {
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
                    CallflowDefaultModel.remove(row._id, $scope.domain, function (err) {
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
	            if ($location.$$path != '/callflows/default')
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
