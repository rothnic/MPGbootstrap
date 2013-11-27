/**
 * Created by nick on 11/26/13.
 */

var connect = require('connect');
connect.createServer(connect.static(__dirname)).listen(3000);