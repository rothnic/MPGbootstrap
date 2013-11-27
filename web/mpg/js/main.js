/**
 * Created by nick on 11/26/13.
 */

require.config({
    paths:{
        jquery: "./libs/jquery-1.6.2",
        async: "./libs/async",
        gmaps: "./mpg/gmaps",
        mpg: "./mpg/mpg",
        jsonFusionQuery: "./mpg/JSONFusionQuery",
        google: "./mpg/google",
        promise: "./libs/requirejs-promise"
    }
});

require([ "jquery", "gmaps" ], function( $, gmaps ) {
        var mapCanvas = $( "#map_canvas" ).get( 0 );
        gmaps.createMap(mapCanvas);
    }
);

require([ "jquery", "jsonFusionQuery" ], function($, jsonFusionQuery){

    var d = jsonFusionQuery.response;

    var test = "string";
});

