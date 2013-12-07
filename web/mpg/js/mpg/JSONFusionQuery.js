/**
 * Created by nick on 11/27/13.
 */
define(["jquery"], 
function($) {
    var jsonFusionQuery = {};
    var query = "SELECT 'Driver' as driver, 'Miles Per Gallon(Instant)(mpg)' as mpg, 'Engine Load(Absolute)(%)' as engLoad, 'Trip Distance(miles)' as tripDist, 'Cost per mile(Trip)' as costPerMile, 'Ambient Temp(F)' as ambTemp, 'Engine RPM(rpm)' as rpm, 'Trip average MPG(mpg)' as avgMPG, 'WindDirection(deg)' as windDir, 'WindSpeed(mph)' as windSpeed, 'Vehicle' as vehicle, 'Longitude' as long, 'Latitude' as lat, 'GPS Time' as gpsTime, 'Accel Pedal Pos #1(%)' as accel, 'DriveID' as driveID, 'GPS Speed (Meters/second)' as speed, 'Altitude' as altitude, 'Mass Air Flow Rate(cfm)' as maf FROM 1DS6bR16zDH7MW56-YdsFlvArEct9BciS0yHdBt8";
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