/**
 * Created by matvij on 05.07.17.
 */

define(['app'], function (app) {
    app.factory('WidgetDefault', function () {
        return{
            fontFamilies: [
                "Arial","Comic Sans MS","Courier New","Calibri","Georgia","Impact","Lucida Console","Lucida Sans Unicode","Palatino Linotype","Tahoma","Times New Roman","Trebuchet MS","Verdana","MS Sans Serif","MS Serif"
            ],
            languages: [
                {
                    value: "en",
                    displayedValue: "English"
                },
                {
                    value: "ru",
                    displayedValue: "Russian"
                },
                {
                    value: "ua",
                    displayedValue: "Ukrainian"
                }
            ],
            script: '<script type="text/javascript"> ' +
                'window.WebitelCallbackId="##ID##";' +
                'window.WebitelCallbackHost="##HOST##";' +
                'window.WebitelCallbackDomain="##DOMAIN##";' +
                '(function(){'
                +'var l = document.createElement("script");'
                +'l.type ="text/javascript";'
                +'l.charset = "utf-8";'
                +'l.async = true;'
                +'l.src = "##HOST##/widget.client.js";'
                +'var s = document.getElementsByTagName("script")[0];'
                +'if (s) s.parentNode.insertBefore(l, s);'
                +'else document.documentElement.firstChild.appendChild(l);'
                +'})();</script>',
            widget: {
                language: "en",
                name: "",
                description: "",
                domain: "",
                queue_id: "",
                callflow_id: "",
                limit_by_number: false,
                limit_by_ip: 1,
                blacklist:[],
                config:{
                    hookCountDown: 60,
                    getCountryUrl: "https://freegeoip.net/json/",
                    publicWebRtc: "",
                    destinationNumber: "00",
                    publicPostApi: "",
                    webRtcOnly: false,
                    useWebRtc: true,
                    useVideo: false,
                    calendar: {
                        id:"",
                        timezone:"",
                        accept:[],
                        except:[]
                    },
                    showInCountry: {
                        acceptCountries: true,
                        countries:[]
                    },
                    validateNumbers: [],
                    css: {
                        //modal
                        modal:{
                            background: "#ffffff",
                            fontFamily: ""
                        },
                        leftPanelColor: {
                            background: "#DC143C"
                        },
                        //call me
                        buttonColor: {
                            background: "#32cd3b"
                        },
                        buttonCircle: {
                            borderColor: "#1fcd00"
                        },
                        buttonPosition: {
                            left: '100px',
                            bottom: '100px'
                        },
                        //modal elements
                        callMeBtn:{
                            background: "#d6000a",
                            color: "#ffffff"
                        },
                        input:{
                            borderColor: "#d61921",
                            backgroundColor: "#ffffff",
                            color: "#000000"
                        },
                        //text
                        supportingText:{
                            color:"#000000",
                        },
                        footer:{
                            background: "#ffffff",
                            color: "#000000"
                        },
                        errorMessage: {
                            color: "#d6000a"
                        }
                    },
                    lang: {}
                }
            },
            ru_lang:{
                //work time
                hookTitle: "У вас есть вопросы? Мы вам поможем!",
                hookText: "Наш лучший менеджер перезвонит вам через #countdown# секунд. Это быстро и бесплатно!",
                hookWaitingTitle: "Менеджер вам перезвонит до завершення таймера",
                btnCallWork: "Жду звонка",
                invalidNumberMessage: "Введено некорректный номер!!!",
                serverErrorMessage: "Ошибка сервера!!!",
                //deferred time
                showDeferredTitle: "Спасибо за заявку!",
                showDeferredText: "Звонок запланирован на #time#, #date#",
                deferredLinkName: "Отложенный звонок",
                deferredTitle: "Отложенный звонок",
                deferredText: "Мы обязательно перезвоним в указаное время и дадим ответы на вопросы, которые вас интересуют!",
                workLinkName: "Назад",
                btnCallDeferred: "Заказать",
                //webRtc
                hangup: "Завершить",
                hold: "Удержание",
                unhold: "Восстановить",
                returnFromWebrtc: "Назад",
                cancelWebrtc: "Отменить",
                webRtcLinkName: "Поддержка WebRtc",
                //not work time
                notWorkTitle: "Заказ обратного звонка",
                notWorkText: "К сожалению, наше рабочее время уже закончилось, но мы обязательно перезвоним вам в указаное время!",
                //logs
                forLog:{
                    //app
                    pageOpen: "Открыто страницу",
                    //btnCallMe
                    buttonShow: "Показано кнопку",
                    //modal
                    buttonClick: "Открыто модальное окно",
                    closeModal: "Закрито модальное окно",
                    inputFound: "В клиента присутствует микрофон",
                    //home
                    workPageOpen: "Переход на окно рабочего времени",
                    callButtonClick: "Нажатие на кнопку ожидания звонка. Номер:",
                    invalidNumber: "Введение некорректного номера",
                    serverError: "Ошибка сервера при заказе звонка",
                    //hookWaiting
                    hookWaiting: "Переход на окно ожидания звонка",
                    //showDeferred
                    showDeferred: "Переход на окно отображения заказа звонка",
                    //deferred
                    openDefWorkTime: "Переход на окно отложеного звонка",
                    openDefNotWorkTime: "Переход на окно нерабочего времени",
                    orderDefCall: "Заказ отложеного звонка. Номер:",//invalidnumber, servererror
                    setMinutes: "Выбор минут",
                    setHours: "Выбор часов",
                    setDay: "Выбор даты",
                    //webRtc
                    openWebRtc: "Переход на окно WebRTC",
                    webRtcButtonClick: "WebRTC: нажатие кнопки"
                }
            },
            en_lang:{
                //work time
                hookTitle: "Do you have any questions? We will help you!",
                hookText: "Our best manager will call you back in #countdown# seconds. It's fast and free!",
                hookWaitingTitle: "The manager will call you back to the end of the timer",
                btnCallWork: "Call",
                invalidNumberMessage: "Invalid number!!!",
                serverErrorMessage: "Server error!!!",
                //deferred time
                showDeferredTitle: "Thank you for requesting!",
                showDeferredText: "The call is scheduled for #time#, #date#",
                deferredLinkName: "Scheduled call",
                deferredTitle: "Scheduled call",
                deferredText: "We will call you at the indicated time and answer the questions of interest to you!",
                workLinkName: "Back",
                btnCallDeferred: "Order",
                //webRtc
                hangup: "Finish",
                hold: "Hold",
                unhold: "Resume",
                returnFromWebrtc: "Back",
                cancelWebrtc: "Cancel",
                webRtcLinkName: "WebRtc support",
                //not work time
                notWorkTitle: "Make a call back",
                notWorkText: "Unfortunately, our working day is over, but we will call you back at the specified time!",
                //logs
                forLog:{
                    //app
                    pageOpen: "Open page",
                    //btnCallMe
                    buttonShow: "Button is displayed",
                    //modal
                    buttonClick: "Open modal window",
                    closeModal: "Close modal window",
                    inputFound: "Audio input device was found",
                    //home
                    workPageOpen: "Go to the working time window",
                    callButtonClick: "Click on the call waiting button. Number:",
                    invalidNumber: "Entering the wrong number",
                    serverError: "Server error when ordering a callback",
                    //hookWaiting
                    hookWaiting: "Go to the call waiting window",
                    //showDeferred
                    showDeferred: "Go to the scheduled call order display window",
                    //deferred
                    openDefWorkTime: "Switch to scheduled call window",
                    openDefNotWorkTime: "Go to the not working time window",
                    orderDefCall: "Order a scheduled call. Number:",//invalidnumber, servererror
                    setMinutes: "Change minute to",
                    setHours: "Change hour to",
                    setDay: "Change date to",
                    //webRtc
                    openWebRtc: "Go to the WebRTC window",
                    webRtcButtonClick: "WebRTC button click:"
                }
            },
            ua_lang:{
                //work time
                hookTitle: "У вас є питання? Ми вам допоможемо!",
                hookText: "Наш кращий менеджер передзвонить вам всього через #countdown# секунд. Це швидко і безкоштовно!",
                hookWaitingTitle: "Менеджер вам перезвонить до завершення таймера",
                btnCallWork: "Чекаю дзвінка",
                invalidNumberMessage: "Введено некоректний номер!!!",
                serverErrorMessage: "Помилка сервера!!!",
                //deferred time
                showDeferredTitle: "Дякуємо за заявку!",
                showDeferredText: "Дзвінок запланований на #time#, #date#",
                deferredLinkName: "Відкладений дзвінок",
                deferredTitle: "Відкладений дзвінок",
                deferredText: "Ми обов'язково подзвонимо в указаний час і відповімо на питання, що цікавлять вас!",
                workLinkName: "Назад",
                btnCallDeferred: "Замовити",
                //webRtc
                hangup: "Завершити",
                hold: "Утримання",
                unhold: "Відновити",
                returnFromWebrtc: "Назад",
                cancelWebrtc: "Відмінити",
                webRtcLinkName: "Підтримка WebRtc",
                //not work time
                notWorkTitle: "Замовлення зворотного дзвінка",
                notWorkText: "На жаль, наш робочий день вже закінчився, але ми обов'язково передзвонимо вам в указаний час!",
                //logs
                forLog:{
                    //app
                    pageOpen: "Відкрито сторінку",
                    //btnCallMe
                    buttonShow: "Відображено кнопку",
                    //modal
                    buttonClick: "Відкрито модальне вікно",
                    closeModal: "Закрито модальне вікно",
                    inputFound: "В клієнта наявний мікрофон",
                    //home
                    workPageOpen: "Перехід на вікно робочого часу",
                    callButtonClick: "Натиснення на кнопку очікування дзвінка. Номер:",
                    invalidNumber: "Введення некоректного номеру",
                    serverError: "Помилка сервера при замовленні зворотного дзвінка",
                    //hookWaiting
                    hookWaiting: "Перехід на вікно очікування дзвінка",
                    //showDeferred
                    showDeferred: "Перехід на вікно відображення замовлення відкладеного дзвінка",
                    //deferred
                    openDefWorkTime: "Перехід на вікно відкладеного дзвінка",
                    openDefNotWorkTime: "Перехід на вікно неробочого часу",
                    orderDefCall: "Замовлення відкладеного дзвінка. Номер:",//invalidnumber, servererror
                    setMinutes: "Вибір хвилин",
                    setHours: "Вибір години",
                    setDay: "Вибір дати",
                    //webRtc
                    openWebRtc: "Перехід на вікно WebRTC",
                    webRtcButtonClick: "WebRTC: натиснення кнопки"
                }
            }
        }
    })
});

