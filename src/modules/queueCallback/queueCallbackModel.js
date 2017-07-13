/**
 * Created by matvij on 21.06.17.
 */


define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('QueueCallbackModel', ["webitel", function (webitel) {

        function list(option, cb) {
            if (!option.domain)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/callback' + buildQuery(option), cb);
        }

        function buildQuery (option) {
            var res = "?";
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res.substring(0, res.length - 1);
        }

        function add(data, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data.name)
                return cb(new Error("Bad request data"));

            data.domain = domain;
            delete data._new;
            webitel.api('POST', '/api/v2/callback?domain=' + domain, data, cb);
        }

        function update(data, callbackId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data.name)
                return cb(new Error("Bad request data"));

            if (!data.description)
                return cb(new Error('Bad description'));
            data.domain = domain;
            webitel.api('PUT', '/api/v2/callback/'+callbackId+'?domain=' + domain, data, cb);
        }

        function item (id, domain, cb) {
            if (!id)
                return cb(new Error("Id is required."));

            if (!domain)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/callback/' + id + '?domain=' + domain, function (err, res) {
                if (err)
                    return cb(err);
                var qCallback = res && res.data;
                return cb(null, qCallback);
            })
        }

        function remove (id, domain, cb) {
            if (!domain)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));
            webitel.api('DELETE', '/api/v2/callback/' + id + '?domain=' + domain, cb);
        }

        return {
            remove: remove,
            add: add,
            update: update,
            list: list,
            item: item
        }
    }])
});