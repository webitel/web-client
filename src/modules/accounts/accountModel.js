/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';
// TODO
define(['app', 'scripts/webitel/utils', 'modules/acd/acdModel'], function (app, utils) {
    app.factory('AccountModel', ["webitel", 'AcdModel', function (webitel, AcdModel) {

        var cacheDomain = new utils.WebitelArrayCollection('name');
        var cacheAccount = new utils.WebitelArrayCollection('name');

        var notShowAttr = ['a1-hash', 'cc-agent-type', 'dial-string', 'http-allowed-api', 'jsonrpc-allowed-event-channels',
            'jsonrpc-allowed-fsapi', 'jsonrpc-allowed-methods', 'jsonrpc-password', 'variable_user_context', 'variable_w_domain',
            'domain', 'variable_user_scheme', 'id'];


        function list (domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/accounts?domain=' + domainName, cb);
        };

        function item (domainName, id, cb) {
            if (!domainName || !id)
                return cb(new Error("Domain and id is required."));

            webitel.api('GET', '/api/v2/accounts/' + id + '?domain=' + domainName, function (err, res) {
                if (err)
                    return cb(err);

                var obj = res.data || res.info;
                var user = createEmpty();
                user.id = id;

                angular.forEach(obj, function (value, key) {
                    if (~notShowAttr.indexOf(key))
                        return;

                    if (/^variable_/.test(key) && key !== 'variable_account_role' && key !== 'variable_effective_caller_id_name' && key != 'variable_skills') {
                        user.variables.push({
                            key: key.replace(/variable_/, ''),
                            value: value
                        });
                    } else if (key === 'cc-agent-contact') {
                        user[key] = +parseAgentContact(value);
                    } else if (key === 'variable_skills') {
                        user['variable_skills'] = value.split(',').map(function (i) { return {text: i}});
                    } else {
                        user[key] = utils.strToType(value);
                    }
                });

                return cb(err, user);
            });
        };

        function parseAgentContact (str) {
            return str && /originate_timeout=([^,|}]*)/.exec(str)[1]
        }

        function skillsToString(arr) {
            var res = [];
            if (arr && arr.length > 0) {
                angular.forEach(arr, function (i) {
                    res.push(i.text);
                });
            }
            return res.join(',');
        }

        function parseToAgentContact (time, id, domain, name) {
            //"{originate_timeout=123,presence_id=100@10.10.10.144}{webitel_call_uuid=${create_uuid()},sip_invite_domain=10.10.10.144}${sofia_contact(*/100@10.10.10.144)},${verto_contact(100@10.10.10.144)}"
            if (!+time)
                time = '';

            if (!name)
                name = '';

            return "'{originate_timeout=" + time +
                // ",agent_name=\"" + name + "\"" +
                // ",api_on_answer=\\\'uuid_setvar ${uuid} agent_name " + name  + "\\\'"+
                ",presence_id=" + id + "@" + domain + "}{webitel_call_uuid=${create_uuid()},sip_invite_domain=" + domain +
                "}${sofia_contact(*/" + id + "@" + domain +
                ")},${verto_contact(" + id + "@" + domain + ")}'";
        }

        function add (account, cb) {
            // ?domain=
            var request = {
                "login": account.id,
                "role": 'user',
                "password": account.password,
                "parameters": [],
                "variables": ["account_role=" + account.variable_account_role, "effective_caller_id_name='" + account.variable_effective_caller_id_name + "'"]
            };
            if (!request.login)
                return cb(new Error("Id number is required."));

            if (!account.domain)
                return cb(new Error("Domain is required."));

            if (!account.variable_account_role)
                return cb(new Error("Role is required."));
            
            var _v = [];
            angular.forEach(account.variables, function (item) {
                _v.push(item.key + "='" + (item.value || '') + "'")
            });

            if (account.variable_skills && account.variable_skills.length > 0) {
                request.variables.push('\'' + 'skills=' + skillsToString(account.variable_skills) + '\'')
            }

            request.variables = request.variables.concat(_v);
            
            angular.forEach(account, function (value, key) {
                if (~notShowAttr.indexOf(key) || key === 'variables' || key === 'variable_effective_caller_id_name'
                    || key == 'variable_account_role' || key === '_new' || key === 'variable_skills')
                    return;

                if (key === 'cc-agent-contact')
                    return request.parameters.push(key + '=' + parseToAgentContact(value, account.id, account.domain, account.variable_effective_caller_id_name));
                request.parameters.push(key + '=' + value);
            });
            webitel.api('POST', '/api/v2/accounts?domain=' + account.domain, request, cb)
        };

        function update(account, domainName, diffAttr, remVar, cb) {
            // if (Object.keys(diffAttr).length < 1 && remVar && remVar.length < 1)
            //     return cb(new Error("No changes."));

            var id = account.id;
            if (!id)
                return cb(new Error("Bad account id"));

            var request = {
                "parameters": [],
                "variables": []
            };
            angular.forEach(remVar, function (key) {
                request.variables.push(key + '=')
            });

            request.variables.push('skills='  + '\'' + skillsToString(account.variable_skills) + '\'');

            var agentDialString = null;

            angular.forEach(diffAttr, function (value, key) {
                if (key === 'variables') {
                    angular.forEach(account.variables, function (attr, i) {
                        request.variables.push(attr.key + '=\'' + attr.value + '\'');
                    });
                    return;
                }

                if (key === 'variable_skills') {
                    return;
                }
                if (key === 'cc-agent-contact' || key === 'variable_effective_caller_id_name')
                    agentDialString = 'cc-agent-contact=' + parseToAgentContact(account['cc-agent-contact'], id, domainName, account.variable_effective_caller_id_name);


                if (/^variable_/.test(key))
                    return request.variables.push(key.replace(/^variable_/, '') + '=\'' + value + '\'');

                return request.parameters.push(key + '=\'' + value + '\'');
            });

            if (agentDialString) {
                request.parameters.push(agentDialString);
            }

            webitel.api('PUT', '/api/v2/accounts/'+ id + '?domain=' + domainName, request, cb)
        };
        
        function setStatus(id, domainName, status, desc, cb) {
            var request = {
                "parameters": ["status=" + status]
            };

            if (status !== "ONHOOK" && desc) {
                request.parameters[0] += ('(' + desc + ')');
            }
            webitel.api('PUT', '/api/v2/accounts/'+ id + '?domain=' + domainName, request, cb)
        }

        function remove(id, domainName, cb) {
            webitel.api('DELETE', '/api/v2/accounts/'+ id + '?domain=' + domainName, cb)
        };

        function getRoles(cb) {
            webitel.api('GET', '/api/v2/acl/roles', function (err, res) {
                return cb(err, res && res.info && res.info.roles);
            });
        };

        function getTiers (id, domainName, cb) {
            if (!id)
                return cb(new Error("Bad agent id"));

            if (!domainName)
                return cb(new Error("Bad domain name"));

            webitel.api('GET', '/api/v2/accounts/' + id + '/tiers?domain=' + domainName, function (err, res) {

                return cb(err, res && (res.data || res.info))
            });
        };

        function getStatistic(domain, body, cb) {
            if (!domain)
                return cb(new Error("Bad domain name"));
            webitel.cdr("POST", "/api/v2/statistic/accounts?domain=" + domain, JSON.stringify(body), function(err, res){
                return cb(err, res)
            });
        }

        function createEmpty() {
            return {
                id: null,
                password: null,
                variables: [],

                "cc-agent": false,
                "cc-agent-busy-delay-time": null,
                "cc-agent-contact": null,
                "cc-agent-max-no-answer": null,
                "cc-agent-no-answer-delay-time": null,
                "cc-agent-reject-delay-time": null,
                "cc-agent-wrap-up-time": null,


                "variable_account_role": "",
                "variable_skills": [],
                //"variable_default_language": "",
                "variable_effective_caller_id_name": "",
                'vm-password': "",
                'vm-enabled': false,
                'webitel-extensions': ""
            }
        }

        function create () {
            return {
                id: null,
                password: null,
                variables: [],

                "cc-agent": false,
                "cc-agent-busy-delay-time": 15,
                "cc-agent-contact": 15,
                "cc-agent-max-no-answer": 3,
                "cc-agent-no-answer-delay-time": 10,
                "cc-agent-reject-delay-time": 15,
                "cc-agent-wrap-up-time": 10,


                "variable_account_role": "",
                "variable_skills": [],
                //"variable_default_language": "",
                "variable_effective_caller_id_name": "",
                'vm-password': "",
                'vm-enabled': false,
                'webitel-extensions': ""
            }
        }

        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove,
            getRoles: getRoles,
            getTierList: getTiers,
            setStatus: setStatus,
            getStatistic: getStatistic,
            getQueueList: AcdModel.list,
            addTier: AcdModel.addTier,
            removeTier: AcdModel.removeTier,
            getAgentParams: AcdModel.getAgentParams
        }
    }]);
});