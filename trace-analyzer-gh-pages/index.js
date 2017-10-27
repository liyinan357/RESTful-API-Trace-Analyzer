const express = require('express');
var request = require('request');
var _ = require('underscore');
var d3 = require('d3');
var extend = require('jquery').extend;
var Chart = require('chart.js');
var jsdom = require('jsdom');
const {JSDOM} = jsdom;//create data model****************************************************************
var $ = require('jquery')(new JSDOM('').window);
const dom = new JSDOM('<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="fuel_consumed_since_restart" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Fuel Consumed</h3>' +
        '<p class="delayed"><span id="fuel-efficiency"></span> MPG Overall</p>' +
        '<p class="delayed"><span id="total-fuel-consumed"></span>' +
          'Gallons == ~$<span id="total-fuel-cost"></span> Total' +
          '(@ $<span id="average-fuel-cost"></span>/gallon)</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="cumulativeFuelEfficiency" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Fuel Efficiency</h3>' +
        '<p>Shaded areas are where brake is pressed</p>' +
        '<p class="current-data"><span id="current_cumulativeFuelEfficiency"></span> MPG Cumulative</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container histogram">' +
        '<canvas id="gear-histogram" width="540" class="graph"></canvas>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Gear Position</h3>' +
        '<p><span id="current_gear_position"></span></p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="vehicle_speed" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Vehicle Speed</h3>' +
        '<p class="current-data"><span id="current_vehicle_speed"></span> Kph</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="engine_speed" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Engine Speed</h3>' +
        '<p class="current-data"><span id="current_engine_speed"></span> RPM</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="torque_at_transmission" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Torque</h3>' +
        '<p class="current-data"><span id="current_torque_at_transmission"></span> Nm</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="accelerator_pedal_position" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Accel. Pedal (%)</h3>' +
        '<p class="current-data"><span id="current_accelerator_pedal_position"></span>%</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container">' +
        '<div id="odometer" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Odometer</h3>' +
        '<p class="current-data"><span id="current_odometer"></span> Km</p>' +
    '</div>' +
'</div>' +
'<div class="row">' +
    '<div class="span7 graph-container histogram">' +
        '<div id="speed_box_plot" class="graph"></div>' +
    '</div>' +
    '<div class="span4 graph-comments">' +
        '<h3>Vehicle speed</h3>' +
    '</div>' +
'</div>');

//set up express app
var app = express();
//*************************************************************************
//self-defined variables
//*************************************************************************
var fuel_values = [];
var dataSourceURL = "";
//*************************************************************************
//*************************************************************************
//trace.js
//*************************************************************************
var traces = {};
var dynamics = {};
var activeTrace;
// I comment this part because we are not uploading a data file from a web browser*********************
// Instead we upload a file through ajax request*******************************************************

/*var finishProgress = function(type) {
    $("#" + type + "-progress progress").hide();
    $("#" + type + "-progress").append("Done.");
    setTimeout(function() {
        $("#" + type + "-progress").hide();
    }, 8);
};

var timestampHoverHandler = {
    on: function(timestamp, trace) {
        $("#current_timestamp").text(timestamp.toFixed(2)).parent().show();
    },
    off: function() {
        $("#current_timestamp").parent().hide();
    }
};

var processTrace = function(selectedTrace, data) {
    var count = 0;
    var lastLoggedProgress = 0;
    var progressElement = $("#analysis-progress progress");
    dynamics = {};
    updateProgress(progressElement, 0);
    _.each(data.split("\n"), function(line, i) {
        if(line) {
            try {
                handleMessage(selectedTrace, JSON.parse(line));
            } catch(e) {
                console.log("Unable to parse " + line + " (" + e + ")");
            }
            count += line.length;
            var progress = count / data.length * 100;
            if(progress >= lastLoggedProgress + 1) {
                updateProgress(progressElement, progress);
                lastLoggedProgress = progress;
            }
        }
    });

    activateTrace(selectedTrace);
    finishProgress("analysis");
};

var activateTrace = function(traceUrl) {
    if(activeTrace) {
        _.each(onTraceUnloadCallbacks, function(callback) {
            callback(activeTrace);
        });
    }

    activeTrace = traces[traceUrl];
    _.each(onTraceLoadCallbacks, function(callback) {
        callback(activeTrace);
    });
};

var loadTrace = function(traceUrl) {
    if(_.has(traces, traceUrl)) {
        activateTrace(traceUrl);
    } else {
        traces[traceUrl] = {url: traceUrl, records: []};
        $.ajax({
            xhr: function() {
                var xhr = window.ActiveXObject ?
                        new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();

                // TODO this is a shim for IE8
                if (xhr.addEventListener) {
                    xhr.addEventListener("progress", function(evt){
                        if(evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            updateProgress($("#download-progress progress"), percentComplete * 100);
                        }
                    }, false);
                }
                return xhr;
            },
            url: traceUrl,
            success: function(data) {
                finishProgress("download");
                setTimeout(function() {
                    processTrace(traceUrl, data);
                }, 8);
            },
            dataType: "text"
        });
    }
};*/

//I rewrite this part handleMessage because after we receive a data file url from********************
//the caller. We need parse the url and then retrieve and process the data store*********************
//the data in a local variable.**********************************************************************
/*var handleMessage = function(traceUrl, message) {
    if(!message) {
        return;
    }

    if(!_.has(traces, traceUrl)) {
        traces[traceUrl] = {url: traceUrl, records: []};
    }

    // TODO this assumes we never get the exact same timestamp 2 messages in a
    // row, which I think is a safe assumption because the precision of the
    // timestamps is very high right now
    dynamics.timestamp = message.timestamp;
    dynamics[message.name] = message.value;

    var records = traces[traceUrl].records;
    var dynamicsCopy = $.extend({}, dynamics);
    if(records.length > 0 && dynamics.timestamp - _.last(records).timestamp  < 1) {
        dynamicsCopy.timestamp = _.last(records).timestamp;
        traces[traceUrl].records[records.length - 1] = dynamicsCopy;
    } else {
        traces[traceUrl].records.push(dynamicsCopy);
    }
};*/

var deg2rad = function(deg) {
    return deg * Math.PI / 180;
};

var gpsDistanceKm = function(first, second) {
    var deltaLat = deg2rad(second.latitude) - deg2rad(first.latitude);
    var deltaLon = deg2rad(second.longitude) - deg2rad(first.longitude);
    var a = Math.pow(Math.sin(deltaLat / 2), 2) +
            Math.cos(deg2rad(first.latitude)) *
            Math.cos(deg2rad(second.latitude)) *
            Math.pow(Math.sin(deltaLon / 2), 2);
    var c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1 - a));
    var distance =  c * MEAN_RADIUS_EARTH_KM;
    return distance;
};

/* If odometer is available, uses that. Otherwise falls back to GPS reading. */
var distanceKm = function(first, second) {
    var odometerAvailable = _.every([first, second], function(record) {
        return record.latitude && record.longitude;
    });
    var distance;
    if(first.odometer && second.odometer) {
        distance = second.odometer - first.odometer;
    } else {
        var gpsAvailable = _.every([first, second], function(record) {
            return record.latitude && record.longitude;
        });

        if(gpsAvailable) {
            distance = gpsDistanceKm(first, second);
        }
    }
    return distance;
};

var kmToMiles = function(km) {
    return km * MILES_PER_KM;
};

var distanceMiles = function(first, second) {
    return kmToMiles(distanceKm(first, second));
};
//*************************************************************************
//fuel.js
//*************************************************************************
var MILES_PER_KM = 0.621371;
var updateGasPrices = function(trace) {
    var gasDistance = 5;
    var apiKey = "rfej9napna";
    var recordWithPosition = _.find(trace.records, function(record) {
        return record.latitude && record.longitude;
    });

// I comment this ajax and move it to my web app side because is asynchronous. I*******************************
// cannot return a value from the callback function. I did some modification on********************************
// web app side.In this function, instead of get gas price by calling another api,*****************************
// I let it return a position records(object contains latitude and longitude)**********************************
    /*$.ajax({
        url: "http://devapi.mygasfeed.com/stations/radius/" +
            recordWithPosition.latitude + "/" + recordWithPosition.longitude +
            "/" + gasDistance + "/reg/price/" + apiKey + ".json",
        dataType: "jsonp",
        success: function(data) {
            console.log(data.stations.length);
            var stations = data.stations;
            if(stations && stations.length > 0) {
                var stationsWithPrice = _.filter(stations, function(station) {
                    return station.reg_price !== "N/A";
                });

                var averagePrice = _.reduce(stationsWithPrice,
                        function(memo, station) {
                            return memo + parseInt(station.reg_price, 10);
                }, 0) / stationsWithPrice.length;

                $("#total-fuel-cost").text((averagePrice *
                    trace.fuelConsumedGallons.toFixed(2)).toFixed(2)).parent().show();
                $("#average-fuel-cost").text(averagePrice.toFixed(2)).parent().show();
            }
        }
    });*/
    return recordWithPosition;
};

var recordsWithFuelConsumed =  function(records) {
    return _.filter(records, function(record) {
        return record.fuel_consumed_since_restart;
    });
};

var fuelConsumedGallons = function(a, b) {
    var fuelConsumedLiters = b.fuel_consumed_since_restart -
            a.fuel_consumed_since_restart;
    return fuelConsumedLiters * 0.264172;
};

var calculateFuelConsumedGallons = function(trace) {
    var fuelRecords = recordsWithFuelConsumed(trace.records);

    return fuelConsumedGallons(_.first(fuelRecords), _.last(fuelRecords));
};

//updateFuelEfficiency function, Intead of assign the value to a node in html code
//I let it return a value so it can response back to callers
var updateFuelEfficiency = function(trace) {
    trace.overallFuelEfficiency = distanceMiles(_.first(trace.records),
        _.last(trace.records)) / trace.fuelConsumedGallons;
    $("#fuel-efficiency").text(trace.overallFuelEfficiency.toFixed(2)).parent().show();
    return trace.overallFuelEfficiency.toFixed(2);
};

//same here with updateFuelSummary, I store the returned values into an array.
var updateFuelSummary = function(trace) {
    trace.fuelConsumedGallons = calculateFuelConsumedGallons(trace);
    fuel_values.push(trace.fuelConsumedGallons.toFixed(2));
    $("#total-fuel-consumed").text(trace.fuelConsumedGallons.toFixed(2)).parent().show();
    //updateGasPrices(trace);
    fuel_values.push(updateFuelEfficiency(trace));
};

//This function I called to draw cumulativeFuelEfficiency graph by appending a bunches*******************
// of HTML code with data. But due to some reason, the data collection part is not successful************
//so We are not able to see the graph. But HTML code has been transfered to the caller*******************
//Although the all data show as zero.
var calculateCumulativeFuelEfficiency = function(trace) {
    var brakeEvents = [];
    var fuelRecords = recordsWithFuelConsumed(trace.records);
    _.each(trace.records, function(record) {
        // this value could be infinity if we are on electric only power
        record.cumulativeFuelEfficiency =
            distanceMiles(_.first(trace.records), record) /
                fuelConsumedGallons(_.first(fuelRecords), record);

        if(record.brake_pedal_status) {
            if(brakeEvents.length === 0 || _.last(brakeEvents).end) {
                brakeEvents.push({start: record, end: undefined});
            }
        } else {
            if(brakeEvents.length > 0 && !_.last(brakeEvents).end) {
                _.last(brakeEvents).end = record;
            }
        }
    });

    if(brakeEvents.length > 0 && !_.last(brakeEvents).end) {
        _.last(brakeEvents).end = _.last(trace.records);
    }

    var key = "cumulativeFuelEfficiency";
    graphs[key] = drawTimeseries(trace, key,
        _.pluck(trace.records, "timestamp"), _.pluck(trace.records, key),
        false, true);

    _.each(brakeEvents, function(brakeEvent) {
        var brakeEventGroup = graphs[key].graph.append("svg:svg")
            .attr("class", "brake-event")
            .attr("opacity", ".2");
        var brakeArea = brakeEventGroup.append("svg:rect")
            .attr("x", graphs[key].x(brakeEvent.start.timestamp))
            .attr("width", graphs[key].x(brakeEvent.end.timestamp) -
                    graphs[key].x(brakeEvent.start.timestamp))
            .attr("y", 0)
            .attr("height", graphs[key].dimensions.height);
    });
};
//*************************************************************************
//timeseries.js
//*************************************************************************
var graphs = {};

var initDimensions = function(elementId) {
    // automatically size to the container using JQuery to get width/height
    width = $(dom.window.document.querySelector("#" + elementId)).width();
    height = $(dom.window.document.querySelector("#" + elementId)).height();

    // make sure to use offset() and not position() as we want it relative to
    // the document, not its parent
    xOffset = $(dom.window.document.querySelector("#" + elementId)).offset().left;
    yOffset = $(dom.window.document.querySelector("#" + elementId)).offset().top;
    return {width: width, height: height, xOffset: xOffset, yOffset: yOffset};
};

var maxFinite = function(collection) {
    var max = collection[0];
    _.each(collection, function(item) {
        max = (isFinite(item) && (!max || item > max)) ? item : max;
    });
    return max;
};
// drawTimseries I had to modify a lot because d3.js this function used is a very**************
// old version , the new version i imported here has a lot of change on syntax*****************
//I think the data didn't show has nothing to do with the syntax change, there must************
//has some other issues************************************************************************
var drawTimeseries = function(trace, elementId, dataX, dataY, showAverage,
        showMax) {
    // create an SVG element inside the element that fills 100% of the div
    var graph = d3.select(dom.window.document.querySelector("#" + elementId)).append("svg:svg").attr("width", "100%")
            .attr("height", "100%");

    hoverContainer = $(dom.window.document.querySelector("#" + elementId + " svg"));

    var dimensions = initDimensions(elementId);

    // X scale will fit values from 0-10 within range of pixels
    var x = d3.scaleLinear().domain([_.min(dataX), _.max(dataX)]).range(
            [0, dimensions.width]);
    // Y scale will fit values from 0-10 within pixels 0-100
    var y = d3.scaleLinear().domain([_.min(dataY), maxFinite(dataY)]).range(
            [dimensions.height, 0]);

    // create a line object that represents the SVG line we're creating
    var line = d3.line()
        .x(function(d,i) {
            return x(d[0]);
        })
        .y(function(d) {
            return y(d[1]);
        })
        .defined(function(d) {
            return isFinite(d[1]);
        });

    var hoverLineGroup = graph.append("svg:svg").attr("class", "hover-line");
    var hoverLine = hoverLineGroup.append("svg:line")
        .attr("x1", 10).attr("x2", 10)
        .attr("y1", 0).attr("y2", dimensions.height);
    hoverLine.classed("hide", true);

    if(showMax) {
        var maxDataPoint = _.max(_.zip(dataX, dataY), function(point) {
            return point[1];
        });
        var maxPosition = x(maxDataPoint[0]);
        var maxLineGroup = graph.append("svg:svg").attr("class", "max-line")
            .attr("opacity", ".5");
        var maxLine = maxLineGroup.append("svg:line")
            .attr("x1", maxPosition).attr("x2", maxPosition)
            .attr("y1", 0).attr("y2", dimensions.height);
    }

    if(showAverage) {
        var average = _.reduce(dataY, function(memo, value) {
                if(!value || value === Infinity) {
                    return memo;
                }
                return memo + value;
            }, 0) / dataY.length;
        var averageLineGroup = graph.append("svg:svg")
            .attr("class", "average-line")
            .attr("opacity", ".5");
        var averageLine = averageLineGroup.append("svg:line")
            .attr("x1", 0).attr("x2", dimensions.width)
            .attr("y1", y(average)).attr("y2", y(average));
        var averageText = averageLineGroup.append("svg:text")
            .attr("x", 5).attr("y", y(average) - 8)
            .attr("text-anchor", "left")
            .attr("class", "annotation")
            .text("avg " + average.toFixed(2));
    }

    // display the line by appending an svg:path element with the data line we created above
    graph.append("svg:path").attr("d", line(_.zip(dataX, dataY)));

    var graphHolder = {elementId: elementId, graph: graph, x: x, y: y,
            hoverLine: hoverLine, dimensions: dimensions, dataX: dataX,
            dataY: dataY};

    $(hoverContainer).mouseleave(function(event) {
        handleMouseOutGraph(event);
    });

    $(hoverContainer).mousemove(function(event) {
        handleMouseOverGraph(event, trace, graphHolder);
    });

    return graphHolder;
};

var timeseriesHoverHandler = {
    on: function(timestamp, trace, mouseX, mouseY) {
        _.each(graphs, function(otherGraph, i) {
            otherGraph.hoverLine.classed("hide", false);

            // set position of hoverLine
            otherGraph.hoverLine.attr("x1", mouseX).attr("x2", mouseX);

            var hoveredValue = findClosestToX(timestamp,
                otherGraph.dataX, otherGraph.dataY)[1];
            if(hoveredValue) {
                $("#current_" + otherGraph.elementId).text(hoveredValue.toFixed(2)).parent().show();
            } else {
                $("#current_" + otherGraph.elementId).parent().hide();
            }
        });
    },
    off: function() {
        _.each(graphs, function(graph, i) {
            graph.hoverLine.classed("hide", true);
            $("#current_" + graph.elementId).parent().hide();
        });
    }
};

var timeseriesHandler = {
    onLoad: function(trace) {
        _.each(["vehicle_speed", "engine_speed", "torque_at_transmission"],
                function(key, i) {
            graphs[key] = drawTimeseries(trace, key,
                _.pluck(trace.records, "timestamp"),
                _.pluck(trace.records, key),
                true, true);
            return;
        });

        _.each(["odometer", "fuel_consumed_since_restart",
                "accelerator_pedal_position"], function(key, i) {
            graphs[key] = drawTimeseries(trace, key,
                _.pluck(trace.records, "timestamp"),
                _.pluck(trace.records, key),
                false, false);
            return;
        });
    },
    onUnload: function(trace) {
        // TODO could make this faster by caching the graphs instead of forcing
        // re-render, but there really isn't much delay in recalculating right
        // now
        d3.selectAll(".graph svg").remove();
    }
};
//*************************************************************************
//histogram.js
//*************************************************************************
var gearHistogramHoverHandler = {
    on: function(timestamp, trace) {
        var gear;
        if(timestamp < trace["gear_timeseries"][0].start) {
            gear = trace["gear_timeseries"][0];
        } else if(timestamp > _.last(trace["gear_timeseries"]).end) {
            gear = _.last(trace["gear_timeseries"]);
        } else {
            gear = _.find(trace["gear_timeseries"], function(gearPeriod) {
                return timestamp >= gearPeriod.start && timestamp <= gearPeriod.end;
            });
        }

        if(gear) {
            $("#current_gear_position").text(gear.gear).parent().show();
        }
    },
    off: function() {
        $("#current_gear_position").parent().hide();
    }
}

//I tried to draw gear-histogram by calling this function, it is not able to fetch*********************
//the node, because I call it through api. So I just let it return the dataset*************************
//that I need to draw histogram, and I send the dataset back to caller*********************************
//and draw the histogram on the caller side and it works***********************************************
var drawGearHistogram = function(trace) {
    //var element = $(dom.window.document.querySelector("#gear-histogram")).get(0);
    //if(!element.getContext) {
      //  console.log("No <canvas> element available, not drawing histogram");
      //  return;
  //  }
    //var context = element.getContext("2d");


    var gearDuration = {first: 0, second: 0, third: 0, fourth: 0, fifth: 0, sixth: 0};
    var gearTimeseries = [];
    var recordsWithGear = _.filter(trace.records, function(record) {
        return !!record.transmission_gear_position
    });

    var lastGearChange = undefined;
    _.each(recordsWithGear, function(record) {
        if(!_.has(gearDuration, record.transmission_gear_position)) {
            gearDuration[record.transmission_gear_position] = 0;
        }

        lastGearChange = lastGearChange || record;

        gearDuration[lastGearChange.transmission_gear_position] += (
                record.timestamp - lastGearChange.timestamp);
        gearTimeseries.push({
                start: lastGearChange.timestamp,
                end: record.timestamp,
                gear: lastGearChange.transmission_gear_position});
        lastGearChange = record;
    });

    trace["gear_timeseries"] = gearTimeseries;
    var totalDuration = _.last(trace.records).timestamp -
            _.first(trace.records).timestamp;
    var data = {
        labels: _.keys(gearDuration),
        datasets : [{data: _.map(gearDuration,
                function(value) {
                    return value / totalDuration * 100;
            })}]
    };
    return data;
  //var chart = new Chart(context,{
    //  type: 'bar',
    //  data: data
      //options: options
    //});//(context).Bar(data, {scaleLabel : "<%=value%>%"});
}
//*************************************************************************

//get json data source url
app.get('/api/sendURL',function(req,res){
  var real_url_arr = decodeURIComponent(req.url).split('url=http');
  dataSourceURL = "http" + real_url_arr[1];
  var temp_arr = dataSourceURL.split('.json&');
  dataSourceURL = temp_arr[0] + '.json';
  console.log(dataSourceURL);
  res.jsonp({"requestStatus":"Received and Processed"});
  res.end();
});


//get data from url
app.get("/api/retrieveAndProcessData",function(req,res){
  request.get({url:dataSourceURL,gzip:true},function(error,response,body){
    if(!error && response.statusCode == 200) {

          _.each(body.split('\n'), function(line, i) {
            if(line) {
                try {
                    //handleMessage(dataSourceURL = traceUrl, JSON.parse(line) = message);
                    if(!JSON.parse(line)) {
                        return;
                    }

                    if(!_.has(traces, dataSourceURL)) {
                        traces[dataSourceURL] = {url: dataSourceURL, records: []};
                    }

                    // TODO this assumes we never get the exact same timestamp 2 messages in a
                    // row, which I think is a safe assumption because the precision of the
                    // timestamps is very high right now
                    dynamics.timestamp = JSON.parse(line).timestamp;
                    dynamics[JSON.parse(line).name] = JSON.parse(line).value;

                    var records = traces[dataSourceURL].records;
                    var dynamicsCopy = $.extend({}, dynamics);
                    if(records.length > 0 && dynamics.timestamp - _.last(records).timestamp  < 1) {
                        dynamicsCopy.timestamp = _.last(records).timestamp;
                        traces[dataSourceURL].records[records.length - 1] = dynamicsCopy;
                    } else {
                        traces[dataSourceURL].records.push(dynamicsCopy);
                    }

                } catch(e) {
                    console.log("Unable to parse " + line + " (" + e + ")");
                }
              }
          });
    }else{
        console.log('error');
    }
  });
  console.log("Data successfully retrieved and processed");
  res.jsonp({"processStatus":"Data successfully retrieved and processed"});
  res.end();
});

app.get('/api/getPosition',function(req,res){
    var recordWithPosition = updateGasPrices(traces[dataSourceURL]);
    updateFuelSummary(traces[dataSourceURL]);
    res.jsonp({"recordWithPosition":recordWithPosition,"totalFuelConsumed":fuel_values[0],"OverallMPG":fuel_values[1]});
    res.end();
});

app.get('/api/getResults', function(req,res){
  timeseriesHandler.onLoad(traces[dataSourceURL]);
  //updateFuelSummary(traces[dataSourceURL]);
  //console.log(traces[dataSourceURL].records);
  console.log("successful: " + fuel_values[0] + " " + fuel_values[1]);
  calculateCumulativeFuelEfficiency(traces[dataSourceURL]);
  console.log(dom.serialize());
  var data = drawGearHistogram(traces[dataSourceURL]);
  res.jsonp({"dom":dom.serialize(),"barChartData":data});
  res.end();
});


app.listen(process.env.port || 4000, function() {
  console.log('now listening');
});
