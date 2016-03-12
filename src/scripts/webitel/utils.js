/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['angular'], function (angular) {
    function WebitelEvent() {
        var nextSubscriberId = 0;
        var subscriberList = [];

        this.subscribe = function(callback) {
            var id = nextSubscriberId;
            subscriberList[id] = callback;
            nextSubscriberId++;
            return id;
        };

        this.unsubscribe = function(id) {
            delete subscriberList[id];
        };

        this.trigger = function(sender) {
            for (var i in subscriberList) {
                subscriberList[i](sender);
            }
        };
    };

    function WebitelHashCollection() {
        var collection = {};

        var length = 0;

        var onAddedElement = new WebitelEvent();
        var onRemovedElement = new WebitelEvent();

        var addElement = function(key, element) {
            if (collection[key]) {
                throw new Error('Key ' + key + ' already defined!');
            } else {
                collection[key] = element;
                length++;
                onAddedElement.trigger(collection[key].getJSONObject ? collection[key].getJSONObject() : collection[key]);
            };
        };

        var getLength = function() {
            return length;
        };

        var getElement = function(key) {
            return collection[key]
        };

        var removeElement = function(key) {
            if (collection[key]) {
                var removedElement = collection[key];
                delete collection[key];
                length--;
                onRemovedElement.trigger(removedElement.getJSONObject ? removedElement.getJSONObject() : removedElement);
            };
        };

        var removeAllElement = function() {
            for (var key in collection) {
                removeElement(key);
            }
        };

        var setNewKey = function(key, newKey) {
            if (collection[key]) {
                throw new Error('Key ' + key + ' not found!');
            } else {
                var element = collection[key];
                collection[newKey] = element;
                collection[key] = undefined;
                delete collection[key];
            };
        };

        return {
            add: addElement,
            get: getElement,
            remove: removeElement,
            removeAll: removeAllElement,
            setNewKey: setNewKey,
            onAdded: onAddedElement,
            onRemoved: onRemovedElement,
            length: getLength,
            collection: collection
        };
    };

    function WebitelArrayCollection(identityField) {
        var collection = [];
        var onAddedElement = new WebitelEvent();
        var onRemovedElement = new WebitelEvent();

        var getElement = function(key) {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i][identityField] == key) {
                    return collection[i];
                }
            }
            return null;
        };

        var addElement = function(element) {
            var key = element[identityField];
            if (getElement(key)) {
                throw new Error('Key ' + key + ' already defined!');
            } else {
                var index = collection.push(element) - 1;
                onAddedElement.trigger(collection[index].getJSONObject ? collection[index].getJSONObject() : collection[index]);
            };
        };

        var removeElement = function(key) {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i][identityField] == key) {
                    var removedElement = collection.splice(i, 1)[0];
                    onRemovedElement.trigger(removedElement);
                }
            }
        };

        var setParam = function (key, paramName, value) {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i][identityField] == key) {
                    collection[i][paramName] = value;
                    return true;
                }
            }
            return false;
        };

        var getLength = function(){
            return collection.length;
        };

        var getAll = function () {
            return [].concat(collection);
        };
        
        var removeAll = function () {
            return collection.length = 0
        };

        return {
            add: addElement,
            get: getElement,
            setParam: setParam,
            remove: removeElement,
            onAdded: onAddedElement,
            onRemoved: onRemovedElement,
            getLength: getLength,
            // TODO ???????
            collection: collection,
            getAll: getAll,
            removeAll: removeAll
        };
    };

    function diff(obj1, obj2, exclude) {
        var r = {};

        if (!exclude) exclude = [];

        for (var prop in obj1) {
            if (prop == '$$hashKey') continue;
            if (obj1.hasOwnProperty(prop)) {
                if (exclude.indexOf(obj1[prop]) == -1) {

                    // check if obj2 has prop
                    if (!obj2.hasOwnProperty(prop)) r[prop] = obj1[prop];

                    // check if prop is object, if so, recursive diff
                    else if (obj1[prop] === Object(obj1[prop])) {
                        if (obj2[prop] == undefined || obj2[prop] == null)
                            r[prop] = obj2[prop];
                        else {
                            var difference = diff(obj1[prop], obj2[prop]);
                            if (Object.keys(difference).length > 0) r[prop] = difference;
                        }
                    }

                    // check if obj1 and obj2 are equal
                    else if (obj1[prop] !== obj2[prop]) {
                        if (obj1[prop] === undefined)
                            r[prop] = 'undefined';
                        if (obj1[prop] === null)
                            r[prop] = null;
                        else if (typeof obj1[prop] === 'function')
                            r[prop] = 'function';
                        else if (typeof obj1[prop] === 'object')
                            r[prop] = 'object';
                        else
                            r[prop] = obj1[prop];
                    }
                }
            }

        }

        return r;
    };

    function strToType(value) {
        if (!isNaN(+value)) {
            return +value;
        } else if (~['true', 'false'].indexOf(value)) {
            return value == 'true' ? true : false;
        };
        return value;
    };

    function saveJsonToPc (data, filename) {
        if (!data) {
            console.error('No data');
            return;
        }

        if (!filename) {
            filename = 'download.json';
        }

        if (typeof data === 'object') {
            data = JSON.stringify(data, undefined, 2);
        }

        var blob = new Blob([data], {type: 'text/json'}),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    };

    var switchVar = [
        "state",
        "state_number",
        "channel_name",
        "uuid",
        "direction",
        "read_codec",
        "read_rate",
        "write_codec",
        "write_rate",
        "username",
        "dialplan",
        "caller_id_name",
        "caller_id_number",
        "ani",
        "aniii",
        "network_addr",
        "destination_number",
        "source",
        "context",
        "rdnis",
        "profile_index",
        "created_time",
        "answered_time",
        "hangup_time",
        "transfer_time",
        "screen_bit",
        "privacy_hide_name",
        "privacy_hide_number",
        "profile_created",
        "sip_h_p-key-flags",
        "sip_h_referred-by"
    ]

    // TODO server list
    var resourcesAcl = [
        'acl/roles',
        'acl/resource',

        'blacklist',

        'rotes/default',
        'rotes/public',
        'rotes/extension',
        'rotes/domain',

        'channels',

        'cc/tiers',
        'cc/members',
        'cc/queue',

        'book',

        'cdr',
        'cdr/files',
        'cdr/media',

        'outbound/list',

        'gateway',
        'gateway/profile',

        'domain',
        'domain/item',

        'account',

        'system/reload',

        'license'
    ];

    return {
        WebitelEvent: WebitelEvent,
        WebitelHashCollection: WebitelHashCollection,
        WebitelArrayCollection: WebitelArrayCollection,
        diff: diff,
        strToType: strToType,
        resourcesAcl: resourcesAcl,
        switchVar: switchVar,
        saveJsonToPc: saveJsonToPc
    }
});