define(['app', 'async', 'scripts/webitel/utils', 'modules/callflows/editor', 'modules/callflows/callflowUtils', 'modules/cdr/libs/fileSaver', 'moment', 'modules/gateways/gatewayModel',
    'modules/dialer/dialerModel', 'modules/calendar/calendarModel',  'modules/cdr/libs/json-view/jquery.jsonview',
    'modules/cdr/fileModel', 'modules/accounts/accountModel', 'modules/media/mediaModel', 'modules/dialer/agentModel', 'css!modules/dialer/dialer.css'], function (app, async, utils, aceEditor, callflowUtils, fileSaver, moment) {


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

    function timeToString(time) {
        if (time)
            return new Date(time).toLocaleString();
    }

    app.controller('DialerCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'DialerModel', '$location', '$route', '$routeParams',
        '$confirm', 'TableSearch', '$timeout', '$modal', 'CalendarModel', 'AccountModel', '$q', '$filter', 'MediaModel',
        function ($scope, webitel, $rootScope, notifi, DialerModel, $location, $route, $routeParams, $confirm, TableSearch,
                  $timeout, $modal, CalendarModel, AccountModel, $q, $filter, MediaModel) {

            $scope.canDelete = webitel.connection.session.checkResource('dialer', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('dialer', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('dialer', 'c');
            $scope.domain = webitel.domain();
            $scope.dialer = {};


            $scope.viewMode = !$scope.canUpdate;

            $scope.view = function () {
                $scope.viewMode = true;
                edit();
            };


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
                webitel.connection.instance.unServerEvent('DC::CHANGE_STATE', true, changeStateEvent);
                changeDomainEvent();
                $timeout.cancel(timerId)
            });
            
            var changeStateEvent = function (e) {
                if ($scope.dialer && $scope.dialer._id) {
                    edit();
                    $scope.checkDoNotClickButton = false;
                }
            };

            webitel.connection.instance.onServerEvent('DC::CHANGE_STATE', changeStateEvent, {all:true});

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            });

            $scope.$watch('[dialer,cf]', function(newValue, oldValue) {
                if ($scope.dialer._new)
                    return $scope.isEdit = $scope.isNew = true;

                $scope.textStateAction = $scope.dialer.active ?  'STOP' : 'RUN';
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

            $scope.mediaFiles = [];
            $scope.getMediaFiles = function () {
                MediaModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.mediaFiles = [];
                    if (angular.isArray(res)) {
                        res.forEach(function (item) {
                            $scope.mediaFiles.push({
                                id: item._id,
                                uri: utils.mediaToUri(item),
                                name: item.name
                            })
                        })
                    }
                });
            };
            
            $scope.activeProcessDialer = false;

            $scope.textStateAction = '';

            $scope.toDateString = function (date) {
                if (date)
                    return new Date(date).toLocaleString();
                return '';
            };

            var timerId = null;
            $scope.checkDoNotClickButton = false;
            $scope.setProcessDialer = function (v) {
                var state = v.active ? 3 : 1;
                var active = v.active;
                var tryCount = 0;
                var setState = function (err) {
                    if (err)
                        return;
                    $scope.checkDoNotClickButton = true;
                    DialerModel.setState($scope.dialer._id, $scope.dialer.domain, state, function (err, res) {
                        if (err)
                            return notifi.error(err);

                        var tick = function () {
                            if ($scope.dialer.active !== active) {
                                $scope.checkDoNotClickButton = false;
                                $timeout.cancel(timerId);
                                if (active)
                                    notifi.info('Stop dialer ' + $scope.dialer.name, 2000);
                                return;
                            };
                            edit();
                            tryCount++;
                            timerId = $timeout(tick, 1500);
                        };
                        // timerId = $timeout(tick, 1500);
                        if (active)
                            return notifi.info('Please wait...', 10000);
                        else return notifi.info('Please wait... Set ready', 2000);

                    });
                };


                if ($scope.isEdit) {
                    $confirm({text: 'Save changes ' + v.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                        .then(function() {
                            save(setState);
                        });
                    return;
                };

                if (active) {
                    $confirm({text: 'Stop dialer ' + v.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                        .then(setState);
                    return;
                }
                setState();
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

            $scope.editResourceDestination = function (resource, viewMode) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/resourcePage.html',
                    controller: 'DialerResourceCtrl',
                    resolve: {
                        viewMode: function () {
                            return viewMode;
                        },
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

            function save (callback) {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.dialer._new) {
                        return $location.path('/dialer/' + res + '/edit');
                    } else {
                        $scope.dialer.__time = Date.now();
                        return edit(callback);
                    };
                };
                if ($scope.cf)
                    $scope.dialer._cf = JSON.parse($scope.cf);;

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
            }
            
            $scope.gotoUrl = function (url) {
                $location.path(url);
            };

            function edit (callback) {
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
                    $scope._activeProcessDialer = angular.copy(item.active);
                    $scope.activeResource = $scope.dialer.resources && $scope.dialer.resources[index];
                    disableEditMode();
                    if (typeof callback === 'function') callback(err, item);
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

            $scope.setSource = null;

            $scope.selAgents = {};
            $scope.selTiers = {};
            $scope.agents = [];
            $scope.tiers = [];
            $scope.agentList = {};

            $scope.agentStrategy = [
                {
                    name: "Random",
                    val: "random"
                },
                {
                    name: "With fewest calls",
                    val: "with_fewest_calls"
                },
                {
                    name: "With least talk time",
                    val: "with_least_talk_time"
                },
                {
                    name: "Longest idle agent",
                    val: "longest_idle_agent"
                }
            ];
            $scope.numberStrategy = [
                {
                    name: "Top-down",
                    val: "top-down"
                },
                {
                    name: "By priority",
                    val: "by-priority"
                }
            ];

            $scope.membersStrategy = [
                {
                    name: "Strict circuit",
                    val: "strict-circuit"
                },
                {
                    name: "Next tries circuit",
                    val: "next-tries-circuit"
                }
            ];

            $scope.addTiers = function (all) {
                var collection = all ? $scope.agents : $scope.selAgents;
                if (!collection.length) {
                    angular.forEach(collection, function (i, key) {
                        if (!i) return;
                        if (!~$scope.dialer.agents.indexOf(key)) {
                            $scope.dialer.agents.push(key);
                        }
                    })
                } else {
                    angular.forEach(collection, function (i) {
                        if (!~$scope.dialer.agents.indexOf(i.id)) {
                            $scope.dialer.agents.push(i.id);
                        }
                    })
                }
                $scope.selAgents = {};
                $scope.selTiers = {};
            };

            $scope.isAgentInTier = function (a) {
                return !~$scope.dialer.agents.indexOf(a.id);
            };
            
            $scope.removeTiers = function (all) {
                if (all) {
                    $scope.selTiers = {};
                    return $scope.dialer.agents = [];
                }

                var collection = $scope.selTiers;
                angular.forEach(collection, function (i, key) {
                    if (!i) return;
                    if (~$scope.dialer.agents.indexOf(key)) {
                        $scope.dialer.agents.splice($scope.dialer.agents.indexOf(key), 1);
                    }
                });
                $scope.selAgents = {};
                $scope.selTiers = {};
            };

            $scope.loadAgents = function () {
                AccountModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var data =  $scope.agentList = res.data || res.info;
                    angular.forEach(data, function (i) {
                        $scope.agents.push(i);
                    })
                })
            }

            /*

             Idle: 0,
             Work: 1,
             Sleep: 2,
             ProcessStop: 3,
             End: 4

             */

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
                    name: "Sleep"
                },
                {
                    val: 3,
                    name: "Process stop"
                },
                {
                    val: 4,
                    name: "End"
                }
            ];
            
            $scope.stateDialerToString = function (stateNumber) {
                for (var i = 0, len = $scope.diealerStates.length; i < len; i++) {
                    if ($scope.diealerStates[i].val == stateNumber)
                        return $scope.diealerStates[i].name
                }
            };
            //$scope.diealerTypes = ["progressive", "predictive", "auto dialer"];
            $scope.diealerTypes = ["Voice Broadcasting", "Progressive Dialer", "Predictive Dialer"];

            var _mapCode = {
                causesError: "CODE_RESPONSE_ERRORS",
                causesRetry: "CODE_RESPONSE_RETRY",
                causesOK: "CODE_RESPONSE_OK",
                causesMinus: "CODE_RESPONSE_MINUS_PROBE"
            };
            
            $scope.resetCause = function () {
                $confirm({text: 'Are you sure you want to reset causes ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        $scope.dialer.causesError = angular.copy(DialerModel.CODE_RESPONSE_ERRORS);
                        $scope.dialer.causesRetry = angular.copy(DialerModel.CODE_RESPONSE_RETRY);
                        $scope.dialer.causesOK = angular.copy(DialerModel.CODE_RESPONSE_OK);
                        $scope.dialer.causesMinus = angular.copy(DialerModel.CODE_RESPONSE_MINUS_PROBE);
                    });
            };

            $scope.loadCause = function (query, fieldName) {
                var result = $q.defer();
                var data = DialerModel.ALL_CODE;
                angular.forEach(_mapCode, function (v, key) {

                    if ($scope.dialer[key]) {
                        var m = $scope.dialer[key].map(function (v) {
                            if (v.text)
                                return v.text;
                            return v;
                        });
                        data = diffArray(data, m);
                    }
                });

                data = $filter('filter')(data, query);
                result.resolve(data);
                return result.promise;
            };

            $scope.selectTabStats = function () {
                window.dispatchEvent(new Event('resize'));
            };
            
            $scope.resetProcess = function (id, domain) {
                DialerModel.resetProcess(id, domain, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    var data = res && (res.data || res.info);
                    if (!data)
                        return notifi.error('No response from server.');

                    if (data.n === 0) {
                        return notifi.warn('Please stop dialer. And try now.', 5000)
                    } else {
                        return notifi.info('OK.', 2000)
                    }
                })
            };

            // region Communication type logic

            $scope.rangeType = {};
            $scope._hourError = false;
            $scope._editRangeRowKey = null;
            $scope._editRangeRowRow = {};
            
            $scope.editRangeName = function (rowName, key) {
                $scope._editRangeRowRow = {
                    "name": rowName.name,
                    "code": rowName.code
                };
                $scope._editRangeRowKey = key;
            };
            
            $scope.saveRangeName = function (newRow, oldRow, communications) {
                if (!newRow.name || !newRow.code) {
                    return showError('Bad name or code');
                }

                if (angular.isArray(communications)) {
                    for (var i = 0; i < communications.length; i++)
                        if (oldRow !== communications[i] && communications[i].code == newRow.code)
                            return showError('Bad code')
                }

                oldRow.name = newRow.name;
                oldRow.code = newRow.code;
                $scope._editRangeRowRow = {};
                $scope._editRangeRowKey = null;
            };

            $scope.removeRangeName = function (key, types) {
                types.splice(key, 1);
            };

            $scope.editRangeRow = function (row, key) {
                var startTime = getHourAndMinuteFromTimeOfDay(row.startTime);
                var endTime = getHourAndMinuteFromTimeOfDay(row.endTime);
                $scope._editRangeRowRow = {
                    "startHour": startTime.hour,
                    "startMinute": startTime.minute,
                    "endHour": endTime.hour,
                    "endMinute": endTime.minute,
                    "attempts": row.attempts,
                    "priority": row.priority || 0
                };
                $scope._editRangeRowKey = key;
            };

            $scope.saveRangeRow = function (range, communications) {
                var row = validateRange($scope._editRangeRowRow, communications, range);
                if (!row) {
                    return showError('Bad range');
                }

                var idx = findIndexFromRows(range, communications);
                communications[idx] = row;
                $scope._editRangeRowRow = {};
                $scope._editRangeRowKey = null;
            };
            
            $scope.addRangeType = function (range, communications) {

                if (!range.code) {
                    //TODO error
                    return showError('Bad code');
                }

                if (!communications)
                    $scope.dialer.communications = communications = {types: []};

                var type = findTypeInCommunications(range.code, communications);
                if (!type) {
                    type = {
                        name: range.name,
                        code: range.code,
                        ranges: []
                    };
                    communications.types.push(type);
                }

                if (!type.ranges) {
                    type.ranges = []
                }

                var _range = validateRange(range, type.ranges);
                if (!_range)
                    return showError('Bad hours');

                type.ranges.push(_range);
            };
            
            $scope.removeRange = function (row, range, key) {
                row.ranges.splice(key, 1);
                if (row.ranges.length === 0) {
                    var idx = findTypeIdInCommunications(row.code, $scope.dialer.communications);
                    if (isFinite(idx)) {
                        $scope.dialer.communications.types.splice(idx, 1);
                    } else {
                        //TODO
                        throw 'Bad name';
                    }
                }
            };

            function showError(err) {
                notifi.error(err, 2000);
                $scope._hourError = true;
                $timeout(function () {
                    $scope._hourError = false;
                }, 2000);
            }

            function validateRange(range, ranges, _curentRange) {
                if (!range)
                    return null;

                if (!isFinite(range.startHour) || !isFinite(range.startMinute) ||
                    !isFinite(range.endHour) || !isFinite(range.endMinute) ||
                    !isFinite(range.attempts) )
                    return null;

                var startTime = (+range.startHour * 60) + (+range.startMinute);
                var endTime = (+range.endHour * 60) + (+range.endMinute);

                if (endTime <= startTime)
                    return null;

                var max = Math.max(startTime, endTime),
                    min = Math.min(startTime, endTime)
                    ;

                for (var i = 0, len = ranges.length; i < len; i++)
                    if (_curentRange !== ranges[i] && betweenLine(max, min, ranges[i].startTime, ranges[i].endTime))
                        return null;

                return {
                    "startTime": startTime,
                    "endTime": endTime,
                    "attempts": range.attempts,
                    "priority": range.priority
                }
            }

            //TODO move utils
            function betweenLine(maxA, minA, bX, bY) {
                return Math.min(maxA, Math.max(bX, bY)) >=
                    Math.max(minA, Math.min(bX, bY))
            }
            //TODO move utils
            function addZero (n) {
                return n < 10 ? '0' + n : '' + n;
            }

            function findIndexFromRows (row, rows) {
                for (var i = 0, len = rows.length; i < len; i++)
                    if (rows[i] === row)
                        return i;

            }
            //TODO move utils
            $scope.minuteOfDayToString = function (time) {
                var hm = getHourAndMinuteFromTimeOfDay(time);
                return addZero(hm.hour) + ':' + addZero(hm.minute);
            };
            //TODO move utils
            function getHourAndMinuteFromTimeOfDay (time) {
                return {
                    hour: Math.floor((time / 60) % 24),
                    minute: time % 60
                }
            }

            function findTypeInCommunications(code, communications) {
                if (angular.isArray(communications && communications.types)) {
                    for (var item of communications.types) {
                        if (item.code === code)
                            return item;
                    }
                }
            }
            function findTypeIdInCommunications(code, communications) {
                if (angular.isArray(communications && communications.types)) {
                    for (var i = 0; i <  communications.types.length; i++) {
                        if (communications.types[i].code === code)
                            return i;
                    }
                }
            }

            $scope.getNumber = function (num) {
                var arr = [];
                for (var i = 0; i < num; i++)
                    if (i < 10)
                        arr.push('0' + i);
                    else arr.push('' + i);
                return arr;
            };



            // endregion

            function diffArray(a1, a2) {
                return a1.filter(function(i) {return a2.indexOf(i) < 0;});
            }

    }]);
    
    app.controller('DialerResourceCtrl', ["$scope", '$modalInstance', 'resource', 'domain', 'viewMode', 'GatewayModel', 'notifi',
        function ($scope, $modalInstance, resource, domain, viewMode, GatewayModel, notifi) {
        $scope.resource = angular.copy(resource);
        $scope.viewMode = viewMode;
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

        GatewayModel.list(null, function (err, res) {
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
            _tableState.pagination.start = 0;
            $scope.callServer(_tableState)
        };

        var nexData = true;
        $scope.isLoading = false;
        var _page = 1;
        $scope.CountItemsByPage = 40;
        $scope.membersRowCollection = [];

        var checkDialerLoad = true;

        $scope.communicationTypes = [];
        $scope.$watch('dialer', function (dialer) {
            if (dialer && dialer._id) {
                if (dialer.communications && angular.isArray(dialer.communications.types))
                    $scope.communicationTypes = dialer.communications.types;

                if (!checkDialerLoad)
                    return;

                _tableState = {
                    "sort": {},
                    "search": {},
                    "pagination": {
                        "start": 0,
                        "totalItemCount": 0
                    }
                };
                checkDialerLoad = false;
                $scope.callServer(_tableState);
            }
        }, true);

        $scope.getCommunicationDisplayName = function (code) {
            if (!code)
                return '-';

            var communicationTypes = $scope.communicationTypes;

            for (var i = 0; i < communicationTypes.length; i++)
                if (communicationTypes[i].code === code)
                    return communicationTypes[i].name;

            return 'error type: ' + code;
        };

        $scope.timeToString = timeToString;

        $scope.callServer = function (tableState) {
            if ($scope.isLoading || checkDialerLoad) return void 0;
            _tableState = tableState;

            $scope.isLoading = true;

            var option = {
                sort: {},
                filter: tableState.search.predicateObject || {},
                page: _page,
                limit: $scope.CountItemsByPage,
                columns: ["createdOn", "name", "priority", "timezone", "communications", "_endCause", "_lock", "_waitingForResultStatusCb"]
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

        function removeMembers() {
            $confirm({text: 'Are you sure you want to delete ' + ($scope.count || 0) + ' members ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    DialerModel.members.removeMulti($scope.dialer._id, _tableState.search.predicateObject, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);
                        notifi.info('Remove ' + res.n + ' members.', 5000);
                        $scope.reloadData();
                    });
                });
        }

        $scope.removeMembers = removeMembers;
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
                windowClass: "large-modal-window",
                templateUrl: '/modules/dialer/memberPage.html',
                controller: 'MemberDialerPageCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                            member: null,
                            dialerId: $scope.dialer._id,
                            domain: $scope.domain,
                            communications: $scope.dialer.communications && $scope.dialer.communications.types
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

        $scope.editMember = function (member, index, viewMode) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/memberPage.html',
                windowClass: "large-modal-window",
                controller: 'MemberDialerPageCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                            viewMode: viewMode,
                            member: member,
                            dialerId: $scope.dialer._id,
                            setSource: $scope.setSource,
                            domain: $scope.domain,
                            communications: $scope.dialer.communications && $scope.dialer.communications.types
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
                name: "Active",
                val: 0
            },
            {
                name: "End",
                val: 2
            }
        ];

        function getMemberFromTemplate (row, template) {
            var m = {
                name: row[template.name],
                communications: [],
                expire: null,
                _variables: []
            };

            angular.forEach(template.communications, function (v) {
                if (!v) return;
                m.communications.push({
                    number: row[v.number],
                    type: row[v.type],
                    priority: +row[v.priority] || 0,
                    status : 0,
                    state : 0,
                    description : row[v.description] || ""

                })
            });
            angular.forEach(template.variables, function (v, key) {
                if (key && row[v]) {
                    m._variables.push({
                        key: key,
                        value: row[v]
                    })
                }
            });

            if (template.hasOwnProperty('expire') && typeof template.expire.id == 'number' && row[template.expire.id]) {
                var timeExpire = moment(row[template.expire.id], template.expire.format).valueOf();
                if (timeExpire)
                    m.expire = timeExpire;
            }

            return m;

        }
        $scope.progress = 0;
        $scope.progressCount = 0;
        $scope.processImport = false;

        $scope.showImportPage = function () {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/importCsv.html',
                controller: 'MemberDialerImportCtrl',
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
                var createdItems = 0;
                $scope.progressCount = 0;

                $scope.maxProgress = allCount;
                $scope.processImport = true;
                async.eachSeries(result.data,
                    function (item, cb) {
                        $scope.progress =  Math.round(100 * $scope.progressCount++ / allCount);
                        var m = getMemberFromTemplate(item, result.template);
                        if (!m || !m.name || !m.communications) {
                            console.warn('skip: ', m);
                            return cb();
                        }
                        DialerModel.members.add($scope.domain, $scope.dialer._id, m, function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                createdItems++;
                            }
                            cb();
                        });
                    },
                    function (err) {
                        $scope.progress = 0;
                        $scope.processImport = false;
                        if (err)
                            return notifi.error(err);
                        return notifi.info('Create: ' + createdItems, 2000)
                    }
                );

            }, function () {

            });
        };

        $scope.exportMembers = function () {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/dialer/exportPageCsv.html',
                controller: 'MemberDialerExportCtrl',
                size: 'lg',
                resolve: {
                    options: function () {
                        return {
                        };
                    }
                }
            });

            modalInstance.result.then(function (settings) {
                var option = {
                    sort: {},
                    filter: _tableState.search.predicateObject || {},
                    page: 0,
                    limit: 1000,
                    columns: [],
                    fileName: settings.fileName || $scope.dialer.name
                };

                var data = "";

                //region TODO ...

                function _findSteps(steps, reg, to) {
                    for (var i in steps) {
                        if (reg.test(steps[i].data)) {
                            return steps[i].data.replace(reg, to)
                        }
                    }
                    return '';
                }

                function _findNumber(row, n) {
                    for (var key in row.communications) {
                        if (row.communications[key].number == n)
                            return row.communications[key];
                    }
                }

                function addRow(row) {

                    function addNoAtempt() {
                        angular.forEach(settings.data, function (i, index) {
                            var val;
                            if (i.field === "callTime") {
                                if (row._log) {
                                    var call = row._log[row._log.length - 1];
                                    call = call && call.steps;
                                    val = call && call[0].time;
                                    if (i.type == 'string' && val)
                                        val = new Date(val).toLocaleString()
                                }
                            } else if (i.field === "expire") {
                                val = row.expire;
                                if (i.type == 'string' && val)
                                    val = new Date(val).toLocaleString()
                            } else {
                                val = row;
                                i.route.split('.').forEach(function (token) {
                                    val = val && val[token];
                                });
                            }

                            if (!val)
                                val = '';

                            data += val + (settings.data.length - 1 == index ? '': settings.separator);
                        });
                        data += '\n';
                    }

                    if (settings.allProbe) {
                        if (angular.isArray(row._log)) {
                            angular.forEach(row._log, function (atempt) {
                                angular.forEach(settings.data, function (i, index) {
                                    var val;
                                    switch (i.field) {
                                        case "_probeCount":
                                            val = atempt.callAttempt;
                                            break;
                                        case "callTime":
                                            val = atempt.callTime;
                                            if (i.type == 'string' && val)
                                                val = new Date(val).toLocaleString();
                                            break;
                                        case "expire":
                                            val = row.expire;
                                            if (i.type == 'string' && val)
                                                val = new Date(val).toLocaleString();
                                            break;
                                        case "number":
                                            val = atempt.callNumber;
                                            break;
                                        case "attempt_cause":
                                            val = atempt.cause;
                                            break;
                                        case "attempt_amd_result":
                                            val = atempt.amdResult;
                                            break;
                                        case "priority_number":
                                            val = atempt.callPriority;
                                            break;
                                        case "state":
                                            val = atempt.callState;
                                            break;
                                        case "callSuccessful":
                                            val = atempt.callSuccessful;
                                            break;
                                        case "description":
                                            val = row.communications[atempt.callPositionIndex]
                                                && row.communications[atempt.callPositionIndex].description;
                                            break;
                                        default: 
                                            val = row;
                                            i.route.split('.').forEach(function (token) {
                                                val = val && val[token];
                                            });
                                    }
                                    if (val == undefined)
                                        val = '';

                                    data += val + (settings.data.length - 1 == index ? '': settings.separator);
                                });
                                data += '\n';
                            })
                        } else {
                            addNoAtempt();
                        }
                    } else {
                        addNoAtempt()
                    }
                }

                if (settings.skipFilter)
                    option.filter = {};

                if (settings.headers) {
                    angular.forEach(settings.data, function (i, index) {
                        data += i.name + (settings.data.length - 1 == index ? '' : settings.separator);
                    });
                    data += '\n';
                }

                //endregion
                
                (function process(err, res) {
                    if (err)
                        return notifi.error(err);
                    
                    angular.forEach(res, function (row) {
                        addRow(row);
                    });

                    if (res && res.length < option.limit) {
                        var blob = new Blob([data], {
                            type: "text/plain;charset=" + settings.charSet
                        });
                        fileSaver(blob, option.fileName + '.csv');
                        // exit;
                        return;
                    }

                    option.page++;
                    DialerModel.members.list($scope.domain, $scope.dialer._id, option, process);
                })();
            })
        };
        
        $scope.showResetPage = function () {
            DialerModel.members.countEndMembers($scope.domain, $scope.dialer._id, function (err, count) {
                if (err)
                    return notifi.error(err, 5000);

                $confirm({text: 'Reset ' + (count || 0) + ' unsuccessful members ?'},  { templateUrl: '/modules/dialer/resetMemberPage.html' })
                    .then(function(clearLog) {
                        DialerModel.members.reset($scope.dialer._id, $scope.domain, clearLog, function (err, count) {
                            if (err)
                                return notifi.error(err, 5000);

                            $scope.reloadData();
                            return notifi.info('OK: reset ' + count + ' members.', 5000);
                        })
                    });
            });
        }

    }]);
    
    app.controller('MemberDialerImportCtrl', ['$scope', '$modalInstance', 'notifi', function ($scope, $modalInstance, notifi) {
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
                    } else if (c.type === 'variable' && item.varName) {
                        template.variables[item.varName] = item.id;
                    } else if (c.type === 'communications') {
                        if (!template.communications[c.position])
                            template.communications[c.position] = {};
                        template.communications[c.position][c.field] = item.id
                    } else if (c.type === 'time') {
                        template[c.field] = {
                            id: item.id,
                            format: item.format
                        }
                    }
                }
            });
            if (template.name === null || template.communications.length == 0)
                return notifi.error(new Error('Bad settings.'), 5000);

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
            "variable": {
                "name": "Variable",
                "field": "variable",
                "type": "variable",
                "value": "",
                "varName": ""
            },
            //"timezone": {
            //    selected: false,
            //    name: "Timezone",
            //    field: 'timezone'
            //},
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
            "description_1": {
                selected: false,
                name: "description_1",
                field: "description",
                position: 0,
                type: 'communications'
            },
            "type_1": {
                selected: false,
                name: "type_1",
                field: "type",
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
            },
            "description_2": {
                selected: false,
                name: "description_2",
                field: "description",
                position: 1,
                type: 'communications'
            },
            "type_2": {
                selected: false,
                name: "type_2",
                field: "type",
                position: 1,
                type: 'communications'
            },
            "number_3": {
                selected: false,
                name: "number_3",
                field: 'number',
                position: 2,
                type: 'communications'
            },
            "priority_3": {
                selected: false,
                name: "priority_3",
                field: "priority",
                position: 2,
                type: 'communications'
            },
            "description_3": {
                selected: false,
                name: "description_3",
                field: "description",
                position: 2,
                type: 'communications'
            },
            "type_3": {
                selected: false,
                name: "type_3",
                field: "type",
                position: 2,
                type: 'communications'
            },
            "number_4": {
                selected: false,
                name: "number_4",
                field: 'number',
                position: 3,
                type: 'communications'
            },
            "priority_4": {
                selected: false,
                name: "priority_4",
                field: "priority",
                position: 3,
                type: 'communications'
            },
            "description_4": {
                selected: false,
                name: "description_4",
                field: "description",
                position: 3,
                type: 'communications'
            },
            "type_4": {
                selected: false,
                name: "type_4",
                field: "type",
                position: 3,
                type: 'communications'
            },
            "number_5": {
                selected: false,
                name: "number_5",
                field: 'number',
                position: 4,
                type: 'communications'
            },
            "priority_5": {
                selected: false,
                name: "priority_5",
                field: "priority",
                position: 4,
                type: 'communications'
            },
            "description_5": {
                selected: false,
                name: "description_5",
                field: "description",
                position: 4,
                type: 'communications'
            },
            "type_5": {
                selected: false,
                name: "type_5",
                field: "type",
                position: 4,
                type: 'communications'
            },
            "number_6": {
                selected: false,
                name: "number_6",
                field: 'number',
                position: 5,
                type: 'communications'
            },
            "priority_6": {
                selected: false,
                name: "priority_6",
                field: "priority",
                position: 5,
                type: 'communications'
            },
            "description_6": {
                selected: false,
                name: "description_6",
                field: "description",
                position: 5,
                type: 'communications'
            },
            "type_6": {
                selected: false,
                name: "type_6",
                field: "type",
                position: 5,
                type: 'communications'
            },
            "number_7": {
                selected: false,
                name: "number_7",
                field: 'number',
                position: 6,
                type: 'communications'
            },
            "priority_7": {
                selected: false,
                name: "priority_7",
                field: "priority",
                position: 6,
                type: 'communications'
            },
            "description_7": {
                selected: false,
                name: "description_7",
                field: "description",
                position: 6,
                type: 'communications'
            },
            "type_7": {
                selected: false,
                name: "type_7",
                field: "type",
                position: 6,
                type: 'communications'
            },
            "number_8": {
                selected: false,
                name: "number_8",
                field: 'number',
                position: 7,
                type: 'communications'
            },
            "priority_8": {
                selected: false,
                name: "priority_8",
                field: "priority",
                position: 7,
                type: 'communications'
            },
            "description_8": {
                selected: false,
                name: "description_8",
                field: "description",
                position: 7,
                type: 'communications'
            },
            "type_8": {
                selected: false,
                name: "type_8",
                field: "type",
                position: 7,
                type: 'communications'
            },
            "number_9": {
                selected: false,
                name: "number_9",
                field: 'number',
                position: 8,
                type: 'communications'
            },
            "priority_9": {
                selected: false,
                name: "priority_9",
                field: "priority",
                position: 8,
                type: 'communications'
            },
            "description_9": {
                selected: false,
                name: "description_9",
                field: "description",
                position: 8,
                type: 'communications'
            },
            "type_9": {
                selected: false,
                name: "type_9",
                field: "type",
                position: 8,
                type: 'communications'
            },
            "number_10": {
                selected: false,
                name: "number_10",
                field: 'number',
                position: 9,
                type: 'communications'
            },
            "priority_10": {
                selected: false,
                name: "priority_10",
                field: "priority",
                position: 9,
                type: 'communications'
            },
            "description_10": {
                selected: false,
                name: "description_10",
                field: "description",
                position: 9,
                type: 'communications'
            },
            "type_10": {
                selected: false,
                name: "type_10",
                field: "type",
                position: 9,
                type: 'communications'
            },
            "expire": {
                name: "Expire",
                field: "expire",
                type: "time"
            }
        };

        $scope.changeColumnsAlias = function (a, b) {

        }

        $scope.CharSet = utils.CharSet;
    }]);
    
    app.controller('MemberDialerExportCtrl', ['$scope', '$modalInstance', 'notifi', function ($scope, $modalInstance, notifi) {
        $scope.settings = {
            separator: ';',
            allProbe: false,
            headers: true,
            skipFilter: false,
            charSet: 'utf-8',
            data: [],
            template: {},
            fields: {}
        };

        $scope.CharSet = utils.CharSet;

        var ExportColumns = $scope.ExportColumns = {
            "name": {
                selected: false,
                name: "Name",
                field: 'name'
            },
            "callSuccessful": {
                selected: false,
                name: "Call success",
                field: 'callSuccessful'
            },
            "_id": {
                selected: false,
                name: "Id",
                field: '_id'
            },
            "priority": {
                selected: false,
                name: "Priority",
                field: 'priority'
            },
            "variable": {
                "name": "Variable",
                "field": "variable",
                "type": "variable",
                "value": "",
                "varName": ""
            },
            //"timezone": {
            //    selected: false,
            //    name: "Timezone",
            //    field: 'timezone'
            //},
            "number": {
                name: "Number",
                field: 'number',
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": true
                }
            },
            "description": {
                name: "Description",
                field: 'description',
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": true
                }
            },
            "priority_number": {
                selected: false,
                name: "Priority number",
                field: "priority_number",
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": true
                }
            },
            "state": {
                selected: false,
                name: "State",
                field: "state",
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": true
                }
            },
            "number_1": {
                selected: false,
                name: "number_1",
                field: 'number',
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_1": {
                selected: false,
                name: "priority_1",
                field: "priority",
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_1": {
                selected: false,
                name: "state_1",
                field: "state",
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_1": {
                selected: false,
                name: "description_1",
                field: "description",
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_1": {
                selected: false,
                name: "type_1",
                field: "type",
                position: 0,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_2": {
                selected: false,
                name: "number_2",
                field: 'number',
                position: 1,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_2": {
                selected: false,
                name: "priority_2",
                field: "priority",
                position: 1,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_2": {
                selected: false,
                name: "state_2",
                field: "state",
                position: 1,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_2": {
                selected: false,
                name: "description_2",
                field: "description",
                position: 1,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_2": {
                selected: false,
                name: "type_2",
                field: "type",
                position: 1,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_3": {
                selected: false,
                name: "number_3",
                field: 'number',
                position: 2,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_3": {
                selected: false,
                name: "priority_3",
                field: "priority",
                position: 2,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_3": {
                selected: false,
                name: "state_3",
                field: "state",
                position: 2,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_3": {
                selected: false,
                name: "description_3",
                field: "description",
                position: 2,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_3": {
                selected: false,
                name: "type_3",
                field: "type",
                position: 2,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_4": {
                selected: false,
                name: "number_4",
                field: 'number',
                position: 3,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_4": {
                selected: false,
                name: "priority_4",
                field: "priority",
                position: 3,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_4": {
                selected: false,
                name: "state_4",
                field: "state",
                position: 3,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_4": {
                selected: false,
                name: "description_4",
                field: "description",
                position: 3,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_4": {
                selected: false,
                name: "type_4",
                field: "type",
                position: 3,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_5": {
                selected: false,
                name: "number_5",
                field: 'number',
                position: 4,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_5": {
                selected: false,
                name: "priority_5",
                field: "priority",
                position: 4,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_5": {
                selected: false,
                name: "state_5",
                field: "state",
                position: 4,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_5": {
                selected: false,
                name: "description_5",
                field: "description",
                position: 4,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_5": {
                selected: false,
                name: "type_5",
                field: "type",
                position: 4,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_6": {
                selected: false,
                name: "number_6",
                field: 'number',
                position: 5,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_6": {
                selected: false,
                name: "priority_6",
                field: "priority",
                position: 5,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_6": {
                selected: false,
                name: "state_6",
                field: "state",
                position: 5,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_6": {
                selected: false,
                name: "description_6",
                field: "description",
                position: 5,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_6": {
                selected: false,
                name: "type_6",
                field: "type",
                position: 5,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_7": {
                selected: false,
                name: "number_7",
                field: 'number',
                position: 6,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_7": {
                selected: false,
                name: "priority_7",
                field: "priority",
                position: 6,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_7": {
                selected: false,
                name: "state_7",
                field: "state",
                position: 6,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_7": {
                selected: false,
                name: "description_7",
                field: "description",
                position: 6,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_7": {
                selected: false,
                name: "type_7",
                field: "type",
                position: 6,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_8": {
                selected: false,
                name: "number_8",
                field: 'number',
                position: 7,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_8": {
                selected: false,
                name: "priority_8",
                field: "priority",
                position: 7,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_8": {
                selected: false,
                name: "state_8",
                field: "state",
                position: 7,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_8": {
                selected: false,
                name: "description_8",
                field: "description",
                position: 7,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_8": {
                selected: false,
                name: "type_8",
                field: "type",
                position: 7,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_9": {
                selected: false,
                name: "number_9",
                field: 'number',
                position: 8,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_9": {
                selected: false,
                name: "priority_9",
                field: "priority",
                position: 8,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_9": {
                selected: false,
                name: "state_9",
                field: "state",
                position: 8,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_9": {
                selected: false,
                name: "description_9",
                field: "description",
                position: 8,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_9": {
                selected: false,
                name: "type_9",
                field: "type",
                position: 8,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "number_10": {
                selected: false,
                name: "number_10",
                field: 'number',
                position: 9,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "priority_10": {
                selected: false,
                name: "priority_10",
                field: "priority",
                position: 9,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "state_10": {
                selected: false,
                name: "state_10",
                field: "state",
                position: 9,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "description_10": {
                selected: false,
                name: "description_10",
                field: "description",
                position: 9,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "type_10": {
                selected: false,
                name: "type_10",
                field: "type",
                position: 9,
                type: 'communications',
                filter: {
                    "allProbe": false
                }
            },
            "_endCause": {
                name: "End cause",
                "field": "_endCause"
            },
            "_probeCount": {
                name: "Attempts",
                "field": "_probeCount"
            },
            "callTime": {
                "name": "Call time",
                "type": "lastCall",
                "field": "_log.steps.time"
            },
            "expire": {
                "name": "Expire",
                "type": "time",
                "field": "expire"
            },
            "attempt_cause": {
                "name": "Attempt end cause",
                "field": "attempt_cause",
                filter: {
                    "allProbe": true
                }
            },
            "attempt_agent": {
                "name": "Agent",
                "field": "attempt_agent",
                filter: {
                    "allProbe": true
                }
            },
            "attempt_amd_result": {
                "name": "AMD result",
                "field": "attempt_amd_result",
                filter: {
                    "allProbe": true
                }
            }
        };
        
        $scope.up = function (row) {
            moveUp($scope.settings.data, row)
        };
        
        $scope.down = function (row) {
            moveDown($scope.settings.data, row)
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        
        $scope.ok = function () {
            var fields = [];
            angular.forEach($scope.settings.data, function (i) {
                var s = ExportColumns[i.field];
                if (s) {
                    i.name = s.name;
                    if (s.type == 'variable') {
                        fields.push('variables.' + i.value);
                        i.route = 'variables.' + i.value;
                        i.name += ' ' +  i.value;
                    } else if (s.type == 'communications') {
                        i.route = 'communications.' + s.position + '.' + s.field;
                        if (!~fields.indexOf('communications'))
                            fields.push('communications');
                    } else {
                        if (!~fields.indexOf(s.field))
                            fields.push(s.field);
                        i.route = s.field;
                    }
                }
            });
            $scope.settings.fields = fields;
            $modalInstance.close($scope.settings, 5000);
        }

    }]);
    
    app.controller('MemberDialerPageCtrl', ['$scope', '$modalInstance', 'notifi', 'DialerModel', 'options', 'fileModel',
    function ($scope, $modalInstance, notifi, DialerModel, options, fileModel) {

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

        $scope.viewMode = options.viewMode;
        
        $scope.addCommunication = function (member) {
            $scope.inserted = {
                number: ''
            };
            member.communications.push($scope.inserted);
        };
        $scope.removeCommunication = function (index) {
            $scope.member.communications.splice(index, 1);
        };

        $scope.setSource = null;

        $scope.communicationTypes = options.communications;

        $scope.displayCommunicationType = function (code, codes) {
            if (!code) return '-';

            if (angular.isArray(codes)) {
                for (var i = 0; i < codes.length; i++)
                    if (codes[i].code === code)
                        return codes[i].name
            }

            return 'error type: ' + code
        }

        $scope.checkCommunicationNumber = function (number) {
            if (!number)
                return 'Number is required'
        };

        $scope.TimeZones = utils.timeZones;

        $scope.timeToString = timeToString;

        $scope.showJsonPreview = function(id) {
            fileModel.getJsonObject(id, function(err, res) {


                var jsonData = JSON.stringify(res);

                var jsonWindow = window.open("", id, "width=800, height=600");

                if (jsonWindow) {

                    // додаємо розмітку у вікно для перегляду json обєкта і кнопки для скачування
                    jsonWindow.document.write(
                        '<button id="save-cdrJSON" style="position: fixed; right: 0; z-index: 1;">Save</button>' +
                        '<div id="cdr-jsonViewver"></div>' +
                        '<style type="text/css">' +
                        'body { margin: 0; padding: 0; background: #e7ebee; }' +
                        '</style>'
                    );

                    $('#cdr-jsonViewver', jsonWindow.document).JSONView(JSON.parse(jsonData, {collapsed: false}));

                    $('#save-cdrJSON', jsonWindow.document).off("click");
                    $('#save-cdrJSON', jsonWindow.document).on("click", function () {

                        var textFileAsBlob = new Blob([jsonData], {type: 'application/json'}),
                            downloadLink = document.createElement("a");

                        downloadLink.download = $scope.currentRowId.slice(2) + ".json";
                        downloadLink.innerHTML = "Download File";

                        if (window.webkitURL !== null) {
                            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                        }
                        else {
                            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                            downloadLink.onclick = destroyClickedElement;
                            downloadLink.style.display = "none";
                            document.body.appendChild(downloadLink);
                        }
                        downloadLink.click();
                    });
                }
                else {
                    notify.warning("Please, allow popup window!", 5000);
                    return;
                }
            })
        };

        $scope.play = play;

        function play(log) {
            var uri = fileModel.getUri(log.callUUID, null, log.steps[0].time, "mp3");
            options.setSource({
                src: uri,
                type: 'audio/mpeg',
                text: log.session
            }, true);
        }

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
        
        $scope.openDate = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.dateOpenedControl = true;
        };
        
        $scope.changeDate = function () {
            $scope.member.expire = $scope.member._expire ? $scope.member._expire.getTime() : null;
        };
    }]);
    
    app.controller('StatsDialerCtrl', ['$scope', 'DialerModel', 'AgentModel', 'notifi', 'webitel', '$routeParams', '$interval', '$timeout',
        function ($scope, DialerModel, AgentModel, notifi, webitel, $routeParams, $interval, $timeout) {

            var aggCause = [
                {
                    $group: {
                        _id: '$_endCause',
                        count: {
                            $sum: 1
                        }
                    }
                }
            ];

            var dialerStates = [
                "Idle",
                "Work",
                "Sleep",
                "Process stop",
                "End"
            ];

            $scope.domain = $routeParams.domain;
            $scope.id = $routeParams.id;

            var timerId = null;
            
            function reload() {
                DialerModel.item($scope.id, $scope.domain, function(err, item) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.dialer = item;
                    $scope.dialerStateStr = dialerStates[item.state];
                    reloadCause();
                    setStats($scope.dialer.stats);
                    loadResources($scope.dialer.resources, $scope.dialer.stats);
                    loadAgents($scope.dialer.domain, $scope.dialer.agents, $scope.dialer.skills);

                    if (!timerId)
                        timerId = $interval(reload, 10000);
                });
            }

            reload();

            $scope.onSelectTabGeneral = function () {
                $timeout(function(){
                    window.dispatchEvent(new Event('resize'));
                }, 0);
            };

            $scope.reload = reload;
            $scope.resources = [];
            function loadResources(resources, stats) {
                var usedResources = (stats && stats.resource) || {};
                if (angular.isArray(resources)) {
                    for (var i = 0; i < resources.length; i++) {
                        if (angular.isArray(resources[i].destinations)) {
                            var destinations = resources[i].destinations;
                            for (var j = 0; j < destinations.length; j++) {
                                if (usedResources.hasOwnProperty(destinations[j].uuid)) {
                                    destinations[j].usedPercent = (usedResources[destinations[j].uuid] * 100) / destinations[j].limit;
                                    destinations[j].usedCount = usedResources[destinations[j].uuid];

                                    if (destinations[j].usedPercent < 50) {
                                        destinations[j].class = 'progress-bar-success'
                                    } else if (destinations[j].usedPercent < 75) {
                                        destinations[j].class = 'progress-bar-warning'
                                    } else {
                                        destinations[j].class = 'progress-bar-danger'
                                    }
                                }
                            }
                        }
                    }
                    $scope.resources = resources;
                }
            }

            $scope.sumAgentsStates = {
                "LOGGED-OUT": 0,
                "WAITING": 0,
                "CALL": 0,
                "ON-BREAK": 0
            };

            function loadAgents(domain, agents, skills) {
                var $or = [];

                function joinDomain (agent) {
                    return agent + '@' + domain
                }

                if (angular.isArray(agents))
                    $or.push({'agentId': {$in: agents.map(joinDomain)}});

                if (angular.isArray(skills))
                    $or.push({skills: {$in: skills}});

                AgentModel.list(domain, {$or: $or}, {}, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    $scope.sumAgentsStates = {
                        "LOGGED-OUT": 0,
                        "WAITING": 0,
                        "CALL": 0,
                        "ON-BREAK": 0
                    };

                    $scope.agents = res.map(function (item) {
                        var stateName = getAgentSummaryState(item.state, item.status);
                        $scope.sumAgentsStates[stateName]++;
                        return {
                            id: item.agentId,
                            number: item.agentId.split('@')[0],
                            state: item.state,
                            status: item.status,
                            stateName: stateName,
                            class: getAgentClass(item.state, item.status),
                            dialer: getAgentDilerInfo($scope.id, item)
                        }
                    });
                })
            }

            function getAgentDilerInfo(dialerId, agent) {
                if (angular.isArray(agent.dialer)) {
                    for (var i = 0; i < agent.dialer.length; i++) {
                        if (agent.dialer[i]._id === dialerId) {
                            if (agent.dialer[i].lastBridgeCallTimeStart)
                                agent.dialer[i]._lastBridgeCallTimeStart = new Date(agent.dialer[i].lastBridgeCallTimeStart).toLocaleTimeString();
                            return agent.dialer[i];
                        }
                    }
                }
                return {}
            }

            function getAgentClass(state, status) {
                if (state === 'Waiting' && (status === 'Available' || status === 'Available (On Demand)')) {
                    return 'bg-success'
                } else if (status === 'Logged Out') {
                    return 'bg-gray'
                } else if (state === 'Idle' || state === 'Reserved') {
                    return 'bg-danger'
                } else {
                    return 'bg-warning'
                }
            };;
            $scope.getAgentClass = getAgentClass;

            function getAgentSummaryState (state, status) {
                if (state === 'Waiting' && (status === 'Available' || status === 'Available (On Demand)')) {
                    return 'WAITING'
                } else if (status === 'Logged Out') {
                    return 'LOGGED-OUT'
                } else if (state === 'Idle' || state === 'Reserved') {
                    return 'CALL'
                } else {
                    return 'ON-BREAK'
                }
            }

            function fnOnUserStatusChange(e) {
                var agent = findAgent(e['CC-Agent']);
                if (agent) {
                    agent.status = e['CC-Agent-Status'];
                    agent.stateName = getAgentSummaryState(agent.state, agent.status);

                    //agent.class = getAgentClass(agent.state, agent.status);
                }
            }

            function fnOnUserStateChange(e) {
                var agent = findAgent(e['CC-Agent']);
                if (agent) {
                    agent.state = e['CC-Agent-State'];
                    agent.stateName = getAgentSummaryState(agent.state, agent.status);

                   // $('#agent-' + agent.id).
                   // agent.class = getAgentClass(agent.state, agent.status);
                }
            }


            
            function findAgent(id) {
                var agents = $scope.agents;
                if (angular.isArray(agents)) {
                    for (var i = 0; i < agents.length; i++ ) {
                        if (agents[i].id === id) {
                            return agents[i];
                        }
                    }
                }
            }

            var interval = setInterval(function () {
                $scope.$apply();
            }, 500);

            $scope.$on('$destroy', function () {
                if (timerId) {
                    console.error('DESTROY TIMER');
                    $interval.cancel(timerId);
                }

                clearInterval(interval);
                unSubscribeGridEvents();
            });

            webitel.connection.instance.onServerEvent("CC::AGENT-STATE-CHANGE", fnOnUserStateChange,  {all: true});
            webitel.connection.instance.onServerEvent("CC::AGENT-STATUS-CHANGE", fnOnUserStatusChange,  {all: true});
            
            function unSubscribeGridEvents() {
                webitel.connection.instance.unServerEvent('CC::AGENT-STATE-CHANGE', {all: true}, fnOnUserStateChange);
                webitel.connection.instance.unServerEvent('CC::AGENT-STATUS-CHANGE', {all: true}, fnOnUserStatusChange);
            }

            function setStats(stats) {

                $scope.activeCalls = (stats && stats.active) || 0;
                $scope.connectRate = ((stats && stats.callCount) / (stats && stats.bridgedCall)) || 0;
                $scope.abandoned = ((stats.predictAbandoned * 100) / stats.callCount) || 0;
                $scope.attempts = (stats.callCount || 0);
                $scope.lastProcessOnDate = null;
                $scope.lastProcessOnTime = null;
                $scope.processState = null;
                if (stats.readyOn) {
                    var date = new Date(stats.readyOn);
                    $scope.lastProcessOnDate = date.toLocaleDateString();
                    $scope.lastProcessOnTime = date.toLocaleTimeString();
                    $scope.processState = 1;
                } else if (stats.stopOn) {
                    var date = new Date(stats.stopOn);
                    $scope.lastProcessOnDate = date.toLocaleDateString();
                    $scope.lastProcessOnTime = date.toLocaleTimeString();
                }

                if (stats.amd) {
                    var data = [];
                    for (var key in stats.amd) {
                        data.push({
                            key: key,
                            y: stats.amd[key]
                        })
                    }
                    $scope.amdState = {
                        data: data,
                        options: {
                            chart: {
                                type: 'pieChart',
                                margin: {
                                    top: 40,
                                    right: 0,
                                    bottom: 0,
                                    left: 0
                                },
                                tooltip: {
                                    enabled: true,
                                    valueFormatter: function (d) {
                                        return d3.format(',f')(d)
                                    }
                                },

                                height: 350,
                                x: function(d){
                                    return d.key;
                                },
                                y: function(d){
                                    return d.y;
                                },
                                title: "AMD",
                                showLabels: true,
                                showLegend: false,
                                //  donutRatio: 0.3,
                                donut: true,
                                // transitionDuration: 500,
                                // labelThreshold: 0.02,
                                // legendPosition: "right"
                            },
                            data: [] // {key, y}
                        }
                    };
                }
            }

            function reloadCause() {
                if (!$scope.id || !$scope.domain)
                    return notifi.error(new Error("Bad parameters (id, domain is required)."));

                // DialerModel.members.aggregate(domain, id, aggCountLock, function (err, res) {
                //     if (err)
                //         return notifi.error(err);
                //     var calls = 0;
                //     if (res && res[0])
                //         calls = res[0].count;
                //
                //
                //     $scope.chartActiveCall = {
                //         type: "Gauge",
                //         options: {
                //             'height':'300',
                //             'width':'100%',
                //             max: maxCall,
                //             min: 0,
                //
                //             redFrom: 0,
                //             redTo: Math.ceil(maxCall * 75 / 100),
                //             yellowFrom: Math.ceil(maxCall * 75 / 100),
                //             yellowTo: Math.ceil(maxCall * 90 / 100),
                //             greenFrom: Math.ceil(maxCall * 90 / 100),
                //             greenTo: maxCall,
                //             minorTicks: 5
                //         },
                //         data: [
                //             ['Label', 'Value'],
                //             ['Members', calls]
                //         ]
                //     }
                // });

                DialerModel.members.aggregate($scope.domain, $scope.id, aggCause, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    var rows = [];
                    var waiting = 0;
                    var end = 0;
                    angular.forEach(res, function (item) {

                        if (!item._id) {
                            // rows.push({
                            //     label: "WAITING",
                            //     value: item.count
                            // });
                            waiting = item.count;
                        } else {
                            rows.push({
                                label: item._id,
                                value: item.count
                            });
                            end += item.count;
                        }

                    });

                    $scope.causeCartComplete = {
                        data: [
                            {
                                key: "waiting",
                                y: waiting
                            },
                            {
                                key: "completed",
                                y: end
                            }
                        ],
                        options: {
                            chart: {
                                type: 'pieChart',
                                margin: {
                                    top: 40,
                                    right: 0,
                                    bottom: 0,
                                    left: 0
                                },
                                tooltip: {
                                    enabled: true,
                                    valueFormatter: function (d) {
                                        return d3.format(',f')(d)
                                    }
                                },

                                height: 350,
                                x: function(d){
                                    return d.key;
                                },
                                y: function(d){
                                    return d.y;
                                },
                                title: "Completed " + ((end * 100) / (end + waiting) ).toFixed(2) + ' %',
                                showLabels: false,
                                showLegend: false,
                              //  donutRatio: 0.3,
                                donut: true
                                // transitionDuration: 500,
                                // labelThreshold: 0.02,
                                // legendPosition: "right"
                            },
                            data: [] // {key, y}
                        }
                    };

                    $scope.causeCart = {
                        data: [{
                            key: "End cause",
                            values: rows
                        }],
                        options: {
                            chart: {
                                type: 'discreteBarChart',
                                height: 480,
                                margin : {
                                    top: 20,
                                    right: 20,
                                    bottom: 50,
                                    left: 70
                                },
                                x: function(d){return d.label;},
                                y: function(d){return d.value;},
                                showValues: true,
                                valueFormat: function(d){
                                    return d3.format(',d')(d);
                                },

                                duration: 500,
                                xAxis: {
                                    axisLabel: 'Cause'
                                },
                                yAxis: {
                                    axisLabel: 'Count',
                                    axisLabelDistance: 0,
                                    tickFormat: function(d){
                                        return d3.format(',d')(d);
                                    }
                                }
                            }
                        }
                    };
                });
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

    app.filter('cdrExportColumns', function ($filter) {
        return function (items, m) {
            var res = {};
            angular.forEach(items, function (v, k) {
                if (v.hasOwnProperty('filter')) {
                    for (var key in v.filter) {
                        if (m.hasOwnProperty(key) && m[key] === v.filter[key]) {
                            res[k] = v;
                        }
                    }
                } else {
                    res[k] = v;
                }
            });
            return res;
        }
    })
});
