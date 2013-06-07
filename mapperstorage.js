var MongoClient = require('mongodb').MongoClient;
var config = require('./config');
var mapper = require('./mapper');
var crypto = require('crypto');
var url = require('url');

function connectToDatabase(callback) {
	MongoClient.connect("mongodb://"+config.db.host+":"+config.db.port+"/"+config.db.name, function(err, db) {
		if(err == null) {
			db.collection('completed', function(err, collection) {
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
		var jobs = [];

		var loadJob = function(jobid,callback) {
			jobs.forEach(function(data) {
				if (data.id == jobid) {
					callback(data);
				}
			});
		};
		var finishJob = function(job) {
			if (job.status) {
				console.log('Job done');
				job.status = false;
				if (job.alertfn) {
					job.alertfn(job);
				}
			}
		}
		var jobDone = function(jobid) {
			loadJob(jobid,function(job) {
				finishJob(job);
			});
		}
		var allJobsDone = function() {
			jobs.forEach(function(job) {
				finishJob(job);
			})
		}
		var newJob = function(data,callback) {
			var md5sum = crypto.createHash('md5');
			md5sum.update(data.domain+new Date().getTime());
			data.id = md5sum.digest('hex');
			data.tree = {
				name: '',
				url: data.domain,
				components: []
			};
			data.indexed = [];
			data.status = true;
			jobs.push(data);
			callback(data.id);
			//console.log(jobs);
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
		var dequeue = function(callback) {
			var next = queue.shift()
			if (next) {
				loadJob(next.jobid,function(job) {
					callback(next,job);
				});
			} else {
				callback(null,null);
			}
		}
		var enqueue = function(data) {
			loadJob(data.jobid,function(job) {
				queue.push(data);
				job.indexed.push(data.url.href);
				if (job && data.url.path != '/') {
					var pathComponents = data.url.path.substring(1).split('/');
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

		callback();
	});
}