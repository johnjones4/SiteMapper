define(['../vendor/jquery','../vendor/backbone','../vendor/underscore'],
	function($,Backbone,_) {
	return Backbone.View.extend({
		tagName: 'div',
		className: 'window window-standard map-temp',
		initialize: function(){
			this.render();
		},
		render: function(){
			var template = _.template($("#map_temp_template").html(),{});
			this.$el.html(template);
			var _this = this;
			this.$el.find('form').submit(function(event) {
				try{event.preventDefault()} catch(e){}
				_this.model.set('email',$(this).find('input[type=email]').val());
				_this.model.save(null,{
					success: function(model) {
						window.location.hash = '#/map/'+model.id;
					},
					error: function() {
						//TODO
					}
				})
				return false;
			});
		}
	});
});