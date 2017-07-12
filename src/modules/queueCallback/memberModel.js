
define(['app', 'scripts/webitel/utils'], function (app, utils) {
    app.factory('MemberCallbackModel', ["webitel", function (webitel) {

        function list(option, callbackId, cb) {
             if (!option.domain)
             return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/callback/' + callbackId + '/members' + buildQuery(option), function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, res.data || res.info);
            });
        }

        function buildQuery (option) {
            var res = "?";
            angular.forEach(option, function (val, key) {
                res += key + '=' + val + '&'
            });
            return res.substring(0, res.length - 1);
        };

        function add(data, callbackId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data||!data.number)
                return cb(new Error("Bad request data"));
            delete data._new;
            webitel.api('POST', '/api/v2/callback/'+callbackId+'/members?domain=' + domain, data, cb);
        };

        function update(data, callbackId, memberId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data||!data.number)
                return cb(new Error("Bad request data"));

            var requestData = angular.copy(data);
            delete requestData.comments;

            webitel.api('PUT', '/api/v2/callback/'+callbackId+'/members/'+memberId+'?domain=' + domain, requestData, cb);
        };

        function addComment(data, callbackId, memberId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!data||!data.text)
                return cb(new Error("Bad request data"));

            webitel.api('POST', '/api/v2/callback/'+callbackId+'/members/'+memberId+'/comments?domain=' + domain, data, cb);
        };

        function updateComment(data, callbackId, memberId, commentId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!commentId||!memberId||!callbackId)
                return cb(new Error("Id is reqired."));

            if (!data||!data.text)
                return cb(new Error("Bad request data"));

            webitel.api('PUT', '/api/v2/callback/'+callbackId+'/members/'+memberId+'/comments/'+commentId+'?domain=' + domain, data, cb);
        };

        function removeComment(callbackId, memberId, commentId, domain, cb) {

            if (!domain)
                return cb(new Error("Bad domain"));

            if (!commentId||!memberId||!callbackId)
                return cb(new Error("Id is required."));

            webitel.api('DELETE', '/api/v2/callback/'+callbackId+'/members/'+memberId+'/comments/'+commentId+'?domain=' + domain, cb);
        };

        function item (id, callbackId, domain, cb) {
            if (!id)
                return cb(new Error("Id is required."));

            if (!domain)
                return cb(new Error("Domain is required."));

            webitel.api('GET', '/api/v2/callback/' + callbackId + '/members/' + id + '?domain=' + domain, function (err, res) {
                if (err)
                    return cb(err);
                var qCallback = res && res.data;
                return cb(null, qCallback);
            })
        }

        function remove (id, callbackId, domain, cb) {
            if (!domain)
                return cb(new Error("Domain is required."));

            if (!id)
                return cb(new Error("Id is required."));
            webitel.api('DELETE', '/api/v2/callback/' + callbackId +'/members/'+ id + '?domain=' + domain, cb);
        };
        return {
            addComment: addComment,
            updateComment: updateComment,
            removeComment: removeComment,
            remove: remove,
            update: update,
            add: add,
            list: list,
            item: item
        }
    }])
})