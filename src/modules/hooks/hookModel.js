/**
 * Created by i.navrotskyj on 31.03.2016.
 */
'use strict';
// TODO
define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('HookModel', ["webitel", function (webitel) {


        function list (option, cb) {
            if (!option.domain)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/hooks/' + buildQuery(option), cb);
        };

        function item (id, domain, cb) {
            if (!id)
                return cb(new Error("Id is required."));

            if (!domain)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/hooks/' + id + '/?domain=' + domain, function (err, res) {
                if (err)
                    return cb(err);
                var hook = res && res.data;
                hook._filters = [];
                hook._map = [];
                if (hook && hook.filter) {
                    angular.forEach(hook.filter, function (v, k) {
                        v.name = k;
                        hook._filters.push(v)
                    });
                };

                if (hook && hook.map) {
                    angular.forEach(hook.map, function (v, k) {
                        hook._map.push({
                            field: k,
                            name: v
                        })
                    });
                }

                return cb(null, hook)
            });
        };

        function update (data, cb) {
            if (!data._id)
                return cb(new Error("Bad id"));

            if (!data.domain)
                return cb(new Error("Bad domain"));

            if (!data)
                return cb(new Error("Bad request data"));

            if (!data.event)
                return cb(new Error('Bad event name'));
            if (!data.action || !data.action.type || !data.action.url || !data.action.method)
                return cb(new Error('Bad action option'));



            webitel.api('PUT', '/api/v2/hooks/' + data._id + '/?domain=' + data.domain, parseHookToRequest(data), cb);
        };

        function add(data, cb) {

            if (!data.domain)
                return cb(new Error("Bad domain"));

            if (!data)
                return cb(new Error("Bad request data"));

            if (!data.event)
                return cb(new Error('Bad event name'));
            if (!data.action || !data.action.type || !data.action.url || !data.action.method)
                return cb(new Error('Bad action option'));

            webitel.api('POST', '/api/v2/hooks/?domain=' + data.domain, parseHookToRequest(data), cb);
        };

        function remove (id, domain, cb) {
            if (!domain)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));

            webitel.api('DELETE', '/api/v2/hooks/' + id + '/?domain=' + domain, cb);
        };

        function parseHookToRequest (data) {
            var request = {
                "event" : data.event,
                "enable" : data.enable,
                "description" : data.description,
                "action" : data.action,
                "map": {},
                "filter": {},
                "fields": [],
            };

            if (data._map && data._map.length > 0) {
                angular.forEach(data._map, function (value, i) {
                    if (value.field && value.name) {
                        request.fields.push(value.field);
                        request.map[value.field] = value.name;
                    }
                })
            };

            if (data._filters && data._filters.length > 0) {

                angular.forEach(data._filters, function (filter) {
                    if (filter.name && filter.operation && filter.value)
                        request.filter[filter.name] = {
                            "operation": filter.operation,
                            "value": filter.value
                        }
                });
            };
            return request;
        }

        function buildQuery (option) {
            var res = '?';
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res;
        };





        function create () {
            return {
                _id: null,
                "event" : "",
                "enable" : true,
                "description" : "",
                "action" : {
                    "type": "web",
                    "method": "POST",
                    "url": ""
                },
                "map": {},
                "_map": [],
                "filter": {},
                "_filter": [],
                "fields": [],
            }
        }

        return {
            list: list,
            item: item,
            create: create,
            update: update,
            add: add,
            remove: remove
        }
    }]);
});