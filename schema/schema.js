var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var Schema = mongoose.Schema;

var personSchema = new Schema({
	id: String,
	provider: String,
	username: String,
	displayName: String,
	profileUrl: String,
	password: String,
	accessToken: String,
	emails: [{ value: String }]
});
personSchema.index({ username: 1 });


/*
 * Username/password code from passport-local example that uses Express3 and Mongoose.
 * 
 * I am not sure about the interaction between cookieSession, accessToken and federated logins.
 * 
 */

personSchema.pre('save', function(next) {
	var user = this;

	if (!user.isModified('password')) {
		return next();
	}

	return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) {
			return next(err);
		}

		return bcrypt.hash(user.password, salt, function(err, hash) {
			if (!err) {
				user.password = hash;
			}
			return next(err);
		});
	});
});

personSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) return cb(err);
		return cb(null, isMatch);
	});
};

// Remember Me implementation helper method
personSchema.methods.generateRandomToken = function () {
	var user = this;
	var chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	var token = new Date().getTime() + '_';
	for ( var x = 0; x < 16; x++ ) {
		var i = Math.floor( Math.random() * 62 );
		token += chars.charAt( i );
	}
	return token;
};

personSchema.statics.findOrCreate = function(id, profile, callback) {
	this.find({username: id}, function(err, response) {
		if (err) {
			callback(err);
		} else {
			if (response.length === 0) {
				var p = new Person(profile);
				p.save(function(err, succ){ 
					callback(err, [succ]);
				});
			} else {
				callback(err, response);
			}
		}
	});
};

var presentationSchema = new Schema({
	title:  String,
	author: String,
	body:   String,
	story:  String,
	date:   { type: Date, default: Date.now },
	published: Boolean
});
presentationSchema.index({ author: 1 });

var Person = mongoose.model('Person', personSchema);
var Presentation = mongoose.model('Presentation', presentationSchema);

exports.Person = Person;
exports.Presentation = Presentation;
