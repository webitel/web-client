define(['app', 'scripts/webitel/utils', 'modules/callflows/editor', 'modules/hooks/hookModel', 'ui-ace'],
    function (app, utils, aceEditor) {

    app.directive( 'wDictionary', function() {
        return {
            restrict: 'AE',
            scope: {
                "data": "=",
                "fields": "=",
                "select": "="
            },
            templateUrl: 'modules/hooks/arrayData.html',
            controller: function ( $scope ) {
                if (!$scope.data)
                    $scope.data = [];

                $scope.addData = function() {
                    $scope.inserted = {};
                    $scope.data.push($scope.inserted);
                };
                
                $scope.removeData = function (index) {
                    $scope.data.splice(index, 1);
                }
            }
        };
    });

    app.controller('HookCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'HookModel', '$route', '$location', '$routeParams',
        '$confirm', '$timeout', 'TableSearch', 'cfpLoadingBar', 'FileUploader',
        function ($scope, webitel, $rootScope, notifi, HookModel, $route, $location, $routeParams, $confirm, $timeout,
                  TableSearch, cfpLoadingBar, FileUploader) {

        $scope.json = {body : aceEditor.getStrFromJson({})};

        $scope.aceLoaded = function(_editor) {
            // Options
            aceEditor.init(_editor, false);
        };

        // $scope.aceChanged = function (v) {
        //     debugger;
        // };

        $scope.domain = webitel.domain();
        $scope.hook = {};
        $scope.userVariables = utils.switchVar;
        $scope.canDelete = webitel.connection.session.checkResource('hook', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('hook', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('hook', 'c');
        $scope.EVENTS = utils.events;

        $scope.viewMode = !$scope.canUpdate;
        $scope.view = function () {
            $scope.viewMode = true;
            edit();
        };

        $scope.remVar = [];
        $scope.roles = [];
        $scope.queues = {};
        $scope.isLoading = false;
        $scope.$watch('isLoading', function (val) {
            if (val) {
                cfpLoadingBar.start()
            } else {
                cfpLoadingBar.complete()
            }
        });

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

        $scope.$watch('[hook,json]', function(newValue, oldValue) {
            if ($scope.hook._new)
                return $scope.isEdit = $scope.isNew = true;

            return $scope.isEdit = !!oldValue[0]._id;
        }, true);

        $scope.downloadScheme = function (row) {
            HookModel.item(row._id, $scope.domain, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                }
                utils.saveJsonToPc(item, item._id + '.json');
            });

        };

        function uploadJson (data, update) {
            function cb(err, res) {
                if (err)
                    return notifi.error(err, 5000);

                reloadData();
                var str;
                if (update) {
                    str = "Updated";
                } else {
                    str = "Created";
                }
                return notifi.success(str, 2000);
            };

            if (update) {
                HookModel.update(data, cb)
            } else {
                HookModel.add(data, cb);
            }
        };

        var uploader = $scope.uploader = new FileUploader();
        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(item) {
            console.info('onAfterAddingFile', item);

            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var data = JSON.parse(event.target.result);

                    HookModel.item(data._id, $scope.domain, function (err, item) {
                        if (err && err.statusCode !== 404)
                            return notifi.error(err, 3000);

                        uploadJson(data, !!item);
                    });
                } catch (e) {
                    notifi.error(e, 10000);
                }
            };
            reader.readAsText(item._file);
        };

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

            if ($scope.hook.customBody) {
                try {
                    JSON.parse($scope.json.body);
                    $scope.hook.rawBody = $scope.json.body;
                } catch (e) {
                    return notifi.error(e, 5000);
                }
            }

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

                $scope.oldJsonBody = angular.copy(item.rawBody);
                $scope.json.body = $scope.oldJsonBody;

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

        $scope.addHead = function () {
            if (!$scope.hook.headers) {
                $scope.hook.headers = [];
            }
            $scope.headInserted = {name: '', value: ''};
            $scope.hook.headers.push($scope.headInserted);
        };

        $scope.init = function init () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            };
        }();




    }]);
});