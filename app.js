var express = require("express"),
app = express(),
cors = require('cors'),
parseString = require('xml2js').parseString,
request = require('request');
app.use(cors());



app.get('/getFbFeed', function(req, res) {
    var fb_url = "https://graph.facebook.com/v2.4/act_790155804435790/insights?access_token=",
    fb_access_token = "CAAGXaYM1QFcBAEvXMTcZBVP0rNIPsdiBoXzGj6X3o0yZCwz0ZAEUCSpL0WT7BsC4qrPunZCIN8cqpPyWwj9dRdfNKzBC4N4LH5GdVBWTZAuTVHvMxslvRsDYiStZBWZAsVVO9gMZB0yTCILufkyQsRxXRoK5ySdSaH17UYEuw5fSgIVNoftW179p5933U1uXhMA4CjgnhY7k9Do7TQAZBJw5h",
    fb_level = "account",
    fb_time_increment = 1,
    starts = "2015-07-28",
    ends = "",
    google_refresh_token_url = "https://www.googleapis.com/oauth2/v3/token?client_id=",
    google_refresh_token = "1/P0Bo3fVSm6cMrDRKhjrvbFSkPfc9uLSgPV3pMy4QnQs",
    google_client_secret = "CrGoa9ioJ6KSuJ4hBWue4AIP",
    google_client_id = "740523075147-469v25nd2o33jubidb24psm898a87lh6.apps.googleusercontent.com",
    google_ad_data_url = "https://adwords.google.com/api/adwords/reportdownload/",
    google_report_id = "v201506",
    google_developerToken = 'O87ht9IYUOpNLt1PWvQt-w',
    goggle_clientCustomerId = '619-401-0053',
    google_access_token = "",
    refreshToken, loadGoogleAdData, loadFbData,mergeData, googleAdData = {}, fbAdData ={},graphData = {
        "fb" :[],
        "google":[]
    },dateArray = [],
    getGoogleRequestXML = function(){
        var xml_string = ['<reportDefinition xmlns="https://adwords.google.com/api/adwords/cm/',
        google_report_id,
        '">',
        '<selector>',
        '<fields>Date</fields>',
        '<fields>ConvertedClicks</fields>',
        '<dateRange>',
        '<min>',
        starts.replace(/-/g, ''),
        '</min>',
        '<max>',
        ends.replace(/-/g, ''),
        '</max>',
        '</dateRange>',
        '</selector>',
        '<reportName>Custom Account Performance Report</reportName>',
        '<reportType>ACCOUNT_PERFORMANCE_REPORT</reportType>',
        '<dateRangeType>CUSTOM_DATE</dateRangeType>',
        '<downloadFormat>XML</downloadFormat>',
        '</reportDefinition>'].join("");
        return xml_string;
    },
    chartData =  {
        "chart": {
            "type": "area",
            "renderTo": "container",
            "marginTop": 70
        },
        "colors": ["#3F50F3","#EEB200"],
        "plotOptions" : {
            "area" : {
                "fillOpacity" : 1
            }
        },
        "title": {
            "text": "Total Coupon Print By Platform",
            "style": {
                "color": "#0E7AAE"
            }
        },
        "legend": {
            "layout": 'horizontal',
            "verticalAlign": 'top',
            "y": 30,
            "floating": true,
            "itemStyle": {
                "color": "#0E7AAE"
            }
        },
        "xAxis": {
            "categories": [],
            "labels": {
                "style": {
                    "color": "#0E7AAE"
                }
            }
        },
        "yAxis": {
            "title": {
                "text": null
            },
            "labels": {
                "style": {
                    "color": "#0E7AAE"
                }
            }
        },
        "credits": {
            "enabled": false
        },

        "series": [{
            "name": "FACEBOOK",
            "data": []
        },{
            "name": "GOOGLE",
            "data": []
        }]
    };
    if(req.query.starts){
        starts = req.query.starts;

    }
    if(req.query.ends){
        ends =  req.query.ends;
    }else{
        if(new Date("2015-09-30").getTime() > new Date().getTime()){
            var yesterday = new Date(), month,date,year;
            yesterday.setDate(new Date().getDate() -1);
            date = yesterday.getDate();
            year = yesterday.getFullYear();
            month = yesterday.getMonth()+1;
            if(month <10){
                month = "0"+month;
            }
            if(date <10){
                date = "0"+date;
            }
            ends +=   year+"-"+month+"-"+date
           
        }else{
            ends +=   "2015-09-30";  
        }
    }
    
    if(req.query.fb_access_token){
        fb_url += req.query.fb_access_token;  
    }else{
        fb_url += fb_access_token;   
    }
  
    if(req.query.fb_level){
        fb_url += "&level="+req.query.fb_level;
    }else{
        fb_url += "&level="+fb_level ;
    }
  
    fb_url += "&time_range={'since': '"+starts +"', 'until': '" ;
    
    
    fb_url +=  ends + "'}";
   
  
    if(req.query.time_increment){
        fb_url += "&time_increment="+req.query.fb_time_increment;
    }else{
        fb_url += "&time_increment="+fb_time_increment ;
    }
    
    if(req.query.google_client_id){
        google_refresh_token_url += req.query.google_client_id;
    }else{
        google_refresh_token_url += google_client_id;
    }
    
    if(req.query.google_client_secret){
        google_refresh_token_url += "&client_secret="+ req.query.google_client_secret;
    }else{
        google_refresh_token_url += "&client_secret="+ google_client_secret;
    }
    
    if(req.query.google_refresh_token){
        google_refresh_token_url += "&refresh_token="+ req.query.google_refresh_token;
    }else{
        google_refresh_token_url += "&refresh_token="+ google_refresh_token;
    }
    google_refresh_token_url += "&grant_type=refresh_token";
    
    
    if(req.query.google_report_id){
        google_report_id = req.query.google_report_id;
    }
    google_ad_data_url += google_report_id;
    google_ad_data_url +="?__rdxml="+getGoogleRequestXML();
    if(req.query.google_developerToken){
        google_developerToken = req.query.google_developerToken;
    }
    if(req.query.goggle_clientCustomerId){
        goggle_clientCustomerId = req.query.goggle_clientCustomerId;
    }
    mergeData = function(){
        var date = new Date(starts),day,month;
        while(new Date(date).getTime() <= new Date(ends).getTime()) {
            day = date.getDate();
            if(day < 10){
                day= "0"+day;
            }
            month = date.getMonth()+1;
            if(month < 10){
                month= "0"+month;
            }
            dateArray.push(date.getFullYear()+"-"+month+"-"+day);
            date = new Date(date.setDate(
                date.getDate() + 1
                ))
        } 
        dateArray.forEach(function(item,index){
            var actionDate = new Date(item);
            if(fbAdData[item]){
                graphData.fb.push(fbAdData[item]);
            }else{
                graphData.fb.push(0); 
            }
            if(googleAdData[item]){
                graphData.google.push(googleAdData[item]);
            }else{
                graphData.google.push(0); 
            }
            chartData.xAxis.categories.push((actionDate.getMonth()+1)+"/"+actionDate.getDate());
        });
        chartData.series[0].data = graphData.fb;
        chartData.series[1].data = graphData.google;
        res.send(chartData);
    }
    // Sending request to fb api using the request modules of node, the fb feed url is coming from
    // the frontend as a request parameter.
    loadFbData = function(){
        request(fb_url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                body.data.forEach(function(item,index){
                    fbAdData[item.date_start] = item.total_actions;
                })
                mergeData(); // Send the response of the requested url to the frontend.
            }
        })
    }
    loadGoogleAdData =function(){
        request.post({
            headers: {
                'content-type' : 'application/x-www-form-urlencoded',
                'accepts' : 'application/XML',
                'Authorization' : "Bearer "+google_access_token,
                "developerToken" : google_developerToken,
                "clientCustomerId" : goggle_clientCustomerId 
            },
            url: google_ad_data_url
        }, function(aderror, adresponse, adbody){
            if (!aderror && adresponse.statusCode == 200) {
                parseString(adbody, function (err, adresult) {
                    if(!err){
                        adresult.report.table[0].row.forEach(function(item,index){
                            if(isNaN(parseInt(item.$.convertedClicks))){
                                googleAdData[item.$.day] = 0; 
                            }else{
                                googleAdData[item.$.day] = parseInt(item.$.convertedClicks);
                            }
                        })
                        loadFbData();
                        
                    }else{
                        res.send({
                            "success" : false,
                            "error" : err
                        });  
                    }
                        
                });
                    
            }else{
                res.send({
                    "success" : false,
                    "error" : aderror
                });   
            }
        });
    }
    refreshToken = function(){
        request.post({
            headers: {
                'content-type' : 'application/x-www-form-urlencoded'
            },
            url: google_refresh_token_url
        }, function(error, response, body){
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                google_access_token = body.access_token;
                loadGoogleAdData();
            }else{
                res.send({
                    "success" : false,
                    "error" : error
                });   
            }
        });
    }
    refreshToken();
  


})
app.listen(process.env.PORT || 3000);



