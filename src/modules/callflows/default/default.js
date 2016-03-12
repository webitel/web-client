define(['app', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'scripts/webitel/utils', 'modules/callflows/default/defaultModel',
		'ui-ace'
	], function (app, aceEditor, callflowUtils, utils) {

    app.controller('CallflowDefaultCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CallflowDefaultModel',
    	'$location', '$route', '$routeParams', '$confirm', '$window', 'FileUploader', '$filter', 'TableSearch', '$timeout',
        function ($scope, webitel, $rootScope, notifi, CallflowDefaultModel, $location, $route, $routeParams, $confirm
        	,$window, FileUploader, $filter, TableSearch, $timeout) {
        	$scope.domain = webitel.domain();

			$scope.cf = aceEditor.getStrFromJson([]);
			$scope.default = {},
	        $scope.rowCollection = [];
	        $scope.isLoading = false;

			$scope.query = TableSearch.get('defaults');

			$scope.$watch("query", function (newVal) {
				TableSearch.set(newVal, 'defaults')
			});

			$scope.$watch('[default,cf]', function(newValue, oldValue) {
				if ($scope.default._new)
					return $scope.isEdit = $scope.isNew = true;

				return $scope.isEdit = !!oldValue[0]._id;
			}, true);

			$scope.cancel = function () {
				$scope.default = angular.copy($scope.oldDefault);
				$scope.cf = angular.copy($scope.oldCf);
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

	        $scope.closePage = closePage;
	        $scope.edit = edit;
	        $scope.create = create;
	        $scope.save = save;
	        $scope.reloadData = reloadData;

			$scope.downloadScheme = function (row) {
				utils.saveJsonToPc(row, row.name + '.json');
			};

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
					$.getJSON(event.target.result).then(function(data){
						CallflowDefaultModel.item(data._id, $scope.domain, function (err, res) {
							if (err)
								return notifi.error(err, 3000);

							uploadJson(data, !!res);
						});
					}).fail(function (res, e, err) {
						notifi.error(err);
					});

				};
				reader.readAsDataURL(item._file);
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
					$scope.cf = aceEditor.getStrFromJson(cf);
					$scope.oldCf = angular.copy($scope.cf);
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
