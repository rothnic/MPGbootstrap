/**
 * Created by nick on 11/27/13.
 */
define(["jquery", "google"], function($, google) {
        var deferred = new $.Deferred(),
            jsonFusionQuery = {};

        var theLib = google;

        var query = "SELECT Driver, InstantMPG as MPG, Vehicle, Longitude, Latitude, 'GPS Time', 'Accel Pedal Pos #1(%)', DriveID FROM 1H4jwm3yASY57Wkv9ksjNi4qNfARlQvs04tdDw1I";
        var queryText = encodeURIComponent(query);

        // Construct the URL
        var url = ['https://www.googleapis.com/fusiontables/v1/query'];
        url.push('?sql=' + queryText);
        url.push('&key=AIzaSyDG2IoHqOa36_u6CVVZvw01OpTiw5rOUGs');
        //url.push('&callback=?');

        $.ajax({
            url: url.join(''),
            complete: function (jqxhr, textstatus){
                if ($.inArray(jqxhr.status, [0, 200, 204, 304])) {
                    var data = jqxhr.responseText;
                    var dataTable = new theLib.visualization.DataTable();
                      dataTable.addColumn("string", "Driver");
                      dataTable.addColumn("number", "MPG");
                      dataTable.addColumn("string", "Vehicle");
                      dataTable.addColumn("number", "Longitude");
                      dataTable.addColumn("number", "Latitude");
                      dataTable.addColumn("date", "GPS Time");
                      dataTable.addColumn("number", "Accelerator Percent");
                      dataTable.addColumn("string", "DriveID");
                      for (var row in data.rows){
                        dataTable.addRow([String(data.rows[row][0]), Number(data.rows[row][1]), String(data.rows[row][2]), Number(data.rows[row][3]), Number(data.rows[row][4]), new Date(data.rows[row][5]), Number(data.rows[row][6]), String(data.rows[row][7])]);
                      }
                       jsonFusionQuery.response = dataTable;
                      deferred.resolve(jsonFusionQuery);

                }
            }
        });
    return deferred.promise();
});