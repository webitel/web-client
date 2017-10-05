/**
 * Created by igor on 06.09.16.
 */

"use strict";

define(['app', 'scripts/webitel/utils'], function (app, utils) {

    app.factory('ServerSettingsModel', ["webitel", function (webitel) {

        function removeNonExistentFiles(from, to, cb) {
            if (!from || !to)
                return cb(new Error('Bad date parameters'));

            if (to <= from)
                return cb(new Error('Date to must > to'));

            var body = {
                from: from,
                to: to
            };
            webitel.cdr("DELETE", "/api/v2/files/utils/removeNonExistentFiles", body, cb);
        }
        
        function removeFiles(from, to, cb) {
            if (!from || !to)
                return cb(new Error('Bad date parameters'));

            if (to <= from)
                return cb(new Error('Date to must > to'));

            var body = {
                from: from,
                to: to
            };

            webitel.cdr("DELETE", "/api/v2/files/utils/removeFiles", body, cb);
        }
        
        function reload(name, cb) {
            if (!name)
                return cb(new Error('Bad module name'));

            webitel.api('PUT', '/api/v2/system/reload/' + name, cb)
        }
        
        function cache(action, cb) {
            if (!action)
                return cb(new Error('Bad action name'));

            webitel.api('PUT', '/api/v2/system/cache/' + action, cb)
        }

        function addDump(body, cb) {
            if(!body)
                return cb(new Error('Bad request data'));

            webitel.api('POST', '/api/v2/system/tcp_dump/', body, cb);
        }

        function deleteDump(id, cb) {
            if(!id)
                return cb(new Error('Bad request id'));

            webitel.api('DELETE', '/api/v2/system/tcp_dump/' + id, cb);
        }

        function itemDump(id, cb) {
            if(!id)
                return cb(new Error('Bad request id'));

            webitel.api('GET', '/api/v2/system/tcp_dump/' + id, cb);
        }

        function updateDump(id, description, cb) {
            if(!id)
                return cb(new Error('Bad request id'));

            webitel.api('PUT', '/api/v2/system/tcp_dump/' + id, {description: description}, cb);
        }

        function list(option, cb) {
            if (!option)
                return cb(new Error("Bad request"));

            webitel.api('GET', '/api/v2/system/tcp_dump/' + buildQuery(option), cb);
        }

        function buildQuery (option) {
            var res = "?";
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res.substring(0, res.length - 1);
        }

        function getFile (id) {
            var uri = webitel.connection._cdr + "/api/v2/tcp_dump/" +
                id + "/data?access_token=" + webitel.connection.session.token +
                "&x_key=" + webitel.connection.session.key;
            return uri;
        }

        return {
            removeNonExistentFiles: removeNonExistentFiles,
            removeFiles: removeFiles,
            cache: cache,
            reload: reload,
            addDump: addDump,
            deleteDump: deleteDump,
            itemDump: itemDump,
            updateDump: updateDump,
            list: list,
            getFile: getFile
        }
    }]);

});