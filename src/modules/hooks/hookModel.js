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
                if (!hook)
                    return cb(null, null);
                hook._filters = [];
                hook._map = [];
                hook._headers = [];
                if (hook && hook.filter) {
                    angular.forEach(hook.filter, function (v, k) {
                        v.name = k;
                        hook._filters.push(v)
                    });
                }

                if (hook && hook.headers) {
                    angular.forEach(hook.headers, function (v, k) {
                        hook._headers.push({
                            name: k,
                            value: v
                        })
                    });
                }

                if (hook && hook.map) {
                    angular.forEach(hook.map, function (v, k) {
                        hook._map.push({
                            field: k,
                            name: v
                        })
                    });
                }

                if (hook && hook.auth) {
                    hook.auth._map = objToArrayNameValue(hook.auth.map);
                    hook.auth._headers = objToArrayNameValue(hook.auth.headers);
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

        function arrayToObj(arr) {
            var res = {};
            angular.forEach(arr, function (v, i) {
                if ( v.name && (v.value || v.field) ) {
                    res[v.name] = v.value || v.field
                }
            });
            return res
        }
        
        function objToArrayNameValue(o) {
            var res = [];
            angular.forEach(o, function (v, k) {
                res.push({
                    name: k,
                    value: v
                })
            });
            return res;
        }

        function parseHookToRequest (data) {
            var request = {
                "event" : data.event,
                "delay" : data.delay,
                "retries" : data.retries,
                "enable" : data.enable,
                "description" : data.description,
                "action" : data.action,
                "customBody" : data.customBody,
                "rawBody": data.rawBody,
                "auth": {},
                "map": {},
                "filter": {},
                "fields": [],
                "headers": {}
            };

            var auth = data.auth || {};

            if (data._map && data._map.length > 0) {
                angular.forEach(data._map, function (value, i) {
                    if (value.field && value.name) {
                        request.fields.push(value.field);
                        request.map[value.field] = value.name;
                    }
                })
            }

            request.auth.headers = arrayToObj(auth._headers);
            request.auth.map = arrayToObj(auth._map);

            request.auth.method = auth.method;
            request.auth.enabled = auth.enabled;
            request.auth.url = auth.url;
            request.auth.cookie = auth.cookie;

            request.headers = arrayToObj(data._headers);


            if (data._filters && data._filters.length > 0) {

                angular.forEach(data._filters, function (filter) {
                    if (filter.name && filter.operation && filter.value)
                        request.filter[filter.name] = {
                            "operation": filter.operation,
                            "value": filter.value
                        }
                });
            }
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
                "customBody" : true,
                "rawBody": "",
                "action" : {
                    "type": "web",
                    "method": "POST",
                    "url": ""
                },
                "auth": {
                    "enabled": false,
                    "_headers": [],
                    "headers": {},
                    "map": {},
                    "_map": []
                },
                "map": {},
                "_map": [],
                "filter": {},
                "_filter": [],
                "fields": [],
                "_headers": [],
                "headers": {}
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