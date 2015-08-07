var express = require("express"),
app = express(),
cors = require('cors'),
request = require('request');
app.use(cors());



app.get('/getFbFeed', function(req, res) {
    var url = "https://graph.facebook.com/v2.4/act_790155804435790/insights?access_token=",
    access_token = "CAAGXaYM1QFcBAEvXMTcZBVP0rNIPsdiBoXzGj6X3o0yZCwz0ZAEUCSpL0WT7BsC4qrPunZCIN8cqpPyWwj9dRdfNKzBC4N4LH5GdVBWTZAuTVHvMxslvRsDYiStZBWZAsVVO9gMZB0yTCILufkyQsRxXRoK5ySdSaH17UYEuw5fSgIVNoftW179p5933U1uXhMA4CjgnhY7k9Do7TQAZBJw5h",
    level = "account",
    time_increment = 1,
    starts = "2015-07-28",
    chartData =  {
        "chart": {
            "type": "area",
            "renderTo": "container",
             "marginTop": 70
        },
        "colors" : ["#EEB200"],
        "title": {
            "text": "Total Coupon Print By Platform",
             "style": {
                "color": "#0E7AAE"
            }
        },
         "legend": {
            "layout": 'vertical',
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
        }]
    };
    if(req.query.access_token){
        url += req.query.access_token;  
    }else{
        url += access_token;   
    }
  
    if(req.query.level){
        url += "&level="+req.query.level;
    }else{
        url += "&level="+level ;
    }
    if(req.query.starts){
        url += "&time_range={'since': '"+req.query.starts +"', 'until': '";

    }else{
        url += "&time_range={'since': '"+starts +"', 'until': '" ;
    }
    if(req.query.ends){
        url +=  req.query.ends + "'}";
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
            url +=   year+"-"+month+"-"+date+"'}"
           
        }else{
            url +=   "2015-09-30'}";  
        }
    }
    if(req.query.time_increment){
        url += "&time_increment="+req.query.time_increment;
    }else{
        url += "&time_increment="+time_increment ;
    }
    // Sending request to fb api using the request modules of node, the fb feed url is coming from
    // the frontend as a request parameter.
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            body.data.forEach(function(item,index){
                var actionDate = new Date(item.date_start)
                chartData.series[0].data.push(item.total_actions);
                chartData.xAxis.categories.push((actionDate.getMonth()+1)+"/"+actionDate.getDate());
            })
            res.send(chartData); // Send the response of the requested url to the frontend.
        }
    })
})
app.listen(process.env.PORT || 3000);



