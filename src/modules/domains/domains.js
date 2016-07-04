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
					return notifi.warn('No changes.', 5000)
				}
				DomainModel.update(self.domain, updateValues, self.remVar, cb);
			} else {
				DomainModel.add(self.domain, cb)
			}
		};

		function edit() {
			var id = $routeParams.id;
			DomainModel.item(id, function(err, item) {
				if (err) {
					return notifi.error(err);
				};
				self.oldDomain = angular.copy(item);
				self.domain = item;
				disableEditMode();
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

});