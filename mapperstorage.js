var MongoClient = require('mongodb').MongoClient;
var config = require('./config');
var mapper = require('./mapper');
var crypto = require('crypto');
var url = require('url');
var ObjectID = require('mongodb').ObjectID;
var BSON = require('mongodb').BSONPure;
var email = require('emailjs');

function connectToDatabase(callback) {
	MongoClient.connect("mongodb://"+config.db.host+":"+config.db.port+"/"+config.db.name, function(err, db) {
		if(err == null) {
			db.collection('jobs', function(err, collection) {
				if(err == null) {
					callback(collection);
				} else {
					console.log(err);
				}
			});
		} else {
			console.log(err);
		}
	});
}

exports.configure = function(callback) {
	connectToDatabase(function(collection) {

		var queue = [];

		var saveJob = function(job) {
			collection.update({
				_id: job._id
			},job,{
				w: 0
			});
		}
		var loadJob = function(jobid,callback) {
			collection.findOne({
				_id: jobid //new BSON.ObjectID(jobid)
			},function(err,doc){
				if (err) {
					console.log(err);
				} else if (doc) {
					callback(doc);
				}
			});
		};
		var finishJob = function(job) {
			if (job.status) {
				console.log('Job done');
				job.status = false;
				saveJob(job);

				if (job.email) {
					var server  = email.server.connect({
						user: config.smtp.user, 
						password: config.smtp.password, 
						host: config.smtp.host, 
						ssl: config.smtp.ssl,
						port: config.smtp.port
					});
					server.send({
						text:    'Your map is complete! Please visit '+config.site.domain+'/#/map/'+job._id+' to see your completed map.\n\nThanks for using SiteMapper,\nJohn', 
						from:    config.smtp.from, 
						to:      "johnjones4@gmail.com",
						subject: "Your Map of " + job.domain + " is Complete"
					}, function(err, message) { 
						if (err) console.log(err);
					});
				}
			}
		}
		var jobDone = function(jobid) {
			loadJob(jobid,function(job) {
				finishJob(job);
			});
		}
		var allJobsDone = function() {
			collection.find({
				status: true
			}).toArray(function(err,docs) {
				if (err) {
					console.log(err);
				} else if (docs) {
					docs.forEach(function(job) {
						finishJob(job);
					});
				}
			});
		}
		var newJob = function(newJobData,callback) {
			var md5sum = crypto.createHash('md5');
			md5sum.update(newJobData.domain+new Date().getTime());
			newJobData.tree = {
				name: '',
				url: newJobData.domain,
				components: []
			};
			newJobData.indexed = [];
			newJobData.status = true;

			collection.insert(newJobData,{w:1,serializeFunctions:false},function(err,result) {
				if (err) {
					console.log(err);
				} else if (result && result.length > 0) {
					callback(result[0]);
				}
			});
		}
		var uniquenesCheck = function(urlstr,jobid,callback) {
			loadJob(jobid,function(job) {
				var urlobj = url.parse(urlstr);
				var domainInQueue = false;
				for(var i=0;i<queue.length;i++) {
					if (queue[i].url.href == urlstr) {
						callback(false,true);
						return;
					}
					if (queue[i].url.host == urlobj.host) {
						domainInQueue = true;
					}
				}
				for(var i=0;i<job.indexed.length;i++) {
					//console.log(job.indexed[i] == urlstr,job.indexed[i],urlstr);
					if (job.indexed[i] == urlstr) {
						callback(false,domainInQueue);
						return;
					}
				}
				callback(true,domainInQueue);
			});
		}
		var domainInQueue = function(domain) {
			for(var i=0;i<queue.length;i++) {
				if (queue[i].url.host == domain) {
					return true;
				}
			}
			return false;
		}
		var dequeue = function(callback) {
			var next = queue.shift();
			if (next) {
				loadJob(next.jobid,function(job) {
					callback(next,job);
				});
			} else {
				callback(null,null);
			}
		}
		var enqueue = function(queueitem) {
			loadJob(queueitem.jobid,function(job) {
				queue.push(queueitem);
				job.indexed.push(queueitem.url.href);
				if (job && queueitem.url.path != '/') {
					var pathComponents = queueitem.url.path.substring(1).split('/');
					var getTreeIndex = function(tree,name) {
						if (tree.components) {
							for(var i=0;i<tree.components.length;i++) {
								if (tree.components[i].name == name) {
									return i;
								}
							}
						}
						return -1;
					}
					var lastTree = job.tree;
					for(var i=0;i<pathComponents.length;i++) {
						var index = getTreeIndex(lastTree,pathComponents[i]);
						if (index < 0) {
							index = lastTree.components.length;
							if (!lastTree.components) lastTree.components = [];
							lastTree.components.push({
								name: pathComponents[i],
								components: []
							});
						}
						lastTree = lastTree.components[index];
					}
					saveJob(job);
				}
			});
		}


		mapper.set('enqueue',enqueue);
		mapper.set('dequeue',dequeue);
		mapper.set('uniquenesCheck',uniquenesCheck);
		mapper.set('newJob',newJob);
		mapper.set('loadJob',loadJob);
		mapper.set('jobDone',jobDone);
		mapper.set('allJobsDone',allJobsDone);
		mapper.set('domainInQueue',domainInQueue);

		callback(collection);
	});
}