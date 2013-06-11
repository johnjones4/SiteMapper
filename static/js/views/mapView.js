define(['../vendor/jquery','../vendor/backbone','../vendor/underscore','../vendor/d3'],
	function($,Backbone,_,d3) {
	return Backbone.View.extend({
		tagName: 'div',
		className: 'window window-full map',
		initialize: function(){
			
		},
		render: function(){
			var template = _.template($("#map_template").html(),{});
			this.$el.html(template);
			this.doD3Render('.map',{
				width: 800,
				height: 400
			},this.model.get('tree'));
		},
		doD3Render: function(containerName, customOptions, treeData) {
			function visit(parent, visitFn, childrenFn) {
			    if (!parent) return;
			    visitFn(parent);
			    var children = childrenFn(parent);
			    if (children) {
			        var count = children.length;
			        for (var i = 0; i < count; i++) {
			            visit(children[i], visitFn, childrenFn);
			        }
			    }
			}

		    var options = $.extend({
		        nodeRadius: 5, 
		        fontSize: 12
		    }, customOptions);

		    var totalNodes = 0;
		    var maxLabelLength = 0;
		    visit(treeData, function(d) {
		        totalNodes++;
		        maxLabelLength = Math.max(d.name.length, maxLabelLength);
		    }, function(d) {
		        return d.components && d.components.length > 0 ? d.components : null;
		    });

		    var size = { width:$(containerName).outerWidth(), height: totalNodes * 15};

		    var tree = d3.layout.tree()
		        .sort(null)
		        .size([size.height, size.width - maxLabelLength*options.fontSize])
		        .children(function(d) {
		            return (!d.components || d.components.length === 0) ? null : d.components;
		        }
		    );

		    var nodes = tree.nodes(treeData);
		    var links = tree.links(nodes);

		    
		    /*
		        <svg>
		            <g class="container" />
		        </svg>
		     */
		    var layoutRoot = d3.select(containerName)
		        .append("svg:svg").attr("width", size.width).attr("height", size.height)
		        .append("svg:g")
		        .attr("class", "container")
		        .attr("transform", "translate(" + maxLabelLength + ",0)");


		    // Edges between nodes as a <path class="link" />
		    var link = d3.svg.diagonal()
		        .projection(function(d)
		        {
		            return [d.y, d.x];
		        });

		    layoutRoot.selectAll("path.link")
		        .data(links)
		        .enter()
		        .append("svg:path")
		        .attr("class", "link")
		        .attr("d", link);


		    /*
		        Nodes as
		        <g class="node">
		            <circle class="node-dot" />
		            <text />
		        </g>
		     */
		    var nodeGroup = layoutRoot.selectAll("g.node")
		        .data(nodes)
		        .enter()
		        .append("svg:g")
		        .attr("class", "node")
		        .attr("transform", function(d)
		        {
		            return "translate(" + d.y + "," + d.x + ")";
		        });

		    nodeGroup.append("svg:circle")
		        .attr("class", "node-dot")
		        .attr("r", options.nodeRadius);

		    nodeGroup.append("svg:text")
		        .attr("text-anchor", function(d)
		        {
		            return d.children ? "end" : "start";
		        })
		        .attr("dx", function(d)
		        {
		            var gap = 2 * options.nodeRadius;
		            return d.children ? -gap : gap;
		        })
		        .attr("dy", 3)
		        .text(function(d)
		        {
		            return d.name;
		        });
		}
	});
});