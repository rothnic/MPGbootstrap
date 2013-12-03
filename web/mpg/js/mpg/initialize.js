/**
 * Created by nick on 12/1/13.
 */

/*
define(["jquery", "getdata", "jsonFusionQuery", "gmaps", "mpgcharts", "gomaps", "changeType", "d3Tooltip"], function($, getdata, jsonFusionQuery, gmaps, mpgcharts){

    var initialize = {};

    function maps($, jsonFusionQuery, gmaps, mpgcharts){
        jsonFusionQuery.getData().done(function(data){
            mpgcharts.fulldata = jsonFusionQuery.dataTable;
            var mapCanvas = $( "#map_canvas_profile" ).get( 0 );
            var center = new gmaps.maps.LatLng(mpgcharts.fulldata.getValue(200,4), mpgcharts.fulldata.getValue(200,3));
            gmaps.createMap(mapCanvas, center);
            return data;
        });
    };

    maps($, jsonFusionQuery, gmaps, mpgcharts);

    initialize.complete = true;
    return initialize.complete;

});*/


//Unused for now