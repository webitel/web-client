'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('CallflowPublicModel', ["webitel", function (webitel) {

        function create () {
            return {
                _id: null,
                destination_number: null,
                name: null,
                order: 0,
                disabled: false,
                fs_timezone: null,
                callflow: [],
                onDisconnect: [],
                cfDiagram: {}
            }
        };

        function list (domainName, cb) {
            webitel.api("GET", "/api/v2/routes/public?domain=" + domainName, cb)
        }
        // TODO add engine api get by id
        function item (id, domainName, cb) {
            list(domainName, function (err, res) {
                if (err)
                    return (err);

                var pub = findInList(res, id);
                if (pub && pub.fs_timezone)
                    pub.fs_timezone = {id: pub.fs_timezone, name: pub.fs_timezone};
                return cb(null, pub);
            });
        };

        function findInList (list, id) {
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i]._id === id)
                    return list[i];
            };
        };

        function add (def, domainName, cb) {
            try {
                var request = parseDefToRequest(def, domainName);
                if (!request.destination_number)
                    return cb(new Error('Bad number.'));

                if (!request.name)
                    return cb(new Error('Bad name.'));
                if (!request.domain)
                    return cb(new Error('Bad domain.'));

                webitel.api("POST", "/api/v2/routes/public?domain=" + domainName, request, cb);
            } catch (e) {
                cb(e);
            }
        };

        function parseDefToRequest (def, domainName) {
            var numbers = def.destination_number.map(function (i) {
                return typeof i == 'string' ? i : i.text;
            });
            return {
                destination_number: numbers,
                name: def.name,
                order: def.order,
                disabled: def.disabled,
                debug: def.debug,
                domain: domainName,
                fs_timezone: def.fs_timezone && def.fs_timezone.id,
                callflow: def.callflow,
                onDisconnect: def.onDisconnect,
                cfDiagram: def.cfDiagram
            };
        };

        function update (def, domainName, cb) {
            try {
                var request = parseDefToRequest(def, domainName);
                if (request.destination_number.length < 1)
                    return cb(new Error('Bad number.'));

                if (!request.name)
                    return cb(new Error('Bad name.'));
                if (!request.domain)
                    return cb(new Error('Bad domain.'));

                def.destination_number.map(function (i) {
                    return i.text
                })

                webitel.api("PUT", "/api/v2/routes/public/" + def._id + "?domain=" + domainName, request, cb);
            } catch (e) {
                cb(e);
            }
        }

        function remove (id, domainName, cb) {
            webitel.api("DELETE", "/api/v2/routes/public/" +  id + "?domain=" + domainName, cb)
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