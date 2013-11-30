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
        gomaps: "./libs/jquery.gomap-1.3.2.min"
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
        }

    }
});

// Setup site for a generic user
require(["jquery","mpgsite"], function($,mpgsite){
    var defaultUser = "Login";
    mpgsite.login(defaultUser);
});

// Retrieves data from google and initializes maps
require([ "jquery", "getdata", "jsonFusionQuery", "gmaps", "mpgcharts", "gomaps"], function($, getdata, jsonFusionQuery, gmaps, mpgcharts){
    //Log in functionality would be added to add this detail

    jsonFusionQuery.getData().done(function(data){
        mpgcharts.fulldata = jsonFusionQuery.dataTable;
        var mapCanvas = $( "#map_canvas_profile" ).get( 0 );
        var center = new gmaps.maps.LatLng(mpgcharts.fulldata.getValue(200,4), mpgcharts.fulldata.getValue(200,3));
        gmaps.createMap(mapCanvas, center);
        return data;
    });
});

require(["d3","dc","jquery","mpgcharts"], function(d3, dc, $, mpgcharts){

        console.log(String(mpgcharts.loaded));

    }
);

require(["jquery"], function($){
    $('.nav').bind('change', function (e) {
        // e.target is the new active tab according to docs
        // so save the reference in case it's needed later on
        window.activeTab = e.target;
        // display the alert
        alert("hello");
        // Load data etc
    });
});

// Bind buttons to javascript
require(["jquery", "mpgsite", "gmaps", "mpgcharts"], function($, mpgsite, gmaps, mpgcharts){
    $('#user-profile-button').bind('click', function(){
        var user = "Pat";
        mpgsite.login(user);

    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var bounds = new gmaps.maps.LatLngBounds();
        for(var i = 0, ltlglen = mpgcharts.fulldata.getNumberOfRows(); i < ltlglen; i++){
            bounds.extend (new gmaps.maps.LatLng(mpgcharts.fulldata.getValue(i,4), mpgcharts.fulldata.getValue(i,3)));
        }
        gmaps.maps.event.trigger(gmaps.map,'resize');
        gmaps.map.fitBounds(bounds);
        //e.target // activated tab
        //e.relatedTarget // previous tab
    });

    //vehicleChart.filterAll();dc.redrawAll();
});

