define(['app', 'modules/cdr/cdrModel', 'modules/cdr/filterModel', 'modules/cdr/fileModel', 'modules/cdr/exportPlugin', 'modules/cdr/libs/json-view/jquery.jsonview'], function (app) {

    app.controller('CDRCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CdrModel', 'fileModel', '$confirm', 'notifi',
        function ($scope, webitel, $rootScope, notifi, CdrModel, fileModel, $confirm, notifi) {

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
            var canReadFile = webitel.connection.session.checkResource('cdr/files', 'r');


            $scope.mapColumns = CdrModel.mapColumn();
            $scope.columns = CdrModel.availableColumns();
            $scope.filter = {};
            $scope.detailtColumns = [];
            
            angular.forEach($scope.mapColumns, function (item, key) {
                if (item.options && item.options.detail)
                    $scope.detailtColumns.push(key);
            });

            $scope.detailLoadingText = "";

            function setLoadingDetail(loading) {
                $scope.detailLoadingText = loading ?  "Loading ..." : "";
            };
            
            $scope.runExportCdr = function (fnExportCdr) {
                $scope.exportProcessExcel = true;
                fnExportCdr($scope.mapColumns, $scope.columns, $scope.filter, $scope.sort, function (err) {
                    if (err)
                        notifi.error(err);
                    $scope.exportProcessExcel = false;
                });
            };

            $scope.onInitMongoFilter = function(api) {
                $scope.filterAPI = api;
            };

            //$scope.testSource = null;
            $scope.applyFilter = function () {
                $scope.tableState.pagination.start = 0;
                getData($scope.tableState);
            };
            $scope.resetFilter = function () {
                $scope.filterAPI.resetFilter();
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
                    }
                ];

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
                            "uri": fileModel.getUri(row["variables.uuid"], item.name, item.name, item['content-type'] === "application/pdf" ? "pdf" :"mp3"),
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
                    default :
                        notifi.error("No action :(", 3000)
                }
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
                var link = document.createElement("a");
                link.download = file.name;
                link.href = file.uri;
                link.target = "_self";
                link.click();
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
                        notify.warning("Please, allow popup window!", 5000);
                        return;
                    }
                })
            }

            $scope.renderCell = function (value, cell) {
                if (cell.type == 'timestamp') {
                    if (value === 0) return "-";
                    return new Date(value / 1000).toLocaleString()
                };

                return value

            };

            $scope.callServer = getData;
            $scope.getTableState = null;
            var nexData = true;

            var _page = 1;

            function getData(tableState) {
                if (!$scope.filterAPI) return void 0;
                if ($scope.isLoading) return void 0;

                if ($scope.isLoading)
                    debugger;

                $scope.filter = $scope.filterAPI.getFilter();
                if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                    _page = 1;
                    nexData = true;
                    $scope.rowCollection = [];
                    $scope.count = 0;
                    CdrModel.getCount($scope.filter, function (err, count) {
                        if (err)
                            return notifi.error(err);
                        $scope.count = count;
                    });
                };
                console.debug("Page:", _page);

                $scope.isLoading = true;
                $scope.tableState = tableState;

                $scope.sort = {};

                if (tableState.sort.predicate)
                    $scope.sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;


                CdrModel.getData(_page, maxNodes, $scope.columns, $scope.filter, $scope.sort, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    _page++;
                    nexData = res.length == maxNodes;

                    $scope.rowCollection = $scope.rowCollection.concat(res);

                    $scope.isLoading = false;

                });

            };
    }]);


    app .directive('infiniteScroll',  [
        '$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {
            return {
                require: 'stTable',
                link: function(scope, elem, attrs, ctrl) {
                    var checkWhenEnabled, handler, scrollDistance, scrollEnabled;

                    var pagination = ctrl.tableState().pagination;
                    var itemByPage = 40;

                    $window = angular.element($window);
                    scrollDistance = 0;
                    if (attrs.infiniteScrollDistance != null) {
                        scope.$watch(attrs.infiniteScrollDistance, function(value) {
                            return scrollDistance = parseInt(value, 10);
                        });
                    }
                    scrollEnabled = true;
                    checkWhenEnabled = false;
                    if (attrs.infiniteScrollDisabled != null) {
                        scope.$watch(attrs.infiniteScrollDisabled, function(value) {
                            scrollEnabled = !value;
                            if (scrollEnabled && checkWhenEnabled) {
                                checkWhenEnabled = false;
                                return handler();
                            }
                        });
                    }
                    handler = function() {
                        var elementBottom, remaining, shouldScroll, windowBottom;
                        windowBottom = $window.height() + $window.scrollTop();
                        elementBottom = elem.offset().top + elem.height();
                        remaining = elementBottom - windowBottom;
                        shouldScroll = remaining <= $window.height() * scrollDistance;
                        if (shouldScroll && scrollEnabled) {
                            ctrl.slice(pagination.start + itemByPage, itemByPage);
                            if ($rootScope.$$phase) {

                                return scope.$eval(attrs.infiniteScroll);
                            } else {
                                return scope.$apply(attrs.infiniteScroll);
                            }
                        } else if (shouldScroll) {
                            return checkWhenEnabled = true;
                        }
                    };
                    $window.on('scroll', handler);
                    scope.$on('$destroy', function() {
                        return $window.off('scroll', handler);
                    });
                    //return $timeout((function() {
                    //    if (attrs.infiniteScrollImmediateCheck) {
                    //        if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
                    //            return handler();
                    //        }
                    //    } else {
                    //        return handler();
                    //    }
                    //}), 0);
                }
            };
        }
    ]);

});
