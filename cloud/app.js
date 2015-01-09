// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var name = require('cloud/name.js');
var avosExpressCookieSession = require('avos-express-cookie-session');
var fs = require('fs');
var assert = require('assert');

var foo = require('cloud/foo.js');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body
app.use(express.cookieParser('test'));
app.use(avosExpressCookieSession({ cookie: { maxAge: 3600000 },fetchUser: false  }));

var TestObject = AV.Object.extend('TestObject');

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/hello', function(req, res) {
	res.render('hello', { message: 'Congrats, you just set up your app!' });
});

app.post('/login', function(req, res) {
    AV.User.logIn(req.body.username, req.body.password).then(
        function() {
		res.redirect('/profile');
        },
        function(error) {
            res.status = 500;
            res.send(error);
        }
    );
});

app.get('/logout', function(req, res) {
    AV.User.logOut();
    res.redirect('/profile');
});

app.get('/profile', function(req, res) {
    if (req.AV.user) {
		res.send(req.AV.user);
    } else {
		res.send({});
    }
});

app.get("/userMatching", function(req, res) {
  setTimeout(function() {
    // 为了更加靠谱的验证串号问题，走一次网络 IO
    var query = new AV.Query(TestObject);
    query.get('54755078e4b016add4f37fe8', {
      success: function(obj) {
        assert.equal(obj.get('foo'), 'bar');
        res.send({reqUser: req.AV.user, currentUser: AV.User.current()});
      }, error: function(err) {
        res.success({reqUser: req.user, currentUser: AV.User.current()});
      }
    })
  }, Math.floor((Math.random() * 2000) + 1));
});


app.get('/runCool', function(req, res){
	AV.Cloud.run('cool', {name: 'dennis'}, {
		success: function(result){
			res.send(result);
		},
		error: function(err){
			res.send(err);
		}
    });
});

app.post('/hello', function(req, res) {
	res.render('hello', { message: 'hello,' + req.body.name });
});

app.post('/isCool', function(req, res) {
	var cool = name.isACoolName(req.body.name);
	res.render('hello', { message: cool });
});

app.get('/time', function(req, res) {
   res.send(new Date());
})

app.get('/sources', function(req, res) {
    fs.readdir('.', function(err, data) {
        res.send(data);
    })
})

app.get('/path', function(req, res) {
  res.send({"__filename": __filename, "__dirname": __dirname});
})

console.log('__filename:', __filename, "__dirname": __dirname);

app.get("/throwError", function(req, res) {
  setTimeout(function () {
    noThisMethod();
  })
  res.send('ok');
  noThisMethod();
});

// This line is required to make Express respond to http requests.
app.listen();
