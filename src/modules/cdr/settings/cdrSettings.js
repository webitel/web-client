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
        $scope.reset = reset;
        $scope.up = up;
        $scope.down = down;

        function reset () {
            saveColumns(CdrModel.getDefaultColumnsSettings())
        }

        function remove(rows, id) {
            rows.splice(id, 1);
            saveColumns(rows);
        }

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
                $scope.rowCollection.push(newCol);
                saveColumns($scope.rowCollection);
            }, function () {

            });
        }

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
        }

        function editItem (rows, id) {
            var col = angular.copy(rows[id]);

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
                rows[id] = editCol;
                saveColumns(rows);
            }, function () {

            });
        }
        
        function saveColumns(columns) {
            CdrModel.updateGridColumns(columns, function (err) {
                reloadData();
            })
        }

        function reloadData() {
            CdrModel.listGridColumns(function (err, res) {
                if (err)
                    return err;

                $scope.rowCollection = res;
            })
        }

        function up(rows, id) {
            if (rows[id - 1]) {
                var v = rows[id];
                rows[id] = rows[id - 1];
                rows[id - 1] = v;
                saveColumns(rows);
            }
        }

        function down(rows, id) {
            if (rows[id + 1]) {
                var v = rows[id];
                rows[id] = rows[id + 1];
                rows[id + 1] = v;
                saveColumns(rows);
            }
        }
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
            }
        ];

        $scope.ok = function () {
            if (!column.name || !column.type || !column.caption) {
                return notifi.error(new Error("Bad parameters"))
            }
            $modalInstance.close($scope.column, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });
});