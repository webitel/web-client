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

            $scope.canDelete = webitel.connection.session.checkResource('book', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('book', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('book', 'c');

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            $scope.reloadData = function () {
                ContactModel.propertyList($scope.domain, function (err, res) {
                    if(err){
                        if(err.statusCode === 404 && err.message === 'Not found contacts'){
                            ContactModel.updateProperty([], $scope.domain, function (err_create, res_create) {
                                if(err_create)
                                    return notifi.error(err_create, 5000);
                            });
                        }
                        else{
                            return notifi.error(err, 5000);
                        }
                    }
                    $scope.properties = res && res.data && Array.isArray(res.data.data) ? res.data.data : [];
                });
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
                        ContactModel.updateProperty($scope.properties, $scope.domain, function (err, res) {
                            if(err)
                                return notifi.error(err, 5000);
                        });
                    });
            };

            $scope.openModal = function(prop) {
                var modalInstance = $modal.open({
                    animation: true,
                    backdrop: false,
                    templateUrl: '/modules/contacts/contactPropModal.html',
                    // resolve: {},
                    controller: ['$modalInstance', '$scope', function ($modalInstance, $scope) {
                        var self = $scope;
                        self.property = prop || {type: 'text', width: 12, index: 0};
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
                    if(!prop)
                        $scope.properties.push(option.property);
                    // PUT
                    ContactModel.updateProperty($scope.properties, $scope.domain, function (err, res) {
                        if(err)
                            return notifi.error(err, 5000);
                    });
                });
            }

            $scope.openCommunicationModal = function() {
                var modalInstance = $modal.open({
                    animation: true,
                    backdrop: false,
                    templateUrl: '/modules/contacts/contactCommModal.html',
                    resolve: {
                        domainName: function(){
                            return $scope.domain
                        }
                    },
                    controller: ['$modalInstance', '$scope', 'domainName', function ($modalInstance, $scope, domainName) {
                        var self = $scope;
                        self.comm_name = {value: ''};
                        self.communication_types = [];

                        self.ok = function () {
                            $modalInstance.close({});
                        };

                        self.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        self.edit = function(row){
                            if(self.oldValue){
                                var oldElem = self.communication_types.filter(function(item){
                                    return item.id === self.editableElement;
                                })[0];
                                if(oldElem) oldElem.name = self.oldValue;
                            }
                            self.editableElement = row.id;
                            self.oldValue = row.name;
                        };


                        self.addCommunication = function () {
                            if ($scope.comm_name && $scope.comm_name.value !== '' && $scope.comm_name.value.toLowerCase() !== 'phone' && $scope.comm_name.value.toLowerCase() !== 'email') {
                                ContactModel.addCommunicaiton({name:$scope.comm_name.value}, domainName, function (err, res) {
                                    if(err)
                                       return notifi.error(err, 5000);
                                    $scope.comm_name.value = '';
                                    self.getList();
                                })
                            }
                        };

                        self.updateCommunication = function(row) {
                            if (row && row.name !=='' && row.name.toLowerCase() !== 'phone' && row.name.toLowerCase() !== 'email') {
                                ContactModel.updateCommunicaiton(row.id, row, domainName, function (err, res) {
                                    if(err)
                                        return notifi.error(err, 5000);
                                    self.editableElement = -1;
                                    self.oldValue = null;
                                });
                            }
                        }

                        self.removeCommunication = function (row) {
                            ContactModel.removeCommunicaiton(row.id, domainName, function (err, res) {
                                if(err)
                                    return notifi.error(err, 5000);
                                self.getList();
                            })
                        };

                        self.getList = function(){
                            ContactModel.communicationList(domainName, function (err, res) {
                                if(err)
                                    return notifi.error(err, 5000);
                                $scope.communication_types = res && res.data;
                            })
                        }

                    }]
                });
                modalInstance.result.then(function (option) { });
            }

        }]);
});
