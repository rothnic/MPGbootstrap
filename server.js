/**
 * Created by nick on 11/26/13.
 */

var connect = require('connect'),
   http = require('http');
connect()
   .use(connect.static(__dirname))
   .use(connect.directory(__dirname))
   .listen(5000);