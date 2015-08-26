var express = require("express"),
    app = express(),
    cors = require('cors'),
    parseString = require('xml2js').parseString,
    request = require('request');
app.use(cors());

app.use('/', express.static(__dirname + '/public', {
    maxAge: (365 * 24 * 60 * 60)
}));
var fb_insight_url = "https://graph.facebook.com/v2.4/act_790155804435790/insights?",
    fb_access_token = "CAAGXaYM1QFcBAEvXMTcZBVP0rNIPsdiBoXzGj6X3o0yZCwz0ZAEUCSpL0WT7BsC4qrPunZCIN8cqpPyWwj9dRdfNKzBC4N4LH5GdVBWTZAuTVHvMxslvRsDYiStZBWZAsVVO9gMZB0yTCILufkyQsRxXRoK5ySdSaH17UYEuw5fSgIVNoftW179p5933U1uXhMA4CjgnhY7k9Do7TQAZBJw5h",
    fb_level = "account",
    fb_time_increment = 1,
    fb_fields = "actions",
    google_refreshtoken_url = "https://www.googleapis.com/oauth2/v3/token?",
    google_refresh_token = "1/P0Bo3fVSm6cMrDRKhjrvbFSkPfc9uLSgPV3pMy4QnQs",
    google_client_secret = "CrGoa9ioJ6KSuJ4hBWue4AIP",
    google_client_id = "740523075147-469v25nd2o33jubidb24psm898a87lh6.apps.googleusercontent.com",
    google_ad_data_url = "https://adwords.google.com/api/adwords/reportdownload/",
    google_report_id = "v201506",
    google_developerToken = 'O87ht9IYUOpNLt1PWvQt-w',
    goggle_clientCustomerId = '619-401-0053',
    getGoogleRequestXML = function(req, reportId) {
        var xml_string = ['<reportDefinition xmlns="https://adwords.google.com/api/adwords/cm/',
            reportId,
            '">',
            '<selector>'
        ].join("");
        req.google_fields.forEach(function(fieldName, index) {
            xml_string += '<fields>' + fieldName + '</fields>'
        })
        if (!req.query.fullTime) {
            xml_string += [
                '<dateRange>',
                '<min>',
                req.dates.starts.replace(/-/g, ''),
                '</min>',
                '<max>',
                req.dates.ends.replace(/-/g, ''),
                '</max>',
                '</dateRange>'
            ].join("");
        }
        xml_string += [
            '</selector>',
            '<reportName>Custom Account Performance Report</reportName>',
            '<reportType>ACCOUNT_PERFORMANCE_REPORT</reportType>'
        ].join("");
        if (!req.query.fullTime) {
            xml_string += '<dateRangeType>CUSTOM_DATE</dateRangeType>'
        } else {
            xml_string += '<dateRangeType>ALL_TIME</dateRangeType>'
        }
        xml_string += [
            '<downloadFormat>XML</downloadFormat>',
            '</reportDefinition>'
        ].join("");
        return xml_string;
    };
var mergeAreaWidgetData = function(req, res, next) {
        var graphData = {
            "fb": [],
            "google": []
        };
        req.dateArray.forEach(function(item, index) {
            var actionDate = new Date(item);
            if (req.fbAdData[item]) {
                graphData.fb.push(req.fbAdData[item]);
            } else {
                graphData.fb.push(0);
            }
            if (req.googleAdData[item]) {
                graphData.google.push(req.googleAdData[item]);
            } else {
                graphData.google.push(0);
            }
            req.chartData.xAxis.categories.push((actionDate.getMonth() + 1) + "/" + actionDate.getDate());
        });
        req.chartData.series[0].data = graphData.fb;
        req.chartData.series[1].data = graphData.google;
        res.send(req.chartData);
    },
    mergeLineWidgetData = function(req, res, next) {
        var graphData = {
            "fb": [],
            "google": [],
            "total": []
        };
        req.dateArray.forEach(function(item, index) {
            var actionDate = new Date(item),
                total = 0;
            if (req.fbAdData[item] && (!isNaN(req.fbAdData[item].spend / req.fbAdData[item].action))) {
                graphData.fb.push(parseFloat((req.fbAdData[item].spend / req.fbAdData[item].action).toFixed(2)));
            } else {
                graphData.fb.push(0);
            }
            if (req.googleAdData[item] && (!isNaN(req.googleAdData[item].costEstTotalConv / 1000000))) {
                graphData.google.push(parseFloat((req.googleAdData[item].costEstTotalConv / 1000000).toFixed(2)));
            } else {
                graphData.google.push(0);
            }
            if (req.googleAdData[item] && req.fbAdData[item] && !isNaN(req.googleAdData[item].costEstTotalConv) && !isNaN(req.googleAdData[item].cost) && !isNaN(req.fbAdData[item].spend) && !isNaN(req.fbAdData[item].action)) {
                total = parseFloat((((req.googleAdData[item].cost / 1000000) + req.fbAdData[item].spend) / ((req.googleAdData[item].cost / req.googleAdData[item].costEstTotalConv) + req.fbAdData[item].action)).toFixed(2))
            }

            graphData.total.push(total);
            req.chartData.xAxis.categories.push((actionDate.getMonth() + 1) + "/" + actionDate.getDate());
        });
        req.chartData.series[0].data = graphData.fb;
        req.chartData.series[1].data = graphData.google;
        req.chartData.series[2].data = graphData.total;
        res.send(req.chartData);
    },
    mergeGaugeWidgetData = function(req, res, next) {
        req.chartData.series[0].data[0] = req.fbImpressionData + req.googleImpressionData;
        res.send(req.chartData);
    },
    createDateList = function(req, res, next) {
        var date = new Date(req.dates.starts),
            day, month,
            dateArray = [];
        while (new Date(date).getTime() <= new Date(req.dates.ends).getTime()) {
            day = date.getDate();
            if (day < 10) {
                day = "0" + day;
            }
            month = date.getMonth() + 1;
            if (month < 10) {
                month = "0" + month;
            }
            dateArray.push(date.getFullYear() + "-" + month + "-" + day);
            date = new Date(date.setDate(
                date.getDate() + 1
            ))
        }
        req.dateArray = dateArray;
        next();
    },
    parseFbDataAreaWidget = function(req, res, next) {
        req.fbRawData.data.forEach(function(item, index) {
            actionValue = 0;
            item.actions.forEach(function(action, index) {
                if (action.action_type === req.fb_data_field_name) {
                    actionValue = action.value;
                    return false;
                }
            })
            req.fbAdData[item.date_start] = actionValue;
        })
        next();
    },
    parseFbDataLineWidget = function(req, res, next) {

        req.fbRawData.data.forEach(function(item, index) {
            item.actions.forEach(function(action, index) {
                if (action.action_type === req.fb_data_field_name) {
                    if (!isNaN(item.spend / action.value)) {
                        actionValue = parseFloat((item.spend / action.value).toFixed(2));
                    }
                    req.fbAdData[item.date_start] = {
                        "spend": item.spend,
                        "action": action.value
                    };
                    return false;
                }
            })
        })

        next();
    },
    parseFbDataGaugeWidget = function(req, res, next) {
        req.fbImpressionData = parseInt(req.fbRawData.data[0].impressions);
        next();
    },
    // Sending request to fb api using the request modules of node, the fb feed url is coming from
    // the frontend as a request parameter.
    loadFbData = function(req, res, next) {
        var actionValue;
        req.fbAdData = {};
        request(req.fb_data_url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                req.fbRawData = body;
                next(); // Send the response of the requested url to the frontend.
            } else {
                res.send({
                    "success": false,
                    "error": error
                });
            }
        })
    },
    parseGoggleDataAreaWidget = function(req, res, next) {
        req.googleRawData.forEach(function(item, index) {
            if (isNaN(item.$.cost / item.$.costEstTotalConv)) {
                req.googleAdData[item.$.day] = 0;
            } else {
                req.googleAdData[item.$.day] = parseInt((item.$.cost / item.$.costEstTotalConv).toFixed(0));
            }
        })
        next();
    },
    parseGoggleDataLineWidget = function(req, res, next) {
        req.googleRawData.forEach(function(item, index) {
            req.googleAdData[item.$.day] = {
                "cost": item.$.cost,
                "costEstTotalConv": item.$.costEstTotalConv
            }
        })
        next();
    },
    parseGoggleDataGaugeWidget = function(req, res, next) {
        req.googleImpressionData = parseInt(req.googleRawData[0].$.impressions);
        next();
    }
loadGoogleAdData = function(req, res, next) {
        req.googleAdData = {};
        request.post({
            headers: req.google_insight_data_config.request,
            url: req.google_insight_data_config.url
        }, function(aderror, adresponse, adbody) {
            if (!aderror && adresponse.statusCode == 200) {
                parseString(adbody, function(err, adresult) {
                    if (!err) {
                        req.googleRawData = adresult.report.table[0].row;
                        next();

                    } else {
                        res.send({
                            "success": false,
                            "error": err
                        });
                    }

                });

            } else {
                res.send({
                    "success": false,
                    "error": aderror
                });
            }
        });
    },
    // Get new access token
    refreshToken = function(req, res, next) {
        request.post({
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            url: req.google_refresh_token_url
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                // Set new access token
                req.google_insight_data_config.request.Authorization = "Bearer " + body.access_token;
                next();
            } else {
                res.send({
                    "success": false,
                    "error": error
                });
            }
        });
    },
    getDates = function(req) {
        var starts = "2015-07-28",
            ends = "";
        if (req.query.starts) {
            starts = req.query.starts;
        }
        if (req.query.ends) {
            ends = req.query.ends;
        } else {
            // Check if current date is lesser than 30th September.
            if (new Date("2015-09-30").getTime() > new Date().getTime()) {
                var yesterday = new Date(),
                    month, date, year;
                // Get the previous date.
                yesterday.setDate(new Date().getDate() - 1);
                date = yesterday.getDate();
                year = yesterday.getFullYear();
                month = yesterday.getMonth() + 1;
                if (month < 10) {
                    month = "0" + month;
                }
                if (date < 10) {
                    date = "0" + date;
                }
                ends += year + "-" + month + "-" + date

            } else {
                //Else just set the end date to 30th Septeber.
                ends += "2015-09-30";
            }
        }
        return {
            "starts": starts,
            "ends": ends
        }
    },
    getFbInsightDataUrl = function(req) {
        var fb_url = fb_insight_url;
        if (req.query.fb_access_token) {
            fb_url += "access_token=" + req.query.fb_access_token;
        } else {
            fb_url += "access_token=" + fb_access_token;
        }
        if (req.query.fb_fields) {
            fb_url += "&fields=" + req.query.fb_fields;
        } else {
            fb_url += "&level=" + fb_fields;
        }
        if (req.query.fb_level) {
            fb_url += "&level=" + req.query.fb_level;
        } else {
            fb_url += "&level=" + fb_level;
        }
        if (!req.query.fullTime) {
            fb_url += "&time_range={'since': '" + req.dates.starts + "', 'until': '";


            fb_url += req.dates.ends + "'}";


            if (req.query.time_increment) {
                fb_url += "&time_increment=" + req.query.fb_time_increment;
            } else {
                fb_url += "&time_increment=" + fb_time_increment;
            }
        }

        return fb_url;
    },
    getGoogleRefreshTokenUrl = function(req) {
        var google_refresh_token_url = google_refreshtoken_url;
        if (req.query.google_client_id) {
            google_refresh_token_url += "client_id=" + req.query.google_client_id;
        } else {
            google_refresh_token_url += "client_id=" + google_client_id;
        }

        if (req.query.google_client_secret) {
            google_refresh_token_url += "&client_secret=" + req.query.google_client_secret;
        } else {
            google_refresh_token_url += "&client_secret=" + google_client_secret;
        }

        if (req.query.google_refresh_token) {
            google_refresh_token_url += "&refresh_token=" + req.query.google_refresh_token;
        } else {
            google_refresh_token_url += "&refresh_token=" + google_refresh_token;
        }
        google_refresh_token_url += "&grant_type=refresh_token";
        return google_refresh_token_url;
    },
    getGoogleAdDataConfig = function(req) {
        var config = {};
        config.reportId = google_report_id;
        if (req.query.google_report_id) {
            config.reportId = req.query.google_report_id;
        }
        config.url = google_ad_data_url;
        config.url += config.reportId;
        config.url += "?__rdxml=" + getGoogleRequestXML(req, config.reportId);
        config.request = {};
        config.request['content-type'] = 'application/x-www-form-urlencoded';
        if (req.query.google_developerToken) {
            config.request.developerToken = req.query.google_developerToken;
        } else {
            config.request.developerToken = google_developerToken;
        }
        if (req.query.goggle_clientCustomerId) {
            config.request.clientCustomerId = req.query.goggle_clientCustomerId;
        } else {
            config.request.clientCustomerId = goggle_clientCustomerId;
        }
        return config;
    };
app.get('/getGeckoboardData/area', function(req, res, next) {
    req.chartData = {
        "chart": {
            "type": "area",
            "renderTo": "container",
            "backgroundColor": 'transparent',
            "marginTop": 70
        },
        "colors": ["#3F50F3", "#EEB200"],
        "plotOptions": {
            "area": {
                "fillOpacity": 1,
                "marker": {
                    "enabled": false
                }
            }
        },
        "title": {
            "text": "Total Coupon Print By Platform",
            "style": {
                "color": "#0E7AAE",
                "fontFamily": 'ClaireHandBold'
            }
        },
        "legend": {
            "layout": 'horizontal',
            "verticalAlign": 'top',
            "y": 30,
            "floating": true,
            "itemStyle": {
                "color": "#0E7AAE",
                "fontFamily": 'ClaireHandRegular'
            }
        },
        "xAxis": {
            "categories": [],
            "labels": {
                "style": {
                    "color": "#0E7AAE",
                    "fontFamily": 'ClaireHandLight'
                }
            }
        },
        "yAxis": {
            "title": {
                "text": null
            },
            "labels": {
                "style": {
                    "color": "#0E7AAE",
                    "fontFamily": 'ClaireHandLight'
                }
            },
            "gridLineWidth": 2,
            "gridLineDashStyle": "ShortDot",
            "gridLineColor": "#969595"
        },
        "credits": {
            "enabled": false
        },

        "series": [{
            "name": "FACEBOOK",
            "data": []
        }, {
            "name": "GOOGLE",
            "data": []
        }]
    };
    req.dates = getDates(req);
    req.fb_data_field_name = "offsite_conversion";
    req.google_fields = ['Date', 'Cost', 'CostPerEstimatedTotalConversion'];
    req.fb_data_url = getFbInsightDataUrl(req);
    req.google_refresh_token_url = getGoogleRefreshTokenUrl(req);
    req.google_insight_data_config = getGoogleAdDataConfig(req);
    if (req.query.fb_data_field_name) {
        fb_data_field_name = req.query.fb_data_field_name;
    }
    next();
    //refreshToken(res, google_refresh_token_url);
}, refreshToken, loadGoogleAdData, parseGoggleDataAreaWidget, loadFbData, parseFbDataAreaWidget, createDateList, mergeAreaWidgetData);
app.get('/getGeckoboardData/line', function(req, res, next) {
    req.chartData = {
        "chart": {
            "type": "line",
            "renderTo": "container",
            "backgroundColor": 'transparent',
            "marginTop": 70
        },
        "colors": ["#3F50A3", "#EEB200", "#0E7AAE"],
        "plotOptions": {
            "line": {
                "fillOpacity": 1,
                "marker": {
                    "enabled": false
                }
            }
        },
        "title": {
            "text": "Cost Per Coupon Print By Platform",
            "style": {
                "color": "#0E7AAE",
                "fontFamily": 'ClaireHandBold'
            }
        },
        "legend": {
            "layout": 'horizontal',
            "verticalAlign": 'top',
            "y": 30,
            "floating": true,
            "itemStyle": {
                "color": "#0E7AAE",
                "fontFamily": 'ClaireHandRegular'
            }
        },
        "xAxis": {
            "categories": [],
            "labels": {
                "style": {
                    "color": "#0E7AAE",
                    "fontFamily": 'ClaireHandLight'
                }
            }
        },
        "yAxis": {
            "title": {
                "text": null
            },
            "labels": {
                "style": {
                    "color": "#0E7AAE",
                    "fontFamily": 'ClaireHandLight'
                },
                formatter: function() {
                    return '$' + this.value;
                }
            },
            min: 0,
            "gridLineWidth": 2,
            "gridLineDashStyle": "ShortDot",
            "gridLineColor": "#969595"
        },
        "credits": {
            "enabled": false
        },

        "series": [{
            "name": "FACEBOOK",
            "data": []
        }, {
            "name": "GOOGLE",
            "data": []
        }, {
            "name": "TOTAL",
            "lineWidth": 4,
            "data": []
        }]
    };
    req.dates = getDates(req);
    req.google_fields = ['Date', 'Cost', 'CostPerEstimatedTotalConversion'];
    req.fb_data_field_name = "offsite_conversion";
    req.fb_data_url = getFbInsightDataUrl(req);
    req.google_refresh_token_url = getGoogleRefreshTokenUrl(req);
    req.google_insight_data_config = getGoogleAdDataConfig(req);
    if (req.query.fb_data_field_name) {
        fb_data_field_name = req.query.fb_data_field_name;
    }
    next();
}, refreshToken, loadGoogleAdData, parseGoggleDataLineWidget, loadFbData, parseFbDataLineWidget, createDateList, mergeLineWidgetData);
app.get('/getGeckoboardData/gauge', function(req, res, next) {
    req.chartData = {
        chart: {
            type: 'gauge'
        },
        title: {
            text: 'PROGRESS TOWARDS IMPRESSION GOAL'
        },
        pane: {
            startAngle: -90,
            endAngle: 90,
            size: '150%',
            center: ['50%', '100%'],
            background: {
                backgroundColor: 'transparent',
                borderColor: 'transparent'
            }
        },
        yAxis: {
            min: 0,
            max: 81000000,
            minorTickWidth: 0,
            minorTickLength: 0,
            tickWidth: 0,

            tickLength: 0,
            title: {
                text: null
            },
            plotBands: [{
                from: 0,
                to: 27000000,
                color: '#EEB200'
            }, {
                from: 27000000,
                to: 54000000,
                color: '#0E7AAE'
            }, {
                from: 54000000,
                to: 81000000,
                color: '#3F50A3'
            }]
        },

        series: [{
            name: 'Impressions',
            data: []
        }],
        credits: {
            enabled: false
        }

    };
    req.dates = getDates(req);
    req.query.fb_fields = "impressions";
    req.google_fields = ['Impressions'];
    req.query.fullTime = true;
    req.fb_data_url = getFbInsightDataUrl(req);
    req.google_refresh_token_url = getGoogleRefreshTokenUrl(req);
    req.google_insight_data_config = getGoogleAdDataConfig(req);
    if (req.query.fb_data_field_name) {
        fb_data_field_name = req.query.fb_data_field_name;
    }
    next();
}, refreshToken, loadGoogleAdData, parseGoggleDataGaugeWidget, loadFbData, parseFbDataGaugeWidget, mergeGaugeWidgetData);
app.listen(process.env.PORT || 3000);
