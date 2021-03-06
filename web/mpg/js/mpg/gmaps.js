define(["async!https://maps.googleapis.com/maps/api/js?key=AIzaSyDG2IoHqOa36_u6CVVZvw01OpTiw5rOUGs&sensor=false!callback"],


    function() {
    var gmaps = google;
        gmaps.loaded = false;

        gmaps.createMap = function(mapCanvas, centerPoint){
				var myOptions = {
					center: centerPoint,
					zoom: 12,
					mapTypeId: gmaps.maps.MapTypeId.ROADMAP
				};

				gmaps.map = new gmaps.maps.Map( mapCanvas, myOptions );
                var layer = new gmaps.maps.FusionTablesLayer({
                  map: gmaps.map,
                  heatmap: { enabled: false },
                  query: {
                    select: "col8",
                    from: "1DS6bR16zDH7MW56-YdsFlvArEct9BciS0yHdBt8",
                    where: ""
                  },
                  options: {
                    styleId: 2,
                    templateId: 2
                  }
                });
            gmaps.loaded = true;
			}
    return gmaps;
    }
);