/**
 * Created by matvij on 16.11.17.
 */
define(['app', 'async', 'scripts/webitel/utils', 'modules/cdr/libs/fileSaver'], function(app, async, utils, fileSaver) {

    function moveUp (arr, value, by) {
        if (!arr)
            arr = [];

        var index = arr.indexOf(value),
            newPos = index - (by || 1);

        if(index === -1)
            throw new Error("Element not found in array");

        if(newPos < 0)
            newPos = 0;

        arr.splice(index,1);
        arr.splice(newPos,0,value);
    }
    function moveDown(arr, value, by) {
        if (!arr)
            arr = [];
        var index = arr.indexOf(value),
            newPos = index + (by || 1);

        if(index === -1)
            throw new Error("Element not found in array");

        if(newPos >= arr.length)
            newPos = arr.length;

        arr.splice(index, 1);
        arr.splice(newPos,0, value);
    }
    function timeToString(time) {
        if (time)
            return new Date(time).toLocaleString();
    }

    var ExportColumns = {
        "name": {
            selected: false,
            name: "Name",
            field: 'name'
        },
        "callSuccessful": {
            selected: false,
            name: "Call success",
            field: 'callSuccessful'
        },
        "_id": {
            selected: false,
            name: "Id",
            field: '_id'
        },
        "priority": {
            selected: false,
            name: "Priority",
            field: 'priority'
        },
        "variable": {
            "name": "Variable",
            "field": "variable",
            "type": "variable",
            "value": "",
            "varName": ""
        },
        //"timezone": {
        //    selected: false,
        //    name: "Timezone",
        //    field: 'timezone'
        //},
        "number": {
            name: "Number",
            field: 'number',
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": true
            }
        },
        "description": {
            name: "Description",
            field: 'description',
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": true
            }
        },
        "priority_number": {
            selected: false,
            name: "Priority number",
            field: "priority_number",
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": true
            }
        },
        "state": {
            selected: false,
            name: "State",
            field: "state",
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": true
            }
        },
        "number_1": {
            selected: false,
            name: "number_1",
            field: 'number',
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_1": {
            selected: false,
            name: "priority_1",
            field: "priority",
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_1": {
            selected: false,
            name: "state_1",
            field: "state",
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_1": {
            selected: false,
            name: "description_1",
            field: "description",
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_1": {
            selected: false,
            name: "type_1",
            field: "type",
            position: 0,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_2": {
            selected: false,
            name: "number_2",
            field: 'number',
            position: 1,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_2": {
            selected: false,
            name: "priority_2",
            field: "priority",
            position: 1,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_2": {
            selected: false,
            name: "state_2",
            field: "state",
            position: 1,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_2": {
            selected: false,
            name: "description_2",
            field: "description",
            position: 1,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_2": {
            selected: false,
            name: "type_2",
            field: "type",
            position: 1,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_3": {
            selected: false,
            name: "number_3",
            field: 'number',
            position: 2,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_3": {
            selected: false,
            name: "priority_3",
            field: "priority",
            position: 2,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_3": {
            selected: false,
            name: "state_3",
            field: "state",
            position: 2,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_3": {
            selected: false,
            name: "description_3",
            field: "description",
            position: 2,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_3": {
            selected: false,
            name: "type_3",
            field: "type",
            position: 2,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_4": {
            selected: false,
            name: "number_4",
            field: 'number',
            position: 3,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_4": {
            selected: false,
            name: "priority_4",
            field: "priority",
            position: 3,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_4": {
            selected: false,
            name: "state_4",
            field: "state",
            position: 3,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_4": {
            selected: false,
            name: "description_4",
            field: "description",
            position: 3,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_4": {
            selected: false,
            name: "type_4",
            field: "type",
            position: 3,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_5": {
            selected: false,
            name: "number_5",
            field: 'number',
            position: 4,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_5": {
            selected: false,
            name: "priority_5",
            field: "priority",
            position: 4,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_5": {
            selected: false,
            name: "state_5",
            field: "state",
            position: 4,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_5": {
            selected: false,
            name: "description_5",
            field: "description",
            position: 4,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_5": {
            selected: false,
            name: "type_5",
            field: "type",
            position: 4,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_6": {
            selected: false,
            name: "number_6",
            field: 'number',
            position: 5,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_6": {
            selected: false,
            name: "priority_6",
            field: "priority",
            position: 5,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_6": {
            selected: false,
            name: "state_6",
            field: "state",
            position: 5,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_6": {
            selected: false,
            name: "description_6",
            field: "description",
            position: 5,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_6": {
            selected: false,
            name: "type_6",
            field: "type",
            position: 5,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_7": {
            selected: false,
            name: "number_7",
            field: 'number',
            position: 6,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_7": {
            selected: false,
            name: "priority_7",
            field: "priority",
            position: 6,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_7": {
            selected: false,
            name: "state_7",
            field: "state",
            position: 6,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_7": {
            selected: false,
            name: "description_7",
            field: "description",
            position: 6,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_7": {
            selected: false,
            name: "type_7",
            field: "type",
            position: 6,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_8": {
            selected: false,
            name: "number_8",
            field: 'number',
            position: 7,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_8": {
            selected: false,
            name: "priority_8",
            field: "priority",
            position: 7,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_8": {
            selected: false,
            name: "state_8",
            field: "state",
            position: 7,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_8": {
            selected: false,
            name: "description_8",
            field: "description",
            position: 7,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_8": {
            selected: false,
            name: "type_8",
            field: "type",
            position: 7,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_9": {
            selected: false,
            name: "number_9",
            field: 'number',
            position: 8,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_9": {
            selected: false,
            name: "priority_9",
            field: "priority",
            position: 8,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_9": {
            selected: false,
            name: "state_9",
            field: "state",
            position: 8,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_9": {
            selected: false,
            name: "description_9",
            field: "description",
            position: 8,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_9": {
            selected: false,
            name: "type_9",
            field: "type",
            position: 8,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "number_10": {
            selected: false,
            name: "number_10",
            field: 'number',
            position: 9,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "priority_10": {
            selected: false,
            name: "priority_10",
            field: "priority",
            position: 9,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "state_10": {
            selected: false,
            name: "state_10",
            field: "state",
            position: 9,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "description_10": {
            selected: false,
            name: "description_10",
            field: "description",
            position: 9,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "type_10": {
            selected: false,
            name: "type_10",
            field: "type",
            position: 9,
            type: 'communications',
            filter: {
                "allProbe": false
            }
        },
        "_endCause": {
            name: "End cause",
            "field": "_endCause"
        },
        "_probeCount": {
            name: "Attempts",
            "field": "_probeCount"
        },
        "callTime": {
            "name": "Call time",
            "type": "lastCall",
            "field": "_log.steps.time"
        },
        "expire": {
            "name": "Expire",
            "type": "time",
            "field": "expire"
        },
        "attempt_cause": {
            "name": "Attempt end cause",
            "field": "attempt_cause",
            filter: {
                "allProbe": true
            }
        },
        "attempt_agent": {
            "name": "Agent",
            "field": "attempt_agent",
            filter: {
                "allProbe": true
            }
        },
        "attempt_amd_result": {
            "name": "AMD result",
            "field": "attempt_amd_result",
            filter: {
                "allProbe": true
            }
        },
        "attempt_communication_type_name": {
            "name": "Communication type name",
            "field": "attempt_communication_type_name",
            filter: {
                "allProbe": true
            }
        },
        "attempt_communication_type_code": {
            "name": "Communication type code",
            "field": "attempt_communication_type_code",
            filter: {
                "allProbe": true
            }
        },
        "attempt_callback_success": {
            name: "Callback success",
            field: "_log.callback.data.success",
            filter: {
                "allProbe": true
            }
        },
        "attempt_callback_description": {
            name: "Callback description",
            field: "_log.callback.data.description",
            filter: {
                "allProbe": true
            }
        }
    };
    var MemberColumns = {
        "name": {
            selected: false,
            name: "Name",
            field: 'name'
        },
        "priority": {
            selected: false,
            name: "Priority",
            field: 'priority'
        },
        "variable": {
            "name": "Variable",
            "field": "variable",
            "type": "variable",
            "value": "",
            "varName": ""
        },
        //"timezone": {
        //    selected: false,
        //    name: "Timezone",
        //    field: 'timezone'
        //},
        "number_1": {
            selected: false,
            name: "number_1",
            field: 'number',
            position: 0,
            type: 'communications'
        },
        "priority_1": {
            selected: false,
            name: "priority_1",
            field: "priority",
            position: 0,
            type: 'communications'
        },
        "description_1": {
            selected: false,
            name: "description_1",
            field: "description",
            position: 0,
            type: 'communications'
        },
        "type_1": {
            selected: false,
            name: "type_1",
            field: "type",
            position: 0,
            type: 'communications'
        },
        "number_2": {
            selected: false,
            name: "number_2",
            field: 'number',
            position: 1,
            type: 'communications'
        },
        "priority_2": {
            selected: false,
            name: "priority_2",
            field: "priority",
            position: 1,
            type: 'communications'
        },
        "description_2": {
            selected: false,
            name: "description_2",
            field: "description",
            position: 1,
            type: 'communications'
        },
        "type_2": {
            selected: false,
            name: "type_2",
            field: "type",
            position: 1,
            type: 'communications'
        },
        "number_3": {
            selected: false,
            name: "number_3",
            field: 'number',
            position: 2,
            type: 'communications'
        },
        "priority_3": {
            selected: false,
            name: "priority_3",
            field: "priority",
            position: 2,
            type: 'communications'
        },
        "description_3": {
            selected: false,
            name: "description_3",
            field: "description",
            position: 2,
            type: 'communications'
        },
        "type_3": {
            selected: false,
            name: "type_3",
            field: "type",
            position: 2,
            type: 'communications'
        },
        "number_4": {
            selected: false,
            name: "number_4",
            field: 'number',
            position: 3,
            type: 'communications'
        },
        "priority_4": {
            selected: false,
            name: "priority_4",
            field: "priority",
            position: 3,
            type: 'communications'
        },
        "description_4": {
            selected: false,
            name: "description_4",
            field: "description",
            position: 3,
            type: 'communications'
        },
        "type_4": {
            selected: false,
            name: "type_4",
            field: "type",
            position: 3,
            type: 'communications'
        },
        "number_5": {
            selected: false,
            name: "number_5",
            field: 'number',
            position: 4,
            type: 'communications'
        },
        "priority_5": {
            selected: false,
            name: "priority_5",
            field: "priority",
            position: 4,
            type: 'communications'
        },
        "description_5": {
            selected: false,
            name: "description_5",
            field: "description",
            position: 4,
            type: 'communications'
        },
        "type_5": {
            selected: false,
            name: "type_5",
            field: "type",
            position: 4,
            type: 'communications'
        },
        "number_6": {
            selected: false,
            name: "number_6",
            field: 'number',
            position: 5,
            type: 'communications'
        },
        "priority_6": {
            selected: false,
            name: "priority_6",
            field: "priority",
            position: 5,
            type: 'communications'
        },
        "description_6": {
            selected: false,
            name: "description_6",
            field: "description",
            position: 5,
            type: 'communications'
        },
        "type_6": {
            selected: false,
            name: "type_6",
            field: "type",
            position: 5,
            type: 'communications'
        },
        "number_7": {
            selected: false,
            name: "number_7",
            field: 'number',
            position: 6,
            type: 'communications'
        },
        "priority_7": {
            selected: false,
            name: "priority_7",
            field: "priority",
            position: 6,
            type: 'communications'
        },
        "description_7": {
            selected: false,
            name: "description_7",
            field: "description",
            position: 6,
            type: 'communications'
        },
        "type_7": {
            selected: false,
            name: "type_7",
            field: "type",
            position: 6,
            type: 'communications'
        },
        "number_8": {
            selected: false,
            name: "number_8",
            field: 'number',
            position: 7,
            type: 'communications'
        },
        "priority_8": {
            selected: false,
            name: "priority_8",
            field: "priority",
            position: 7,
            type: 'communications'
        },
        "description_8": {
            selected: false,
            name: "description_8",
            field: "description",
            position: 7,
            type: 'communications'
        },
        "type_8": {
            selected: false,
            name: "type_8",
            field: "type",
            position: 7,
            type: 'communications'
        },
        "number_9": {
            selected: false,
            name: "number_9",
            field: 'number',
            position: 8,
            type: 'communications'
        },
        "priority_9": {
            selected: false,
            name: "priority_9",
            field: "priority",
            position: 8,
            type: 'communications'
        },
        "description_9": {
            selected: false,
            name: "description_9",
            field: "description",
            position: 8,
            type: 'communications'
        },
        "type_9": {
            selected: false,
            name: "type_9",
            field: "type",
            position: 8,
            type: 'communications'
        },
        "number_10": {
            selected: false,
            name: "number_10",
            field: 'number',
            position: 9,
            type: 'communications'
        },
        "priority_10": {
            selected: false,
            name: "priority_10",
            field: "priority",
            position: 9,
            type: 'communications'
        },
        "description_10": {
            selected: false,
            name: "description_10",
            field: "description",
            position: 9,
            type: 'communications'
        },
        "type_10": {
            selected: false,
            name: "type_10",
            field: "type",
            position: 9,
            type: 'communications'
        },
        "expire": {
            name: "Expire",
            field: "expire",
            type: "time"
        }
    };
    var SqlColumnsExport = {
        "name": {
            name: "Name"
        },
        string:{name:'String'},
        "callSuccessful": {
            name: "Call success"
        },
        "_id": {
            name: "Id"
        },
        "variables": {
            "name": "Variable"
        },
        // "priority_number": {
        //     name: "Priority number"
        // },
        "communications":{
            name: "Communications",
            values:[{name:'Priority', value:'priority'},{name:'Number', value:'number'},{name:'Description', value:'description'},{name:'Type', value:'type'}]
        },
        "_endCause": {
            name: "End cause"
        },
        "_probeCount": {
            name: "Attempts"
        },
        "expire": {
            "name": "Expire"
        },
        "attempt_cause": {
            "name": "Attempt end cause"
        },
        "attempt_agent": {
            "name": "Agent"
        },
        "attempt_amd_result": {
            "name": "AMD result"
        },
        "attempt_communication_type_name": {
            "name": "Communication type name"
        },
        "_log.callNumber": {
            "name": "Call number"
        },
        "_log.causeQ850": {
            "name": "Cause code"
        },
        "_log.bridgedTime": {
            "name": "Bridged"
        },
        "_log.callState": {
            "name": "State"
        },
        "_log.callTime": {
            "name": "Call time"
        },
        "_log.callDescription": {
            "name": "Description"
        },
        "_log.callback.data.description": {
            "name": "Callback description"
        }
    };
    var SqlColumnsImport = {
        "name": {
            name: "Name"
        },
        "string":{
            name:'String'
        },
        "variables": {
            "name": "Variable"
        },
        "communications":{
            name: "Communications",
            values:[{name:'Priority', value:'priority'},{name:'Number', value:'number'},{name:'Description', value:'description'},{name:'Type', value:'type'}]
        },
        "expire": {
            name: "Expire"
        }
    };
    app.controller('MemberDialerImportCtrl', ['$scope', '$modalInstance', 'notifi', 'importTemplate', function ($scope, $modalInstance, notifi, importTemplate) {

        $scope.settings = angular.copy(importTemplate);
        $scope.previewData = [];
        $scope.columns = angular.copy(importTemplate.data);


        $scope.fileCsvOnLoad = function (data) {
            var members = utils.CSVToArray(data, $scope.settings.separator);
            $scope.settings.data = members;
            $scope.previewData = members.slice(0, 5);
        };

        $scope.ok = function () {
            var template = {name: null, communications: [], variables: {}};

            angular.forEach($scope.columns, function (item) {
                var c = $scope.MemberColumns[item.value];
                if (c) {
                    if (!c.type) {
                        template[c.field] = item.id;
                    } else if (c.type === 'variable' && item.varName) {
                        template.variables[item.varName] = item.id;
                    } else if (c.type === 'communications') {
                        if (!template.communications[c.position])
                            template.communications[c.position] = {};
                        template.communications[c.position][c.field] = item.id
                    } else if (c.type === 'time') {
                        template[c.field] = {
                            id: item.id,
                            format: item.format
                        }
                    }
                }
            });
            if (template.name === null || template.communications.length == 0)
                return notifi.error(new Error('Bad settings.'), 5000);

            $scope.settings.template = template;
            $modalInstance.close($scope.settings, 5000);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.MemberColumns = MemberColumns;

        $scope.changeColumnsAlias = function (a, b) {

        }

        $scope.CharSet = utils.CharSet;
    }]);

    app.controller('CsvTemplateCtrl', ['$scope', 'DialerModel', '$modalInstance', 'notifi', 'dialerId', 'domainName', 'funcParams',
        function ($scope, DialerModel, $modalInstance, notifi, dialerId, domainName, funcParams) {

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.template = {
            action: funcParams.method,
            type: 'CSV',
            template: {
                separator: ',',
                allProbe: false,
                headers: true,
                skipFilter: false,
                charSet: 'utf-8',
                data: [],
                template: {},
                fields: {}
            }
        }
        $scope.CharSet = utils.CharSet;
        $scope.tColumns = {};
        if (funcParams.method === 'export') {
            $scope.tColumns = ExportColumns;
        }
        else if (funcParams.method === 'import') {
            $scope.tColumns = MemberColumns;
        }
        if (funcParams.item) {
            DialerModel.members.templateItem(dialerId, funcParams.item.id, domainName, function (err, res) {
                if (err) {
                    notifi.error(err, 5000);
                    return $scope.cancel();
                }
                $scope.template = res && res.data;
            });
        }
        $scope.viewMode = !funcParams.isEdit && !!funcParams.item;

        $scope.up = function (row) {
            moveUp($scope.template.template.data, row)
        };

        $scope.down = function (row) {
            moveDown($scope.template.template.data, row)
        };

        $scope.ok = function () {
            if (funcParams.method === 'import') {
                $scope.template.template.data.forEach(function (item, index) {
                    item.id = index;
                });
            }
            $modalInstance.close({
                template: $scope.template
            });
        };

        $scope.clearExportItem = function (item) {
            if (item.field !== 'callTime' || item.field !== 'expire') delete item.type;
            if (item.field !== 'variable') delete item.value;
        }

        $scope.clearImportItem = function (item) {
            if (item.value !== 'expire') delete item.format;
            if (item.value !== 'variable') delete item.varName;
        }
    }]);

    app.controller('SqlTemplateCtrl', ['$scope', 'DialerModel', '$modalInstance', 'notifi', 'dialerId', 'domainName', 'funcParams',
        function ($scope, DialerModel, $modalInstance, notifi, dialerId, domainName, funcParams) {
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.getImports = function () {

                if (!dialerId || !domainName)
                    return $scope.importCollection = [];

                $scope.isLoading = true;
                var col = encodeURIComponent(JSON.stringify({
                    name: 1,
                    id: 1
                }));
                var filter = encodeURIComponent(JSON.stringify({
                    action: 'import',
                    type: 'SQL'
                }));

                DialerModel.members.templateList(dialerId,
                    {
                        columns: col,
                        limit: 5000,
                        page: 1,
                        filter: filter,
                        domain: domainName
                    }, function (err, res) {
                        if (err)
                            return notifi.error(err, 5000);
                        $scope.importCollection = res && res.data;
                        if(!$scope.template.next_process_id)$scope.template.next_process_id = '';
                    });
            };

            $scope.template = {
                name: '',
                action: funcParams.method,
                type: 'SQL',
                before_delete: false,
                template: {
                    method: 'POST',
                    url: '',
                    body: {
                        webitel: {
                            token: '',
                            expire: ''
                        },
                        sql: {
                            connectionString: '',
                            SQLTable: '',
                            PreExecute: '',
                            ColumnMappings: {}
                        }
                    }
                }
            }
            $scope.columns = [];

            //$scope.CharSet = utils.CharSet;
            $scope.tColumns = {};

            if (funcParams.method === 'export') {
                delete $scope.template.template.body.webitel.expire;
                $scope.tColumns = SqlColumnsExport;
            }
            else if (funcParams.method === 'import') {
                $scope.tColumns = SqlColumnsImport;
            }

            if (funcParams.item) {
                DialerModel.members.templateItem(dialerId, funcParams.item.id, domainName, function (err, res) {
                    if (err) {
                        notifi.error(err, 5000);
                        return $scope.cancel();
                    }
                    $scope.template = res && res.data;
                    var cols = $scope.template.template.body.sql.ColumnMappings;
                    Object.keys(cols).forEach(function (item) {
                        if(cols[item].indexOf('variables') !== -1){
                            var tmp = cols[item].split('.');
                            $scope.columns.push({
                                key: item,
                                value: tmp[0],
                                var: tmp.slice(1).join('.')
                            })
                        }
                        else if(cols[item].indexOf('communications') !== -1){
                            var tmp = cols[item].split('.');
                            $scope.columns.push({
                                key: item,
                                value: tmp[0],
                                commType: tmp.slice(1).join('.')
                            })
                        }
                        else if(Object.keys($scope.tColumns).indexOf(cols[item]) === -1){
                            $scope.columns.push({
                                key: item,
                                value: 'string',
                                strVar: cols[item].replace(/`/g,'')
                            })
                        }
                        else{
                            $scope.columns.push({
                                key: item,
                                value: cols[item]
                            })
                        }
                    });
                });
            }

            $scope.viewMode = !funcParams.isEdit && !!funcParams.item;

            $scope.ok = function () {
                var columnMaps = {};
                $scope.columns.forEach(function (item) {
                    if(item.var){
                        columnMaps[item.key] = item.value + '.' + item.var;
                    }
                    else if(item.strVar){
                        columnMaps[item.key] = '`' + item.strVar + '`';
                    }
                    else if(item.commType){
                        columnMaps[item.key] = item.value + '.' + item.commType;
                    }
                    else {
                        columnMaps[item.key] = item.value;
                    }
                });
                $scope.template.template.body.sql.ColumnMappings = columnMaps;
                //$scope.template.template.url = ($scope.template.template.url + '/' + funcParams.method).replace('//' + funcParams.method, '/' + funcParams.method);
                $modalInstance.close({
                    template: $scope.template
                });
            };
    }]);

    app.controller('MembersTemplateCtrl', ['$scope', 'webitel', 'DialerModel', '$modal', '$confirm', 'notifi',
        function ($scope, webitel, DialerModel, $modal, $confirm, notifi) {

            $scope.canDelete = webitel.connection.session.checkResource('dialer/templates', 'd');
            $scope.canUpdate = webitel.connection.session.checkResource('dialer/templates', 'u');
            $scope.canCreate = webitel.connection.session.checkResource('dialer/templates', 'c');
            $scope.viewMode = !$scope.canUpdate;

            $scope.templateCollection = [];
            $scope.displayedTemplateCollection = [];

            $scope.timeToString = timeToString;

            $scope.resetProcess = function(item){
                DialerModel.members.sqlStop($scope.dialer._id, item.id, item.process_id, $scope.domain, function(err, res){
                    if(err)
                        return notifi.error(err, 5000);
                    $scope.hideExecute = false;
                    $scope.reloadTemplates();
                })
            }
            $scope.reloadTemplates = function () {

                if (!$scope.dialer._id || !$scope.domain)
                    return $scope.templateCollection = [];

                $scope.isLoading = true;
                var col = encodeURIComponent(JSON.stringify({
                    name: 1,
                    type: 1,
                    action: 1,
                    id: 1,
                    process_state: 1,
                    process_start: 1,
                    execute_time: 1,
                    process_id: 1,
                    last_response_text: 1,
                    before_delete: 1
                }));

                DialerModel.members.templateList($scope.dialer._id,
                    {
                        columns: col,
                        limit: 5000,
                        page: 1,
                        domain: $scope.domain
                    }, function (err, res) {
                        $scope.isLoading = false;
                        if (err)
                            return notifi.error(err, 5000);
                        $scope.hideExecute = false;
                        $scope.templateCollection = res && res.data;
                        for(var i = 0; i<$scope.templateCollection.length; i++){
                            if($scope.templateCollection[i].process_start){
                                $scope.hideExecute = true;
                                break;
                            }
                        }
                    });
            };

            $scope.$watch('dialer._id', function (oldValue, newValue) {
                if (newValue !== '') $scope.reloadTemplates();
            }, true);

            $scope.removeTemplate = function (row) {
                $confirm({text: 'Are you sure you want to delete ' + row.name + ' ?'}, {templateUrl: 'views/confirm.html'})
                    .then(function () {
                        DialerModel.members.deleteTemplate($scope.dialer._id, row.id, $scope.domain, function (err) {
                            if (err)
                                return notifi.error(err, 5000);
                            $scope.reloadTemplates();
                        });
                    });
            };
            $scope.getItemForAction = function (id, cb) {
                DialerModel.members.templateItem($scope.dialer._id, id, $scope.domain, function (err, res) {
                    if (err) {
                        return notifi.error(err, 5000);
                    }
                    var template = res && res.data;
                    if (template.template)
                        cb(template.template);
                });
            }

            $scope.showImportCSVPage = function (template) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/importCsv.html',
                    controller: 'MemberDialerImportCtrl',
                    size: 'lg',
                    resolve: {
                        importTemplate: function(){
                            return template;
                        }
                    }
                });

                function getMemberFromTemplate(row, template) {
                    var m = {
                        name: row[template.name],
                        communications: [],
                        expire: null,
                        _variables: []
                    };

                    angular.forEach(template.communications, function (v) {
                        if (!v) return;
                        m.communications.push({
                            number: row[v.number],
                            type: row[v.type],
                            priority: +row[v.priority] || 0,
                            status: 0,
                            state: 0,
                            description: row[v.description] || ""

                        })
                    });
                    angular.forEach(template.variables, function (v, key) {
                        if (key && row[v]) {
                            m._variables.push({
                                key: key,
                                value: row[v]
                            })
                        }
                    });

                    if (template.hasOwnProperty('expire') && typeof template.expire.id == 'number' && row[template.expire.id]) {
                        var timeExpire = moment(row[template.expire.id], template.expire.format).valueOf();
                        if (timeExpire)
                            m.expire = timeExpire;
                    }

                    return m;

                }

                function createMembers(result) {
                    if (result.headers)
                        result.data.shift();

                    var allCount = result.data.length;
                    var createdItems = 0;
                    $scope.progressCount = 0;

                    $scope.maxProgress = allCount;
                    $scope.processImport = true;
                    async.eachSeries(result.data,
                        function (item, cb) {
                            $scope.progress = Math.round(100 * $scope.progressCount++ / allCount);
                            var m = getMemberFromTemplate(item, result.template);
                            if (!m || !m.name || !m.communications) {
                                console.warn('skip: ', m);
                                return cb();
                            }
                            DialerModel.members.add($scope.domain, $scope.dialer._id, m, function (err) {
                                if (err) {
                                    console.error(err);
                                } else {
                                    createdItems++;
                                }
                                cb();
                            });
                        },
                        function (err) {
                            $scope.progress = 0;
                            $scope.processImport = false;
                            if (err)
                                return notifi.error(err);
                            return notifi.info('Create: ' + createdItems, 2000)
                        }
                    );
                }

                modalInstance.result.then(function (result) {
                    if (result.deleteBefore) {
                        DialerModel.members.removeMulti($scope.dialer._id, null, $scope.domain, function (err, res) {
                            if (err)
                                return notifi.error(err, 5000);
                            notifi.info('Remove ' + res.n + ' members.', 5000);
                            createMembers(result);
                        });
                    }
                    else {
                        createMembers(result);
                    }
                }, function () {

                });
            };

            $scope.exportCSV = function (template) {
                var fields = [];
                angular.forEach(template.data, function (i) {
                    var s = ExportColumns[i.field];
                    if (s) {
                        i.name = s.name;
                        if (s.type == 'variable') {
                            fields.push('variables.' + i.value);
                            i.route = 'variables.' + i.value;
                            i.name += ' ' + i.value;
                        } else if (s.type == 'communications') {
                            i.route = 'communications.' + s.position + '.' + s.field;
                            if (!~fields.indexOf('communications'))
                                fields.push('communications');
                        } else {
                            if (!~fields.indexOf(s.field))
                                fields.push(s.field);
                            i.route = s.field;
                        }
                    }
                });
                template.fields = fields;
                exportMembers(template);
            }

            function exportMembers(settings) {
                var option = {
                    sort: {},
                    filter: {},
                    page: 0,
                    limit: 1000,
                    columns: [],
                    fileName: settings.fileName || $scope.dialer.name
                };

                var data = "";

                //region TODO ...

                function _findSteps(steps, reg, to) {
                    for (var i in steps) {
                        if (reg.test(steps[i].data)) {
                            return steps[i].data.replace(reg, to)
                        }
                    }
                    return '';
                }

                function _findNumber(row, n) {
                    for (var key in row.communications) {
                        if (row.communications[key].number == n)
                            return row.communications[key];
                    }
                }

                function addRow(row) {

                    if (settings.allProbe && !angular.isArray(row._log)) {
                        return;
                    }
                    function getCommunicationDisplayName(code) {
                        if (!code)
                            return '-';

                        var communicationTypes = $scope.communicationTypes;

                        for (var i = 0; i < communicationTypes.length; i++)
                            if (communicationTypes[i].code === code)
                                return communicationTypes[i].name;

                        return 'error type: ' + code;
                    }
                    function addNoAtempt() {
                        angular.forEach(settings.data, function (i, index) {
                            var val;
                            if (i.field === "callTime") {
                                if (row._log) {
                                    var call = row._log[row._log.length - 1];
                                    call = call && call.steps;
                                    val = call && call[0].time;
                                    if (i.type == 'string' && val)
                                        val = new Date(val).toLocaleString()
                                }
                            } else if (i.field === "expire") {
                                val = row.expire;
                                if (i.type == 'string' && val)
                                    val = new Date(val).toLocaleString()
                            } else {
                                val = row;
                                i.route.split('.').forEach(function (token) {
                                    val = val && val[token];
                                });
                            }

                            if (!val)
                                val = '';

                            data += val + (settings.data.length - 1 == index ? '' : settings.separator);
                        });
                        data += '\n';
                    }

                    if (settings.allProbe) {
                        if (angular.isArray(row._log)) {
                            angular.forEach(row._log, function (atempt) {
                                if (!atempt.hasOwnProperty('callNumber')) {
                                    return;
                                }
                                angular.forEach(settings.data, function (i, index) {
                                    var val;
                                    switch (i.field) {
                                        case "_probeCount":
                                            val = atempt.callAttempt;
                                            break;
                                        case "callTime":
                                            val = atempt.callTime;
                                            if (i.type == 'string' && val)
                                                val = new Date(val).toLocaleString();
                                            break;
                                        case "expire":
                                            val = row.expire;
                                            if (i.type == 'string' && val)
                                                val = new Date(val).toLocaleString();
                                            break;
                                        case "number":
                                            val = atempt.callNumber;
                                            break;
                                        case "attempt_cause":
                                            val = atempt.cause;
                                            break;
                                        case "attempt_amd_result":
                                            val = atempt.amdResult;
                                            break;
                                        case "attempt_communication_type_code":
                                            val = atempt.callTypeCode;
                                            break;
                                        case "attempt_agent":
                                            val = atempt.agentId || "";
                                            break;
                                        case "attempt_communication_type_name":
                                            val = getCommunicationDisplayName(atempt.callTypeCode);
                                            break;
                                        case "priority_number":
                                            val = atempt.callPriority;
                                            break;
                                        case "state":
                                            val = atempt.callState;
                                            break;
                                        case "callSuccessful":
                                            val = atempt.callSuccessful;
                                            break;
                                        case "description":
                                            val = row.communications[atempt.callPositionIndex]
                                                && row.communications[atempt.callPositionIndex].description;
                                            break;

                                        case "attempt_callback_success":
                                            if (atempt.callback && atempt.callback.data) {
                                                val = atempt.callback.data.success;
                                            }
                                            break;
                                        case "attempt_callback_description":
                                            if (atempt.callback && atempt.callback.data) {
                                                val = atempt.callback.data.description;
                                            }
                                            break;
                                        default:
                                            val = row;
                                            i.route.split('.').forEach(function (token) {
                                                val = val && val[token];
                                            });
                                    }
                                    if (val === undefined)
                                        val = '';

                                    data += val + (settings.data.length - 1 === index ? '' : settings.separator);
                                });
                                data += '\n';
                            })
                        } else {
                            addNoAtempt();
                        }
                    } else {
                        addNoAtempt()
                    }
                }

                if (settings.skipFilter)
                    option.filter = {};

                if (settings.headers) {
                    angular.forEach(settings.data, function (i, index) {
                        data += i.name + (settings.data.length - 1 == index ? '' : settings.separator);
                    });
                    data += '\n';
                }

                //endregion

                (function process(err, res) {
                    if (err)
                        return notifi.error(err);

                    angular.forEach(res, function (row) {
                        addRow(row);
                    });

                    if (res && res.length < option.limit) {
                        var blob = new Blob([data], {
                            type: "text/plain;charset=" + settings.charSet
                        });
                        fileSaver(blob, option.fileName + '.csv');
                        // exit;
                        return;
                    }

                    option.page++;
                    DialerModel.members.list($scope.domain, $scope.dialer._id, option, process);
                })();
            }

            $scope.exportToSql = function(row) {
                DialerModel.members.sqlStart($scope.dialer._id, row.id, $scope.domain, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);
                    $scope.reloadTemplates();
                });
            };

            $scope.importFromSql = function(row){
                var start = function(){
                    DialerModel.members.sqlStart($scope.dialer._id, row.id, $scope.domain, function(err, res){
                        if(err)
                            return notifi.error(err, 5000);
                        $scope.reloadTemplates();
                    });
                };
                if(row.before_delete){
                    $confirm({text: 'Do you really want to delete all members from the dialer?'}, {templateUrl: 'views/confirm.html'})
                        .then(function () {
                            start();
                        });
                }
                else{
                    start();
                }
            }

            $scope.openCsvTemplate = function (method, item, isEdit) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/templateCsvModal.html',
                    size: 'lg',
                    resolve: {
                        dialerId: function () {
                            return $scope.dialer._id
                        },
                        domainName: function () {
                            return $scope.domain
                        },
                        funcParams: function(){
                            return {
                                method: method,
                                item: item,
                                isEdit: isEdit
                            }
                        }
                    },
                    controller: 'CsvTemplateCtrl'

                });

                modalInstance.result.then(function (settings) {
                    var func = isEdit ? DialerModel.members.updateTemplate : DialerModel.members.addTemplate;
                    func($scope.dialer._id, settings.template, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err);
                        $scope.reloadTemplates();
                    });
                });
            }

            $scope.openSqlTemplate = function (method, item, isEdit) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: '/modules/dialer/templateSqlModal.html',
                    size: 'lg',
                    resolve: {
                        dialerId: function () {
                            return $scope.dialer._id
                        },
                        domainName: function () {
                            return $scope.domain
                        },
                        funcParams: function(){
                            return {
                                method: method,
                                item: item,
                                isEdit: isEdit
                            }
                        }
                    },
                    controller: 'SqlTemplateCtrl'
                });

                modalInstance.result.then(function (settings) {
                    var func = isEdit ? DialerModel.members.updateTemplate : DialerModel.members.addTemplate;
                    func($scope.dialer._id, settings.template, $scope.domain, function (err, res) {
                        if (err)
                            return notifi.error(err);
                        $scope.reloadTemplates();
                    });
                });
            }
        }]);
});