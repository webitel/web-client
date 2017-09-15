/**
 * Created by i.navrotskyj on 23.02.2016.
 */
'use strict';


define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('CallflowVariablesModel', ["webitel", function (webitel) {

        function create () {
            return {
                _id: null,
            }
        };

        function list (domainName, cb) {
            if (!domainName)
                return cb(new Error('Domain is required.'));
            webitel.api("GET", "/api/v2/routes/variables?domain=" + domainName, function (err, res) {
                if (err)
                    return cb(err);

                var data = res.data.length > 0 ? res.data[0].variables : [],
                    result = [];
                angular.forEach(data, function (value, key) {
                    result.push({
                        key: key,
                        value: value
                    })
                });
                return cb(null, result);
            })
        }

        function update (data, domainName, cb) {
            if (!domainName)
                return cb(new Error("Bad domain name."));

            var request = {};
            angular.forEach(data, function (item) {
                if (item.key && item.value)
                    request[item.key] = item.value;
            });

            webitel.api("PUT", "/api/v2/routes/variables/?domain=" + domainName, request, cb)
        };

        return {
            list: list,
            create: create,
            update: update
        }
    }]);
});