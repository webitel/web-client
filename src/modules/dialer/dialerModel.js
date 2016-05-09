/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('DialerModel', ["webitel", function (webitel) {

        var COLUMNS_LIST = 'columns=_id,name,strategy,priority';


        function listMembers (domainName, dialerId, option, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

             if (!dialerId)
                return cb(new Error("DialerId is required."));

            var page = option.page || 1;

            var _q = '?&domain=' + domainName + '&page=' + page;

            if (option.limit)
                _q += '&limit=' + option.limit;

            var sortKey = Object.keys(option.sort || {})[0];
            if (sortKey)
                _q += '&sort=' + sortKey + '=' + option.sort[sortKey];

            if (option.columns) {
                _q += '&columns=';
                angular.forEach(option.columns, function (v) {
                    _q += v + ',';
                });

            }
            _q += '&filter=';
            angular.forEach(option.filter, function (v, k, i) {
                _q += k.replace('_', '.') + '=' + v + ','
            });


            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members' + _q, function(err, res) {
                var queues = res.data || res.info;
                angular.forEach(queues, function (item) {
                    item.enable = item.enable == 'true';
                });
                return cb && cb(err, queues);
            });
        };


        function list (domainName, page, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            //TODO pagination
            page = 1;
            webitel.api('GET', '/api/v2/dialer?' + COLUMNS_LIST + '&limit=1000&page=' + page + '&domain=' + domainName, function(err, res) {
                var queues = res.data || res.info;
                angular.forEach(queues, function (item) {
                    item.enable = item.enable == 'true';
                });
                return cb && cb(err, queues);
            });
        };

        function parseDialer (domainName, data) {
            var dialer = create(domainName, data);
            angular.forEach(data._variables, function (item) {
                if (item.key && item.value)
                    dialer.variables[item.key] = item.value
            });
            return dialer
        }

        function add (data, cb) {
            var dialer = parseDialer(data.domain, data);

            webitel.api('POST', '/api/v2/dialer?domain=' + dialer.domain, dialer, function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, res.data && res.data.insertedIds[0]);
            });
        };

        function item (id, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/dialer/' + id + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                data._variables = [];

                angular.forEach(data.variables, function (val, key) {
                    data._variables.push({
                        key: key,
                        value: val
                    })
                });
                return cb && cb(err, data);
            });
        };

        function update (id, domainName, diffColumns, dialer, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));

            if (!diffColumns || diffColumns.length < 1)
                return cb(new Error("No change."));

            var data = parseDialer(domainName, dialer);


            webitel.api('PUT', '/api/v2/dialer/' + id + '?&domain=' + domainName, data, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function remove (id, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('DELETE', '/api/v2/dialer/' + id + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function create (domain, option) {
            option = option || {};
            var calendar = option.calendar ? {id: option.calendar.id, name: option.calendar.name} : {};
            return {
                "domain" : domain || "",
                "name" : option.name || "",
                "description" : option.description ||  "",
                "state" : option.state || "myState",
                "type" : option.type || "progressive",
                "priority" : angular.isNumber(option.priority) ? option.priority : 1,
                "active" : typeof option.active == 'boolean' ? option.active : true,
                "calendar" : calendar,
                "parameters" : {
                    "limit" : angular.isNumber(option.parameters && option.parameters.limit) ? option.parameters.limit : 30,
                    "progressSec" : angular.isNumber(option.parameters && option.parameters.progressSec) ? option.parameters.progressSec : 20,
                    "avgProgressSec" : angular.isNumber(option.parameters && option.parameters.avgProgressSec) ? option.parameters.avgProgressSec : 20
                },
                "variables" : {},
                "resources" : angular.isArray(option.resources) ? option.resources : [],
                "strategy" : option.strategy || "myStrategy",
                "agents" : angular.isArray(option.agents) ? option.agents : [],
                "agentSkills" : angular.isArray(option.agentSkills) ? option.agentSkills : [],
                "owners" : angular.isArray(option.owners) ? option.owners : []
            }
        }

        return {
            list: list,
            item: item,
            remove: remove,
            create: create,
            add: add,
            update: update,

            members: {
                list: listMembers
            }
        }
    }]);
});