/**
 * Created by nick on 11/27/13.
 */
define(["jquery"], 
function($) {
    var jsonFusionQuery = {};
    var query = "SELECT Driver, InstantMPG as MPG, Vehicle, Longitude, Latitude, 'GPS Time', 'Accel Pedal Pos #1(%)', DriveID FROM 1H4jwm3yASY57Wkv9ksjNi4qNfARlQvs04tdDw1I";
    var queryText = encodeURIComponent(query);

    // Construct the URL
    var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + queryText);
    url.push('&key=AIzaSyDG2IoHqOa36_u6CVVZvw01OpTiw5rOUGs');
    //url.push('&callback=?');

    var dataFetch = $.ajax({
        url: url.join('')
        });
            
    return {
        getData: function(){
            return dataFetch;
        }
    }
});