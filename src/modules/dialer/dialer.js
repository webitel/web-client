define(['app', 'async', 'scripts/webitel/utils', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'modules/gateways/gatewayModel',
    'modules/dialer/dialerModel', 'modules/calendar/calendarModel'], function (app, async, utils, aceEditor, callflowUtils) {


    function moveUp (arr, value, by) {
        if (!arr)
            arr = [];

        var index = arr.indexOf(value),
            newPos = index - (by || 1);

        if(index === -1)
            throw new Error("Element not found in array");

        if(newPos < 0)
            newPos = 0;

        arr.splice(index,1);
        arr.splice(newPos,0,value);
    }
    function moveDown(arr, value, by) {
        if (!arr)
            arr = [];
        var index = arr.indexOf(value),
            newPos = index + (by || 1);

        if(index === -1)
            throw new Error("Element not found in array");

        if(newPos >= arr.length)
            newPos = arr.length;

        arr.splice(index, 1);
        arr.splice(newPos,0, value);
    }

    app.controller('DialerCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DialerModel', '$location', '$route', '$routeParams',
        '$confirm', 'TableSearch', '$timeout', '$modal', 'CalendarModel',
        function ($scope, webitel, $rootScope, notifi, DialerModel, $location, $route, $routeParams, $confirm, TableSearch,
                  $timeout, $modal, CalendarModel) {

            $scope.canDelete = webitel.connection.session.checkResource('dialer', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('dialer', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('dialer', 'c');
            $scope.domain = webitel.domain();
            $scope.dialer = {};

            $scope.query = TableSearch.get('dialer');
           // $scope.cf = aceEditor.getStrFromJson([]);
            $scope.aceLoaded = aceEditor.init;

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'dialer')
            });

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });


            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            });

            $scope.$watch('[dialer,cf]', function(newValue, oldValue) {
                if ($scope.dialer._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue[0]._id;
            }, true);

            $scope.$watch('dialer.resources', function(newValue, oldValue) {
                if ($scope.dialer._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue;
            }, true);

            $scope.cancel = function () {
                $scope.dialer = angular.copy($scope.oldDialer);
                $scope.cf = angular.copy($scope.oldCf);

                if ($scope.dialer.resources)
                    $scope.activeResource = $scope.dialer.resources[0];
                disableEditMode();
            };

            $scope.reloadData = reloadData;
            $scope.removeItem = removeItem;
            $scope.create = create;
            $scope.save = save;
            $scope.closePage = closePage;
            $scope.edit = edit;

            $scope.rowCollection = [];
            $scope.activeResource = null;
            
            $scope.setActiveResource = function (resource) {
                $scope.activeResource = resource;
            };
            
            $scope.getDefaultResourceDestination = function () {
                return {
                    gwName: "",
                    dialString: "",
                    gwProto: "sip",
                    order: 0,
                    limit: 0,
                    enabled: true
                }
            };
            $scope.getDefaultResource = getDefaultResource;

            function getDefaultResource(dialString) {
                return {
                    dialedNumber: dialString || "",
                    destinations: []
                }
            };
            
            $scope.getCalendars = function () {
                CalendarModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.data;
                    angular.forEach(data, function (v) {
                        c.push({
                            "id": v._id,
                            "name": v.name
                        });
                    });
                    $scope.calendars = c;

                });
            };
            
            $scope.editResourceDialString = function (resource) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourceDialString.html',
                    controller: 'DialerResourceDialStringCtrl',
                    resolve: {
                        resource: function () {
                            return resource;
                        }
                    }
                });

                modalInstance.result.then(function (result) {

                    if (!$scope.dialer.resources)
                        $scope.dialer.resources = [];

                    if (!result.id) {
                        var resource = getDefaultResource(result.value);
                        $scope.activeResource = resource;
                        return $scope.dialer.resources.push(resource);
                    };

                    var resources = $scope.dialer.resources;
                    for (var i = 0; i < resources.length; i++) {
                        if (resources[i].$$hashKey == result.id) {
                            return resources[i].dialedNumber = result.value
                        }
                    }
                }, function () {

                });
            };

            $scope.editResourceDestination = function (resource) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourcePage.html',
                    controller: 'DialerResourceCtrl',
                    resolve: {
                        resource: function () {
                            return resource;
                        },
                        domain: function () {
                            return $scope.domain;
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    if (!$scope.activeResource.destinations)
                        $scope.activeResource.destinations = [];

                    var destinations = $scope.activeResource.destinations;
                    if (!result.id)
                        return $scope.activeResource.destinations.push(result.value);

                    for (var i = 0; i < destinations.length; i++) {
                        if (destinations[i].$$hashKey == result.id) {
                            return $scope.activeResource.destinations[i] = result.value
                        }
                    }
                }, function () {

                });
            };
            
            $scope.removeResource = function (key, resource) {
                var resources = $scope.dialer.resources;
                $confirm({text: 'Are you sure you want to delete resource ' + resource.dialedNumber + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        resources.splice(key, 1);
                    });
            };
            
            $scope.removeResourceDestination = function (key, resource) {
                var scope = this;
                $confirm({text: 'Are you sure you want to delete resource ' + resource.dialString + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        for (var i = 0, des = scope.activeResource.destinations, len = des.length; i < len; i++) {
                            if (des[i] == resource)
                                return scope.activeResource.destinations.splice(i, 1)
                        }

                    });

            };
            
            $scope.setDialStringPosition = function (resources, value, up) {
                up ? moveUp(resources, value) : moveDown(resources, value);
            };

            function save () {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.dialer._new) {
                        return $location.path('/dialer/' + res + '/edit');
                    } else {
                        $scope.dialer.__time = Date.now();
                        return edit();
                    };
                };
                $scope.dialer._cf = JSON.parse($scope.cf);
                if ($scope.dialer._new) {
                    DialerModel.add($scope.dialer, cb);
                } else {
                    var updateValues = utils.diff($scope.dialer,  $scope.oldDialer);
                    DialerModel.update($scope.dialer._id, $scope.dialer.domain, Object.keys(updateValues), $scope.dialer, cb);
                }
            }

            function create() {
                $scope.dialer = DialerModel.create();
                var domain = $routeParams.domain;
                $scope.dialer.domain = domain;
                $scope.dialer._new = true;
                var cf = [];
                $scope.cf = aceEditor.getStrFromJson(cf);
            };

            function closePage() {
                $location.path('/dialer');
            };

            function edit () {
                var id = $routeParams.id;
                var domain = $routeParams.domain;

                var index = $scope.dialer && $scope.dialer.resources && $scope.dialer.resources.indexOf($scope.activeResource);
                if (index < 0)
                    index = 0;

                DialerModel.item(id, domain, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    };
                    $scope.oldDialer = angular.copy(item);
                    $scope.dialer = item;
                    var cf = callflowUtils.replaceExpression(item._cf);
                    $scope.cf = aceEditor.getStrFromJson(cf);
                    $scope.oldCf = angular.copy($scope.cf);
                    $scope.activeResource = $scope.dialer.resources && $scope.dialer.resources[index];
                    disableEditMode();
                });
            }

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };

            function getData () {
                if ($scope.isLoading) return void 0;

                $scope.isLoading = true;
                DialerModel.list($scope.domain, 0, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.rowCollection = res;
                });
            };

            function removeItem(row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        DialerModel.remove(row._id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData()
                        })
                    });
            }

            function reloadData () {
                if ($location.$$path != '/dialer')
                    return 0;

                if (!$scope.domain)
                    return $scope.rowCollection = [];

                return getData();
            };


            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();


            $scope.diealerStates = [
                {
                    val: 0,
                    name: "Idle"
                },
                {
                    val: 1,
                    name: "Work"
                },
                {
                    val: 2,
                    name: "Process stop"
                },
                {
                    val: 3,
                    name: "End"
                }
            ];
            $scope.diealerTypes = ["progressive", "predictive", "auto dialer"];

    }]);
    
    app.controller('DialerResourceCtrl', ["$scope", '$modalInstance', 'resource', 'domain', 'GatewayModel', 'notifi',
        function ($scope, $modalInstance, resource, domain, GatewayModel, notifi) {
        $scope.resource = angular.copy(resource);
        var id = resource.$$hashKey;

        $scope.ok = function () {
            if (!$scope.resource.dialString || (!$scope.resource.gwName && $scope.resource.gwProto == 'sip')) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close({value: $scope.resource, id: id}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.Types = ["sip", "sipUri"];

        $scope.gateways = [];

        GatewayModel.list(domain, function (err, res) {
            if (err)
                return notifi.error(err);
            $scope.gateways = [];
            angular.forEach(res, function (v) {
                $scope.gateways.push(v.id)
            });
        });
    }]);

    app.controller('MembersDialerCtrl', ['$scope', 'DialerModel', '$modal', '$confirm', 'notifi', 'FileUploader', function ($scope, DialerModel, $modal, $confirm, notifi, FileUploader) {
        var _tableState = {};
        $scope.reloadData = function () {
            $scope.callServer(_tableState)
        };

        var nexData = true;
        $scope.isLoading = false;
        var _page = 1;
        $scope.CountItemsByPage = 40;
        $scope.membersRowCollection = [];

        $scope.callServer = function (tableState) {
            if ($scope.isLoading) return void 0;
            _tableState = tableState;

            $scope.isLoading = true;

            var option = {
                sort: {},
                filter: tableState.search.predicateObject || {},
                page: _page,
                limit: $scope.CountItemsByPage,
                columns: ["name", "priority", "timezone", "communications", "_endCause"]
            };

            if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                _page = 1;
                nexData = true;
                $scope.membersRowCollection = [];
                $scope.count = '';
                DialerModel.members.count($scope.domain, $scope.dialer._id, option, function (err, res) {
                    if (err)
                        return ;
                    $scope.count = res;
                })
            };

            console.debug("Page:", _page);
            option.page = _page;


            if (tableState.sort.predicate)
                option.sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

            DialerModel.members.list($scope.domain, $scope.dialer._id, option, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err);

                _page++;

                $scope.membersRowCollection =  $scope.membersRowCollection.concat(res);

            });
        };
        
        $scope.removeMember = function (row, index) {
            $confirm({text: 'Are you sure you want to delete resource ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    DialerModel.members.remove($scope.domain, $scope.dialer._id, row._id, function (err) {
                        if (err)
                            return notifi.error(err, 5000);

                        $scope.membersRowCollection.splice(index, 1);
                    })
                });
        };
        
        $scope.addMember = function () {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/memberPage.html',
                controller: 'MemberDialerPageCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                            member: null,
                            dialerId: $scope.dialer._id,
                            domain: $scope.domain
                        };
                    }
                }
            });

            modalInstance.result.then(function (result) {
                var member = {};
                angular.forEach(result.value, function (v, k) {
                    member[k] = v;
                });
                $scope.membersRowCollection = [].concat(member, $scope.membersRowCollection);
            }, function () {

            });
        };
        
        $scope.editMember = function (member, index) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/memberPage.html',
                controller: 'MemberDialerPageCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                            member: member,
                            dialerId: $scope.dialer._id,
                            domain: $scope.domain
                        };
                    }
                }
            });

            modalInstance.result.then(function (result) {
                var member = result.value;
                angular.forEach(member, function (v, k) {
                    $scope.membersRowCollection[index][k] = v;
                });
            }, function () {

            });
        };

        $scope.TimeZones = utils.timeZones;
        $scope.CommunicationStatuses = [
            {
                name: "Null",
                val: 0
            },
            {
                name: "One",
                val: 1
            }
        ];
        $scope.CommunicationStates = [
            {
                name: "Null",
                val: 0
            },
            {
                name: "One",
                val: 1
            },
            {
                name: "Two",
                val: 2
            }
        ];

        function getMemberFromTemplate (row, template) {
            var m = {
                name: row[template.name],
                communications: []
            };

            angular.forEach(template.communications, function (v) {
                m.communications.push({
                    number: row[v.number],
                    priority: +row[v.priority] || 0,
                    status : 0,
                    state : 0

                })
            });

            return m;

        }
        $scope.progress = 0;
        $scope.progressCount = 0;
        $scope.processImport = false;

        $scope.showExportPage = function () {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/exportCsv.html',
                controller: 'MemberDialerExportCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                        };
                    }
                }
            });

            modalInstance.result.then(function (result) {

                if (result.headers)
                    result.data.shift();

                var allCount = result.data.length;
                $scope.progressCount = 0;

                $scope.maxProgress = allCount;
                $scope.processImport = true;
                async.eachSeries(result.data,
                    function (item, cb) {
                        $scope.progress =  Math.round(100 * $scope.progressCount++ / allCount);

                        DialerModel.members.add('10.10.10.144', '572a170e576151df0d6b164a', getMemberFromTemplate(item, result.template), cb);
                    },
                    function (err) {
                        $scope.progress = 0;
                        $scope.processImport = false;
                        if (err)
                            return notifi.error(err);
                        return notifi.info('Create: .', 1000)
                    }
                );

            }, function () {

            });
        };

        $scope.fileCsvOnLoad = function (data) {
            debugger
        };

    }]);
    
    app.controller('MemberDialerExportCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
        $scope.settings = {
            separator: ';',
            headers: true,
            charSet: 'utf-8',
            data: [],
            template: {}
        };

        $scope.previewData = [];
        $scope.columns = [];


        $scope.fileCsvOnLoad = function (data) {
            var members = utils.CSVToArray(data, $scope.settings.separator);
            $scope.settings.data = members;
            $scope.columns = [];

            $scope.previewData = members.slice(0, 5);

            for (var i = 0; i < $scope.previewData[0].length; i++)
                $scope.columns.push({
                    id: i,
                    value: ""
                });
        };

        $scope.ok = function () {
            var template = {name: null, communications: [], variables: {}};

            angular.forEach($scope.columns, function (item) {
                var c = $scope.MemberColumns[item.value];
                if (c) {
                    if (!c.type) {
                        template[c.field] = item.id;
                    } else if (c.type === 'communications') {
                        if (!template.communications[c.position])
                            template.communications[c.position] = {};
                        template.communications[c.position][c.field] = item.id
                    }
                };
            });
            if (template.name === null || template.communications.length == 0)
                return alert('HALEPA');

            $scope.settings.template = template;
            $modalInstance.close($scope.settings, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.MemberColumns = {
            "name": {
                selected: false,
                name: "Name",
                field: 'name'
            },
            "priority": {
                selected: false,
                name: "Priority",
                field: 'priority'
            },
            "timezone": {
                selected: false,
                name: "Timezone",
                field: 'timezone'
            },
            "number_1": {
                selected: false,
                name: "number_1",
                field: 'number',
                position: 0,
                type: 'communications'
            },
            "priority_1": {
                selected: false,
                name: "priority_1",
                field: "priority",
                position: 0,
                type: 'communications'
            },
            "number_2": {
                selected: false,
                name: "number_2",
                field: 'number',
                position: 1,
                type: 'communications'
            },
            "priority_2": {
                selected: false,
                name: "priority_2",
                field: "priority",
                position: 1,
                type: 'communications'
            }
        };

        $scope.changeColumnsAlias = function (a, b) {

        }

        $scope.CharSet = [
            {
                id: "big5",
                name: "Chinese Traditional (Big5)"
            },
            {
                id: "euc-kr",
                name: "Korean (EUC)"
            },
            {
                id: "iso-8859-1",
                name: "Western Alphabet"
            },
            {
                id: "iso-8859-2",
                name: "Central European Alphabet (ISO)"
            },
            {
                id: "iso-8859-3",
                name: "Latin 3 Alphabet (ISO)"
            },
            {
                id: "iso-8859-4",
                name: "Baltic Alphabet (ISO)"
            },
            {
                id: "iso-8859-5",
                name: "Cyrillic Alphabet (ISO)"
            },
            {
                id: "iso-8859-6",
                name: "Arabic Alphabet (ISO)"
            },
            {
                id: "iso-8859-7",
                name: "Greek Alphabet (ISO)"
            },
            {
                id: "iso-8859-8",
                name: "Hebrew Alphabet (ISO)"
            },
            {
                id: "koi8-r",
                name: "Cyrillic Alphabet (KOI8-R)"
            },
            {
                id: "shift-jis",
                name: "Japanese (Shift-JIS)"
            },
            {
                id: "x-euc",
                name: "Japanese (EUC)"
            },
            {
                id: "utf-8",
                name: "Universal Alphabet (UTF-8)"
            },
            {
                id: "windows-1250",
                name: "Central European Alphabet (Windows)"
            },
            {
                id: "windows-1251",
                name: "Cyrillic Alphabet (Windows)"
            },
            {
                id: "windows-1252",
                name: "Western Alphabet (Windows)"
            },
            {
                id: "windows-1253",
                name: "Greek Alphabet (Windows)"
            },
            {
                id: "windows-1254",
                name: "Turkish Alphabet"
            },
            {
                id: "windows-1255",
                name: "Hebrew Alphabet (Windows)"
            },
            {
                id: "windows-1256",
                name: "Arabic Alphabet (Windows)"
            },
            {
                id: "windows-1257",
                name: "Baltic Alphabet (Windows)"
            },
            {
                id: "windows-1258",
                name: "Vietnamese Alphabet (Windows)"
            },
            {
                id: "windows-874",
                name: "Thai (Windows)"
            }

        ];
    }]);

    app.directive('fileReaderCsv', function() {
        return {
            scope: {
                fileReaderCsv:"=",
                fileOnLoad: "=",
                charSet: "="
            },
            link: function(scope, element) {
                $(element).on('change', function(changeEvent) {
                    var files = changeEvent.target.files;
                    if (files.length) {
                        var r = new FileReader();
                        r.onload = function(e) {
                            var contents = e.target.result;

                            scope.$apply(function () {
                                if (typeof scope.fileOnLoad === 'function' )
                                    return scope.fileOnLoad(contents);
                                scope.fileReaderCsv = contents;
                            });
                        };
                        // TODO
                        r.readAsText(files[0], scope.charSet);
                    }
                });
            }
        };
    });
    
    app.controller('MemberDialerPageCtrl', ['$scope', '$modalInstance', 'notifi', 'DialerModel', 'options', function ($scope, $modalInstance, notifi, DialerModel, options) {

        if (options && options.member) {
            DialerModel.members.item(options.domain, options.dialerId, options.member._id, function (err, data) {
                if (err)
                    return notifi.error(err);
                $scope.member = data;
            });
        } else {

            $scope.member = {
                _new: true,
                communications: [],
                _variables: []
            };
        };
        
        $scope.addCommunication = function (member) {
            $scope.inserted = {
                number: ''
            };
            member.communications.push($scope.inserted);
        };
        $scope.removeCommunication = function (index) {
            $scope.member.communications.splice(index, 1);
        };


        $scope.checkCommunicationNumber = function (number) {
            if (!number)
                return 'Number is required'
        };

        $scope.TimeZones = utils.timeZones;

        $scope.ok = function () {
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);
                var ins = res.insertedIds && res.insertedIds[0];
                if (ins) {
                    $scope.member._id = ins;
                }
                $modalInstance.close({value: $scope.member}, 5000);
            };

            if (options.member && options.member._id) {
                DialerModel.members.update(options.domain, options.dialerId, options.member._id, $scope.member, cb);
            } else {
                DialerModel.members.add(options.domain, options.dialerId, $scope.member, cb);
            };
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
    
    app.controller('StatsDialerCtrl', ['$scope',
        function ($scope) {

            // TODO Chart
            $scope.dialerChartObject = {};

            $scope.dialerChartObject.type = "PieChart";

            $scope.onions = [
                {v: "Onions"},
                {v: 3},
            ];

            $scope.dialerChartObject.data = {"cols": [
                {id: "t", label: "Topping", type: "string"},
                {id: "s", label: "Slices", type: "number"}
            ], "rows": [
                {c: [
                    {v: "Mushrooms"},
                    {v: 3},
                ]},
                {c: $scope.onions},
                {c: [
                    {v: "Olives"},
                    {v: 31}
                ]},
                {c: [
                    {v: "Zucchini"},
                    {v: 1},
                ]},
                {c: [
                    {v: "Pepperoni"},
                    {v: 2},
                ]}
            ]};

            $scope.dialerChartObject.options = {
                'title': 'How Much Pizza I Ate Last Night'
            };
    }]);

    app.controller('DialerResourceDialStringCtrl', ['$scope', '$modalInstance', 'resource',
        function ($scope, $modalInstance, resource) {

        $scope.dialedNumber = angular.copy(resource.dialedNumber);

        var id = resource.$$hashKey;

        $scope.ok = function () {
            if (!$scope.dialedNumber) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close({value: $scope.dialedNumber, id: id}, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
});
