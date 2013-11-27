/**
 * Created by nick on 11/26/13.
 */

var connect = require('connect'),
   http = require('http');
connect()
   .use(connect.static(__dirname + "/web/mpg/"))
   .use(connect.directory(__dirname))
   .listen(process.env.PORT);