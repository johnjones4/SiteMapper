var http = require('http');
var https = require('https');
var url = require('url');
var crypto = require('crypto');

var timer = null;

var settings = {
	logger: function(level,text) {
		console.log(level+': '+text);
	},
	uniquenesCheck: function(urlObj,job) {
		console.log('NO UNIQUE CHECK SET');
	},
	enqueue: function(job,data) {
		console.log('NO ENQUEUE SET');
	},
	dequeue: function(callback) {
		console.log('NO DEQUEUE SET');
	},
	newJob: function(data,callback) {
		console.log('NO NEWJOB SET');
	},
	loadJob: function(jobid,callback) {
		console.log('NO LOADJOB SET');
	},
	jobDone: function(jobid) {
		console.log('NO JOBDONE SET');
	},
	allJobsDone: function(jobid) {
		console.log('NO ALLJOBSDONE SET');
	},
	domainInQueue: function(domain) {
		
	},
	regex: /(href="([^"]*")|(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/ig
}

var tick = function() {
	settings.dequeue(function(data,job) {
		if (data != null) {
			console.log('Checking ' + data.url.href);

			var protocol = http;
			if (data.url.protocol == 'https:') protocol = https;
			protocol.request({
				host: data.url.host,
				path: data.url.path
			},function(response) {
				//console.log(response.headers['content-type'].indexOf('text/html') == 0,response.headers['content-type']);
				if (response.headers['content-type'] && response.headers['content-type'].indexOf('text/html') == 0) {
					var str = ''
					response.on('error',function(e) {
						console.log(e);
					})
					response.on('data', function (chunk) {
						str += chunk;
					});
					response.on('end', function () {
						//console.log('Downloaded ' + str.length + ' bytes');
						var foundURLs = str.match(settings.regex);
						if (foundURLs != null) {
							//console.log('Found ' + foundURLs.length + ' URLs');
							for(var i=0;i<foundURLs.length;i++) {
								var urlstr = foundURLs[i].replace(/(href=|")/ig,'');
								if (urlstr.length > 1) {
									if (urlstr.indexOf('http') != 0) {
										if (urlstr.charAt(0) == '/') {
											urlstr = data.url.protocol+'//'+data.url.host+urlstr;
										} else {
											urlstr = data.url.href+urlstr;
										}
									}
									var urlObj = url.parse(urlstr);
									if (urlObj 
										&& urlObj.host == job.domain 
										&& urlObj.pathname.split('/').length <= job.depth 
										&& settings.uniquenesCheck(urlObj,job)) {
										
										settings.enqueue(job,{
											url: urlObj,
											jobid: job._id
										});
									}
								}
							}
						}
						if (!settings.domainInQueue(data.url.host)) {
							settings.jobDone(job._id);
						} else {
							exports.fire();
						}
					});
				} else if (!settings.domainInQueue(data.url.host)) {
					settings.jobDone(job._id);
				} else {
					exports.fire(); 
				}
			}).end();
		} else {
			//settings.allJobsDone();
		}
	});
}

exports.set = function(key,val) {
	settings[key] = val;
}

exports.mapSite = function(urlstr,depth,startedfn) {
	var urlObj = url.parse(urlstr);
	settings.newJob({
		domain: urlObj.host,
		depth: depth
	},function(job) {
		startedfn(job);
		settings.enqueue(job,{
			url: url.parse(urlstr),
			jobid: job._id
		});	
	});
	exports.fire();
}

exports.fire = function() {
	setTimeout(tick,500);
}