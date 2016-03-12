/**
 * Created by i.navrotskyj on 08.02.2016.
 */
'use strict';

define(['app'], function (app) {
    app.factory('AclModel', ["webitel", function (webitel) {

        function list (cb) {
            webitel.api('GET', '/api/v2/acl/roles', function (err, res) {
                return cb(err, res && res.info);
            });
        };

        function item (role, cb) {
            webitel.api('GET', '/api/v2/acl/roles/' + role, function (err, res) {
                return cb(err, res && res.info);
            });
        };

        function add (name, parents, cb) {
            var request = {
                roles: name,
                parents: parents ? parents : null,
                // TODO bug
                allows: {
                    "account": []
                }
            };

            if (!request.roles)
                return cb(new Error("Bad role name."));

            webitel.api('POST', '/api/v2/acl/roles', request, function (err, res) {
                return cb(err, res && res.info);
            });
        };

        function update(role, resource, perm, cb) {
            var request = {
            };
            request[resource] = perm;
            if (!role)
                return cb(new Error("Bad role name."));

            if (Object.keys(request).length < 1)
                return cb(new Error("Bad resource."));

            webitel.api('PUT', '/api/v2/acl/roles/' + role, request, cb);
        };

        function remove(role, cb) {
            webitel.api('DELETE', '/api/v2/acl/roles/' + role, cb);
        };

        function create () {
            return {
                id: null
            }
        }

        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove
        }
    }]);
});