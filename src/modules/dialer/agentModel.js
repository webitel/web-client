/**
 * Created by igor on 07.03.17.
 */

"use strict";

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('AgentModel', ["webitel", function (webitel) {

        function list(domain, query, fields, cb) {
            var uri = [];
            if (domain)
                uri.push('domain=' + domain);

            if (query)
                uri.push('filter=' + encodeURIComponent(JSON.stringify(query)));

            if (fields)
                uri.push('fields=' + encodeURIComponent(JSON.stringify(fields)));

            webitel.api('GET', '/api/v2/callcenter/agent?' + uri.join('&'), function(err, res) {
                return cb && cb(err, res.data || res.info);
            });
        }

        return {
            list: list
        }
    }]);
});