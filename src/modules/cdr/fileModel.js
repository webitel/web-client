/**
 * Created by s.fedyuk on 16.02.2016.
 */
define(["app"], function(app) {

    app.factory("fileModel", ["webitel", function(webitel) {

        function getFiles(call_uuid, cb) {
            webitel.cdr("GET", "/api/v2/files/" + call_uuid + "?type=all", cb);
        }

        function updateFile(domain, params, cb) {
            if (!params.uuid)
                return cb(new Error("Bad uuid file"));

            if (!params.id)
                return cb(new Error("Bad id file"));

            if (!params.data)
                return cb(new Error("Bad update data file"));

            webitel.cdr("PUT", "/api/v2/files/" + params.uuid + "/" + params.id + "?domain=" + domain, params.data, cb);
        }

        function getUri (id, name, fileName, type) {
            var uri = webitel.connection._cdr + "/api/v2/files/" +
                id + "?access_token=" + webitel.connection.session.token +
                "&x_key=" + webitel.connection.session.key;
            if (name)
                uri += "&name=" + name + "&file_name=" + fileName + "_" + name + "." + type;
            return uri;
        };

        function getJsonObject(uuid, cb) {
            webitel.cdr("GET", "/api/v2/cdr/" + uuid + "?leg=a", cb);
        }

        function getLegB(uuid, cb) {
            webitel.cdr("GET", "/api/v2/cdr/" + uuid + "?leg=b", cb);
        }

        return {
            getFiles: getFiles,
            getUri: getUri,
            updateFile: updateFile,
            getJsonObject: getJsonObject,
            getLegB: getLegB
        }
    }]);
});