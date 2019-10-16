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
                            language: 'vi-VN',
                            gender: 'Male'
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
                    ],
                    regions: [
                        {
                            name: 'West US',
                            value: 'westus'
                        },
                        {
                            name: 'West US2',
                            value: 'westus2'
                        },
                        {
                            name: 'East US',
                            value: 'eastus'
                        },
                        {
                            name: 'East US2',
                            value: 'eastus2'
                        },
                        {
                            name: 'East Asia',
                            value: 'eastasia'
                        },
                        {
                            name: 'South East Asia',
                            value: 'southeastasia'
                        },
                        {
                            name: 'North Europe',
                            value: 'northeurope'
                        },
                        {
                            name: 'West Europe',
                            value: 'westeurope'
                        },
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
                    ],
                    regions: []
                },
                {
                    name: 'google',
                    regions: [],
                    voice:  [
                        {
                            "language": "ar-XA-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ar-XA-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "ar-XA-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "cmn-CN-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "cmn-CN-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "cmn-CN-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "cmn-CN-Wavenet-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "cs-CZ-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "da-DK-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "de-DE-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "de-DE-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "de-DE-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "de-DE-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "el-GR-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-AU-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-AU-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-AU-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-AU-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-GB-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-GB-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-GB-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-GB-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-IN-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-IN-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-IN-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Wavenet-A",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-US-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Wavenet-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-US-Wavenet-F",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fi-FI-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fil-PH-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-CA-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-CA-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-CA-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-CA-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-FR-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-FR-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-FR-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-FR-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-FR-Wavenet-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "hi-IN-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "hi-IN-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "hi-IN-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "hu-HU-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "id-ID-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "id-ID-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "id-ID-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "it-IT-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "it-IT-Wavenet-B",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "it-IT-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "it-IT-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "ja-JP-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ja-JP-Wavenet-B",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ja-JP-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "ja-JP-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "ko-KR-Wavenet-B",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ko-KR-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "ko-KR-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "ko-KR-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-no-Wavenet-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-NO-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-NO-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "nb-NO-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-NO-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "nl-NL-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "nl-NL-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "nl-NL-Wavenet-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nl-NL-Wavenet-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nl-NL-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pl-PL-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pl-PL-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "pl-PL-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "pl-PL-Wavenet-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pl-PL-Wavenet-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pt-BR-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pt-PT-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pt-PT-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "pt-PT-Wavenet-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "pt-PT-Wavenet-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Wavenet-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "ru-RU-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "sk-SK-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "sv-SE-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "tr-TR-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Wavenet-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Wavenet-E",
                            "gender": "MALE"
                        },
                        {
                            "language": "uk-UA-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "vi-VN-Wavenet-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "vi-VN-Wavenet-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "vi-VN-Wavenet-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "vi-VN-Wavenet-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "es-ES-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ar-XA-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ar-XA-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "ar-XA-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-FR-Standard-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "it-IT-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Standard-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "ru-RU-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ru-RU-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "cmn-CN-Standard-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "cmn-CN-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "cmn-CN-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "cmn-CN-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "ko-KR-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ko-KR-Standard-B",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ko-KR-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "ko-KR-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "ja-JP-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ja-JP-Standard-B",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "ja-JP-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "ja-JP-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "vi-VN-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "vi-VN-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "vi-VN-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "vi-VN-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "fil-PH-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "id-ID-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "id-ID-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "id-ID-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "nl-NL-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nl-NL-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "nl-NL-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "nl-NL-Standard-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nl-NL-Standard-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "cs-CZ-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "el-GR-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pt-BR-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "hu-HU-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pl-PL-Standard-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pl-PL-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pl-PL-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "pl-PL-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "pl-PL-Standard-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "sk-SK-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "tr-TR-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Standard-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "tr-TR-Standard-E",
                            "gender": "MALE"
                        },
                        {
                            "language": "uk-UA-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-IN-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-IN-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-IN-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "hi-IN-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "hi-IN-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "hi-IN-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "da-DK-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fi-FI-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pt-PT-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "pt-PT-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "pt-PT-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "pt-PT-Standard-D",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-no-Standard-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-NO-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-NO-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "nb-NO-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "nb-NO-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "sv-SE-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-GB-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-GB-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-GB-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-GB-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-US-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-US-Standard-E",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "de-DE-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "de-DE-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-AU-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-AU-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "en-AU-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "en-AU-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-CA-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-CA-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-CA-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-CA-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-FR-Standard-A",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-FR-Standard-B",
                            "gender": "MALE"
                        },
                        {
                            "language": "fr-FR-Standard-C",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "fr-FR-Standard-D",
                            "gender": "MALE"
                        },
                        {
                            "language": "it-IT-Standard-B",
                            "gender": "FEMALE"
                        },
                        {
                            "language": "it-IT-Standard-C",
                            "gender": "MALE"
                        },
                        {
                            "language": "it-IT-Standard-D",
                            "gender": "MALE"
                        }
                    ]
                }
            ]
        }
    });
});
