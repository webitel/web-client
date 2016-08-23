define(['app', 'scripts/webitel/utils'], function (app, utils) {
	var prettysize = utils.prettysize;
	var secondsToString = utils.secondsToString;

    app.controller('StatusCtrl', ['$scope', 'webitel', '$rootScope', 'notifi', '$timeout',
        function ($scope, webitel, $rootScope, notifi, $timeout) {

			$scope.api = {
				status: {},
				user: {}
			};

			var _freeMemoryInt,
				_TotalMemoryInt;

			$scope.getClassMemory = function () {
				if (!_TotalMemoryInt)
					return;

				var freePercent = (100 * _freeMemoryInt) / _TotalMemoryInt;

				if (freePercent < 10)
					return 'bg-danger';
				else if (freePercent < 40)
					return 'bg-warning';
				else
					return 'bg-success'
			};

			webitel.checkLicenseStatus();
        	webitel.api("GET", "/api/v2/status", function (err, res) {
        		if (err)
    				return notifi.error(err, 5000);

    			$scope.uptime = secondsToString(res.processUpTimeSec);
    			$scope.userSession = res.userSessions;
    			$scope.socketSession = res.socketSessions;

    			$scope.totalMemory = prettysize(res.system.totalMemory);
    			$scope.freeMemory = prettysize(res.system.freeMemory);
				_freeMemoryInt = res.system.freeMemory;
				_TotalMemoryInt = res.system.totalMemory;

    			$scope.nodeMemoryRSS = prettysize(res.nodeMemory.rss);
    			$scope.nodeMemoryHeapTotal = prettysize(res.nodeMemory.heapTotal);
    			$scope.nodeMemoryHeapUsed = prettysize(res.nodeMemory.heapUsed);
    			$scope.sid = res.wConsole.sid;

				var v = res.version.split(/#|:/g);
				$scope.ver = v[0];
				$scope.commit = (v[2] || '').substring(0, 7);
				$scope.build = v[1];

				$scope.arch = res.system.architecture;
				$scope.osName = res.system.name;
				$scope.platform = res.system.platform;
				$scope.nodeVer = res.nodeVersion;
				$scope.switchStrStatus = res.freeSWITCH;
				$scope.domainSession = res.domainSessions;
				$scope.maxUserSession = res.maxUserSessions;
				$scope.crashCount = res.crashCount;


				var freeSWITCH = res.freeSWITCH.split(/\n/);
				var startSessionsMatch = /(\d+)\s/.exec(freeSWITCH[3]);
				var startCPUMatch = /min\sidle\scpu\s(\d+.\d+)\/.*/.exec(freeSWITCH[6]);
				var startPerSec = /(\d+)\s/.exec(freeSWITCH[4]);
				chartsUpdateData(
					startCPUMatch ? +startCPUMatch[1]: 0,
					startSessionsMatch ? +startSessionsMatch[1] : 0,
					startPerSec ? +startPerSec[1] : 0,
					$scope.userSession,
					$scope.socketSession
				);
        	});

			var getCPUColor = function (v) {
				if (v > 80) {
					return "#FF4500"
				} else if (v > 40) {
					return "#FFFF00"
				} else {
					return "#9ACD32"
				}
			};

			var chartsUpdateData = function (cpu, sessions, calPerSec, onlineCount, userSession, _d) {
				var time = _d || Date.now();

				if (dataFS[0].values.length > 100) {
					dataFS[0].values.shift();
					dataFS[1].values.shift();
					dataFS[2].values.shift();

					dataUser[0].values.shift();
					dataUser[1].values.shift();
				}

				dataUser[0].values.push({
					x: time,
					y: onlineCount
				});

				dataUser[1].values.push({
					x: time,
					y: userSession
				});

				dataFS[0].values.push({
					time: time,
					x: time,
					y: sessions //+ 0.01
				});
				dataFS[1].values.push({
					time: time,
					x: time,
					y: calPerSec
				});
				dataFS[2].values.push({
					time: time,
					x: time,
					color: getCPUColor(cpu),
					y: cpu //+ 0.01
				});

				var maxSesions = Math.max.apply(null, dataFS[0].values.map(function (i) {
					return Math.round(i.y) + 1;
				}));
				var maxPerSec = Math.max.apply(null, dataFS[1].values.map(function (i) {
					return Math.round(i.y) + 1;
				}));
				$scope.statusChart.options.chart.yDomain1[1] = Math.max(maxSesions, maxPerSec);

				$scope.userChart.options.chart.yDomain1[1] = Math.max.apply(null, dataUser[1].values.map(function (i) {
					return Math.round(i.y) + 1;
				}));

				if (!document.hidden) {
					$timeout(function () {
						$scope.$digest();
					});
				}
				// if (!document.hidden) {
				// 	if (!$scope.api.status.update || !$scope.api.user.update) {
				// 		$scope.$apply()
				// 	} else {
				// 		$scope.api.status.update();
				// 		$scope.api.user.update();
				// 	}
				// }
			};
			var dataFS = [
				{
					"key": "Session",
					"yAxis": 1,
					"xAxis": 1,
					"color": "#1f77b4",
					"type": 'line',
					"area": true,
					"values": []
				},
				{
					"key": "Session per Sec",
					"yAxis": 1,
					"xAxis": 1,
					"color": "#7f7f7f",
					"type": 'line',
					// "area": true,
					"values": []
				},
				{
					"key": "CPU (%)",
					"type": 'bar',
					"color": "#d62728",
					"values": [],
					"yAxis": 2,
					"xAxis": 2
				}
			];
			var dataUser = [
				{
					key: 'Onlines',
					color: "#2ca02c",
					type: "line",
					yAxis: 1,
					yDomain: [0, 100],
					values: []
				},
				{
					key: 'Sessions',
					color: "#7777ff",
					type: "bar",
					yDomain: [0, 100],
					yAxis: 1,
					values: []
				}
			];

			$scope.userChart = {
				options: {
					chart: {
						type: 'multiChart',
						height: 350,
						margin : {
							top: 30,
							right: 60,
							bottom: 50,
							left: 70
						},
						color: d3.scale.category10().range(),
						yDomain1: [0, 3],
						//useInteractiveGuideline: true,
						duration: 500,
						xAxis: {
							axisLabel: 'Time',
							showMaxMin: false,
							ticks: 5,
							tickFormat: function(d) {
								return d3.time.format('%H:%M:%S')(new Date(d))
							}
						},
						lines1: {
							yDomain: [0, 100]
						},
						lines2: {
							yDomain: [0, 100]
						},
						yAxis1: {
							domain: [0, 100],
							axisLabel: 'Count',
							tickFormat: function(d){
								return d3.format(',f')(d);
							}
						}
					}
				},
				data: dataUser
			};

			$scope.statusChart = {
				options: {
					"chart": {
						yDomain1: [0, 1],
						yDomain2: [0, 100],
						duration: 500,
						type: "multiChart",
						height: 350,
						margin: {
							top: 30,
							right: 75,
							bottom: 50,
							left: 70
						},
						xAxis: {
							axisLabel: 'Time',
							showMaxMin: false,
							ticks: 5,
							tickFormat: function(d) {
								return d3.time.format('%H:%M:%S')(new Date(d))
							}
						},
						yAxis1: {
							axisLabel: 'Count',
							tickFormat: function(d){
								return d3.format(',f')(d);
							}
						},
						yAxis2: {
							axisLabel: 'CPU (%)',
							tickFormat: function(d) {
								return d3.format(".0%")(d / 100)
							},
							ticks: 3
						}
					}
				},
				data: dataFS
			};
			
			var onHeartbeat = function (e) {
				$scope.uptime = secondsToString(e.engine_uptime_sec);

				$scope.userSession = e.engine_online_count;
				$scope.socketSession =  e.engine_socket_count;
				$scope.domainSession = e.engine_domain_online;
				$scope.maxUserSession = e.engine_online_max;

				_freeMemoryInt = e.engine_free_mem;
				$scope.freeMemory = prettysize(_freeMemoryInt);
				$scope.nodeMemoryRSS = prettysize(e.engine_mem_rss);
				$scope.nodeMemoryHeapTotal = prettysize(e.engine_mem_heap_total);
				$scope.nodeMemoryHeapUsed = prettysize(e.engine_mem_heap_used);

				chartsUpdateData(
					100 - +e['Idle-CPU'],
					+e['Session-Count'],
					+e['Session-Per-Sec-Last'],
					+e["engine_online_count"],
					+e["engine_socket_count"]
				)
			};

			var onFocus = function() {
				$timeout(function () {
					$scope.$digest();
				});
			};

			var $win = $(window);
			$win.on('focus', onFocus);

			$scope.$on('$destroy', function () {
				webitel.connection.instance.unServerEvent('SE:HEARTBEAT', {all: true}, onHeartbeat);
				$win.off('focus', onFocus);
			});

			webitel.connection.instance.onServerEvent('SE:HEARTBEAT', onHeartbeat, {all: true});
    }]);
});