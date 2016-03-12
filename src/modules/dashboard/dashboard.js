/**
 * Created by i.navrotskyj on 21.02.2016.
 */
'use strict';

define(['app', "sortable", "angularAMD",
    'dashboard',
    'widget-iframe',
    'widget-base',
    'widget-link',
    'widget-markdown',
    'widget-mongodb'

], function (app, sortable, angularAMD) {
    window.Sortable = sortable;

    function templateDefDash(i) {
        return {
            "active": true,
            "title": "Dashboard " + i,
            "structure": "4-8",
            "rows": [
                {
                    "columns": [
                        {
                            "styleClass": "col-md-4",
                            "widgets": [],
                            "cid": "1456087280613-3"
                        },
                        {
                            "styleClass": "col-md-8",
                            "widgets": [],
                            "cid": "1456087280615-4"
                        }
                    ]
                }
            ],
            "titleTemplateUrl": "../src/templates/dashboard-title.html"
        }
    };

    function findIdModel(all, item) {
        for (var i in all)
            if (all[i] == item)
                return i;
    };

    //app.requires.push('adf.provider');
    //angular.forEach(['adf', 'adf.widget.iframe',  'adf.widget.linklist', 'adf.widget.markdown', 'adf.structures.base'], function (value) {
    //    app.requires.push(value);
    //});

    app.controller('DashboardCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', '$localStorage',
        function ($scope, webitel, $rootScope, notifi, $localStorage) {
            var dashModel = $localStorage.dashModel;
            if (!dashModel)
                dashModel =  [
                    {
                        "active": true,
                        "title": "Dashboard",
                        "structure": "4-8",
                        "rows": [
                            {
                                "columns": [
                                    {
                                        "styleClass": "col-md-4",
                                        "widgets": [
                                            {
                                                "type": "linklist",
                                                "config": {
                                                    "links": [
                                                        {
                                                            "href": "https://cdr-d1.webitel.com:5601",
                                                            "title": "Kibana"
                                                        },
                                                        {
                                                            "title": "webitel.ru",
                                                            "href": "http://webitel.ru"
                                                        }
                                                    ]
                                                },
                                                "title": "Links",
                                                "titleTemplateUrl": "../src/templates/widget-title.html",
                                                "wid": "1456088232183-1"
                                            }
                                        ],
                                        "cid": "1456087280613-3"
                                    },
                                    {
                                        "styleClass": "col-md-8",
                                        "widgets": [
                                            {
                                                "type": "markdown",
                                                "config": {
                                                    "content": "# engine\n\n[![Build Status](https://dev.webitel.com/buildStatus/icon?job=build_engine)](https://dev.webitel.com/job/build_engine) [![ImageLayers Size](https://img.shields.io/imagelayers/image-size/webitel/engine/latest.svg)](https://hub.docker.com/r/webitel/engine/) [![Documentation Status](https://readthedocs.org/projects/webitel/badge/?version=latest)](http://api.webitel.com/en/latest/?badge=latest)\n\n## Default ports\n\n`10022/tcp` - WebSocket Server port\n\n## Supported Docker versions\n\nThis image is officially supported on Docker version `1.9` and newest.\n\n## User Feedback\n\n### Issues\nIf you have any problems with or questions about this image, please contact us through a [Webitel Jira](https://my.webitel.com/servicedesk/customer/portal/1/create/22)."
                                                },
                                                "title": "Markdown",
                                                "titleTemplateUrl": "../src/templates/widget-title.html",
                                                "wid": "1456088368722-2"
                                            }
                                        ],
                                        "cid": "1456087280615-4"
                                    }
                                ]
                            }
                        ],
                        "titleTemplateUrl": "../src/templates/dashboard-title.html"
                    }
                ];
            dashModel.active = true;
            $scope.models = dashModel;
            
            $scope.addDash = function () {
                $scope.models.push(templateDefDash($scope.models.length + 1));
            };
            $scope.removeItem = function (item) {
                $scope.models.splice( +findIdModel($scope.models, item), 1);
            };

            $scope.$on('adfDashboardChanged', function(event, name, model) {
                var id = findIdModel($scope.models, model);
                $scope.models[id] = model;
                $localStorage.dashModel = $scope.models;
            });
        }])
});
