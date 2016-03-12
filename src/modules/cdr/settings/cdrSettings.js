/**
 * Created by i.navrotskyj on 07.03.2016.
 */
'use strict';

define(['app', 'modules/cdr/cdrModel'], function (app) {
    app.controller('CDRSettingsCtrl', ['$scope', 'CdrModel', '$modal', 'notifi', function ($scope, CdrModel, $modal, notifi) {
        $scope.displayedCollection = [];
        $scope.reloadData = reloadData;
        $scope.addColumn = addColumn;
        $scope.remove = remove;
        $scope.editItem = editItem;

        function reloadData() {
            var data = [];
            var _c = angular.copy(CdrModel.mapColumn());
            angular.forEach(_c, function (item, key) {
                if (item.noRender) return;
                item.id = key;
                data.push(item);
            });
            $scope.rowCollection = data;

        };

        function remove(item) {
            CdrModel.removeMapColumn(item.id);
            reloadData();
        };

        function addColumn() {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/cdr/settings/column.html',
                controller: 'CDRSettingsColumnCtrl',
                resolve: {
                    column: function () {
                        return {_new: true};
                    }
                }
            });

            modalInstance.result.then(function (newCol) {
                var col = angular.copy(newCol);
                try {
                    var c = new CdrModel.Column(col.id, col.type, col.caption, setTagsInput(col));
                    c.save();
                } catch (e) {
                    notifi.error(e)
                }
                reloadData();
            }, function () {

            });
        };

        function setTagsInput(col) {
            if (col.options && angular.isArray(col.options.select)) {
                var data = [];
                angular.forEach(col.options.select, function (item) {
                    if (item.text)
                        return data.push(item.text);
                    return data.push(item);
                });
                col.options.select = data;
            };
            return col.options;
        };

        function editItem (row) {
            var item = CdrModel.getMapColumn(row.id);
            if (!item)
                return notifi.error(new Error("Bad column id"), 5000);

            var col = angular.copy(item);

            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '/modules/cdr/settings/column.html',
                controller: 'CDRSettingsColumnCtrl',
                resolve: {
                    column: function () {
                        return col;
                    }
                }
            });

            modalInstance.result.then(function (editCol) {
                try {
                    var col = angular.copy(editCol);
                    var c = new CdrModel.Column(col.id, col.type, col.caption, setTagsInput(col));
                    c.save();
                } catch (e) {
                    notifi.error(e);
                }
                reloadData();
            }, function () {

            });
        };

        reloadData();
    }]);

    app.controller('CDRSettingsColumnCtrl', function ($scope, $modalInstance, column, notifi) {
        $scope.column = column;
        $scope.types = [
            {
                id: "string"
            },
            {
                id: "timestamp"
            },
            {
                id: "integer"
            },
            {
                id: "select"
            }
        ];

        $scope.ok = function () {
            if (!column.id || !column.type || !column.caption) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close($scope.column, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });
});