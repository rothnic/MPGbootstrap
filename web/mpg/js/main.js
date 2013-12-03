/**
 * Created by nick on 11/26/13.
 */

require.config({
    paths:{
        jquery: "./libs/jquery-1.10.2.min",
        async: "./libs/async",
        gmaps: "./mpg/gmaps",
        goog: "./libs/goog",
        getdata: "./mpg/getdata",
        propertyParser: "./libs/propertyParser",
        jsonFusionQuery: "./mpg/JSONFusionQuery",
        promise: "./libs/requirejs-promise",
        d3: "../../js/d3",
        dc: "../../js/dc",
        crossfilter: "../../js/crossfilter",
        colorbrewer: "../../js/colorbrewer",
        mpgcharts: "./mpg/mpgcharts",
        mpgsite: "./mpg/mpgsite",
        tabs: "../../../js/tab",
        gomaps: "./libs/jquery.gomap-1.3.2.min",
        tooltip: "../../../js/tooltip",
        changeType: "./libs/jquery.changeElementType",
        d3Tooltip: "./libs/tooltip",
        d3compat: "./libs/d3-compat",
        d3v2: "./libs/d3.v2.min",
        stats: "./libs/stats",
        nv: "./libs/nv.d3"
    },
    shim:{

        d3:{
            exports: 'd3'
        },
        crossfilter:{
            exports: 'crossfilter'
        },
        colorbrewer:{
            exports: 'colorbrewer'
        },
        dc:{
           deps: ['crossfilter','colorbrewer','d3'],
           exports: 'dc'
        },
        gomaps: {
            deps: ['jquery', 'gmaps'],
            exports: '$.goMap'
        },
        changeType: {
          deps: ['jquery'],
          exports: '$.changeElementType'
        },
        d3Tooltip: {
            deps: ['d3','tooltip', 'd3compat', 'd3v2']
        },
        d3compat: {
            deps: ['d3v2'],
            exports: 'd3v2'
        },
        nv: {
            deps: ['d3'],
            exports: 'nv'
        }

    }
});

// Setup site for a generic user
require(["jquery","mpgsite"], function($,mpgsite){
    var defaultUser = "Login";
    mpgsite.login(defaultUser);
});

// Retrieves data from google and initializes maps
require([ "jquery", "getdata", "jsonFusionQuery", "gmaps", "mpgcharts", "gomaps", "changeType", "d3Tooltip"], function($, getdata, jsonFusionQuery, gmaps, mpgcharts){
    //Log in functionality would be added to add this detail

    jsonFusionQuery.getData().done(function(data){
        mpgcharts.fulldata = jsonFusionQuery.dataTable;
        var mapCanvas = $( "#map_canvas_profile" ).get( 0 );
        var center = new gmaps.maps.LatLng(mpgcharts.fulldata.getValue(200,4), mpgcharts.fulldata.getValue(200,3));
        gmaps.createMap(mapCanvas, center);
        return data;
    });
});

require(["d3","d3v2","dc","jquery","mpgcharts"], function(mpgcharts){

        console.log(String(mpgcharts.loaded));
    }
);

require(["jquery"], function($){
    $('div.ul.li').bind('change', function (e) {
        // e.target is the new active tab according to docs
        // so save the reference in case it's needed later on
        window.activeTab = e.target;
        console.log("in nav event");
        // display the alert
        alert("hello");
        // Load data etc
    });
});

// Bind buttons to javascript
require(["jquery", "mpgsite", "gmaps", "mpgcharts", "getdata", "jsonFusionQuery", "tooltip", "tabs", "dc"], function($, mpgsite, gmaps, mpgcharts){


    $('#user-profile-button').bind('click', function(){
        var user = "Pat";
        mpgsite.login(user);
        console.log("in user profile event");

    });

    // This event makes the navbar behave like tabs, so a singular page serves all content
    $('#navbar a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var bounds = new gmaps.maps.LatLngBounds();
        for(var i = 0, ltlglen = mpgcharts.fulldata.getNumberOfRows(); i < ltlglen; i++){
            bounds.extend (new gmaps.maps.LatLng(mpgcharts.fulldata.getValue(i,4), mpgcharts.fulldata.getValue(i,3)));
        }
        gmaps.maps.event.trigger(gmaps.map,'resize');
        gmaps.map.fitBounds(bounds);
        mpgcharts.filterAll("profileGroup");
        mpgcharts.redrawAll("profileGroup");
        dc.filterAll();
        dc.renderAll();

        console.log("in map event");
        //e.target // activated tab
        //e.relatedTarget // previous tab
    });

    $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
        //mpgcharts.redrawAll("profileGroup");
        console.log("in data redraw event");
    });

    $("#line-chart-button").bind('click', function(){
        mpgcharts.moveChart.filterAll();
        mpgcharts.volumeChart.filterAll();
        mpgcharts.redrawAll("profileGroup");
    });

    $("#stats-chart-button").bind('click', function(){
        mpgcharts.statsChart.filterAll();
        mpgcharts.redrawAll("profileGroup");
    });

    $("#drives-chart-button").bind('click', function(){
        mpgcharts.yearlyBubbleChart.filterAll();
        mpgcharts.redrawAll("profileGroup");
    });

    $("#vehicle-chart-button").bind('click', function(){
        mpgcharts.vehicleChart.filterAll();
        mpgcharts.redrawAll("profileGroup");
    });

    $("#table-chart-button").bind('click', function(){
        dc.filterAll();
        dc.renderAll();
    });
});