/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';
// TODO
define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('DeviceModel', ["webitel", function (webitel) {


        function list (domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/hotdesk?domain=' + domainName, cb);
        };

        function item (domainName, id, cb) {
            if (!domainName || !id)
                return cb(new Error("Domain and id is required."));

            webitel.api('GET', '/api/v2/hotdesk/' + id + '?domain=' + domainName, function (err, res) {
                if (err)
                    return cb(err);

                var obj = res.data || res.info;
                obj.password = null;
                if(!!obj.alias && typeof obj.alias === 'string'){
                    obj.alias = obj.alias.split(',')
                }
                return cb(err, obj);
            });
        };


        function add (device, cb) {
            if (!device.id)
                return cb(new Error("Id number is required."));
            if (!device.domain)
                return cb(new Error("Domain is required."));

            var request = {
                "id": device.id,
                "name": device.name,
                "password": device.password,
                "vendor": device.vendor,
                "model": device.model ? device.model.name : "",
                "mac": device.mac,
                "alias": device.alias
                //"variables": []
            };
            // var _v = [];
            // angular.forEach(device.variables, function (item) {
            //     _v.push(item.key + "='" + (item.value || '') + "'")
            // });
            //
            // request.variables = request.variables.concat(_v);

            webitel.api('POST', '/api/v2/hotdesk?domain=' + device.domain, request, cb)
        };

        function update(device, domainName,/* diffAttr, remVar,*/ cb) {
            if (!device.id)
                return cb(new Error("Id number is required."));
            if (!device.domain)
                return cb(new Error("Domain is required."));

            var request = {
                "id": device.id,
                "name": device.name,

                "vendor": device.vendor,
                "model": device.model ? device.model.name : "",
                "mac": device.mac,
                "alias": device.alias
                //"variables": device.variables || []
            };
            if(!!device.password){
                request.password = device.password;
            }
            // angular.forEach(remVar, function (key) {
            //     request.variables.push(key + '=')
            // });

            webitel.api('PUT', '/api/v2/hotdesk/'+ device.id + '?domain=' + domainName, request, cb)
        };

        function remove(id, domainName, cb) {
            webitel.api('DELETE', '/api/v2/hotdesk/'+ id + '?domain=' + domainName, cb)
        };

        return {
            list: list,
            item: item,
            add: add,
            update: update,
            remove: remove
        }
    }]);
});