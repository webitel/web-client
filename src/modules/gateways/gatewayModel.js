/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('GatewayModel', ["webitel", function (webitel) {

        var template = {
            "sipTrunk": 
                {
                    fields: {
                        realm: {
                            caption: "Host/IP",
                            position: 0
                        },
                        username: {
                            caption: "User Name",
                            position: 1,
                            value: "webitel"
                        }
                    },
                    params: {
                        "register": "false",
                        "extension-in-contact": "true"
                    }
            },

            "sipProvider": {
                fields: {
                    password: {
                        caption: "Password",
                        type: "password",
                        position: 2
                    },
                    realm: {
                        caption: "Host/IP",
                        position: 0
                    },
                    username: {
                        caption: "User Name",
                        position: 1
                    }
                },
                params: {
                    "register": "true",
                    "extension-in-contact": "true"
                }
            },
            "skype": {
                fields: {

                    username: {
                        caption: "SIP username",
                        position: 0
                    },
                    password: {
                        caption: "Password",
                        position: 1
                    },
                    realm: {
                        caption: "Host/IP",
                        position: 0,
                        value: 'sip.skype.com'
                    }
                },
                params: {
                    "register": "true",
                    "extension-in-contact": "true",
                    "from-domain": "sip.skype.com",
                    "from-user": "$${username}",
                    "contact-params": "$${username}@sip.skype.com",
                    "retry-seconds": "30",
                    "caller-id-in-from": "false"                  
                },
                alias: {
                    username: {
                        "from-user": "$${username}",
                        "contact-params": "$${username}@sip.skype.com"
                    }
                }
            }
        };

        function replaceParams(str, fields) {
            return str
                .replace(/\$\$\{([\s\S]*?)\}/gi, function (a, b) {
                    return fields[b] || ""
                })
        };

        function list (domainName, cb) {
            var _domain = domainName || "";
            webitel.api('GET', '/api/v2/gateway?domain=' + _domain, function (err, res) {
                if (err)
                    return cb(err);

                var data = res.data || res.info;
                var gateways = [],
                    tmp;
                angular.forEach(data, function (value) {
                    tmp = /^((\S+)::)?(\S+)$/.exec(value.Gateway);
                    gateways.push(createListItem(tmp[3], tmp[3], value.Domain, value.State, value.Data, tmp[2]));
                });
                return cb(null, gateways)
            });
        };

        function item (id, domainName, cb) {
            ///api/v2/gateway/:name
            webitel.api('GET', '/api/v2/gateway/' + id + '?domain=' + domainName, function (err, res) {
                if (err)
                    return cb(err);

                var gw = create(),
                    resGw = res.data || res.info;
                gw.id = gw.name = id;
                gw.realm = resGw.realm;
                gw.type = getType(resGw);
                angular.forEach(resGw, function (value, key) {
                    if (template[gw.type].fields.hasOwnProperty(key))
                        return gw.attr[key] = value;
                    gw.params.push({
                        key: key,
                        value: value
                    })
                });
               return cb(null, gw)
            });

        };

        function getType (gw) {
            if (gw.realm === 'sip.skype.com')
                return "skype";
            else if (gw.register === 'false' && gw.username === 'webitel' && gw['extension-in-contact'] === 'true')
                return 'sipTrunk';
            else return 'sipProvider';
        }

        function add (gw, cb) {
            var request = {
                'username': "",
                'name': "",
                'password': "",
                'realm': "",
                'profile': "",
                'domain': "",
                'params': [],
                'var': [],
                'ivar': [],
                'ovar': []
            };

            angular.forEach(gw.attr, function (value, key) {
                request[key] = value;
            });

            request.domain = gw.domain;
            request.profile = gw.profile;
            request.name = gw.name;

            if (!request.name || !request.username)
                return cb(new Error('Name or username is required.'));

            angular.forEach(gw.params, function (item) {
                request.params.push({
                    name: item.key,
                    value: replaceParams(item.value, request)
                });
            });
            
            var pushVariable = function (varName) {
                angular.forEach(gw[varName], function (item) {
                    request[varName].push({
                        "name": item.key,
                        "value": item.value
                    });
                });
            };

            pushVariable('var');
            pushVariable('ivar');
            pushVariable('ovar');

            webitel.api('POST', '/api/v2/gateway', request, cb)
        };

        function getVar(id, type, cb) {
            webitel.api('GET', '/api/v2/gateway/' + id + '/' + type, function (err, res) {
                debugger
            });
        }

        function update(gateway, diff, remParams, cb) {
            var request = [];

            if (Object.keys(diff).length < 1 && remParams.length < 1)
                return cb(new Error("No changes."));
            var map = {};
            angular.forEach(remParams, function (name) {
                map[name] = "";
            });

            angular.forEach(diff.attr, function (value, key) {
                map[key] = value;
            });

            if (diff.hasOwnProperty('params')) {
                angular.forEach(gateway.params, function (item) {
                    map[item.key] = item.value;
                });
            };

            angular.forEach(map, function (value, key) {
                request.push({
                    name: key,
                    value: value
                });
            });
            webitel.api('PUT', '/api/v2/gateway/' + gateway.id + '/params', request, cb)
        };

        function remove(id, domainName, cb) {
           if (!id)
            return cb(new Error("Bad gateway name"));

           webitel.api("DELETE", '/api/v2/gateway/' + id + '?domain=' + domainName, cb)
        };

        function create() {
            return {
                id: null,
                name: null,
                type: null,
                domain: null,
                profile: null,
                params: [],
                'var': [],
                ivar: [],
                ovar: [],
                attr: {}
            }
        }

        function createListItem (id, name, domain, state, data, profile) {
            return {
                id: id || null,
                name: name || "",
                domain: domain || null,
                state: state || "",
                data: data || "",
                profile: profile || "",
                reg: profile ? true : false
            }
        }

        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove,
            template: template,
            replaceParams: replaceParams,
            getVar: getVar
        }
    }]);
});