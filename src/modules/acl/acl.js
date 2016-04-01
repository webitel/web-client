define(['app', 'scripts/webitel/utils', 'modules/acl/aclModel', 'nav-tree', 'css!modules/acl/acl.css'], function (app, utils) {

    app.controller('ACLCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', 'AclModel', '$modal', '$confirm',
        function ($scope, webitel, $rootScope, notifi, AclModel, $modal, $confirm) {

            $scope.addRole = function(isParent) {
                var parent = null;
                if (isParent) {
                    parent = treeRoles.get_selected_branch();
                    if (!parent)
                        return notifi.error(new Error("No select role."));
                    parent = parent.label;
                };

                $modal.open({
                    templateUrl : 'modules/acl/newRoleDialog.html',
                    controller : PopupCtrl,
                    resolve : {
                        name : function() {
                            return $scope.name;
                        }
                    }
                }).result.then(function(result) {

                        AclModel.add(result, parent, function (err, res) {
                            if (err)
                                return notifi.error(err);
                            init();
                        });
                });
            };

            var PopupCtrl = function($scope, $modalInstance) {
                $scope.level = "PopupCtrl";
                $scope.name = "";
                $scope.ok = function() {
                    $modalInstance.close($scope.name);
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            };

            $scope.resources = {};
            $scope.currentRole = {};
            $scope.rolesData = [];
            $scope.treeRoles = treeRoles = {};
            function init () {

                AclModel.list(function (err, res) {
                    if (err)
                        return notifi.error(err);

                    var roles = res.roles;
                    var parents = res.parents;
                    var tree = [];
                    var allRoles = {};

                    // TODO ...
                    angular.forEach(roles, function (value) {
                        allRoles[value] = {
                            "label": value,
                            "children": []
                        }
                    });

                    angular.forEach(parents, function (value, key) {
                        angular.forEach(value, function (item) {
                            allRoles[key].del = true;
                            allRoles[item].children.push(allRoles[key]);
                        });
                    });
                    
                    angular.forEach(allRoles, function (item) {
                        if (!item.del)
                            tree.push(item);
                    });

                    $scope.rolesData = tree;

                });
            };
            init();
            
            $scope.saveResource = function (perm, resources) {
                var arr = [];
                var role = treeRoles.get_selected_branch();
                angular.forEach(perm, function (value, key) {
                    if (key == '_changed' || !value)
                        return;
                    arr.push(key)
                });
                AclModel.update(role.label, resources, arr, function (err, res) {
                    if (err)
                        return notifi.error(err, 5000);
                    $scope.onChangeRole();
                })
            };

            $scope.isResources = function () {
                return Object.keys($scope.resources).length > 0;
            };
            
            $scope.removeRole = function () {
                var selected = treeRoles.get_selected_branch();
                if (!selected)
                    return notifi.error(new Error("Role not selected."), 5000);

                $confirm({text: 'Are you sure you want to delete ' + selected.label + ' ?'},  { templateUrl: 'views/confirm.html' })
                    .then(function() {
                        AclModel.remove(selected.label, function (err, res) {
                            if (err)
                                return notifi.error(err, 5000);

                            init();
                        })
                    });
            };

            $scope.onChangeRole = function() {
                $scope.currentRole = treeRoles.get_selected_branch();
                AclModel.item($scope.currentRole.label, function (err, res) {
                    if (err)
                        return notifi.error(err, 10000);
                    initResources(res);
                });
            };

            function initResources (resData) {
                resetResources();
                angular.forEach(resData, function (value, key) {
                    $scope.resources[key] = getResourcesArrayToObj(value);
                });
            };

            function getResourcesArrayToObj (arr) {
                if (~arr.indexOf('*')) {
                    return {
                        c: true,
                        u: true,
                        uo: true,
                        r: true,
                        ro: true,
                        d: true
                    }
                } else {
                    var r = {};
                    angular.forEach(arr, function (v) {
                        r[v] = true;
                    });
                    return r;
                }
            };

            function resetResources () {
                $scope.resources = {};
                angular.forEach(utils.resourcesAcl, function (value) {
                    $scope.resources[value] = {
                        c: false,
                        u: false,
                        uo: false,
                        r: false,
                        ro: false,
                        d: false
                    }
                });
            }

        }])
});
