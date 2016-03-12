/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('LicensesModel', ["webitel", function (webitel) {

        function list (cb) {
            webitel.api("GET", "/api/v2/license?sid=true", function (err, res) {
                if (err)
                    return cb(err);
                
                return cb(null, res.data || res.info, res.sid);
            })
        };

        function update(token, cb) {
            if (!token || typeof token != 'string' || token.length < 1)
                return cb(new Error("Bad token"))
            ;

            var request = {
                token: token
            };
            //api.put('/api/v2/license/', upload);
            webitel.api("PUT", "/api/v2/license/", request, cb);

        };

        function remove(id, cb) {
            //api.delete('/api/v2/license/:id', remove);
            //eyJjaWQiOiJ0ZXN0QWRtaW4iLCJzaWQiOiIwMDgwYmFhMi1iZjQ3LWRhNDUtMjM1OC1lZmJlZTQxMzQ4NjMiLCJpYXQiOjE0NTYyMzQzMDYsIm5iZiI6MTQ1NjIzNDMwNiwiZXhwIjo5OTk5OTk5OTk5LCJ1c3IiOjk5OTl9/E8qtmjx7bPc8ZOROjCBBmdZEXOaNh0WmVSCzUG8HpvA
            if (!id)
                return cb(new Error("Bad customer id"));

            webitel.api("DELETE", "/api/v2/license/" + id, cb);
        };

        function create () {
            return {
                id: null
            }
        }

        return {
            list: list,
            create: create,
            add: update,
            update: update,
            remove: remove
        }
    }]);
});