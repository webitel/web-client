'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('CallflowDefaultModel', ["webitel", function (webitel) {

        function create () {
            return {
                id: null,
                destination_number: null,
                name: null,
                order: 0,
                fs_timezone: null,
                disabled: false,
                debug: false,
                callflow: [],
                callflow_on_disconnect: [],
                cf_diagram: {}
            };
        };
        var LIST_COLUMNS = encodeURIComponent(JSON.stringify({id:1, name:1, order: 1,  destination_number:1, debug: 1,disabled:1}));

        function list (domainName, cb) {
            webitel.api("GET", "/api/v2/routes/default?columns=" + LIST_COLUMNS + "&sort=%7B%22order%22%3A-1%7D&limit=1000&domain=" + domainName, function (err, res) {
                if (err)
                    return cb(err);

                return cb(null, res.data)
            })
        }

        function item (id, domainName, cb) {

            webitel.api("GET", "/api/v2/routes/default/" + id + "?domain=" + domainName, function (err, res) {
                if (err)
                    return cb(err);

                if (res.data && res.data.fs_timezone) {
                    var timezone = res.data.fs_timezone;
                    res.data.fs_timezone = {id: timezone, name: timezone}
                }
                return cb(null, res.data)
            });
        }

        function findInList (list, id) {
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i].id === id)
                    return list[i];
            };
        };

        function add (def, domainName, cb) {
            var request = parseDefToRequest(def, domainName);
            if (!request.destination_number)
                return cb(new Error('Bad number.'));

            if (!request.name)
                return cb(new Error('Bad name.'));           
            if (!request.domain)
                return cb(new Error('Bad domain.'));      

            webitel.api("POST", "/api/v2/routes/default?domain=" + domainName, request, cb)        
        };

        function parseDefToRequest (def, domainName) {
            return {
                destination_number: def.destination_number,
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
            var request = parseDefToRequest(def, domainName);
            if (!request.destination_number)
                return cb(new Error('Bad number.'));

            if (!request.name)
                return cb(new Error('Bad name.'));           
            if (!request.domain)
                return cb(new Error('Bad domain.'));      

            webitel.api("PUT", "/api/v2/routes/default/" +  def.id + "?domain=" + domainName, request, cb)
        }

        function remove (id, domainName, cb) {
            webitel.api("DELETE", "/api/v2/routes/default/" +  id + "?domain=" + domainName, cb)
        };

        function setOrder(id, domain, order, cb) {
            if (!id)
                return cb(new Error('Bad id.'));

            //if (!order)
            //    return cb(new Error('Bad order.'));

            var request = {
                order: +order
            };
            //api.put('/api/v2/routes/default/:id/setOrder', setOrderDefault);
            webitel.api('PUT', '/api/v2/routes/default/' + id + '/setOrder?domain=' + domain, request, cb)

        };

        function incOrder(domain, start, inc, cb) {
            if (!domain)
                return cb(new Error('Bad domain.'));


            if (!inc)
                return cb(new Error('Bad inc.'));

            var request = {
                start: +start,
                inc: +inc,
            };
            //api.put('/api/v2/routes/default/:id/setOrder', setOrderDefault);
            webitel.api('PUT', '/api/v2/routes/default/' + domain + '/incOrder?domain=' + domain, request, cb)

        };

        function move(id, domain, up, cb) {
            webitel.api('PUT', '/api/v2/routes/default/' + id + (up ? '/up' : '/down') + '?domain=' + domain, cb)
        }

        function debug(id, uuid, from, domain, number, cb) {
            webitel.api("POST", "/api/v2/routes/default/" + id +"/debug?domain=" + domain, {from: from, uuid: uuid, number: number}, cb)
        }

        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove,
            findInList: findInList,
            setOrder: setOrder,
            incOrder: incOrder,
            move: move,
            debug: debug
        }
    }]);
});