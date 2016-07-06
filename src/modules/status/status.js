define(['app'], function (app) {

    app.controller('StatusCtrl', ['$scope', 'webitel', '$rootScope', 'notifi',
        function ($scope, webitel, $rootScope, notifi) {
        	$scope.output;
			webitel.checkLicenseStatus();
        	webitel.api("GET", "/api/v2/status", function (err, res) {
        		if (err)
    				return notifi.error(err, 5000);
    			var v = res.Version.split(/#|:/g);
    			$scope.output = res;
    			$scope.output.ver = v[0];
    			$scope.output.build = v[1];
    			$scope.output.commit = v[2];
        	})
    }]);
});