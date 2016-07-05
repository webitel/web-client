/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('DialerModel', ["webitel", function (webitel) {

        var COLUMNS_LIST = 'columns=_id,name,type,priority,state,_cause,nextTick';


        function listMembers (domainName, dialerId, option, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

             if (!dialerId)
                return cb(new Error("DialerId is required."));

            var page = option.page || 1;

            var _q = '?&domain=' + domainName + '&page=' + page;

            if (option.limit)
                _q += '&limit=' + option.limit;

            var sortKey = Object.keys(option.sort || {})[0];
            if (sortKey)
                _q += '&sort=' +  (sortKey !='_endCause' ? sortKey.replace('_', '.')  : sortKey) + '=' + option.sort[sortKey];

            if (option.columns) {
                _q += '&columns=';
                angular.forEach(option.columns, function (v) {
                    _q += v + ',';
                });

            }
            _q += '&filter=';
            angular.forEach(option.filter, function (v, k, i) {
                if (k == 'communications_number' || k == 'name' || k == '_endCause')
                    v = '^' + v;
                _q += /^_/.test(k) ? k + '=' + v + ',' :  k.replace('_', '.') + '=' + v + ',';
            });


            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members' + _q, function(err, res) {
                var queues = res.data || res.info;
                angular.forEach(queues, function (item) {
                    item.enable = item.enable == 'true';
                });
                return cb && cb(err, queues);
            });
        }

        function countMembers (domainName, dialerId, option, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));


            var _q = '?&domain=' + domainName;

            _q += '&filter=';
            angular.forEach(option.filter, function (v, k, i) {
                if (k == 'communications_number' || k == 'name' || k == '_endCause')
                    v = '^' + v;
                _q += /^_/.test(k) ? k + '=' + v + ',' :  k.replace('_', '.') + '=' + v + ',';
            });


            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members/count' + _q, function(err, res) {
                var queues = res.data || res.info;
                angular.forEach(queues, function (item) {
                    item.enable = item.enable == 'true';
                });
                return cb && cb(err, queues);
            });
        }

        function itemMember (domainName, dialerId, id, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            if (!id)
                return cb(new Error("Id is required."));

            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members/' + id + '?domain=' + domainName, function(err, res) {
                var member = res.data || res.info;
                member._variables = [];
                angular.forEach(member.variables, function (v, k) {
                    member._variables.push({
                        key: k,
                        value: v
                    })
                });
                return cb && cb(err, member);
            });
        }

        function removeMember (domainName, dialerId, id, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            if (!id)
                return cb(new Error("Id is required."));

            webitel.api('DELETE', '/api/v2/dialer/' + dialerId + '/members/' + id + '?domain=' + domainName, function(err, res) {
                var member = res.data || res.info;
                return cb && cb(err, member);
            });
        }
        function aggregateMember (domainName, dialerId, aggregateArray, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            if (!aggregateArray || !aggregateArray.length)
                return cb(new Error("Bad aggregate data"));

            webitel.api('POST', '/api/v2/dialer/' + dialerId + '/members/aggregate' + '?domain=' + domainName, JSON.stringify(aggregateArray), function(err, res) {
                var member = res.data || res.info;
                return cb && cb(err, member);
            })
        }

        function updateMember (domainName, dialerId, id, member, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            var data = parseMember(member);
            
            if (data.communications.length < 1)
                return cb(new Error('Bad communication'));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/members/' + id + '?&domain=' + domainName, data, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function addMember(domainName, dialerId, member, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            var data = parseMember(member);

            if (data.communications.length < 1)
                return cb(new Error('Bad communication'));

            webitel.api('POST', '/api/v2/dialer/' + dialerId + '/members?&domain=' + domainName, data, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function parseMember(memberData) {
            var member = createMember(null, memberData);

            angular.forEach(memberData._variables, function (item) {
                if (item.key && item.value)
                    member.variables[item.key] = item.value
            });

            angular.forEach(memberData.communications, function (item) {
                var comm = createCommunication(item);
                if (comm)
                    member.communications.push(comm)
            });

            return member;
        }

        function list (domainName, page, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            //TODO pagination
            page = 1;
            webitel.api('GET', '/api/v2/dialer?' + COLUMNS_LIST + '&limit=1000&page=' + page + '&domain=' + domainName, function(err, res) {
                var queues = res.data || res.info;
                //angular.forEach(queues, function (item) {
                //    item.enable = item.enable == 'true';
                //});
                return cb && cb(err, queues);
            });
        };

        function parseDialer (domainName, data) {
            var dialer = create(domainName, data);
            angular.forEach(data._variables, function (item) {
                if (item.key && item.value)
                    dialer.variables[item.key] = item.value
            });

            return dialer
        };

        function add (data, cb) {
            var dialer = parseDialer(data.domain, data);

            if (!dialer.name) {
                return cb(new Error("Bad dialer name"));
            }
            if (!dialer.calendar || !dialer.calendar.id) {
                return cb(new Error("Bad calendar"));
            }
            if (!dialer.type) {
                return cb(new Error("Bad type dialer"));
            }
            webitel.api('POST', '/api/v2/dialer?domain=' + dialer.domain, dialer, function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, res.data && res.data.insertedIds[0]);
            });
        };

        function item (id, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/dialer/' + id + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                data._variables = [];

                angular.forEach(data.variables, function (val, key) {
                    data._variables.push({
                        key: key,
                        value: val
                    })
                });
                return cb && cb(err, data);
            });
        };

        function update (id, domainName, diffColumns, dialer, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));

            var data = angular.copy(parseDialer(domainName, dialer));


            webitel.api('PUT', '/api/v2/dialer/' + id + '?&domain=' + domainName, data, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function setState(id, domainName, newState, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));

            webitel.api('PUT', '/api/v2/dialer/' + id + '/state/' + newState + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function remove (id, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('DELETE', '/api/v2/dialer/' + id + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function removeMulti (dialerId, filter, domainName, cb) {
            if (!domainName)
                return dialerId(new Error("Domain is required."));
            if (!dialerId)
                return cb(new Error("Dialer is required."));


            webitel.api('DELETE', '/api/v2/dialer/' + dialerId + '/members?&domain=' + domainName, JSON.stringify(filter), function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        };

        function create (domain, option) {
            option = option || {};
            var calendar = option.calendar ? {id: option.calendar.id, name: option.calendar.name} : {};
            var skills = [];
            if (option && option.skills) {
                angular.forEach(option.skills, function (i) {
                    skills.push(i.text)
                });
            }

            return {
                "domain" : domain || "",
                "name" : option.name || "",
                "description" : option.description ||  "",
                "state" : +option.state || 0,
                "type" : option.type,
                "priority" : angular.isNumber(option.priority) ? option.priority : 1,
                "active" : typeof option.active == 'boolean' ? option.active : false,
                "calendar" : calendar,
                "parameters" : {
                    "limit" : angular.isNumber(option.parameters && option.parameters.limit) ? option.parameters.limit : 30,
                    "minBillSec" : angular.isNumber(option.parameters && option.parameters.minBillSec) ? option.parameters.minBillSec : 10,
                    "originateTimeout" : angular.isNumber(option.parameters && option.parameters.originateTimeout) ? option.parameters.originateTimeout : 60,
                    "avgProgressSec" : angular.isNumber(option.parameters && option.parameters.avgProgressSec) ? option.parameters.avgProgressSec : 20,
                    "maxTryCount" : angular.isNumber(option.parameters && option.parameters.maxTryCount) ? option.parameters.maxTryCount : 5,
                    "intervalTryCount" : angular.isNumber(option.parameters && option.parameters.intervalTryCount) ? option.parameters.intervalTryCount : 60,
                    "wrapUpTime" : angular.isNumber(option.parameters && option.parameters.wrapUpTime) ? option.parameters.wrapUpTime : 60,
                    'waitingForResultStatus': option.parameters && option.parameters.waitingForResultStatus
                },
                "variables" : {},
                "skills" : skills,
                "resources" : angular.isArray(option.resources) ? option.resources : [],
                "strategy" : option.strategy || "myStrategy",
                "agents" : angular.isArray(option.agents) ? option.agents : [],
                "agentSkills" : angular.isArray(option.agentSkills) ? option.agentSkills : [],
                "owners" : angular.isArray(option.owners) ? option.owners : [],
                "_cf": option._cf || []
            }
        };

        function createMember(dialer, option) {
            return {
                "name": option.name || "" ,
                "dialer": dialer,
                "priority": angular.isNumber(option.priority) ? option.priority : 0,
                "timezone": option.timezone || "",
                "variables": {},
                "communications": []
            }
        };

        function createCommunication (option) {
            if (!option.number) return false;
            return {
                "number": option.number || "",
                "priority": angular.isNumber(option.priority) ? option.priority : 0,
                "status": 0,
                "state": 0,
            }
        };

        return {
            list: list,
            item: item,
            remove: remove,
            create: create,
            add: add,
            update: update,
            setState: setState,

            members: {
                list: listMembers,
                count: countMembers,
                add: addMember,
                item: itemMember,
                create: createMember,
                update: updateMember,
                remove: removeMember,
                aggregate: aggregateMember,
                removeMulti: removeMulti
            }
        }
    }]);
});