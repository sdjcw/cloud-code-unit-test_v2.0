// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var name = require('cloud/name.js');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/hello', function(req, res) {
  res.render('hello', { message: 'Congrats, you just set up your app!' });
});

app.post('/hello', function(req, res) {
  res.render('hello', { message: 'hello,' + req.body.name });
});

app.post('/isCool', function(req, res) {
  var cool = name.isACoolName(req.body.name);
  res.render('hello', { message: cool });
});



// This line is required to make Express respond to http requests.
app.listen();