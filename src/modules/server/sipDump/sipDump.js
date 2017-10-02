/**
 * Created by matvij on 28.09.17.
 */
"use strict";

define(['app', 'scripts/webitel/utils', 'modules/server/sipDump/sipDumpModel'], function (app, utils) {

    app.controller('ServerSipDumpCtrl', ['$scope', '$modal', 'webitel', '$rootScope', 'notifi', '$timeout', 'ServerSipDumpModel', '$confirm',
        function ($scope, $modal, webitel, $rootScope, notifi, $timeout, ServerSettingsModel, $confirm) {

            $scope.add = function(){
                var modalInstance = $modal.open({
                    animation: true,
                    backdrop: false,
                    templateUrl: '/modules/server/sipDump/sipDumpModal.html',
                    resolve: {
                        domainName: function () {
                            return $scope.domain;
                        }
                    },
                    controller: function ($modalInstance, $scope, domainName) {
                        var self = $scope;

                        self.duration = 0;
                        self.filtr = '';

                        self.ok = function () {
                            $modalInstance.close({
                                duration: self.duration,
                                filter: self.filtr
                            });
                        };

                        self.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                });

                modalInstance.result.then(function (option) {
                    debugger;
                });
            }


        }
    ]);
});