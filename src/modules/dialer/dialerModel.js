/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('DialerModel', ["webitel", function (webitel) {

        var COLUMNS_LIST = 'columns=_id,name,type,priority,state,_cause,stats.active,stats.callCount';

        var CODE_RESPONSE_ERRORS = ["UNALLOCATED_NUMBER", "NO_ROUTE", "MEMBER_EXPIRED", "INVALID_NUMBER_FORMAT", "NETWORK_OUT_OF_ORDER", "OUTGOING_CALL_BARRED", "SERVICE_UNAVAILABLE", "CHAN_NOT_IMPLEMENTED", "SERVICE_NOT_IMPLEMENTED", "INCOMPATIBLE_DESTINATION", "MANDATORY_IE_MISSING", "PROGRESS_TIMEOUT", "GATEWAY_DOWN"];
        var CODE_RESPONSE_RETRY = ["NO_ROUTE_DESTINATION", "DESTINATION_OUT_OF_ORDER", "USER_BUSY", "CALL_REJECTED", "NO_USER_RESPONSE", "NO_ANSWER", "SUBSCRIBER_ABSENT", "NUMBER_CHANGED", "NORMAL_UNSPECIFIED", "NORMAL_TEMPORARY_FAILURE", "NORMAL_CIRCUIT_CONGESTION", "ORIGINATOR_CANCEL", "LOSE_RACE", "USER_NOT_REGISTERED"];
        var CODE_RESPONSE_OK = ["NORMAL_CLEARING"];
        var CODE_RESPONSE_MINUS_PROBE = ["RECOVERY_ON_TIMER_EXPIRE"];

        var ALL_CODE = [].concat(CODE_RESPONSE_ERRORS, CODE_RESPONSE_RETRY, CODE_RESPONSE_OK, CODE_RESPONSE_MINUS_PROBE);

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
                if (member.expire)
                    member._expire = new Date(member.expire);
                
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
        // TODO BUGGGG!!!
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

            var url = '/api/v2/dialer/' + dialerId + '/members?domain=' + domainName;

            if (member.autoRun)
                url += '&autoRun=true';

            webitel.api('POST', url, data, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        }

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
        }

        function parseDialer (domainName, data) {
            var dialer = create(domainName, data);
            angular.forEach(data._variables, function (item) {
                if (item.key && item.value)
                    dialer.variables[item.key] = item.value
            });

            return dialer
        }

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
        }

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
                if (!data.causesError)
                    data.causesError = angular.copy(CODE_RESPONSE_ERRORS);

                if (!data.causesRetry)
                    data.causesRetry = angular.copy(CODE_RESPONSE_RETRY);

                if (!data.causesOK)
                    data.causesOK = angular.copy(CODE_RESPONSE_OK);

                if (!data.causesMinus)
                    data.causesMinus = angular.copy(CODE_RESPONSE_MINUS_PROBE);

                return cb && cb(err, data);
            });
        }

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
        }

        function setState(id, domainName, newState, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));

            webitel.api('PUT', '/api/v2/dialer/' + id + '/state/' + newState + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        }

        function remove (id, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('DELETE', '/api/v2/dialer/' + id + '?&domain=' + domainName, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        }

        function removeMulti (dialerId, filter, domainName, cb) {
            if (!domainName)
                return dialerId(new Error("Domain is required."));
            if (!dialerId)
                return cb(new Error("Dialer is required."));


            webitel.api('DELETE', '/api/v2/dialer/' + dialerId + '/members?&domain=' + domainName, JSON.stringify(filter), function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        }

        function _setCause(arr, def) {
            if (!arr)
                return def;

            var d = [];
            angular.forEach(arr, function (item) {
                d.push(item && item.text ? item && item.text : item);
            });
            return d;
        }

        function create (domain, option) {
            option = option || {};
            var calendar = option.calendar ? {id: option.calendar.id, name: option.calendar.name} : {};
            var skills = [];
            if (option && option.skills) {
                angular.forEach(option.skills, function (i) {
                    if (i)
                        skills.push(i.text)
                });
            }

            var causesError = _setCause(option.causesError, CODE_RESPONSE_ERRORS);
            var causesRetry = _setCause(option.causesRetry, CODE_RESPONSE_RETRY);
            var causesOK = _setCause(option.causesOK, CODE_RESPONSE_OK);
            var causesMinus = _setCause(option.causesMinus, CODE_RESPONSE_MINUS_PROBE);

            var amd = option.amd || {};
            return {
                "domain" : domain || "",
                "name" : option.name || "",
                "description" : option.description ||  "",
                "state" : +option.state || 0,
                "type" : option.type,
                "priority" : angular.isNumber(option.priority) ? option.priority : 1,
                "active" : typeof option.active == 'boolean' ? option.active : false,
                "calendar" : calendar,
                "playbackFile" : option.playbackFile,
                "communications" : option.communications,
                "parameters" : {
                    "limit" : angular.isNumber(option.parameters && option.parameters.limit) ? option.parameters.limit : 30,
                    "minBillSec" : angular.isNumber(option.parameters && option.parameters.minBillSec) ? option.parameters.minBillSec : 10,
                    "originateTimeout" : angular.isNumber(option.parameters && option.parameters.originateTimeout) ? option.parameters.originateTimeout : 60,
                    "avgProgressSec" : angular.isNumber(option.parameters && option.parameters.avgProgressSec) ? option.parameters.avgProgressSec : 20,
                    "maxTryCount" : angular.isNumber(option.parameters && option.parameters.maxTryCount) ? option.parameters.maxTryCount : 5,
                    "intervalTryCount" : angular.isNumber(option.parameters && option.parameters.intervalTryCount) ? option.parameters.intervalTryCount : 60,
                    "wrapUpTime" : angular.isNumber(option.parameters && option.parameters.wrapUpTime) ? option.parameters.wrapUpTime : 60,
                    "predictAdjust" : angular.isNumber(option.parameters && option.parameters.predictAdjust) ? option.parameters.predictAdjust : 150,
                    "targetPredictiveSilentCalls" : angular.isNumber(option.parameters && option.parameters.targetPredictiveSilentCalls) ? option.parameters.targetPredictiveSilentCalls : 2.5,
                    "maxPredictiveSilentCalls" : angular.isNumber(option.parameters && option.parameters.maxPredictiveSilentCalls) ? option.parameters.maxPredictiveSilentCalls : 3,
                    'waitingForResultStatus': option.parameters && option.parameters.waitingForResultStatus,
                    'recordSession': (option.parameters && option.parameters.recordSession) === undefined ? true : option.parameters.recordSession,
                    'eternalQueue': (option.parameters && option.parameters.eternalQueue)
                },
                "agentParams": {
                    "callTimeout": option.agentParams && option.agentParams.callTimeout,
                    "wrapUpTime": option.agentParams && option.agentParams.wrapUpTime,
                    "maxNoAnswer": option.agentParams && option.agentParams.maxNoAnswer,
                    "busyDelayTime": option.agentParams && option.agentParams.busyDelayTime,
                    "rejectDelayTime": option.agentParams && option.agentParams.rejectDelayTime,
                    "noAnswerDelayTime": option.agentParams && option.agentParams.noAnswerDelayTime
                },
                "amd": {
                    "enabled": amd.enabled,
                    "maximumWordLength": amd.maximumWordLength || 5000,
                    "maximumNumberOfWords": amd.maximumNumberOfWords || 3,
                    "betweenWordsSilence": amd.betweenWordsSilence || 50,
                    "minWordLength": amd.minWordLength || 100,
                    "totalAnalysisTime": amd.totalAnalysisTime || 5000,
                    "silenceThreshold": amd.silenceThreshold || 256,
                    "afterGreetingSilence": amd.afterGreetingSilence || 800,
                    "greeting": amd.greeting || 1500,
                    "initialSilence": amd.initialSilence || 2500
                },
                "causesError": causesError,
                "causesRetry": causesRetry,
                "causesOK": causesOK,
                "causesMinus": causesMinus,
                "agentStrategy": option.agentStrategy,
                "numberStrategy": option.numberStrategy,
                "variables" : {},
                "skills" : skills,
                "resources" : angular.isArray(option.resources) ? option.resources : [],
                "strategy" : option.strategy || "myStrategy",
                "agents" : angular.isArray(option.agents) ? option.agents : [],
                "agentSkills" : angular.isArray(option.agentSkills) ? option.agentSkills : [],
                "owners" : angular.isArray(option.owners) ? option.owners : [],
                "_cf": option._cf || []
            }
        }

        function createMember(dialer, option) {
            return {
                "name": option.name || "" ,
                "dialer": dialer,
                "priority": angular.isNumber(option.priority) ? option.priority : 0,
                "timezone": option.timezone || "",
                "variables": {},
                "communications": [],
                "expire": option.expire || null
            }
        }

        function createCommunication (option) {
            if (!option.number) return false;
            return {
                "number": option.number || "",
                "priority": angular.isNumber(option.priority) ? option.priority : 0,
                "type": option.type,
                "_range": option._range,
                "_probe": option._probe || 0,
                "status": angular.isNumber(option.status) ? option.status : 0,
                "state": angular.isNumber(option.state) ? option.state : 0,
                "description": option.description || ""
            }
        }
        
        function resetMembers(dialerId, domainName, log, cb) {
            if (!domainName)
                return dialerId(new Error("Domain is required."));
            if (!dialerId)
                return cb(new Error("Dialer is required."));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/members/reset?&domain=' + domainName + '&_log=' + (log === true), function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        }

        return {
            list: list,
            item: item,
            remove: remove,
            create: create,
            add: add,
            update: update,
            setState: setState,
            ALL_CODE: ALL_CODE,
            CODE_RESPONSE_ERRORS: CODE_RESPONSE_ERRORS,
            CODE_RESPONSE_RETRY: CODE_RESPONSE_RETRY,
            CODE_RESPONSE_OK: CODE_RESPONSE_OK,
            CODE_RESPONSE_MINUS_PROBE: CODE_RESPONSE_MINUS_PROBE,

            members: {
                list: listMembers,
                count: countMembers,
                add: addMember,
                item: itemMember,
                create: createMember,
                update: updateMember,
                remove: removeMember,
                aggregate: aggregateMember,
                removeMulti: removeMulti,
                reset: resetMembers
            }
        }
    }]);
});