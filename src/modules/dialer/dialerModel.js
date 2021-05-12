/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('DialerModel', ["webitel", function (webitel) {

        var COLUMNS_LIST = 'columns=_id,name,type,priority,state,_cause,stats.active,stats.callCount';

        var CODE_RESPONSE_ERRORS = ["UNALLOCATED_NUMBER", "NO_ROUTE", "MEMBER_EXPIRED", "INVALID_NUMBER_FORMAT", "NETWORK_OUT_OF_ORDER", "OUTGOING_CALL_BARRED", "SERVICE_UNAVAILABLE", "CHAN_NOT_IMPLEMENTED", "SERVICE_NOT_IMPLEMENTED", "INCOMPATIBLE_DESTINATION", "MANDATORY_IE_MISSING", "PROGRESS_TIMEOUT", "GATEWAY_DOWN"];
        var CODE_RESPONSE_RETRY = ["NO_ROUTE_DESTINATION", "DESTINATION_OUT_OF_ORDER", "USER_BUSY", "CALL_REJECTED", "NO_USER_RESPONSE", "NO_ANSWER", "SUBSCRIBER_ABSENT", "NUMBER_CHANGED", "NORMAL_UNSPECIFIED", "NORMAL_CIRCUIT_CONGESTION", "ORIGINATOR_CANCEL", "LOSE_RACE", "USER_NOT_REGISTERED"];
        var CODE_RESPONSE_OK = ["NORMAL_CLEARING"];
        var CODE_RESPONSE_MINUS_PROBE = ["RECOVERY_ON_TIMER_EXPIRE", "NORMAL_TEMPORARY_FAILURE"];

        var ALL_CODE = [].concat(CODE_RESPONSE_ERRORS, CODE_RESPONSE_RETRY, CODE_RESPONSE_OK, CODE_RESPONSE_MINUS_PROBE);

        var mapColumns = {
            _endCause: function (v) {
                return {
                    $regex: '^' + v
                };
            },
            _lock: function (v) {
                if (v === 'true') {
                    return {$ne: null}
                } else {
                    return null;
                }
            },
            communications_number: function (v) {
                if (v[0] === '+') {
                    v = '\\' + v;
                }
                return {
                    $regex: '^' + v
                };
            },
            communications_priority: function (v) {
                return +v;
            },
            communications_type: function (v) {
                return {
                    $regex: '^' + v
                };
            },
            communications_state: function (v) {
                return +v;
            },
            communications__probe: function (v) {
                return +v
            },
            name: function (v) {
                return {
                    $regex: '^' + v
                };
            },
            priority: function (v) {
                return +v;
            }
        };

        function listMembers (domainName, dialerId, option, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

             if (!dialerId)
                return cb(new Error("DialerId is required."));


            var page = option.page || 1;
            var _q = ["domain=" + domainName, "page=" + page];

            if (option.limit)
                _q.push("limit=" + option.limit);

            var sortKey = Object.keys(option.sort || {})[0];
            if (sortKey) {
                var sort = {};
                // TODO
                if (/^communications_/.test(sortKey)) {
                    sort[sortKey.replace('_', '.')] = option.sort[sortKey];
                } else {
                    sort[sortKey] = option.sort[sortKey];
                }

                _q.push("sort=" + encodeURIComponent(JSON.stringify(sort)))
            }

            if (option.columns) {
                var col = {};
                angular.forEach(option.columns, function (v) {
                    col[v] =  1
                });
                _q.push("columns=" + encodeURIComponent(JSON.stringify(col)))

            }

            if (Object.keys(option.filter).length > 0) {
                _q.push("filter=" + encodeURIComponent(JSON.stringify(parseFilter(option.filter))))
            }

            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members?' + _q.join('&'), function(err, res) {
                var queues = res.data || res.info;
                angular.forEach(queues, function (item) {
                    item.enable = item.enable == 'true';
                });
                return cb && cb(err, queues);
            });
        }

        function parseFilter (filter) {
            var _f = {};
            angular.forEach(filter, function (i, key) {
                if (mapColumns.hasOwnProperty(key)) {
                    var name = (key !== '_endCause' && key !== '_lock') ? key.replace('_', '.') : key;
                    _f[name] = mapColumns[key](i)
                }
            });
            return _f;
        }

        function countMembers (domainName, dialerId, option, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));


            var _q = ["domain=" + domainName];

            if (Object.keys(option.filter).length > 0) {
                _q.push("filter=" + encodeURIComponent(JSON.stringify(parseFilter(option.filter))))
            }

            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members/count?' + _q.join('&'), function(err, res) {
                return cb && cb(err, res.data || res.info);
            });
        }

        function countEndMembers (domainName, dialerId, from, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            if (!from)
                return cb(new Error("From date is required."));


            var _q = ["domain=" + domainName];

            _q.push("filter=" + encodeURIComponent(JSON.stringify({
                    _endCause: {$ne: null},
                    createdOn: {$gte: from},
                    callSuccessful: {$ne: true},
                    communications: {$elemMatch: {stopCommunication: {$ne: true}}}
                })));

            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/members/count?' + _q.join('&'), function(err, res) {
                return cb && cb(err, res.data || res.info);
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

        function listHistory (domainName, dialerId, options, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            var page = 1;
            var limit = 200;

            if (options.page)
                page = options.page;

            if (options.limit)
                limit = options.limit;

            var sort = JSON.stringify({createdOn: -1});


            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/history?limit=' + limit + '&page=' + page +
                '&domain=' + domainName + '&sort=' + sort, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
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

            var body = {};
            if (filter && Object.keys(filter).length > 0) {
                body = parseFilter(filter);
            }

            webitel.api('DELETE', '/api/v2/dialer/' + dialerId + '/members?&domain=' + domainName, JSON.stringify(body), function(err, res) {
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
                "callResult": option.callResult,
                "domain" : domain || "",
                "name" : option.name || "",
                "description" : option.description ||  "",
                "state" : +option.state || 0,
                "type" : option.type,
                "priority" : angular.isNumber(option.priority) ? option.priority : 1,
                "active" : typeof option.active === 'boolean' ? option.active : false,
                "calendar" : calendar,
                "playbackFile" : option.playbackFile,
                "communications" : option.communications,
                "parameters" : {
                    "maxLocateAgentSec": angular.isNumber(option.parameters && option.parameters.maxLocateAgentSec) ? option.parameters.maxLocateAgentSec : 10,
                    "limit" : angular.isNumber(option.parameters && option.parameters.limit) ? option.parameters.limit : 30,
                    "cps" : angular.isNumber(option.parameters && option.parameters.cps) ? option.parameters.cps : 2,
                    "minBillSec" : angular.isNumber(option.parameters && option.parameters.minBillSec) ? option.parameters.minBillSec : 10,
                    "originateTimeout" : angular.isNumber(option.parameters && option.parameters.originateTimeout) ? option.parameters.originateTimeout : 60,
                    "maxTryCount" : angular.isNumber(option.parameters && option.parameters.maxTryCount) ? option.parameters.maxTryCount : 5,
                    "intervalTryCount" : angular.isNumber(option.parameters && option.parameters.intervalTryCount) ? option.parameters.intervalTryCount : 60,
                    "wrapUpTime" : angular.isNumber(option.parameters && option.parameters.wrapUpTime) ? option.parameters.wrapUpTime : 60,
                    "predictAdjust" : angular.isNumber(option.parameters && option.parameters.predictAdjust) ? option.parameters.predictAdjust : 150,
                    "predictStartCallCount" : angular.isNumber(option.parameters && option.parameters.predictStartCallCount) ? option.parameters.predictStartCallCount : 200,
                    "predictStartBridgedCount" : angular.isNumber(option.parameters && option.parameters.predictStartBridgedCount) ? option.parameters.predictStartBridgedCount : 10,
                    "targetPredictiveSilentCalls" : angular.isNumber(option.parameters && option.parameters.targetPredictiveSilentCalls) ? option.parameters.targetPredictiveSilentCalls : 2.5,
                    "maxPredictiveSilentCalls" : angular.isNumber(option.parameters && option.parameters.maxPredictiveSilentCalls) ? option.parameters.maxPredictiveSilentCalls : 3,
                    'waitingForResultStatus': option.parameters && option.parameters.waitingForResultStatus,
                    'recordSession': (option.parameters && option.parameters.recordSession) === undefined ? true : option.parameters.recordSession,
                    'eternalQueue': (option.parameters && option.parameters.eternalQueue),
                    'retryAbandoned': (option.parameters && option.parameters.retryAbandoned),
                    'retriesByNumber': (option.parameters && option.parameters.retriesByNumber),
                    'oneDayTask': (option.parameters && option.parameters.oneDayTask)
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
                    "allowNotSure": amd.allowNotSure,
                    "maximumWordLength": amd.maximumWordLength || 5000,
                    "maximumNumberOfWords": amd.maximumNumberOfWords || 3,
                    "betweenWordsSilence": amd.betweenWordsSilence || 50,
                    "minWordLength": amd.minWordLength || 100,
                    "totalAnalysisTime": amd.totalAnalysisTime || 5000,
                    "silenceThreshold": amd.silenceThreshold || 256,
                    "afterGreetingSilence": amd.afterGreetingSilence || 800,
                    "greeting": amd.greeting || 1500,
                    "initialSilence": amd.initialSilence || 2500,
                    "playbackFile": amd.playbackFile || null,
                    "beforePlaybackFileTime": amd.beforePlaybackFileTime || 1000,
                    "silenceNotSure": amd.silenceNotSure || false
                },
                "causesError": causesError,
                "causesRetry": causesRetry,
                "causesOK": causesOK,
                "causesMinus": causesMinus,
                "agentStrategy": option.agentStrategy,
                "numberStrategy": option.numberStrategy,
                "variables" : {},
                "skills" : skills,
                "membersStrategy" : option.membersStrategy || null,
                "autoResetStats" : typeof option.autoResetStats == 'boolean' ? option.autoResetStats : false,
                "resources" : angular.isArray(option.resources) ? option.resources : [],
                "agents" : angular.isArray(option.agents) ? option.agents : [],
                "owners" : angular.isArray(option.owners) ? option.owners : [],
                "_cf": option._cf || [],
                "_cfDiagram": option._cfDiagram
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
                "status": angular.isNumber(option.status) ? option.status : 0,
                "state": angular.isNumber(option.state) ? option.state : 0,
                "description": option.description || ""
            }
        }

        function resetMembers(dialerId, domainName, log, from, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("Dialer is required."));

            if (!from)
                return cb(new Error("From date is required."));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/members/reset?&domain=' + domainName + '&_log=' + (log === true) + '&from=' + from, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });
        }

        function terminateMember(domainName, dialerId, memberId, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!memberId)
                return cb(new Error("Id is required."));

            if (!dialerId)
                return cb(new Error("DialerId is required."));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/members/' + memberId +
                '/terminate?&domain=' + domainName, null, function(err, res) {
                var data = res.data || res.info;
                return cb && cb(err, data);
            });

        }

        function resetProcess(dialerId, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));
            if (!dialerId)
                return cb(new Error("Dialer is required."));


            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/reset?domain=' + domainName, {resetProcess: true, resetAgents: true}, cb)
        }

        function cleanStatistic(dialerId, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));
            if (!dialerId)
                return cb(new Error("Dialer is required."));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/reset?domain=' + domainName, {resetStats: true}, cb)
        }

        function templateList(dialerId, option, cb) {
            if(!option.domain)
                return cb(new Error("Domain is required."));
            if(!dialerId)
                return cb(new Error("Dialer is required."));

            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/templates' + buildQuery(option), function(err, res) {
                return cb && cb(err, res);
            });
        }

        function templateItem(dialerId, templateId, domainName, cb) {
            if(!domainName)
                return cb(new Error("Domain is required."));
            if(!dialerId)
                return cb(new Error("Dialer is required."));
            if(!templateId)
                return cb(new Error("Template is required."));

            webitel.api('GET', '/api/v2/dialer/' + dialerId + '/templates/' + templateId + '?domain=' + domainName, function(err, res) {
                return cb && cb(err, res);
            });
        }

        function addTemplate(dialerId, data, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("Dialer is required."));

            if (!data)
                return cb(new Error("Data is required."));

            webitel.api('POST', '/api/v2/dialer/' + dialerId + '/templates?domain=' + domainName, data, function(err, res) {
                return cb && cb(err, res);
            });
        }

        function updateTemplate(dialerId, data, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("Dialer is required."));

            if (!data.id)
                return cb(new Error("Template Id is required."));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/templates/' + data.id + '?domain=' + domainName, data, function(err, res) {
                return cb && cb(err, res);
            });
        }

        function sqlStart(dialerId, templateId, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("Dialer is required."));

            if (!templateId)
                return cb(new Error("Template Id is required."));

            webitel.api('PUT', '/api/v2/dialer/' + dialerId + '/templates/' + templateId + '/execute?domain=' + domainName, {}, function(err, res) {
                return cb && cb(err, res);
            });
        }

        function sqlStop(dialerId, templateId, processId, domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            if (!dialerId)
                return cb(new Error("Dialer is required."));

            if (!templateId)
                return cb(new Error("Template Id is required."));

            if (!processId)
                return cb(new Error("Process Id is required."));

            webitel.api(
                'PUT',
                '/api/v2/dialer/' + dialerId + '/templates/' + templateId + '/end/' + processId + '?domain=' + domainName
                    + '&success=false&message=abort',
                function(err, res) {
                    return cb && cb(err, res);
                }
            );
        }

        function deleteTemplate(dialerId, templateId, domainName, cb) {
            if(!domainName)
                return cb(new Error("Domain is required."));
            if(!dialerId)
                return cb(new Error("Dialer is required."));
            if(!templateId)
                return cb(new Error("Template is required."));

            webitel.api('DELETE', '/api/v2/dialer/' + dialerId + '/templates/' + templateId + '?domain=' + domainName, cb);
        }

        function buildQuery (option) {
            var res = "?";
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res.substring(0, res.length - 1);
        }

        return {
            list: list,
            item: item,
            remove: remove,
            create: create,
            add: add,
            update: update,
            setState: setState,
            resetProcess: resetProcess,
            cleanStatistic: cleanStatistic,
            listHistory: listHistory,
            ALL_CODE: ALL_CODE,
            CODE_RESPONSE_ERRORS: CODE_RESPONSE_ERRORS,
            CODE_RESPONSE_RETRY: CODE_RESPONSE_RETRY,
            CODE_RESPONSE_OK: CODE_RESPONSE_OK,
            CODE_RESPONSE_MINUS_PROBE: CODE_RESPONSE_MINUS_PROBE,

            members: {
                list: listMembers,
                count: countMembers,
                countEndMembers: countEndMembers,
                add: addMember,
                item: itemMember,
                create: createMember,
                update: updateMember,
                remove: removeMember,
                aggregate: aggregateMember,
                removeMulti: removeMulti,
                reset: resetMembers,
                terminate: terminateMember,
                templateList: templateList,
                addTemplate: addTemplate,
                updateTemplate: updateTemplate,
                deleteTemplate: deleteTemplate,
                templateItem: templateItem,
                sqlStart: sqlStart,
                sqlStop: sqlStop
            }
        }
    }]);
});
