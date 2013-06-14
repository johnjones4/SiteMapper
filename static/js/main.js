requirejs.config({
	baseUrl: 'js',
	shim: {
		'vendor/backbone': {
			deps: ['vendor/underscore','vendor/jquery'],
			exports: 'Backbone'
		},
		'vendor/underscore': {
			exports: '_'
		},
		'vendor/jquery': {
			exports: '$'
		},
		'vendor/d3': {
			exports: 'd3'
		}
	}
});

requirejs([
	'vendor/jquery',
	'views/startView',
	'views/mapTempView',
	'views/mapView',
	'models/mapModel'
],function($,
	StartView,
	MapTempView,
	MapView,
	MapModel
) {
	var activeView = null;
	var $primary = $('#primary');

	var AppRouter = Backbone.Router.extend({
		routes: {
			"map/new" : "newMap",
			"map/:id" : "showMap",
			"*actions" : "defaultRoute"
		}
	});
	var router = new AppRouter;
	var removeActiveView = function(callback) {
		if (activeView) {
			activeView.$el.addClass('done');
			setTimeout(function() {
				activeView.remove();
				callback();
			},500);
		} else {
			callback();
		}
	}
	var setActiveView = function(view,callback) {
		activeView = view;
		view.$el.addClass('will-show');
		$primary.html(activeView.$el);
		setTimeout(function() {
			view.$el.removeClass('will-show');
			if (callback) setTimeout(callback,500);
		},100);
	}
    router.on('route:showMap', function(id) {
		removeActiveView(function() {
			var map = new MapModel();
			map.id = id;
			map.fetch({
				success: function (map) {
					if (map.get('status')) {
						var view = new MapTempView({model:map});
						setActiveView(view,function() {
							view.render();
						});
					} else {
						var view = new MapView({model:map});
						setActiveView(view,function() {
							view.render();
						});
					}
				}
			})

		});
    });
    router.on('route:newMap', function() {
    	setActiveView(new StartView({model:new MapModel()}))
    });
	Backbone.history.start();

	if (!window.location.hash || window.location.hash == '') {
		window.location.hash = '#/map/new';
	}
});