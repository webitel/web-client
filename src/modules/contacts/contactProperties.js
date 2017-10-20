/**
 * Created by matvij on 17.10.17.
 */
define(['app', 'scripts/webitel/utils', 'modules/contacts/contactModel'], function (app, utils) {

    app.controller('ContactPropsCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$route', '$location', 'ContactModel', '$routeParams',
        '$timeout', '$confirm', 'TableSearch', 'cfpLoadingBar',
        function ($scope, $modal, webitel, $rootScope, notifi, $route, $location, ContactModel, $routeParams, $timeout, $confirm,
                  TableSearch, cfpLoadingBar) {
            $scope.domain = webitel.domain();
            $scope.property = {};
            $scope.properties = {};
            $scope.choices = [];
            $scope.choice = {value:''};

            $scope.isRoot = !webitel.connection.session.domain;

            $scope.canDelete = webitel.connection.session.checkResource('gateway', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('gateway', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('gateway', 'c');

            $scope.viewMode = !$scope.canDelete;
            $scope.types = [
                'text',
                'number',
                'select',
                'check'
            ];

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });



            $scope.$watch('property', function(newValue, oldValue) {
                if ($scope.property._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue.id;
            }, true);

            function reloadData () {
                if ($location.$$path != '/widget')
                    return 0;

                if (!$scope.domain)
                    return $scope.rowCollection = [];

                $scope.isLoading = true;
                var col = encodeURIComponent(JSON.stringify({
                    name: 1,
                    type: 1,
                    id: 1
                }));

                ContactModel.propertyList({
                    columns: col,
                    limit: 5000,
                    page: 1,
                    domain: $scope.domain
                }, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);
                    var arr = [];
                    angular.forEach(res.data, function(item) {
                        arr.push(item);
                    });
                    $scope.rowCollection = arr;
                });
            }

            $scope.cancel = function () {
                $scope.property = angular.copy($scope.oldProperty);
                disableEditMode();
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
            });
            $scope.edit = edit;
            $scope.closePage = closePage;
            $scope.save = save;
            $scope.create = create;
            $scope.addChoice = addChoice;
            $scope.removeChoice = removeChoice;

            function addChoice() {
                if($scope.choice && $scope.choice.value !== '') {
                    $scope.choices.push($scope.choice.value);
                    $scope.choice.value = '';
                }
            };

            function removeChoice(row) {
                var index = $scope.choices.indexOf(row);
                $scope.choices.splice(index, 1);
            };

            function closePage() {
                $location.path('/contactEditor');
            };

            $scope.delete = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        ContactModel.removeProperty(row.id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                        });
                    });
            };

            function save() {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.property._new) {
                        return $location.path('/contactEditor/' + res.data[0] + '/edit');
                    } else {
                        $scope.property.__time = Date.now();
                        return edit();
                    };
                };
                if (!$scope.property.id) {
                    ContactModel.addProperty(angular.copy($scope.property), $scope.domain, cb);
                } else {
                    ContactModel.updateProperty($scope.property.id, $scope.property, $scope.domain, cb);
                };
            };

            function create() {
                $scope.property._new = true;
            };

            function edit () {
                var id = $routeParams.id;
                var domain = $routeParams.domain;

                ContactModel.propertyItem(domain, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    }
                    $scope.oldProperty = angular.copy(item.data);
                    $scope.property = item.data;
                });
            }

            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();

        }]);
});
