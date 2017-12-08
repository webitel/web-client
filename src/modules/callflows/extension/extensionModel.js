'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('CallflowExtensionModel', ["webitel", function (webitel) {

        function create () {
            return {
                id: null,
                destination_number: null,
                name: null,
                fs_timezone: null,
                callflow: [],
                onDisconnect: [],
                cfDiagram: {}
            }
        };

        function list (domainName, cb) {
            webitel.api("GET", "/api/v2/routes/extensions?limit=10000&domain=" + domainName, function (err, res) {
                if (err)
                    return cb(err);

                return cb(null, res.data)
            })
        }
        // TODO add engine api get by id
        function item (id, domainName, cb) {

            webitel.api("GET", "/api/v2/routes/extensions/" + id + "?domain=" + domainName, function (err, res) {
                if (err)
                    return cb(err);

                if (res.data && res.data.fs_timezone) {
                    var timezone = res.data.fs_timezone;
                    res.data.fs_timezone = {id: timezone, name: timezone}
                }

                return cb(null, res.data)
            });
        }

        function add (def, domainName, cb) {

        };

        function parseExtToRequest (ext, domainName) {
            return {
                destination_number: ext.destination_number,
                name: ext.name,
                fs_timezone: ext.fs_timezone && ext.fs_timezone.id,
                callflow: ext.callflow,
                callflow_on_disconnect: ext.onDisconnect,
                cf_diagram: ext.cfDiagram
            };
        };

        function update (def, domainName, cb) {
            var request = parseExtToRequest(def, domainName);
            if (!request.destination_number)
                return cb(new Error('Bad number.'));

            if (!request.name)
                return cb(new Error('Bad name.'));
            if (!request.callflow)
                return cb(new Error('Bad callflow.'));

            webitel.api("PUT", "/api/v2/routes/extensions/" +  def.id + "?domain=" + domainName, request, cb)
        }

        function remove (id, domainName, cb) {
            if (!id) {
                return cb(new Error("Id is required"))
            }

            webitel.api("DELETE", "/api/v2/routes/extensions/" + id + "?domain=" + (domainName || ""), cb);
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