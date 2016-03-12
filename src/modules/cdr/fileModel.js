/**
 * Created by s.fedyuk on 16.02.2016.
 */
define(["app"], function(app) {

    app.factory("fileModel", ["webitel", function(webitel) {

        function getFiles(call_uuid, cb) {
            webitel.cdr("GET", "/api/v2/files/" + call_uuid + "?type=all", cb);
        };

        function getUri (id, name, fileName, type) {
            var uri = webitel.connection._cdr + "/api/v2/files/" +
                id + "?access_token=" + webitel.connection.session.token +
                "&x_key=" + webitel.connection.session.key;
            if (name)
                uri += "&name=" + name + "&file_name=" + fileName + "_" + name + "." + type;
            return uri;
        };

        function getJsonObject(call_uuid, cb) {
            var body = {};
            body.columns = {};
            body.fields = {};

            body.filter = {"variables.uuid": call_uuid};
            body.sort = {};
            body.limit = 1;

            body = JSON.stringify(body);

            webitel.cdr("POST", "/api/v2/cdr/searches/", body, cb);
        };

        return {
            getFiles: getFiles,
            getUri: getUri,
            getJsonObject: getJsonObject
        }
    }]);
});