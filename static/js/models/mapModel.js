define(['../vendor/backbone'],function(Backbone) {
	return Backbone.Model.extend({
		urlRoot: '/map',
		idAttribute: '_id',
		defaults: {
			email: '',
			domain: ''
		},
		initialize: function(){
			
		}
	});
});