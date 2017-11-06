define(['app', 'qrcode', 'scripts/webitel/utils', 'modules/contacts/contactModel', 'css!modules/contacts/photo.css'], function (app, qrcode, utils) {

    app.controller('ContactsCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$route', '$location', 'ContactModel', '$routeParams',
            '$timeout', '$confirm', 'TableSearch', 'cfpLoadingBar', 'FileUploader',
        function ($scope, $modal, webitel, $rootScope, notifi, $route, $location, ContactModel, $routeParams, $timeout, $confirm,
                  TableSearch, cfpLoadingBar, FileUploader) {
   		$scope.domain = webitel.domain();
        $scope.contact = {};
        $scope.hasImage = false;
        $scope.communication = {
            number:'',
            type:''
        };

        $scope.vCard = "BEGIN:VCARD\n" +
            "VERSION:3.0\n" +
            "FN:#NAME#\n" +
            "N:;#NAME#;;;\n" +
            "#COMMUNICATIONS#" +
            "ORG:#COMPANY#\n" +
            "TITLE:#JOB#\n" +
            "NOTE:#DESCRIPTION#\n" +
            "END:VCARD";

        $scope.vEmailTemplate = "EMAIL;TYPE=INTERNET:#EMAIL#\n";
        $scope.vTelTemplate = "TEL:#PHONE_NUMBER#\n";

        $scope.properties = [];
        $scope.isRoot = !webitel.connection.session.domain;

        $scope.canDelete = webitel.connection.session.checkResource('book', 'd');
        $scope.canUpdate = webitel.connection.session.checkResource('book', 'u');
        $scope.canCreate = webitel.connection.session.checkResource('book', 'c');

        $scope.isLoading = false;
        $scope.$watch('isLoading', function (val) {
            if (val) {
                cfpLoadingBar.start()
            } else {
                cfpLoadingBar.complete()
            }
        });

        $scope.viewMode = !$scope.canDelete;

        $scope.view = function () {
            var id = $routeParams.id;

            ContactModel.item(id, $scope.domain, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                }
                $scope.contact = item.data;
                disableEditMode();
            });
        };


        $scope.rowCollection = [];


        $scope.query = TableSearch.get('contacts');

        $scope.$watch("query", function (newVal) {
            TableSearch.set(newVal, 'contacts')
        });

        var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
            $scope.domain = domainName;
            closePage();
        });

        $scope.$on('$destroy', function () {
            changeDomainEvent();
        });

        $scope.$watch('contact', function(newValue, oldValue) {
            if ($scope.contact._new)
                return $scope.isEdit = $scope.isNew = true;

            return $scope.isEdit = !!oldValue.id;
        }, true);

        var uploader = $scope.uploader = new FileUploader();
        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(item) {
            console.info('onAfterAddingFile', item);

            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var ava = document.getElementById('avatar');
                    // var view = new Uint8Array(event.target.result);
                    // var blob = new Blob([view], {type: "image/png"});
                    // var url = URL.createObjectURL(blob);
                    var url = event.target.result;
                    ava.src = url;
                    $scope.contact.photo = url;

                } catch (e) {
                    notifi.error(e, 10000);
                }
            };
            //reader.readAsArrayBuffer(item._file);
            reader.readAsDataURL(item._file);
            $scope.hasImage = true;
            $scope.isEdit = true;
        };

        $scope.deleteImg = function (){
            var ava = document.getElementById('avatar');
            ava.src = '/modules/contacts/profile-user.svg';
            $scope.contact.photo = null;
            $scope.hasImage = false;
            $scope.isEdit = true;
        }

        $scope.cancel = function () {
            $scope.contact = angular.copy($scope.oldContact);
            var ava = document.getElementById('avatar');
            if($scope.contact.photo){
                ava.src = $scope.contact.photo;
                $scope.hasImage = true;
            }
            else {
                ava.src = '/modules/contacts/profile-user.svg';
            }
            disableEditMode();
        };

        function disableEditMode () {
            $timeout(function () {
                $scope.isEdit = false;
            }, 0);
        };

        var _page = 1;
        var nexData = true;
        var col = encodeURIComponent(JSON.stringify({
            name: 1,
            company_name: 1,
            job_name: 1,
            description: 1,
            id: 1
        }));
        var maxNodes = 40;

        $scope.callServer = getData;

        function getData(tableState) {
            if ($scope.isLoading) return void 0;

            if (!$scope.domain)
                return $scope.rowCollection = [];

            if (((tableState.pagination.start / tableState.pagination.number) || 0) === 0) {
                _page = 1;
                nexData = true;
                $scope.rowCollection = [];
                $scope.count = 0;
            }
            console.debug("Page:", _page);

            $scope.tableState = tableState;

            $scope.isLoading = true;
            var sort ={};

            if (tableState.sort.predicate)
                sort[tableState.sort.predicate] = tableState.sort.reverse ? -1 : 1;

            $scope.isLoading = true;
            sort = encodeURIComponent(JSON.stringify(sort));

            ContactModel.list({
                columns: col,
                sort: sort,
                limit: maxNodes,
                page: _page,
                domain: $scope.domain
            }, function (err, res) {
                $scope.isLoading = false;
                if (err)
                    return notifi.error(err, 5000);

                _page++;
                nexData = res.data.length === maxNodes;
                $scope.rowCollection = $scope.rowCollection.concat(res.data);
            });

        }

        $scope.getCommunications = function(){
            ContactModel.communicationList($scope.domain, function (err, res) {
                if(err)
                    return notifi.error(err, 5000);
                $scope.communication_types = res && res.data;
            })
        }

        $scope.reloadData  = function() {
            if($scope.tableState){
                $scope.tableState.pagination.start = 0;
                getData($scope.tableState);
            }
        };

        $scope.addComm  = function() {
            $scope.contact.communications.push({
                number: $scope.communication.number,
                type_id: $scope.communication.type.id,
                type_name: $scope.communication.type.name
            });
            $scope.communication = {
                number:'',
                type:''
            };
        };

        $scope.deleteComm  = function(row) {
            var index = $scope.contact.communications.indexOf(row);
            $scope.contact.communications.splice(index, 1);
        };

        $scope.$watch('domain', function(domainName) {
            $scope.domain = domainName;
            $scope.reloadData();
        });

        $scope.edit = edit;
        $scope.closePage = closePage;
        $scope.save = save;



        function closePage() {
            $location.path('/contacts');
        };

        $scope.create = function(){
            var modalInstance = $modal.open({
                animation: true,
                backdrop: false,
                templateUrl: '/modules/contacts/contactModal.html',
                resolve: {
                    domainName: function () {
                        return $scope.domain;
                    },
                    uploader: function () {
                        return $scope.uploader;
                    },
                    deleteImg: function () {
                        return $scope.deleteImg;
                    }
                },
                controller: ['$modalInstance', '$scope', 'domainName', 'uploader', 'deleteImg', function ($modalInstance, $scope, domainName, uploader, deleteImg) {
                    var self = $scope;
                    self.uploader = uploader;
                    self.deleteImg = deleteImg;
                    self.contact = {};
                    self.communication_type = {};
                    self.communications = [];
                   // self.getCommunications = getCommunications;

                    self.ok = function () {
                        self.contact.communications = self.communications;
                        $modalInstance.close({
                            contact: self.contact
                        });
                    };

                    self.getCommunications = function(){
                        ContactModel.communicationList(domainName, function (err, res) {
                            if(err)
                                return notifi.error(err, 5000);
                            $scope.communication_types = res && res.data;
                        })
                    }

                    self.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                    self.addCommunication = function(){
                        if(self.communication_type && self.number){
                            self.communications.push({
                                number: self.number,
                                type_id: self.communication_type.value.id,
                                type_name: self.communication_type.value.name
                            });
                            self.number = '';
                            self.communication_type.value = null;
                        }
                    };
                    self.removeComm = function(row){
                       var index = self.communications.indexOf(row);
                       self.communications.splice(index, 1);
                    };
                }]
            });

            modalInstance.result.then(function (option) {
                ContactModel.add(option.contact, $scope.domain, function (err, res) {
                    if(err)
                        return notifi.error(err);
                    $scope.reloadData();
                });
            });
        };

        $scope.delete = function (row) {
            $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                .then(function() {
                    ContactModel.remove(row.id, $scope.domain, function (err) {
                        if (err)
                            return notifi.error(err, 5000);
                        $scope.reloadData();
                    });
                });
        };

        function save() {
            var cb = function (err, res) {
                if (err)
                    return notifi.error(err, 5000);
                $scope.contact.__time = Date.now();
                return edit();
            };
            ContactModel.update($scope.contact.id, angular.copy($scope.contact), $scope.domain, cb);
        };

        function edit () {
            var id = $routeParams.id;
            var domain = $routeParams.domain;
            initProperties();
            ContactModel.item(id, domain, function(err, item) {
                if (err) {
                    return notifi.error(err, 5000);
                }
                if(!item.data.communications)item.data.communications=[];
                $scope.oldContact = angular.copy(item.data);
                $scope.contact = item.data;
                if($scope.contact.photo){
                    var ava = document.getElementById('avatar');
                    ava.src =  $scope.contact.photo;
                    $scope.hasImage = true;
                }
                $scope.generateQR();
                disableEditMode();
            });
        }

        function hexToBase64(str) {
            return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
        }

        function toPngBlob(str){
            var hexStr = str.slice(2);
            var buf = new ArrayBuffer(hexStr.length/2);
            var byteBuf = new Uint8Array(buf);
            for (var i=0; i<hexStr.length; i+=2) {
                byteBuf[i/2] = parseInt(hexStr.slice(i,i+2),16);
            }
            var blob = new Blob([byteBuf], {type: "image/png"});
            return blob;
        }

        function initProperties(){
            ContactModel.propertyList($scope.domain, function (err, res) {
                if(err){
                    if(err.statusCode === 404 && err.message === 'Not found contacts'){
                        ContactModel.updateProperty([], $scope.domain, function (err_create, res_create) {
                            if(err_create)
                                return notifi.error(err_create, 5000);
                        });
                    }
                    else{
                        return notifi.error(err, 5000);
                    }
                }
                $scope.properties = res && res.data && Array.isArray(res.data.data) ? res.data.data : [];
                $scope.properties.sort(function (a, b) {
                    return parseInt(a.index) - parseInt(b.index);
                });
            });
        }

        $scope.init = function () {
            if (!!$route.current.method) {
                return $scope[$route.current.method]();
            };
        }();

        function generateVCard () {
            var tmpCard = angular.copy($scope.vCard);
            var communications = "";
            $scope.contact.communications.forEach(function (item) {
                if(item.type_name.toLowerCase() === "phone"){
                    communications = communications + angular.copy($scope.vTelTemplate.replace("#PHONE_NUMBER#", item.number));
                }
                else if(item.type_name.toLowerCase() === "email"){
                    communications = communications + angular.copy($scope.vEmailTemplate.replace("#EMAIL#", item.number));
                }
            });
            tmpCard = tmpCard.replace(/#NAME#/g, $scope.contact.name)
                .replace(/#COMPANY#/g, $scope.contact.company_name)
                .replace(/#JOB#/g, $scope.contact.job_name)
                .replace(/#DESCRIPTION#/g, $scope.contact.description)
                .replace(/#COMMUNICATIONS#/g, communications);
            return tmpCard;
        }

        $scope.createVCard = function(){
            var card = generateVCard();
            utils.saveDataToDisk(card, "vcard.vcf", null);
        }

        $scope.generateQR = function(){
            var card = generateVCard();
            if($scope.qr){
                $scope.qr.clear();
                $scope.qr.makeCode(card);
            }
            else{
                $scope.qr = new qrcode(document.getElementById("qrcode"), card);
            }
            document.getElementById('qrcode').title = "";
        }

    }]);
});