/**
 * Created by i.navrotskyj on 16.02.2016.
 */
'use strict';


define(['app', 'modules/callflows/variables/variablesModel'], function (app) {

    app.controller('CallflowsVariableCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'CallflowVariablesModel',
        function ($scope, webitel, $rootScope, notifi, CallflowVariablesModel) {

            $scope.domain = webitel.domain();
            $scope.canUpdate = webitel.connection.session.checkResource('rotes/domain', 'u');
            $scope.variables = [];
            $scope.rem = [];
            $scope.reloadData = reloadData;
            $scope.save = save;
            $scope.disableActions = true;

            $scope.$on('$destroy', function () {
                changeDomainEvent();
            });

            function reset () {
                $scope.variables = [];
            }

            function save (collection) {
                CallflowVariablesModel.update(collection, $scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err);

                    reloadData();
                    return notifi.info(res.status, 5000);
                });
            };

            $scope.$watch('domain', function(domainName) {
                $scope.domain = domainName;
                $scope.disableActions = !domainName;
                $scope.variables = [];
                if (domainName)
                    reloadData();
            });

            var changeDomainEvent = $rootScope.$on('webitel:changeDomain', function (e, domainName) {
                $scope.domain = domainName;
            });

            function reloadData() {
                CallflowVariablesModel.list($scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err);
                    $scope.variables = res;
                })
            }
        }])
});

/*
return $scope.color = {
    primary: '#248AAF',
    success: '#3CBC8D',
    info: '#29B7D3',
    infoAlt: '#666699',
    warning: '#FAC552',
    danger: '#E9422E'
};
*/