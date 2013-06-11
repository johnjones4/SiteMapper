define(['../vendor/jquery','../vendor/backbone','../vendor/underscore'],
	function($,Backbone,_) {
	return Backbone.View.extend({
		tagName: 'div',
		className: 'window window-standard start',
		initialize: function(){
			this.render();
			var _this = this;
		},
		render: function(){
			var template = _.template($("#start_template").html(),{});
			this.$el.html(template);
			var _this = this;
			this.$el.find('form').submit(function(event) {
				try{event.preventDefault()} catch(e){}
				_this.model.set('domain',$(this).find('input[type=text]').val());
				_this.model.save(null,{
					success: function(model) {
						window.location.hash = '#/map/'+model.id;
					},
					error: function() {
						//TODO
					}
				})
				return false;
			})
			this.$el.find('input[type=text]').keyup(function() {
				var domain = $(this).val();
				var re = new RegExp(/^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/); 
    			if (domain.match(re)) {
    				$(this).parent().addClass('ready');
    			} else {
    				$(this).parent().removeClass('ready');
    			}
			});
		}
	});
});