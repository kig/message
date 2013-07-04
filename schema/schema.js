var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var personSchema = new Schema({
	id: String,
	provider: String,
	username: String,
	displayName: String,
	profileUrl: String,
	emails: [ { value: String } ]
});
personSchema.index({ username: 1 });

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
