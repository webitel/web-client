/**
 * Created by matvij on 20.09.17.
 */

define(['app'], function (app) {
    app.factory('TtsProviders', function () {
        return {
            providers :[
                {
                    name: 'polly',
                    voice:[
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
                            language: 'English (US) (en-US)',
                            male:['Joey', 'Justin'],
                            female:['Kendra', 'Kimberly', 'Salli', 'Ivy', 'Joanna']
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
