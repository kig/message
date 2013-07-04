var schema = require('../schema/schema');

var Person = schema.Person;
var Presentation = schema.Presentation;

exports.put = function(request, response) {
	var person = request.user;
	if (!person) {
		response.writeHead(403, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
		response.end("Not logged in");
	} else {
		Presentation.find({author: person.username, _id: request.body.id}, function(err, presos) {
			//console.log(arguments, request.body);
			if (!presos || presos.length === 0) {
				presos = [new Presentation({author: person.username})];
			}
			presos[0].body = request.body.body;
			presos[0].story = request.body.story;
			presos[0].published = request.body.published;
			presos[0].title = request.body.title;
			presos[0].save(function(err, obj) {
				if (err) {
					response.writeHead(500, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
					response.end("Failed to save");
					console.log(err);
				} else {
					//console.log(obj);
					response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
					response.end(JSON.stringify(obj));
				}
			});
		});
	}
};

exports.get = function(request, response) {
	var person = request.user;
	Presentation.find({_id: request.query.id}, function(err, presos) {
		if (err) {
			response.writeHead(500, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
			response.end("Failed to get");
			console.log(err);
		} else if (presos.length === 0 ) {
			response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
			response.end("Presentation not found");
		} else if ((!person || presos[0].author.toString() !== person.username.toString()) && 
				   !presos[0].published) {
			response.writeHead(403, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
			response.end("This presentation is not published");
		} else {
			//console.log('/presentation/get', presos);
			response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
			response.end(JSON.stringify(presos[0] || null));
		}
	});
};

exports.list = function(request, response) {
	var person = request.user;
	response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
	var q;
	if (person && request.query.person == person.username) {
		q = {author: request.query.person};
	} else {
		q = {author: request.query.person, published: true};
	}
	Presentation.find(q, function(err, presos) {
		var arr = presos.map(function(p){
			return {title: p.title, id: p._id, published: p.published, date: p.date};
		});
		response.end(JSON.stringify(arr));
	});
};

exports.delete = function(request, response) {
	var person = request.user;
	Presentation.find({_id: request.body.id, author: person.username}, function(err, presos) {
		for (var i=0; i<presos.length; i++) {
			presos[i].remove();
		}
		response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
		response.end(JSON.stringify({deleted: presos.length}));
	});
};


