/**
 * Created by igor on 23.11.16.
 */

"use strict";

define(['app', 'scripts/webitel/utils'], function (app, utils) {

    app.factory('BlacklistModel', ["webitel", function (webitel) {

        function list(domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/routes/blacklists?domain=' + domainName, cb);
        }

        function numbers(blacklistName, domainName, params, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!blacklistName)
                return cb(new Error("Name is required."));

            var options = {
                "limit": params.limit,
                "pageNumber": params.pageNumber,
                "filter": {
                    "name": blacklistName
                }
            };

            var keyFilter = params.filter && Object.keys(params.filter)[0];

            if (keyFilter) {
                options.filter.number = {
                    "$regex": "^" + params.filter[keyFilter],
                    "$options": 'i'
                }
            }

            webitel.api('POST', '/api/v2/routes/blacklists/searches?domain=' + domainName, JSON.stringify(options), cb);
        }

        function removeNumber(domainName, blacklistName, number, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!blacklistName)
                return cb(new Error("Name is required."));

            if (!number)
                return cb(new Error("Number is required."));

            webitel.api('DELETE', '/api/v2/routes/blacklists/' + encodeURIComponent(blacklistName) + "/" + encodeURIComponent(number) +
                '?domain=' + domainName, cb);
        }

        function remove(domainName, blacklistName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!blacklistName)
                return cb(new Error("Name is required."));


            webitel.api('DELETE', '/api/v2/routes/blacklists/' + encodeURIComponent(blacklistName) + '?domain=' + domainName, cb);
        }
        
        function add(domainName, blackListName, number, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!blackListName)
                return cb(new Error("Name is required."));

            if (!number)
                return cb(new Error("Number is required."));



            webitel.api('POST', '/api/v2/routes/blacklists/' + encodeURIComponent(blackListName) + '?domain=' + domainName, {number:number}, cb);
        }

        return {
            list: list,
            numbers: numbers,
            add: add,
            removeNumber: removeNumber,
            remove: remove
        }
    }]);
});