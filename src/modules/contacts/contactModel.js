/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('ContactModel', ["webitel", function (webitel) {

        function list(option, cb) {
            if (!option.domain)
                return cb(new Error("Bad request: domain is required"));

            webitel.api('GET', '/api/v2/contacts' + buildQuery(option), cb);
        }

        function buildQuery (option) {
            var res = "?";
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res.substring(0, res.length - 1);
        }

        function item (id, domainName, cb) {
            webitel.api('GET', '/api/v2/contacts/' + id + '?domain=' + domainName, function (err, res) {
                if (err)
                    return cb(err);
               return cb(null, res)
            });
        }

        function add(data, domain, cb){
            if (!data)
                return cb(new Error("Bad request"));
            webitel.api('POST', '/api/v2/contacts?domain=' + domain, data, cb);
        }

        function update(id, data, domain, cb){
            if (!id || !data)
                return cb(new Error("Bad request"));
            webitel.api('PUT', '/api/v2/contacts/'+id+'?domain=' + domain, data, cb);
        }

        function remove (id, domain, cb) {
            if (!id)
                return cb(new Error("Id is required."));
            webitel.api('DELETE', '/api/v2/contacts/' + id + '?domain=' + domain, cb);
        }

        function communicationList (domain, cb){
            if (!domain)
                return cb(new Error("Domain is required."));
            webitel.api('GET', '/api/v2/contacts/communications?domain=' + domain, cb);
        }

        function addCommunicaiton(data, domain, cb){
            if (!data)
                return cb(new Error("Bad request"));
            webitel.api('POST', '/api/v2/contacts/communications?domain=' + domain, data, cb);
        }

        function updateCommunicaiton(id, data, domain, cb){
            if (!id || !data)
                return cb(new Error("Bad request"));
            webitel.api('PUT', '/api/v2/contacts/communications/'+id+'?domain=' + domain, data, cb);
        }

        function removeCommunicaiton (id, domain, cb) {
            if (!id)
                return cb(new Error("Id is required."));
            webitel.api('DELETE', '/api/v2/contacts/communications/' + id + '?domain=' + domain, cb);
        }

        function propertyList(domain, cb) {
            if (!domain)
                return cb(new Error("Bad request: domain is required"));
            webitel.api('GET', '/api/v2/metadata/contacts?domain=' + domain, cb);
        }

        function updateProperty(data, domain, cb) {
            if (!data)
                return cb(new Error("Bad request"));
            webitel.api('POST', '/api/v2/metadata/contacts?domain=' + domain, data, cb);
        }

        return {
            list: list,
            item: item,
            add: add,
            update: update,
            remove: remove,
            communicationList: communicationList,
            propertyList: propertyList,
            updateProperty: updateProperty,
            addCommunicaiton: addCommunicaiton,
            updateCommunicaiton: updateCommunicaiton,
            removeCommunicaiton: removeCommunicaiton
        }
    }]);
});