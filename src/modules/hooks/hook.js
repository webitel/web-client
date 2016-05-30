define(['app', 'scripts/webitel/utils',  'async', 'modules/hooks/hookModel'], function (app, utils, async) {

    app.controller('HookCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'HookModel', '$route', '$location', '$routeParams',
        '$confirm', '$timeout', 'TableSearch',
        function ($scope, webitel, $rootScope, notifi, HookModel, $route, $location, $routeParams, $confirm, $timeout, TableSearch) {
        $scope.domain = webitel.domain();
        $scope.hook = {};
        $scope.userVariables = utils.switchVar;
        $scope.canDelete = webitel.connection.session.checkResource('hook', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('hook', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('hook', 'c');
        $scope.EVENTS = utils.events;

        $scope.remVar = [];
        $scope.roles = [];
        $scope.queues = {};
        $scope.isLoading = false;

        $scope.query = TableSearch.get('hooks');

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'hooks')
        });

        $scope.displayedCollection = [];

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        $scope.$on('$destroy', function () {
            changeDomainEvent();
        });

        function reloadData () {
            if ($location.$$path != '/hooks')
                return 0;

            if (!$scope.domain)
                return $scope.rowCollection = [];
            $scope.isLoading = true;
            HookModel.list({
                domain: $scope.domain,
                page: 1,
                limit: 5000,
                columns: '_id,name,enable,event,action.type,description'
            }, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err, 5000);
                var arr = [];
                angular.forEach(res.data || res.info, function(item) {
                    arr.push(item);
                });
                $scope.rowCollection = arr;
            });
        };

        $scope.$watch('hook', function(newValue, oldValue) {
            if ($scope.hook._new)
                return $scope.isEdit = $scope.isNew = true;

            return $scope.isEdit = !!oldValue._id;
        }, true);

        $scope.cancel = function () {
            $scope.hook = angular.copy($scope.oldHook);
            disableEditMode();
        };

        function disableEditMode () {
            $timeout(function () {
                $scope.isEdit = false;
            }, 0);
        };

        $scope.$watch('domain', function(domainName) {
            $scope.domain = domainName;
            reloadData();
        });
        $scope.edit = edit;
        $scope.create = create;
        $scope.reloadData = reloadData;
        $scope.closePage = closePage;
        $scope.save = save;

        $scope.removeItem = function (row) {
            $confirm({text: 'Are you sure you want to delete ' + row._id+ ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    HookModel.remove(row._id, $scope.domain, function (err) {
                        if (err)
                            return notifi.error(err, 5000);
                        reloadData()
                    })
                });
        };
        
        function closePage() {
            $location.path('/hooks');
        };

        function save() {
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                if ($scope.hook._new) {
                    return $location.path('/hooks/' + res.data.insertedIds[0] + '/edit');
                } else {
                    $scope.hook.__time = Date.now();
                    return edit();
                };
            };
            if ($scope.hook._new) {
                HookModel.add($scope.hook, cb);
            } else {
                HookModel.update($scope.hook, cb);
            }
        };

        function edit () {
            var id = $routeParams.id;
            var domain = $routeParams.domain;


            HookModel.item(id, domain, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                };
                $scope.oldHook = angular.copy(item);
                $scope.hook = item;
                disableEditMode();
            });
        }
        function create() {
            $scope.hook = HookModel.create();
            var domain = $routeParams.domain;
            $scope.hook.domain = domain;
            $scope.hook._new = true;
        };

        $scope.init = function init () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            };
        }();
    }]);
});