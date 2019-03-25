var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ip = require('ip');
app.use(bodyParser.json())

require('./app/routes.js')(app);

// Create a Server
var server = app.listen(8081,ip.address(), function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("App running on http://%s:%s", host, port)
  //console.log(ip.address());
});

