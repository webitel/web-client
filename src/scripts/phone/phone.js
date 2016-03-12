define([
	'angular',
	'scripts/webitel/webitel',
	'angular-animate',
	'angular-bootstrap',
	'css!styles/phone.css'
	], function (angular) {
	var phone = angular.module('app.phone', ['ngAnimate', 'ui.bootstrap', 'app.webitel']);
	phone.controller('PhoneCtrl', ['$scope', 'webitel', function ($scope, webitel) {
		$scope.activeTab = 'dialpad';
		// $scope.show = true;
		$scope.number = '';
		
		var web = webitel.connection.instance;

		var lines = {
			'line1': {
				"id": "a",
				"name": "1",
				"state": "",
				"number": ""
			},
			'line2': {
				"id": "b",
				"name": "2",
				"number": "097888888",
				"state": "active",
				"call": {
					"direction": "inbound",
					"time": "99:99:99",
					"name": "Navrotskyj igor"
				}
			},
			'line3': {
				"id": "c",
				"name": "3",
				"number": "380973080466",
				"state": "rinding",
				"call": {
					"direction": "inbound",
					"time": "99:99:99",
					"name": "Navrotskyj igor"
				}
			},
			'line4': {
				"id": "d",
				"name": "4",
				"number": "380973080466",
				"state": "hold",
				"call": {
					"direction": "inbound",
					"time": "99:99:99",
					"name": "Navrotskyj igor"
				}
			},
			'line5': {
				"name": "5",
				"number": ""
			},
		};

		function changeLine (key, line) {
			$scope.activeLine =  line;
		};
		$scope.changeLine = changeLine;
		$scope.lines = lines;
		$scope.activeLine = lines.line1;

		$scope.userStatus = [
			{id: 'ONHOOK', name: 'OnHook'},
			{id: 'DND', name: 'DND'},
			{id: 'BUSY', name: 'Busy'}
		];

		$scope.status = $scope.userStatus[0];

	
		$scope.call = call;
		function call () {
			web.call($scope.activeLine.number);
		}
	}]);
	phone.directive('webPhone', function ($document, $window) {
		return {
		  restrict: 'EA',
		  controller: 'PhoneCtrl',
		  scope: { 'show': '=showPhone' },
	      templateUrl: 'views/phone/index.html',
	      link: function (scope, element, attr) {
      	  
	      }
		}
	})
})