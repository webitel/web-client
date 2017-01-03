/**
 * Created by igor on 30.12.16.
 */

"use strict";

define(['app'], function (app) {
    app.factory('VoiceMailModel', ["webitel", function (webitel) {

        function list(id, domainName, cb) {
            if (!id)
                return cb(new Error('Account id is required'));

            if (!domainName)
                return cb(new Error('Domain is required'));

            return webitel.api('GET', '/api/v2/vmail/' + id + '?domain=' + domainName, cb);
        }

        function remove(id, domainName, messageId, cb) {
            if (!id)
                return cb(new Error('Account id is required'));

            if (!domainName)
                return cb(new Error('Domain is required'));

            if (!messageId)
                return cb(new Error('Message id is required'));

            return webitel.api('DELETE', '/api/v2/vmail/' + id +  '/' + messageId + '?domain=' + domainName, cb);
        }

        function setState(id, domainName, messageId, state, cb) {
            if (!id)
                return cb(new Error('Account id is required'));

            if (!domainName)
                return cb(new Error('Domain is required'));

            if (!messageId)
                return cb(new Error('Message id is required'));

            if (!state)
                return cb(new Error('State is required'));

            return webitel.api('PUT', '/api/v2/vmail/' + id +  '/' + messageId + '?domain=' + domainName, {state: state}, cb);
        }

        return {
            list: list,
            remove: remove,
            setState: setState
        }
    }]);
});