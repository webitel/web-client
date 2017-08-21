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
					$scope.cfDiagram = res.cfDiagram;
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

			$scope.downloadScheme = function (row) {
				utils.saveJsonToPc(row, row.name + '.json');
			};

			function openDiagram(value) {
				$scope.diagramOpened = value;
                //window.callflow = JSON.parse('{"id":"7e790c62-6422-45bc-bff5-d019ecebc819","offsetX":1,"offsetY":0,"zoom":100,"links":[],"nodes":[{"id":"b6a2a052-1bf9-4cbd-b213-06dc17e12412","_class":"PlaybackNodeModel","selected":false,"type":"playback","x":252,"y":333,"extras":{"playback":{"files":[]}},"ports":[{"id":"fa1f859e-317a-4570-9497-b75d3f3aed72","_class":"DefaultPortModel","selected":false,"name":"output","parentNode":"b6a2a052-1bf9-4cbd-b213-06dc17e12412","links":[],"in":false,"label":"Out"},{"id":"260ba2d7-2780-4fc2-abe4-1a7aed651a02","_class":"DefaultPortModel","selected":false,"name":"input","parentNode":"b6a2a052-1bf9-4cbd-b213-06dc17e12412","links":[],"in":true,"label":"In"}],"name":"Playback","color":"rgb(114, 128, 150)"},{"id":"ac34a310-f9dc-4746-956c-c42e99aace45","_class":"LogNodeModel","selected":false,"type":"log","x":233,"y":488,"extras":{"log":""},"ports":[{"id":"57932603-3dbd-444d-8f4f-8a4c436113b1","_class":"DefaultPortModel","selected":false,"name":"output","parentNode":"ac34a310-f9dc-4746-956c-c42e99aace45","links":[],"in":false,"label":"Out"},{"id":"627bb8e6-6fce-4f1a-8e71-cc4895caa314","_class":"DefaultPortModel","selected":false,"name":"input","parentNode":"ac34a310-f9dc-4746-956c-c42e99aace45","links":[],"in":true,"label":"In"}],"name":"Log","color":"rgb(114, 128, 150)"},{"id":"97c58039-bb3d-4776-b882-6644d4fef1fe","_class":"PlayNDigitsNodeModel","selected":false,"type":"playNdigits","x":509,"y":508,"extras":{"playback":{"files":[],"getDigits":{"setVar":"","min":0,"max":0,"tries":0,"timeout":0,"flushDTMF":true}}},"ports":[{"id":"1248a9e1-8c96-454b-a790-6a2bf49ff043","_class":"DefaultPortModel","selected":false,"name":"output","parentNode":"97c58039-bb3d-4776-b882-6644d4fef1fe","links":[],"in":false,"label":"Out"},{"id":"804b5206-ced6-4ea4-8e6f-8d9ceea41cac","_class":"DefaultPortModel","selected":false,"name":"input","parentNode":"97c58039-bb3d-4776-b882-6644d4fef1fe","links":[],"in":true,"label":"In"}],"name":"Play and get digits","color":"rgb(114, 128, 150)"}]}')

				if(value) {
                    window.callflow = $scope.cfDiagram;
					DiagramDesigner.init();
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
					$scope.cfOnDisconnect = aceEditor.getStrFromJson(cfOnDisconnect);
					$scope.oldCf = angular.copy($scope.cf);
					$scope.oldCfOnDisconnect = angular.copy($scope.cfOnDisconnect);
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

            $scope.$watchCollection('cfDiagramChange', function(newValue, oldValue) {
               $scope.cfDiagram = window.callflow;
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
