// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
var name = require('cloud/name.js');
require('cloud/app.js')
var async = require('async');
var fs = require('fs');
var assert = require('assert');

var moment = require("moment-timezone");
console.log(moment(new Date()).tz('Asia/Shanghai').format("YYYY-MM-DD HH:mm:ss"));

require('cloud/test1');

// require 模块只初始化一次，所以应该只打印一行 "foo init..." 的日志
var foo = require('cloud/foo.js');
var foo2 = require('cloud/foo.js');

var TestObject = AV.Object.extend('TestObject');

AV.Cloud.define("hello", function(request, response) {
  console.log(request.user);
	response.success("Hello world," + request.params.name);
});

AV.Cloud.define("readdir", function(request, response) {
    fs.readdir('.', function(err, dir) {
	    response.success(dir);
    })
});

AV.Cloud.define("empty", function(request, response) {
  response.success();
})

AV.Cloud.define("cool", function(request, response) {
	response.success(name.isACoolName(request.params.name));
});

AV.Cloud.define("throwError", function(request, response) {
  setTimeout(function() {
    noThisMethod();
  }, 3000)
	response.success("ok");
  noThisMethod();
});

AV.Cloud.define("getAppId", function(request, response) {
	response.success(AV.applicationId);
});

AV.Cloud.define('testBuffer', function(request, response){
	var buf = new Buffer('hello');
	response.success(buf);
});

AV.Cloud.define('userPointerTest', function(req, res) {
  var testObject = new TestObject();
  testObject.set('foo', 'bar');
  testObject.set('user', req.user);
  testObject.save(null, {
    success: function() {
      res.success();
    },
    error: function(obj, err) {
      res.error(err);
    }
  })
})

AV.Cloud.define('env', function(req, res) {
  if (__local) {
    return res.success('dev');
  }
  if (__production == 0) {
    return res.success('test');
  } else {
    return res.success('production');
  }
})

AV.Cloud.define('asyncTest', function(req, res) {
    var i = 0;
    async.times(3, function(n, next) {
        i++;
        next(null, i);
    }, function(err, data) {
        res.success(data);
    })
});

AV.Cloud.define('testCql', function(req, res) {
  AV.Query.doCloudQuery('select * from GameScore limit 10').then(function(result){
    var results = result.results;
    assert.equal(results.length, 10);
    assert.equal(results[0].className, "GameScore");
    assert.equal(result.count, undefined);
    assert.equal(result.className, 'GameScore');
    res.success();
  });
})

AV.Cloud.define("path", function(req, res) {
  res.success({"__filename": __filename, "__dirname": __dirname})
});

AV.Cloud.define("userMatching", function(req, res) {
  setTimeout(function() {
    // 为了更加靠谱的验证串号问题，走一次网络 IO
    var query = new AV.Query(TestObject);
    query.get('54b625b7e4b020bb5129fe04', {
      success: function(obj) {
        assert.equal(obj.get('foo'), 'bar');
        res.success({reqUser: req.user, currentUser: AV.User.current()});
      }, error: function(err) {
        res.success({reqUser: req.user, currentUser: AV.User.current()});
      }
    })
  }, Math.floor((Math.random() * 2000) + 1));
});

AV.Cloud.beforeSave("TestReview", function(request, response){
	if (request.object.get("stars") < 1) {
		response.error("you cannot give less than one star");
	} else if (request.object.get("stars") > 5) {
		response.error("you cannot give more than five stars");
	} else {
		var comment = request.object.get("comment");
		if (comment && comment.length > 140) {
			// Truncate and add a ...
			request.object.set("comment", comment.substring(0, 137) + "...");
		}
		response.success();
	}
});

AV.Cloud.beforeSave("ErrorObject", function(request, response) {
  var a = {};
  a.noThisMethod();
  response.success();
})

AV.Cloud.afterSave("TestReview", function(request) {
	var testAfterSave = new AV.Object("testAfterSave");
	var review  = new AV.Object('TestReview');
	//review.id = request.object.Id;
	//testAfterSave.set("review", review);
	//testAfterSave.save();
    if (request.object.get('post') != null) {
	    var query = new AV.Query("TestPost");
	    query.get(request.object.get("post").id, {
	    	success: function(post) {
	    		post.increment("comments");
	    		post.save();
	    	},
	    	error: function(error) {
	    		throw "Got an error " + error.code + " : " + error.message;
	    	}
	    });
    }
});

AV.Cloud.beforeSave('TestRemoteAdress', function(request, response) {
  request.object.set('remoteAddress', request.remoteAddress);
  request.object.save();
  response.success();
});

AV.Cloud.afterUpdate("TestObject", function(request) {
  console.log('TestObject afterUpdate invoke:', request.object);
  request.object.set('bizTime', new Date());
  request.object.save();
});

var util = require('util');
AV.Cloud.beforeDelete("Album", function(request, response) {
  query = new AV.Query("Photo");
  var album = new AV.Object('Album');
  album.id = request.object.id;
  query.equalTo("album", album);
  query.count({
    success: function(count) {
		console.log("count:"+count);
      if (count > 0) {
        response.error("Can't delete album if it still has photos.");
      } else {
        response.success();
      }
    },
    error: function(error) {
      response.error("Error " + error.code + " : " + error.message + " when getting photo count.");
    }
  });
});
AV.Cloud.afterDelete("Album", function(request) {
  query = new AV.Query("Photo");
  var album = new AV.Object('Album');
  album.id = request.object.id;
  query.equalTo("album", album);
  query.find({
    success: function(posts) {
		console.log('posts:'+posts);
		posts.forEach(function(post){
			post.destroy();
		});
    },
    error: function(error) {
      console.error("Error finding related comments " + error.code + ": " + error.message);
    }
  });
});

AV.Cloud.onLogin(function(request, response) {
  assert(request.object);
  // 因为此时用户还没有登录，所以用户信息是保存在 request.object 对象中
  console.log("on login:", request.object.get('username'));
  if (request.object.get('username') == 'noLogin') {
    // 如果是 error 回调，则用户无法登录
    response.error('Forbidden');
  } else {
    // 如果是 success 回调，则用户可以登录
    response.success();
  }
});

AV.Cloud.onVerified('sms', function(request, response) {
    if (request.object.id) {
        console.log("onVerified: sms, user: " + request.object);
		response.success();
    } else {
		response.error("no user");
    }
});

// onVerified 有无回调都没有意义
AV.Cloud.onVerified('sms', function(request) {
    if (request.object.id) {
        console.log("onVerified: sms, user: " + request.object);
    } else {
        console.error("impossible!");
    }
});

AV.Cloud.define("testSetTimeout", function(request, response) {
  setTimeout(function() {
    response.success();
  }, 3000);
});

AV.Cloud.define('testRemoteAddress', function(request, response) {
  response.success(request.remoteAddress);
});

AV.Cloud.define('infoLog', function(request, response) {
  console.log('infoLog.....');
  response.success();
});

AV.Cloud.define('errorLog', function(request, response) {
  console.error('errorLog.....');
  response.success();
});

AV.Cloud.define('thumbnailURLTest', function(req, res) {
  res.success(AV.User.current().get('avatar').thumbnailURL(100, 200));
});

AV.Cloud.define('becomeTest', function(req, res) {
  if (AV.User.current()) {
    return res.error('current user should be null');
  }
  AV.User.become(req.params.token, {
    success: function(user) {
      if (AV.User.current() != user) {
        return res.error('current user should equal become user');
      }
      res.success(user);
    }, error: function(err, e2) {
      res.error(err, e2);
    }
  });
});

AV.Cloud.define('errorCode', function(req, res) {
  AV.User.logIn('NoThisUser', 'lalala', {
    error: function(user, err) {
      res.error(err);
      // 客户端收到的响应： {"code":211,"error":"Could not find user"}
    }
  });
});

AV.Cloud.define('customErrorCode', function(req, res) {
  res.error({code: 123, message: 'custom error message'});
  // 客户端收到的响应： {"code":123,"error":"custom error message"}
});


AV.Insight.on('end', function(err, result) {
  assert.deepEqual({
    "id" : "job id",
    "status": "OK/ERROR",
    "message": "当 status 为 ERROR 时的错误消息"
  }, result);
});

console.log('global scope: test log.');

//setTimeout(function() {
//  noThisMethod();
//}, 5000)
