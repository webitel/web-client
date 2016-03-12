/**
 * Created by i.navrotskyj on 03.02.2016.
 */
'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('AcdModel', ["webitel", function (webitel) {


        function list (domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/callcenter/queues?domain=' + domainName, function(err, res) {
                var queues = res.data || res.info;
                angular.forEach(queues, function (item) {
                    item.enable = item.enable == 'true';
                });
                return cb && cb(err, queues);
            });
        };

        function item (id, domainName, cb) {
            //api.get('/api/v2/callcenter/queues/:name', queueItem);
            if (!id)
                return cb(new Error("Bad queue id"));

            if (!domainName)
                return cb(new Error("Bad queue domain"));

            webitel.api("GET", '/api/v2/callcenter/queues/' + id + '?domain=' + domainName, function (err, res) {
                if (err)
                    return cb(err);
                var queue = res.data || res.info;
                angular.forEach(
                    ['max-wait-time', 'max-wait-time-with-no-agent', 'max-wait-time-with-no-agent-time-reached',
                    'discard-abandoned-after'],
                    function (key) {
                        if (queue[key])
                            return queue[key] = +queue[key];
                    }
                );
                queue['abandoned-resume-allowed'] = queue['abandoned-resume-allowed'] == 'true';
                queue.enable = queue.enabled == 'true';
                cb(null, queue);
            });
        };

        var params = ['abandoned-resume-allowed', 'discard-abandoned-after', 'max-wait-time', 'max-wait-time-with-no-agent',
            'max-wait-time-with-no-agent-time-reached', 'moh-sound', 'strategy', 'time-base-score', 'description'];

        function add (queue, domainName, cb) {
            var request = {
                name: queue.id,
                params: []
            };

            angular.forEach(params, function (name) {
                if (queue.hasOwnProperty(name))
                    request.params.push(name + '=' +
                        (typeof queue[name] == 'string' ?  ("'" + queue[name] + "'") : queue[name].toString()));
            });

            if (!queue.id || /\s/.test(queue.id))
                return cb(new Error("Bad queue name"));

            if (request.params.length < 1)
                return cb(new Error("Bad queue parameters"));

            if (!domainName)
                return cb(new Error("Bad queue domain"));

            webitel.api('POST', '/api/v2/callcenter/queues?domain=' + domainName, request, cb)
        };

        function update(id, domainName, diffAttr, cb) {
           if (!id)
            return cb(new Error("Bad queue name"));

            if (diffAttr && diffAttr.hasOwnProperty('enable'))
                delete diffAttr.enable;

           if (Object.keys(diffAttr).length < 1)
            return cb(new Error("No changes."));
            
           if (!domainName)
            return cb(new Error("Bad domain name."));
            
           var request = {};
           angular.forEach(diffAttr, function (val, key) {
               if (~params.indexOf(key))
                    request[key] = val.toString()
                ;
           });

           webitel.api("PUT", '/api/v2/callcenter/queues/' + id +'?domain=' + domainName, request, cb)
        };

        function remove(id, domainName, cb) {
            if (!id)
                return cb(new Error("Bad queue name."));
            webitel.api('DELETE', '/api/v2/callcenter/queues/' + id +'?domain=' + domainName, cb)
        };

        function listTiers(queueId, domainName, cb) {
            if (!queueId)
                return cb(new Error("Queue id is required."));
            // TODO rename in ENGINE and KIBANA !!! prior CRITICAL
            webitel.api('GET', '/api/v2/callcenter/queues/' + queueId + '/tiers_?domain=' + domainName, function(err, res) {
                return cb && cb(err, res.data || res.info);
            });
        };


        function setLvl(queueId, tierId, domainName, lvl, cb) {
            if (!queueId || !tierId || !domainName)
                return cb(new Error("Bad tier id, domain or queue"));

            if (isNaN(+lvl))
                return cb(new Error("Bad position"));

            tierId = tierId.split('@')[0];

            var request = {
                level: +lvl
            };
            //api.put('/api/v2/callcenter/queues/:queue/tiers/:agent/level', setTierLevel);
            return webitel.api("PUT", '/api/v2/callcenter/queues/' + queueId + '/tiers/' + tierId + '/level?domain=' + domainName,
                request, cb);
        };

        function setPos(queueId, tierId, domainName, pos, cb) {
            if (!queueId || !tierId || !domainName)
                return cb(new Error("Bad tier id, domain or queue"));

            if (isNaN(+pos))
                return cb(new Error("Bad position"));

            tierId = tierId.split('@')[0];

            var request = {
                position: +pos
            };
            // api.put('/api/v2/callcenter/queues/:queue/tiers/:agent/position', setTierPosition);
            return webitel.api("PUT", '/api/v2/callcenter/queues/' + queueId + '/tiers/' + tierId + '/position?domain=' + domainName,
                request, cb);
        };

        function addTier(queueId, tierId, domainName, cb) {
            //api.post('/api/v2/callcenter/queues/:queue/tiers', createTier);
            if (!queueId || !tierId || !domainName)
                return cb(new Error("Bad tier id, domain or queue"));

            var request = {
                agent: tierId
            };
            webitel.api("POST", '/api/v2/callcenter/queues/' + queueId + '/tiers?domain=' + domainName, request, cb);
        };

        function removeTier(queueId, tierId, domainName, cb) {
            //api.delete('/api/v2/callcenter/queues/:queue/tiers/:agent', deleteTier);
            if (!queueId || !tierId || !domainName)
                return cb(new Error("Bad tier id, domain or queue"));

            webitel.api("DELETE", '/api/v2/callcenter/queues/' + queueId + '/tiers/' + tierId + '?domain=' + domainName, cb);
        };

        function setState(queueId, enabled, domainName, cb) {
            //api.put('/api/v2/callcenter/queues/:name/:state', queueSetState);
            if (!queueId || !domainName)
                return cb(new Error("Bad queue id, domain"));

            var state = enabled ? 'enable' : 'disable';

            webitel.api("PUT", '/api/v2/callcenter/queues/' + queueId + '/' + state + '?domain=' + domainName, cb);
        }

        function create () {
            return {
                id: null,
                enable: false,
                'abandoned-resume-allowed': false,
                'discard-abandoned-after': 0,
                'max-wait-time': 0,
                'max-wait-time-with-no-agent': 120,
                'max-wait-time-with-no-agent-time-reached': 5,
                'moh-sound': '$${hold_music}',
                'strategy': 'longest-idle-agent',
                'time-base-score': 'queue',
                'description': ''
            }
        }

        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove,
            listTiers: listTiers,
            setLvl: setLvl,
            setPos: setPos,
            addTier: addTier,
            removeTier: removeTier,
            setState: setState,
        }
    }]);
});