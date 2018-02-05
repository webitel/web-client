'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('CallflowPublicModel', ["webitel", function (webitel) {

        var LIST_COLUMNS = encodeURIComponent(JSON.stringify({id:1, name:1, destination_number:1, debug: 1,disabled:1}));

        function create () {
            return {
                id: null,
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
            webitel.api("GET", "/api/v2/routes/public?columns=" + LIST_COLUMNS + "&limit=1000&domain=" + domainName, function (err, res) {
                if (err)
                    return cb(err);

                return cb(null, res.data)
            })
        }

        function item (id, domainName, cb) {
            webitel.api("GET", "/api/v2/routes/public/" + id + "?domain=" + domainName, function (err, res) {
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
        }

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
                callflow_on_disconnect: def.callflow_on_disconnect,
                cf_diagram: def.cf_diagram
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
                });

                webitel.api("PUT", "/api/v2/routes/public/" + def.id + "?domain=" + domainName, request, cb);
            } catch (e) {
                cb(e);
            }
        }

        function remove (id, domainName, cb) {
            webitel.api("DELETE", "/api/v2/routes/public/" +  id + "?domain=" + domainName, cb)
        }

        function debug(id, uuid, from, domain, number, cb) {
            webitel.api("POST", "/api/v2/routes/public/" + id +"/debug?domain=" + domain, {from: from, uuid: uuid, number: number}, cb)
        }
        
        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove,
            debug: debug
        }
    }]);
});