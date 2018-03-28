/**
 * Created by igor on 15.04.16.
 */


define(['app', 'moment', 'jsZIP', 'async', 'modules/cdr/cdrModel', 'modules/cdr/fileModel', 'modules/cdr/exportPlugin', 'modules/cdr/libs/json-view/jquery.jsonview', 'css!modules/cdr/css/verticalTabs.css', 'css!modules/cdr/cdr.css'],
    function (app, moment, jsZIP, async) {

    app.controller('CDRCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CdrModel', 'fileModel', '$confirm',
        'TableSearch', '$timeout', 'cfpLoadingBar', '$q',
        function ($scope, webitel, $rootScope, notifi, CdrModel, fileModel, $confirm, TableSearch, $timeout, cfpLoadingBar, $q) {
            //$scope.queries = (localStorage.getItem('cdrQueries') && JSON.parse(localStorage.getItem('cdrQueries'))) || [];
            $scope.pinSearch = false;
            $scope.isLoading = false;
            $scope.$watch('isLoading', function (val) {
                if (val) {
                    cfpLoadingBar.start()
                } else {
                    cfpLoadingBar.complete()
                }
            });

            $scope.onChangeDate = function (val) {
                if (val)
                    $scope.applyFilter();
            };

            $scope.isOpenFilter = true;
            $scope.rowCollection = [];
            $scope.isCollapsed = true;
            var maxNodes = 40;
            $scope.activeRow;
            $scope.progressExport = 0;
            $scope.countExport = 0;
            $scope.exportProcessExcel = false;

            $scope.setSource = null;
            $scope.count = 0;

            $scope.canDeleteFile = webitel.connection.session.checkResource('cdr/files', 'd');
            $scope.canReadFile = webitel.connection.session.checkResource('cdr/files', 'r') || webitel.connection.session.checkResource('cdr/files', 'ro');
            $scope.canDeleteCDR = webitel.connection.session.checkResource('cdr', 'd');

            if (!webitel.connection.session.domain) {
                var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                    $scope.domain = domainName;
                    $scope.applyFilter();
                });
                $scope.domain = webitel.domain();

                $scope.$on('$destroy', function () {
                    changeDomainEvent();
                });
            };

            var defSettings = TableSearch.get('cdrElastic');
            if (defSettings) {
                $scope.queryString = defSettings.queryString || "";

                if (defSettings.startDate)
                    $scope.startDate = defSettings.startDate;
                if (defSettings.endDate)
                    $scope.endDate = defSettings.endDate;
            }

            $scope.$watch("[queryString,startDate,endDate]", function (newVal) {
                    TableSearch.set({
                        queryString: $scope.queryString,
                        startDate: $scope.startDate,
                        endDate: $scope.endDate
                    }, 'cdrElastic');
            }, true);

            $scope.$watch("[startDate,endDate]", function (newVal) {
                if($scope.panelStatistic){
                    $scope.getInboundStats();
                    $scope.getDirectionStats();
                    $scope.getAvgDurationStats();
                    $scope.getAbandoned();
                }
            }, true);

            $scope.$watch("domain", function (newVal) {
                $scope.panelStatistic = false;
            }, true);

            $scope.filter = "";
            $scope.legSearchA = true;
            $scope.legSearchB = false;

            $scope.setLegSearch = function (val) {
                $scope.applyFilter();
            };

            $scope.$watch("legSearchA", setLegSearch);
            $scope.$watch("legSearchB", setLegSearch);

            function setLegSearch(val, old) {

                if (val === old) return;

                if ($scope.legSearchA && $scope.legSearchB) {
                    $scope.legSearch = '*';
                } else if ($scope.legSearchB) {
                    $scope.legSearch = 'b'
                } else {
                    $scope.legSearch = 'a'
                }
                $scope.applyFilter();
            }

            $scope.mapColumns = [];
            $scope.columnsArr = [];
            $scope.columnsDateArr = [];
            
            function initColumns(columns) {
                $scope.mapColumns = columns;
                angular.forEach($scope.mapColumns, function (item, key) {
                    if (item.type === 'timestamp')
                        $scope.columnsDateArr.push(item.name);
                    else $scope.columnsArr.push(item.name);
                });
                $scope._initColumns = true;
                $timeout(function () {
                    $scope.$apply();
                })
            }
            $scope._initColumns = false;
            CdrModel.listGridColumns(function (err, columns) {
                if (err)
                    return;

                initColumns(columns)
            });


            $scope.dateOpenedControl = {
                start: false,
                end: false,
            };

            $scope.quickDateRange = {
                'Today': [moment().startOf('day'), moment().endOf('day')],
                'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
                'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            };

            $scope.setQuickDateRange = function (v) {
                $scope.startDate = v[0].toDate();
                $scope.endDate = v[1].toDate();
                $scope.applyFilter();
            };

            $scope.openDate = function ($event, attr) {
                angular.forEach($scope.dateOpenedControl, function (v, key) {
                    if (key !== attr)
                        $scope.dateOpenedControl[key] = false;
                });
                return $event.preventDefault(),
                    $event.stopPropagation(),
                    $scope.dateOpenedControl[attr] = !0
            };

            $scope.detailLoadingText = "";

            function setLoadingDetail(loading) {
                $scope.detailLoadingText = loading ?  "Loading ..." : "";
            }

            $scope.runExportCdr = function (fnExportCdr) {
                $scope.exportProcessExcel = true;
                var filter =  getFilter();
                fnExportCdr($scope.mapColumns, {domain: $scope.domain, other: $scope.columnsArr, date: $scope.columnsDateArr}, filter, $scope.queryString, $scope.sort, function (err) {
                    if (err)
                        notifi.error(err);
                    $scope.exportProcessExcel = false;
                });
            };
            
            $scope.runExportFiles = function (fnExport) {
                $scope.exportProcessExcel = true;
                var filter =  getFilter();
                fnExport(filter, $scope.queryString, $scope.sort, $scope.domain, function (err) {
                    if (err)
                        notifi.error(err);
                    $timeout(function () {
                        $scope.exportProcessExcel = false;
                    })
                });
            };
            
            $scope.removeCdrFromQuery = function () {
                if ($scope.isLoading) return;
                $confirm({text: 'Are you sure you want to delete ' + $scope.count + ' records ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        setDeleteProcess();
                    });
            };
            
            function setDeleteProcess() {
                $scope.isLoading = true;
                var _page = 0;
                var queryString = angular.copy($scope.queryString);
                var sort = {
                    "created_time": {
                        "order": "asc"
                    }
                };

                var filter =  getFilter();
                var deleted = 0;
                var allCount = +angular.copy($scope.count);

                function onError(err) {
                    $scope.isLoading = false;
                    $scope.loadingText = null;
                    apply();
                    return notifi.error(err);
                }

                function onEnd() {
                    $scope.isLoading = false;
                    $scope.loadingText = null;
                    apply();
                    notifi.info('Deleted ' + deleted + ' records.');
                }

                function apply() {
                    $timeout(function () {
                        $scope.applyFilter();
                    }, 1000)
                }

                function _getPart(cb) {

                    CdrModel.getElasticData(
                        null,
                        10000,
                        {other: ["uuid"], date: [], domain: $scope.domain},
                        filter,
                        queryString,
                        null,
                        null,
                        cb
                    );
                }
                
                function onData(err, data) {
                    if (err) {
                        return onError(err)
                    }

                    if (!data || data.length == 0)
                        return onEnd();

                    async.eachSeries(data,
                        function (item, cb) {
                            if (!item['uuid']) return cb();

                            CdrModel.removeCdr(item['uuid'], function (err, res) {
                                if (err && err.statusCode != 404) {
                                    return cb(err);
                                } else if (err) {
                                    deleted--;
                                }

                                $scope.loadingText = 'Delete ' + (++deleted) + '/' + allCount;
                                cb();
                            });

                        },
                        function (err) {
                            if (err) {
                                return onError(err)
                            }

                            if (deleted >= allCount) {
                                return onEnd();
                            }

                            setTimeout(() => _getPart(onData), 1000);
                        }
                    );
                }

                _getPart(onData);
                
                
            }

            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);

            if (!$scope.startDate) {
                $scope.startDate = today;
                $scope.endDate = new Date(today.getTime() + 86399900);
            }

            //$scope.testSource = null;
            $scope.applyFilter = function () {
                $scope.tableState.pagination.start = 0;
                // if($scope.queries.indexOf($scope.queryString) === -1) $scope.queries.push($scope.queryString);
                // localStorage.setItem('cdrQueries', JSON.stringify($scope.queries));
                if($scope.panelStatistic){
                    $scope.getInboundStats();
                    $scope.getDirectionStats();
                    $scope.getAvgDurationStats();
                    $scope.getAbandoned();
                }
                getData($scope.tableState);
            };
            $scope.resetFilter = function () {
                //$scope.filterAPI.resetFilter();
            };


            $scope.loadLegsB = function (row) {
                if (row.legs_b) {
                    //TODO
                    delete row.legs_b;
                    return;
                }
                row._loadB = true;
                CdrModel.getLegB(
                    row.uuid.toString(),
                    {domain: $scope.domain, other: $scope.columnsArr, date: $scope.columnsDateArr},
                    [
                        {"range": {
                                "created_time": {
                                    "gte": $scope.startDate.getTime(),
                                    "lte": $scope.endDate.getTime(),
                                    "format": "epoch_millis"
                                }
                            }}

                    ],
                    null,
                    (err, res) => {
                        row._loadB = false;
                        row.legs_b = res;
                    }
                );
            };

            function _getTypeFile(contentType) {

                switch (contentType) {
                    case 'application/pdf':
                        return 'pdf';
                    case 'audio/wav':
                        return 'wav';
                    case 'video/mp4':
                        return 'mp4';
                    case 'audio/mpeg':
                    default:
                        return 'mp3'

                }
            }

            $scope.onClosePlayer = function (a) {
                // TODO
            };

            $scope.pinItem = function(row) {
                var user = webitel.connection.session.username;
                if(row.pinned_items && ~row.pinned_items.indexOf(user)){
                    CdrModel.unpinItem(row["uuid"], row._index, $scope.domain, function(err, res){
                        if(err)
                            notifi.error(err);
                        row.pinned = false;
                        var userIndex = row.pinned_items.indexOf(user);
                        row.pinned_items.splice(userIndex, 1);
                        if($scope.pinSearch){
                            var i = $scope.rowCollection.indexOf(row);
                            $scope.rowCollection.splice(i, 1);
                        }
                    });
                } else {
                    CdrModel.pinItem(row["uuid"], row._index, $scope.domain, function(err, res){
                        if(err)
                            notifi.error(err);
                        row.pinned = true;
                        if(!angular.isArray(row.pinned_items)){
                            row.pinned_items = [];
                        }
                        row.pinned_items.push(user);
                    });
                }
            };

            $scope.setActiveFile = function (row, pos) {
                row._selectedRecordings = pos;
                $scope.openFile(row.recordings[pos])
            };

            //TODO...
            $scope.setLockFile = function (file) {
                var lock = file._lock !== true;
                var params = {
                    id: file._id,
                    uuid: file.uuid,
                    data: {
                        _lock: lock
                    }
                };

                fileModel.updateFile(file.domain, params, function (err, res) {
                    if (err)
                        return notifi.error(err, 3000);

                    file._lock = lock;
                });
            };

            $scope.openFile = function (file) {
                // TODO preview pdf
                file.uri = fileModel.getUri(file.uuid, file.name, file.createdOn, _getTypeFile(file['content-type']));
                if (file['content-type'] === "application/pdf")
                    return loadResource(file);
                play(file);
            };

            $scope.downloadFile = function (file) {
                file.uri = fileModel.getUri(file.uuid, file.name, file.createdOn, _getTypeFile(file['content-type']));
                loadResource(file)
            };

            $scope.openCdr = function (item) {
                showJsonPreview(item);
            };

            var deleteCdr = function (uuid) {
                $confirm({text: 'Are you sure you want to delete ' + uuid + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        CdrModel.removeCdr(uuid, function (err, res) {
                            if (err)
                                return notifi.error(err);

                            $scope.rowCollection.splice($scope.rowCollection.indexOf( $scope.activeRow), 1);
                            --$scope.count;
                        })
                    });
            };

            $scope.deleteCdr = deleteCdr;

            var deleteResource = function (file, files) {
                $confirm({text: 'Are you sure you want to delete ' + file.name + '.mp3 or .wav file ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        CdrModel.remove(file.uuid, file.domain, file.name, function (err, res) {
                            if (err)
                                return notifi.error(err);

                            for (var i = 0, len = files.length; i < len; i++)
                                if (files[i] === file)
                                    return files.splice(i, 1);

                        })
                    });
            };

            $scope.deleteResource = deleteResource;

            var loadResource = function (file) {
                var $a = document.createElement('a');
                $a.href = file.uri;
                $a.download = file.name;
                document.body.appendChild($a);
                $a.click();
                document.body.removeChild($a);
            };

            var play = function (file) {
                if (file["content-type"] === "video/mp4") {
                    var videoWindow = window.open("", file["uuid"], "width=800, height=600");
                    if (videoWindow) {
                        videoWindow.document.write(
                            '<video style="width: 100%; height: 100%" controls src="' + file['uri'] +'"></video>' +
                            '<style type="text/css">' +
                            'body { margin: 0; padding: 0; background: #e7ebee; }' +
                            '</style>'
                        );
                        win.focus();
                    }
                    return
                }
                $scope.setSource({
                    src: file.uri,
                    type: file["content-type"],
                    text: file.name + " (" + file.uuid + ")"
                }, true);
            };

            var showJsonPreview = function(row) {
                CdrModel.getAllLegsFromA(row.parent_uuid ? row.parent_uuid : row.uuid, $scope.domain, function (err, res) {
                    openJsonPreviewWindow(err, res, row.uuid)
                });
            };

            function openJsonPreviewWindow(err, res, defUuid) {
                if (err) {
                    return notifi.error(err, 5000)
                }

                var legA = res.leg_a;
                var legsB = res.legs_b || [];

                var id = legA.variables.uuid;

                var jsonWindow = window.open("", id, "width=800, height=600");

                if (jsonWindow) {
                    jsonWindow.cdrText = JSON.stringify(res, null, '\t');
                    jsonWindow.cdrLegs = [{
                        name: "Leg A",
                        val: legA
                    }];

                    jsonWindow.defUuid = defUuid.toString();

                    angular.forEach(legsB, function (item, k) {
                        jsonWindow.cdrLegs.push({
                            name: "Leg B_" + k,
                            val: item
                        })
                    });

                    jsonWindow.document.write(
                        '<link rel="stylesheet" type="text/css" href="modules/cdr/libs/json-view/jquery.jsonview.min.css" />' +
                        '<link rel="stylesheet" type="text/css" href="modules/cdr/window.css" />' +
                        '<link rel="stylesheet" type="text/css" href="../styles/bootstrap/bootstrap/bootstrap3.css"/>' +
                        '<body>' +
                            '<ul class="nav nav-tabs menu-legs">' +
                                '<li id="save-data" class="pull-right">' +
                                    '<a class="btn" id="save-json">Save</a>' +
                                '</li>' +
                            '</ul>' +
                            '<div  class="tab-content content-leg active">' +
                                '<div id="json-preview"></div>' +
                            '</div>' +
                            '<script src="bower_components/jquery/dist/jquery.min.js"></script>' +
                            '<script src="modules/cdr/libs/json-view/jquery.jsonview.js"></script>' +
                            '<script src="modules/cdr/window.js"></script>' +
                        '</body>'
                    );
                }
                else {
                    notifi.warn("Please, allow popup window!", 5000);
                    return;
                }
            }

            $scope.renderCell = function (value, cell) {
                if (cell.type === 'timestamp') {
                    if (!value || value === 0) return "-";

                    if (angular.isArray(value)) {
                        return value.map(function (i) {
                            return new Date(i).toLocaleString()
                        }).join('\n')
                    }

                    return new Date(value).toLocaleString()
                }

                if (angular.isArray(value)) {
                    return value.join('\n')
                }
                return value

            };

            $scope.changePanel = function (value) {
                $scope.panelStatistic = value;
                if(value){
                    $scope.getInboundStats();
                    $scope.getDirectionStats();
                    $scope.getAvgDurationStats();
                    $scope.getAbandoned();
                }
            };

            $scope.getInboundStats = function () {
                $scope.statsReq.answeredInbound.filter[0].range.created_time.gte = $scope.startDate.getTime();
                $scope.statsReq.answeredInbound.filter[0].range.created_time.lte = $scope.endDate.getTime();
                $scope.statsReq.answeredInbound.query = $scope.queryString;
                $scope.statsReq.answeredInbound.domain = $scope.domain;
                CdrModel.getStatistic($scope.domain, $scope.statsReq.answeredInbound, function(err, res){
                    if (err)
                        return notifi.error(err);

                    $scope.answered_total = res.hits.total;
                    $scope.avg_talk_time = res.aggregations && res.aggregations["2"].value && res.aggregations["2"].value.toFixed(1);
                    var tmpDate = new Date(1970, 0, 0, 0, 0, 0);
                    if(res.aggregations && res.aggregations["3"].value) tmpDate.setSeconds(res.aggregations && res.aggregations["3"].value);
                    $scope.total_talk_time = tmpDate.toTimeString().substr(0,8);
                    $scope.uniqueInboundChart.data = angular.copy($scope.unique);
                    if(res.aggregations && res.aggregations["4"] && res.aggregations["4"].buckets){
                        res.aggregations["4"].buckets.forEach(function (item) {
                            $scope.uniqueInboundChart.data[1].values.push({x:item.key, y:item.doc_count});
                            $scope.uniqueInboundChart.data[0].values.push({x:item.key, y:item["3"].value});
                        });
                    }
                });
            };

            $scope.getDirectionStats = function () {
                $scope.statsReq.direction.filter[0].bool.must[0].range.created_time.gte = $scope.startDate.getTime();
                $scope.statsReq.direction.filter[0].bool.must[0].range.created_time.lte = $scope.endDate.getTime();
                $scope.statsReq.direction.query = $scope.queryString;
                $scope.statsReq.direction.domain = $scope.domain;
                $scope.outbound = 0;
                CdrModel.getStatistic($scope.domain, $scope.statsReq.direction, function(err, res){
                    if (err)
                        return notifi.error(err);
                    $scope.callDirection.data = [];
                    $scope.causeByAttemptChart.data = [];
                    if(res.aggregations && res.aggregations["2"] && res.aggregations["2"].buckets){
                        res.aggregations["2"].buckets.forEach(function (item) {
                            $scope.callDirection.data.push({
                                key: item.key,
                                y: item.doc_count
                            });
                            if(item.key === 'outbound') $scope.outbound = item.doc_count;
                        });
                    }
                    if(res.aggregations && res.aggregations["7"] && res.aggregations["7"].buckets){
                        res.aggregations["7"].buckets.forEach(function (item) {
                            $scope.causeByAttemptChart.data.push({
                                key: item.key,
                                y: item.doc_count
                            });
                        });
                    }
                });
            };

            $scope.getAvgDurationStats = function () {
                $scope.statsReq.avgDurationByExtension.filter[0].bool.must[0].range.created_time.gte = $scope.startDate.getTime();
                $scope.statsReq.avgDurationByExtension.filter[0].bool.must[0].range.created_time.lte = $scope.endDate.getTime();
                $scope.statsReq.avgDurationByExtension.query = $scope.queryString;
                $scope.statsReq.avgDurationByExtension.domain = $scope.domain;
                CdrModel.getStatistic($scope.domain, $scope.statsReq.avgDurationByExtension, function(err, res){
                    if (err)
                        return notifi.error(err);
                    $scope.avgDuration.data = angular.copy($scope.avg);
                    if(res.aggregations && res.aggregations["2"] && res.aggregations["2"].buckets){
                        res.aggregations["2"].buckets.forEach(function (item) {
                            if(item["1"].value){
                                $scope.avgDuration.data[0].values.push({
                                    label: item.key,
                                    value: item["1"].value
                                })
                            }
                            if(item["3"].value){
                                $scope.avgDuration.data[2].values.push({
                                    label: item.key,
                                    value: item["3"].value
                                })
                            }
                            if(item["4"].value){
                                $scope.avgDuration.data[1].values.push({
                                    label: item.key,
                                    value: item["4"].value
                                })
                            }
                        });
                        $scope.avgDuration.data.forEach(function (item, index) {
                            if (item.values.length === 0){
                                $scope.avgDuration.data.splice(index, 1);
                            }
                        })
                    }
                });
            };

            $scope.getAbandoned = function () {
                $scope.statsReq.abandoned.filter[0].range.created_time.gte = $scope.startDate.getTime();
                $scope.statsReq.abandoned.filter[0].range.created_time.lte = $scope.endDate.getTime();
                $scope.statsReq.abandoned.domain = $scope.domain;
                $scope.statsReq.abandoned.query = $scope.queryString;
                CdrModel.getStatistic($scope.domain, $scope.statsReq.abandoned, function(err, res){
                    if (err)
                        return notifi.error(err);
                    $scope.abandonedChart.data = [];
                    if(res.aggregations && res.aggregations["2"] && res.aggregations["2"].buckets){
                        $scope.abandonedChart.data.push({
                            key: "<= 5 sec",
                            y: res.aggregations["2"].buckets["<= 5 sec"].doc_count
                        });
                        $scope.abandonedChart.data.push({
                            key: "<= 20 sec",
                            y: res.aggregations["2"].buckets["<= 20 sec"].doc_count
                        });
                        $scope.abandonedChart.data.push({
                            key: "> 20 sec",
                            y: res.aggregations["2"].buckets["> 20 sec"].doc_count
                        });
                    }
                });
            };

            $scope.statsReq = {
                direction:{
                    "size": 0,
                    "_source": {
                        "excludes": []
                    },
                    "aggs": {
                        "2": {
                            "terms": {
                                "field": "direction",
                                "size": 5,
                                "order": {
                                    "_count": "desc"
                                }
                            }
                        },
                        "7": {
                            "terms": {
                                "field": "hangup_cause",
                                "size": 10,
                                "order": {
                                    "_count": "desc"
                                }
                            }
                        }
                    },
                    "version": true,
                    "docvalue_fields": [
                        "callflow.times.answered_time",
                        "callflow.times.bridged_time",
                        "callflow.times.created_time",
                        "callflow.times.hangup_time",
                        "callflow.times.hold_accum_time",
                        "callflow.times.last_hold_time",
                        "callflow.times.profile_created_time",
                        "callflow.times.progress_media_time",
                        "callflow.times.progress_time",
                        "callflow.times.resurrect_time",
                        "callflow.times.transfer_time",
                        "created_time",
                        "queue.answered_time",
                        "queue.exit_time",
                        "queue.joined_time",
                        "recordings.createdOn"
                    ],
                    "query": $scope.queryString,
                    "filter": [
                        {
                            "bool": {
                                "must": [
                                    {
                                        "range": {
                                            "created_time": {
                                                "gte": $scope.startDate.getTime(),
                                                "lte": $scope.endDate.getTime(),
                                                "format": "epoch_millis"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
                answeredInbound:
                    {
                        "size": 0,
                        "_source": {
                            "excludes": []
                        },
                        "aggs": {
                            "2": {
                                "avg": {
                                    "script": {
                                        "inline": "doc['billsec'].value",
                                        "lang": "painless"
                                    }
                                }
                            },
                            "3": {
                                "sum": {
                                    "script": {
                                        "inline": "doc['billsec'].value",
                                        "lang": "painless"
                                    }
                                }
                            },
                            "4": {
                                "date_histogram": {
                                    "field": "created_time",
                                    "interval": "3h",
                                    // "time_zone": "Europe/Helsinki",
                                    "min_doc_count": 1
                                },
                                "aggs": {
                                    "3": {
                                        "cardinality": {
                                            "field": "caller_id_number"
                                        }
                                    }
                                }
                            }
                        },
                        "version": true,
                        "docvalue_fields": [
                            "callflow.times.answered_time",
                            "callflow.times.bridged_time",
                            "callflow.times.created_time",
                            "callflow.times.hangup_time",
                            "callflow.times.hold_accum_time",
                            "callflow.times.last_hold_time",
                            "callflow.times.profile_created_time",
                            "callflow.times.progress_media_time",
                            "callflow.times.progress_time",
                            "callflow.times.resurrect_time",
                            "callflow.times.transfer_time",
                            "created_time",
                            "queue.answered_time",
                            "queue.exit_time",
                            "queue.joined_time",
                            "recordings.createdOn"
                        ],
                        "query": $scope.queryString,
                        "filter":[
                            {
                                "range": {
                                    "created_time": {
                                        "gte": $scope.startDate.getTime(),
                                        "lte": $scope.endDate.getTime(),
                                        "format": "epoch_millis"
                                    }
                                }
                            },
                            {
                                "match_phrase": {
                                    "direction": {
                                        "query": "inbound"
                                    }
                                }
                            }
                        ]
                    },
                abandoned:
                    {
                        "size": 0,
                        "_source": {
                            "excludes": []
                        },
                        "aggs": {
                            "2": {
                                "filters": {
                                    "filters": {
                                        "<= 5 sec": {
                                            "query_string": {
                                                "query": "billsec:<=5",
                                                "analyze_wildcard": true,
                                                "default_field": "*"
                                            }
                                        },
                                        "<= 20 sec": {
                                            "query_string": {
                                                "query": "billsec:>5 && billsec:<=20",
                                                "analyze_wildcard": true,
                                                "default_field": "*"
                                            }
                                        },
                                        "> 20 sec": {
                                            "query_string": {
                                                "query": "billsec:>20",
                                                "analyze_wildcard": true,
                                                "default_field": "*"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "version": true,
                        "docvalue_fields": [
                            "callflow.times.answered_time",
                            "callflow.times.bridged_time",
                            "callflow.times.created_time",
                            "callflow.times.hangup_time",
                            "callflow.times.hold_accum_time",
                            "callflow.times.last_hold_time",
                            "callflow.times.profile_created_time",
                            "callflow.times.progress_media_time",
                            "callflow.times.progress_time",
                            "callflow.times.resurrect_time",
                            "callflow.times.transfer_time",
                            "created_time",
                            "queue.answered_time",
                            "queue.exit_time",
                            "queue.joined_time",
                            "recordings.createdOn"
                        ],
                        "query": $scope.queryString,
                        "filter": [
                            {
                                "range": {
                                    "created_time": {
                                        "gte": $scope.startDate.getTime(),
                                        "lte": $scope.endDate.getTime(),
                                        "format": "epoch_millis"
                                    }
                                }
                            },
                            {
                                "bool": {
                                    "must_not":[
                                        {
                                            "exists": {
                                                "field": "extension"
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                avgDurationByExtension:
                    {
                        "size": 0,
                        "_source": {
                            "excludes": []
                        },
                        "aggs": {
                            "2": {
                                "terms": {
                                    "field": "extension",
                                    "size": 20,
                                    "order": {
                                        "_term": "desc"
                                    }
                                },
                                "aggs": {
                                    "1": {
                                        "avg_bucket": {
                                            "buckets_path": "1-bucket>1-metric"
                                        }
                                    },
                                    "3": {
                                        "avg_bucket": {
                                            "buckets_path": "3-bucket>3-metric"
                                        }
                                    },
                                    "4": {
                                        "avg": {
                                            "script": {
                                                "inline": "doc['waitsec'].value",
                                                "lang": "painless"
                                            }
                                        }
                                    },
                                    "1-bucket": {
                                        "filters": {
                                            "filters": {
                                                "billsec:>1": {
                                                    "query_string": {
                                                        "query": "billsec:>1",
                                                        "analyze_wildcard": true,
                                                        "default_field": "*"
                                                    }
                                                }
                                            }
                                        },
                                        "aggs": {
                                            "1-metric": {
                                                "avg": {
                                                    "script": {
                                                        "inline": "doc['billsec'].value",
                                                        "lang": "painless"
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "3-bucket": {
                                        "filters": {
                                            "filters": {
                                                "holdsec:>1": {
                                                    "query_string": {
                                                        "query": "holdsec:>1",
                                                        "analyze_wildcard": true,
                                                        "default_field": "*"
                                                    }
                                                }
                                            }
                                        },
                                        "aggs": {
                                            "3-metric": {
                                                "avg": {
                                                    "script": {
                                                        "inline": "doc['holdsec'].value",
                                                        "lang": "painless"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "version": true,
                        "docvalue_fields": [
                            "callflow.times.answered_time",
                            "callflow.times.bridged_time",
                            "callflow.times.created_time",
                            "callflow.times.hangup_time",
                            "callflow.times.hold_accum_time",
                            "callflow.times.last_hold_time",
                            "callflow.times.profile_created_time",
                            "callflow.times.progress_media_time",
                            "callflow.times.progress_time",
                            "callflow.times.resurrect_time",
                            "callflow.times.transfer_time",
                            "created_time",
                            "queue.answered_time",
                            "queue.exit_time",
                            "queue.joined_time",
                            "recordings.createdOn"
                        ],
                        "query": $scope.queryString,
                        "filter": [
                            {
                                "bool": {
                                    "must": [
                                        {
                                            "range": {
                                                "created_time": {
                                                    "gte": 1519643003538,
                                                    "lte": 1520247803538,
                                                    "format": "epoch_millis"
                                                }
                                            }
                                        }
                                    ],
                                    "must_not": [
                                        {
                                            "match_phrase": {
                                                "hangup_cause": {
                                                    "query": "LOSE_RACE"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
            };

            $scope.callDirection = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "Call directions"
                    },
                    chart: {
                        type: 'pieChart',
                        height: 350,
                        margin : {
                            top: 5,
                            right: 0,
                            bottom: 0,
                            left: 0
                        },
                        donut: true,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showValues: true,
                        showLegend: false,
                        valueFormat: function(d){
                            return d3.format(',d')(d);
                        },

                        duration: 500,
                        xAxis: {
                            axisLabel: 'Type'
                        },
                        yAxis: {
                            axisLabel: 'Count',
                            axisLabelDistance: 0,
                            tickFormat: function(d){
                                return d3.format(',d')(d);
                            }
                        }
                    }
                }
            };

            $scope.avgDuration = {
                options: {
                    title: {
                        enable: true,
                        text: "Avg duration by extension"
                    },
                    chart: {
                        type: 'multiBarHorizontalChart',
                        height: 550,
                        x: function(d){return d.label;},
                        y: function(d){return d.value;},
                        showControls: false,
                        showValues: true,
                        duration: 500,
                        xAxis: {
                            showMaxMin: false
                        },
                        yAxis: {
                            axisLabel: 'Seconds',
                            tickFormat: function(d){
                                return d3.format(',.2f')(d);
                            }
                        }
                    }
                },
                data: []
            };

            $scope.avg = [
                {
                    "key": "Avg talk time, s",
                    "color": "#44d680",
                    "values": [
                    ]
                },
                {
                    "key": "Avg waiting time, s",
                    "color": "#1f77b4",
                    "values": [
                    ]
                },
                {
                    "key": "Avg hold time, s",
                    "color": "#ff7f0e",
                    "values": [
                    ]
                }
            ];

            $scope.causeByAttemptChart = {
                data: [],
                options: {
                    title: {
                        enable: true,
                        text: "TOP 10 hangup causes"
                    },
                    chart: {
                        type: 'pieChart',
                        height: 350,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showLabels: false,
                        duration: 500,
                        //labelThreshold: 0.01,
                        //labelSunbeamLayout: true,
                        legend: {
                            margin: {
                                top: 5,
                                right: 35,
                                bottom: 5,
                                left: 0
                            }
                        }
                    }
                }
            };

            $scope.abandonedChart = {
                data:[],
                options:{
                    title: {
                        enable: true,
                        text: "Abandoned calls on the 5/20 sec"
                    },
                    chart: {
                        type: 'pieChart',
                        height: 350,
                        donut: true,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showLabels: true,
                        pie: {
                            startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
                            endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
                        },
                        duration: 500,
                        legend: {
                            margin: {
                                top: 5,
                                right: 70,
                                bottom: 5,
                                left: 0
                            }
                        }
                    }
                }
            };

            $scope.uniqueInboundChart = {
                data:[],
                options:{
                    title: {
                        enable: true,
                        text: "Unique inbound calls timeline"
                    },
                    chart: {
                        type: 'lineChart',
                        height: 450,
                        margin : {
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 55
                        },
                        x: function(d){ return d.x; },
                        y: function(d){ return d.y; },
                        useInteractiveGuideline: true,
                        dispatch: {
                            stateChange: function(e){ console.log("stateChange"); },
                            changeState: function(e){ console.log("changeState"); },
                            tooltipShow: function(e){ console.log("tooltipShow"); },
                            tooltipHide: function(e){ console.log("tooltipHide"); }
                        },
                        xAxis: {
                            axisLabel: 'Time',
                            tickFormat: function(d) {
                                return d3.time.format('%H:%M %d/%m')(new Date(d))
                            }
                        },
                        yAxis: {
                            axisLabel: 'Calls',
                            tickFormat: function(d){
                                return d3.format('.02f')(d);
                            },
                            axisLabelDistance: -10
                        }
                    },
                }
            };
            $scope.unique = [
                {
                    key: "unique inbound",
                    values:[],
                    color: '#7777ff',
                    area: true
                },
                {
                    key: "inbound",
                    color: '#2ca02c',
                    values:[]
                }
            ];

            $scope.callServer = getData;
            $scope.getTableState = null;
            var nexData = true;

            var _page = 1;
            
            function getFilter() {
                var filter = [
                    {"range": {
                        "created_time": {
                            "gte": $scope.startDate.getTime(),
                            "lte": $scope.endDate.getTime(),
                            "format": "epoch_millis"
                        }
                    }}

                ];
                if($scope.pinSearch) {
                    filter.push({
                        "terms":{
                            "pinned_items": [webitel.connection.session.username]
                        }
                    });
                }
                return filter;
            }

            $scope.pinnedItems = function(){
                $scope.pinSearch = !$scope.pinSearch;
                $scope.applyFilter();
            };

            function getData(tableState) {
                if ($scope.isLoading) return void 0;

                if ($scope.isLoading)
                    debugger;

                if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                    _page = 1;
                    nexData = true;
                    $scope.rowCollection = [];
                    $scope.count = 0;
                };
                console.debug("Page:", _page);

                $scope.tableState = tableState;

                if (!$scope.startDate || !$scope.endDate) {
                    notifi.error("Bad date", 2000);
                    return;
                };

                $scope.isLoading = true;
                $scope.sort = {};

                if (tableState.sort.predicate)
                    $scope.sort[tableState.sort.predicate.replace(/'/g, '')] = {
                        "order": tableState.sort.reverse ? "desc" : "asc",
                        "missing" : tableState.sort.reverse ? "_last" : "_first"
                    };

                var filter =  getFilter();

                CdrModel.getElasticDataFromLeg(
                    _page,
                    maxNodes,
                    {domain: $scope.domain, other: $scope.columnsArr, date: $scope.columnsDateArr},
                    filter,
                    $scope.queryString,
                    $scope.sort,
                    null,
                    $scope.legSearch,
                    function (err, res, count) {
                        $scope.isLoading = false;
                        if (err) {

                            if (err.statusCode === 400) {
                                return $scope.qsError = true;
                            }
                            return notifi.error(err);
                        }
                        $scope.qsError = false;

                        _page++;
                        nexData = res.length === maxNodes;
                        $scope.count  = count;

                        $scope.rowCollection = $scope.rowCollection.concat(res);

                    }
                )

            };
        }]);

});
