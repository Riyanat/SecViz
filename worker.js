(function() { worker = 
	{
		setKeys: function(target, source)
		{
			var nodeKeys = {}; 	
			nodeKeys["target"] = (target == undefined)? "Target IP"+":" : target + ":";
			nodeKeys["source"] = (source == undefined)? "Destination IP"+":" : source + ":";
			
		
			return nodeKeys;
		},
		
	    // Lazily construct the package hierarchy from class names.
    	root:function (classes, nodeKeys)
    	{
			var map = {},	
				source_key = nodeKeys["source"].replace(":","."),
				target_key = nodeKeys["target"].replace(":", ".");

			classes.forEach(function(d) {

	        find(d.name, d);
	        });

      		return map[""];
    	
    
		    function find(name, data)
		    {
		     	var node = map[name], i;
		 		if (!node)
		 		{
		          node = map[name] = data || {name: name, children: []};
		          if (name.length)
		          {
		            node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
		            node.parent.children.push(node);
		            node.key = name.substring(i + 1);
					
					var label = (($.trim(node.key.replace(/\[[^\]]*\]|\([^\)]*\)/g,""))));
					label = label.replace(/([^\.]*)\./, "").split(" ");
		       		
		       		if (label.length>1){
		       			label = label[0] + " " + label[1];
		       		}else {
		       		label = label[0];
		       		}
		            	
		            node.label = label;
		            node.type = "source";
		           }
		        }
		       
		      return node;
		      }
			  

		},  
		
	    // Return a list of imports for the given array of nodes.
		imports:function (nodes)
		{
			var map = {},
          		imports = [];
      		// Compute a map from name to node.
      		nodes.forEach(function(d) {
      			map[d.name] = d;
      		});

			// For each import, construct a link from the target to source node.
			nodes.forEach(function(d) {
				if (d.imports) d.imports.forEach(function(i) {
					imports.push({target: map[d.name], source: map[i.name], type:"source"});
				});
			});
			/// Add a 3rd Object here. for value
 	 		return imports;
		},
    	
		getTimeRange : function(json) {
			var min = json[0].startTime;
			var max = json[0].startTime;
			
			for (var i = 1; i < json.length; i++) {
				min = Math.min(min, json[i].startTime);
				max = Math.max(max, json[i].startTime);
			}
			
			return [min, max];
		},
		
    	getPairs: function (json, nodeKeys)
		{
			var fdata = [];
			var data = [],
				sourceList = [],
				sourceClassList = [],
				targetClassList = [],
				targetList = [],
				setSource = {},
				setTarget = {},
				targetMatch = [],
				countTargetNodes = {},
				target_sourceMatch = [],
				allTags = [],
				eachTag = [],
				imports = [],
				limit = 2000,
				//limit = json.length,
				
				connections = [],
				
				//if nodekeys is not null
				source_key = nodeKeys["source"],
				target_key = nodeKeys["target"],
				
				//else set default	  
				source_Classkey = undefined,
				target_ClassKey = "Classification:";
					  
		  	allTagObjects = {};
			taglist = {};
	
			//STEP 1: Extract Source and Target List of Interest from Tags
			// There should be a passible element with all the possible field tags.
			for (i = 0; i < limit; i++)
			{
				
				allTags = json[i].tags;

				for (j = 0; j<allTags.length; j++)
				{
			
					taglist[allTags[j].split(":")[0]] = "true";
					//Get Target and Source Tags
					if (allTags[j].search(source_key) != -1){
						sourceList[i] = $.trim((allTags[j].replace(source_key, "")));
						
					
					}else if (allTags[j].search(target_key) != -1){
						targetList[i] = $.trim((allTags[j].replace(target_key, "")));
						if (countTargetNodes[targetList[i]] != undefined) {
							
							countTargetNodes[targetList[i]] =  countTargetNodes[targetList[i]]+1;
							
						}
						else {
							
							countTargetNodes[targetList[i]]  =  1;
						}
					//Get Target and Source Super Classes if available
					}else if (target_ClassKey != undefined && allTags[j].search(target_ClassKey) != -1){
						targetClassList[i] = $.trim((allTags[j].replace(target_ClassKey, "")))
						targetClassList[i] = targetClassList[i].replace(".", "");
					}		   
			   		allTagObjects[$.trim(allTags[j].split(":")[0])] = $.trim(allTags[j].split(":")[1]); 
		 		}		
		
				setSource[sourceList[i]] = (!sourceClassList[i])? "" : sourceClassList[i];			
				
				setTarget[targetList[i]] = (!targetClassList[i])? "" : targetClassList[i];
				
				
				data.push(allTagObjects);
				allTagObjects = {};
			}

			 sourceList = [];
			 targetList = [];
			 
			
			 for (source in setSource){
			 	sourceList.push(source);
			 }
			 for (target in setTarget){
			 	targetList.push(target);
			 }
			//STEP 2: Extract Pairs of Targets and Sources from Data
			// Do this per Target
			var totalSize = 0;		
			
			sourceList.forEach(function(source, index){
			targetMatch = data.filter(function(d){

			return d[source_key.replace(":", "")] == source;
		
			});
			
			totalSize = targetMatch.length + totalSize;
			
			for (i=0; i<targetList.length; i++)
			{
				target_SourceMatch = targetMatch.filter(function(d){
				
				return d[target_key.replace(":", "")] == targetList[i];
				
				});
				
				//Get Classname = 
				
					className = setTarget[targetList[i]].toString();
				
				
				  if (target_SourceMatch.length > 0){
				  	imports.push({name: (target_key).replace(":",".") + className + "." + targetList[i], size:target_SourceMatch.length});
				  }
				
				target_SourceMatch = [];
					
			}
	
			//(an array of objects)
			connections[index] = ({name:source_key.replace(":",".") +  source, size: targetMatch.length, ratio: 120, imports: imports}); 
			imports = [];
			
			});
					
			var index = 0;
			var targetSize = (totalSize/targetList.length) * 2;
			var count = 0;
		
			//STEP 3: for the Sake of the Visualisation restrictions in d3, we must specify all connections, hence 'connections' must contain all data.
			for (i = sourceList.length; i<targetList.length+sourceList.length; i++){
				className = setTarget[targetList[index]].toString();
				connections[i] = ({name:target_key.replace(":",".") + className + "." + targetList[index],  size: targetSize,  countSize:countTargetNodes[targetList[index]] ,ratio: 240, imports: []});
				index++;
			}
			return  connections;
			
	},	
		
	getTags: function(){
		return taglist;
	}

  };
  
})();
