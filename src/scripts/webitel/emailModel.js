/**
 * Created by igor on 26.07.16.
 */

"use strict";

define(['angular', 'scripts/webitel/utils', 'scripts/webitel/webitel'], function (angular, utils) {

    var app = angular.module('app.email', ['app.webitel']);

    app.factory("EmailModel", ['webitel', function EmailModel(webitel) {
        
        function set(domainName, config, cb) {
            var request = {
                domain: domainName,
                provider: "smtp",
                from: config.from,
                options: config.options || {}
            };
            request.options.debug = false;
            request.options.tls = {
                "rejectUnauthorized" : false
            };
            webitel.api('POST', '/api/v2/email/settings?domain=' + domainName, request, cb);
        }
        
        function get(domainName, cb) {
            webitel.api('GET', '/api/v2/email/settings?domain=' + domainName, function (err, res) {
                var config = {};
                if (err && err.statusCode == 401)
                    return cb(null, config);

                if (err)
                    return cb(err);

                if (res)
                    return cb(null, res);

                return cb(null, config);
            })
        }

        return {
            set: set,
            get: get
        }
    }]);
});
