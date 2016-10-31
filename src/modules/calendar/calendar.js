define(['app', 'scripts/webitel/utils', 'moment', 'modules/calendar/calendarModel', 'css!modules/calendar/calendar.css'], function (app, utils, moment) {

    app.controller('CalendarCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CalendarModel', 'TableSearch', '$location', '$timeout',
        '$route', '$routeParams', '$confirm', '$filter',
        function ($scope, webitel, $rootScope, notifi, CalendarModel, TableSearch, $location, $timeout, $route, $routeParams, $confirm, $filter) {

            $scope.canDelete = webitel.connection.session.checkResource('calendar', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('calendar', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('calendar', 'c');

            $scope.domain = webitel.domain();

            $scope.timeZones = utils.timeZones;

            $scope.calendar = {};

            $scope.openedDateControl = null;

            $scope.newAccept = {
                "weekDay": '1',
                "startHour": '09',
                "startMinute": '00',
                "endHour": '17',
                "endMinute": '00'
            };

            $scope.mapDays = {
                1: "Monday",
                2: "Tuesday",
                3: "Wednesday",
                4: "Thursday",
                5: "Friday",
                6: "Saturday",
                7: "Sunday"
            };

            $scope.mapRepeat = {
                0: "Never",
                1: "Each year"
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            };

            $scope.query = TableSearch.get('calendar');

            $scope.isLoading = false;

            $scope.reloadData = reloadData;
            $scope.closePage = closePage;
            $scope.edit = edit;

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'calendar')
            });

            $scope.displayedCollection = [];

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

            $scope.$watch('calendar', function(newValue, oldValue) {
                if (!$scope.calendar._id)
                    return $scope.isEdit = $scope.isNew = true;
                $scope.isNew = false;
                return $scope.isEdit = !!oldValue._id;
            }, true);


            function closePage() {
                $location.path('/calendars');
            };

            function reloadData () {
                if ($location.$$path != '/calendars')
                    return 0;

                if (!$scope.domain)
                    return $scope.rowCollection = [];
                $scope.isLoading = true;
                CalendarModel.list($scope.domain, function (err, res) {
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
            
            function edit() {
                var id = $routeParams.id;
                var domain = $routeParams.domain;


                CalendarModel.item(domain, id, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    };
                    $scope.oldCalendar = angular.copy(item);
                    $scope.calendar = item;
                    disableEditMode();
                });
            };

            $scope.create  = function() {
                $scope.calendar = CalendarModel.create();
                var domain = $routeParams.domain;
                $scope.calendar.domain = domain;
            };

            $scope.cancel = function () {
                $scope.calendar = angular.copy($scope.oldCalendar);
                disableEditMode();
            };

            $scope.save = function() {

                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if (!$scope.calendar._id) {
                        return $location.path('/calendars/' + res + '/edit');
                    } else {
                        $scope.calendar.__time = Date.now();
                        return edit();
                    };
                };
                if (!$scope.calendar._id) {
                    CalendarModel.add($scope.calendar, cb);
                } else {
                    CalendarModel.update($scope.calendar._id, $scope.calendar, cb)
                }
            };

            $scope.removeItem = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name+ ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        CalendarModel.remove(row._id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData()
                        })
                    });
            };
            
            $scope.getNumber = function (num) {
                var arr = [];
                for (var i = 0; i < num; i++)
                    if (i < 10)
                        arr.push('0' + i);
                    else arr.push('' + i);
                return arr;
            };

            $scope.dateOpenedControl = {
                openedDateStart: false,
                openedDateEnd: false,
                openedHolidays: false
            };

            $scope.editRowWorkWeek = {};
            $scope.setEditWorkWeekRow = function (row, key) {
                var workStartTime = getHourAndMinuteFromTimeOfDay(row.startTime);
                var workEndTime = getHourAndMinuteFromTimeOfDay(row.endTime);
                $scope.editRowWorkWeek = {
                    "weekDay": row.weekDay,
                    "startHour": workStartTime.hour,
                    "startMinute": workStartTime.minute,
                    "endHour": workEndTime.hour,
                    "endMinute": workEndTime.minute
                };
                $scope.editRowWorkWeekKey = key
            };
            
            $scope.saveEditWorkWeekRow = function (r, key) {
                var row = validateAcceptDay($scope.editRowWorkWeek, r);
                if (!row) {
                    r._error = true;
                    $timeout(function () {
                        delete r._error;
                    }, 5000);
                    return;
                };
                var id = findIndexFromRows(r, $scope.calendar.accept);
                $scope.calendar.accept[id] = row;
                $scope.editRowWorkWeek = {};
                $scope.editRowWorkWeekKey = null;
            };
            $scope.editRowWorkWeekKey;

            $scope.openDate = function($event, attr) {
                angular.forEach($scope.dateOpenedControl, function (v, key) {
                    if (key !== attr)
                        $scope.dateOpenedControl[key] = false;
                });
                return $event.preventDefault(),
                    $event.stopPropagation(),
                    $scope.dateOpenedControl[attr] = !0
            };

            $scope.changeDate = function (name) {
                $scope.calendar[name] = $scope.calendar['_' +name] ? $scope.calendar['_' +name].getTime() : null;
            };

            function addZero (n) {
                return n < 10 ? '0' + n : '' + n;
            };

            $scope.minuteOfDayToString = function (time) {
                var hm = getHourAndMinuteFromTimeOfDay(time);
                return addZero(hm.hour) + ':' + addZero(hm.minute);
            };

            function getHourAndMinuteFromTimeOfDay (time) {
                return {
                    hour: Math.floor((time / 60) % 24),
                    minute: time % 60
                }
            };

            function between(x, min, max) {
                return x >= min && x <= max;
            };

            function validateAcceptDay (accept, current) {
                if (!accept || !angular.isNumber(+accept.weekDay) || !angular.isNumber(+accept.startHour) || !angular.isNumber(+accept.startMinute) ||
                    !angular.isNumber(+accept.endHour) || !angular.isNumber(+accept.endMinute))
                    return null;
                var startTime = (+accept.startHour * 60) + (+accept.startMinute);
                var endTime = (+accept.endHour * 60) + (+accept.endMinute);

                if (endTime <= startTime)
                    return null;

                var hours = $filter('filter')($scope.calendar.accept, {'weekDay': accept.weekDay});

                for (var i = 0, len = hours.length; i < len; i++)
                    if (current !== hours[i] && ( between(startTime, hours[i].startTime, hours[i].endTime) ||
                            between(endTime, hours[i].startTime, hours[i].endTime)))
                        return null;

                return {
                    "weekDay": +accept.weekDay,
                    "startTime": startTime,
                    "endTime": endTime
                }
            };
            
            $scope.removeRowByKey = function (row, schema) {
                var id = findIndexFromRows(row, $scope.calendar[schema]);
                return $scope.calendar[schema].splice(id, 1);
            };

            function findIndexFromRows (row, rows) {
                for (var i = 0, len = rows.length; i < len; i++)
                    if (rows[i] === row)
                        return i;

            }

            $scope.addAcceptDay = function (newAccept) {
                var accept = validateAcceptDay(newAccept);
                if (!accept) {
                    notifi.error('Bad hours', 2000);
                    $scope._hourError = true;
                    $timeout(function () {
                        $scope._hourError = false;
                    }, 2000);
                    return;
                };
                $scope.calendar.accept.push(accept);
            };

            $scope.getDateFromTimestamp = function (time) {
                if (!time) return "";

                return moment(time).format('DD.MM.YYYY');
            };

            $scope.addHoliday = function (holiday) {
                if (!holiday || !holiday.name || !holiday.date || !holiday.repeat)
                    return notifi.error(new Error("Bad holidays parameters."), 5000);

                $scope.calendar.except.push({
                    "name": holiday.name,
                    "date": holiday.date.getTime() - (holiday.date.getTimezoneOffset() * 60000),
                    "repeat": +holiday.repeat
                });
            };
            
            $scope.removeExcept = function (row) {
                var i = $scope.calendar.except.indexOf(row);
                if (~i)
                    $scope.calendar.except.splice(i, 1);
            }

            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                };
            }();

    }])
});
