define(['app', 'scripts/webitel/utils', 'modules/contacts/contactModel'], function (app, utils) {

    app.controller('ContactsCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$route', '$location', 'ContactModel', '$routeParams',
            '$timeout', '$confirm', 'TableSearch', 'cfpLoadingBar',
        function ($scope, $modal, webitel, $rootScope, notifi, $route, $location, ContactModel, $routeParams, $timeout, $confirm,
                  TableSearch, cfpLoadingBar) {
   		$scope.domain = webitel.domain();
        $scope.contact = {};

        $scope.isRoot = !webitel.connection.session.domain;

        $scope.canDelete = webitel.connection.session.checkResource('gateway', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('gateway', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('gateway', 'c');

        $scope.isLoading = false;
        $scope.$watch('isLoading', function (val) {
            if (val) {
                cfpLoadingBar.start()
            } else {
                cfpLoadingBar.complete()
            }
        });

        $scope.viewMode = !$scope.canDelete;

        $scope.view = function () {
            var id = $routeParams.id;

            ContactModel.item(id, $scope.domain, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                }
                $scope.contact = item.data;
                disableEditMode();
            });
        };


        $scope.rowCollection = [];


        $scope.query = TableSearch.get('contacts');

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'contacts')
        });

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        $scope.$on('$destroy', function () {
            changeDomainEvent();
        });

        $scope.$watch('contact', function(newValue, oldValue) {
            if ($scope.contact._new)
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

        var _page = 1;
        var nexData = true;
        var col = encodeURIComponent(JSON.stringify({
            name: 1,
            company_name: 1,
            job_name: 1,
            description: 1,
            id: 1
        }));
        var maxNodes = 40;

        $scope.callServer = getData;

        function getData(tableState) {
            if ($scope.isLoading) return void 0;

            if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                _page = 1;
                nexData = true;
                $scope.rowCollection = [];
                $scope.count = 0;
            }
            console.debug("Page:", _page);

            $scope.tableState = tableState;

            $scope.isLoading = true;
            var sort ={};

            if (tableState.sort.predicate)
                sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

            $scope.isLoading = true;
            sort = encodeURIComponent(JSON.stringify(sort));

            ContactModel.list({
                columns: col,
                sort: sort,
                limit: maxNodes,
                page: _page,
                domain: $scope.domain
            }, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err, 5000);

                _page++;
                nexData = res.data.length === maxNodes;
                $scope.rowCollection = $scope.rowCollection.concat(res.data);
            });

        }

        $scope.reloadData  = function() {
            if($scope.tableState){
                $scope.tableState.pagination.start = 0;
                getData($scope.tableState);
            }
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

        $scope.create = function(){
            var modalInstance = $modal.open({
                animation: true,
                backdrop: false,
                templateUrl: '/modules/contacts/contactModal.html',
                resolve: {
                    domainName: function () {
                        return $scope.domain;
                    }
                },
                controller: ['$modalInstance', '$scope', 'domainName', function ($modalInstance, $scope, domainName) {
                    var self = $scope;

                    self.contact = {};
                    self.communication_type = {};
                    self.communications = [];

                    self.ok = function () {
                        self.contact.communications = self.communications;
                        $modalInstance.close({
                            contact: self.contact
                        });
                    };

                    self.getCommunications = function(){
                        ContactModel.communicationList(domainName, function (err, res) {
                            if(err)
                                return notifi.error(err, 5000);
                            $scope.communication_types = res && res.data;
                        })
                    }

                    self.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                    self.addCommunication = function(){
                        if(self.communication_type && self.number){
                            self.communications.push({
                                number: self.number,
                                type_id: self.communication_type.value.id,
                                type_display: self.communication_type.value.name
                            });
                            self.number = '';
                            self.communication_type.value = null;
                        }
                    };
                    self.removeComm = function(row){
                       var index = self.communications.indexOf(row);
                       self.communications.splice(index, 1);
                    };
                }]
            });

            modalInstance.result.then(function (option) {
                ContactModel.add(option.contact, $scope.domain, function (err, res) {
                    if(err)
                        return notifi.error(err);
                    $scope.reloadData();
                });
            });
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
                $scope.contact.__time = Date.now();
                return edit();
            };
            ContactModel.update($scope.contact.id, angular.copy($scope.contact), $scope.domain, cb);
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
