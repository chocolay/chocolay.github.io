!function() {
 var div_id = "#VisualMapper",
	 outputfilename = "output_saved.json",    

     //the name used to specify children in a tree                    
	 childname = "properties", 	

input1name = "/postapps/link2trees/data/input2.json",
input2name = "/postapps/link2trees/data/input3.json",


	//the namespace that'll contain the two object trees and some convenience variables
     VM = {    
	     outputfile : outputfilename,
         m: {  //pixel sizes for the graphics: top, right, bottom, width, left 
			   //height will be determined by the size of the tree
             t: 20,
             r: 120,
             b: 20,
             w: 500,
             l: 20
         }
     },
     width     = VM.m.w - VM.m.r - VM.m.l,
     barHeight = 30,  
     barWidth  = width * 0.9, 
     duration  = 500,  //time scale for animations 
     offset    = 460, //distance, in pixels, to right tree
     openline  = false, //a toggle to track whether a line has been started                           

	//built-in function to create a tree layout
	//this one is used to hide the variables when the tree is collapsed
	//it doesn't contain any objects that correspond to hidden rectangles                               
	 tree = d3.layout.tree()   
     	.nodeSize([0, barHeight])
     	.children(function(obj) {
         	var k = d3.keys(obj[childname]),  
             	v = d3.values(obj[childname]);
         		v.map(function(el, i) {
             		el.name = k[i]
         		});
         		return v
        }),  

	 // we sometimes need a full list of all the objects
	 // including the ones that were hidden
	 // so we use this to keep track of the full set
     treeAll = d3.layout.hierarchy()    
     	.children(function(obj) {
         	var k = d3.keys(obj[childname]   || obj._properties),
             	v = d3.values(obj[childname] || obj._properties);
         	v.map(function(el, i) {
            	el.name = k[i]
         	});
         	return v
     	}),

	//attach an svg to the DOM 
     svg = d3.select(div_id)
     .append("svg")
     .attr({
		"id"     : "svgContainer",
         "width" : 2 * VM.m.w
      }),      

	//create a colorscale that varies from top to bottom
     colorscale = d3.scale.linear()
     .domain(d3.range(0, 1200, 150))
     .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"])
     .interpolate(d3.interpolateHcl);      

//create the two svg groups that will be used to hold each tree structure
 VM.S = {
     "right": svg.append("g")
         .attr({
             "id": "right",
             "transform": "translate(" + (VM.m.l + offset) + "," + VM.m.t + ")"
         }),
     "left": svg.append("g")
         .attr({
             "id": "left",
             "transform": "translate(" + VM.m.l + "," + VM.m.t + ")"
         })
 };
     

 VM.bindings = []; //will hold an array of all the bindings between the two trees
 VM.boxInput = {}; //will hold the entry from the table
 VM.maxNodes = {}; //used to structure the height of the trees
 VM.maxNodes.left = 0; //needed to keep track of how tall the trees will be
 VM.maxNodes.right = 0;
                          
//the line that gets dragged, before a path is in place   
 d3.select("svg").append("path")
	.attr("id","VMtempline");  
 VM.templine = [];  


//create the table
 d3.select(div_id)
     .append("div")
     .attr("id", "VMtableDiv");

//create a convenience checkbox so that all fields in the table can be highlighted
 d3.select("#VMtableDiv") 
     .append("input")
     .attr({
         "type" : "checkbox",
         "id"   : "VMcheckall"
     })
     .style({
         "position" : "relative",
         "left"     : "60px"
     })
	//behavior when the checkbox changes
     .on("change", function() {  
         if (d3.select(this)
             .property("checked")) { //when the box is checked, highlight the fields
             d3.selectAll("#VMtable tr:not(#VMhead)")
                 .attr("class", "highlighted")
                 .style("background-color", "rgb(230,138,128)")
         } else     //if the box is unchecked, turn off the highlighting
             d3.selectAll("#VMtable tr:not(#VMhead)")  
             .style("background-color", function(d, i) {
                 return i % 2 ? "#e5e5e5" : "#fdfdfd"
             })
             .attr("class", "")
     });

//insert the label "highlight all"  next to the checkbox
 d3.select("#VMtableDiv")  
     .insert("text", "#VMcheckall")
     .text("highlight all")
     .attr("id", "VMselectboxtext")
     .style({
         "font-size" : "200%",
         "position"  : "relative",
         "left"      : "60px"
     });
     
//attach a table to the DOM
 VM.table = d3.select("#VMtableDiv")
     .append("table")
     .attr("id", "VMtable")
     .style("margin","0px 60px");
  
//insert the header row for the table
 VM.table.append("thead")
     .append("tr")
     .attr("id", "VMhead")
     .selectAll("th")
     .data(["Source Field", "Target Field"])
     .enter()
     .append("th")
     .text(function(field) {return field});        

//button for deleting the highlighted rows
 d3.select("#VMtableDiv")
     .insert("button", "table")
     .attr("id", "rowDelete")
     .style({
         "position"  : "relative",
         "left"      : "100px",
         "font-size" : "110%"
     })
     .text("Delete highlighted maps in table");
//end table
                 
	//attach the save-file behavior funciton to the #VMSave button
	d3.select("#VMsave")
		.on("click",VM_save);      

	//attach the remove-highlighting behavior to the #rowDelete button 
 	d3.select("button#rowDelete")
		.on("click", rmButton); 
		
	//attach the  keyboard behavor function to the DOM   
 	d3.selectAll("body:not(input)")
		.on("keydown", keyfn);

	//drag behavior used for creating the line
	var drag = d3.behavior.drag()
	.origin(function(d) {return d})
	.on("drag",    dragmove)
  	.on("dragend", dragend);

     //queueing function for loading two separate files  that can be accessed within one callback function
         function n(n) {
             function u() {}

             function e() {
                 for (; i = a < c.length && n > p;) {
                     var u = a++,
                         e = c[u],
                         o = t.call(e, 1);
                     o.push(l(u)), ++p, e[0].apply(null, o)
                 }
             }

             function l(n) {
                 return function(u, t) {
                     --p, null == s && (null != u ? (s = u, a = d = 0 / 0, o()) : (c[n] = t, --d ? i || e() : o()))
                 }
             }

             function o() {
                 null != s ? m(s) : f ? m(s, c) : m.apply(null, [s].concat(c))
             }
             var r, i, f, c = [],
                 a = 0,
                 p = 0,
                 d = 0,
                 s = null,
                 m = u;
             return n || (n = 1 / 0),
                 r = {
                     defer: function() {
                         return s || (c.push(arguments), ++d, e()), r
                     },
                     await: function(n) {
                         return m = n, f = !1, d || o(), r
                     },
                 }
         }
         var t = [].slice;
         "function" == typeof define && define.amd ? define(function() {
             return n
         }) : "object" == typeof module && module.exports ? module.exports = n : this.queue = n

		//read in the two json files
         queue()
             .defer(d3.json, input1name)
             .defer(d3.json, input2name)
             .await(function(error, input1, input2) {
	    
                //store the left side data 
				VM.rootLeft = input1; 
                //create the tree for the right side 
				//this function will run & then call itself to create the left side tree
            	updateTree(VM.rootRight = input2||input2.items, 'right'); 

				//create the inputs in the table for new data   
                mkInputboxes();  

				//if there are bindings already in place in a saved file, we need to identify them
				var templist = VM.allLeft.filter(function(obj) {return obj.additionalProperties})

          
				for (ij = 0; ij<templist.length; ij++) { 
					//the name of the right side for this existing binding       
					var a = templist[ij].additionalProperties.mappedTo, 
					
					//the index for that name  so we can fetch the object itself 
					rightID = VM.rightwords.indexOf(a.replace("http://jsonschema.net","").replace("#","")); 
     				templist[ij].right = VM.allRight[rightID];     
					//store this binding in the bindings array
					VM.bindings.push({
						left : templist[ij], 
						right : VM.allRight[rightID] 
					}); 
					

  					//create a binding by attaching a line onto the svg group for the leftside's object
 					var binding = d3.selectAll("g#left")
						.filter(function(d) {
							   return d == VM.bindings[VM.bindings.length - 1].left
						})
             			.insert("g", "text")
							.attr({
								"class" : "VMbinds",
								"id"    : function(d) {return d.name}
							});
					//actually create the binding line		 
					mkBinding(binding);
 
					//change the opacity of the two rectangles once the binding is created
					d3.selectAll("g#left")
             			.filter(function(d) {
                 			return d == VM.bindings[VM.bindings.length - 1].left
             			})
						.select("rect")
						.style("opacity",1);             

					d3.selectAll("g#right")
						.filter(function(d) {
							return d == VM.bindings[VM.bindings.length-1].right
						})
						.select("rect")
						.style("opacity",1);
				} //end of for loop                          
				
				//redraw the tree structure now that a binding is in place
				updateTree(VM.rootRight,'right');  

             }); //end callback from reading files

/* *********************** */

  //called when a rectangle is clicked, to create a binding
 function clickBind() {
 openline = !openline; //toggle the openline flag to determine if we're starting a new line or ending an existing one  
 
    var T = d3.select(this.parentNode)  
         .datum(), //the object associated with the rectangle that was clicked
         thisSide = d3.select(this.parentNode)
         .attr("id");    //identify if the user clicked on the left side or the right side

     if (VM.bindings.map(function(b) {return b["left"]}).indexOf(T) == -1 
			&& 
		 VM.bindings.map(function(b) {return b["right"]}).indexOf(T) == -1
		) { //if this clicked rectangle is not yet in the bindings array, do the following
         if (openline) { //start a new line 
             var bind = {};
             bind[thisSide] = T; //store the object into a new binding
             VM.bindings.push(bind);      

             d3.select(this.parentNode) //change the coloring of the clicked rectangle
                 .select("rect").attr("id","VMstartline")
                 .style("opacity", 1);

         } else { //complete the open line 
			VM.templine = []; 
			d3.select("#VMtempline").style("opacity",1e-6); //we're done creating the binding so hide the temporary line that got drawn
			  
             var index = VM.bindings.length - 1;
             if (!(thisSide in VM.bindings[index])) {//complete a line
                 VM.bindings[index][thisSide] = T; //store the rectangle's object into the bindings array
                 VM.bindings[index]["left"].additionalProperties = {
                     "mappedTo": VM.bindings[index]["right"].id
                 };
                 VM.bindings[index]["left"].right = VM.bindings[index]["right"];   
				//change the color of the clicked rectangle
                 d3.select(this.parentNode).select("rect").style("opacity", 1);
 
      			//attach the brand new binding onto the left side rectangle                                              
       			var binding  = d3.selectAll("g#left").filter(function(d) {return d == VM.bindings[index].left})
                     	.insert("g", "text").attr({"class": "VMbinds","id": function(d) {return d.name}});
				mkBinding(binding);
				  
				//update the table
                mkTable();
             } else {
                 //clicked on same side as the existing open line so instead initiate a newline 
				d3.select("#VMstartline").style("opacity",0.25);
                d3.select(this.parentNode)
                     .select("rect").attr("id","VMstartline")
                     .style("opacity", 1);  
				 //store the new line information in the bindings array 
                 VM.bindings[VM.bindings.length - 1][thisSide] = T;    
				//toggle the openline variable now that it's started
                 openline = !openline;
             }
         } //end completing the line
     } else { //clicked on a rectangle that already is bound to something else so reset the openline toggle
         openline = !openline;
     }
 };//end function
   
  //hide the rectangles when they are clicked away by
  //temporarily changing the name of the property field so that they 
  //no longer get seen by the tree layout and are hidden
  //this is just standard standard practice
 function clickCollapse(d) {
     if (d[childname]) {
         d._properties = d[childname];
         d[childname] = null;
     } else {
         d[childname] = d._properties;
         d._properties = null;
     }
     updateTree(d, this.parentNode.getAttribute("id"));
 }; //end clickCollapse function

  //toggle coloring behavior based on whether there are "properties" elements below
 function color(d) {
     return d._properties ? "#31ffff" : d[childname] ? "#c6dbef" : "#fd8d3c"
 }
    
  //sets the stroke style attribute for the binding lines, i.e. the color of the line            
 function colorOrder(d) {return colorscale(d.right.x + VM.m.t)} 

  //behavior when a temporary line is no longer being dragged 
 function dragend(d) {
   if (VM.templine.length==2) {//if it winds up on a new rectangle
	d3.select("#VMtempline").style("opacity",1e-6)  //hide the line because we're done
	d3.select(this).attr("id","") 
	d3.select(this.parentNode).select("rect").style("opacity",0.25); //change the color of the rectangle where we wound up
	openline = false; VM.templine = []; VM.bindings.pop(1); //re-initialize the openline 
	}
 }; //end dragend function

  //behavior while a line is being dragged
 function dragmove(d) {
  if (openline) {   
	var side = d3.select(this.parentNode).attr("id");
	if (VM.templine.length == 0) {
		//begin a dragline    
		var posn = d3.mouse(d3.select("#svgContainer").node()), //coordinates where the line begins
			y    = +d3.select(this.parentNode).attr("transform").split(/,|\)|\s/g)[1]; //how the chosen rectangle is positioned on the page 
		VM.templine[0] =  [posn[0]>400?500+d3.select(this.parentNode).datum().depth*30:barWidth+30,y+20]; //position depends on whether we started from the left or the right      
    	}    		
   else { //the line is not open, we're completing an existing one
    VM.templine[1] =  d3.mouse(d3.select("#svgContainer").node());
	VM.templine[1] = VM.templine[1].map(function(d) {return d+5})  //find the position of the line   
    d3.select("#VMtempline")  
		.attr({"d" : d3.svg.line()(VM.templine)}) //shape the line that is being dragged
   .style({
		"opacity"       : 1,
		"fill"          : "none",
		 "stroke-width" : 4,                              
		//choose a color based on the position of the right side
		"stroke" :      colorscale(VM.templine[1][0]>400?(VM.templine[1][1]+VM.m.t):(VM.templine[0][1]+VM.m.t))
		});           
   }
  } //end openline check
 }; //end dragmove function
 
  //an svg path string to create the lines within a single tree
 function elbow(d, i) {
     return "M" + d.source.y + "," + d.source.x + "H" + d.target.y + "V" + d.target.x + (d.target[childname] ? "" : "h" + 17);
 }
 
  //keyboard functions to remove bindings based on keyboard command
 function keyfn() {
     if (d3.event.keyCode == 46) {//DEL key
         d3.event.preventDefault();
         d3.event.stopPropagation();
         rmButton()
     }
 }
 
  //creates a binding from the input boxes in the table
 function mapFromBox() {
	//identify the indices of the chosen words
     var leftID =  VM.leftwords.indexOf(d3.select("input#leftwords").node().value),
         rightID = VM.rightwords.indexOf(d3.select("input#rightwords").node().value),

		//determine if either the right word or the left word has already been included in a binding
         usedRight = (VM.bindings.map(function(n) {return n.right})
             .indexOf(VM.allRight[rightID]) != -1),
         usedLeft = (VM.bindings.map(function(n) {return n.left})
             .indexOf(VM.allLeft[leftID]) != -1);
  
	  
     if (leftID > -1 && rightID > -1 && !usedLeft && !usedRight) { 
		//these are free words, so update the table & create a binding
         VM.allLeft[leftID].right = VM.allRight[rightID];
         VM.bindings.push({
             left: VM.allLeft[leftID],
             right: VM.allRight[rightID]
         }); 
		//update the table
         mkTable();  

  		var binding = d3.selectAll("g#left")
			.filter(function(d) {return d == VM.bindings[VM.bindings.length - 1].left})
            .insert("g", "text").attr({"class": "VMbinds","id": function(d) {return d.name}});  
            
            //draw the actual lines connecting the two objects
			mkBinding(binding);

		 //update the colors on the rectangles in the new binding
        d3.selectAll("g#left")
             .filter(function(d) {
                 return d == VM.bindings[VM.bindings.length - 1].left})
					.select("rect").style("opacity",1);              

			d3.selectAll("g#right")
			.filter(function(d) {
				return d == VM.bindings[VM.bindings.length-1].right})
					.select("rect").style("opacity",1);
 
 		  //once done, hide the lists
         d3.select("#autocomplete input#rightwords")
             .node().value = ""
         d3.select("#autocomplete input#leftwords")
             .node().value = ""
     }   
 	//indicate there's a problem if a word has already been used.    
     if (usedLeft) 
         d3.select("#autocomplete input#leftwords")
         .style("border", "solid 5px red");
     else d3.select("#autocomplete input#leftwords")
         .style("border", "");
     if (usedRight)
         d3.select("#autocomplete input#rightwords")
         .style("border", "solid 5px red");
     else d3.select("#autocomplete input#rightwords")
         .style("border", "");
 }; //end mapFromBox function
 
  //make the binding, i.e. draw the line linking a rectangle on the left to one on the right
 function mkBinding(binding) {  
	   //attach a new line to the DOM
  	   binding.append("path")
        .style({ "stroke": colorOrder,"opacity":1e-6})
        .on("click", rmLine) //set behavior when it is clicked
        .transition().duration(duration) //animate its creation with the following two lines
        .attr("d", function(d) {return newDiagonal(d.right.x-d.x,d.depth*30,d.right.depth*30)})  //the shape of the line  
        .style("opacity", function(d) {return d3.selectAll(".VMnode#right").data().indexOf(d.right)==-1?1e-6:1}); //the coloring of the line
 
       //attach a triangle on the right
	   binding.append("path")
		.style({"fill":"black","stroke":"black","opacity":1e-6})
		 
		 //shape of the triangle:       
	   	.attr({"d":"M0,-5L10,0L0,5","class":"rightTri"})  
	  
		//position of the triangle:
		.attr("transform",function(d) {return "translate("+(480-d.depth*30+d.right.depth*30)+","+(d.right.x-d.x)+")"})  
	    .style("opacity",1e-6)    
 
   		//animate its color
		.transition().duration(duration)
        .style("opacity", function(d) {return d3.selectAll(".VMnode#right").data().indexOf(d.right)==-1?1e-6:1});     
   
		//attach a triangle on the left
	   	binding.append("path")
		.style({"fill":"black","stroke":"black","opacity":1e-6})

		//shape of the triangle:    
	   	.attr({"d":"M0,5L-10,0L0,-5","class":"leftTri"}) 

		//position of the triangle:
		.attr("transform",function(d) {return "translate("+(347-d.depth*30)+",0)"})  

		//animate its color
		.transition().duration(duration)
        .style("opacity", function(d) {return d3.selectAll(".VMnode#right").data().indexOf(d.right)==-1?1e-6:1});     
 }; //end mkBinding function

  //create the DOM elements that allow for data entry through the table   	                        
 function mkInputboxes() {
	 //insert a button into the DOM that will create the mapping from the data in the input boxes
     d3.select("#VMtableDiv")
         .insert("button", "table")
         .attr("id", "boxInput")
         .style({
             "font-size": "110%",
             "position": "relative",
             "left": "160px"
         })
         .text("Enter mapping from input boxes");

 	 //attach the behavior for when it is clicked
     d3.select("button#boxInput")
         .on("click", mapFromBox);

 	 //find a list of the all the potential words that go in the menus
     VM.allLeft = treeAll(VM.rootLeft),
     VM.allRight = treeAll(VM.rootRight)
                                        
	//create an array of prettified strings that will appear in drop-down menu
     VM.leftwords = VM.allLeft.map(mkString)
     VM.rightwords = VM.allRight.map(mkString)

	//create the DOM for the autocomplete lists
     d3.select("#VMtableDiv")
         .append("div")
         .attr("id", "autocomplete");

	 //attach the datalist to the autocomplete lists
     d3.select("#autocomplete")
         .append("datalist")
         .attr("id", "leftwords");

     d3.select("#autocomplete")
         .append("datalist")
         .attr("id", "rightwords");

	 //create the left list
     var options = '';
     for (var i = 0; i < VM.leftwords.length; i++) options += '<option value="' + VM.leftwords[i] + '" />';
     d3.select("#leftwords")
         .node()
         .innerHTML = options;
     d3.select("#autocomplete")
         .append("input")
         .attr({
             "id": "leftwords",
             "list": "leftwords"
         });

	 //create the right list
     var options = '';
     for (var i = 0; i < VM.rightwords.length; i++) options += '<option value="' + VM.rightwords[i] + '" />';
     d3.select("#rightwords")
         .node()
         .innerHTML = options;
     d3.select("#autocomplete")
         .append("input")
         .attr({
             "id": "rightwords",
             "list": "rightwords"
         });

	 //add some css to style the lists
     d3.selectAll("#leftwords, #rightwords")
         .style({
             "font-size": "150%",
             "width": "440px",
             "position": "relative",
             "left": "60px"
         });

 }; //end mkInputBox function

  //make the table of the existing bindinds
 function mkTable() {
     d3.selectAll("tr:not(#VMhead)")
         .remove() //start anew   
	  
	//one row for each binding
     var rows = VM.table.append("tbody")
         .selectAll("tr")
         .data(VM.bindings, function(d) {
             return d.left.id
         }); 

	 //create new DOM elements for each row
     rows.enter()
         .append("tr")
         .selectAll("td")
         .data(function(row) {
             return [row.left, row.right]
         })
         .enter()
         .append("td")
         .text(function(d, i) {
             return mkString(d)
         });

     rows.exit().remove(); //make sure any removed rows are deleted

	//attach some CSS to the table
     d3.select("table")
         .style({
             "border": "1px solid black",
             "table-layout": "fixed",
             "width": "200px"
         });
     d3.selectAll("th,td")
         .style({
             "overflow": "hidden",
             "width": "440px",
             "text-align": "left",
             "font-size": "150%"
         });
     d3.selectAll("tr:nth-child(even)")
         .style("background-color", "#e5e5e5");

     d3.selectAll("tr:nth-child(odd)")
         .style("background-color", "#fdfdfd");

     d3.select("thead tr")
         .style("background-color", "#e5e5e5");

	  //attach the remove row behavior for when the row is clicked
     d3.selectAll("tr:not(#VMhead)")
         .on("click", rmRow); 

 }; //end mkTable function

  //convenience function to pretify the displayed strings and make consistent
 function mkString(bind) {

     var str = '/' + (bind.name||bind.id),
         temp = bind;    

     for (var id = 0; id < bind.depth - 1; id++) {
         temp = temp.parent;
         str = '/' + temp.name + str;
     } 
     return str;
 };//end mkString function
   
  //the path function that creates a line from left to right
  //it depends entirely on the existing layout and would need to be recoded if sizes of the div element changes   
 function newDiagonal(yscale,xoffsetleft,xoffsetright) {
    //if the position of the trees is coded differently within the div, then x and y will need to be re-scaled.
	var x = [0,30,46,67,128,149,165,200].map(d3.scale.linear().domain([0,200]).range([340-xoffsetleft,480+xoffsetright-xoffsetleft]))
	y = [0, 0, 0.1, 0.2, 0.8, 0.9, 1, 1].map(function(pt) {return yscale*pt}),
	str = "M"+ x[0]+","+y[0]+"Q"+x[1]+","+y[1]+","+x[2]+","+y[2]+"C"+x[3]+","+y[3]+","+x[4]+","+y[4]+","+x[5]+","+y[5]+"Q"+x[6]+","+y[6]+","+x[7]+","+y[7];
	return str
}; //end newDiagonal function  

  //behavior when the remove button gets clicked         
 function rmButton() { 
	
	//distinguish which table rows have been marked for removal
     highlightedA = d3.selectAll("tr.highlighted")
         .data();
     unhighlightedA = d3.selectAll("tr:not(.highlighted):not(#VMhead)")
         .data();               

	 //remove the highlighted rows from the table 
     d3.selectAll("tr.highlighted")
         .remove(); 

	 //for each highlighted row, go through and change the tree structure
     for (var iA = 0; iA < highlightedA.length; iA++) { 
	 //change the color on the right side back to its original shade
      d3.selectAll(".VMnode#right").select("rect")
			.filter(function(d) {return d==highlightedA[iA].right}).style("opacity",0.25);  
		//set the additionalProperties field on the left object back to false	
         highlightedA[iA].left.additionalProperties = false;
         //remove the binding from the array of all bindings
         VM.bindings.splice(VM.bindings.indexOf(highlightedA[iA]), 1)
     } 
        //make sure all left sides that are colored are back to their original color
		d3.selectAll(".VMnode#left").select("rect")
			.style("opacity",function(d) {return (d.additionalProperties==false)?0.25:1});  

 	//remove the set of binding lines
    d3.selectAll(".VMbinds")
         .data(VM.bindings.map(function(n) {
             return n.left
         }), function(d) {
             return d.id
         })
         .exit()
         .remove(); 
 
	 //finally, make sure the checkbox for "highlight all" is turned off when the highlighted rows are deleted
     d3.select("#VMcheckall")
         .property("checked", false)
 }; //end rmButton function
 
  //behavior when a line is clicked for removal
 function rmLine() {
	//identify the binding that should be removed
     rmThis = d3.select(this).datum();           

    //change the color of the rectangle on the left that owns this binding
	d3.select(this.parentNode.parentNode).select("rect")
		.style("opacity",0.25);
	//change the color of the rectangle on the right that was bound to it
	d3.selectAll(".VMnode#right").select("rect")
		.filter(function(d) {return d==rmThis.right})
		.style("opacity",0.25); 
		 
	//change the additionalProperties field back to empty once the binding is eliminated
     rmThis.additionalProperties = false;
	
	//remove the line itself from the DOM
     d3.select(this.parentNode)
         .remove();                      
	  
	//remove this binding from the bindings array
     VM.bindings = VM.bindings.filter(function(d) {
         return d.left != rmThis
     }); 

	//redraw the table with the new binding array
     mkTable();
 }; //end rmLine funciton

  //behavior when a line is clicked for removal
 function rmRow(d, i) {

     //identify which row is selected
     var selectRow = d3.select(this);   
	//modify the color of the selected row and label it as "highlighted"
     if (selectRow.style("background-color") == "rgb(230, 138, 128)") {
         selectRow.style("background-color", i % 2 ? "#e5e5e5" : "#fdfdfd")
             .attr("class", "")
     } else {
         selectRow.style("background-color", "rgb(230,138,128)")
             .attr("class", "highlighted")
     }
 }; //end rmRow function

  //draws the tree structure and handles hiding/showing rectangles
 function updateTree(source, side) {
	//get the collection of objects
    var nodes = tree.nodes(side == 'left' ? VM.rootLeft : VM.rootRight);

	//determine the size of the tree
	if (side =="left")  VM.maxNodes.left  = nodes.length;
	if (side =="right") VM.maxNodes.right = nodes.length;

	//figure out the dimensions of each rectangle
     nodes.forEach(function(node, i) {
         node.x = i * barHeight;
         node.x0 = node.x;
         node.y0 = node.y
     });                  

	//set the overall height of the svg as a function of the number of nodes
     VM.height = d3.max([4,VM.maxNodes.left,VM.maxNodes.right])*barHeight+VM.m.t+VM.m.b;

	//make the svg the proper height
     d3.select("svg")
         .transition()
         .duration(duration)
         .attr("height", VM.height);

	 //establish the collection of nodes for the side we are working on
     node = VM.S[side].selectAll(".VMnode").data(nodes, function(d) {return d.id}),
 
		//these are the newly created nodes
         nodeEnter = node.enter()
         .append("g")
         .attr({
             "id": side,
             "class": "VMnode",
             "transform": function(d) {
                 return "translate(" + source.y0 + "," + source.x0 + ")"
             }
         });

	//if it's one of the parent elements, then add a circle to it
     nodeEnter.filter(function(d, i) {return (d[childname] || d._properties) && i != 0})
         .append("circle")
         .attr("r", 5)
         .style("stroke", "orangered")
		//attach the collapsing behavior to it
         .on("click", clickCollapse);

	 //for all the entering nodes, draw a rectangle
     nodeEnter.append("rect")
         .attr({
             "x": 15,
             "y": -barHeight / 2,
             "height": barHeight,
             "width": function(d, i) {
                 return barWidth - d.y0
             }
         })
         .style({
             "stroke-width": 2,
             "stroke": "white",
             "fill": color,
             "opacity": function(d) {(d.additionalProperties)?1:0.25}
         })
  		//attach behaviors for the rectangle including creating a new binding when clicked
         .on("mouseup", clickBind)  
		 .on("mousedown",clickBind)
		.on("mouseover",function() {var o = d3.select(this).style("opacity"); d3.select(this).style("opacity",(o>=0.25&&o<0.9)?0.75:o) })
		.on("mouseout", function() {var o = d3.select(this).style("opacity"); d3.select(this).style("opacity",(o>0.25 &&o<0.9)?0.25:o)})  
         .call(drag)

 	 //for all entering rectangles, append their text with the name
     nodeEnter.append("text")
         .attr({
             "dy": 3.5,   
			 //the x position depends on whether this is a parent Element
             "dx": function(d) {
                 return (d[childname] || d._properties) ? 35 : 22
             }
         })
         .text(function(d) {
             return d.name
         })
		//positioning depends in whether this is the left side or the right side
         .attr("transform", "translate(" + (side == "left" ? 0 : 25) + ",0)")       

		//make sure the behaviors work if the text is clicked and not just the background rectangle
         .on("mouseup", clickBind)
		 .on("mousedown",clickBind) 
		//this just changes the color to show when a rectangle is being crossed by the mouse
   		.on("mouseover",function() {
			var o = d3.select(this.parentNode)
				.select("rect")
				.style("opacity"); 
				d3.select(this.parentNode)
					.select("rect")
					.style("opacity",(o<0.9)?0.75:o) })
		.on("mouseout", function() {
				var o = d3.select(this.parentNode)
					.select("rect")
					.style("opacity"); 
					d3.select(this.parentNode)
						.select("rect")
						.style("opacity",(o>0.25 &&o<0.9)?0.25:o)}) 
		 //allow for new lines to be created with the drag function          
         .call(drag) 

     //this sets the behavior for the rectangles that slide when they rejoin the tree
     nodeEnter.transition().duration(duration)
		.attr("transform", function(d) {return "translate(" + d.y + "," + d.x + ")"});  

     //these are the rectangles that have to reposition because the new ones caused them to have a new position
     node.transition()
         .duration(duration)
         .attr("transform", function(d) {
             return "translate(" + d.y + "," + d.x + ")"
         })
         .select("rect")
         .style({
             "fill": color,
             "opacity": function(d) {return (d.additionalProperties==false)?0.25:1}
         }); 
		//make the sure the triangle also gets repositioned
		node.select(".rightTri").transition()
			.duration(duration)
			.attr("transform",function(d) {return "translate("+(480-d.depth*30+d.right.depth*30)+","+(d.right.x-d.x)+")"})     

     //these are the rectangles that hide
     node.exit() 
		//first animate their motion and dim them
         .transition()
         .duration(duration)
         .attr("transform", function(d) {
             return "translate(" + source.y + "," + source.x + ")"
         })  
         .style("opacity", 1e-6)
		//when the animation is done, remove them from the DOM
         .remove();
	  
     //draw the links that connect a single tree together
     var link = VM.S[side].selectAll("path.VMlink")
         .data(tree.links(nodes), function(d) {
             return d.target.id
         });

	 //these are the new link lines connecting a tree together
     link.enter()
         .insert("path", "g")
         .attr({
             "id": side,
             "class": "VMlink",   
			//creates the rectangular-shaped path that link a tree together
             "d": function(d) {
                 var o = {
                     x: source.x0,
                     y: source.y0
                 };
                 return elbow({
                     source: o,
                     target: o
                 })
             }
         })
         .transition()
         .duration(duration)
         .attr("d", elbow); 

	 // if a tree has been expanded/contracted, the lines need to move to new positions
     link.transition()
         .duration(duration)
         .attr("d", elbow); 

	 //if the links are hidden, collapse them and then remove them
     link.exit()
         .transition()
         .duration(duration)
         .attr("d", function(d) {
             var o = {
                 x: source.x,
                 y: source.y
             };
             return elbow({
                 source: o,
                 target: o
             })
         })
         .remove();

 	 //store the information about the bindings
     var VL = VM.bindings.map(function(n) {return n.left}),
     	 VR = VM.bindings.map(function(n) {return n.right}); 
 
	//for each rectangle on the left side with a binding, find its binding line and transition its shape & position based on 
	//new position after moving
     node.filter(function(d) {return (VL.indexOf(d) > -1)})
         .select(".VMbinds").select("path")
         .transition()
         .duration(duration)
         .attr({"d": function(d) {return newDiagonal(d.right.x-d.x,d.depth*30,d.right.depth*30)}}) 
        .style("opacity", function(d) {return d3.selectAll(".VMnode#right").data().indexOf(d.right)==-1?1e-6:1});       

     //for each rectangle with a binding, move the triangles associated with it to their new position
	 node.filter(function(d) {return VL.indexOf(d)>-1}).select(".VMbinds")
		.selectAll(".rightTri, .leftTri")
      	.style("opacity", function(d) {return d3.selectAll(".VMnode#right").data().indexOf(d.right)==-1?1e-6:1});  
 
	 //for all the rectanles that are newly created, determine if any have bindings
 	 var binding = nodeEnter.filter(function(d) {return (VL.indexOf(d) > -1)}).insert("g", "text").attr("class", "VMbinds");
   
 	 //draw those bindings
	 mkBinding(binding);

	 if (side=='right') {  
		//if we're don't with the right side, then call this function to craete the left side
		updateTree(VM.rootLeft,'left');     
		
		//the binding lines are tied to the left elements and so they'll show/hide based on whether the left node 
		//is visible
		//we need to handle the cases where the right side object is hiding
		//if the node containing the binding is hidden, then dim the binding line so it's not visible 
		//if the node is not hiding, then show the line
		d3.selectAll(".VMbinds").filter(function(n) {return nodes.indexOf(n)==-1}).style("opacity",1e-6)
		d3.selectAll(".VMbinds").filter(function(n) {return nodes.indexOf(n.right)!=-1}).style("opacity",1)    
	}
	
  //if we're making the left side, then we're done with 
  // both sides of the tree; now make the table     
  else mkTable();
 }; 

  //function to save the new object into a json file 
 function VM_save() {
	 //create a JSON string for saving the object
     window.VMsavedObject = JSON.stringify(VM.rootLeft, replacer, 1)
         .replace(/\"properties\": null,\s*/g, "")
         .replace(/_properties/g, "properties"); 
	 //standard file manipulation
     var blob = new Blob([window.VMsavedObject], {
         type: 'application/json'
     });
 
	//make sure the "download" capability is now attached to the Download button
	//when the DOM is clicked, the file is now downloaded
     d3.select("#VMdownload")
         .attr({
             "href"     : URL.createObjectURL(blob),
             "download" : VM.outputfile
         });

	 //we had to create some new keys on the object to draw the structure with 
	 //the d3.layout design. this eliminates those keys before they're output to the user
     function replacer(key, value) {
         var temp = value;
         switch (key) {
             case "x":
             case "y":
             case "x0":
             case "y0":
             case "parent":
             case "children":
             case "right":
                 temp = undefined;
                 break;
         }
         return temp;
     }; //end replacer function
 }; //end VM_save

}();
