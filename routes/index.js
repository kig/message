
/*
 * GET home page.
 */

var config = require('../config');
var bundle = require('../bundle_versions');

var authProviders = [];
for (var p in config.auth) {
	authProviders.push(p);
}

exports.index = function(req, res){
	res.render('index', { 
		title: 'Message', user: req.user, token: req.session._csrf,
		production: process.env.NODE_ENV === 'production',
		authProviders: authProviders,
		appVersion: bundle.appVersion,
		libVersion: bundle.libVersion,
		cssVersion: bundle.cssVersion
	});
};
