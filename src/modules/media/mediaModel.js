/**
 * Created by i.navrotskyj on 23.02.2016.
 */
'use strict';

/**
         app.get('/api/v2/media/:type?', require('../../middleware/media').get);
         app.get('/api/v2/media/:type/:id', require('../../middleware/media').stream);
         app.post('/api/v2/media/searches', require('../../middleware/media').searches);
         app.post('/api/v2/media/:type?', require('../../middleware/media').post);
         app.post('/api/v2/media/local', require('../../middleware/media').postLocal);
         app.delete('/api/v2/media/:type/:name', require('../../middleware/media').delRecord);
         app.put('/api/v2/media/:type/:id', require('../../middleware/media').put);
 */

define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('MediaModel', ["webitel", function (webitel) {

        function list (domainName, cb) {
            if (!domainName)
                return cb(new Error("Domain is required."));
            // TODO pagination
            webitel.cdr('GET', '/api/v2/media?limit=1000&domain=' + domainName, function (err, res) {
                if (err)
                    return cb(err);

                return cb(null, res.data);
            });
        };

        function remove(id, type,  domainName, cb) {
            if (!id)
                return cb(new Error("Bad file name"));

            if (!domainName)
                return cb(new Error("Bad domain name"));

            if (!type)
                return cb(new Error("Bad type"));

            webitel.cdr("DELETE", '/api/v2/media/' + type + '/' + id + '?domain=' + domainName, cb);
        }

        return {
            list: list,
            remove: remove
        }
    }]);
});