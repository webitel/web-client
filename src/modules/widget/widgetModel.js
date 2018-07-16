/**
 * Created by matvij on 21.06.17.
 */

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('WidgetModel', ["webitel", function (webitel) {

        function list(option, cb) {
            if (!option.domain)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/widget' + buildQuery(option), cb);
        }

        function buildQuery (option) {
            var res = "?";
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res.substring(0, res.length - 1);
        };

        function add(data, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data.name)
                return cb(new Error("Name is required"));

            if (!data.queue_id)
                return cb(new Error("Queue is required"));

            if (!data.config||!data.config.calendar||data.config.calendar.accept.length==0)
                return cb(new Error("Calendar is required"));

            if (!data.callflow_id)
                return cb(new Error("Number is required"));

            data.domain = domain;
            delete data._new;
            webitel.api('POST', '/api/v2/widget?domain=' + domain, data, cb);
        };

        function update(data, widgetId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data.name)
                return cb(new Error("Name is required"));

            if (!data.queue_id)
                return cb(new Error("Queue is required"));

            if (!data.config||!data.config.calendar||data.config.calendar.accept.length==0)
                return cb(new Error("Calendar is required"));

            if (!data.callflow_id)
                return cb(new Error("Number is required"));

            data.domain = domain;
            webitel.api('PUT', '/api/v2/widget/'+widgetId+'?domain=' + domain, data, cb);
        };

        function item (id, domain, cb) {
            if (!id)
                return cb(new Error("Id is required."));

            webitel.api('GET', '/api/v2/widget/' + id + '?domain=' + domain, function (err, res) {
                if (err)
                    return cb(err);
                var widget = res && res.data;
                return cb(null, widget);
            })
        }

        function remove (id, domain, cb) {
            if (!domain)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));
            webitel.api('DELETE', '/api/v2/widget/' + id + '?domain=' + domain, cb);
        };

        return {
            remove: remove,
            add: add,
            update: update,
            list: list,
            item: item
        }
    }])
})