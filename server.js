var config = require('./config');
var mapper = require('./mapper');
var mapperstorage = require('./mapperstorage');
var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var BSON = require('mongodb').BSONPure;

var secKeys = {};

mapperstorage.configure(function(collection) {
	var app  = express();
	app.use(express.static(__dirname + '/static'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: "keyboard cat" }));

	app.post('/map',function(req, res) {
		if (req.body && req.body.domain) {
			mapper.mapSite('http://'+req.body.domain,10,function(job) {
				secKeys[job._id.toString()] = req.sessionID;
				// res.json(job);
				// res.end();
				// console.log(job._id);
				res.send(200,JSON.stringify(job));
			});
		} else {
			res.send(500,'');
		}
	});

	var jobForId = function(req,res) {
		collection.findOne({
			_id: new BSON.ObjectID(req.params.id)
		},function(err,doc){
			if (err) {
				console.log(err);
				res.send(500,'');
			} else if (doc) {
				res.send(200,JSON.stringify(doc));
			}
		});
	}

	app.put('/map/:id',function(req,res) {
		var id = req.params.id;
		if (secKeys[id] && secKeys[id] == req.sessionID) {
			var performSet = function(set) {
				collection.update({
					_id: new BSON.ObjectID(id)
				}, {
					$set:set
				},{
					w: 0
				});
			}
			if (req.body) {
				if (req.body.email) performSet({email:req.body.email});
			}
		}
		jobForId(req,res);
	});

	app.get('/map/:id',function(req, res) {
		jobForId(req,res);
	});

	app.listen(1228, function() {
	   console.log("Server started");
	});
});