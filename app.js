
// Set up the server globals.

var config = require('./config');

// Require dependencies.

var express = require('express');
var routes = require('./routes');
var presentation = require('./routes/presentation');
var schema = require('./schema/schema');
var http = require('http');
var path = require('path');
var doT = require('express-dot');
var connect = require('connect');
var mongoose = require('mongoose');
var passport = require('passport');
var stylus = require('stylus');

var LocalStrategy = require('passport-local').Strategy;

// Connect to the MongoDB server.
mongoose.connect(config.mongodb_server);


// Set up the app server.
var app = express();

// all environments
app.set('port', config.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'dot');
app.engine('dot', doT.__express);
app.use(express.logger('dev'));
app.use(connect.compress());
app.use(stylus.middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieSession({
	secret: config.sessionSecret,
	maxAge: new Date(Date.now() + 14*24*3600*1000)
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.csrf());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}


// Set up authentication strategies for Passport.js

var passportAuth = function(accessToken, refreshToken, profile, done) {
	profile.username = profile.provider + '-' + profile.id;
	schema.Person.findOrCreate(profile.username, profile, function(err, user) {
		if (err) { 
			done(err);
		} else {
			done(null, user[0]);
		}
	});
};

var passportProvider = function(app, provider, opts) {
	app.get('/auth/'+provider+'', passport.authenticate(provider, opts));
	app.get('/auth/'+provider+'/callback',
			passport.authenticate(provider, {
				successRedirect: '/',
				failureRedirect: '/login'
			}));
};

var ensureAuthenticated = function(req, res, next) {
	if (req.isAuthenticated()) { 
		next(); 
	} else {
		res.redirect('/login');
	}
};

for (var provider in config.auth) {
	var p = config.auth[provider];
	p.args.callbackURL = config.server+'/auth/'+provider+'/callback';
	passport.use(new p.strategy(p.args, passportAuth));
	passportProvider(app, provider, p.authenticateOptions);
}

passport.use(new LocalStrategy(function(username, password, done) {
	schema.Person.findOne({ username: username }, function(err, user) {
		if (err) { return done(err); }
		if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
		user.comparePassword(password, function(err, isMatch) {
			if (err) return done(err);
			if(isMatch) {
				return done(null, user);
			} else {
				return done(null, false, { message: 'Invalid password' });
			}
		});
		return null;
	});
}));


// Set up user session cache.

var PersonCache = new (require('simple-lru-cache'))({ maxSize: 100000 });


var createAccessToken = function (user, done) {
	var token = user.generateRandomToken();
	schema.Person.findOne( { accessToken: token }, function (err, existingUser) {
		if (err) {
			return done( err );
		}
		if (existingUser) {
			createAccessToken(user, done); // Run the function again - the token has to be unique!
		} else {
			user.set('accessToken', token);
			user.save( function (err) {
				if (err) return done(err);
				PersonCache.set(user.get('accessToken'), user);
				return done(null, user.get('accessToken'));
			});
		}
		return null;
	});
};

passport.serializeUser = function(user, done) {
	//done(null, user.username);
	if ( user._id ) {
		createAccessToken(user, done);
	}
};

passport.deserializeUser = function(id, done) {
	var person = PersonCache.get(id);
	if (person) {
		done(null, person);
	} else {
		schema.Person.findOne({ accessToken: id }, function(err, user) {
			if (err) {
				done(err);
			} else {
				if (user) {
					PersonCache.set(user.accessToken, user);
				}
				done(null, user);
			}
		});
	}
};


app.get('/', routes.index);

var querystring = require('querystring');

app.get('/login', function(req, res) {
	res.render('login', { user: req.user, message: req.query.message, _csrf: req.session._csrf });
});

app.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) {
			return res.redirect('/login?message='+querystring.escape(info.message));
		}
		return req.logIn(user, function(err) {
			if (err) { return next(err); }
			return res.redirect('/');
		});
	})(req, res, next);
});

app.get('/register', function(req, res) {
	res.render('register', { user: req.user, message: req.query.message, _csrf: req.session._csrf });
});

app.post('/register', function(req, res, next) {
	schema.Person.findOne({ username: req.body.username }, function(err, user) {
		if (err) { return next(err); }
		if (!user) {
			var newUser = new schema.Person({
				username: req.body.username,
				password: req.body.password
			});
			return newUser.save(function(err, user) {
				if (err) return next(err);
				return req.logIn(user, function(err) {
					if (err) { return next(err); }
					return res.redirect('/');
				});
			});
		} else {
			return res.redirect('/register?message='+querystring.escape('Username already exists'));
		}
	});
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/presentation/list', presentation.list);
app.get('/presentation/get', presentation.get);
app.post('/presentation/put', presentation.put);
app.post('/presentation/delete', presentation["delete"]);


var httpServer = http.createServer(app);

httpServer.timeout = 3000;
httpServer.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
