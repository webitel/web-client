/**
 * Created by matvij on 17.10.17.
 */
define(['app', 'scripts/webitel/utils', 'modules/contacts/contactModel'], function (app, utils) {

    app.controller('ContactPropsCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$route', '$location', 'ContactModel', '$routeParams',
        '$timeout', '$confirm', 'TableSearch', 'cfpLoadingBar',
        function ($scope, $modal, webitel, $rootScope, notifi, $route, $location, ContactModel, $routeParams, $timeout, $confirm,
                  TableSearch, cfpLoadingBar) {
            $scope.domain = webitel.domain();
            $scope.properties = [];

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.reloadData = function () {
                $scope.properties = [
                    {
                        "name": "aaaaa",
                        "caption": "Aaa",
                        "required": true,
                        "index": 1,
                        "width": 6,
                        "type": "text",
                        "options": []
                    },
                    {
                        "name": "bbb",
                        "caption": "Bbbb",
                        "required": true,
                        "index": 2,
                        "width": 6,
                        "type": "number",
                        "options": []
                    },
                    {
                        "name": "rrrr",
                        "caption": "RRR",
                        "required": true,
                        "index": 2,
                        "width": 6,
                        "type": "select",
                        "options": ["lox", "pidr"]
                    }
                ]
            }


            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                $scope.reloadData();
            });

            $scope.delete = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        var index = $scope.properties.indexOf(row);
                        $scope.properties.splice(index, 1);
                        // PUT
                    });
            };

            $scope.openModal = function(prop) {
                var modalInstance = $modal.open({
                    animation: true,
                    backdrop: false,
                    templateUrl: '/modules/contacts/contactPropModal.html',
                    resolve: {
                        domainName: function () {
                            return $scope.domain;
                        },
                        properties: function () {
                            return $scope.properties;
                        },
                    },
                    controller: ['$modalInstance', '$scope', 'domainName', 'properties', function ($modalInstance, $scope, domainName, properties) {
                        var self = $scope;
                        self.property = prop || {};
                        self.choices = self.property.options || [];
                        self.choice = {value: ''};
                        self.types = [
                            'text',
                            'number',
                            'select',
                            'boolean'
                        ];

                        self.ok = function () {
                            if(self.choices.length>0)self.property.options = self.choices;
                            $modalInstance.close({
                                property: self.property
                            });
                        };

                        self.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        self.addChoice = function () {
                            if ($scope.choice && $scope.choice.value !== '') {
                                $scope.choices.push($scope.choice.value);
                                $scope.choice.value = '';
                            }
                        };

                        self.removeChoice = function (row) {
                            var index = $scope.choices.indexOf(row);
                            $scope.choices.splice(index, 1);
                        };

                    }]
                });
                modalInstance.result.then(function (option) {
                    debugger;
                    if(!prop)
                        $scope.properties.push(option.property);
                    // PUT
                });
            }

        }]);
});
