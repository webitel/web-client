/**
 * Created by i.navrotskyj on 20.02.2016.
 */
'use strict';

define(['ui-ace', 'ace', 'ext-language_tools'], function () {

    var OPERATIONS = {
            "if": {
                "if": {
                    "expression": "",
                    "then": [],
                    "else": []
                }
            },
            "switch":   {
                "switch": {
                    "variable": "${IVR}",
                    "case": {
                        "1": [],
                        "2": [],
                        "3": [],
                        "default": []
                    }
                }
            },
            "setSounds": {
                "setSounds": {
                    "voice": "elena",
                    "lang": "ru_RU"
                }
            },
            "async": {
                "async": true
            },

            "echo": {
                "echo": ""
            },

            "answer": {
                "answer": "200"
            },
            "setVar": {
                "setVar": []
            },
            "goto": {
                "goto": ""
            },
            "recordSession": {
                "recordSession": {
                    "action": "start",
                    "type": "mp3",
                    "stereo": false,
                    "bridged": true,
                    "minSec": "2",
                    "followTransfer": true,
                }
            },

            "hangup": {
                "hangup": ""
            },
            "script": {
                "script": {
                    "name": "MyLuaScript.lua",
                    "type": "lua",
                    "parameters": []
                }
            },
            "log": {
                "log": ""
            },
            "httpRequest": {
                "httpRequest": {
                    "url": "https://sales.bpmonline.com/0/ServiceModel/GetCallerOwnerService.svc/GetCallerOwner",
                    "method": "POST",
                    "headers": {
                        "Content-Type":"application/json"
                    },
                    "data": {
                        "callerIdNumber": "${caller_id_number}"
                    },
                    "exportVariables": {
                        "effective_caller_id_name": "callerIdName",
                        "owner_caller_id_number": "callerIdOwner"
                    }
                }
            },
            "sleep": {
                "sleep": "1000"
            },

            "conference": {
                "conference": {
                    "name": "ConferenceName",
                    "pin": "1234" ,
                    "flags": ["mute", "moderator"]
                }
            },

            "schedule": {
                "schedule": {
                    "action": "hangup",
                    "seconds": "360",
                    "data": "ALLOTTED_TIMEOUT"
                }
            },

            "bridge": {
                "bridge": {
                    "strategy": "multiple",
                    "pickup": "mygroup",
                    "parameters": [],
                    "endpoints": []
                }
            },
            "playback": {
                "playback": {
                    "files": [
                        {
                            "name": "welcome-rus.wav",
                            "type": "wav"
                        }
                    ]
                }
            },

            "break": {
                "break": true
            },

            "park": {
                "park": {
                    "name": "myPark",
                    "lot": "1000-2000",
                    "auto": "in | out "
                }
            },
            "queue": {
                "queue": {
                    "name": "myQueue"
                }
            },

            "voicemail": {
                "voicemail": {
                    "user": "100",
                    "skip_greeting": true,
                    "skip_instructions": true,
                    "cc": [
                        "1001",
                        "1002"
                    ]
                }
            },

            'receiveFax': {
                "receiveFax": {
                    "enable_t38": "false",
                    "email": ["office@webitel.com", "admin@webitel.com"]
                }
            },

            'blackList': {
                "blackList": {
                    "name": "myNewBlackList",
                    "action": []
                }
            },

            'pickup': {
                "pickup": "mygroup"
            },

            "ringback": {
                "ringback": {
                    "call": {
                        "name": "my.mp3",
                        "type": "mp3"
                    },
                    "hold": {
                        "type": "silence"
                    },
                    "transfer": {
                        "name": "$${us-ring}",
                        "type": "tone"
                    }
                }
            }
        },
        list = [];
    var i = 0;
    angular.forEach(OPERATIONS, function (val, key) {
        list.push({
            caption: key,
            value: JSON.stringify(val, null, '\t'),
            meta: 'application',
            score: i++
        })
    });

    var ace = window.ace;
    ace.config.loadModule("ace/ext/language_tools", function (langTools) {
        var appCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
                if (prefix.length === 0) { callback(null, []); return };
                return callback(null, list);
            }
        }
        langTools.addCompleter(appCompleter);
    });
    return {
        "init": function (editor) {
            editor.commands.addCommands([{
                name: "showSettingsMenu",
                bindKey: {win: "Ctrl-q", mac: "Command-q"},
                exec: function(editor) {
                    editor.showSettingsMenu();
                },
                readOnly: true
            }]);

            //var _height = $(editor.container).css('height');
            //editor.commands.addCommands([{
            //    name: 'full screan',
            //    bindKey: {win: 'F11',  mac: 'F11'},
            //    exec: function(editor) {
            //        var elem = $(editor.container);
            //        elem.toggleClass('json-fullscreean');
            //        var h = '100%';
            //        if (!elem.hasClass('json-fullscreean')) {
            //            h = _height;
            //        };
            //        editor.resize();
            //        elem.css('height', h);
            //
            //    },
            //    readOnly: true
            //}]);
            ace.config.loadModule("ace/ext/settings_menu", function (settingsMenu) {
                settingsMenu.init(editor);
            });


            editor.getSession().setUseWorker(true);
            editor.setShowInvisibles(true);


            // enable autocompletion and snippets
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
            editor.setShowPrintMargin(false);
            editor.setAutoScrollEditorIntoView(true);
            editor.setOption("maxLines", Infinity);
            editor.setOption("minLines", 10);
            editor.setFontSize(14)

            editor._setJson = function (ob) {
                editor.setValue(JSON.stringify(ob, null, '\t'), -1)
            };

            editor._getJson = function () {
                return JSON.parse(editor.getValue())
            };

            function split(val) {
                return val.split(/,\s*/);
            }

            
            editor.on('autocomplate', function () {
                try {

                    var pos = editor.getCursorPosition().row - 2;
                    editor.setValue(JSON.stringify(editor._getJson(), null, '\t'), pos)
                } catch (e) {
                    return
                };
            });

            return editor;
        },
        "getStrFromJson": function (ob) {
            return JSON.stringify(ob, null, '\t')
        }
    }
})