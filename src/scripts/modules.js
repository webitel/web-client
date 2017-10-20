define(['angular', 'config'], function (angular, config) {
    var modules = angular.module('app.modules', []);
    modules.constant('MODULES', [
        // {
        // 	href: "#/dashboard",
        // 	caption: "Dashboard",
        //
        // 	acl:  'account',
        // 	templateUrl: 'modules/dashboard/dashboard.html',
        // 	controller: 'DashboardCtrl',
        // 	controllerUrl: 'modules/dashboard/dashboard.js',
        // 	iconClass: 'fa fa-dashboard'
        // },
        {
            href: "#/domains",
            caption: "Domains",
            description: "",

            acl: 'domain',
            templateUrl: 'modules/domains/domains.html',
            controller: 'DomainsCtrl',
            controllerUrl: 'modules/domains/domains.js',
            iconClass: 'fa fa-database',
            routes: [{
                href: '/domains/new',
                templateUrl: 'modules/domains/domainPage.html',
                controller: 'DomainsCtrl',
                controllerUrl: 'modules/domains/domains.js',
                method: "create"
            },{
                href: '/domains/:id/edit',
                templateUrl: 'modules/domains/domainPage.html',
                controller: 'DomainsCtrl',
                controllerUrl: 'modules/domains/domains.js',
                method: "edit"
            }]
        },
        {
            href: "#/roles",
            caption: "ACL",
            hide: true,
            acl: 'acl/roles',
            templateUrl: 'modules/acl/acl.html',
            controller: 'ACLCtrl',
            controllerUrl: 'modules/acl/acl.js',
            iconClass: 'fa fa-eye-slash'
        },
        {
            href: "#/status",
            caption: "Status",
            hide: true,
            acl: 'acl/roles',
            templateUrl: 'modules/status/status.html',
            controller: 'StatusCtrl',
            controllerUrl: 'modules/status/status.js',
            iconClass: 'fa fa-eye-slash'
        },
        {
            href: "#/license/manager",
            caption: "License manager",
            disable: !config.licenseManager.enabled,
            hide: true,
            acl: 'license',
            templateUrl: 'modules/licenseManager/manager.html',
            controller: 'LicenseManagerCtrl',
            controllerUrl: 'modules/licenseManager/manager.js',
            iconClass: 'fa fa-usd',
            routes: [{
                href: '/license/manager/new',
                templateUrl: 'modules/licenseManager/managerPage.html',
                controller: 'LicenseManagerCtrl',
                controllerUrl: 'modules/licenseManager/manager.js',
                method: "create"
            },{
                href: '/license/manager/:id/edit',
                templateUrl: 'modules/licenseManager/managerPage.html',
                controller: 'LicenseManagerCtrl',
                controllerUrl: 'modules/licenseManager/manager.js',
                method: "edit"
            }]
        },
        {
            href: "#/license",
            caption: "License",
            hide: true,
            acl: 'license',
            templateUrl: 'modules/license/license.html',
            controller: 'LicenseCtrl',
            controllerUrl: 'modules/license/license.js',
            iconClass: 'fa fa-usd',
            routes: [{
                href: '/license/:sid/:cid',
                templateUrl: 'modules/license/licensePage.html',
                controller: 'LicenseCtrl',
                controllerUrl: 'modules/license/license.js',
                method: "view"
            }]
        },
        {
            href: "#/server/utils",
            caption: "Utils",
            hide: true,
            acl: 'license',
            templateUrl: 'modules/server/utils.html',
            controller: 'ServerSettingsCtrl',
            controllerUrl: 'modules/server/settings/settings.js',
            iconClass: 'fa fa-usd'
        },

        {
            href: "#/accounts",
            caption: "Directory",

            acl: 'account',
            templateUrl: 'modules/accounts/accounts.html',
            controller: 'AccountsCtrl',
            controllerUrl: 'modules/accounts/accounts.js',
            iconClass: 'fa fa-users',
            routes: [{
                href: '/accounts/new',
                templateUrl: 'modules/accounts/accountPage.html',
                controller: 'AccountsCtrl',
                controllerUrl: 'modules/accounts/accounts.js',
                method: "create"
            },{
                href: '/accounts/:id/edit',
                templateUrl: 'modules/accounts/accountPage.html',
                controller: 'AccountsCtrl',
                controllerUrl: 'modules/accounts/accounts.js',
                method: "edit"
            },{
                href: '/accounts/:id/view',
                templateUrl: 'modules/accounts/accountPage.html',
                controller: 'AccountsCtrl',
                controllerUrl: 'modules/accounts/accounts.js',
                method: "view"
            }
            ]
        },
        {
            href: "#/gateways",
            caption: "Gateways",

            acl: 'gateway',
            templateUrl: 'modules/gateways/gateways.html',
            controller: 'GatewaysCtrl',
            controllerUrl: 'modules/gateways/gateways.js',
            iconClass: 'fa fa-random',
            routes: [{
                href: '/gateways/new',
                templateUrl: 'modules/gateways/gatewayPage.html',
                controller: 'GatewaysCtrl',
                controllerUrl: 'modules/gateways/gateways.js',
                method: "create"
            },{
                href: '/gateways/:id/edit',
                templateUrl: 'modules/gateways/gatewayPage.html',
                controller: 'GatewaysCtrl',
                controllerUrl: 'modules/gateways/gateways.js',
                method: "edit"
            },{
                href: '/gateways/:id/view',
                templateUrl: 'modules/gateways/gatewayPage.html',
                controller: 'GatewaysCtrl',
                controllerUrl: 'modules/gateways/gateways.js',
                method: "view"
            }]
        },
        {
            href: "#/calendars",
            caption: "Calendar",

            acl: 'calendar',
            templateUrl: 'modules/calendar/calendar.html',
            controller: 'CalendarCtrl',
            controllerUrl: 'modules/calendar/calendar.js',
            iconClass: 'fa fa-calendar',
            routes: [{
                href: '/calendars/new',
                templateUrl: 'modules/calendar/calendarPage.html',
                controller: 'CalendarCtrl',
                controllerUrl: 'modules/calendar/calendar.js',
                method: "create"
            },{
                href: '/calendars/:id/edit',
                templateUrl: 'modules/calendar/calendarPage.html',
                controller: 'CalendarCtrl',
                controllerUrl: 'modules/calendar/calendar.js',
                method: "edit"
            },{
                href: '/calendars/:id/view',
                templateUrl: 'modules/calendar/calendarPage.html',
                controller: 'CalendarCtrl',
                controllerUrl: 'modules/calendar/calendar.js',
                method: "view"
            }]
        },
        {
            href: "#/callflows",
            caption: "Callflow",

            acl: ['rotes/default', 'rotes/public', 'rotes/extension', 'rotes/domain', 'blacklist'],
            templateUrl: 'modules/callflows/callflows.html',
            controller: 'CallflowsCtrl',
            controllerUrl: 'modules/callflows/callflows.js',
            iconClass: 'fa fa-sitemap',
            homeTemplate: {
                url: "views/templates/callflow.html"
            },
            list: true,
            routes: [{
                list: true,
                acl: 'rotes/default',
                caption: 'Default',
                href: '/callflows/default',
                templateUrl: 'modules/callflows/default/default.html',
                controller: 'CallflowDefaultCtrl',
                controllerUrl: 'modules/callflows/default/default.js'
            },{
                href: '/callflows/default/new',
                templateUrl: 'modules/callflows/default/defaultPage.html',
                controller: 'CallflowDefaultCtrl',
                controllerUrl: 'modules/callflows/default/default.js',
                caption: 'Default',
                method: "create"
            },{
                href: '/callflows/default/:id/edit',
                templateUrl: 'modules/callflows/default/defaultPage.html',
                controller: 'CallflowDefaultCtrl',
                controllerUrl: 'modules/callflows/default/default.js',
                method: "edit"
            },{
                href: '/callflows/default/:id/view',
                templateUrl: 'modules/callflows/default/defaultPage.html',
                controller: 'CallflowDefaultCtrl',
                controllerUrl: 'modules/callflows/default/default.js',
                method: "view"
            },{
                list: true,
                acl: 'rotes/public',
                caption: 'Public',
                href: '/callflows/public',
                templateUrl: 'modules/callflows/public/public.html',
                controller: 'CallflowPublicCtrl',
                controllerUrl: 'modules/callflows/public/public.js'
            },{
                list: true,
                href: '/callflows/public/new',
                templateUrl: 'modules/callflows/public/publicPage.html',
                controller: 'CallflowPublicCtrl',
                controllerUrl: 'modules/callflows/public/public.js',
                caption: 'Public',
                method: "create"
            },{
                list: true,
                href: '/callflows/public/:id/edit',
                templateUrl: 'modules/callflows/public/publicPage.html',
                controller: 'CallflowPublicCtrl',
                controllerUrl: 'modules/callflows/public/public.js',
                method: "edit"
            },{
                list: true,
                href: '/callflows/public/:id/view',
                templateUrl: 'modules/callflows/public/publicPage.html',
                controller: 'CallflowPublicCtrl',
                controllerUrl: 'modules/callflows/public/public.js',
                method: "view"
            }, {
                list: true,
                acl: 'rotes/extension',
                caption: 'Extension',
                href: '/callflows/extension',
                templateUrl: 'modules/callflows/extension/extension.html',
                controller: 'CallflowExtensionCtrl',
                controllerUrl: 'modules/callflows/extension/extension.js'
            },{
                href: '/callflows/extension/:id/edit',
                templateUrl: 'modules/callflows/extension/extensionPage.html',
                controller: 'CallflowExtensionCtrl',
                controllerUrl: 'modules/callflows/extension/extension.js',
                method: "edit"
            },{
                href: '/callflows/extension/:id/view',
                templateUrl: 'modules/callflows/extension/extensionPage.html',
                controller: 'CallflowExtensionCtrl',
                controllerUrl: 'modules/callflows/extension/extension.js',
                method: "view"
            }, {
                list: true,
                acl: 'blacklist',
                caption: "Blacklists",
                href: "/callflows/blacklists",

                templateUrl: 'modules/callflows/blacklists/blacklists.html',
                controller: 'BlackListCtrl',
                controllerUrl: 'modules/callflows/blacklists/blacklists.js'
            }, {
                list: true,
                href: '/callflows/blacklists/new',
                templateUrl: 'modules/callflows/blacklists/blacklistPage.html',
                controller: 'BlackListCtrl',
                controllerUrl: 'modules/callflows/blacklists/blacklists.js',
                caption: "Blacklists",
                method: "create"
            }, {
                list: true,
                href: '/callflows/blacklists/:id/edit',
                templateUrl: 'modules/callflows/blacklists/blacklistPage.html',
                controller: 'BlackListCtrl',
                controllerUrl: 'modules/callflows/blacklists/blacklists.js',
                method: "edit"
            }, {
                list: true,
                href: '/callflows/blacklists/:id/view',
                templateUrl: 'modules/callflows/blacklists/blacklistPage.html',
                controller: 'BlackListCtrl',
                controllerUrl: 'modules/callflows/blacklists/blacklists.js',
                method: "view"
            },{
                list: true,
                acl: 'rotes/domain',
                caption: 'Variables',
                href: '/callflows/variables',
                templateUrl: 'modules/callflows/variables/variables.html',
                controller: 'CallflowsVariableCtrl',
                controllerUrl: 'modules/callflows/variables/variables.js'
            }
            ]
        },
        {
            href: "#/queue",
            caption: "Queue",
            list: true,
            acl: ['callback', 'cc/queue', 'dialer'],
            templateUrl: 'modules/queue/queue.html',
            controller: 'QueuesCtrl',
            controllerUrl: 'modules/queue/queue.js',

            iconClass: 'fa fa-tasks',
            homeTemplate: {
                url: "views/templates/queue.html"
            },
            routes: [
                //acd
                {
                    list: true,

                    href: "/queue/acd",
                    caption: "ACD",

                    acl: 'cc/queue',
                    templateUrl: 'modules/acd/acd.html',
                    controller: 'ACDCtrl',
                    controllerUrl: 'modules/acd/acd.js',
                    iconClass: 'fa fa-download',
                },
                {
                    href: '/queue/acd/:id/edit',
                    templateUrl: 'modules/acd/acdPage.html',
                    controller: 'ACDCtrl',
                    controllerUrl: 'modules/acd/acd.js',
                    method: "edit"
                },
                {
                    href: '/queue/acd/:id/view',
                    templateUrl: 'modules/acd/acdPage.html',
                    controller: 'ACDCtrl',
                    controllerUrl: 'modules/acd/acd.js',
                    method: "view"
                },
                {
                    caption: 'ACD',
                    iconClass: 'fa fa-download',
                    href: '/queue/acd/new',
                    templateUrl: 'modules/acd/acdPage.html',
                    controller: 'ACDCtrl',
                    controllerUrl: 'modules/acd/acd.js',
                    method: "create"
                },
                // end

                //dialer
                {
                    list: true,
                    href: "/queue/dialer",
                    caption: "Dialer",

                    acl: 'dialer',
                    templateUrl: 'modules/dialer/dialer.html',
                    controller: 'DialerCtrl',
                    controllerUrl: 'modules/dialer/dialer.js',
                    iconClass: 'fa fa-eject'

                },
                {
                    caption: 'Dialer',
                    iconClass: 'fa fa-eject',
                    href: '/queue/dialer/new',
                    templateUrl: 'modules/dialer/dialerPage.html',
                    controller: 'DialerCtrl',
                    controllerUrl: 'modules/dialer/dialer.js',
                    method: "create"
                },
                {
                    href: '/queue/dialer/:id/edit',
                    templateUrl: 'modules/dialer/dialerPage.html',
                    controller: 'DialerCtrl',
                    controllerUrl: 'modules/dialer/dialer.js',
                    method: "edit"
                },
                {
                    href: '/queue/dialer/:id/view',
                    templateUrl: 'modules/dialer/dialerPage.html',
                    controller: 'DialerCtrl',
                    controllerUrl: 'modules/dialer/dialer.js',
                    method: "view"
                },

                //end

                //callback

                {
                    list: true,
                    href: "/queue/callback",
                    caption: "Callback",

                    acl: 'callback',
                    templateUrl: 'modules/queueCallback/queueCallback.html',
                    controller: 'QueueCallbackCtrl',
                    controllerUrl: 'modules/queueCallback/queueCallback.js',
                    iconClass: 'fa fa-tasks',
                },
                {
                    caption: 'Callback',
                    iconClass: 'fa fa-tasks',
                    href: '/queue/callback/new',
                    templateUrl: 'modules/queueCallback/queueCallbackPage.html',
                    controller: 'QueueCallbackCtrl',
                    controllerUrl: 'modules/queueCallback/queueCallback.js',
                    method: "create"
                },
                {
                    href: '/queue/callback/:id/edit',
                    templateUrl: 'modules/queueCallback/queueCallbackPage.html',
                    controller: 'QueueCallbackCtrl',
                    controllerUrl: 'modules/queueCallback/queueCallback.js',
                    method: "edit"
                },
                {
                    href: '/queue/callback/:id/view',
                    templateUrl: 'modules/queueCallback/queueCallbackPage.html',
                    controller: 'queueCallbackCtrl',
                    controllerUrl: 'modules/queueCallback/queueCallback.js',
                    method: "view"
                },


            ]
        },
        {
            href: "#/media",
            caption: "Media",

            acl: 'cdr/media',
            templateUrl: 'modules/media/media.html',
            controller: 'MediaCtrl',
            controllerUrl: 'modules/media/media.js',
            iconClass: 'fa fa-play'
        },
        {
            href: "#/vmail",
            caption: "Voice mail",

            acl: 'vmail',
            templateUrl: 'modules/vMail/vMailSection.html',
            controller: 'VoiceMailCtrl',
            controllerUrl: 'modules/vMail/vMail.js',
            iconClass: 'fa fa-envelope-o'
        },
        {
            href: "#/queue/dialer/:id/stats",
            caption: "Dialer stats",
            hide: true,
            acl: 'dialer',
            templateUrl: 'modules/dialer/dialerStats.html',
            controller: 'StatsDialerCtrl',
            controllerUrl: 'modules/dialer/dialer.js',
            iconClass: 'fa fa-eject'
        },
        {
            href: "#/contacts",
            caption: "Contacts",

            acl: 'cdr/media',
            templateUrl: 'modules/contacts/contacts.html',
            controller: 'ContactsCtrl',
            controllerUrl: 'modules/contacts/contacts.js',
            iconClass: 'fa fa-user',
            routes: [
            {
                href: '/contacts/:id/edit',
                templateUrl: 'modules/contacts/contactPage.html',
                controller: 'ContactsCtrl',
                controllerUrl: 'modules/contacts/contacts.js',
                method: "edit"
            },{
                href: '/contacts/:id/view',
                templateUrl: 'modules/contacts/contactPage.html',
                controller: 'ContactsCtrl',
                controllerUrl: 'modules/contacts/contacts.js',
                method: "view"
            }]
        },
        {
            href: "#/contactEditor",
            caption: "Contact edit",
            hide: true,
            acl: 'cdr/media',
            templateUrl: 'modules/contacts/contactProperties.html',
            controller: 'ContactPropsCtrl',
            controllerUrl: 'modules/contacts/contactProperties.js',
            iconClass: 'fa fa-bug'
        },
        {
            href: "#/widget",
            caption: "Widget",

            acl: 'widget',
            templateUrl: 'modules/widget/widget.html',
            controller: 'WidgetCtrl',
            controllerUrl: 'modules/widget/widget.js',
            iconClass: 'fa fa-phone',
            routes: [{
                href: '/widget/new',
                templateUrl: 'modules/widget/widgetPage.html',
                controller: 'WidgetCtrl',
                controllerUrl: 'modules/widget/widget.js',
                method: "create"
            },{
                href: '/widget/:id/edit',
                templateUrl: 'modules/widget/widgetPage.html',
                controller: 'WidgetCtrl',
                controllerUrl: 'modules/widget/widget.js',
                method: "edit"
            },{
                href: '/widget/:id/view',
                templateUrl: 'modules/widget/widgetPage.html',
                controller: 'WidgetCtrl',
                controllerUrl: 'modules/widget/widget.js',
                method: "view"
            }]
        },
        {
            href: "#/hooks",
            caption: "Hooks",

            acl: 'hook',
            templateUrl: 'modules/hooks/hook.html',
            controller: 'HookCtrl',
            controllerUrl: 'modules/hooks/hook.js',
            iconClass: 'fa fa-exchange',
            routes: [{
                href: '/hooks/new',
                templateUrl: 'modules/hooks/hookPage.html',
                controller: 'HookCtrl',
                controllerUrl: 'modules/hooks/hook.js',
                method: "create"
            },{
                href: '/hooks/:id/edit',
                templateUrl: 'modules/hooks/hookPage.html',
                controller: 'HookCtrl',
                controllerUrl: 'modules/hooks/hook.js',
                method: "edit"
            },{
                href: '/hooks/:id/view',
                templateUrl: 'modules/hooks/hookPage.html',
                controller: 'HookCtrl',
                controllerUrl: 'modules/hooks/hook.js',
                method: "view"
            }]
        },
        {
            href: "#/cdr",
            caption: "CDR",

            acl: 'cdr',
            templateUrl: config.cdr.useElastic ? 'modules/cdr/cdrElastic.html' : 'modules/cdr/cdr.html',
            controller: 'CDRCtrl',
            controllerUrl: config.cdr.useElastic ? 'modules/cdr/cdrElastic.js' : 'modules/cdr/cdr.js',
            iconClass: 'fa fa-bar-chart-o',
            routes: [
                {
                    href: '/cdr/settings',
                    templateUrl: 'modules/cdr/settings/cdrSettings.html',
                    controller: 'CDRSettingsCtrl',
                    controllerUrl: 'modules/cdr/settings/cdrSettings.js'
                }
            ]
        }
    ]);
});