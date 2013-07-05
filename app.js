
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


// Set up user session cache.

var PersonCache = new (require('simple-lru-cache'))({ maxSize: 100000 });

passport.serializeUser = function(user, done) {
	PersonCache.set(user.username, user);
	done(null, user.username);
};

passport.deserializeUser = function(id, done) {
	var person = PersonCache.get(id);
	if (person) {
		done(null, person);
	} else {
		schema.Person.findOne({ username: id }, function(err, user) {
			if (err) {
				done(err);
			} else {
				PersonCache.set(user.username, user);
				done(null, user);
			}
		});
	}
};


app.get('/', routes.index);

app.get('/login', function(req, res) {
	res.end("Oops, auth failed and I have no fallback.");
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
