/**
 * Created by i.navrotskyj on 01.03.2016.
 */
define(["app"], function(app) {

    app.factory("CdrModel", ["webitel", "$localStorage", function(webitel, $localStorage) {

        function getMapColumns () {
            // TODO API!!!
            if ($localStorage.cdrColumns)
                return $localStorage.cdrColumns;

            var mapColumn = {
                "callflow.caller_profile.caller_id_name": {
                    "type": "string",
                    "caption": "Caller name"
                },
                "callflow.caller_profile.caller_id_number": {
                    "type": "string",
                    "caption": "Caller number"
                },
                "callflow.caller_profile.destination_number": {
                    "type": "string",
                    "caption": "Destination number"
                },
                "callflow.times.created_time": {
                    "type": "timestamp",
                    "caption": "Created time"
                },
                "variables.billsec": {
                    "type": "integer",
                    "caption": "Billsec"
                },
                "variables.duration": {
                    "type": "integer",
                    "caption": "Duration"
                },
                "variables.webitel_direction": {
                    "type": "select",
                    "caption": "Direction",
                    "options": {
                        "select": [
                            "inbound",
                            "outbound",
                            "conference",
                            "internal",
                            "eavesdrop"
                        ]
                    }
                },
                "variables.hangup_cause": {
                    "type": "select",
                    "caption": "Hangup cause",
                    "options": {
                        "select": [
                            "CALL_REJECTED",
                            "DESTINATION_OUT_OF_ORDER",
                            "NORMAL_CLEARING",
                            "RECOVERY_ON_TIMER_EXPIRE",
                            "ORIGINATOR_CANCEL",
                            "USER_NOT_REGISTERED",
                            "UNALLOCATED_NUMBER",
                            "MANAGER_REQUEST",
                            "INCOMPATIBLE_DESTINATION",
                            "SYSTEM_SHUTDOWN",
                            "USER_BUSY",
                            "NO_ANSWER",
                            "USER_CHALLENGE",
                            "NO_ROUTE_DESTINATION",
                            "EXCHANGE_ROUTING_ERROR",
                            "INVALID_GATEWAY",
                            "LOSE_RACE",
                            "CHAN_NOT_IMPLEMENTED",
                            "SUBSCRIBER_ABSENT",
                            "NORMAL_UNSPECIFIED",
                            "MEDIA_TIMEOUT",
                            "INCOMING_CALL_BARRED",
                            "NONE",
                            "NORMAL_TEMPORARY_FAILURE",
                            "MANDATORY_IE_MISSING",
                            "UNKNOWN",
                            "ATTENDED_TRANSFER",
                            "INVALID_NUMBER_FORMAT",
                            "SERVICE_NOT_IMPLEMENTED",
                            "ALLOTTED_TIMEOUT"
                        ]
                    }
                },
                "callflow.times.answered_time": {
                    "type": "timestamp",
                    "caption": "Answered time",
                    "options": {
                        "detail": true
                    }
                },
                "callflow.times.bridged_time": {
                    "type": "timestamp",
                    "caption": "Bridged time",
                    "options": {
                        "detail": true
                    }
                },
                "callflow.times.hangup_time": {
                    "type": "timestamp",
                    "caption": "Hangup",
                    "options": {
                        "detail": true
                    }
                },
                "variables.domain_name": {
                    "type": "string",
                    "caption": "Domain",
                },
                "variables.uuid": {
                    "type": "string",
                    "caption": "UUID",
                    "noRender": true
                },
            };
            $localStorage.cdrColumns = mapColumn;
            return mapColumn;
        };

        function setMapColumn (col) {
            var cols = $localStorage.cdrColumns;
            cols[col.id] = {
                type: col.type,
                caption: col.caption,
                options: col.options
            };
        };

        function getMapColumn(id) {
            var col = $localStorage.cdrColumns[id];
            if (!col)
                return null;
            col.id = id;
            return col;
        };

        function removeMapColumn (id) {
            if (!id || id == 'variables.uuid')
                throw "Bad id";
            delete $localStorage.cdrColumns[id];
        };

        var Column = function(id, type, caption, option) {
            if (!id || !type || !caption)
                throw "Bad column parameters";

            this.id = id;
            this.type = type;
            this.caption = caption;
            this.options = option;
        };

        Column.prototype.save = function () {
            setMapColumn(this);
        };
        
        Column.prototype.getJson = function () {
            var _ = {};
            _[this.id] = {};
        };

        var availableColumns = function () {
            var availableDefColumns = {};

            angular.forEach(getMapColumns(), function (item, key) {
                return availableDefColumns[key] = 1;
            });
            return availableDefColumns;
        };

        function getData(pageNumber, limit, columns, filter, sort, cb) {
            var body = {};
            body.columns = columns; //availableColumns();
            body.pageNumber = pageNumber;
            body.limit = limit;
            body.filter = filter;
            body.sort = sort;

            // TODO BUG!
            body = JSON.stringify(body);

            webitel.cdr("POST", "/api/v2/cdr/searches", body, function (err, res) {
                if (err)
                    return cb(err);
                return cb(null, parseResponse(res));
            });
        }

        function convertResponseObject(data) {
            var result = {};
            doIt(data, "");
            return result;

            function doIt(data, s) {

                if (data && typeof data === "object") {
                    if (Array.isArray(data)) {
                        doIt(data[0], s);
                        //for (var i = 0; i < data.length; i++) {
                        //    doIt(data[i], s + "." + i);
                        //}
                    } else {
                        for (var p in data) {
                            doIt(data[p], s + "." + p);
                        }
                    }
                } else {
                    // todo
                    result[s.replace(/^./, '')] = data;
                }
            }
        };

        function parseResponse (res) {
            var data = [];
            var _st = Date.now();
            angular.forEach(res, function (item) {
                data.push(convertResponseObject(item))
            });

            console.debug('Parse response time: ', Date.now() - _st);
            return data;
        }

        function getCount(filter, cb) {

            var body = {};
            body.filter = filter;

            body = JSON.stringify(body);

            webitel.cdr("POST", "/api/v2/cdr/counts", body, cb);
        };


        function remove (id, domain, name, cb) {
            if (!id || !domain)
                return cb(new Error('Bad request parameters.'));

            webitel.cdr("DELETE", "/api/v2/files/" + id + "?db=true&domain=" + domain + "&name=" + name, cb);
        };

        return {
            getData: getData,
            getCount: getCount,
            availableColumns: availableColumns,
            mapColumn: getMapColumns,
            remove: remove,
            Column: Column,
            setMapColumn: setMapColumn,
            removeMapColumn: removeMapColumn,
            getMapColumn: getMapColumn,
        }
    }]);
});