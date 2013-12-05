/**
 * Created by nick on 11/26/13.
 */

var connect = require('connect'),
   http = require('http');
var port = process.env.PORT || 5000;

connect()
   .use(connect.static(__dirname))
   .use(connect.directory(__dirname))
   .listen(port, function(){
        console.log("Listening on " + port);
    });