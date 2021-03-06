/**
 * Created by i.navrotskyj on 01.03.2016.
 */
'use strict';

define(['app', 'config'], function (app, config) {
    var URI = (config.licenseManager.uri || '').replace(/\/$/, '') + '/api/v1/customers/';
    app.factory('LicenseManagerModel', ['$http', 'webitel', function ($http, webitel) {

        function api (method, url, args, cb) {
            webitel.api(method, url, args, cb);

            return;
            if (typeof args == 'function') {
                cb = args;
                args = null;
            };
            var req = {
                method: method,
                url: URI + url,
                data: args
            };
            return $http(req).success(function(res){
                cb(null, res);
            }).error(function(e, statusCode){
                var _e = e.message ? e : new Error(e.info || "Internal errror");
                cb(_e, {});
            });

        };

        var setDate = function(date){
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            return  Date.UTC(date.getFullYear(),date.getMonth(),date.getDate(), 23, 59, 59)
        };


        function list (cb) {
            webitel.api("GET", "/api/v2/customers", cb)
        };

        function update(license, diff, cb) {
            if (!license.cid)
                return cb(new Error("Bad customer id."));

            if (Object.keys(diff).length < 1)
                return cb(new Error("No changes."));

            var request = diff;
            if (request.exp)
                request.exp = setDate(request.exp) / 1000;

            webitel.api("PUT", "/api/v2/customers/" + license.cid, request, function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, parseResponse(res));
            })
        };

        function remove(id, cb) {
            webitel.api("DELETE", "/api/v2/customers/" + id, cb);
        };

        function add(license, cb) {
            var request = {
                cid: license.cid,
                description: license.description,
                internalDescription: license.internalDescription,
                exp: license.exp && (setDate(license.exp) / 1000),
                name: license.name,
                sid: license.sid,
                usr: license.usr,
            };
            if (!request.cid)
                return cb(new Error("Bad customer"));

            if (!request.exp)
                return cb(new Error("Bad expire"));

            if (!request.name)
                return cb(new Error("Bad name"));

            if (!request.usr)
                return cb(new Error("Bad count user"));

            webitel.api("POST",  "/api/v2/customers/", request, function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, parseResponse(res));
            });
        }

        function parseResponse(res) {
            return create(
                res.cid,
                res.description,
                res.internalDescription,
                new Date(res.exp * 1000), // End
                new Date(res.iat * 1000), // Modify
                res.name,
                new Date(res.nbf * 1000), // Created
                res.sid,
                res.token,
                res.usr
            );
        }

        function item(id, cb) {
            webitel.api("GET",  "/api/v2/customers/" + id, function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, parseResponse(res))
            })
        }

        function create (cid, description, internalDescription, exp, iat, name, nbf, sid, token, usr) {
            return {
                cid: cid || null,
                description: description || null,
                internalDescription: internalDescription || null,
                exp: exp || 0,
                iat: iat || 0,
                name: name || null,
                nbf: nbf || 0,
                sid: sid || null,
                token: token || null,
                usr: usr || 0,
            }
        }

        return {
            list: list,
            create: create,
            add: add,
            item: item,
            update: update,
            remove: remove
        }
    }]);
});