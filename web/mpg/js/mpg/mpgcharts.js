/**
 * Created by nick on 11/26/13.
 */
define(["dc","d3","jquery","crossfilter","colorbrewer"], function(dc,d3,$){
        var mpgcharts = {};
        //# dc.js Getting Started and How-To Guide
        'use strict';
        /* jshint globalstrict: true */
        /* global dc,d3,crossfilter,colorbrewer */

        // ### Create Chart Objects
        // Create chart objects assocated with the container elements identified by the css selector.
        // Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or filtered by other page controls.
        //var gainOrLossChart = dc.pieChart("#gain-loss-chart");
        var statsChart = dc.barChart("#stats-chart");
        //var quarterChart = dc.pieChart("#quarter-chart");
        var vehicleChart = dc.rowChart("#vehicle-chart");
        var moveChart = dc.lineChart("#detailed-line-chart");
        var volumeChart = dc.barChart("#detailed-stats-chart");
        var yearlyBubbleChart = dc.bubbleChart("#yearly-bubble-chart");

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
                d.close = +d["Miles Per Gallon(Instant)(mpg)"]; // coerce to number
                d.open = +d["GPS Speed (Meters/second)"];
                d.lat = +d[" Latitude"];
                d.long = +d[" Longitude"];
                d.driveID = d["DriveID"];

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

            // maintain running tallies by year as filters are applied or removed

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

            var yearlyPerformanceGroup = yearlyDimension.group().reduce(
                /* callback for when data is added to the current filter results */
                function (p, v) {
                    ++p.count;
                    p.driveID = v.driveID;
                    p.altitude = v[' Altitude'];
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
                    p.driveID = v.driveID;
                    p.dd = v.dd;
                    p.altitude = v[' Altitude'];
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
                    return {count: 0, avgMPG: 0, changeDist: 0.0};
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
                return Math.abs(d.close - d.open);
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
                    p.total += (v.open + v.close) / 2;
                    p.avg = Math.round(p.total / p.days);
                    return p;
                },
                function (p, v) {
                    --p.days;
                    p.total -= (v.open + v.close) / 2;
                    p.avg = p.days ? Math.round(p.total / p.days) : 0;
                    return p;
                },
                function () {
                    return {days: 0, total: 0, avg: 0};
                }
            );

            // create categorical dimension
            var gainOrLoss = ndx.dimension(function (d) {
                return d.open > d.close ? "Loss" : "Gain";
            });
            // produce counts records in the dimension
            var gainOrLossGroup = gainOrLoss.group();

            // determine a histogram of percent changes
            var fluctuation = ndx.dimension(function (d) {
                return Math.round((d.close - d.open) / d.open * 100);
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
            var vehicleGroup = vehicles.group();

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
                .width(800) // (optional) define chart width, :default = 200
                .height(250)  // (optional) define chart height, :default = 200
                .transitionDuration(1500) // (optional) define chart transition duration, :default = 750
                .margins({top: 10, right: 50, bottom: 50, left: 40})
                .dimension(yearlyDimension)
                //Bubble chart expect the groups are reduced to multiple values which would then be used
                //to generate x, y, and radius for each key (bubble) in the group
                .group(yearlyPerformanceGroup)
                .colors(colorbrewer.RdYlGn[9]) // (optional) define color function or array for bubbles
                .colorDomain([-200, 200]) //(optional) define color domain to match your data domain if you want to bind data or color
                //##### Accessors
                //Accessor functions are applied to each value returned by the grouping
                //
                //* `.colorAccessor` The returned value will be mapped to an internal scale to determine a fill color
                //* `.keyAccessor` Identifies the `X` value that will be applied against the `.x()` to identify pixel location
                //* `.valueAccessor` Identifies the `Y` value that will be applied agains the `.y()` to identify pixel location
                //* `.radiusValueAccessor` Identifies the value that will be applied agains the `.r()` determine radius size, by default this maps linearly to [0,100]
                .colorAccessor(function (d) {
                    return d.value.altitude;
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
                .maxBubbleRelativeSize(0.1)
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
                .renderLabel(true) // (optional) whether chart should render labels, :default = true
                .label(function (d) {
                    //console.log(String(shortDate(d.value.dd)))
                    return String(shortDate(d.value.dd));
                })
                .renderTitle(true) // (optional) whether chart should render titles, :default = false
                .title(function (p) {
                    return [p.key,
                           "Date: " + shortDate(p.value.dd),
                           "MPG: " + numberFormat(p.value.avgMPG),
                           "Distance: " + numberFormat(p.value.changeDist) + "miles"]
                           .join("\n");
                });

                //#### Customize Axis
                yearlyBubbleChart.xAxis()
                    .ticks(d3.time.days,1)
                    .tickFormat(d3.time.format('%a %d'))
                    .tickSize(1)
                    .tickPadding(5);
                //Set a custom tick format. Note `.yAxis()` returns an axis object, so any additional method chaining applies to the axis, not the chart.
                yearlyBubbleChart.yAxis().tickFormat(function (v) {
                    return v + "%";
                });
                yearlyBubbleChart.renderlet(function(yearlyBubbleChart){
                    // mix of dc API and d3 manipulation
                    //yearlyBubbleChart.select("g>title").replaceWith(function(){return $("<div />")});
                    //yearlyBubbleChart.$ = $;
                    //yearlyBubbleChart.$("g>title").changeElementType("a");
                    //yearlyBubbleChart.$("g.node>title").replaceWith(function(){return ( '<a class = "tt" title = ' + $(this).firstChild + ' />');});
                    yearlyBubbleChart.selectAll("g.node").append("a").classed("tt", true).attr();
                    var selection = yearlyBubbleChart.selectAll("g.node>title");
                    var selArray = selection[0];
                    yearlyBubbleChart.selectAll("g.node>a.tt").attr("title", function(d, i){ return "'" + selArray[i].textContent + "'";});
                    yearlyBubbleChart.selectAll("g.node>title").remove();
                    yearlyBubbleChart.selectAll("g.node>a.tt").call(bootstrap.tooltip().placement("right"));

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
                .height(180)
                .margins({top: 20, left: 10, right: 10, bottom: 20})
                .group(vehicleGroup)
                .dimension(vehicles)
                // assign colors to each value in the x scale domain
                .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
                .label(function (d) {
                    return d.key.split(".")[1];
                })
                // title sets the row text
                .title(function (d) {
                    return d.value;
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
                .renderArea(true)
                .width(990)
                .height(200)
                .transitionDuration(1000)
                .margins({top: 30, right: 50, bottom: 25, left: 40})
                .dimension(moveMonths)
                .mouseZoomable(true)
                // Specify a range chart to link the brush extent of the range with the zoom focue of the current chart.
                .rangeChart(volumeChart)
                .x(d3.time.scale().domain([d3.min(data, function(d){return d.dd;}), d3.max(data, function(d){return d.dd;})]))
                .round(d3.time.month.round)
                .xUnits(d3.time.months)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
                .brushOn(false)
                // Add the base layer of the stack with group. The second parameter specifies a series name for use in the legend
                // The `.valueAccessor` will be used for the base layer
                .group(indexAvgByMonthGroup, "Monthly Index Average")
                .valueAccessor(function (d) {
                    return d.value.avg;
                })
                // stack additional layers with `.stack`. The first paramenter is a new group.
                // The second parameter is the series name. The third is a value accessor.
                .stack(monthlyMoveGroup, "Monthly Index Move", function (d) {
                    return d.value;
                })
                // title can be called by any stack layer.
                .title(function (d) {
                    var value = d.value.avg ? d.value.avg : d.value;
                    if (isNaN(value)) value = 0;
                    return dateFormat(d.key) + "\n" + numberFormat(value);
                });

            volumeChart.width(990)
                .height(40)
                .margins({top: 0, right: 50, bottom: 20, left: 40})
                .dimension(moveMonths)
                .group(volumeByMonthGroup)
                .centerBar(true)
                .gap(1)
                .x(d3.time.scale().domain([d3.min(data, function(d){return d.dd;}), d3.max(data, function(d){return d.dd;})] ))
                .round(d3.time.month.round)
                .xUnits(d3.time.months);

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
            dc.dataTable(".dc-data-table")
                .dimension(yearlyPerformanceGroup)
                // data table does not use crossfilter group but rather a closure
                // as a grouping function
                .group(function (d) {
                    return d.driveID;
                })
                .size(10) // (optional) max number of records to be shown, :default = 25
                // dynamic columns creation using an array of closures
                .columns([
                    function (d) {
                        return d.value.driveID;
                    },
                    function (d) {
                        return numberFormat(d.value.altitude);
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
                .order(d3.ascending);
                // (optional) custom renderlet to post-process chart using D3
                //.renderlet(function (table) {
                //    table.selectAll(".dc-table-group").classed("info", true);
                //});

            /*
            //#### Geo Choropleth Chart
            //Create a choropleth chart and use the given css selector as anchor. You can also specify
            //an optional chart group for this chart to be scoped within. When a chart belongs
            //to a specific group then any interaction with such chart will only trigger redraw
            //on other charts within the same chart group.
            dc.geoChoroplethChart("#us-chart")
                .width(990) // (optional) define chart width, :default = 200
                .height(500) // (optional) define chart height, :default = 200
                .transitionDuration(1000) // (optional) define chart transition duration, :default = 1000
                .dimension(states) // set crossfilter dimension, dimension key should match the name retrieved in geo json layer
                .group(stateRaisedSum) // set crossfilter group
                // (optional) define color function or array for bubbles
                .colors(["#ccc", "#E2F2FF","#C4E4FF","#9ED2FF","#81C5FF","#6BBAFF","#51AEFF","#36A2FF","#1E96FF","#0089FF","#0061B5"])
                // (optional) define color domain to match your data domain if you want to bind data or color
                .colorDomain([-5, 200])
                // (optional) define color value accessor
                .colorAccessor(function(d, i){return d.value;})
                // Project the given geojson. You can call this function mutliple times with different geojson feed to generate
                // multiple layers of geo paths.
                //
                // * 1st param - geo json data
                // * 2nd param - name of the layer which will be used to generate css class
                // * 3rd param - (optional) a function used to generate key for geo path, it should match the dimension key
                // in order for the coloring to work properly
                .overlayGeoJson(statesJson.features, "state", function(d) {
                    return d.properties.name;
                })
                // (optional) closure to generate title for path, :default = d.key + ": " + d.value
                .title(function(d) {
                    return "State: " + d.key + "\nTotal Amount Raised: " + numberFormat(d.value ? d.value : 0) + "M";
                });

                //#### Bubble Overlay Chart
                // Create a overlay bubble chart and use the given css selector as anchor. You can also specify
                // an optional chart group for this chart to be scoped within. When a chart belongs
                // to a specific group then any interaction with such chart will only trigger redraw
                // on other charts within the same chart group.
                dc.bubbleOverlay("#bubble-overlay")
                    // bubble overlay chart does not generate it's own svg element but rather resue an existing
                    // svg to generate it's overlay layer
                    .svg(d3.select("#bubble-overlay svg"))
                    .width(990) // (optional) define chart width, :default = 200
                    .height(500) // (optional) define chart height, :default = 200
                    .transitionDuration(1000) // (optional) define chart transition duration, :default = 1000
                    .dimension(states) // set crossfilter dimension, dimension key should match the name retrieved in geo json layer
                    .group(stateRaisedSum) // set crossfilter group
                    // closure used to retrieve x value from multi-value group
                    .keyAccessor(function(p) {return p.value.absGain;})
                    // closure used to retrieve y value from multi-value group
                    .valueAccessor(function(p) {return p.value.percentageGain;})
                    // (optional) define color function or array for bubbles
                    .colors(["#ccc", "#E2F2FF","#C4E4FF","#9ED2FF","#81C5FF","#6BBAFF","#51AEFF","#36A2FF","#1E96FF","#0089FF","#0061B5"])
                    // (optional) define color domain to match your data domain if you want to bind data or color
                    .colorDomain([-5, 200])
                    // (optional) define color value accessor
                    .colorAccessor(function(d, i){return d.value;})
                    // closure used to retrieve radius value from multi-value group
                    .radiusValueAccessor(function(p) {return p.value.fluctuationPercentage;})
                    // set radius scale
                    .r(d3.scale.linear().domain([0, 3]))
                    // (optional) whether chart should render labels, :default = true
                    .renderLabel(true)
                    // (optional) closure to generate label per bubble, :default = group.key
                    .label(function(p) {return p.key.getFullYear();})
                    // (optional) whether chart should render titles, :default = false
                    .renderTitle(true)
                    // (optional) closure to generate title per bubble, :default = d.key + ": " + d.value
                    .title(function(d) {
                        return "Title: " + d.key;
                    })
                    // add data point to it's layer dimension key that matches point name will be used to
                    // generate bubble. multiple data points can be added to bubble overlay to generate
                    // multiple bubbles
                    .point("California", 100, 120)
                    .point("Colorado", 300, 120)
                    // (optional) setting debug flag to true will generate a transparent layer on top of
                    // bubble overlay which can be used to obtain relative x,y coordinate for specific
                    // data point, :default = false
                    .debug(true);
            */

            //#### Rendering
            //simply call renderAll() to render all charts on the page
            dc.renderAll();
            /*
            // or you can render charts belong to a specific chart group
            dc.renderAll("group");
            // once rendered you can call redrawAll to update charts incrementally when data
            // change without re-rendering everything
            dc.redrawAll();
            // or you can choose to redraw only those charts associated with a specific chart group
            dc.redrawAll("group");
            */
        });

        mpgcharts.renderAll = function(){
            dc.renderAll();
        }

        mpgcharts.redrawAll = function(){
            dc.redrawAll();
        }

        mpgcharts.filterAll = function(){
            dc.filterAll();
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

        //#### Version
        //Determine the current version of dc with `dc.version`
        d3.selectAll("#version").text(dc.version);

        // Add the charts to the mpgcharts namespace
        mpgcharts.statsChart = statsChart;
        //var quarterChart = quarterChart
        mpgcharts.vehicleChart = vehicleChart;
        mpgcharts.moveChart = moveChart;
        mpgcharts.volumeChart = volumeChart;
        mpgcharts.yearlyBubbleChart = yearlyBubbleChart;

        mpgcharts.loaded = true;

        // Return the mpgcharts object, containing the customized dc.js charts
        return mpgcharts;
    }
);