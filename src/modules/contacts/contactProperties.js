/**
 * Created by matvij on 17.10.17.
 */
define(['app', 'scripts/webitel/utils', 'modules/contacts/contactModel'], function (app, utils) {

    app.controller('ContactsCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$route', '$location', 'ContactModel', '$routeParams',
        '$timeout', '$confirm', 'TableSearch', 'cfpLoadingBar',
        function ($scope, $modal, webitel, $rootScope, notifi, $route, $location, ContactModel, $routeParams, $timeout, $confirm,
                  TableSearch, cfpLoadingBar) {
            $scope.domain = webitel.domain();
            $scope.property = {};
            $scope.properties = {};

            $scope.isRoot = !webitel.connection.session.domain;

            $scope.canDelete = webitel.connection.session.checkResource('gateway', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('gateway', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('gateway', 'c');

            $scope.viewMode = !$scope.canDelete;
            $scope.types = [
                'text',
                'number',
                'select'
            ];

            $scope.view = function () {
                var id = $routeParams.id;
                // GatewayModel.item(id, $scope.domain, function (err, gw) {
                //     if (err)
                //         return notifi.error(err, 5000);
                //     $scope.contact = gw;
                //     disableEditMode();
                // })
            };

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });



            $scope.$watch('properties', function(newValue, oldValue) {
                if ($scope.properties._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue.id;
            }, true);

            $scope.cancel = function () {
                $scope.contact = angular.copy($scope.oldContact);
                disableEditMode();
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                $scope.reloadData();
            });
            $scope.edit = edit;
            $scope.closePage = closePage;
            $scope.save = save;

            function closePage() {
                $location.path('/contacts');
            };

            $scope.delete = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        ContactModel.remove(row.id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            $scope.reloadData();
                        });
                    });
            };

            function save() {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.contact._new) {

                    } else {
                        $scope.contact.__time = Date.now();
                        return edit();
                    };
                };
                if (!$scope.contact.id) {

                } else {

                };
            };

            function edit () {
                var id = $routeParams.id;
                var domain = $routeParams.domain;

                ContactModel.item(id, domain, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    }
                    $scope.oldContact = angular.copy(item.data);
                    $scope.contact = item.data;
                });
            }

            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();

        }]);
});
