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
				if ($(this).is('.ready')) {
					_this.model.set('email',$(this).find('input[type=email]').val());
					_this.model.save(null,{
						success: function(model) {
							_this.$el.find('form').addClass('complete');
						},
						error: function() {
							//TODO
						}
					});
				}
				return false;
			});
			this.$el.find('input[type=email]').keyup(function() {
				var domain = $(this).val();
				var re = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
    			if (domain.match(re)) {
    				$(this).parent().addClass('ready');
    			} else {
    				$(this).parent().removeClass('ready');
    			}
			});

			if (this.model.get('email')) {
				this.$el.find('input[type=email]').val(this.model.get('email'));
			}
		}
	});
});