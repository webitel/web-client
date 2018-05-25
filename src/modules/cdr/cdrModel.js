/**
 * Created by i.navrotskyj on 01.03.2016.
 */
define(["app", "config"], function(app, config) {

    app.factory("CdrModel", ["webitel", "$localStorage", "notifi", "$q", function(webitel, $localStorage, notifi, $q) {

        var defaultMapColumn = [
            {
                "name": "created_time",
                "type": "timestamp",
                "caption": "Call start time"
            },
            {
                "name": "direction",
                "type": "string",
                "caption": "Direction"
            },
            {
                "name": "caller_id_number",
                "type": "string",
                "caption": "Caller number"
            },
            {
                "name": "destination_number",
                "type": "string",
                "caption": "Destination number"
            },
            {
                "name": "extension",
                "type": "string",
                "caption": "Extension"
            },
            {
                "name": "duration",
                "type": "integer",
                "caption": "Duration"
            },
            {
                "name": "billsec",
                "type": "integer",
                "caption": "Bill, sec"
            },
            {
                "name": "hangup_cause",
                "type": "string",
                "caption": "Hangup cause"
            }
        ];

        var cacheColumn = null;

        function getDomainName() {
            return (webitel.connection.session.domain ?
                webitel.connection.session.domain : "root")
        }

        function setMetadataColumns(data, domain, cb) {
            webitel.api('POST', '/api/v2/metadata/cdr?domain=' + getDomainName(), JSON.stringify(data), cb)
        }

        function updateGridColumns(columns, cb) {
            setMetadataColumns(angular.copy(columns), getDomainName(), function (err, res) {
                if (err)
                    return notifi.error(err, 5000);

                var item = res && res.data;
                if (item && angular.isArray(item.data)) {
                    cacheColumn = item.data;
                    return cb(null, item.data)
                } else {
                    cacheColumn = defaultMapColumn;
                    return cb(null, defaultMapColumn)
                }
            })
        }

        function getDefaultColumnsSettings() {
            return defaultMapColumn;
        }

        function listGridColumns(cb) {
            if (cacheColumn) {
                return cb(null, cacheColumn, 1)
            }
            webitel.api('GET', '/api/v2/metadata/cdr?domain=' + getDomainName(), function (err, res) {
                if (err) {
                    if (err.statusCode !== 404 && err.statusCode !== 403) {
                        notifi.error(err, 5000);
                        return cb(err);
                    }
                    cacheColumn = defaultMapColumn;
                    return cb(null, defaultMapColumn)
                }
                var item = res && res.data;
                if (item && angular.isArray(item.data)) {
                    cacheColumn = item.data;
                    return cb(null, item.data)
                } else {
                    cacheColumn = defaultMapColumn;
                    return cb(null, defaultMapColumn)
                }
            });
        }


        function getMapColumns (reset) {
            // TODO API!!!
            if ($localStorage.cdrColumns && !reset)
                return $localStorage.cdrColumns;

            $localStorage.cdrColumns = mapColumn;
            return mapColumn;
        }

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
            if (!id || id === 'uuid')
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
                return availableDefColumns[item.name] = 1;
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

        function getElasticData(pageNumber, limit, columns, filter, qs, sort, scroll, cb) {
            getElasticDataFromLeg(pageNumber, limit, columns, filter, qs, sort, scroll, null, cb)
        }

        function getLegB(legA, columns, filter, sort, cb) {
            if (!angular.isArray(filter)) {
                filter = [];
            }

            filter.push({
                "term": {
                    "parent_uuid": legA
                }
            });
            getElasticDataFromLeg(0, 100, columns, filter, "*", sort, null, "b", cb)
        }

        function getElasticDataFromLeg(pageNumber, limit, columns, filter, qs, sort, scroll, leg, cb) {
            var body = {};
            body.columnsDate = angular.copy(columns.other);
            angular.forEach(columns.date, function (val) {
                body.columnsDate.push(val);
            });

            if (!~body.columnsDate.indexOf("uuid")) {
                body.columnsDate.push("uuid");
            }
            if (!~body.columnsDate.indexOf("parent_uuid")) {
                body.columnsDate.push("parent_uuid");
            }
            if (!~body.columnsDate.indexOf("pinned_items")) {
                body.columnsDate.push("pinned_items");
            }

            body.columns = [];
            body.includes = ["recordings"];
            body.pageNumber = pageNumber;
            body.limit = limit;
            body.query = qs || "*";
            body.filter = filter || {};
            body.sort = sort;

            if (columns.domain)
                body.domain = columns.domain;

            if (scroll)
                body.scroll = scroll;

            // TODO BUG!
            body = JSON.stringify(body);
            webitel.cdr("POST", "/api/v2/cdr/text?leg=" + (leg ? leg : ""), body, function (err, res, statusCode) {
                if (err) {
                    err.statusCode = statusCode;
                    return cb(err);
                };
                return cb(null, parseElasticResponse(res.hits.hits), res.hits.total, res._scroll_id);
            });
        };

        function scrollElasticData(scroll, scrollId, cb) {
            var body = {
                scrollId: scrollId,
                scroll: scroll
            };

            webitel.cdr("POST", "/api/v2/cdr/text/scroll", body, function (err, res, statusCode) {
                if (err) {
                    err.statusCode = statusCode;
                    return cb(err);
                }
                return cb(null, parseElasticResponse(res.hits.hits), res.hits.total);
            });
        }

        function parseElasticResponse (res) {
            var data = [];
            var t = {};
            angular.forEach(res, function (item) {
                t = {};
                angular.forEach(item.fields, function (v, k) {
                    t[k] = v
                });
                t._index = item._index;

                if (item._source && item._source.recordings) {
                    t.recordings = item._source.recordings;
                    t._selectedRecordings = 0;
                }

                data.push(t);
            });
            return data;
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

        function pinItem(uuid, index, domain, cb){
            webitel.cdr('PUT', '/api/v2/cdr/'+uuid+'/pinned?domain='+domain+'&index='+index, '{}', cb);
        }

        function unpinItem(uuid, index, domain, cb){
            webitel.cdr('DELETE', '/api/v2/cdr/'+uuid+'/pinned?domain='+domain+'&index='+index, cb);
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
        }
        
        function removeCdr(uuid, cb) {
            if (!uuid)
                return cb(new Error('Bad request parameters.'));

            webitel.cdr("DELETE", "/api/v2/cdr/" + uuid, cb);
        }

        function getAllLegsFromA (id, domain, cb) {
            if (!id)
                return cb(new Error('Bad request parameters.'));

            webitel.cdr("GET", "/api/v2/cdr/" + id + "/b?domain=" + domain, cb);
        }

        function getStatistic(domain, body, cb){
            if (!body)
                return cb(new Error('Bad request parameters.'));
            webitel.cdr("POST", "/api/v2/cdr/text?domain=" + domain, JSON.stringify(body), cb);
        }
        return {
            getStatistic: getStatistic,
            getData: getData,
            getElasticData: getElasticData,
            getElasticDataFromLeg: getElasticDataFromLeg,
            scrollElasticData: scrollElasticData,
            getCount: getCount,
            remove: remove,
            removeCdr: removeCdr,
            pinItem: pinItem,
            unpinItem: unpinItem,
            getLegB: getLegB,
            getAllLegsFromA: getAllLegsFromA,

            updateGridColumns: updateGridColumns,
            listGridColumns: listGridColumns,
            getDefaultColumnsSettings: getDefaultColumnsSettings

        }
    }]);
});