define(['app', 'jsZIP-utils', 'jsZIP', 'async', 'modules/cdr/libs/fileSaver', 'scripts/webitel/utils','modules/media/mediaModel', 'modules/media/ttsProviders'
], function (app, jsZIPUtils, jsZIP, async, fileSaver, utils) {
    app.controller('MediaCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', 'MediaModel', 'FileUploader', '$confirm',
        'TableSearch', '$sce', 'cfpLoadingBar', 'TtsProviders', '$http',
        function ($scope, $modal, webitel, $rootScope, notifi, MediaModel, FileUploader, $confirm, TableSearch, $sce, cfpLoadingBar, TtsProviders, $http) {
            $scope.domain = webitel.domain();

            $scope.canDelete = webitel.connection.session.checkResource('cdr/media', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('cdr/media', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('cdr/media', 'c');
            $scope.displayedCollection = [];
            $scope.uploadFiles = [];
            $scope.reloadData = reloadData;
            $scope.removeItem = removeItem;
            $scope.progress = 0;
            $scope.isLoading = false;
            $scope.$watch('isLoading', function (val) {
                if (val) {
                    cfpLoadingBar.start()
                } else {
                    cfpLoadingBar.complete()
                }
            });

            $scope.setSource = null;
            $scope.activePlayRowName = null;

            $scope.convertSize = function (size) {
                if (size)
                    return utils.prettysize(size);
            };

            $scope.convertTimestamp = function (timestamp) {
                if (!timestamp)
                    return "-"

                return new Date(timestamp).toLocaleString()
            };

            function playRow(row) {

                $scope.setSource({
                    src: row._href,
                    type: 'audio/mpeg',
                    text: row.name
                }, true);
                $scope.activePlayRowName = row.name;
            }

            $scope.playRow = playRow;

            $scope.onClosePlayer = function () {
                $scope.activePlayRowName = null;
            };

            $scope.query = TableSearch.get('media');

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'media');
            });
            
            $scope.downloadAll = function () {
                var zip = new jsZIP();
                async.eachSeries(
                    $scope.displayedCollection,
                    function (i, cb) {
                        jsZIPUtils.getBinaryContent(i._href, function (e, data) {
                            if (e)
                                return cb(e);
                            zip.file(i.name, data);
                            cb(null)
                        })
                    },
                    function (e) {
                        zip.generateAsync({type:"blob"}).then(function(content) {
                            // see FileSaver.js
                            fileSaver(content, "media.zip");
                        });
                    }
                );
            };

            var headers = {
                "x-key": webitel.connection.session.key,
                "x-access-token": webitel.connection.session.token
            };

            function setUploaderUrl(domainName) {
                uploader.url = webitel.connection._cdr + '/api/v2/media/?domain=' + domainName + '&x_key=' + headers['x-key']
                    + '&access_token=' + headers['x-access-token']
            }

            function getFileUrl(name, type, domainName) {
                return webitel.connection._cdr + '/api/v2/media/' + type + '/' + name + '?domain=' + domainName + '&x_key=' + headers['x-key']
                    + '&access_token=' + headers['x-access-token'];
            }

            function getType (fileItem) {
                if (fileItem.file.type === "audio/wav" || fileItem.file.type === "audio/x-wav")
                    return 'wav';
                else return 'mp3'
            }

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
            }

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
            }

            $scope.openTts = function(){
                var modalInstance = $modal.open({
                    animation: true,
                    backdrop: false,
                    templateUrl: '/modules/media/ttsModal.html',
                    resolve: {
                        domainName: function () {
                            return $scope.domain;
                        }
                    },
                    controller: function ($modalInstance, $scope, domainName) {
                        var self = $scope;
                        self.blob = null;

                        self.props = {
                            name: null,
                            provider: null,
                            voice: null,
                            token: "",
                            key: "",
                            language: null,
                            text: null,
                            type: 'text'
                        };
                        self.providers = [];
                        self.languages = [];
                        self.voices = [];


                        self.getProviders = function(){
                            self.providers.push('default');
                            TtsProviders.providers.forEach(function(item){
                                self.providers.push(item.name);
                            });
                            self.props.provider = 'default';
                        };

                        self.getLanguages = function(){
                            self.languages = [];
                            if(!self.props.provider)
                                return;
                            var provider = TtsProviders.providers.filter(function(item){
                                return self.props.provider === 'default' ? item.name === 'polly' : item.name === self.props.provider;
                            })[0];
                            if(provider.name === 'polly' || provider.name === 'default')
                            {
                                provider.voice.forEach(function(item){
                                    self.languages.push(item.language);
                                });
                                self.props.language = self.languages[0];
                                if(self.props.language){
                                    self.getVoices();
                                }
                                else{
                                    self.voices = [];
                                    self.props.voice = null;
                                }
                            }
                            else if(provider.name === 'microsoft' || provider.name === 'google'){
                                provider.voice.forEach(function(item){
                                    self.languages.push({ language: item.language, gender: item.gender});
                                });
                                self.props.language = self.languages[0];
                            }
                        };

                        self.getVoices = function(){
                            self.voices = [];
                            if(!self.props.language)
                                return;
                            var provider = TtsProviders.providers.filter(function(item){
                                return self.props.provider === 'default' ? item.name === 'polly' : item.name === self.props.provider
                            })[0];
                            var voices = provider.voice.filter(function(item){
                                return item.language === self.props.language;
                            })[0];
                            if(!voices)
                                return;
                            voices.male.forEach(function(item){
                               self.voices.push({
                                   value: item,
                                   gender: 'male'
                               })
                            });
                            voices.female.forEach(function(item){
                                self.voices.push({
                                    value: item,
                                    gender: 'female'
                                })
                            });
                            self.props.voice = self.voices[0].value;
                        };

                        self.getRegions = function() {
                            self.regions = [];
                            var provider = TtsProviders.providers.filter(function(item) {
                                return self.props.provider === item.name ? item : null
                            })[0];
                            if (provider) {
                                self.regions = [].concat(provider.regions)
                            }
                        };

                        self.ok = function () {
                            $modalInstance.close({

                            });
                        };

                        self.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        //region tts
                        self.genTTS = genTTS;
                        self.saveBlob = saveBlob;

                        function makeUir(options) {
                            var uri = '/api/v2/media/tts/';
                            if (options.provider === 'default') {
                                uri+= "default?"
                            } else {
                                uri += options.provider + "?";
                                if (options.key && options.token) {
                                    uri += '&accessKey=' + options.key + '&accessToken=' + options.token;
                                }
                            }
                            try{
                                var tmp = JSON.parse(options.language);
                            }
                            catch (e){
                                tmp = false;
                            }
                            if (tmp) {
                                uri += '&language=' + tmp.language + '&gender=' + tmp.gender;
                            }
                            else{
                                uri += '&voice=' + options.voice;
                            }
                            if (options.type === "SSML") {
                                uri += "&textType=ssml";
                            }

                            if (options.region) {
                                uri += '&region=' + options.region
                            }

                            uri += '&domain=' + domainName + '&format=.wav&text=' + encodeURIComponent(options.text);
                            return uri
                        }

                        function saveBlob(blob, name) {
                            var file = new File([blob], name + '.wav', {type:'audio/wav'});
                            var dummy = new FileUploader.FileItem(uploader, {});
                            dummy._file = file;
                            dummy.url = getPostUrl('wav', domainName);
                            uploader.queue.push(dummy);
                            uploader.uploadAll();
                            self.blob = null;
                            self.props.name = "";
                            self.props.text = "";
                        }

                        function genTTS() {
                            $http({
                                    url: webitel.connection._cdr + makeUir($scope.props),
                                    method: "GET",
                                    responseType: "blob"
                                })
                                .success(function (blob) {
                                    self.blob = blob;
                                    playRow({
                                        _href: window.URL.createObjectURL(blob),
                                        name: self.props.name
                                    })
                                })
                                .error(function (err, code) {
                                    notifi.error(new Error("Bad response server, status code: " + code), 5000);
                                })
                        }
                        //endregion
                    }
                });

                modalInstance.result.then(function (option) {
                    
                });
            }

            function reloadData () {
                if (!$scope.domain)
                    return $scope.rowCollection = [];
                $scope.isLoading = true;
                MediaModel.list($scope.domain, function (err, res) {
                    $scope.isLoading = false;
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
