define(['app', 'modules/media/mediaModel'
], function (app) {

    app.controller('MediaCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'MediaModel', 'FileUploader', '$confirm',
        'TableSearch', '$sce',
        function ($scope, webitel, $rootScope, notifi, MediaModel, FileUploader, $confirm, TableSearch, $sce) {
            $scope.domain = webitel.domain();

            $scope.canDelete = webitel.connection.session.checkResource('cdr/media', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('cdr/media', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('cdr/media', 'c');
            $scope.displayedCollection = [];
            $scope.uploadFiles = [];
            $scope.reloadData = reloadData;
            $scope.removeItem = removeItem;
            $scope.progress = 0;

            $scope.setSource = null;
            $scope.activePlayRowName = null;

            $scope.playRow = function (row) {

                $scope.setSource({
                    src: row._href,
                    type: 'audio/mpeg',
                    text: row.name
                }, true);
                $scope.activePlayRowName = row.name;
            };
            $scope.onClosePlayer = function () {
                $scope.activePlayRowName = null;
            };

            $scope.query = TableSearch.get('media');

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'media');
            });

            var headers = {
                "x-key": webitel.connection.session.key,
                "x-access-token": webitel.connection.session.token
            };

            function setUploaderUrl(domainName) {
                uploader.url = webitel.connection._cdr + '/api/v2/media/?domain=' + domainName + '&x_key=' + headers['x-key']
                    + '&access_token=' + headers['x-access-token']
            };

            function getFileUrl(name, type, domainName) {
                return webitel.connection._cdr + '/api/v2/media/' + type + '/' + name + '?domain=' + domainName + '&x_key=' + headers['x-key']
                    + '&access_token=' + headers['x-access-token'];
            };

            function getType (fileItem) {
                if (fileItem.file.type == "audio/wav")
                    return 'wav';
                else return 'mp3'
            };

            function getPostUrl (type, domainName) {
                return webitel.connection._cdr + '/api/v2/media/' + type + '?domain=' + domainName + '&x_key=' + headers['x-key']
                    + '&access_token=' + headers['x-access-token'];
            }

            function completeUploadFile (fileItem){
                for (var i in $scope.uploadFiles) {
                    if ($scope.uploadFiles[i] == fileItem)
                        return $scope.uploadFiles.splice(i, 1)
                }
            }

            var uploader = $scope.uploader = new FileUploader({
                autoUpload: true
            });

            function setHeaders(fileItem) {
                fileItem.headers['x-key'] = headers['x-key'];
                fileItem.headers['x-access-token'] = headers['x-access-token'];
            };

            uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
                console.info('onWhenAddingFileFailed', item, filter, options);
            };
            uploader.onAfterAddingFile = function(fileItem) {
                fileItem.url = getPostUrl(getType(fileItem), $scope.domain);
                $scope.uploadFiles.push(fileItem);
                //var fileRow = {
                //    name: fileItem.file.name,
                //    format: fileItem.file.type,
                //    size: fileItem.file.size,
                //    file: fileItem,
                //    _new: true,
                //    progress: 0
                //};
                ////setHeaders(fileItem);
                //
                //$scope.rowCollection.push(fileRow);
                console.info('onAfterAddingFile', fileItem);
            };
            uploader.onAfterAddingAll = function(addedFileItems) {
                console.info('onAfterAddingAll', addedFileItems);
            };
            uploader.onBeforeUploadItem = function(item) {
                console.info('onBeforeUploadItem', item);
            };
            uploader.onProgressItem = function(fileItem, progress) {
                $scope.progress = progress;
                console.info('onProgressItem', fileItem, progress);
            };
            uploader.onProgressAll = function(progress) {
                console.info('onProgressAll', progress);
            };
            uploader.onSuccessItem = function(fileItem, response, status, headers) {
                console.info('onSuccessItem', fileItem, response, status, headers);
            };
            uploader.onErrorItem = function(fileItem, response, status, headers) {
                console.info('onErrorItem', fileItem, response, status, headers);
                completeUploadFile(fileItem);
                notifi.error(response.info || "Bad file.")
            };
            uploader.onCancelItem = function(fileItem, response, status, headers) {
                console.info('onCancelItem', fileItem, response, status, headers);
            };
            uploader.onCompleteItem = function(fileItem, response, status, headers) {
                completeUploadFile(fileItem);
                console.info('onCompleteItem', fileItem, response, status, headers);
            };
            uploader.onCompleteAll = function() {
                console.info('onCompleteAll');
                reloadData();
            };

            console.info('uploader', uploader);



            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
            });

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            function removeItem(row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name+ ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        MediaModel.remove(row.name, row.type, $scope.domain, function (err, res) {
                            if (err)
                                return notifi.error(err);
                            reloadData();
                        });
                    });
            };

            function reloadData () {
                if (!$scope.domain)
                    return $scope.rowCollection = [];
                //$scope.isLoading = true;
                MediaModel.list($scope.domain, function (err, res) {
                    //$scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);
                    var rows = [],
                        item;
                    angular.forEach(res, function (row) {
                        item = row;
                        item._href = getFileUrl(row.name, row.type, $scope.domain);
                        rows.push(row);
                    });
                    $scope.rowCollection = rows;
                });
            };

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                if (domainName)
                    setUploaderUrl(domainName);

                reloadData();
            });
        }])
});
