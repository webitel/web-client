"use strict";

define(['app', 'scripts/webitel/utils', 'modules/widget/widgetModel', 'modules/calendar/calendarModel', 'modules/queueCallback/queueCallbackModel', 'modules/widget/widgetDefaultValues', 'modules/callflows/public/publicModel'], function (app, utils) {
    app.controller("WidgetCtrl", ['$scope', '$http', '$modal', '$routeParams', '$filter',
        '$location', '$route', 'notifi', '$confirm', 'webitel', 'TableSearch', '$timeout', '$rootScope', 'WidgetModel', 'CalendarModel', 'QueueCallbackModel', 'WidgetDefault', 'CallflowPublicModel',
        function ($scope, $http, $modal, $routeParams, $filter, $location, $route, notifi, $confirm, webitel, TableSearch,
                  $timeout, $rootScope, WidgetModel, CalendarModel, QueueCallbackModel, WidgetDefault, CallflowPublicModel) {

            $scope.canDelete = true || webitel.connection.session.checkResource('widget', 'd');
            $scope.canUpdate = true || webitel.connection.session.checkResource('widget', 'u');
            $scope.canCreate = true || webitel.connection.session.checkResource('widget', 'c');

            $scope.viewMode = !$scope.canUpdate;

            $scope.rowCollection = [];
            $scope.displayedCollection = [];
            $scope.isLoading = false;
            $scope.isReviewMode = false;
            $scope.domain = webitel.domain();
            $scope.horisontal = {
                pos: "left",
                x: 0
            };
            $scope.vertical = {
                pos: "bottom",
                y: 0
            };
            $scope.canDelete = true || webitel.connection.session.checkResource('widget', 'd');
            $scope.canUpdate = true || webitel.connection.session.checkResource('widget', 'u');
            $scope.canCreate = true || webitel.connection.session.checkResource('widget', 'c');

            $scope.viewMode = !$scope.canUpdate;

            $scope.changePanel = function (panelStatistic) {
                $scope.panelStatistic = !!panelStatistic;
            };

            $scope.query = TableSearch.get('domains');

            $scope.$watch("query", function (newVal) {
                TableSearch.set(newVal, 'domains');
            });

            $scope.calendar={};
            $scope.country = {};
            $scope.validate = {};
            $scope.blackIp = {};
            $scope.callflow = {};

            function onCopied() {
                return notifi.info("Copy", 1000);
            }

            function onCopiedFail(err) {
                return notifi.error(err, 5000);
            }

            $scope.script = angular.copy(WidgetDefault.script);
            $scope.widget = angular.copy(WidgetDefault.widget);
            $scope.widget.config.lang = angular.copy(WidgetDefault.en_lang);
            $scope.fontFamilies = angular.copy(WidgetDefault.fontFamilies);
            $scope.languages = angular.copy(WidgetDefault.languages);

            $scope.calendars = [];
            $scope.queues = [];
            $scope.publics = [];

            $scope.onCopied = onCopied;
            $scope.onCopiedFail = onCopiedFail;
            $scope.reloadData = reloadData;
            $scope.closePage = closePage;
            $scope.create = create;
            $scope.save = save;
            $scope.edit = edit;
            $scope.removeItem = removeItem;
            $scope.addCountry = addCountry;
            $scope.deleteCountry = deleteCountry;
            $scope.addValidate = addValidate;
            $scope.deleteValidate = deleteValidate;
            $scope.addToBlacklist = addToBlacklist;
            $scope.deleteFromBlacklist = deleteFromBlacklist;
            $scope.changeLanguage = changeLanguage;
            $scope.getCalendar = getCalendar;
            $scope.reviewButton = reviewButton;
            $scope.initCallbacks = initCallbacks;
            $scope.initCalendars = initCalendars;
            $scope.initCallflows = initCallflows;
            $scope.initCountries = initCountries;

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
                closePage();
            });

            $scope.$on('$destroy', function () {
                if($scope.isReviewMode){
                    var button = angular.element(document.getElementById('callMeContent'));
                    button.remove();
                }
                changeDomainEvent();
            });

            function changeLanguage(){
                if($scope.widget.language === "ru"){
                    $scope.widget.config.lang = angular.copy(WidgetDefault.ru_lang);
                }
                if($scope.widget.language === "ua"){
                    $scope.widget.config.lang = angular.copy(WidgetDefault.ua_lang);
                }
                if($scope.widget.language === "en"){
                    $scope.widget.config.lang = angular.copy(WidgetDefault.en_lang);
                }
            }

            $scope.$watch("callflow", function (newVal) {
                if(newVal.value){
                    var val = newVal.value;
                    if(($scope.widget.callflow_id!=val.id && $scope.widget.config.destinationNumber!=val.number) ||
                        ($scope.widget.callflow_id==val.id && $scope.widget.config.destinationNumber!=val.number) ||
                        ($scope.widget.callflow_id!=val.id && $scope.widget.config.destinationNumber==val.number)){
                        $scope.widget.callflow_id = val.id;
                        $scope.widget.config.destinationNumber = val.number;
                    }
                }
            }, true);

            $scope.$watchCollection("horisontal", function (newVal) {
                if(newVal.x!==null){
                    if(newVal.pos=='left'){
                        delete $scope.widget.config.css.buttonPosition.right;
                        $scope.widget.config.css.buttonPosition.left = newVal.x.toString()+"px";
                    }
                    else{
                        delete $scope.widget.config.css.buttonPosition.left;
                        $scope.widget.config.css.buttonPosition.right = newVal.x.toString()+"px";
                    }
                }
            });

            $scope.$watchCollection("vertical", function (newVal) {
                if(newVal.y!==null){
                    if(newVal.pos=='top'){
                        delete $scope.widget.config.css.buttonPosition.bottom;
                        $scope.widget.config.css.buttonPosition.top = newVal.y.toString()+"px";
                    }
                    else{
                        delete $scope.widget.config.css.buttonPosition.top;
                        $scope.widget.config.css.buttonPosition.bottom = newVal.y.toString()+"px";
                    }
                }
            });
            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                reloadData();
            }, true);

            $scope.$watch('widget', function(newValue, oldValue) {
                if ($scope.isReviewMode){
                    var config = angular.copy($scope.widget.config);
                    callMeButtonGenerate(config);
                }
                if ($scope.widget._new)
                    return $scope.isEdit = $scope.isNew = true;

                return $scope.isEdit = !!oldValue.id;
            }, true);

            $scope.cancel = function () {
                $scope.widget = angular.copy($scope.oldWidget);
                disableEditMode();
            };

            function disableEditMode () {
                $timeout(function () {
                    $scope.isEdit = false;
                }, 0);
            }

            function reviewButton() {
                if(!$scope.isReviewMode){
                    window.WebitelCallbackId  = $scope.widget.id;
                    window.WebitelCallbackHost   = $scope.widget._widgetBaseUri;
                    window.WebitelCallbackDomain   = $scope.widget.domain;
                    $scope.isReviewMode = true;
                    var gcw = document.createElement('script'); gcw.type = 'text/javascript'; gcw.async = true;
                    gcw.src = './modules/widget/widget.client.js';
                    var sn = document.getElementsByTagName('script')[0]; sn.parentNode.insertBefore(gcw, sn);
                }
                else{
                    $scope.isReviewMode = false;
                    var button = angular.element(document.getElementById('callMeContent'));
                    button.remove();
                }
            }

            function addCountry(){
                if($scope.country.value){
                    $scope.widget.config.showInCountry.countries.push(angular.copy($scope.country.value));
                    $scope.country={};
                }
            }

            function deleteCountry(index){
                $scope.widget.config.showInCountry.countries.splice(index, 1);
            }

            function addValidate(){
                if($scope.validate.value){
                    $scope.widget.config.validateNumbers.push(angular.copy($scope.validate.value));
                    $scope.validate={};
                }
            }

            function deleteValidate(index){
                $scope.widget.config.validateNumbers.splice(index, 1);
            }

            function addToBlacklist(){
                if($scope.blackIp.value){
                    if(!$scope.widget.blacklist)$scope.widget.blacklist=[];
                    $scope.widget.blacklist.push(angular.copy($scope.blackIp.value));
                    $scope.blackIp={};
                }
            }

            function deleteFromBlacklist(index){
                $scope.widget.blacklist.splice(index, 1);
            }

            function removeItem(row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        WidgetModel.remove(row.id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            reloadData();
                        });
                    });
            }

            function getCalendar() {
                CalendarModel.item($scope.domain, $scope.widget.config.calendar.id, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    }
                    $scope.widget.config.calendar.accept = item.accept;
                    $scope.widget.config.calendar.timezone = item.timeZone.id;
                    var arr = [];
                    item.except.forEach(function(i){
                        var date = new Date(i.date);
                       if(i.repeat==1){
                           arr.push({
                              date: (date.getUTCMonth()+1)+"-" + date.getUTCDate(),
                              repeat: i.repeat
                           });
                       }
                       else{
                           arr.push({
                               date: date.getUTCFullYear()+"-"+(date.getUTCMonth()+1)+"-" + date.getUTCDate(),
                               repeat: i.repeat
                           });
                       }
                    });
                    $scope.widget.config.calendar.except = arr;
                });
            }

            function initCallbacks(){
                var col = encodeURIComponent(JSON.stringify({
                    name: 1,
                    id: 1
                }));
                QueueCallbackModel.list({
                    columns: col,
                    limit: 5000,
                    page: 1,
                    domain: $scope.domain
                }, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);
                    var arr = [];
                    angular.forEach(res.data || res.info, function(item) {
                        arr.push(item);
                    });
                    $scope.queues = arr;
                });
            }

            function initCalendars(){
                CalendarModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    var c = [];
                    var data = res.data;
                    angular.forEach(data, function (v) {
                        c.push({
                            "id": v._id,
                            "name": v.name
                        });
                    });
                    $scope.calendars = c;

                });
            }

            function initCallflows(){
                CallflowPublicModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);
                    var arr = [];
                    angular.forEach(res, function(item) {
                        item.destination_number.map(function(i){
                            arr=arr.concat({ id: item._id, number:i})
                        })
                    });
                    $scope.publics = arr;
                });
            }

            function initCountries() {
                $http.get('./modules/widget/countries.json').success(function(data) {
                    $scope.countries = data;
                });
            }

            function create() {
                initCountries();
                $scope.widget._new = true;
            };

            function save() {
                var cb = function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);

                    if ($scope.widget._new) {
                        return $location.path('/widget/' + res.data[0] + '/edit');
                    } else {
                        $scope.widget.__time = Date.now();
                        return edit();
                    };
                };
                if ($scope.widget._new) {
                    WidgetModel.add(angular.copy($scope.widget), $scope.domain, cb);
                } else {
                    WidgetModel.update($scope.widget, $scope.widget.id, $scope.domain, cb);
                }
            }

            function edit () {
                initCountries();
                var id = $routeParams.id;
                var domain = $routeParams.domain;

                WidgetModel.item(id, domain, function(err, item) {
                    if (err) {
                        return notifi.error(err, 5000);
                    };

                    $scope.oldWidget = angular.copy(item);
                    $scope.widget = item;
                    $scope.callflow.value ={
                        id: $scope.widget.callflow_id,
                        number: $scope.widget.config.destinationNumber
                    };
                    $scope.script = $scope.script.replace("##ID##", id).replace(/##HOST##/g,$scope.widget._widgetBaseUri).replace("##DOMAIN##",$scope.domain);
                    disableEditMode();
                })
            }

            function closePage() {
                $location.path('/widget');
            }

            function reloadData () {
                if ($location.$$path != '/widget')
                    return 0;

                if (!$scope.domain)
                    return $scope.rowCollection = [];

                $scope.isLoading = true;
                var col = encodeURIComponent(JSON.stringify({
                    name: 1,
                    description: 1,
                    id: 1
                }));

                WidgetModel.list({
                    columns: col,
                    limit: 5000,
                    page: 1,
                    domain: $scope.domain
                }, function (err, res) {
                    $scope.isLoading = false;
                    if (err)
                        return notifi.error(err, 5000);
                    var arr = [];
                    angular.forEach(res.data, function(item) {
                        arr.push(item);
                    });
                    $scope.rowCollection = arr;
                });
            }


            $scope.init = function init () {
                if (!!$route.current.method) {
                    return $scope[$route.current.method]();
                }
                reloadData();
            }();

        }])
});