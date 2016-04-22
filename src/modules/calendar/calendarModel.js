/**
 * Created by igor on 12.04.16.
 */

'use strict';

define(['app', 'scripts/webitel/utils'], function (app, utils) {

    app.factory('CalendarModel', ["webitel", function (webitel) {

        function list (domain, cb) {
            if (!domain)
                return cb(new Error("Domain is required."));

            webitel.api("GET", "/api/v2/calendars?domain=" + domain, cb)
        };

        function item(domain, id, cb) {

            if (!id)
                return cb(new Error("Id is required."));

            webitel.api("GET", "/api/v2/calendars/" + id + "?domain=" + (domain || ""), function (err, res) {
                if (err)
                    return cb(err);

                var calendar = res && res.data;
                calendar._startDate = calendar.startDate ? new Date(calendar.startDate) : null;
                calendar._endDate = calendar.endDate ? new Date(calendar.endDate) : null;
                return cb(null, calendar);
            });
        };

        function add (data, cb) {
            var calendar = parseCalendar(data);

            if (!calendar.name)
                return cb(new Error("Bad name"));
            if (!calendar.domain)
                return cb(new Error("Bad domain name"));

            webitel.api("POST", "/api/v2/calendars?domain=" + calendar.domain, calendar, function (err, res) {
                if (err)
                    return cb(err);
                var id = res.data && res.data.insertedIds;

                return cb(null, id && id[0]);
            });
        };

        function parseCalendar (data) {
            var calendar = {
                "name": data.name,
                "description": data.description,
                "startDate": data._startDate ? data._startDate.getTime() : null,
                "endDate": data._endDate ? data._endDate.getTime() : null,
                "timeZone": data.timeZone,
                "domain": data.domain,
                "accept": [],
                "except": []
            };
            angular.forEach(data.accept, function (v) {
                calendar.accept.push({
                    "weekDay": v.weekDay,
                    "endTime": v.endTime,
                    "startTime": v.startTime
                })
            });
            angular.forEach(data.except, function (v) {
                calendar.except.push({
                    "name": v.name,
                    "date": v.date,
                    "repeat": v.repeat
                })
            });
            return calendar;
        };

        function update(id, data, cb) {
            if (!id)
                return cb(new Error("Bad id"));

            var calendar = parseCalendar(data);

            if (!calendar.name)
                return cb(new Error("Bad name"));
            if (!calendar.domain)
                return cb(new Error("Bad domain name"));

            webitel.api("PUT", "/api/v2/calendars/" + id + "?domain=" + calendar.domain, calendar, cb);
        };

        function remove(id, domain, cb) {
            if (!id)
                return cb(new Error("Bad id"));

            if (!domain)
                return cb(new Error("Bad domain name"));

            webitel.api("DELETE", "/api/v2/calendars/" + id + "?domain=" + domain, cb);
        };

        function create () {
            return {
                "_id": null,
                "startDate": 0,
                "endDate": 1,
                "domain": "",
                "type": "",
                "name": "",
                "description": "",
                "timeZone": "",
                "accept": [
                    {
                        "weekDay": 1,
                        "startTime": 540,
                        "endTime": 1020
                    },
                    {
                        "weekDay": 2,
                        "startTime": 540,
                        "endTime": 1020
                    },
                    {
                        "weekDay": 3,
                        "startTime": 540,
                        "endTime": 1020
                    },
                    {
                        "weekDay": 4,
                        "startTime": 540,
                        "endTime": 1020
                    },
                    {
                        "weekDay": 5,
                        "startTime": 540,
                        "endTime": 1020
                    }
                ],
                "except": [

                ]
            }
        }

        return {
            list: list,
            item: item,
            create: create,
            add: add,
            update: update,
            remove: remove
        }
    }]);
});