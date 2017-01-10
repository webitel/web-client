define(['app', 'moment', 'modules/license/licenseModel'], function (app, moment) {

    app.controller('LicenseCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'LicensesModel', '$confirm', '$modal',
        '$route', '$routeParams', '$location',
        function ($scope, webitel, $rootScope, notifi, LicensesModel, $confirm, $modal, $route, $routeParams, $location) {
        	$scope.output;
            $scope.canDelete = webitel.connection.session.checkResource('license', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('license', 'u') || webitel.connection.session.checkResource('license', 'uo');
            $scope.canCreate = webitel.connection.session.checkResource('license', 'c');
            $scope.sid = '';

            $scope.displayedCollection = [];

            $scope.getClass = function (row) {
                try {
                    var expireTime = moment(row.expire, "DD-MM-YYYY").valueOf(),
                        currentTime = moment().valueOf();
                    if (expireTime <= currentTime) {
                        return 'bg-gray'
                    } else if (( expireTime - currentTime - 2592000000) <= 0) {
                        return 'bg-danger'
                    } else if (( expireTime - currentTime - 5184000000) <= 0) {
                        return 'bg-warning'
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            $scope.add = function add() {
                $confirm({name: 'Token'},  { templateUrl: 'views/dialogs/input.html' })
                .then(function(result) {
                    _addLicense(result.value);
                });
            };
            
            function _addLicense(token) {
                LicensesModel.add(token, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    notifi.success(res.info);
                    reloadData()
                });
            }
            
            function genLicense(cid, sid) {
                LicensesModel.genLicense(cid, sid, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if (!res.token)
                        return notifi.error(new Error('Bad response: no token'));


                    _addLicense(res.token)
                })
            }

            $scope._genLicense = genLicense;
            $scope.genLicense = function () {
                $modal.open({
                    templateUrl : 'modules/license/genLicenseDialog.html',
                    controller : function ($scope, $modalInstance) {
                        $scope.level = "PopupCtrl";
                        $scope.cid = "";
                        $scope.ok = function() {
                            $modalInstance.close({cid: $scope.cid});
                        };

                        $scope.cancel = function() {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve : {
                        name : function() {
                            return $scope.name;
                        }
                    }
                }).result.then(function(result) {
                    if (result.cid) {
                        genLicense(result.cid, $scope.sid);
                    } else {
                        return notifi.error(new Error('Bad customer id'), 5000);
                    }
                });
            };

            $scope.view = function () {
                var cid = $routeParams.cid;
                var sid = $routeParams.sid;
                LicensesModel.genLicense(cid, sid, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    $scope.license = res
                })
            };

            $scope.timeToDateString = function (time) {
                if (time)
                    return new Date(time * 1000).toLocaleDateString();
                return '-'
            };
            
            $scope.closePage = function () {
                $location.path('/license');
            };
            
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
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                } else {
                    reloadData();
                }
            }();
        	
    }]);
});