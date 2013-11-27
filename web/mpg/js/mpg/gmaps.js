define(["async!https://maps.googleapis.com/maps/api/js?key=AIzaSyDG2IoHqOa36_u6CVVZvw01OpTiw5rOUGs&sensor=false!callback"],


    function() {
    var gmaps = google;

        gmaps.createMap = function(mapCanvas){
				var myOptions = {
					center: new gmaps.maps.LatLng( -34.397, 150.644 ),
					zoom: 8,
					mapTypeId: gmaps.maps.MapTypeId.ROADMAP
				};

				var map = new gmaps.maps.Map( mapCanvas, myOptions );
                var layer = new gmaps.maps.FusionTablesLayer({
                  map: map,
                  heatmap: { enabled: false },
                  query: {
                    select: "col6",
                    from: "1H4jwm3yASY57Wkv9ksjNi4qNfARlQvs04tdDw1I",
                    where: ""
                  },
                  options: {
                    styleId: 2,
                    templateId: 2
                  }
                });
			}
    return gmaps;
    }
);