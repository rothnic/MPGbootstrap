define(["jquery", "jsonFusionQuery","goog!visualization,1"], 
    function ($, jsonFusionQuery){
        
        jsonFusionQuery.getData().done(function(data){
            var dataTable = new google.visualization.DataTable();
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
              return jsonFusionQuery.dataTable = dataTable;
        });
    return jsonFusionQuery;
        
});