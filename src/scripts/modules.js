define(['angular', 'config'], function (angular, config) {
	var modules = angular.module('app.modules', []);
	modules.constant('MODULES', [
	{
		href: "#/dashboard",
		caption: "Dashboard",

		acl:  'account',
		templateUrl: 'modules/dashboard/dashboard.html',
		controller: 'DashboardCtrl',
		controllerUrl: 'modules/dashboard/dashboard.js',
		iconClass: 'fa fa-dashboard'
	},
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
		href: "#/license",
		caption: "License",
		hide: true,
		acl: 'license',
		templateUrl: 'modules/license/license.html', 
		controller: 'LicenseCtrl',
		controllerUrl: 'modules/license/license.js',
		iconClass: 'fa fa-usd'
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
		}]
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
		}]
	},
	{
		href: "#/callflows",
		caption: "Callflow",

		acl: ['rotes/default', 'rotes/public', 'rotes/extension', 'rotes/domain'],
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
			method: "create"
		},{
			href: '/callflows/default/:id/edit',
			templateUrl: 'modules/callflows/default/defaultPage.html',
			controller: 'CallflowDefaultCtrl',
			controllerUrl: 'modules/callflows/default/default.js',
			method: "edit"
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
			method: "create"
		},{
			list: true,
			href: '/callflows/public/:id/edit',
			templateUrl: 'modules/callflows/public/publicPage.html',
			controller: 'CallflowPublicCtrl',
			controllerUrl: 'modules/callflows/public/public.js',
			method: "edit"
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
			list: true,
			acl: 'rotes/domain',
			caption: 'Variables',
			href: '/callflows/variables',
			templateUrl: 'modules/callflows/variables/variables.html',
			controller: 'CallflowsVariableCtrl',
			controllerUrl: 'modules/callflows/variables/variables.js'
		}]
	},
	{
		href: "#/cdr",
		caption: "CDR",

		acl: 'cdr',
		templateUrl: 'modules/cdr/cdr.html', 
		controller: 'CDRCtrl',
		controllerUrl: 'modules/cdr/cdr.js',
		iconClass: 'fa fa-bar-chart-o',
		routes: [
			{
				href: '/cdr/settings',
				templateUrl: 'modules/cdr/settings/cdrSettings.html',
				controller: 'CDRSettingsCtrl',
				controllerUrl: 'modules/cdr/settings/cdrSettings.js'
			}
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
		href: "#/acd",
		caption: "ACD",

		acl: 'cc/queue',
		templateUrl: 'modules/acd/acd.html', 
		controller: 'ACDCtrl',
		controllerUrl: 'modules/acd/acd.js',
		iconClass: 'fa fa-download',
		routes: [{
			href: '/acd/new',
			templateUrl: 'modules/acd/acdPage.html',
			controller: 'ACDCtrl',
			controllerUrl: 'modules/acd/acd.js',
			method: "create"
		},{
			href: '/acd/:id/edit',
			templateUrl: 'modules/acd/acdPage.html',
			controller: 'ACDCtrl',
			controllerUrl: 'modules/acd/acd.js',
			method: "edit"
		}]
	}
	]);
});