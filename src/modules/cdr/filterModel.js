/**
 * Created by i.navrotskyj on 03.03.2016.
 */
define(["app", "jquery", "jquery-builder",
        "css!modules/cdr/css/query-builder-filter.css"], function(app) {


    app.directive('mongoCdrBuilder', function ($localStorage) {
        return {
            restrict: 'AE',
            scope: {
                filters: "=",
                onInit: '&'
            },
            controller: function ($scope, $compile) {
                var controller = $scope;

                var mapElem = {};

                controller.changeDate  = function (id, value, pos) {
                    //value = resetDate(value);
                    if (angular.isArray(mapElem[id].value)) {
                        if (controller[id + '_value_0'])
                            mapElem[id].value[0] = controller[id + '_value_0'].getTime() * 1000
                        else mapElem[id].value[0] = void 0;

                        if (controller[id + '_value_1'])
                            mapElem[id].value[1] = controller[id + '_value_1'].getTime() * 1000
                        else mapElem[id].value[1] = void 0;


                        return;
                        //return mapElem[id].value[parseInt(pos)] = _v;//+pos === 1 ? _v + 86399999000 :_v;
                    }
                    var _v = angular.isDate(value) ? value.getTime() * 1000 : 1;
                    return mapElem[id].value = _v;
                };
                
                controller.inputDate = function (elem, e) {
                    mapElem[elem.id] = elem;

                    elem.filter.valueSetter = function (rules, value) {
                        if (!value) return;
                        if (angular.isArray(value)) {
                            angular.forEach(value, function (val, key) {
                                controller[rules.id + '_value_' + key] = new Date(val / 1000)
                            });
                        } else {
                            controller[rules.id + '_value_0'] = new Date(value / 1000)
                        };
                    };
                    elem.filter.valueGetter = function (rules) {
                        return rules && rules.value
                    };
                    
                    //elem.filter.validation = {
                    //    callback: function () {
                    //        return true;
                    //    }
                    //};

                    var pos = parseInt(e.substring(e.length - 1));
                    //if (!elem.value)
                    //    elem.value = [];

                    //elem.value[pos] = controller[e] && controller[e].getTime() * 1000;
                    //controller[e] = null;

                    var html = '<p class="form-group input-group">' +
                        ' <input type="text" ' +
                        'ng-init="_o' + e + '=false" ' +
                        'class="form-control" ' +
                        'datetime-picker="dd.MM.yyyy HH:mm" ' +
                        //'datepicker-popup="dd.MM.yyyy" ' +
                        //'datepicker-options="{}" ' +
                        'ng-model="' + e + '" ' +
                        'ng-change="changeDate(\'' + elem.id + '\',' + e + ',\'' + e.substring(e.length - 1) + '\')" ' +
                        'ng-click="openDate($event, \'_o' + e + '\')" ' +
                        'is-open="_o' + e + '" ' +
                        ' > ' +
                        '<span class="input-group-addon" ng-click="openDate($event, \'_o' + e + '\')" ><i class="fa fa-calendar"></i></span> ' +
                        '</p>' ;

                    return $compile(html)(controller);
                };
                

                controller.openDate = function ($event, o) {
                    return $event.preventDefault(),
                        $event.stopPropagation(),
                        controller[o] = !0
                };
            },
            link: function (scope, elem, attrs, ctrl) {

                function getFilter() {
                    var _f = scope.queryBuilder.queryBuilder("getMongo");
                    if (Object.keys(_f).length > 0) {
                        $localStorage.cdrF = scope.queryBuilder.queryBuilder("getRules", { get_flags: true });
                    };
                    return _f;
                };

                function resetFilter () {
                    //scope.queryBuilder.queryBuilder("reset");
                    delete $localStorage.cdrF;
                    scope.queryBuilder.queryBuilder('setRules', getDefaultFilter());
                };

                var $API = {
                    getFilter: getFilter,
                    resetFilter: resetFilter,
                };

                var COLUMN_TYPES = {
                    "string": function (id, label, options) {
                        return {
                            id: id,
                            label: label,
                            type: 'string',
                            operators: ["equal", "not_equal", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"],
                        };
                    },
                    "select": function (id, label, options) {
                        var values = {};
                        if (options && angular.isArray(options.select))
                            angular.forEach(options.select, function (v) {
                                values[v] = v;
                            });

                        return {
                            id: id,
                            label: label,
                            type: 'string',
                            input: 'select',
                            values: values,
                            operators: ["equal", "not_equal", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"],
                        }
                    },
                    "integer": function (id, label, options) {
                        return {
                            id: id,
                            label: label,
                            type: 'integer',
                            operators: ["equal", "not_equal", 'less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
                        }
                    },
                    "timestamp": function (id, label, options) {
                        return {
                            id: id,
                            label: label,
                            type: 'integer',
                            operators: ['less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between'],
                            input: scope.inputDate
                        }
                    }
                };

                function getFilters(filters) {
                    var data = [{
                        "id": "callflow.times.created_time",
                        "label": "Created time",
                        "type": "integer",
                        "input": scope.inputDate,
                        "operators": [
                            "less",
                            "less_or_equal",
                            "greater",
                            "greater_or_equal",
                            "between",
                            "not_between"
                        ]
                    }];

                    angular.forEach(filters, function (value, key) {
                        if (key == "callflow.times.created_time") return;
                        var filter = COLUMN_TYPES[value.type](key, value.caption, value.options);
                        data.push(filter);
                    });
                    return data;
                };


                scope.queryBuilder = elem.queryBuilder({
                    plugins: ['bt-tooltip-errors'],

                    filters: getFilters(scope.filters),
                    rules: getDefaultFilter()
                });

                scope.onInit({$API: $API});

                scope.queryBuilder.on('afterDeleteRule.queryBuilder', function (e) {
                    console.debug('afterDeleteRule.queryBuilder', e);
                })

                scope.queryBuilder.on('getRuleTemplate.filter', function(e) {
                    /* modify the rule HTML (e.value) */
                    console.debug('getRuleTemplate.filter', e);
                });

                function getDefaultFilter() {
                    if ($localStorage.cdrF)
                        return $localStorage.cdrF;

                    var today = new Date();
                    today.setHours(0);
                    today.setMinutes(0);
                    today.setSeconds(0);

                    var basic_rules = {
                        condition: "AND",
                        "flags": {"no_delete": true, "condition_readonly": true, "filter_readonly": true},
                        rules: [{
                            "flags": {"no_delete": true, "filter_readonly": true},
                            id: "callflow.times.created_time",
                            operator: "between",
                            value: [today.getTime() * 1000, today.getTime() * 1000 + 86399900000] //86399999000
                        }]
                    }

                    return basic_rules;
                }

            }
        }
    });

});