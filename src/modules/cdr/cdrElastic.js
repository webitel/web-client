/**
 * Created by igor on 15.04.16.
 */


define(['app', 'moment', 'jsZIP', 'async', 'modules/cdr/cdrModel', 'modules/cdr/fileModel', 'modules/cdr/exportPlugin', 'modules/cdr/libs/json-view/jquery.jsonview', 'css!modules/cdr/css/verticalTabs.css', 'css!modules/cdr/cdr.css'],
    function (app, moment, jsZIP, async) {

    app.controller('CDRCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CdrModel', 'fileModel', '$confirm',
        'TableSearch', '$timeout', 'cfpLoadingBar',
        function ($scope, webitel, $rootScope, notifi, CdrModel, fileModel, $confirm, TableSearch, $timeout, cfpLoadingBar) {

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

            var canDeleteFile = webitel.connection.session.checkResource('cdr/files', 'd');
            var canReadFile = webitel.connection.session.checkResource('cdr/files', 'r') || webitel.connection.session.checkResource('cdr/files', 'ro');
            var canDeleteCDR = $scope.canDeleteCDR = webitel.connection.session.checkResource('cdr', 'd');


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
                    $scope.getAvgStats();
                }
            }, true);

            $scope.$watch("domain", function (newVal) {
                $scope.panelStatistic = false;
            }, true);

            $scope.mapColumns = CdrModel.mapColumn();
            $scope.columns = CdrModel.availableColumns();
            $scope._countColumns = 0;
            $scope.columnsArr = [];
            $scope.columnsDateArr = [];
            $scope.filter = "";
            $scope.detailtColumns = [];

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

            angular.forEach($scope.mapColumns, function (item, key) {
                if (item.type == 'timestamp')
                    $scope.columnsDateArr.push(key);
                else $scope.columnsArr.push(key);

                if (!item.noRender)
                    $scope._countColumns++;

                if (item.options && item.options.detail) {
                    $scope.detailtColumns.push(key);
                    $scope._countColumns--;
                }
            });

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
                    "Call start time": {
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
                        {other: ["variables.uuid"], date: [], domain: $scope.domain},
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
                            if (!item['variables.uuid']) return cb();

                            CdrModel.removeCdr(item['variables.uuid'], function (err, res) {
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
                if($scope.panelStatistic){
                    $scope.getInboundStats();
                    $scope.getDirectionStats();
                    $scope.getAvgStats();
                }
                getData($scope.tableState);
            };
            $scope.resetFilter = function () {
                //$scope.filterAPI.resetFilter();
            };

            $scope.selectRow = function (row) {
                if ($scope.activeRow == row) return $scope.activeRow = null;
                $scope.activeRow = row;
                if (row._files && row._files.length > 1) return;
                row._files = [
                    {
                        "name": "open",
                        "uuid": row["variables.uuid"],
                        "action": "open",
                        "class": "fa fa-file-code-o",
                        "buttons": []
                    }
                ];

                if (canDeleteCDR) {
                    row._files[0].buttons.push(
                        {
                            "action": "removeCdr",
                            "class": "glyphicon glyphicon-remove"
                        }
                    )
                }

                if (!canReadFile)
                    return;

                setLoadingDetail(1);

                fileModel.getFiles(row['variables.uuid'], function (err, res) {
                    setLoadingDetail(0);
                    if (err)
                        return notifi.error(err);

                    angular.forEach(res, function (item) {
                        var _f = {
                            "_id": item._id,
                            "_lock": item._lock,
                            "name": item.name || "",
                            "content-type": item['content-type'] || "",
                            "action": "stream",
                            "domain": item.domain,
                            "uuid": row["variables.uuid"],
                            "private": item.private,
                            "uri": fileModel.getUri(row["variables.uuid"], item.name, item["createdOn"], _getTypeFile(item['content-type'])),
                            "href": item.path,
                            "class": item['content-type'] === "application/pdf" ? "fa fa-file-pdf-o" :"fa fa-file-audio-o",
                            "buttons": [
                                {
                                    "action": "load",
                                    "class": "glyphicon glyphicon-cloud-download"
                                }
                            ]
                        };
                        if (canDeleteFile) {
                            _f.buttons = _f.buttons.concat(
                                {
                                    "action": "setLock",
                                    "class": "fa fa-lock",
                                    "ngClass": "{'btn-success': file._lock}"
                                },
                                {
                                    "action": "delete",
                                    "class": "fa fa-trash-o"
                                }
                            )
                        }
                        row._files.push(_f);
                    })
                })
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

            $scope.fileAction = function (file, parent, files) {
                switch (file.action) {
                    case "open":
                        showJsonPreview(file.uuid);
                        break;

                    case "delete":
                        deleteResource(parent, files);
                        break;

                    case "load":
                        loadResource(parent);
                        break;

                    case "stream":
                        // TODO preview pdf
                        if (file['content-type'] == "application/pdf")
                            return loadResource(file);
                        play(file);
                        break;

                    case "removeCdr":
                        deleteCdr(parent.uuid);
                        break;

                    case "setLock":
                        var lock = parent._lock !== true;
                        var params = {
                            id: parent._id,
                            uuid: parent.uuid,
                            data: {
                                _lock: lock
                            }
                        };
                        
                        fileModel.updateFile(parent.domain, params, function (err, res) {
                            if (err)
                                return notifi.error(err, 3000);

                            parent._lock = lock;
                        });
                        break;
                    default :
                        notifi.error("No action :(", 3000)
                }
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

            var deleteResource = function (file, files) {
                $confirm({text: 'Are you sure you want to delete ' + file.name + '.mp3 or .wav file ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        CdrModel.remove(file.uuid, file.domain, file.name, function (err, res) {
                            if (err)
                                return notifi.error(err);

                            for (var i = 0, len = files.length; i < len; i++)
                                if (files[i] == file)
                                    return files.splice(i, 1);

                        })
                    });
            };

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

            var showJsonPreview = function(id) {
                fileModel.getJsonObject(id, function(err, res) {


                    var jsonData = JSON.stringify(res, null, '\t');

                    var jsonWindow = window.open("", id, "width=800, height=600");

                    if (jsonWindow) {

                        // додаємо розмітку у вікно для перегляду json обєкта і кнопки для скачування
                        jsonWindow.document.write(
                            '<button id="save-cdrJSON" style="position: fixed; right: 0; z-index: 1;">Save</button>' +
                            '<div id="cdr-jsonViewver"></div>' +
                            '<style type="text/css">' +
                            'body { margin: 0; padding: 0; background: #e7ebee; }' +
                            '</style>'
                        );

                        $('#cdr-jsonViewver', jsonWindow.document).JSONView(JSON.parse(jsonData, {collapsed: false}));

                        $('#save-cdrJSON', jsonWindow.document).off("click");
                        $('#save-cdrJSON', jsonWindow.document).on("click", function () {

                            var textFileAsBlob = new Blob([jsonData], {type: 'application/json'}),
                                downloadLink = document.createElement("a");

                            downloadLink.download = id + ".json";
                            downloadLink.innerHTML = "Download File";

                            if (window.webkitURL !== null) {
                                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                            }
                            else {
                                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                                downloadLink.onclick = destroyClickedElement;
                                downloadLink.style.display = "none";
                                document.body.appendChild(downloadLink);
                            }
                            downloadLink.click();
                        });
                    }
                    else {
                        notifi.warn("Please, allow popup window!", 5000);
                        return;
                    }
                })
            };

            $scope.renderCell = function (value, cell) {
                if (cell.type == 'timestamp') {
                    if (!value || value === 0) return "-";

                    return new Date(value).toLocaleString()
                };

                return value

            };

            $scope.changePanel = function (value) {
                $scope.panelStatistic = value;
                if(value){
                    $scope.getInboundStats();
                    $scope.getDirectionStats();
                    $scope.getAvgStats();
                }
            };

            $scope.getInboundStats = function () {
                $scope.statRequests.inbound.filter[1].range['variables.start_stamp'].gte = $scope.startDate.getTime();
                $scope.statRequests.inbound.filter[1].range['variables.start_stamp'].lte = $scope.endDate.getTime();
                $scope.statRequests.inbound.domain = $scope.domain;
                $scope.statRequests.inbound.query = $scope.queryString;
                CdrModel.getStatistic($scope.domain, $scope.statRequests.inbound, function(err, res){
                    if (err)
                        return notifi.error(err);
                    $scope.inbound_total = res.hits.total;
                    $scope.inbound_answered = res.aggregations && res.aggregations.Answered.value;
                    $scope.inbound_abandoned = res.aggregations && res.aggregations.Abandoned.value;
                });
            };

            $scope.getAvgStats = function () {
                $scope.statRequests.avg.filter[0].range['variables.start_stamp'].gte = $scope.startDate.getTime();
                $scope.statRequests.avg.filter[0].range['variables.start_stamp'].lte = $scope.endDate.getTime();
                $scope.statRequests.avg.domain = $scope.domain;
                $scope.statRequests.avg.query = $scope.queryString;
                $scope.avgConnectedCallMetr.data.forEach(function(item){
                    item.values = [];
                });
                CdrModel.getStatistic($scope.domain, $scope.statRequests.avg, function(err, res){
                    if (err)
                        return notifi.error(err);
                    if(!!res.aggregations)
                        res.aggregations.avgg.buckets.Bridged.avggg.buckets.forEach(function (item) {
                            $scope.avgConnectedCallMetr.data[0].values.push({
                                label: item.key,
                                value: item.bbd.value
                            });
                            $scope.avgConnectedCallMetr.data[1].values.push({
                                label: item.key,
                                value: item.ccd.value
                            });
                            $scope.avgConnectedCallMetr.data[2].values.push({
                                label: item.key,
                                value: item.cd.value
                            })
                        });
                });
            };

            $scope.getDirectionStats = function () {
                $scope.statRequests.direction.filter[0].range['variables.start_stamp'].gte = $scope.startDate.getTime();
                $scope.statRequests.direction.filter[0].range['variables.start_stamp'].lte = $scope.endDate.getTime();
                $scope.statRequests.direction.domain = $scope.domain;
                $scope.statRequests.direction.query = $scope.queryString;
                $scope.callDirection.data = [];
                $scope.causeByAttemptChart.data[0].values = [];
                $scope.outbound = 0;
                var data = [];
                CdrModel.getStatistic($scope.domain, $scope.statRequests.direction, function(err, res){
                    if (err)
                        return notifi.error(err);
                    if(res.aggregations && res.aggregations.directions){
                        res.aggregations.directions.buckets.forEach(function (item) {
                            data.push({
                                key: item.key,
                                y: item.doc_count
                            });
                            if(item.key === 'outbound') $scope.outbound = item.doc_count;
                        });
                        $scope.callDirection.data = data;
                    }
                    if(res.aggregations && res.aggregations.hangup_causes){
                        data = [];
                        res.aggregations.hangup_causes.buckets.forEach(function (item) {
                            data.push({
                                label: item.key,
                                value: item.doc_count
                            });
                        });
                        $scope.causeByAttemptChart.data[0].values = data;
                    }
                });
            }

            $scope.statRequests = {
                inbound: {
                    "aggs": {
                        "Abandoned": {
                            "sum": {
                                "script": {
                                    "inline": "doc['Bridged'].value ? 0 : 1",
                                        "lang": "painless"
                                }
                            }
                        },
                        "Answered": {
                            "sum": {
                                "script": {
                                    "inline": "doc['Bridged'].value ? 1 : 0",
                                        "lang": "painless"
                                }
                            }
                        }
                    },
                    "limit": 0,
                    "query": $scope.queryString,
                    "filter": [
                        {
                            "match_phrase": {
                                "Call direction": {
                                    "query": "inbound"
                                }
                            }
                        },
                        {
                            "range": {
                                "variables.start_stamp": {
                                    "gte": $scope.startDate.getTime(),
                                    "lte": $scope.endDate.getTime(),
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "sort": {},
                    "domain": $scope.domain
                },
                avg:{
                    "aggs": {
                        "avgg": {
                            "filters": {
                                "filters": {
                                    "Bridged": {
                                        "query_string": {
                                            "query": "Bridged: true",
                                            "analyze_wildcard": true
                                        }
                                    }
                                }
                            },
                            "aggs": {
                                "avggg": {
                                    "terms": {
                                        "field": "User ID",
                                        "size": 10,
                                        "order": {
                                            "_term": "desc"
                                        }
                                    },
                                    "aggs": {
                                        "cd": {
                                            "avg": {
                                                "field": "Call duration"
                                            }
                                        },
                                        "bbd": {
                                            "avg": {
                                                "field": "Before Bridge Delay"
                                            }
                                        },
                                        "ccd": {
                                            "avg": {
                                                "field": "Connected call duration"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "limit": 0,
                    "query": $scope.queryString,
                    "filter": [      {
                        "range": {
                            "variables.start_stamp": {
                                "gte": $scope.startDate.getTime(),
                                "lte": $scope.endDate.getTime(),
                                "format": "epoch_millis"
                            }
                        }
                    }],
                    "sort": {},
                    "domain": $scope.domain
                },
                direction: {
                    "aggs": {
                        "hangup_causes": {
                            "terms": {
                                "field": "Hangup cause",
                                "size": 5,
                                "order": {
                                    "_count": "desc"
                                }
                            }
                        },
                        "directions": {
                            "terms": {
                                "field": "Call direction",
                                "size": 5,
                                "order": {
                                    "_count": "desc"
                                }
                            }
                        }
                    },
                    "limit": 0,
                    "query": $scope.queryString,
                    "filter": [      {
                        "range": {
                            "variables.start_stamp": {
                                "gte": $scope.startDate.getTime(),
                                "lte": $scope.endDate.getTime(),
                                "format": "epoch_millis"
                            }
                        }
                    }],
                    "sort": {},
                    "domain": $scope.domain
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

            $scope.avgConnectedCallMetr = {
                options: {
                    title: {
                        enable: true,
                        text: "Avg connected calls metrics"
                    },
                    chart: {
                        type: 'multiBarHorizontalChart',
                        height: 550,
                        x: function(d){return d.label;},
                        y: function(d){return d.value;},
                        showControls: true,
                        showValues: true,
                        duration: 500,
                        xAxis: {
                            showMaxMin: false
                        },
                        yAxis: {
                            axisLabel: 'Values',
                            tickFormat: function(d){
                                return d3.format(',.2f')(d);
                            }
                        }
                    }
                },
                data: [
                    {
                        "key": "Bridged: Avg answer delay, s",
                        "color": "#44d680",
                        "values": [
                        ]
                    },
                    {
                        "key": "Bridged: Avg talk time, s",
                        "color": "#1f77b4",
                        "values": [
                        ]
                    },
                    {
                        "key": "Bridged: Avg call duration, s",
                        "color": "#ff7f0e",
                        "values": [
                        ]
                    }
                ]
            };

            $scope.causeByAttemptChart = {
                data: [
                    {
                        key: "Cumulative Return",
                        values: []
                    }
                ],
                options: {
                    title: {
                        enable: true,
                        text: "TOP 5 hangup causes"
                    },
                    chart: {
                        type: 'discreteBarChart',
                        height: 400,
                        margin : {
                            top: 20,
                            right: 20,
                            bottom: 150,
                            left: 50
                        },
                        // yDomain: [0, 100],
                        x: function(d){return d.label;},
                        y: function(d){return d.value;},
                        showValues: true,
                        valueFormat: function(d){
                            return d3.format(',d')(d);
                        },

                        duration: 500,
                        xAxis: {
                            rotateYLabel: true,
                            rotateLabels: 45,
                            fontSize: 10
                        },
                        yAxis: {
                            // axisLabel: '%',
                            // axisLabelDistance: 0,
                            showMaxMin: false,
                            tickFormat: function(d){
                                return d3.format(',d')(d);
                            }
                        }
                    }
                }
            };

            $scope.callServer = getData;
            $scope.getTableState = null;
            var nexData = true;

            var _page = 1;
            
            function getFilter() {
                return {
                    "range": {
                        "variables.start_stamp": {
                            "gte": $scope.startDate.getTime(),
                            "lte": $scope.endDate.getTime(),
                            "format": "epoch_millis"
                        }
                    }
                }
            }

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

                CdrModel.getElasticData(_page, maxNodes, {domain: $scope.domain, other: $scope.columnsArr, date: $scope.columnsDateArr}, filter, $scope.queryString, $scope.sort, null, function (err, res, count) {
                    $scope.isLoading = false;
                    if (err) {

                        if (err.statusCode === 400) {
                            return $scope.qsError = true;
                        };
                        return notifi.error(err);
                    };
                    $scope.qsError = false;

                    _page++;
                    nexData = res.length == maxNodes;
                    $scope.count  = count;

                    $scope.rowCollection = $scope.rowCollection.concat(res);

                });

            };
        }]);


});
