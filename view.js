 d3.json("itoc_snort.json", function(json) {
	
	
	//Main Screen Elements
	var w = window.outerWidth,
		h = window.outerHeight,
		wPadding = w * 0.05;
		hPadding = h * 0.05;
		headerSpace = 80;
		textSpace = 100;
		$content = $("#chart"),
		vis = d3.select("#chart").append("svg")
				.attr("width", w - wPadding)	
			    .attr("height", h - hPadding - headerSpace)
			    .attr("align", "center");
	
	//Radial vis Elements	    
	var radialView,
		source,
		target,
		connection,
		links,
		
		r = Math.min((w - wPadding)/2, (h - hPadding - headerSpace - textSpace)/2),
    	rScale = 3;
		outerRadius = r - 0,
		innerRadius = r - 40,
		toDeg = 57.29,
    	toRad = 12;	
	
    	
    var rRange,
    	rmin,
    	rmax;
    	
	 
    //Visual Variables	 	
    var arc = d3.svg.arc()
		    .startAngle(function(d) { return d.x;})
		    .endAngle(function(d) { return d.x + d.dx; })
		    .innerRadius(function(d) { return innerRadius; })
		    .outerRadius(function(d) { return outerRadius; }),
		
		//Partitioning for all links
		partition = d3.layout.partition()
		    .sort(function(a, b){return b.value - a.value})
		    .size([(Math.PI * 2),r])
		    .value(function(d) {return d.size;}),
	
    	//Paritioning for target Elements
		target_partition = d3.layout.partition()
		    .sort(function(a, b){return b.value - a.value})
		    .size([(Math.PI * 2) * (2/3),r])
		    .value(function(d) {return d.size;}),
		
		//Partitioning for Source Elements    
		source_partition  = d3.layout.partition()
		    .sort(function(a, b){return b.value - a.value})
		    .size([(Math.PI * 2) * (1/3),r])
		    .value(function(d) {return d.size;}),
		    
		line = d3.svg.chord()
			.startAngle(function(d) { return d.x +d.dx/2; }) 
			.endAngle(function(d) { return  d.x +d.dx/2; })
			.radius(r - 45);
	
	
	//Streamgraph Elements	
	var streamView,
		stack,
		Info,
		area,
		streamline,
		streamData;

	//Radial View Elements
	var sourceNodes,
		targetNodes,
		connectLinks;
		
	var title = $("<div center = 'align' class = 'chart-title'>Radial Visualisation of the ITOC Snort Dataset</div>");
	
	var timeRange;
	
	//General Visual Variables
	var color = d3.scale.category20(),
		rangeColor,
		valueColor,
		highlightColor;
	

		formatRadialData("Reason", "IPSource");
		radialRender();
		initConfigPanel();
		
	
	function stash(d)
	{
	  d.x0 = d.x;
	  d.dx0 = d.dx;
	}
		
		// Interpolate the arcs in data space.
	function arcTween(a) 
	{
	  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
	  	return function(t) {
		    var b = i(t);
		    a.x0 = b.x;
		    a.dx0 = b.dx;
		    return arc(b);
		};
	}

	function formatRadialData(targetTag, sourceTag)
	{
		//Data Partitioning
		var nodekeys = worker.setKeys(targetTag, sourceTag),
			linkData =  worker.getPairs(json, nodekeys),
			sourceData = jQuery.extend(true, [], linkData),
			targetData = jQuery.extend(true, [], linkData),
			
			
			nodes = partition.nodes(worker.root(linkData, nodekeys)),
			
		classList = [];
		timeRange = worker.getTimeRange(json);

		classList[0] = (nodekeys.source).replace(":", "");
		classList[1]= (nodekeys.target).replace(":", "");
				
		var sourceData = sourceData.filter(function(d){
									return d.name.search(classList[0]) != -1;
									});
									
			targetData = targetData.filter(function(d){
									return d.name.search(classList[1]) != -1;
									});
			
			sourceNodes = source_partition.nodes(worker.root(sourceData, nodekeys)),
			targetNodes = target_partition.nodes(worker.root(targetData, nodekeys)),
			connectLinks = worker.imports(nodes);
			
					//Circle Scaling for target nodes	
			rmax = d3.max(targetNodes, function(d){return d.countSize;});
			rmin = d3.min(targetNodes, function(d){return d.countSize;});
			rRange = d3.scale.linear().domain([rmin,rmax]).range([1,10]);
	}
	
	function radialRender()
	{
		
		radialView = vis.append("g")
		  	.attr("id", "radialView")
		  	.attr("class", "radial")
		  	.attr("transform", "translate(" + w/2 + "," + (r + headerSpace) + ")");
  	
		source = radialView.data(sourceNodes).selectAll("g.source")
				.data(sourceNodes)
    			.enter().append("g")
				.attr("class", "source")
				.attr("transform", "rotate(-60)");

		source.append("path")
				.attr("d", arc)
				.attr("class", "sourceNodes")
				.attr("id", function(d){return "node" + d.name;})
				.each(stash)
				.on("mouseover", fade(0))
				.on("mouseout", fade(1))
				.style("cursor", "pointer")
				.append("svg:title")
       			.text(function(d) {return d.name + "\nCount: " + d.size});		
       	
       	target = radialView.selectAll("g.target")
       			//.data(targetNodes)
				.data(targetNodes.filter(function (d){return (!d.children);}))
				.enter().append("g")
				.attr("class", "target")
				.attr("transform", function(d)
				{
					if ((d.x*toDeg + (d.dx*toDeg/2))<120)
					{
					  	return "rotate(" + ((d.x*toDeg + (d.dx*toDeg/2))-30)+ ")translate(" + innerRadius + ")"; // this should be radius
					}else{
				  	return "rotate(" + ((d.x*toDeg + (d.dx*toDeg/2))-30)+ ")translate(" + innerRadius + ") rotate(180)"; //this should be radius
					}
				});
		
		target.append("circle")
	      		.attr("class", "targetNodes")
	      		.attr("r", rScale)
	      		.style("fill", function(d,i) { return color(d.parent.key);} )
	      		.append("svg:title")
       			.text(function(d) {return d.parent.key;});		      
		
		
			
		target.append("text")
				.text(function(d){
				var remove = d.name.split(".",2).join(".");
				var label = d.name.substring(remove.length+1, remove.length+15);
				return label;})
				.attr("class", "labels")

				.attr("dx", function (d){return ((d.x*toDeg + (d.dx*toDeg/2))<120)? "10":"-10";})
				.attr("dy", ".5em")
				.attr("text-anchor", function (d){return ((d.x*toDeg + (d.dx*toDeg/2))<120)? "start":"end" 	})
				
				.on("mouseover", link_fade(0))
				.on("mouseout", link_fade(1))
				.append("svg:title")
       			.text(function(d) {return d.key;});;	
			
				
		connection = radialView.selectAll("g.connection")
				.data(connectLinks).enter().append("g");
		
		
		connection.append("path")
		      	.attr("class", "link")
		      	.attr("d", line)
		      	.attr("transform", "rotate(60)");
	}
   
   
   function updateRadial(){
  
   //remove arc
	source.data([]).exit().remove();
	target.data([]).exit().remove();
	connection.data([]).exit().remove();
	
	///redraw arc
	radialRender();	
   }
   
	

	function updateStream()
	{
		var transitionData = "";
		return function(g, i) 
		{
		//var focus = g.name).replace(":";
		var tag = ((g.name).split(".")[0]);
		console.log(g.name, tag);
			transitionData = streamWorker.getEntities(json, undefined ,tag ,undefined, g.name);
			

		stack = d3.layout.stack().offset("wiggle").values(function(d){return d;});
	
		var transInfo = stack(transitionData);
					
		vis.selectAll(".streampaths") //selects everything and transitions between two states
			.data(transInfo)
			.transition()
			.duration(3000)
			.attr("d", area);
		};	
	}

	function link_fade(opacity)
	{
		return function (g,i)
		{
			vis.selectAll(".link")
			.filter(function(d){return d.source.name != g.name})
			.transition()
				.duration(1000)
				.style("opacity", opacity);
		}	
	}
	
	
	function fade(opacity)
	{
		return function(g, i)
		{
			vis.selectAll(".link")
			.filter(function(d){return d.target.name != g.name})
		    .transition()
		    	.duration(1000)
		  .style("opacity", opacity);
		  
		};
	}
	
	function remove(){
		return function(g, i)
		{
			radialView.selectAll(".source")
			.filter(function(d){return d.name == g.name})
			.remove();
		  
		};
		
	}
		
    function initConfigPanel()
	{
		

		

			var configPanel = $("<div class = 'config-panel'></div>)");
			
						
			var configPanelContainer = $("<div class = 'config-panel-container'></div>");
			
			var targetContainer = $("<div class = 'target-config-panel'><br/><br/> Target Options</div>"),
				
				targetTagWrp = $("<div class = 'target-config-panel'> Tag </br><select class= 'config-panel-item'></select></div>"),
				
				targetSelectTag = targetTagWrp.find("select"),
				
				targetColorWrp = $("<div class = 'target-config-panel'> Color </br><select name = 'color' class = config-panel-item>" + 
									"<option value = 'on' selected = 'selected'>On</option>" + 
									"<option value = 'off'> Off</option>" + 
									"</select></div>"),
					
					
									
				targetSizeWrp = $("<div class = 'target-config-panel'> Size </br><select name = 'size' class = config-panel-item>" + 
									"<option value = 'on'> On</option>" + 
									"<option value = 'off' selected = 'selected'> Off</option>" + 
									"</select></div>");

				
			var sourceContainer = $("<div class = 'source-config-panel'><br/>Source Options<br/></div>"),
				
				sourceTagWrp = $("<div class = 'source-config-panel'> Tag </br><select class= 'config-panel-item'></select></div>"),
				
				sourceSelectTag = sourceTagWrp.find("select"),
							
				sourceColorWrp = $("<div class = 'source-config-panel'> Color </br><select name = 'color' class = config-panel-item>" + 
									"<option value = 'on'>On</option>" + 
									"<option value = 'off' selected = 'selected'> Off</option>" + 
									"</select></div>") ,
									
				sourceSizeWrp = $("<div class = 'source-config-panel'> Size </br><select name = 'size' class = config-panel-item>" + 
									"<option value = 'on'> On</option>" + 
									"<option value = 'off'>Off</option>" + 
									"</select></div>");
				
				tgs = worker.getTags();
				for (t in tgs) {
					var opt = $('<option value="'+t+'">'+t+'</option>');
					sourceSelectTag.append(opt);				
				}
				
				for (t in tgs) {
					var opt = $('<option value="'+t+'">'+t+'</option>');
						targetSelectTag.append(opt);	
				}	
				
				
				sourceSelectTag.change(function()
				{					
					formatRadialData($(targetSelectTag).val(), $(this).val());
					updateRadial();
					
				});
				
				
				targetSelectTag.change(function(){
					formatRadialData($(this).val(), $(sourceSelectTag).val());
					updateRadial();
					
				});
				
				sourceselectColor = sourceColorWrp.find("select");
				sourceselectColor.change(function(){
					 if ($(this).val()== "on")
					 {
					 	
					 	d3.selectAll(".sourceNodes")
					 		.style("fill", function(d){return color(d.name);})
					 		.transition()
					 		.duration(2500);
					 		
					 	d3.selectAll(".link")
					 		.style("stroke", function(d){return color(d.target.name);})
					 		.transition()
					 		.duration(2500)
					 		
					 		
					 }else{
					 	d3.selectAll(".sourceNodes")
					 		.style("fill", "#3182bd")
					 		.transition()
					 		.duration(2500);
					 		
					 	d3.selectAll(".link")
					 		.style("stroke", "#3182bd")
					 		.transition()
					 		.duration(2500);
					 }
				});
				
				
				
				sourceselectSize = sourceSizeWrp.find("select");
				sourceselectSize.change(function(){
					if ($(this).val() == "on"){						
				 	
				  radialView.selectAll(".sourceNodes")
				 			.data(source_partition.value(function(d){return d.size; }))
							.transition()
							.duration(2500)	
							.attrTween("d", arcTween);
							
					//connection.selectAll
					}
					
				if ($(this).val() == "off") {											
				radialView.selectAll(".sourceNodes").data(source_partition.value(function(d) { return d.ratio; }))
							//source.style("fill", function(d){console.log(d)})
							.transition()
							.duration(2500)	
							.attrTween("d", arcTween);
				//connection.selectAll
				}
					
				});
				
				
				
				targetselectColor = targetColorWrp.find("select");
				targetselectColor.change(function(){
					 if ($(this).val()== "on")
					 {
					 	
					 	d3.selectAll(".targetNodes")
					 		.style("fill", function(d){return color(d.parent.key);})
					 		.transition()
					 		.duration(2500);
					 		
					 	
					 			
					 }else{
					 	
					 	d3.selectAll(".targetNodes")
					 		.style("fill", "#3182bd")
					 		.style("stroke", "none")
					 		.transition()
					 		.duration(2500);
					
					 }
				});
				
				
				
				targetselectSize = targetSizeWrp.find("select");
				targetselectSize.change(function(){
					 if ($(this).val()== "on")
					 {
					 d3.selectAll(".targetNodes")
					 .attr("r", function(d){
					 	return rRange(d.countSize);})
					 .transition()
					 .duration(1500);
					 }else {
					 d3.selectAll(".targetNodes")
					 .attr("r", 4.5)
					 .transition()
					 .duration(1500);	
					 }
				});
		
			
			
		targetContainer.append(targetTagWrp);
		targetContainer.append(targetColorWrp);
		targetContainer.append(targetSizeWrp);
		
		sourceContainer.append(sourceTagWrp);
		sourceContainer.append(sourceColorWrp);
		sourceContainer.append(sourceSizeWrp);
		
		
		//streamContainer.append(streamLayoutWrp);
		
		configPanelContainer.append(sourceContainer);
		configPanelContainer.append(targetContainer);
		
						
		//configPanel.append(configPanelToolbar);
		configPanel.append(configPanelContainer);
		var startDate = new Date(timeRange[0]);
		var endDate = new Date(timeRange[1]);
		
		var subtitle =  $("<p class = 'small'>" + formatDate(startDate) + " - " + formatDate(endDate) + "</p>");
		var ref = $("<p class = 'small'><a href = 'http://www.usma.edu/crc/sitepages/datasets.aspx'>Raw dataset Here</a></p>");
	
		title.append(subtitle);
		title.append(ref);
		$content.append(title);
		$content.append(configPanel);	
		}
		
		
		
	function formatDate(date) {
		days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
		month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		
		stringDate = days[date.getDay()] + ", " + date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
		return stringDate;
	}
 	
 });
 