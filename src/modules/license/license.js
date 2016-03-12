define(['app', 'modules/license/licenseModel'], function (app) {

    app.controller('LicenseCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'LicensesModel', '$confirm',
        function ($scope, webitel, $rootScope, notifi, LicensesModel, $confirm) {
        	$scope.output;
            $scope.canDelete = webitel.connection.session.checkResource('license', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('license', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('license', 'c');
            $scope.sid = '';

            $scope.displayedCollection = [];

            $scope.add = function add() {
                $confirm({name: 'Token'},  { templateUrl: 'views/dialogs/input.html' })
                .then(function(result) {
                    LicensesModel.add(result.value, function (err, res) {
                        if (err)
                            return notifi.error(err);

                        notifi.success(res.info);
                        reloadData()
                    });
                });
            }
            
            $scope.reloadData = reloadData;

            $scope.removeItem = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.customer + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        LicensesModel.remove(row.customer, function (err, res) {
                            if (err)
                                return notifi.error(err, 5000);

                            return reloadData()
                        })
                    });
            };

            function reloadData () {
                LicensesModel.list(function (err, collection, sid) {
                    if (err)
                        return notifi.error(err, 5000);
                    $scope.sid = (sid || "").trim();
                    $scope.rowCollection = collection;
                })
            };

            var init = function () {
                reloadData();
            }();
        	
    }]);
});