// https://github.com/Gillardo/bootstrap-ui-datetime-picker
// Version: 2.2.3
// Released: 2016-03-11


angular.module('ui.bootstrap.dateparser11', [])

    .service('uibDateParser', ['$log', '$locale', 'orderByFilter', function($log, $locale, orderByFilter) {
        // Pulled from https://github.com/mbostock/d3/blob/master/src/format/requote.js
        var SPECIAL_CHARACTERS_REGEXP = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

        var localeId;
        var formatCodeToRegex;

        this.init = function() {
            localeId = $locale.id;

            this.parsers = {};

            formatCodeToRegex = [
                {
                    key: 'yyyy',
                    regex: '\\d{4}',
                    apply: function(value) { this.year = +value; }
                },
                {
                    key: 'yy',
                    regex: '\\d{2}',
                    apply: function(value) { this.year = +value + 2000; }
                },
                {
                    key: 'y',
                    regex: '\\d{1,4}',
                    apply: function(value) { this.year = +value; }
                },
                {
                    key: 'M!',
                    regex: '0?[1-9]|1[0-2]',
                    apply: function(value) { this.month = value - 1; }
                },
                {
                    key: 'MMMM',
                    regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
                    apply: function(value) { this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value); }
                },
                {
                    key: 'MMM',
                    regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
                    apply: function(value) { this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value); }
                },
                {
                    key: 'MM',
                    regex: '0[1-9]|1[0-2]',
                    apply: function(value) { this.month = value - 1; }
                },
                {
                    key: 'M',
                    regex: '[1-9]|1[0-2]',
                    apply: function(value) { this.month = value - 1; }
                },
                {
                    key: 'd!',
                    regex: '[0-2]?[0-9]{1}|3[0-1]{1}',
                    apply: function(value) { this.date = +value; }
                },
                {
                    key: 'dd',
                    regex: '[0-2][0-9]{1}|3[0-1]{1}',
                    apply: function(value) { this.date = +value; }
                },
                {
                    key: 'd',
                    regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
                    apply: function(value) { this.date = +value; }
                },
                {
                    key: 'EEEE',
                    regex: $locale.DATETIME_FORMATS.DAY.join('|')
                },
                {
                    key: 'EEE',
                    regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|')
                },
                {
                    key: 'HH',
                    regex: '(?:0|1)[0-9]|2[0-3]',
                    apply: function(value) { this.hours = +value; }
                },
                {
                    key: 'hh',
                    regex: '0[0-9]|1[0-2]',
                    apply: function(value) { this.hours = +value; }
                },
                {
                    key: 'H',
                    regex: '1?[0-9]|2[0-3]',
                    apply: function(value) { this.hours = +value; }
                },
                {
                    key: 'h',
                    regex: '[0-9]|1[0-2]',
                    apply: function(value) { this.hours = +value; }
                },
                {
                    key: 'mm',
                    regex: '[0-5][0-9]',
                    apply: function(value) { this.minutes = +value; }
                },
                {
                    key: 'm',
                    regex: '[0-9]|[1-5][0-9]',
                    apply: function(value) { this.minutes = +value; }
                },
                {
                    key: 'sss',
                    regex: '[0-9][0-9][0-9]',
                    apply: function(value) { this.milliseconds = +value; }
                },
                {
                    key: 'ss',
                    regex: '[0-5][0-9]',
                    apply: function(value) { this.seconds = +value; }
                },
                {
                    key: 's',
                    regex: '[0-9]|[1-5][0-9]',
                    apply: function(value) { this.seconds = +value; }
                },
                {
                    key: 'a',
                    regex: $locale.DATETIME_FORMATS.AMPMS.join('|'),
                    apply: function(value) {
                        if (this.hours === 12) {
                            this.hours = 0;
                        }

                        if (value === 'PM') {
                            this.hours += 12;
                        }
                    }
                },
                {
                    key: 'Z',
                    regex: '[+-]\\d{4}',
                    apply: function(value) {
                        var matches = value.match(/([+-])(\d{2})(\d{2})/),
                            sign = matches[1],
                            hours = matches[2],
                            minutes = matches[3];
                        this.hours += toInt(sign + hours);
                        this.minutes += toInt(sign + minutes);
                    }
                },
                {
                    key: 'ww',
                    regex: '[0-4][0-9]|5[0-3]'
                },
                {
                    key: 'w',
                    regex: '[0-9]|[1-4][0-9]|5[0-3]'
                }
            ];
        };

        this.init();

        function createParser(format) {
            var map = [], regex = format.split('');

            // check for literal values
            var quoteIndex = format.indexOf('\'');
            if (quoteIndex > -1) {
                var inLiteral = false;
                format = format.split('');
                for (var i = quoteIndex; i < format.length; i++) {
                    if (inLiteral) {
                        if (format[i] === '\'') {
                            if (i + 1 < format.length && format[i+1] === '\'') { // escaped single quote
                                format[i+1] = '$';
                                regex[i+1] = '';
                            } else { // end of literal
                                regex[i] = '';
                                inLiteral = false;
                            }
                        }
                        format[i] = '$';
                    } else {
                        if (format[i] === '\'') { // start of literal
                            format[i] = '$';
                            regex[i] = '';
                            inLiteral = true;
                        }
                    }
                }

                format = format.join('');
            }

            angular.forEach(formatCodeToRegex, function(data) {
                var index = format.indexOf(data.key);

                if (index > -1) {
                    format = format.split('');

                    regex[index] = '(' + data.regex + ')';
                    format[index] = '$'; // Custom symbol to define consumed part of format
                    for (var i = index + 1, n = index + data.key.length; i < n; i++) {
                        regex[i] = '';
                        format[i] = '$';
                    }
                    format = format.join('');

                    map.push({
                        index: index,
                        apply: data.apply,
                        matcher: data.regex
                    });
                }
            });

            return {
                regex: new RegExp('^' + regex.join('') + '$'),
                map: orderByFilter(map, 'index')
            };
        }

        this.parse = function(input, format, baseDate) {
            if (!angular.isString(input) || !format) {
                return input;
            }

            format = $locale.DATETIME_FORMATS[format] || format;
            format = format.replace(SPECIAL_CHARACTERS_REGEXP, '\\$&');

            if ($locale.id !== localeId) {
                this.init();
            }

            if (!this.parsers[format]) {
                this.parsers[format] = createParser(format);
            }

            var parser = this.parsers[format],
                regex = parser.regex,
                map = parser.map,
                results = input.match(regex),
                tzOffset = false;
            if (results && results.length) {
                var fields, dt;
                if (angular.isDate(baseDate) && !isNaN(baseDate.getTime())) {
                    fields = {
                        year: baseDate.getFullYear(),
                        month: baseDate.getMonth(),
                        date: baseDate.getDate(),
                        hours: baseDate.getHours(),
                        minutes: baseDate.getMinutes(),
                        seconds: baseDate.getSeconds(),
                        milliseconds: baseDate.getMilliseconds()
                    };
                } else {
                    if (baseDate) {
                        $log.warn('dateparser:', 'baseDate is not a valid date');
                    }
                    fields = { year: 1900, month: 0, date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
                }

                for (var i = 1, n = results.length; i < n; i++) {
                    var mapper = map[i - 1];
                    if (mapper.matcher === 'Z') {
                        tzOffset = true;
                    }

                    if (mapper.apply) {
                        mapper.apply.call(fields, results[i]);
                    }
                }

                var datesetter = tzOffset ? Date.prototype.setUTCFullYear :
                    Date.prototype.setFullYear;
                var timesetter = tzOffset ? Date.prototype.setUTCHours :
                    Date.prototype.setHours;

                if (isValid(fields.year, fields.month, fields.date)) {
                    if (angular.isDate(baseDate) && !isNaN(baseDate.getTime()) && !tzOffset) {
                        dt = new Date(baseDate);
                        datesetter.call(dt, fields.year, fields.month, fields.date);
                        timesetter.call(dt, fields.hours, fields.minutes,
                            fields.seconds, fields.milliseconds);
                    } else {
                        dt = new Date(0);
                        datesetter.call(dt, fields.year, fields.month, fields.date);
                        timesetter.call(dt, fields.hours || 0, fields.minutes || 0,
                            fields.seconds || 0, fields.milliseconds || 0);
                    }
                }

                return dt;
            }
        };

        // Check if date is valid for specific month (and year for February).
        // Month: 0 = Jan, 1 = Feb, etc
        function isValid(year, month, date) {
            if (date < 1) {
                return false;
            }

            if (month === 1 && date > 28) {
                return date === 29 && (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0);
            }

            if (month === 3 || month === 5 || month === 8 || month === 10) {
                return date < 31;
            }

            return true;
        }

        function toInt(str) {
            return parseInt(str, 10);
        }

        this.toTimezone = toTimezone;
        this.fromTimezone = fromTimezone;
        this.timezoneToOffset = timezoneToOffset;
        this.addDateMinutes = addDateMinutes;
        this.convertTimezoneToLocal = convertTimezoneToLocal;

        function toTimezone(date, timezone) {
            return date && timezone ? convertTimezoneToLocal(date, timezone) : date;
        }

        function fromTimezone(date, timezone) {
            return date && timezone ? convertTimezoneToLocal(date, timezone, true) : date;
        }

        //https://github.com/angular/angular.js/blob/4daafd3dbe6a80d578f5a31df1bb99c77559543e/src/Angular.js#L1207
        function timezoneToOffset(timezone, fallback) {
            var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
            return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
        }

        function addDateMinutes(date, minutes) {
            date = new Date(date.getTime());
            date.setMinutes(date.getMinutes() + minutes);
            return date;
        }

        function convertTimezoneToLocal(date, timezone, reverse) {
            reverse = reverse ? -1 : 1;
            var timezoneOffset = timezoneToOffset(timezone, date.getTimezoneOffset());
            return addDateMinutes(date, reverse * (timezoneOffset - date.getTimezoneOffset()));
        }
    }]);


angular.module('ui.bootstrap.datetimepicker', ['ui.bootstrap.dateparser11', 'ui.bootstrap.position'])
    .constant('uiDatetimePickerConfig', {
        dateFormat: 'yyyy-MM-dd HH:mm',
        defaultTime: '00:00:00',
        html5Types: {
            date: 'yyyy-MM-dd',
            'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
            'month': 'yyyy-MM'
        },
        initialPicker: 'date',
        reOpenDefault: false,
        enableDate: true,
        enableTime: true,
        buttonBar: {
            show: true,
            now: {
                show: true,
                text: 'Now'
            },
            today: {
                show: true,
                text: 'Today'
            },
            clear: {
                show: true,
                text: 'Clear'
            },
            date: {
                show: true,
                text: 'Date'
            },
            time: {
                show: true,
                text: 'Time'
            },
            close: {
                show: true,
                text: 'Close'
            }
        },
        closeOnDateSelection: true,
        appendToBody: false,
        altInputFormats: [],
        ngModelOptions: { }
    })
    .controller('DateTimePickerController', ['$scope', '$element', '$attrs', '$compile', '$parse', '$document', '$timeout', '$position', 'dateFilter', 'uibDateParser', 'uiDatetimePickerConfig', '$rootScope',
        function (scope, element, attrs, $compile, $parse, $document, $timeout, $uibPosition, dateFilter, uibDateParser, uiDatetimePickerConfig, $rootScope) {
            var dateFormat = uiDatetimePickerConfig.dateFormat,
                ngModel, ngModelOptions, $popup, cache = {}, watchListeners = [],
                closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : uiDatetimePickerConfig.closeOnDateSelection,
                appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : uiDatetimePickerConfig.appendToBody,
                altInputFormats = angular.isDefined(attrs.altInputFormats) ? scope.$parent.$eval(attrs.altInputFormats) : uiDatetimePickerConfig.altInputFormats;



            this.init = function(_ngModel) {
                ngModel = _ngModel;
                ngModelOptions = ngModel.$options || uiDatetimePickerConfig.ngModelOptions;

                scope.watchData = {};
                scope.buttonBar = angular.isDefined(attrs.buttonBar) ? scope.$parent.$eval(attrs.buttonBar) : uiDatetimePickerConfig.buttonBar;

                // determine which pickers should be available. Defaults to date and time
                scope.enableDate = angular.isDefined(scope.enableDate) ? scope.enableDate : uiDatetimePickerConfig.enableDate;
                scope.enableTime = angular.isDefined(scope.enableTime) ? scope.enableTime : uiDatetimePickerConfig.enableTime;

                // determine default picker
                scope.initialPicker = angular.isDefined(attrs.initialPicker) ? attrs.initialPicker : (scope.enableDate ? uiDatetimePickerConfig.initialPicker : 'time');

                // determine the picker to open when control is re-opened
                scope.reOpenDefault = angular.isDefined(attrs.reOpenDefault) ? attrs.reOpenDefault : uiDatetimePickerConfig.reOpenDefault;

                // check if an illegal combination of options exists
                if (scope.initialPicker == 'date' && !scope.enableDate) {
                    throw new Error("datetimePicker can't have initialPicker set to date and have enableDate set to false.");
                }

                // default picker view
                scope.showPicker = !scope.enableDate ? 'time' : scope.initialPicker;

                var isHtml5DateInput = false;

                if (uiDatetimePickerConfig.html5Types[attrs.type]) {
                    dateFormat = uiDatetimePickerConfig.html5Types[attrs.type];
                    isHtml5DateInput = true;
                } else {
                    dateFormat = attrs.datepickerPopup || uiDatetimePickerConfig.dateFormat;
                    attrs.$observe('datetimePicker', function(value) {
                        var newDateFormat = value || uiDatetimePickerConfig.dateFormat;

                        if (newDateFormat !== dateFormat) {
                            dateFormat = newDateFormat;
                            ngModel.$modelValue = null;

                            if (!dateFormat) {
                                throw new Error('datetimePicker must have a date format specified.');
                            }
                        }
                    });
                }

                // popup element used to display calendar
                var popupEl = angular.element('' +
                    '<div date-picker-wrap>' +
                    '<div datepicker></div>' +
                    '</div>' +
                    '<div time-picker-wrap>' +
                    '<div timepicker style="margin:0 auto"></div>' +
                    '</div>');

                scope.ngModelOptions = angular.copy(ngModelOptions);
                scope.ngModelOptions.timezone = null;

                // get attributes from directive
                popupEl.attr({
                    'ng-model': 'date',
                    'ng-model-options': 'ngModelOptions',
                    'ng-change': 'dateSelection(date)'
                });

                // datepicker element
                var datepickerEl = angular.element(popupEl.children()[0]);

                if (isHtml5DateInput) {
                    if (attrs.type === 'month') {
                        datepickerEl.attr('datepicker-mode', '"month"');
                        datepickerEl.attr('min-mode', 'month');
                    }
                }

                if (attrs.datepickerOptions) {
                    var options = scope.$parent.$eval(attrs.datepickerOptions);

                    if (options && options.initDate) {
                        scope.initDate = options.initDate; //uibDateParser.fromTimezone(options.initDate, ngModelOptions.timezone);
                        datepickerEl.attr('init-date', 'initDate');
                        delete options.initDate;
                    }

                    angular.forEach(options, function (value, option) {
                        datepickerEl.attr(cameltoDash(option), value);
                    });
                }

                // set datepickerMode to day by default as need to create watch
                // else disabled cannot pass in mode
                if (!angular.isDefined(attrs['datepickerMode'])) {
                    attrs['datepickerMode'] = 'day';
                }

                if (attrs.dateDisabled) {
                    datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
                }

                angular.forEach(['formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle', 'showWeeks', 'startingDay', 'yearRows', 'yearColumns'], function(key) {
                    if (angular.isDefined(attrs[key])) {
                        datepickerEl.attr(cameltoDash(key), attrs[key]);
                    }
                });

                if (attrs.customClass) {
                    datepickerEl.attr('custom-class', 'customClass({ date: date, mode: mode })');
                }

                angular.forEach(['minMode', 'maxMode', 'datepickerMode', 'shortcutPropagation'], function(key) {
                    if (attrs[key]) {
                        var getAttribute = $parse(attrs[key]);

                        watchListeners.push(scope.$parent.$watch(getAttribute, function(value) {
                            scope.watchData[key] = value;
                        }));
                        datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                        // Propagate changes from datepicker to outside
                        if (key === 'datepickerMode') {
                            var setAttribute = getAttribute.assign;
                            watchListeners.push(scope.$watch('watchData.' + key, function(value, oldvalue) {
                                if (angular.isFunction(setAttribute) && value !== oldvalue) {
                                    setAttribute(scope.$parent, value);
                                }
                            }));
                        }
                    }
                });

                // timepicker element
                var timepickerEl = angular.element(popupEl.children()[1]);

                if (attrs.timepickerOptions) {
                    var options = scope.$parent.$eval(attrs.timepickerOptions);

                    angular.forEach(options, function (value, option) {
                        scope.watchData[option] = value;
                        timepickerEl.attr(cameltoDash(option), 'watchData.' + option);
                    });
                }

                // watch attrs - NOTE: minDate and maxDate are used with datePicker and timePicker.  By using the minDate and maxDate
                // with the timePicker, you can dynamically set the min and max time values.  This cannot be done using the min and max values
                // with the timePickerOptions
                angular.forEach(['minDate', 'maxDate', 'initDate'], function(key) {
                    if (attrs[key]) {
                        var getAttribute = $parse(attrs[key]);

                        watchListeners.push(scope.$parent.$watch(getAttribute, function(value) {
                            scope.watchData[key] = value;
                        }));
                        datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                        if (key == 'minDate') {
                            timepickerEl.attr('min', 'watchData.minDate');
                        } else if (key == 'maxDate')
                            timepickerEl.attr('max', 'watchData.maxDate');
                    }
                });

                // do not check showWeeks attr, as should be used via datePickerOptions

                if (!isHtml5DateInput) {
                    // Internal API to maintain the correct ng-invalid-[key] class
                    ngModel.$$parserName = 'datetime';
                    if (ngModel.$validators)
                        ngModel.$validators.datetime = validator;
                    ngModel.$parsers.unshift(parseDate);
                    ngModel.$formatters.push(function(value) {
                        if (ngModel.$isEmpty(value)) {
                            scope.date = value;
                            return value;
                        }
                        scope.date = value; //uibDateParser.fromTimezone(value, ngModelOptions.timezone);
                        dateFormat = dateFormat.replace(/M!/, 'MM')
                            .replace(/d!/, 'dd');

                        return dateFilter(scope.date, dateFormat);
                    });
                } else {
                    ngModel.$formatters.push(function(value) {
                        scope.date = value; //uibDateParser.fromTimezone(value, ngModelOptions.timezone);;
                        return value;
                    });
                }

                // Detect changes in the view from the text box
                ngModel.$viewChangeListeners.push(function() {
                    scope.date = parseDateString(ngModel.$viewValue);
                });

                element.bind('keydown', inputKeydownBind);

                $popup = $compile(popupEl)(scope);
                // Prevent jQuery cache memory leak (template is now redundant after linking)
                popupEl.remove();

                if (appendToBody) {
                    $document.find('body').append($popup);
                } else {
                    element.after($popup);
                }

            };

            // get text
            scope.getText = function (key) {
                return scope.buttonBar[key].text || uiDatetimePickerConfig.buttonBar[key].text;
            };

            // determine if button is to be shown or not
            scope.doShow = function(key) {
                if (angular.isDefined(scope.buttonBar[key].show))
                    return scope.buttonBar[key].show;
                else
                    return uiDatetimePickerConfig.buttonBar[key].show;
            };

            // Inner change
            scope.dateSelection = function (dt) {

                // check if timePicker is being shown and merge dates, so that the date
                // part is never changed, only the time
                if (scope.enableTime && scope.showPicker === 'time') {

                    // only proceed if dt is a date
                    if (dt || dt != null) {
                        // check if our scope.date is null, and if so, set to todays date
                        if (!angular.isDefined(scope.date) || scope.date == null) {
                            scope.date = new Date();
                        }

                        // dt will not be undefined if the now or today button is pressed
                        if (dt && dt != null) {
                            // get the existing date and update the time
                            var date = new Date(scope.date);
                            date.setHours(dt.getHours());
                            date.setMinutes(dt.getMinutes());
                            date.setSeconds(dt.getSeconds());
                            date.setMilliseconds(dt.getMilliseconds());
                            dt = date;
                        }
                    }
                }

                if (angular.isDefined(dt)) {
                    if (!scope.date) {
                        var defaultTime = angular.isDefined(attrs.defaultTime) ? attrs.defaultTime : uiDatetimePickerConfig.defaultTime;
                        var t = new Date('2001-01-01 ' + defaultTime);

                        if (!isNaN(t) && dt != null) {
                            dt.setHours(t.getHours());
                            dt.setMinutes(t.getMinutes());
                            dt.setSeconds(t.getSeconds());
                            dt.setMilliseconds(t.getMilliseconds());
                        }
                    }
                    scope.date = dt;
                }

                var date = scope.date ? dateFilter(scope.date, dateFormat, ngModelOptions.timezone) : null;

                element.val(date);
                ngModel.$setViewValue(date);

                if (closeOnDateSelection) {
                    // do not close when using timePicker as make impossible to choose a time
                    if (scope.showPicker != 'time' && date != null) {
                        // if time is enabled, swap to timePicker
                        if (scope.enableTime) {
                            scope.open('time');
                        } else {
                            scope.close(false);
                        }
                    }
                }

            };

            scope.keydown = function(evt) {
                if (evt.which === 27) {
                    scope.close(false);
                    element[0].focus();
                }
            };

            scope.$watch('isOpen', function (value) {
                scope.dropdownStyle = {
                    display: value ? 'block' : 'none'
                };

                if (value) {
                    cache['openDate'] = scope.date;

                    var position = appendToBody ? $uibPosition.offset(element) : $uibPosition.position(element);

                    if (appendToBody) {
                        scope.dropdownStyle.top = (position.top + element.prop('offsetHeight')) +'px';
                    } else {
                        scope.dropdownStyle.top = undefined;
                    }

                    scope.dropdownStyle.left = position.left + 'px';

                    $timeout(function() {
                        scope.$broadcast('uib:datepicker.focus');
                        $document.bind('click', documentClickBind);
                    }, 0, false);

                    scope.open(scope.showPicker);
                } else {
                    $document.unbind('click', documentClickBind);
                }
            });

            scope.isDisabled = function(date) {
                if (date === 'today' || date === 'now') {
                    date = new Date();
                }

                return scope.watchData.minDate && scope.compare(date, scope.watchData.minDate) < 0 ||
                    scope.watchData.maxDate && scope.compare(date, scope.watchData.maxDate) > 0;
            };

            scope.compare = function(date1, date2) {
                return new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
            };

            scope.select = function (opt) {

                var date = null;
                var isNow = opt === 'now';

                if (opt === 'today' || opt == 'now') {
                    var now = new Date();
                    if (angular.isDate(scope.date)) {
                        date = new Date(scope.date);
                        date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
                        date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                    } else {
                        date = now;
                    }
                }

                scope.dateSelection(date);

                if (opt == 'clear')
                    scope.close();
            };

            scope.open = function (picker, evt) {
                if (angular.isDefined(evt)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }

                // need to delay this, else timePicker never shown
                $timeout(function() {
                    scope.showPicker = picker;
                }, 0);

                // in order to update the timePicker, we need to update the model reference!
                // as found here https://angular-ui.github.io/bootstrap/#/timepicker
                $timeout(function() {
                    scope.date = new Date(scope.date);
                }, 50);
            };

            scope.close = function (closePressed) {
                scope.isOpen = false;

                // if enableDate and enableTime are true, reopen the picker in date mode first
                if (scope.enableDate && scope.enableTime)
                    scope.showPicker = scope.reOpenDefault === false ? 'date' : scope.reOpenDefault;

                // if a on-close-fn has been defined, lets call it
                // we only call this if closePressed is defined!
                if (angular.isDefined(closePressed))
                    scope.whenClosed({ args: {closePressed: closePressed, openDate: cache['openDate'] || null, closeDate: scope.date } });

                element[0].focus();
            };

            scope.$on('$destroy', function () {
                if (scope.isOpen === true) {
                    if (!$rootScope.$$phase) {
                        scope.$apply(function() {
                            scope.close();
                        });
                    }
                }

                watchListeners.forEach(function(a) { a(); });
                $popup.remove();
                element.unbind('keydown', inputKeydownBind);
                $document.unbind('click', documentClickBind);
            });

            function documentClickBind(evt) {
                var popup = $popup[0];
                var dpContainsTarget = element[0].contains(evt.target);

                // The popup node may not be an element node
                // In some browsers (IE only) element nodes have the 'contains' function
                var popupContainsTarget = popup.contains !== undefined && popup.contains(evt.target);

                if (scope.isOpen && !(dpContainsTarget || popupContainsTarget)) {
                    scope.$apply(function() {
                        scope.close(false);
                    });
                }
            }

            function inputKeydownBind (evt) {
                if (evt.which === 27 && scope.isOpen) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    scope.$apply(function() {
                        scope.close(false);
                    });
                    element[0].focus();
                } else if (evt.which === 40 && !scope.isOpen) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    scope.$apply(function() {
                        scope.isOpen = true;
                    });
                }
            }

            function cameltoDash(string) {
                return string.replace(/([A-Z])/g, function ($1) { return '-' + $1.toLowerCase(); });
            }

            function parseDateString(viewValue) {
                var date = uibDateParser.parse(viewValue, dateFormat, scope.date);
                if (isNaN(date)) {
                    for (var i = 0; i < altInputFormats.length; i++) {
                        date = uibDateParser.parse(viewValue, altInputFormats[i], scope.date);
                        if (!isNaN(date)) {
                            return date;
                        }
                    }
                }
                return date;
            }

            function parseDate(viewValue) {
                if (angular.isNumber(viewValue)) {
                    // presumably timestamp to date object
                    viewValue = new Date(viewValue);
                }

                if (!viewValue) {
                    return null;
                } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                    return viewValue;
                } else if (angular.isString(viewValue)) {
                    var date = parseDateString(viewValue);
                    if (!isNaN(date)) {
                        return uibDateParser.toTimezone(date, ngModelOptions.timezone);
                    }

                    return undefined;
                } else {
                    return undefined;
                }
            }

            function validator(modelValue, viewValue) {
                var value = modelValue || viewValue;

                if (!(attrs.ngRequired || attrs.required) && !value) {
                    return true;
                }

                if (angular.isNumber(value)) {
                    value = new Date(value);
                }

                if (!value) {
                    return true;
                } else if (angular.isDate(value) && !isNaN(value)) {
                    return true;
                } else if (angular.isDate(new Date(value)) && !isNaN(new Date(value).valueOf())) {
                    return true;
                } else if (angular.isString(value)) {
                    return !isNaN(parseDateString(viewValue));
                } else {
                    return false;
                }
            }

        }])
    .directive('datetimePicker', function () {
        return {
            restrict: 'A',
            require: ['ngModel', 'datetimePicker'],
            controller: 'DateTimePickerController',
            scope: {
                isOpen: '=?',
                enableDate: '=?',
                enableTime: '=?',
                initialPicker: '=?',
                reOpenDefault: '=?',
                dateDisabled: '&',
                customClass: '&',
                whenClosed: '&'
            },
            link: function (scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    ctrl = ctrls[1];

                ctrl.init(ngModel);
            }
        };
    })
    .directive('datePickerWrap', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'template/date-picker.html'
        };
    })

    .directive('timePickerWrap', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'template/time-picker.html'
        };
    });
angular.module('ui.bootstrap.datetimepicker').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('template/date-picker.html',
    "<ul class=\"dropdown-menu dropdown-menu-left datetime-picker-dropdown\" ng-if=\"isOpen && showPicker == 'date'\" ng-style=dropdownStyle style=left:inherit ng-keydown=keydown($event) ng-click=$event.stopPropagation()><li style=\"padding:0 5px 5px 5px\" class=date-picker-menu><div ng-transclude></div></li><li style=padding:5px ng-if=buttonBar.show><span class=\"btn-group pull-left\" style=margin-right:10px ng-if=\"doShow('today') || doShow('clear')\"><button type=button class=\"btn btn-sm btn-info\" ng-if=\"doShow('today')\" ng-click=\"select('today')\" ng-disabled=\"isDisabled('today')\">{{ getText('today') }}</button> <button type=button class=\"btn btn-sm btn-danger\" ng-if=\"doShow('clear')\" ng-click=\"select('clear')\">{{ getText('clear') }}</button></span> <span class=\"btn-group pull-right\" ng-if=\"(doShow('time') && enableTime) || doShow('close')\"><button type=button class=\"btn btn-sm btn-default\" ng-if=\"doShow('time') && enableTime\" ng-click=\"open('time', $event)\">{{ getText('time')}}</button> <button type=button class=\"btn btn-sm btn-success\" ng-if=\"doShow('close')\" ng-click=close(true)>{{ getText('close') }}</button></span></li></ul>"
  );


  $templateCache.put('template/time-picker.html',
    "<ul class=\"dropdown-menu dropdown-menu-left datetime-picker-dropdown\" ng-if=\"isOpen && showPicker == 'time'\" ng-style=dropdownStyle style=left:inherit ng-keydown=keydown($event) ng-click=$event.stopPropagation()><li style=\"padding:0 5px 5px 5px\" class=time-picker-menu><div ng-transclude></div></li><li style=padding:5px ng-if=buttonBar.show><span class=\"btn-group pull-left\" style=margin-right:10px ng-if=\"doShow('now') || doShow('clear')\"><button type=button class=\"btn btn-sm btn-info\" ng-if=\"doShow('now')\" ng-click=\"select('now')\" ng-disabled=\"isDisabled('now')\">{{ getText('now') }}</button> <button type=button class=\"btn btn-sm btn-danger\" ng-if=\"doShow('clear')\" ng-click=\"select('clear')\">{{ getText('clear') }}</button></span> <span class=\"btn-group pull-right\" ng-if=\"(doShow('date') && enableDate) || doShow('close')\"><button type=button class=\"btn btn-sm btn-default\" ng-if=\"doShow('date') && enableDate\" ng-click=\"open('date', $event)\">{{ getText('date')}}</button> <button type=button class=\"btn btn-sm btn-success\" ng-if=\"doShow('close')\" ng-click=close(true)>{{ getText('close') }}</button></span></li></ul>"
  );

}]);
