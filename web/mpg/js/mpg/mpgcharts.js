/**
 * Created by nick on 11/26/13.
 */
define(["dc","d3", "d3v2", "jquery","crossfilter","colorbrewer","d3Tooltip", "jsonFusionQuery", "nv", "mpgsite"], function($, d3v2){
        var mpgcharts = {};
        mpgcharts.formattedData = {};
        //# dc.js Getting Started and How-To Guide
        'use strict';
        /* jshint globalstrict: true */
        /* global dc,d3,crossfilter,colorbrewer */
        var profileGroup = "profileGroup";
        // ### Create Chart Objects
        // Create chart objects assocated with the container elements identified by the css selector.
        // Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or filtered by other page controls.
        //var gainOrLossChart = dc.pieChart("#gain-loss-chart");
        var statsChart = dc.barChart("#stats-chart",profileGroup);
        var mpgBullet = nv.models.bulletChart();
        var moneyBullet = nv.models.bulletChart();
        //var quarterChart = dc.pieChart("#quarter-chart");
        var vehicleChart = dc.rowChart("#vehicle-chart",profileGroup);
        var moveChart = dc.lineChart("#detailed-line-chart",profileGroup);
        var volumeChart = dc.barChart("#detailed-stats-chart",profileGroup);
        var yearlyBubbleChart = dc.bubbleChart("#yearly-bubble-chart",profileGroup);
        var seriesChart = nv.models.lineWithFocusChart().useInteractiveGuideline(true);
        mpgcharts.seriesDatum = [];
        var currentIndex = 0;
        // ### Anchor Div for Charts
        /*
        // A div anchor that can be identified by id
            <div id="your-chart"></div>
        // Title or anything you want to add above the chart
            <div id="chart"><span>Days by Gain or Loss</span></div>
        // ##### .turnOnControls()
        // If a link with css class "reset" is present then the chart
        // will automatically turn it on/off based on whether there is filter
        // set on this chart (slice selection for pie chart and brush
        // selection for bar chart). Enable this with `chart.turnOnControls(true)`
             <div id="chart">
               <a class="reset" href="javascript:myChart.filterAll();dc.redrawAll();" style="display: none;">reset</a>
             </div>
        // dc.js will also automatically inject applied current filter value into
        // any html element with css class set to "filter"
            <div id="chart">
                <span class="reset" style="display: none;">Current filter: <span class="filter"></span></span>
            </div>
        */

        //### Load your data
        //Data can be loaded through regular means with your
        //favorite javascript library
        //
        //```javascript
        //d3.csv("data.csv", function(data) {...};
        //d3.json("data.json", function(data) {...};
        //jQuery.getJson("data.json", function(data){...});
        //```
        d3.csv("../mpg/IntegratedMPG.csv", function (data) {
            /* since its a csv file we need to format the data a bit */
            var dateFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ");
            var shortDate = d3.time.format("%Y-%m-%d")
            var numberFormat = d3.format(".2f");


            data.forEach(function (d) {
                d.dd = dateFormat.parse(new Date(Date.parse(d["GPS Time"])).toISOString()); //dateFormat.parse(d["GPS Time"]);
                d.month = d3.time.month(d.dd); // pre-calculate month for better performance
                d.instantMPG = +d["Miles Per Gallon(Instant)(mpg)"]; // coerce to number
                d.open = +d["GPS Speed (Meters/second)"];
                d.lat = +d["Latitude"];
                d.long = +d["Longitude"];
                d.driveID = String(d["DriveID"]);
                d.driver = d["Driver"]
                d.altitude = +d["Altitude"];

            });

            //### Create Crossfilter Dimensions and Groups
            //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
            var ndx = crossfilter(data);
            var all = ndx.groupAll();

            // dimension by year
            var yearlyDimension = ndx.dimension(function (d) {
                //return d3.time.day(d.dd).getDay();
                return d.driveID;
            });

            var secondDimension = ndx.dimension(function (d){
               return +d.dd;
            });


            // Functions to handle cross-array calculations in yearlyPerformanceGroup
            function storeLatLng(alat, along){
                mpgcharts.lastLat = alat;
                mpgcharts.lastLong = along;
            }
            function getLat(){
                return mpgcharts.lastLat;
            }
            function getLng(){
                return mpgcharts.lastLong;
            }

            // p = group.value[currentIndex] where value is an array of value objects containing calculated vales
            // v = inputdata[currentIndex] where each array index is a "row" in the data
            // maintain running tallies by year as filters are applied or removed
            var yearlyPerformanceGroup = yearlyDimension.group().reduce(
                /* callback for when data is added to the current filter results */
                function (p, v) {
                    ++p.count;
                    p.altitude = Number(v['Altitude']);
                    p.driveID = String(v.driveID);
                    p.driver = v.driver;
                    p.altarray.push(Number(v['Altitude']));
                    p.altavg = average(p.altarray);
                    p.thisLat = v.lat;
                    p.thisLong = v.long;
                    p.dd = v.dd;
                    if(p.count == 1){
                        p.lastLat = 0.0;
                        p.lastLong = 0.0;
                        p.changeDist = 0.0;
                    }else{
                        p.lastLat = getLat();
                        p.lastLong = getLng();
                        p.changeDist += (getDistanceFromLatLonInKm(p.lastLat,p.lastLong,p.thisLat,p.thisLong) * 0.62);
                    }
                    storeLatLng(p.thisLat, p.thisLong);
                    p.avgMPG = v['Miles Per Gallon(Instant)(mpg)'] / p.count;
                    return p;
                },
                /* callback for when data is removed from the current filter results */
                function (p, v) {
                    --p.count;
                    p.driveID = String(v.driveID);
                    p.altitude = Number(v['Altitude']);
                    var index = p.altarray.indexOf(p.altitude);
                    p.altarray.splice(index,1);
                    p.altavg = average(p.altarray);
                    p.dd = v.dd;
                    p.driver = v.driver;
                    p.thisLat = v.lat;
                    p.thisLong = v.long;
                    if(p.count == 1){
                        p.lastLat = 0.0;
                        p.lastLong = 0.0;
                        p.changeDist = 0.0;
                    }else{
                        p.lastLat = getLat();
                        p.lastLong = getLng();
                        p.changeDist -= (getDistanceFromLatLonInKm(p.lastLat,p.lastLong,p.thisLat,p.thisLong) * 0.62);
                    }
                    storeLatLng(p.thisLat, p.thisLong);
                    p.avgMPG = v['Miles Per Gallon(Instant)(mpg)'] / p.count;
                    return p;
                },
                /* initialize p */
                function () {
                    storeLatLng(0.0, 0.0);
                    return {count: 0, avgMPG: 0, changeDist: 0.0, altarray:[], altitude:0.0};
                }
            );

            // dimension by full date
            var dateDimension = ndx.dimension(function (d) {
                return d.dd;
            });

            // dimension by month
            var moveMonths = ndx.dimension(function (d) {
                return d.month;
            });
            // group by total movement within month
            var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
                return Math.abs(d.instantMPG - d.open);
            });

            var driveIDs = ndx.dimension(function(d){
                return d.driveID;
            })

            var driveIDGroup = driveIDs.group().reduceSum(function(d){return d.total;});
            var topTypes = driveIDGroup.top(5);

            // group by total volume within move, and scale down result
            var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
                return d.volume / 500000;
            });
            var indexAvgByMonthGroup = moveMonths.group().reduce(
                function (p, v) {
                    ++p.days;
                    p.total += (v.open + v.instantMPG) / 2;
                    p.avg = Math.round(p.total / p.days);
                    return p;
                },
                function (p, v) {
                    --p.days;
                    p.total -= (v.open + v.instantMPG) / 2;
                    p.avg = p.days ? Math.round(p.total / p.days) : 0;
                    return p;
                },
                function () {
                    return {days: 0, total: 0, avg: 0};
                }
            );

/*            // create categorical dimension
            var gainOrLoss = ndx.dimension(function (d) {
                return d.open > d.close ? "Loss" : "Gain";
            });
            // produce counts records in the dimension
            var gainOrLossGroup = gainOrLoss.group();*/

            // determine a histogram of percent changes
            var fluctuation = ndx.dimension(function (d) {
                return Math.round((d.instantMPG - d.open) / d.open * 100);
            });
            var fluctuationGroup = fluctuation.group();

/*            // summerize volume by quarter
            var quarter = ndx.dimension(function (d) {
                var month = d.dd.getMonth();
                if (month <= 2)
                    return "Q1";
                else if (month > 3 && month <= 5)
                    return "Q2";
                else if (month > 5 && month <= 8)
                    return "Q3";
                else
                    return "Q4";
            });
            var quarterGroup = quarter.group().reduceSum(function (d) {
                return d.volume;
            });*/

            // counts per weekday
            var dayOfWeek = ndx.dimension(function (d) {
                var day = d.dd.getDay();
                var name=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                return day+"."+name[day];
             });
            var dayOfWeekGroup = dayOfWeek.group();

            // Group by vehicle
            var vehicles = ndx.dimension(function(d){
               var vehicle = d.Vehicle;
               return vehicle + "." + String(d.Vehicle);
            });
            var vehicleGroup = vehicles.group().reduceCount();

            // Group by driver
            var drivers = ndx.dimension(function(d){
                var driver = d.Driver;
                return driver + "." + String(d.Driver);

            });
            var driversGroup = drivers.group();

            //### Define Chart Attributes
            //Define chart attributes using fluent methods. See the [dc API Reference](https://github.com/NickQiZhu/dc.js/blob/master/web/docs/api-1.7.0.md) for more information
            //

            //#### Bubble Chart
            //Create a bubble chart and use the given css selector as anchor. You can also specify
            //an optional chart group for this chart to be scoped within. When a chart belongs
            //to a specific group then any interaction with such chart will only trigger redraw
            //on other charts within the same chart group.
            /* dc.bubbleChart("#yearly-bubble-chart", "chartGroup") */
            var dateScale = d3.time.scale().domain([d3.min(data, function(d){return new Date(+d.dd);}),  d3.max(data, function(d){return new Date(+d.dd);})]);
            var test;

            yearlyBubbleChart
                .width(450) // (optional) define chart width, :default = 200
                .height(316)  // (optional) define chart height, :default = 200
                .transitionDuration(1500) // (optional) define chart transition duration, :default = 750
                .margins({top: 10, right: 80, bottom: 50, left: 40})
                .dimension(yearlyDimension)
                //Bubble chart expect the groups are reduced to multiple values which would then be used
                //to generate x, y, and radius for each key (bubble) in the group
                .group(yearlyPerformanceGroup)
                .colors(colorbrewer.RdYlGn[9]) // (optional) define color function or array for bubbles
                .colorDomain([50, 0]) //(optional) define color domain to match your data domain if you want to bind data or color
                //##### Accessors
                //Accessor functions are applied to each value returned by the grouping
                //
                //* `.colorAccessor` The returned value will be mapped to an internal scale to determine a fill color
                //* `.keyAccessor` Identifies the `X` value that will be applied against the `.x()` to identify pixel location
                //* `.valueAccessor` Identifies the `Y` value that will be applied agains the `.y()` to identify pixel location
                //* `.radiusValueAccessor` Identifies the value that will be applied agains the `.r()` determine radius size, by default this maps linearly to [0,100]
                .colorAccessor(function (d) {
                    return d.value.altavg.deviation;
                })
                .keyAccessor(function (d) {
                    return d.value.dd;
                })
                .valueAccessor(function (p) {
                    return p.value.avgMPG;
                })
                .radiusValueAccessor(function (p) {
                    return p.value.lastLat;
                })
                .maxBubbleRelativeSize(0.02)
                .x(dateScale)
                //##### Elastic Scaling
                //`.elasticX` and `.elasticX` determine whether the chart should rescale each axis to fit data.
                //The `.yAxisPadding` and `.xAxisPadding` add padding to data above and below their max values in the same unit domains as the Accessors.
                .elasticY(true)
                .elasticX(true)
                .yAxisPadding(.1)
                .xAxisPadding(2)
                .renderHorizontalGridLines(true) // (optional) render horizontal grid lines, :default=false
                .renderVerticalGridLines(true) // (optional) render vertical grid lines, :default=false
                .xAxisLabel('Time') // (optional) render an axis label below the x axis
                .yAxisLabel('MPG') // (optional) render a vertical axis lable left of the y axis
                //#### Labels and  Titles
                //Labels are displaed on the chart for each bubble. Titles displayed on mouseover.
                .renderLabel(false); // (optional) whether chart should render labels, :default = true
                //.label(function (d) {
                //    return String(shortDate(d.value.dd));
                //});
                //.renderTitle(true); // (optional) whether chart should render titles, :default = false
/*                .title(function (p) {
                    return [p.key,
                           "Date: " + shortDate(p.value.dd),
                           "MPG: " + numberFormat(p.value.avgMPG),
                           "Distance: " + numberFormat(p.value.changeDist) + "miles"]
                           .join("\n");
                });*/

                //#### Customize Axis
                yearlyBubbleChart.xAxis()
                    .ticks(d3.time.days,1)
                    .tickFormat(d3.time.format('%a %d'))
                    .tickSize(.5)
                    .tickPadding(1);

                //Set a custom tick format. Note `.yAxis()` returns an axis object, so any additional method chaining applies to the axis, not the chart.
                yearlyBubbleChart.yAxis().tickFormat(function (v) {
                    return v + "%";
                });
                yearlyBubbleChart.renderlet(function(yearlyBubbleChart){
                    // mix of dc API and d3 manipulation
                    // Selects each bubble and adds a bootstrap popover with the data associated with it
                    yearlyBubbleChart.selectAll("circle").tooltip(function(d, i){
                        var titleString =  [d.key, "Date: " + String(d.value.dd), "MPG: " + String(d.value.avgMPG), "Distance: " + String(d.value.changeDist) + "miles"].join("\n");
                        var r, svg, g;
                        svg = d3.select(document.createElement("svg")).attr("height", 40).attr("width", 75);
                        g = svg.append("g");
                        //g.append("rect").attr("width", d.value.changeDist * 5).attr("height", 10);
                        g.append("text").text("Drive Distance: " + String(d.value.changeDist)).attr("dy", "25");
                        g.append("text").text("Alt. Deviation :" + String(d.value.altavg.deviation)).attr("dy","50");
                        return {
                            type: "popover",
                            title: "Summary",
                            detection: "shape",
                            content: svg,
                            gravity: "right",
                            placement: "mouse",
                            // Base positioning. Not used when placement is "mouse"
                            position: [d.x,d.y],
                            //How far the tooltip is shifted from the base
                            displacement: [10,-97], //Shifting parts of the graph over.
                            //If "mouse"" is the base poistion, then mousemove true allows
                            //the tooltip to move with the mouse
                            mousemove: false
                        };
                });
            });
            // #### Pie/Donut Chart
            // Create a pie chart and use the given css selector as anchor. You can also specify
            // an optional chart group for this chart to be scoped within. When a chart belongs
            // to a specific group then any interaction with such chart will only trigger redraw
            // on other charts within the same chart group.

/*            gainOrLossChart
                .width(180) // (optional) define chart width, :default = 200
                .height(180) // (optional) define chart height, :default = 200
                .radius(80) // define pie radius
                .dimension(gainOrLoss) // set dimension
                .group(gainOrLossGroup) // set group
                *//* (optional) by default pie chart will use group.key as it's label
                 * but you can overwrite it with a closure *//*
                .label(function (d) {
                    if (gainOrLossChart.hasFilter() && !gainOrLossChart.hasFilter(d.key))
                        return d.key + "(0%)";
                    return d.key + "(" + Math.floor(d.value / all.value() * 100) + "%)";
                })
                // (optional) whether chart should render labels, :default = true
                .renderLabel(true)
                // (optional) if inner radius is used then a donut chart will be generated instead of pie chart
                .innerRadius(40)
                // (optional) define chart transition duration, :default = 350
                .transitionDuration(500)
                // (optional) define color array for slices
                .colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
                // (optional) define color domain to match your data domain if you want to bind data or color
                .colorDomain([-1750, 1644])
                // (optional) define color value accessor
                .colorAccessor(function(d, i){return d.value;})
                ;/*

/*            quarterChart.width(180)
                .height(180)
                .radius(80)
                .innerRadius(30)
                .dimension(quarter)
                .group(quarterGroup);*/

            //#### Row Chart
            vehicleChart.width(180)
                .height(300)
                .margins({top: 0, left: 10, right: 40, bottom: 80})
                .group(vehicleGroup)
                .dimension(vehicles)
                // assign colors to each value in the x scale domain
                .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
                .label(function (d) {
                    return d.key.split(".")[1];
                })
                // title sets the row text
                .title(function (d) {
                    return d.count;
                })
                .elasticX(true)
                .xAxis().ticks(4);

            //#### Bar Chart
            // Create a bar chart and use the given css selector as anchor. You can also specify
            // an optional chart group for this chart to be scoped within. When a chart belongs
            // to a specific group then any interaction with such chart will only trigger redraw
            // on other charts within the same chart group.
            /* dc.barChart("#volume-month-chart") */
            statsChart.width(420)
                .height(300)
                .transitionDuration(1500)
                .margins({top: 10, right: 50, bottom: 30, left: 40})
                .dimension(fluctuation)
                .group(fluctuationGroup)
                .elasticY(true)
                // (optional) whether bar should be center to its x value. Not needed for ordinal chart, :default=false
                .centerBar(true)
                // (optional) set gap between bars manually in px, :default=2
                .gap(1)
                // (optional) set filter brush rounding
                .round(dc.round.floor)
                .x(d3.scale.linear().domain([-25, 25]))
                .renderHorizontalGridLines(true)
                // customize the filter displayed in the control span
                .filterPrinter(function (filters) {
                    var filter = filters[0], s = "";
                    s += numberFormat(filter[0]) + "% -> " + numberFormat(filter[1]) + "%";
                    return s;
                });

            // Customize axis
            statsChart.xAxis().tickFormat(
                function (v) { return v + "%"; });
            statsChart.yAxis().ticks(5);

            //#### Stacked Area Chart
            //Specify an area chart, by using a line chart with `.renderArea(true)`
            moveChart
                .renderArea(false)
                .width(900)
                .height(225)
                .transitionDuration(1000)
                .margins({top: 0, right: 50, bottom: 40, left: 40})
                .dimension(yearlyDimension)
                .mouseZoomable(true)
                // Specify a range chart to link the brush extent of the range with the zoom focue of the current chart.
                .rangeChart(volumeChart)
                .x(d3.time.scale().domain([d3.min(data, function(d){return d.dd;}), d3.max(data, function(d){return d.dd;})]))
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(550).y(20).itemHeight(13).gap(5))
                .brushOn(false)
                // Add the base layer of the stack with group. The second parameter specifies a series name for use in the legend
                // The `.valueAccessor` will be used for the base layer
                .group(yearlyPerformanceGroup, "Monthly Index Average")
                .valueAccessor(function (d) {
                    return d.value.altavg.mean;
                })
                // stack additional layers with `.stack`. The first paramenter is a new group.
                // The second parameter is the series name. The third is a value accessor.
                .stack(yearlyPerformanceGroup, "Monthly Index Move", function (d) {
                    return d.value.changeDist;
                })
                // title can be called by any stack layer.
                .title(function (d) {
                    var value = d.value.altavg.mean ? d.value.altavg.deviation : d.value.altavg.variance;
                    if (isNaN(value)) value = 0;
                    return dateFormat(d.value.dd) + "\n" + numberFormat(value);
                });

            volumeChart.width(900)
                .height(110)
                .margins({top: 20, right: 50, bottom: 80, left: 40})
                .dimension(yearlyDimension)
                .group(yearlyPerformanceGroup)
                .centerBar(true)
                .gap(1)
                .x(d3.time.scale().domain([d3.min(data, function(d){return d.dd;}), d3.max(data, function(d){return d.dd;})] ));
                //.round(d3.time.month.round)
                //.xUnits(d3.time.months);
/*                volumeChart.renderlet(function(volumeChart){
                    // mix of dc API and d3 manipulation
                    // Selects each bubble and adds a bootstrap popover with the data associated with it
                    volumeChart.selectAll("#detailed-stats-chart.svg.g.g.axis.x.path").tooltip(function(d, i){
                        var r, svg, g;
                        svg = d3.select(document.createElement("svg")).attr("height", 40).attr("width", 75);
                        g = svg.append("g");
                        g.append("text").text("select a time range to zoom in");
                        return {
                            type: "tooltip",
                            //title: "Summary",
                            detection: "shape",
                            content: svg,
                            gravity: "right",
                            placement: "mouse",
                            // Base positioning. Not used when placement is "mouse"
                            //position: [d.x,d.y],
                            //How far the tooltip is shifted from the base
                            displacement: [10,-50], //Shifting parts of the graph over.
                            //If "mouse"" is the base poistion, then mousemove true allows
                            //the tooltip to move with the mouse
                            mousemove: false
                        };
                    });
                });*/

            /*
            //#### Data Count
            // Create a data count widget and use the given css selector as anchor. You can also specify
            // an optional chart group for this chart to be scoped within. When a chart belongs
            // to a specific group then any interaction with such chart will only trigger redraw
            // on other charts within the same chart group.
            <div id="data-count">
                <span class="filter-count"></span> selected out of <span class="total-count"></span> records
            </div>
            */
            dc.dataCount(".dc-data-count")
                .dimension(ndx)
                .group(all);

            var width = 400,
                height = 70,
                margin = {top: 5, right: 10, bottom: 12, left: 50},
                margin2 = {top: 5, right: 10, bottom: 12, left: 100};


            mpgBullet.width(width - margin.right - margin.left)
                .height(height - margin.top - margin.bottom)
                .margin(margin);

            moneyBullet.width(width - margin.right - margin.left)
                .height(height - margin.top - margin.bottom)
                .margin(margin2);
            moneyBullet.reverse = true;

            //minMPG, meanMPG, maxMPG, avgMPG/person, EPA/car, maxMPG/person
            var mpgdata = [{"title":"MPG","subtitle":"Rank: 4","ranges":[30,40,100],"measures":[47],"markers":[45],
                "rangeLabels":['Min MPG','Avg MPG','Max MPG'], "measureLabels":['Your MPG'], "markerLabels":['EPA'] }];
            //0=avgEPA, saved at 10% above avgEPA, saved at 20% above avgEPA, saved/person, saved by your car at its EPA, saved by highest EPA car
            var moneydata = [{"title":"Savings vs EPA","subtitle":"Rank: 22","ranges":[256,2345,5473],"measures":[900],"markers":[3087],
                "rangeLabels":['No Savings(EPA)','Savings at 10% Above','Savings at 20% Above'], "measureLabels":['Your Savings'], "markerLabels":['Your Car EPA', 'Highest EPA'] }];

            var vis = d3.select("#my-mpg-bullet").selectAll("svg")
                .data(mpgdata)
                .enter().append("svg")
                .attr("class", "bullet nvd3")
                .attr("width", width)
                .attr("height", height)
                .attr("preserveAspectRatio","xMinYMin");
            vis.transition()
                .duration(1000)
                .call(mpgBullet);

            var vis2 = d3.select("#my-money-bullet").selectAll("svg")
                .data(moneydata)
                .enter().append('svg')
                .attr('class',"bullet nvd3")
                .attr("width",width)
                .attr("height",height)
                .attr("preserveAspectRatio","xMinYMin");
            vis2.transition()
                .duration(1000)
                .call(moneyBullet);

            /*
            //#### Data Table
            // Create a data table widget and use the given css selector as anchor. You can also specify
            // an optional chart group for this chart to be scoped within. When a chart belongs
            // to a specific group then any interaction with such chart will only trigger redraw
            // on other charts within the same chart group.
            <!-- anchor div for data table -->
            <div id="data-table">
                <!-- create a custom header -->
                <div class="header">
                    <span>Date</span>
                    <span>Open</span>
                    <span>Close</span>
                    <span>Change</span>
                    <span>Volume</span>
                </div>
                <!-- data rows will filled in here -->
            </div>
            */
            dc.dataTable(".dc-data-table", profileGroup)
                .dimension(yearlyPerformanceGroup)
                // data table does not use crossfilter group but rather a closure
                // as a grouping function
                .group( function(d){
                    return d.value.driver;
                })
                .size(10) // (optional) max number of records to be shown, :default = 25
                // dynamic columns creation using an array of closures
                .columns([
                    function(d){
                        return d.value.driver;
                    },
                    function (d) {
                        return d.value.driveID;
                    },
                    function (d) {
                        return numberFormat(d.value.altavg.deviation);
                    },
                    function (d) {
                        return numberFormat(d.value.count);
                    },
                    function (d) {
                        return numberFormat(d.value.avgMPG);
                    },
                    function (d) {
                        return numberFormat(d.value.thisLong);
                    }
                ])
                // (optional) sort using the given field, :default = function(d){return d;}
                .sortBy(function (d) {
                    return d.dd;
                })
                // (optional) sort order, :default ascending
                .order(d3.ascending)
                // (optional) custom renderlet to post-process chart using D3
                .renderlet(function (table) {
                    table.selectAll(".dc-table-group").classed("hidden", true);
                });


            mpgcharts.drivesArray = seriesData(data, ['altitude','instantMPG']);
            mpgcharts.seriesDatum = mpgcharts.drivesArray[mpgcharts.drivesArray.length - 1];




            function defaultChartConfig(containerid, inputData, guideline, useDates, auxOptions) {
              if (auxOptions === undefined) auxOptions = {};
              if (guideline === undefined) guideline = true;

              nv.addGraph(function() {




                mpgcharts.seriesChart
                    .x(function(d,i) {
                    return d.x;
                    });

                if (auxOptions.width)
                  seriesChart.width(auxOptions.width);

                if (auxOptions.height)
                  seriesChart.height(auxOptions.height);

                if (auxOptions.forceY)
                  seriesChart.forceY([0]);

                //var formatter;
/*                if (useDates !== undefined) {
                    formatter = function(d,i) {
                            //var now = (new Date()).getTime() - 86400 * 1000 * 365;
                            //now = new Date(now + d * 86400 * 1000);
                            //return d3.time.format('%b %d %Y')(now);
                            return d3.time.format('%b %e %H:%M:%S %Y')(new Date(d));}
                    }
                else {
                    formatter = d3.format(",.1f");
                }*/
/*                    var dateArray = [];
                    for (var k=0; k<inputData.length - 1; k++){
                        var thisExtent = d3.extent(inputData[k].values.map(function(d){return d.x;}));
                        dateArray.push(thisExtent[0]);
                        dateArray.push(thisExtent[1]);}
                    var theDomain = d3.time.scale().domain(d3.extent(dateArray));
                    mpgcharts.seriesChart.xAxis = d3.time.scale().domain(d3.extent(theDomain));
                    mpgcharts.seriesChart.x2Axis = d3.time.scale().domain(d3.extent(theDomain));*/

                mpgcharts.seriesChart.xAxis
                    .tickFormat(d3.format(',.2f'));

                mpgcharts.seriesChart.x2Axis
                    .tickFormat(d3.format(',.2f'));

                mpgcharts.seriesChart.yAxis
                    .axisLabel('Value')
                    .tickFormat(d3.format(',.2f'));

                 // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
                mpgcharts.seriesChart
                    .y2Axis.axisLabel('Value')
                    .tickFormat(d3.format(',.2f'));
                //mpgcharts.seriesChart.forceX(d3.extent(theDomain));
                d3.select('#' + containerid + ' svg')
                    .datum(inputData)
                  .transition().duration(1000)
                    .call(mpgcharts.seriesChart);

                nv.utils.windowResize(mpgcharts.seriesChart.update);
                return mpgcharts.seriesChart;
              });
            }


            // This function collects the grouped driveID data into the format needed to plot in a line graph
            function seriesData(data, thekeys){
                var drivesArray = [];
                var allDrivesArray = [];
                var b = yearlyPerformanceGroup.all();
                var keys = thekeys;
                var time = "GPS Time";

                for (var k=0; k < b.length; k++){
                    var filtered = data.filter(function(d){return d.driveID == b[k].key;});
                    var a = [];
                    for (var j=0; j < keys.length; j++){
                        var d = {key: keys[j], driveID: b[k].key, values: []};
                        for (var i=0; i < filtered.length; i = i+5){
                            //Time d.values.push({x: new Date(filtered[i].dd.toISOString()), y: Number(filtered[i][keys[j]])});
                            //Latitude d.values.push({x: Number(filtered[i].lat), y: Number(filtered[i][keys[j]])});
                            d.values.push({x: i, y: Number(filtered[i][keys[j]])});
                        }
                        a.push(d);
                        var temp = d;
                        allDrivesArray.push(temp);
                    }
                    drivesArray.push(a);
                }
                drivesArray.push(allDrivesArray);
                return drivesArray;
            }


            defaultChartConfig('nvSeriesChart'
                , mpgcharts.seriesDatum
                , true
                , true
                , {forceY:false, width:850, height:350, margin:{top: 50, right: 20, bottom: 50, left: 50}});

            //#### Rendering
            //simply call renderAll() to render all charts on the page
            dc.renderAll(profileGroup);


            /*
            // or you can render charts belong to a specific chart group
            dc.renderAll("group");
            // once rendered you can call redrawAll to update charts incrementally when data
            // change without re-rendering everything
            dc.redrawAll();
            // or you can choose to redraw only those charts associated with a specific chart group
            dc.redrawAll("group");
            */



            var isNull = false;
            yearlyBubbleChart.on("filtered", function(chart, filter){



               //var filteredData = ndx.groupAll();
               //var theGroup = yearlyPerformanceGroup.all();
               //var newFilter = yearlyPerformanceGroup.all();
               //var filteredData = yearlyDimension.filterAll([filter]);
               var len = mpgcharts.drivesArray.length - 1;
               if (filter == null){
                   isNull = true;
                   mpgcharts.seriesDatum = [];
                   for (var i = 0; i <= len; i++){
                        var thisArray = mpgcharts.drivesArray[i];
                       for(var k = 0; k < thisArray.length - 1; k++){
                           var str = "";
                           var strArr = mpgcharts.drivesArray[i][k].driveID.split(" ");
                           str = mpgcharts.drivesArray[i][k].key;
                           if (str.indexOf(strArr[0]) === -1){
                            mpgcharts.drivesArray[i][k].key = "" + strArr[0] + ":" + str;
                           }
                       }
                   }
                   mpgcharts.seriesDatum = mpgcharts.drivesArray[len].slice(0);
                   mpgcharts.redrawSeries(mpgcharts.seriesDatum, mpgcharts.seriesChart);
               }
               if (filter != null){


                   if (isNull == true){
                       isNull = false;
                       mpgcharts.seriesDatum.length = 0;
                   }

                   for (var j = 0; j < len; j++){
                       var exists = false;
                       if (filter == mpgcharts.drivesArray[j][0].driveID){

                           for(var k = 0; k < mpgcharts.seriesDatum.length - 1; k++){
                               if (filter == mpgcharts.seriesDatum[k].driveID){
                                   mpgcharts.seriesDatum.splice(k, 2);
                                   exists = true;
                               }
                           }
                            if (exists == false){
                               var newObj = {};
                               var newObj2 = {};
                               jQuery.extend(newObj, mpgcharts.drivesArray[j][0]);
                               jQuery.extend(newObj2, mpgcharts.drivesArray[j][1]);
                               mpgcharts.seriesDatum.push(newObj);
                               mpgcharts.seriesDatum.push(newObj2);
                            }


                       }
                   }
                      if(mpgcharts.seriesDatum.length == 0){
                            mpgcharts.seriesDatum = [];
                            mpgcharts.seriesDatum = mpgcharts.drivesArray[mpgcharts.drivesArray.length - 1].slice(0);
                            mpgcharts.redrawSeries(mpgcharts.seriesDatum, mpgcharts.seriesChart);
                        }
                        mpgcharts.redrawSeries(mpgcharts.seriesDatum, mpgcharts.seriesChart);
               }


            });



        });



        mpgcharts.renderAll = function(a){
            dc.renderAll(a);
        }

        mpgcharts.redrawAll = function(a){
            dc.redrawAll(a);
        }

        mpgcharts.filterAll = function(a){
            dc.filterAll(a);
        }

        mpgcharts.refocusAll = function(a){
            dc.refocusAll(a);
        }




        function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2-lat1);  // deg2rad below
            var dLon = deg2rad(lon2-lon1);
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c; // Distance in km
            return d;
        }

        function deg2rad(deg) {
          return deg * (Math.PI/180)
        }

        mpgcharts.redrawSeries  = function(theData, chart){
            mpgcharts.seriesDatum = theData;
/*            for(var i in seriesDatum[0].values){
                console.log(seriesDatum[0].values[i].x);
                console.log(seriesDatum[0].values[i].y);
            }
            for(var j in seriesDatum[1].values){
                console.log(seriesDatum[1].values[j].x);
                console.log(seriesDatum[1].values[j].y);
            }
            var dateArray = [];
            for (var k=0; k<seriesDatum.length - 1; k++){
                var thisExtent = d3.extent(seriesDatum[k].values.map(function(d){return d.x;}));
                dateArray.push(thisExtent[0]);
                dateArray.push(thisExtent[1]);
            }
            var theDomain = d3.time.scale().domain(d3.extent(dateArray));
            chart.xAxis = nv.models.axis().scale().domain(d3.extent(theDomain));
            chart.x2Axis = nv.models.axis().scale().domain(d3.extent(theDomain));
            chart
                .x(function(d,i) {
                      return d.x;
                    });*/
            //chart.forceX(d3.extent(theDomain));
            //chart.xAxis = nv.models.axis().tickFormat(function(d){
            //    return d3.time.format('%b %e %H:%M:%S %Y')(new Date(d));
            //    });
            //chart.x2Axis = nv.models.axis().tickFormat(function(d){
            //    return d3.time.format('%b %e %H:%M:%S %Y')(new Date(d));
            //    });
            d3.select('#' + 'nvSeriesChart' + ' svg')
                .empty();
            d3.select('#' + 'nvSeriesChart' + ' svg')
                .datum(mpgcharts.seriesDatum)
              .transition().duration(1000)
                .call(chart);
            chart.update();
        }

        function average(a) {
          var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
          for(var m, s = 0, l = t; l--; s += a[l]);
          for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
          return r.deviation = Math.sqrt(r.variance = s / t), r;
        }

        function scatterPlot(inputData){

            var width = 960,
                size = 150,
                padding = 19.5;

            var x = d3.scale.linear()
                .range([padding / 2, size - padding / 2]);

            var y = d3.scale.linear()
                .range([size - padding / 2, padding / 2]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(5);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(5);

            var color = d3.scale.category10();

            d3.csv("flowers.csv", function(error, data) {
              var domainByTrait = {},
                  traits = d3.keys(data[0]).filter(function(d) { return d !== "species"; }),
                  n = traits.length;

              traits.forEach(function(trait) {
                domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
              });

              xAxis.tickSize(size * n);
              yAxis.tickSize(-size * n);

              var brush = d3.svg.brush()
                  .x(x)
                  .y(y)
                  .on("brushstart", brushstart)
                  .on("brush", brushmove)
                  .on("brushend", brushend);

              var svg = d3.select("body").append("svg")
                  .attr("width", size * n + padding)
                  .attr("height", size * n + padding)
                .append("g")
                  .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

              svg.selectAll(".x.axis")
                  .data(traits)
                .enter().append("g")
                  .attr("class", "x axis")
                  .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
                  .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

              svg.selectAll(".y.axis")
                  .data(traits)
                .enter().append("g")
                  .attr("class", "y axis")
                  .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
                  .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

              var cell = svg.selectAll(".cell")
                  .data(cross(traits, traits))
                .enter().append("g")
                  .attr("class", "cell")
                  .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
                  .each(plot);

              // Titles for the diagonal.
              cell.filter(function(d) { return d.i === d.j; }).append("text")
                  .attr("x", padding)
                  .attr("y", padding)
                  .attr("dy", ".71em")
                  .text(function(d) { return d.x; });

              cell.call(brush);

              function plot(p) {
                var cell = d3.select(this);

                x.domain(domainByTrait[p.x]);
                y.domain(domainByTrait[p.y]);

                cell.append("rect")
                    .attr("class", "frame")
                    .attr("x", padding / 2)
                    .attr("y", padding / 2)
                    .attr("width", size - padding)
                    .attr("height", size - padding);

                cell.selectAll("circle")
                    .data(data)
                  .enter().append("circle")
                    .attr("cx", function(d) { return x(d[p.x]); })
                    .attr("cy", function(d) { return y(d[p.y]); })
                    .attr("r", 3)
                    .style("fill", function(d) { return color(d.species); });
              }

              var brushCell;

              // Clear the previously-active brush, if any.
              function brushstart(p) {
                if (brushCell !== this) {
                  d3.select(brushCell).call(brush.clear());
                  x.domain(domainByTrait[p.x]);
                  y.domain(domainByTrait[p.y]);
                  brushCell = this;
                }
              }

              // Highlight the selected circles.
              function brushmove(p) {
                var e = brush.extent();
                svg.selectAll("circle").classed("hidden", function(d) {
                  return e[0][0] > d[p.x] || d[p.x] > e[1][0]
                      || e[0][1] > d[p.y] || d[p.y] > e[1][1];
                });
              }

              // If the brush is empty, select all circles.
              function brushend() {
                if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
              }

              function cross(a, b) {
                var c = [], n = a.length, m = b.length, i, j;
                for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
                return c;
              }

              d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
            });


        }


        //#### Version
        //Determine the current version of dc with `dc.version`
        d3.selectAll("#version").text(dc.version);

        // Add the charts to the mpgcharts namespace
        mpgcharts.statsChart = statsChart;
        mpgcharts.mpgBullet = mpgBullet;
        mpgcharts.moneyBullet = moneyBullet;
        //var quarterChart = quarterChart
        mpgcharts.vehicleChart = vehicleChart;
        mpgcharts.moveChart = moveChart;
        mpgcharts.volumeChart = volumeChart;
        mpgcharts.yearlyBubbleChart = yearlyBubbleChart;
        mpgcharts.loaded = true;
        mpgcharts.seriesChart = seriesChart;
        // Create the series chart the first time through

        //Array.prototype.clone = function() {
        //    return this.slice(0);
        //};

        // Return the mpgcharts object, containing the customized dc.js charts
        return mpgcharts;
    }
);