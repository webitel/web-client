'use strict';
define([], function () {
  angular.module('adf.widget.mongodb', ['adf.provider', 'googlechart'])
      .config(function(dashboardProvider){
        dashboardProvider
            .widget('mongodb', {
              title: 'Mongodb',
              description: 'Mongodb charts',
              templateUrl: 'modules/dashboard/widget/mongodb/view.html',
              controller: 'mongodbController',
              controllerAs: 'mongodb',
              edit: {
                templateUrl: 'modules/dashboard/widget/mongodb/edit.html'
              },
              config: {
                height: '600px'
              }
            });
      })
      .controller('mongodbController', function($scope, config){
        $scope.chartSelectionChange = function() {

          if (($scope.chart.type === 'Table' && $scope.chart.data.cols.length === 6 && $scope.chart.options.tooltip.isHtml === true) ||
              ($scope.chart.type !== 'Table' && $scope.chart.data.cols.length === 6 && $scope.chart.options.tooltip.isHtml === false)) {
            $scope.chart.data.cols.pop();
            delete $scope.chart.data.rows[0].c[5];
            delete $scope.chart.data.rows[1].c[5];
            delete $scope.chart.data.rows[2].c[5];
          }


          if ($scope.chart.type === 'Table') {

            $scope.chart.options.tooltip.isHtml = false;

            $scope.chart.data.cols.push({
              id: "data-id",
              label: "Date",
              type: "date"
            });
            $scope.chart.data.rows[0].c[5] = {
              v: "Date(2013,01,05)"
            };
            $scope.chart.data.rows[1].c[5] = {
              v: "Date(2013,02,05)"
            };
            $scope.chart.data.rows[2].c[5] = {
              v: "Date(2013,03,05)"
            };
          }
        };
        $scope.chartObject = $scope.chart = {
          "type": "AreaChart",
          "displayed": false,
          "data": {
            "cols": [
              {
                "id": "month",
                "label": "Month",
                "type": "string",
                "p": {}
              },
              {
                "id": "laptop-id",
                "label": "Laptop",
                "type": "number",
                "p": {}
              },
              {
                "id": "desktop-id",
                "label": "Desktop",
                "type": "number",
                "p": {}
              },
              {
                "id": "server-id",
                "label": "Server",
                "type": "number",
                "p": {}
              },
              {
                "id": "cost-id",
                "label": "Shipping",
                "type": "number"
              }
            ],
            "rows": [
              {
                "c": [
                  {
                    "v": "January"
                  },
                  {
                    "v": 19,
                    "f": "42 items"
                  },
                  {
                    "v": 12,
                    "f": "Ony 12 items"
                  },
                  {
                    "v": 7,
                    "f": "7 servers"
                  },
                  {
                    "v": 4
                  }
                ]
              },
              {
                "c": [
                  {
                    "v": "February"
                  },
                  {
                    "v": 13
                  },
                  {
                    "v": 1,
                    "f": "1 unit (Out of stock this month)"
                  },
                  {
                    "v": 12
                  },
                  {
                    "v": 2
                  }
                ]
              },
              {
                "c": [
                  {
                    "v": "March"
                  },
                  {
                    "v": 24
                  },
                  {
                    "v": 5
                  },
                  {
                    "v": 11
                  },
                  {
                    "v": 6
                  }
                ]
              }
            ]
          },
          "options": {
            "title": "Sales per month",
            "isStacked": "true",
            "fill": 20,
            "displayExactValues": true,
            "vAxis": {
              "title": "Sales unit",
              "gridlines": {
                "count": 10
              }
            },
            "hAxis": {
              "title": "Date"
            }
          },
          "formatters": {}
        }
      });
});