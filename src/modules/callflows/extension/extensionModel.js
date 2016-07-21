'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('CallflowExtensionModel', ["webitel", function (webitel) {

        function create () {
            return {
                _id: null,
                destination_number: null,
                name: null,
                fs_timezone: null,
                callflow: [],
                onDisconnect: []
            }
        };

        function list (domainName, cb) {
            webitel.api("GET", "/api/v2/routes/extensions?domain=" + domainName, cb)
        }
        // TODO add engine api get by id
        function item (id, domainName, cb) {
            list(domainName, function (err, res) {
                if (err)
                    return (err);

                for (var i = 0, len = res.length; i < len; i++) {
                    if (res[i]._id === id)
                        return cb(null, res[i])
                };
            });
        };

        function add (def, domainName, cb) {

        };

        function parseExtToRequest (ext, domainName) {
            return {
                destination_number: ext.destination_number,
                name: ext.name,
                fs_timezone: ext.fs_timezone && ext.fs_timezone.id,
                callflow: ext.callflow,
                onDisconnect: ext.onDisconnect
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

            webitel.api("PUT", "/api/v2/routes/extensions/" +  def._id + "?domain=" + domainName, request, cb)
        }

        function remove (id, domainName, cb) {

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