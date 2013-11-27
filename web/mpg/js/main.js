/**
 * Created by nick on 11/26/13.
 */

require.config({
    paths:{
        jquery: "./libs/jquery-1.6.2",
        async: "./libs/async",
        gmaps: "./mpg/gmaps",
        mpg: "./mpg/mpg",
        goog: "./libs/goog",
        getdata: "./mpg/getdata",
        propertyParser: "./libs/propertyParser",
        jsonFusionQuery: "./mpg/JSONFusionQuery",
        promise: "./libs/requirejs-promise"
    }
});



require([ "jquery", "getdata", "jsonFusionQuery", "gmaps" ], function($, getdata, jsonFusionQuery, gmaps){
    jsonFusionQuery.getData().done(function(){
        $.dataTable = jsonFusionQuery.dataTable;
        var mapCanvas = $( "#map_canvas" ).get( 0 );
        var center = new gmaps.maps.LatLng($.dataTable.getValue(500,4), $.dataTable.getValue(500,3));
        gmaps.createMap(mapCanvas, center);
    });
});