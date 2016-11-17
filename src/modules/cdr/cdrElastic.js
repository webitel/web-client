/**
 * Created by igor on 15.04.16.
 */


define(['app', 'moment', 'jsZIP', 'async', 'modules/cdr/cdrModel', 'modules/cdr/fileModel', 'modules/cdr/exportPlugin', 'modules/cdr/libs/json-view/jquery.jsonview', 'css!modules/cdr/css/verticalTabs.css', 'css!modules/cdr/cdr.css'],
    function (app, moment, jsZIP, async) {

    app.controller('CDRCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CdrModel', 'fileModel', '$confirm', 'notifi', 'TableSearch', '$timeout',
        function ($scope, webitel, $rootScope, notifi, CdrModel, fileModel, $confirm, notifi, TableSearch, $timeout) {

            $scope.isLoading = false;
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
                }, 'cdrElastic')
            }, true);



            $scope.mapColumns = CdrModel.mapColumn();
            $scope.columns = CdrModel.availableColumns();
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

                if (item.options && item.options.detail)
                    $scope.detailtColumns.push(key);
            });

            $scope.detailLoadingText = "";

            function setLoadingDetail(loading) {
                $scope.detailLoadingText = loading ?  "Loading ..." : "";
            }

            $scope.runExportCdr = function (fnExportCdr) {
                $scope.exportProcessExcel = true;
                var filter =  getFilter();
                fnExportCdr($scope.mapColumns, {other: $scope.columnsArr, date: $scope.columnsDateArr}, filter, $scope.queryString, $scope.sort, function (err) {
                    if (err)
                        notifi.error(err);
                    $scope.exportProcessExcel = false;
                });
            };
            
            $scope.runExportFiles = function (fnExport) {
                $scope.exportProcessExcel = true;
                var filter =  getFilter();
                fnExport(filter, $scope.queryString, $scope.sort, function (err) {
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
                        {other: ["variables.uuid"], date: []},
                        filter,
                        queryString,
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
                            _f.buttons.push({
                                "action": "delete",
                                "class": "fa fa-trash-o"
                            })
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
                $scope.setSource({
                    src: file.uri,
                    type: 'audio/mpeg',
                    text: file.name + " (" + file.uuid + ")"
                }, true);
            };

            var showJsonPreview = function(id) {
                fileModel.getJsonObject(id, function(err, res) {


                    var jsonData = JSON.stringify(res);

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

                            downloadLink.download = $scope.currentRowId.slice(2) + ".json";
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
                        notifi.warning("Please, allow popup window!", 5000);
                        return;
                    }
                })
            }

            $scope.renderCell = function (value, cell) {
                if (cell.type == 'timestamp') {
                    if (!value || value === 0) return "-";

                    return new Date(value).toLocaleString()
                };

                return value

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

                CdrModel.getElasticData(_page, maxNodes, {other: $scope.columnsArr, date: $scope.columnsDateArr}, filter, $scope.queryString, $scope.sort, function (err, res, count) {
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
