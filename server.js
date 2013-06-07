var config = require('./config');
var mapper = require('./mapper');
var mapperstorage = require('./mapperstorage');
var email = require('emailjs');
var express = require('express');

mapperstorage.configure(function() {
	var app  = express();
	app.use(express.static(__dirname + '/static'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: "keyboard cat" }));

	app.get('/map/new',function(req, res) {
		if (req.query && req.query.domain) {
			mapper.mapSite('http://johnjonesfour.com',10,function(job) {
				var server  = email.server.connect({
					user: config.smtp.user, 
					password: config.smtp.password, 
					host: config.smtp.host, 
					ssl: config.smtp.ssl,
					port: config.smtp.port
				});
				server.send({
					text:    JSON.stringify(job,null,true), 
					from:    "John Jones <john@phoenix4.com>", 
					to:      "johnjones4@gmail.com",
					subject: "Your Map of " + job.domain + " is Complete"
				}, function(err, message) { console.log(err); });
			});
		} else {
			res.json(false);
		}
	});

	app.get('/map/:id',function(req, res) {
		res.send('Map with id ');
		//req.params.id
	});

	app.listen(1228, function() {
	   console.log("Server started");
	});
});