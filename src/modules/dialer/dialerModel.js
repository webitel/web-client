/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('DialerModel', ["webitel", function (webitel) {

        var COLUMNS_LIST = 'columns=_id,name,strategy,priority';

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

        function remove (id, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('DELETE', '/api/v2/dialer/' + id + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        return {
            list: list,
            item: item,
            remove: remove,
        }
    }]);
});