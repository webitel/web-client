/**
 * Created by matvij on 20.09.17.
 */

define(['app'], function (app) {
    app.factory('TtsProviders', function () {
        return {
            providers :[
                {
                    name: 'microsoft',
                    voice: [
                        {
                            language: 'ar-EG*',
                            gender: 'Female'
                        },
                        {
                            language: 'ar-SA',
                            gender: 'Male'
                        }, {
                            language: 'ca-ES',
                            gender: 'Female'
                        }, {
                            language: 'cs-CZ',
                            gender: 'Male'
                        },
                        {
                            language: 'da-DK',
                            gender: 'Female'
                        },
                        {
                            language: 'de-AT',
                            gender: 'Male'
                        },
                        {
                            language: 'de-CH',
                            gender: 'Male'
                        },
                        {
                            language: 'de-DE',
                            gender: 'Female'
                        },
                        {
                            language: 'de-DE',
                            gender: 'Male'
                        },
                        {
                            language: 'el-GR',
                            gender: 'Male'
                        },
                        {
                            language: 'en-AU',
                            gender: 'Female'
                        },
                        {
                            language: 'en-CA',
                            gender: 'Female'
                        },
                        {
                            language: 'en-GB',
                            gender: 'Female'
                        },
                        {
                            language: 'en-GB',
                            gender: 'Male'
                        },
                        {
                            language: 'en-IE',
                            gender: 'Male'
                        },
                        {
                            language: 'en-IN',
                            gender: 'Female'
                        },
                        {
                            language: 'en-IN',
                            gender: 'Male'
                        },
                        {
                            language: 'en-US',
                            gender: 'Female'
                        },
                        {
                            language: 'en-US',
                            gender: 'Male'
                        },
                        {
                            language: 'es-ES',
                            gender: 'Female'
                        },
                        {
                            language: 'es-ES',
                            gender: 'Male'
                        },
                        {
                            language: 'es-MX',
                            gender: 'Female'
                        },
                        {
                            language: 'es-MX',
                            gender: 'Male'
                        },
                        {
                            language: 'fi-FI',
                            gender: 'Female'
                        },
                        {
                            language: 'fr-CA',
                            gender: 'Female'
                        },
                        {
                            language: 'fr-CH',
                            gender: 'Male'
                        },
                        {
                            language: 'fr-FR',
                            gender: 'Female'
                        },
                        {
                            language: 'fr-FR',
                            gender: 'Male'
                        },
                        {
                            language: 'he-IL',
                            gender: 'Male'
                        },
                        {
                            language: 'hi-IN',
                            gender: 'Female'
                        },
                        {
                            language: 'hi-IN',
                            gender: 'Male'
                        },
                        {
                            language: 'hu-HU',
                            gender: 'Male'
                        },
                        {
                            language: 'id-ID',
                            gender: 'Male'
                        },
                        {
                            language: 'it-IT',
                            gender: 'Male'
                        },
                        {
                            language: 'ja-JP',
                            gender: 'Female'
                        },
                        {
                            language: 'ja-JP',
                            gender: 'Male'
                        },
                        {
                            language: 'ko-KR',
                            gender: 'Female'
                        },
                        {
                            language: 'nb-NO',
                            gender: 'Female'
                        },
                        {
                            language: 'nl-NL',
                            gender: 'Female'
                        },
                        {
                            language: 'pl-PL',
                            gender: 'Female'
                        },
                        {
                            language: 'pt-BR',
                            gender: 'Female'
                        },
                        {
                            language: 'pt-BR',
                            gender: 'Male'
                        },
                        {
                            language: 'pt-PT',
                            gender: 'Female'
                        },
                        {
                            language: 'ro-RO',
                            gender: 'Male'
                        },
                        {
                            language: 'ru-RU',
                            gender: 'Female'
                        },
                        {
                            language: 'ru-RU',
                            gender: 'Male'
                        },
                        {
                            language: 'sk-SK',
                            gender: 'Male'
                        },
                        {
                            language: 'sv-SE',
                            gender: 'Female'
                        },
                        {
                            language: 'th-TH',
                            gender: 'Male'
                        },
                        {
                            language: 'tr-TR',
                            gender: 'Female'
                        },
                        {
                            language: 'zh-CN',
                            gender: 'Female'
                        },
                        {
                            language: 'zh-CN',
                            gender: 'Male'
                        },
                        {
                            language: 'zh-HK',
                            gender: 'Female'
                        },
                        {
                            language: 'zh-HK',
                            gender: 'Male'
                        },
                        {
                            language: 'zh-TW',
                            gender: 'Female'
                        },
                        {
                            language: 'zh-TW',
                            gender: 'Male'
                        }
                    ]
                },
                {
                    name: 'polly',
                    voice:[
                        {
                            language: 'English (US) (en-US)',
                            male:['Joey', 'Justin'],
                            female:['Kendra', 'Kimberly', 'Salli', 'Ivy', 'Joanna']
                        },
                        {
                            language: 'Danish (da-DK)',
                            male:['Mads'],
                            female:['Naja']
                        },
                        {
                            language: 'Dutch (nl-NL)',
                            male:['Ruben'],
                            female:['Lotte']
                        },
                        {
                            language: 'English (Australian) (en-AU)',
                            male:['Russell'],
                            female:['Nicole']
                        },
                        {
                            language: 'English (British) (en-GB)',
                            male:['Brian'],
                            female:['Amy', 'Emma',]
                        },
                        {
                            language: 'English (Indian) (en-IN)',
                            male:[],
                            female:['Raveena']
                        },
                        {
                            language: 'English (Welsh) (en-GB-WLS)',
                            male:['Geraint'],
                            female:[]
                        },
                        {
                            language: 'French (fr-FR)',
                            male:['Mathieu'],
                            female:['Celine']
                        },
                        {
                            language: 'French (Canadian) (fr-CA)',
                            male:[],
                            female:['Chantal']
                        },
                        {
                            language: 'German (de-DE)',
                            male:['Hans'],
                            female:['Marlene', 'Vicki']
                        },
                        {
                            language: 'Icelandic (is-IS)',
                            male:['Karl'],
                            female:['Dora']
                        },
                        {
                            language: 'Italian (it-IT)',
                            male:['Giorgio'],
                            female:['Carla']
                        },
                        {
                            language: 'Japanese (ja-JP)',
                            male:[],
                            female:['Mizuki']
                        },
                        {
                            language: 'Norwegian (nb-NO)',
                            male:[],
                            female:['Liv']
                        },
                        {
                            language: 'Polish (pl-PL)',
                            male:['Jacek', 'Jan'],
                            female:['Ewa', 'Maja']
                        },
                        {
                            language: 'Portuguese (Brazilian) (pt-BR)',
                            male:['Ricardo'],
                            female:['Vitoria']
                        },
                        {
                            language: 'Portuguese (European) (pt-PT)',
                            male:['Cristiano'],
                            female:['Ines']
                        },
                        {
                            language: 'Romanian (ro-RO)',
                            male:[],
                            female:['Carmen']
                        },
                        {
                            language: 'Russian (ru-RU)',
                            male:['Maxim'],
                            female:['Tatyana']
                        },
                        {
                            language: 'Spanish (Castilian) (es-ES)',
                            male:['Enrique'],
                            female:['Conchita']
                        },
                        {
                            language: 'Spanish (Latin American) (es-US)',
                            male:['Miguel'],
                            female:['Penelope']
                        },
                        {
                            language: 'Swedish (sv-SE)',
                            male:[],
                            female:['Astrid']
                        },
                        {
                            language: 'Turkish (tr-TR)',
                            male:[],
                            female:['Filiz']
                        },
                        {
                            language: 'Welsh (cy-GB)',
                            male:[],
                            female:['Gwyneth']
                        }
                    ]
                }
            ]
        }
    });
});
