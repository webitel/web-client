define(['app', 'scripts/webitel/utils', 'modules/licenseManager/managerModel'], function (app, utils) {

    app.controller('LicenseManagerCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'LicenseManagerModel', '$confirm',
        '$route', '$timeout', '$location', '$routeParams',
        function ($scope, webitel, $rootScope, notifi, LicenseManagerModel, $confirm, $route, $timeout, $location, $routeParams) {

            $scope.sid = '';

            $scope.displayedCollection = [];
            
            $scope.license = {};
            $scope.reloadData = reloadData;
            $scope.create = create;
            $scope.save = save;
            $scope.edit = edit;
            $scope.closePage = closePage;

            $scope.$watch('license', function(newValue, oldValue) {
                if ($scope.license._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue.cid;
            }, true);

            $scope.cancel = function () {
                $scope.license = angular.copy($scope.oldLicense);
                disableEditMode();
            };

            function save() {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.license._new) {
                        return $location.path('/license/manager/' + $scope.license.cid + '/edit');
                    } else {
                        $scope.oldLicense = angular.copy(res);
                        $scope.license = res;
                        disableEditMode();
                    };
                };
                if ($scope.license._new) {
                    LicenseManagerModel.add($scope.license, cb);
                } else {
                    var updateValues = utils.diff($scope.license,  $scope.oldLicense);
                    if ($scope.oldLicense.exp.getTime() != $scope.license.exp.getTime())
                        updateValues['exp'] = $scope.license.exp;

                    LicenseManagerModel.update($scope.license, updateValues, cb)
                }
            };

            function closePage() {
                $location.path('/license/manager');
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };
            
            $scope.getSumUsr = function (collection) {
                var sum = 0;
                angular.forEach(collection, function (item) {
                    sum += item.usr
                });
                return sum;
            };

            $scope.removeItem = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.cid + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        LicenseManagerModel.remove(row.cid, function (err, res) {
                            if (err)
                                return notifi.error(err, 5000);

                            return reloadData()
                        })
                    });
            };

            function reloadData () {
                LicenseManagerModel.list(function (err, collection) {
                    if (err)
                        return notifi.error(err, 5000);
                    $scope.rowCollection = collection;
                })
            };
            
            $scope.convertTime = function (time) {
                return new Date(time * 1000).toLocaleDateString()
            };

            function create() {
                $scope.license = LicenseManagerModel.create();
                $scope.license._new = true;
            };

            function edit() {
                var id = $routeParams.id;

                LicenseManagerModel.item(id, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    };
                    $scope.oldLicense = angular.copy(item);
                    $scope.license = item;
                    disableEditMode();
                });
            };


            $scope.openDate = function($event) {
                return $event.preventDefault(),
                    $event.stopPropagation(),
                    $scope.openedDate = !0
            };

            $scope.onCopied = function () {
                return notifi.info('Copied', 1000)
            };

            $scope.onCopiedFail = function (err) {
                return notifi.error(err, 1000)
            };

            $scope.dateOptions = {
                "year-format": "'yy'",
                "starting-day": 1
            };

            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
                reloadData();
            }();


        	
    }]);
});