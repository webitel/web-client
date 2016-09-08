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
        
        function reload(name, cb) {
            if (!name)
                return cb(new Error('Bad module name'));

            webitel.api('PUT', '/api/v2/system/reload/' + name, cb)
        }


        return {
            removeNonExistentFiles: removeNonExistentFiles,
            reload: reload
        }
    }]);

});