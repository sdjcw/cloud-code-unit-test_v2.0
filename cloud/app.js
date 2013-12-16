// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var name = require('cloud/name.js');
var avosExpressCookieSession = require('avos-express-cookie-session');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body
app.use(express.cookieParser('test'));
app.use(avosExpressCookieSession({ cookie: { maxAge: 3600000 },fetchUser: false  }));

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/hello', function(req, res) {
	res.render('hello', { message: 'Congrats, you just set up your app!' });
});

app.post('/login', function(req, res) {
    AV.User.logIn(req.body.username, req.body.password).then(function() {
		res.redirect('/profile');
    },
															 function(error) {
																 res.status = 500;
																 res.send(error);
															 });
});

app.get('/logout', function(req, res) {
    AV.User.logOut();
    res.redirect('/profile');
});

app.get('/profile', function(req, res) {
    if (AV.User.current()) {
		res.send(AV.User.current());
    } else {
		res.send({});
    }
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
