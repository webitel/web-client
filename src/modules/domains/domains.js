define(['app', 'scripts/webitel/utils',
	'scripts/webitel/domainModel'], function (app, utils) {

	 app.controller("DomainsCtrl", ['$scope', '$modal', 'DomainModel', '$routeParams', '$filter',
	 	'$location', '$route', 'notifi', '$confirm', 'webitel', 'TableSearch', '$timeout',
	  function ($scope, $modal, DomainModel, $routeParams, $filter, $location, $route, notifi, $confirm, webitel, TableSearch,
				$timeout) {

		var self = $scope;
	  	$scope.displayedCollection = [];
	  	$scope.remVar = [];
	  	$scope.isLoading = false;

		$scope.canDelete = webitel.connection.session.checkResource('domain', 'd');
		$scope.canUpdate = webitel.connection.session.checkResource('domain', 'u');
		$scope.canCreate = webitel.connection.session.checkResource('domain', 'c');

	    $scope.changePanel = function (panelStatistic) {
			$scope.panelStatistic = !!panelStatistic;
		};

	  	$scope.query = TableSearch.get('domains');

	  	$scope.$watch("query", function (newVal) {
		  TableSearch.set(newVal, 'domains')
	  	});

 		self.domain = {
 			"id": null,
 			"name": "",
 			"customer_id": "",
 			"default_language": "",
 			"variables": []
 		};

	    $scope.$watch('domain', function(newValue, oldValue) {
		  if ($scope.domain._new)
			  return $scope.isEdit = $scope.isNew = true;

		  return $scope.isEdit = !!oldValue.id;
	    }, true);

		  $scope.cancel = function () {
			  $scope.domain = angular.copy($scope.oldDomain);
			  disableEditMode();
		  };

		  function disableEditMode () {
			  $timeout(function () {
				  $scope.isEdit = false;
			  }, 0);
		  };

 		self.switchVar = utils.switchVar;

 		self.oldDomain = null;

		self.reloadData = reloadData;
		self.closePage = closePage;
		self.create = create;
		self.save = save;
		self.edit = edit;
		self.removeItem = removeItem;
		self.change = change;

		function updateOrInsertStorageConfig(storageConfig, storageType, storageNotAllowTypes, cb) {
			var modalInstance = $modal.open({
				animation: true,
				templateUrl: '/modules/domains/storagePage.html',
				controller: 'DomainStorageCtrl',
				resolve: {
					storageConfig: function () {
						return storageConfig;
					},
					storageType: function () {
						return storageType;
					},
					storageNotAllowTypes: function () {
						return storageNotAllowTypes;
					}
				}
			});

			modalInstance.result.then(cb);
		}


	    self.addStorage = function (domain) {
			updateOrInsertStorageConfig(null, null, Object.keys((domain.storage && domain.storage.providers) || {}), function (res) {
				var result = res.data,
					type = res.type;

				if (!domain.storage) {
					domain.storage = {
						defaultProvider: type,
						maskPath: "$DOMAIN/$Y/$M/$D/$H",
						providers: {}
					}
				}
				domain.storage.providers[type] = result;
			})
		};
		  
	    self.removeStorage = function (key) {
			if ($scope.domain && $scope.domain.storage) {
				delete $scope.domain.storage.providers[key];
				if ($scope.domain.storage.defaultProvider == key)
					$scope.domain.storage.defaultProvider = '';
			}
		};
		  
		self.updateStorage = function (key, params) {
			updateOrInsertStorageConfig(angular.copy(params), key, null, function (res) {
				var result = res.data,
					type = res.type;

				var domain = $scope.domain;
				if (!domain.storage) {
					domain.storage = {
						defaultProvider: type,
						maskPath: "$DOMAIN/$Y/$M/$D/$H",
						providers: {}
					}
				}
				domain.storage.providers[type] = result;
			})
		};

		var changedFiels = [];

		self.addVariable = function () {
			if (!self.selVarKey)
				return notifi.error(new Error('Name required.'), 2000);

			self.domain.variables.push({
				"key": self.selVarKey,
				"value": self.selVarVal || ""
			});
			self.selVarKey = self.selVarVal = "";
			change("variables")
		};

		function removeItem(domain) {
			$confirm({text: 'Are you sure you want to delete ' + domain.name + ' ?'},  { templateUrl: 'views/confirm.html' })
	        .then(function() {
	          DomainModel.remove(domain.name, function(err, res) {
	      
				if (err)
					return notifi.error(err, 5000);
				return reloadData();
	          })
	        });
		};

		function change(field) {
			if (!~changedFiels.indexOf(field))
				changedFiels.push(field);
		};

		function create() {
			self.domain = DomainModel.create();
			self.domain._new = true;
		};

		function save() {
			function cb(err, res) {
				if (err)
					return notifi.error(err, 5000);

				if ($scope.domain._new) {
					return $location.path('/domains/' + $scope.domain.name + '/edit');
				} else {
					$scope.domain.__time = Date.now();
					return edit();
				};
			};

			if (self.domain.id) {
				var updateValues = utils.diff(self.domain,  self.oldDomain);

				if (Object.keys(updateValues).length < 1 && self.remVar.length < 1) {
					// TODO
					updateValues.storage = {};
				}
				DomainModel.update(self.domain, updateValues, self.remVar, cb);
			} else {
				DomainModel.add(self.domain, cb)
			}
		}

		$scope.domainUsedStorage = null;
		function edit() {
			var id = $routeParams.id;
			DomainModel.item(id, function(err, item) {
				if (err) {
					return notifi.error(err);
				};
				self.oldDomain = angular.copy(item);
				self.domain = item;
				disableEditMode();
				DomainModel.usedFileStorage(id, function (err, res) {
					if (err || (res && res.size == 0))
						return;
					$scope.domainUsedStorage = utils.prettysize(res.size);
				})
			});
		};

		function closePage() {
	 		$location.path('/domains');
	 	};


		function reloadData (hardReset) {
			$scope.isLoading = true;
			DomainModel.list(function(err, dataNew) {
				$scope.isLoading = false;
				if (err) {
					return notifi.error(err);
				};

				$scope.rowCollection = dataNew;
	 		}, hardReset);
		};


	 	$scope.init = function init () {
	 		if (!!$route.current.method) {
	 			return $scope[$route.current.method]();
	 		}

			if (webitel.connection.session.domain)
				return $location.path('/domains/' + webitel.connection.session.domain + '/edit');
	 		reloadData();
	 	}();

	 }]);

	app.controller("DomainStatisticCtrl", ["$scope", '$timeout', '$filter', function ($scope, $timeout, $filter) {
		var timerId = null;
		$scope.$watch('$parent.displayedCollection', function (val) {
			$timeout.cancel(timerId);
			timerId = $timeout(function () {
				setDomainUsersCount(val);
				setDomainCustomer(val);
			}, 500);
		});
		$scope.rc = {};
		$scope.$watch('$parent.panelStatistic', function(val){
			if (val)
				$timeout(function(){
					window.dispatchEvent(new Event('resize'));
				}, 0);
		});

		var domainCustomerChart = $scope.domainCustomerChart = {
			options: {
				"chart": {
					"type": "multiBarChart",
					"height": 600,
					"margin": {
						"top": 20,
						"right": 20,
						"bottom": 45,
						"left": 45
					},
					"clipEdge": true,
					"duration": 500,
					"stacked": true,
					"xAxis": {
						"axisLabel": "Customer",
						"showMaxMin": false
					},
					"yAxis": {
						"tickFormat": function (d) {
							return d3.format(',f')(d)
						},
						"axisLabel": "Count"
					}
				},
				"data": []
			}
		};

		var domainUsersCount = $scope.domainUsersCount = {
			render: false,
			collection: null,
			setData: setDomainUsersCount,
			options: {
				chart: {
					dispatch: {
						renderEnd: function(e){
							domainUsersCount.render = false;
						}
					},
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
					height: 600,
					x: function(d){
						return d.key;
					},
					y: function(d){
						return d.y;
					},
					showLabels: false,
					donutRatio: 0.3,
					donut: true,
					transitionDuration: 500,
					labelThreshold: 0.02,
					// "margin": {
					// 	"top": 0,
					// 	"right": 0,
					// 	"bottom": 0,
					// 	"left": 0
					// },
					legendPosition: "right",
					legend: {
						vers: 'furious'
					},
				},
				data: [] // {key, y}
			}
		};
		
		
		function setDomainUsersCount(collection) {

			var aggregate = function (data) {
				var tmp = {};
				var result = [
					{
						key: "Users",
						values: []
					},
					{
						key: "Domains",
						values: []
					}
				];
				for (var i = 0; i < data.length; i++) {
					if (tmp.hasOwnProperty(data[i].customer)) {
						tmp[data[i].customer].domains++;
						tmp[data[i].customer].users += data[i].user;
					} else {
						tmp[data[i].customer] = {
							domains: 1,
							users: data[i].user
						}
					}
				}

				angular.forEach(tmp, function (val, key) {
					result[0].values.push({
						x: key,
						y: val.users
					});
					result[1].values.push({
						x: key,
						y: val.domains
					})
				});
				return result;
			};

			domainCustomerChart.data = aggregate(collection);

			$timeout(function () {
				$scope.$apply();
			});
		}
		function setDomainCustomer(collection) {
			domainUsersCount.render = true;
			var _c = collection || domainUsersCount.collection;
			var data = domainUsersCount.data = [];
			_c = $filter('orderBy')(_c, '-user').slice(0, 15);

			angular.forEach(_c, function (item) {
				data.push({
					key: item.name,
					y: item.user || 0
				})
			});
			domainUsersCount.data = data;
			$timeout(function () {
				$scope.$apply();
			});
		}
	}]);
	
	app.controller("DomainStorageCtrl", ["$scope", "$modalInstance", "storageConfig", "storageType", "storageNotAllowTypes",
		"notifi", "FileUploader",
		function ($scope, $modalInstance, storageConfig, storageType, storageNotAllowTypes, notifi, FileUploader) {
		$scope.storage = storageConfig || {};
		$scope.option = {
			type: storageType || ''
		};

		$scope.storageNotAllowTypes = storageNotAllowTypes || [];

		$scope.isNew = !storageConfig;
		
		if ($scope.isNew) {
			$scope.$watch('option.type', function (newV, oldV) {
				if (newV ) {
					for (var key in $scope.storage) {
						if (key == 'type')
							continue;
						delete $scope.storage[key];
					}
				}
			});
		}

		var TYPES = [
			{
				value: 's3',
				name: 'S3 (Amazon Simple Storage Service)'
			},
			{
				value: 'b2',
				name: 'Backblaze B2 Cloud Storage'
			},
			{
				value: 'gDrive',
				name: 'Google Drive'
			},
			{
				value: 'dropBox',
				name: 'Drop Box'
			}
		];

		$scope.types = [];
		angular.forEach(TYPES, function (v) {
			if (storageNotAllowTypes && ~storageNotAllowTypes.indexOf(v.value))
				return;
			$scope.types.push(v);
		});
			
		$scope.ok = function () {
			$modalInstance.close({
				data: $scope.storage,
				type: $scope.option.type
			});
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
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
					$scope.storage.private_key = data.private_key;
					$scope.storage.client_email = data.client_email;
					$scope.$apply();
				}).fail(function (res, e, err) {
					notifi.error(err);
				});

			};
			reader.readAsDataURL(item._file);
		};

		$scope.s3Regions = [
			{name: "US East (N. Virginia)", value: "us-east-1"},
			{name: "US West (N. California)", value: "us-west-1"},
			{name: "US West (Oregon)", value: "us-west-2"},
			{name: "Asia Pacific (Mumbai)", value: "ap-south-1"},
			{name: "Asia Pacific (Seoul)", value: "ap-northeast-2"},
			{name: "Asia Pacific (Singapore)", value: "ap-southeast-1"},
			{name: "Asia Pacific (Sydney)", value: "ap-southeast-2"},
			{name: "Asia Pacific (Tokyo)", value: "ap-northeast-1"},
			{name: "EU (Frankfurt)", value: "eu-central-1"},
			{name: "EU (Ireland)", value: "eu-west-1"},
			{name: "South America (São Paulo)", value: "sa-east-1"}
		]
	}]);

});