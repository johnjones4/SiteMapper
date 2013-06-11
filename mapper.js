var http = require('http');
var https = require('https');
var url = require('url');
var crypto = require('crypto');

var timer = null;

var settings = {
	logger: function(level,text) {
		console.log(level+': '+text);
	},
	uniquenesCheck: function(url,callback) {
		console.log('NO UNIQUE CHECK SET');
	},
	enqueue: function(data) {
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
	//regex: //ig,
	regex: /(href="([^"]*")|(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/g
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
				var str = ''
				response.on('data', function (chunk) {
					str += chunk;
				});
				response.on('end', function () {
					var urls = str.match(settings.regex);
					if (urls != null) {
						urls.forEach(function(urlstr) {
							urlstr = urlstr.replace(/(href=|")/ig,'');
							if (urlstr.length > 1) {
								if (urlstr.indexOf('http') != 0) {
									if (urlstr.charAt(0) != '/') {
										urlstr = '/'+urlstr;
									}
									urlstr = 'http://'+job.domain+urlstr;
								}
								var urlObj = url.parse(urlstr);
								if (urlObj.host == job.domain && urlObj.pathname.split('/').length <= job.depth) {
									settings.uniquenesCheck(urlstr,job._id,function(result,domainsLeft) {
										if (result) {
											settings.enqueue({
												url: urlObj,
												jobid: job._id
											});
										} else if (!domainsLeft) {
											settings.jobDone(job._id);
										}
									});
								}
							}
						});
					} else if (!settings.domainInQueue(data.url.host)) {
						settings.jobDone(job._id);
					}
				});
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
		settings.enqueue({
			url: url.parse(urlstr),
			jobid: job._id
		});	
	});
	exports.start();
}

exports.start = function() {
	if (!timer) {
		timer = setInterval(tick,500);
	}
}

exports.stop = function() {
	if (timer) {
		clearInterval(timer);
	}
}