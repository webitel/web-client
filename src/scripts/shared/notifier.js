define([
	'angular',
	'angular-ui-notification'
	], 
	function () {
		var notifier = angular.module('app.notifier', ['ui-notification']);
		notifier.service('notifi', ['Notification', function(Notification){

		    function getMsg (err, delay) {
		    	return {
					message: new Date().toLocaleTimeString() + ' : ' + (typeof err == 'string' ? err : err.message),
					delay: delay || null
			    };
		    };

			return {
				error: function error(err, delay) {
					Notification.error(getMsg(err, delay));
				},
				info: function info(msg, delay) {
					Notification.info(getMsg(msg, delay));
				},
				warn: function warning(msg, delay) {
					Notification.warning(getMsg(msg, delay));
				},
				success: function success(msg, delay) {
					Notification.success(getMsg(msg, delay));
				}
			}
		}])
	})