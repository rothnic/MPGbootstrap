define(["jquery", "jsonFusionQuery","goog!visualization,1"], 
    function ($, jsonFusionQuery){
        
        jsonFusionQuery.getData().done(function(data){
            var dataTable = new google.visualization.DataTable();
              dataTable.addColumn("string", "driver");
              dataTable.addColumn("number", "mpg");
              dataTable.addColumn("number", "engLoad");
              dataTable.addColumn("number", "tripDist");
              dataTable.addColumn("number", "costPerMile");
              dataTable.addColumn("number", "ambTemp");
              dataTable.addColumn("number", "rpm");
              dataTable.addColumn("number", "avgMPG");
              dataTable.addColumn("number", "windDir");
              dataTable.addColumn("number", "windSpeed");
              dataTable.addColumn("string", "vehicle");
              dataTable.addColumn("number", "long");
              dataTable.addColumn("number", "lat");
              dataTable.addColumn("date", "gpsTime");
              dataTable.addColumn("number", "accel");
              dataTable.addColumn("string", "driveID");
              dataTable.addColumn("number", "speed");
              dataTable.addColumn("number", "altitude");
              dataTable.addColumn("number", "DriveID");
              dataTable.addColumn("number", "maf");

              for (var row in data.rows){
                dataTable.addRow([String(data.rows[row][0]), Number(data.rows[row][1]), Number(data.rows[row][2]), Number(data.rows[row][3]), Number(data.rows[row][4]), Number(data.rows[row][5]), Number(data.rows[row][6]), Number(data.rows[row][7]), Number(data.rows[row][8]), Number(data.rows[row][9]), String(data.rows[row][10]), Number(data.rows[row][11]), Number(data.rows[row][12]), new Date(data.rows[row][13]), Number(data.rows[row][14]), String(data.rows[row][15]), Number(data.rows[row][16]), Number(data.rows[row][17]), Number(data.rows[row][18]), Number(data.rows[row][19])]);
              }
              return jsonFusionQuery.dataTable = dataTable;
        });
    return jsonFusionQuery;
        
});