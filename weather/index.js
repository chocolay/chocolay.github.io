Array.prototype.clone = function () {
    var arr = this.slice(0);
    for (var i = 0; i < this.length; i++) {
        if (this[i].clone) {
            arr[i] = this[i].clone()
        }
    }
    return arr;
}

function changeCalendarDays() {
	changeDisp();
	d3.select("#daystamp").selectAll("option").remove();   
	var month = findOption("#monthstamp"), enddate = 30;
	if (month=="January"||month=="March"||month=="May"||month=="July"||month=="August"||month=="October"||month=="December") enddate = 31;
	if (month=="February") enddate = 28;
	d3.select("#daystamp").selectAll("option").data(d3.range(1,enddate+1)).enter().append("option").text(function(d) {return d3.format("02")(d)})
}
function changeData() {
     d3.selectAll(".contours, .colorbar").remove();  
	 var oldstate = C.state;
	if (findOption("#dataset-menu") == "4X daily average") 
	 	C.state = dataFileName4X();  
	else C.state = dataFileNameMonMean();
	 if (C.state==oldstate) {C = createContourPlot(C.f)}
	else {
     d3.json(C.state, function(err, f)
     {
         if (typeof f != "undefined")
         {
            C.paramUnit = f.Attributes.filter(function(d)
             {
                 return d.Name == 'units'
             })[0];
			C = createContourPlot(f);
         }
     })
	}
}
function changeDataSet() {
	d3.select('#yearstamp').style("display",findOption("#dataset-menu")=="4X daily average"?"none":"inline")
	d3.selectAll('#daystamp,#hourstamp').style("display",findOption("#dataset-menu")!="4X daily average"?"none":"inline")
	eraseDisplay(); 

if (findOption("#dataset-menu")=="4X daily average")
d3.select("#variable-menu").on("change", changeVariable).selectAll("option").data([
             {
                 variable: "air temperature",
                 name: "air"
             },   
			 {
                 variable: "geopotential height",
                 name: "hgt"
             }
			]).enter().append("option").text(function(d) {return d.variable})          

else  d3.select("#variable-menu").on("change", changeVariable).selectAll("option").data([
             {
                 variable: "air temperature",
                 name: "air"
             },   
			 {
                 variable: "geopotential height",
                 name: "hgt"
             },
             {
                 variable: "relative humidity",
                 name: "rhum"
             },
             {
                 variable: "wind speed",
                 name: "wspd"
             }
			]).enter().append("option").text(function(d) {return d.variable})


}
function changeDisp() {
 eraseDisplay();
 d3.select("#unitsForRange").text(findOption("#units-menu"))
}
function changeLand() {
     d3.selectAll(".land,.boundary, .graticule")
         .style(
         {
             "opacity": d3.select("#land-menu")
                 .node()
                 .options[this.selectedIndex].text == "visible" ? 0.3 : 0
         })
}
function changeProjection() {
     var projection = projOptions[d3.select("#projection-menu")
             .node()
             .selectedIndex]
         .projection;
     svg1.selectAll(".graticule, .land, .boundary, #sphere, .contours")
         .attr("d", d3.geo.path()
             .projection(projection))
}
function changeUnits(C) {
	var scaleName = d3.select("#units-menu").node().options[d3.select("#units-menu").node().selectedIndex].text,
		scale = d3.scale.linear().domain([0,100]);
		switch (scaleName) {
		case "Fahrenheit": 
	   if (findOption("#dataset-menu")=="4X daily average") scale = scale.range([-459.67,-279.67]);
	 	else scale - scale.range([32,212]);
	    C.paramUnit = d3.format("c")(176)+"F";
		break;
		case "feet":
		scale = scale.range([0,328.084]);
		 C.paramUnit = "feet";
		break;
		case "Celsius":
		if (findOption("#dataset-menu")=="4X daily average") scale = scale.range([-273.15,-173.15]);
		else scale = scale.range([0,100]);
	    C.paramUnit = d3.format("c")(176)+"C";
		break;
		case "Kelvin":
		if (findOption("#dataset-menu")=="4X daily average") {scale = scale.range([0,100]);}
		else scale = scale.range([273.15,373.15]);
		C.paramUnit = "K";
		break;
		case "mph":
		scale = scale.range([0,223.694]);
		C.paramUnit = "mph";
		break;
		default:
		scale = scale.range([0,100]);
		C.paramUnit = C.origparamUnit;
		}
C.data = C.data.map(function(row) {return row.map(function(pt) {return scale(pt)})}) 
    return C
} 
function changeVariable() {
    d3.selectAll("#height-menu, #units-menu").selectAll("option").remove() 
	eraseDisplay();
    if (findOption("#variable-menu") == "relative humidity") {
        heightMenu = d3.select("#height-menu")
            .selectAll("option")
            .data([1000, 925, 850, 700, 600, 500, 400, 300].map(function(d) {
                return {"level": d}}))
            .enter()
            .append("option")
            .text(function(d) {return d.level
            });
		unitMenu = d3.select("#units-menu")
		  .selectAll("option")
		  .data([{"unit":"%"}])
		  .enter()
		  .append("option")
		  .text(function(d) {return d.unit});      
    } else {
        heightMenu = d3.select("#height-menu")
            .selectAll("option")
            .data([1000, 925, 850, 700, 600, 500, 400, 300, 250, 200, 150, 100, 70, 50, 30, 20, 10].map(function(d) {
                return {"level": d}}))
            .enter()
            .append("option")
            .text(function(d) {return d.level}); 
  var chosenvar = findOption("#variable-menu");

	if (chosenvar=="air temperature") {
		unitMenu = d3.select("#units-menu")
		  .selectAll("option")
		  .data([{"unit":"Celsius"},{"unit":"Kelvin"},{"unit":"Fahrenheit"}])
		  .enter()
		  .append("option")
		  .text(function(d) {return d.unit});
	}
 
	if (chosenvar=="geopotential height") {
		unitMenu = d3.select("#units-menu")
		  .selectAll("option")
		  .data([{"unit":"m"},{"unit":"feet"}])
		  .enter()
		  .append("option")
		  .text(function(d) {return d.unit});
	}
	if (chosenvar=="zonal winds (U)") {
		unitMenu = d3.select("#units-menu")
		  .selectAll("option")
		  .data([{"unit":"m/s"},{"unit":"mph"}])
		  .enter()
		  .append("option")
		  .text(function(d) {return d.unit});
	}
	if (chosenvar=="meridional winds (V)") {
		unitMenu = d3.select("#units-menu")
		  .selectAll("option")
		  .data([{"unit":"m/s"},{"unit":"mph"}])
		  .enter()
		  .append("option")
		  .text(function(d) {return d.unit});
	}
	if (chosenvar=="wind speed") {
		unitMenu = d3.select("#units-menu")
		  .selectAll("option")
		  .data([{"unit":"m/s"},{"unit":"mph"}])
		  .enter()
		  .append("option")
		  .text(function(d) {return d.unit});
	} 
	}
	d3.select("#unitsForRange").text(" "+findOption("#units-menu"))
	                                                        	
}
function contourRange() {
	return d3.range(+d3.select("#mincontour").node().value,+d3.select("#maxcontour").node().value,+d3.select("#stepcontour").node().value,+d3.select("#stepcontour").node().value)
}
function dataFileNameMonMean() {
     var varname = d3.select("#variable-menu")
         .selectAll("option")
         .data()
         .filter(function(d)
         {
             return d.variable == findOption("#variable-menu")
         })[0].name,
         level = findOption("#height-menu"),
         mon = findOption("#monthstamp")
         .slice(0, 3),
         yr = findOption("#yearstamp")
         .slice(2, 4);

     return filename = "/NCEP/month/"+varname+"/"+varname + "_" + level + "_" + mon + yr +
         "_mon_mean.json"
}
function dataFileName4X() {
     var varname = d3.select("#variable-menu")
         .selectAll("option")
         .data()
         .filter(function(d)
         {
             return d.variable == findOption("#variable-menu")
         })[0].name,
         level = findOption("#height-menu"),
         mon = findOption("#monthstamp")
         .slice(0, 3),
         day = findOption("#daystamp"),
		 hr = findOption("#hourstamp");
     return filename = "/NCEP/4Xltm/"+varname+"/"+varname + "_" + level + "_" + mon + day +"H"+hr+
         "_4Xday_1981_2010_ltm.json"
}
function eraseDisplay() {
d3.select("#mincontour").node().value = d3.select("#maxcontour").node().value = d3.select("#stepcontour").node().value = "";
d3.select("#dispDataRange").text("");      
} 
function findOption(id) {
     return d3.select(id)
         .node()
         .options[d3.select(id)
             .node()
             .selectedIndex].text
}
function mkColorBar(datarange, datastep) {
			function colormap(choose) {
     	if (choose == "colorbrewerspectral") return ["#9e0142", "#d53e4f",
         "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598",
         "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"
     	]
     	else if (choose = "red2blue") return ["#a50026", "#d73027", "#f46d43",
         "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9",
         "#74add1", "#4575b4", "#313695"
     	]
			}   
     var colorbarTotalHeight = m.h/2,
         colorbarheightscale = d3.scale.linear()
         .range([25, colorbarTotalHeight])
         .domain(d3.extent(datarange)),
         colorset = colormap('red2blue'),
         drange = (typeof datastep == "number") ? d3.scale.linear()
         .domain(d3.extent(datarange))
         .nice()
         .ticks(datastep)
         .reverse() : datastep,
         dmin = d3.min(drange);
     	 dmax = d3.max(drange),
         colorscale = d3.scale.linear()
         .domain(d3.range(dmax, dmin, (dmin - dmax) / colorset.length))
         .range(colorset)
         .interpolate(d3.interpolateHcl),
         colorbars = svg1.selectAll("g")
         .data(drange)
         .enter()
         .append("g")
         .attr("class", "colorbar");
     colorbars.append("rect")
         .attr(
         {
             "y": function(d)
             {
                 return colorbarheightscale(d)
             },
             "x": m.w + 20,
             "height": (m.h/(2*drange.length)),
             "width": 50,
            "fill": function(d)
             {
                 return colorscale(d)
             },
             "stroke": "black",
             "stroke-width": 0.25
         })
     colorbars.append("text")
         .attr(
         {
             "y": function(d)
             {
                 return colorbarheightscale(d)
             },
             "x": m.w + 80,
             "dy": (3 * m.h / (8 * drange.length))
         })
         .text(function(d)
         {
             return d
         })
         .style("font-size", "16px")
     return colorscale
}
function paint(AllFeatures, datarange) {
    	var projec = d3.geo.path()
        	.projection(projOptions[d3.select("#projection-menu")
            .node()
            .selectedIndex].projection),
        colorscale = mkColorBar(datarange, 20);
		svg1.selectAll(".contours")
        	.data(AllFeatures)
        	.enter()
        	.insert("path", ".land")
        	.style({
            	"fill": function(d) {
                return colorscale(d.properties.level)},
            	"stroke-width": 0.25})
                .style("stroke",function(d,i) {return i==0?"none":"black"})
        	.attr({
            	"class": "contours",
            	"d": function(d) {
                return projec(d)
            },
            	"id": function(d) {
                return "level" + Math.round(d.properties.level)
            }
        	})

}
function setProjections() {
	var a = m.h/500;
     return [     
   {
         name: "Equirectangular",
         projection: d3.geo.equirectangular()
			 .scale(m.h*0.3).translate([m.w/2,m.h/2])
             .rotate([0, 0])
             .center([0, 0])
     },              
     {
         name: "North Pole",
         projection: d3.geo.azimuthalEqualArea()
             .scale(m.h*0.35).translate([m.w/2,m.h/2])
             .rotate([90, -90])
             .clipAngle(90)
     },
     {
         name: "South Pole",
         projection: d3.geo.azimuthalEqualArea()
             .scale(m.h*0.35).translate([m.w/2,m.h/2])    
             .rotate([90, 90])
             .clipAngle(90)
     },
     {
         name: "Robinson",
         projection: d3.geo.robinson()
			 .scale(m.h*0.3).translate([m.w/2,m.h/2])    
             .rotate([0, 0])
             .center([0, 0])
     },
      {
        name: "conus",
        projection: d3.geo.albers()
            .rotate([96, 0])
            .center([-.6, 38.7])
            .parallels([29.5, 45.5])
            .scale(800)
    }
 ]
}
function usedata(err, f, world) { 
         C = createContourPlot(f);
         C.paramUnit = f.Attributes.filter(function(d)
             {return d.Name == 'units'})[0].Value.replace("deg","");
        mkMap(world);
       svg1.on({"mouseover": mouse.over,"mousemove": mouse.move,"mouseout": mouse.out})   

		function mkMap(world) {
     		var w = {};
     		w.land = svg1.append("path")
         		.datum(topojson.feature(world, world.objects.land))
         		.attr(
         		{
             		"class": "land",
             		"d": d3.geo.path()
                 	.projection(projection)
         		});
     	    w.border = svg1.append("path")
         	 	.datum(topojson.mesh(world, world.objects.countries, function(a, b)
         			{return a !== b}))
         		 .attr(
         		 {
             	  	"class": "boundary",
             		"d": d3.geo.path()
                 	.projection(projection)
         		}); 
     	    svg1.append("use")
         	.attr(
         		{
             		"class": "sphere",
             		"xlink:href": "#sphere"
         		});
     	    w.grat = svg1.append("path")
         		.datum(d3.geo.graticule())
         		.attr(
         			{
             	"class": "graticule",
             	"d": d3.geo.path()
                 .projection(projection)
         		});
     	   return w
		}
}

{
	var tooltip = d3.select("body").append("div").attr({"class":"tooltip"}).style({"position":"absolute","top":"850px","left":"50px","opacity": 1e-6,"height": "50px"}),
	mapdata = "/mapdata/world-50m.json",
	m = {w: 960}; m.h = m.w/1.92;    // this sets the scale for the map
	var formatLatLon = d3.format(".1f"),
    timeformat = d3.time.format.utc("%B %e %Y %X"),
    projOptions = setProjections(),
	datasetMenu = d3.select("#dataset-menu").on("change",changeDataSet).selectAll("option").data([{name:"4X daily average"},{name:"monthly 1948-present"}]).enter().append("option").text(function(d){return d.name}),
    projectionMenu = d3.select("#projection-menu").on("change", changeProjection).selectAll("option").data(projOptions).enter().append("option").text(function(d){return d.name}),
    landMenu = d3.select("#land-menu").on("change", changeLand).selectAll("option").data([{name:"visible",opacity:0.3},{name: "invisible",opacity: 0}]).enter().append("option").text(function(d){return d.name}),
    heightMenu = d3.select("#height-menu").on("change",eraseDisplay).selectAll("option").data([1000,925,850,700,600,500,400,300,250,200,150,100,70,50,30,20,10].map(function(d) {return {"level":d}})).enter().append("option").text(function(d) {return d.level}),
	unitsMenu = d3.select("#units-menu").on("change",changeDisp).selectAll("option").data([{"unit":"Kelvin"},{"unit":"Celsius"},{"unit":"Fahrenheit"}]).enter().append("option").text(function(d) {return d.unit}),
   variableMenu = d3.select("#variable-menu").on("change", changeVariable).selectAll("option").data([
             {
                 variable: "air temperature",
                 name: "air"
             },   
			 {
                 variable: "geopotential height",
                 name: "hgt"
             },
  ]).enter().append("option").text(function(d) {return d.variable}),
	yearMenu = d3.select("#yearstamp").selectAll("option").data(d3.range(1948, new Date().getFullYear() + 1, 1)).enter().append("option").text(function(d){return d}),
    monthMenu = d3.select("#monthstamp").on("change",changeCalendarDays).selectAll("option").data(d3.range(0,12).map(function(d) {return {"month": d3.time.format('%B')(new Date(1,d,1))}})).enter().append("option").text(function(d){return d.month}),
    dayMenu = d3.select("#daystamp").selectAll("option").data(d3.range(1,32)).enter().append("option").text(function(d) {return d3.format("02")(d)}),
	hrMenu = d3.select("#hourstamp").selectAll("option").data([0,6,12,18]).enter().append("option").text(function(d) {return d3.format("02")(d)}),
    projection = projOptions[d3.select("#projection-menu").node().selectedIndex].projection,
		svg1 = d3.select("#graphic1").append("svg").attr({"width": m.w+150,"height": m.h}),
             mouse = {
                 over: function()
                 {
                     tooltip.transition()
                         .duration(100)
                         .style("opacity", 1)
                 },
                 move: function()
                 {
                     var resolution = 2.5,
                         projection = projOptions[d3.select(
                                 "#projection-menu")
                             .node()
                             .selectedIndex].projection,
                         posn = projection.invert(d3.mouse(this))
                         .map(function(d)
                         {
                             return d3.round(d / resolution) *
                                 resolution
                         })
                     if (Math.abs(posn[0]) <= 180 && Math.abs(posn[1]) <=
                         90)
                     {
       var ht = C.data[C.Lons.indexOf(posn[0])][C.Lats.indexOf(posn[1])];
                         strings = formatLatLon(Math.abs(posn[1])) + d3.format(
                                 "c")(
                                 176) + " " + (posn[1] < 0 ? "S" : "N") +
                             ", " +
                             formatLatLon(Math.abs(posn[0])) + d3.format(
                                 "c")(176) +
                             " " + (posn[0] < 0 ? "W" : "E") + ": " + d3.format(
                                 ".4r")(ht) + " " + C.paramUnit;
                         tooltip.text(strings)
                     }
                     else tooltip.transition()
                         .duration(5000)
                         .style("opacity", 1e-6)
                 },
                 out: function()
                 {
                     tooltip.transition()
                         .duration(5000)
                         .style("opacity", 1e-6)
                 }
             };


         C = {state:dataFileName4X()};
        d3.select("#unitsForRange").text(" "+findOption("#units-menu")) 
		svg1.append("defs")
             .append("path")
             .datum({type: "Sphere"})
             .attr({"id": "sphere","d":d3.geo.path().projection(projection)}) 
 
d3.selectAll("#yearstamp").on("change",changeDisp)  
d3.selectAll("#daystamp").on("change",changeDisp)
d3.selectAll("#hourstamp").on("change",changeDisp)
	
d3.select('#yearstamp').style("display",findOption("#dataset-menu")=="4X daily average"?"none":"inline")
d3.selectAll('#daystamp,#hourstamp').style("display",findOption("#dataset-menu")!="4X daily average"?"none":"inline")
  
 queue()         
     .defer(d3.json,C.state)
     .defer(d3.json, mapdata)
     .await(usedata)             
} 

function highlight(level) {
	d3.selectAll(".contours").style("opacity",0)
	d3.selectAll("#level"+level).style("stroke-width",2).style("fill","red").style("opacity",1)

    console.log(d3.selectAll("#level"+level).datum().geometry.coordinates[0].map(function(d) {return d3.geom.polygon(d).area()}))

    pixelpts = d3.select("#level"+level).attr("d").split(/M/g).slice(1).map(function(s) {return s.split(/L/g).map(function(p) {return p.split(/,/)}).map(function(d) {return d.map(Number)}) })
    pts = d3.select("#level"+level).datum().geometry.coordinates[0]
    xs = pts.map(function(d) {return d.map(function(p) {return p[0]})})     
    ys = pts.map(function(d) {return d.map(function(p) {return p[1]})})
	console.log(xs)
}   
   
/* (c) 2014, Elise A. Ralph eliseralph.com */
    function area(line) {
		var pairs = d3.pairs(line),
		dx = pairs.map(function(d) {return d[1].x-d[0].x}), 
		meany = pairs.map(function(d) {return (d[1].y+d[0].y)/2-90}),
		A = [];
   		for (var ij=0;ij<dx.length;ij++) {
			if (dx[ij]<-357.5) {dx[ij] = dx[ij]+360}; 
			if (dx[ij]>357.5) {dx[ij] = 360-dx[ij]}; 
			A[ij] = dx[ij]*meany[ij]}
			return A.reduce(function(a,b) {return a+b})
	}     

function createContourPlot(f) {

	function contour(z,x,y,dz) {
    	var c = new Conrec(),
            zrange = (typeof dz == "number") ? d3.scale.linear().domain(d3.extent([].concat.apply([], z))).nice().ticks(dz) : dz,
		    nudge = d3.mean(zrange)*1e-6,   
            resolutionx = resolutiony = 2.5;
		if (typeof dz=="number") {
			d3.select("#mincontour").node().value = zrange[0]; 
			d3.select("#maxcontour").node().value = zrange[zrange.length-1]; 
			d3.select("#stepcontour").node().value = zrange[1]-zrange[0];
			}
    	c.contour(z,0,y.length-1,0,x.length-1,y,x,zrange.length-1,zrange.map(function(d) {return d + nudge}))
    	Clines = c.contourList(); 
    	Clines = Clines.filter(function(d) {return d.length > 4});
    	Clines = Clines.map(untwist); 
		Clines.forEach(function(d) {if (area(d)<0) {d = d.reverse();} return d});
		Clines = Clines.filter(function(d) {return area(d)>2});
		function untwist(c) {
    		var dsquared = d3.pairs(c)
        		.map(distancesquared),
        		heads = [0],
        		tails = [];
    			for (var ij = 0; ij < dsquared.length; ij++)
    			{
        			if (dsquared[ij] > 6.25)
        			{
            			heads.push(ij + 1);
            			tails.push(ij);
        			}
    			}
    			tails.push(c.length - 1);
    			var newc = c.slice(0, tails[0] + 1);
    			heads = heads.slice(1);
    			tails = tails.slice(1);
    			var count = 0;
    			while (newc.length < c.length && count < 1000)
    			{
        			count++
        			var newhead = heads.map(function(d)
            		{
                		return distancesquared([newc[newc.length-1],c[d]])<6.25})
            			.indexOf(true);
        				if (newhead > -1)
        				{   
            				newc.push(c.slice(heads[newhead], tails[newhead]));
            				heads.splice(newhead, 1);
            				tails.splice(newtail, 1);
        				}
        				else
        				{
            				var newtail = tails.map(function(d)
                			{return distancesquared([newc[newc.length-1],c[d]])<6.25})
                				.indexOf(true);
            					if (newtail > -1)
            					{
                					newc = newc.concat(c.slice(heads[newtail],tails[newtail]+1).reverse())
                					heads.splice(newtail, 1);
                					tails.splice(newtail, 1);
            					}
        				}
			 	}
    			newc.level = c.level;
    			return newc

    	function distancesquared(pts) {
			var dx = pts[0].x - pts[1].x, dy = pts[0].y-pts[1].y;
	 		if (dx>357.5) dx = dx-360;
	 		if (dx<-357.5) dx = dx+360;  
	 		return dx*dx + dy*dy
		}
		}

	return Clines
	}
    function checkIfFlip(lines,level) {
		var lines = lines.map(circumpolar); 
		for (var j=0; j<lines.length;j++) {
			for (var i=j+1;i<lines.length;i++) { 
            	if (+level<C.PoleValues[0]&&j==0) {lines[i] = lines[i].reverse()}
            	if (raycast(lines[i],lines[j])) {lines[i] = lines[i].reverse();}
        	}
    	}
	return lines
	} 
	function circumpolar(cline) {
		var A = d3.pairs(cline.concat(cline[0]))
         	.filter(function(d)
         	{
             return Math.abs(d[0].x - d[1].x) >=357.5
         	})
         	.map(function(d)
         	{
             	return d[1].y
         	});
    		cline.circumpolar = A.length % 2 == 1;
    		return cline
	} 
    function datelineCut(C) {
    //SHOULD USE C.LONS TO IDENTIFY INDEX OF DATELINE FOR SPLIT
    	C.data = C.data.slice(C.data.length / 2, C.data.length)
        .concat(C.data.slice(0, C.data.length / 2 + 1))  
    	return C
	}
	function mkFeature(Arr, level) {
    	var coords = [];
    	for (var ij = 0; ij < Arr.length; ij++) {
        	coords.push(Arr[ij].map(function(e) {
            	return [e.x, e.y]}))
    		}
    		return {
        		type: "Feature",
        		properties: {
            		level: level
        		},
        		geometry: {
            		type: "MultiPolygon",
            		coordinates: [coords]
        		}
    		}
	}
	function raycast(testcurve, vs) {
		function rmDuplicate(line) {
		var toRemove = d3.pairs(line).map(function(d) {return d[0]==d[1]}).indexOf(true); 
		while (toRemove >-1)  {line.splice(toRemove,1); 
			if (line.length>1)
		 	toRemove = d3.pairs(line).map(function(d) {return d[0]==d[1]}).indexOf(true);
		 	else toRemove = -1;}
			return line
		}

    	var point = testcurve[0];     
    	var  A = rmDuplicate(d3.pairs(vs.concat(vs[0]))
             .filter(function(d) {return Math.abs(d[0].x - d[1].x) > 357.5})
             .map(function(d){ return d[1].y}));
     		if (vs.circumpolar) 
     		{  
				if (Math.abs(Math.abs(point.x)-180)<2.5)
         		{inside = A.filter(function(d) {return d < point.y}).length % 2 == 1;}
         		else
         		{
             		point = testcurve.filter(function(d) {return (Math.abs(d.x%2.5) <1e-5 || Math.abs(d.x%2.5)>2.5-1e-5)})[0]; 
             		var southOfLine = vs.filter(function(d) {return Math.abs(d.x- point.x)<1e-5})
                 	.filter(function(d) {return d.y < point.y});
			 		if (southOfLine.length>1) southOfLine = rmDuplicate(southOfLine);
         	 		inside = southOfLine.length % 2 == 1; 
        		}
     		}
     		else //not circumpolar
     		{      
	  			if (Math.abs(Math.abs(vs[0].x)-180)<2.5)  {
	    			if (Math.abs(Math.abs(point.x)-180)<2.5)  {inside = A.filter(function(d){return d < point.y}).length % 2 == 1;} 
         			else {       
             			point = testcurve.filter(function(d) {return (Math.abs(d.x%2.5) <1e-5 || Math.abs(d.x%2.5)>2.5-1e-5)})[0];        
             			var southOfLine = vs.filter(function(d) {return Math.abs(d.x- point.x)<1e-5})
                 		.filter(function(d) {return d.y < point.y}); 
			 			if (southOfLine.length>1) southOfLine = rmDuplicate(southOfLine);
         	 			inside = southOfLine.length % 2 == 1;             
					}
	  			}
      			else {
		 			var x = point.x,
             		y = point.y,
             		inside = false;   
         			for (var i = 0, j = vs.length-1; i < vs.length; j = i++)
         			{
             			var xi = vs[i].x,
                 		yi = vs[i].y;
             			var xj = vs[j].x,
                 		yj = vs[j].y;   
						var dx = (xj-xi), dy =(yj-yi); dx2 = x-xi;      
             			var intersect = ((yi>y)!=(yj>y)) && ((dx2) < (dx/dy)*(y-yi)); 
             			if (intersect) {inside = !inside;} 
         			}
      			}
    		}
     return inside;

	}
    function sortLines(n,box,flag,poles) {
		if (flag)  {F = [box,box];} 
		else {
			var F = [], 
			lines = n.values.clone(); 
			lines = lines.map(function(line) {
			  var xs = line.map(function(d) {return d.x})
			  return line.splice(xs.indexOf(d3.max(xs))).concat(line)                                     
			})
			lines = lines.sort(function(a,b) {return area(b) - area(a)});   
    	    if (n.key<C.PoleValues[0]) {lines[0] = lines[0].reverse();}  
    		F = checkIfFlip(lines,n.key)
		}
		return mkFeature(F,n.key)  
	}
console.log('start')
    var lonbox = [-180, -90, 0, 90, 180, 180, 180, 180, 180, 90, 0, -90, -180, -180, -180, -180, -180],
    box = [-90, -90, -90, -90, -90, -45, 0, 45, 90, 90, 90, 90, 90, 45, 0, -45, -90].map(function(d, i) {return {x: lonbox[i],y: d}}),
    AllFeatures = [];
	C = datelineCut({data:f.data,Lons:d3.range(-180,182.5,2.5),Lats:d3.range(90,-92.5,-2.5)});
	C.originalData = C.data.clone();
	C.fname = f.Filename;
	C.desc = f.Attributes[11].Value;
	C.paramUnit = f.Attributes.filter(function(d) {return d.Name == 'units'})[0].Value.replace("deg", d3.format("c")(176));
	C.origparamUnit = C.paramUnit; 
	C.f = f;
	C = changeUnits(C);            
    C.datarange = d3.extent([].concat.apply([], C.data));
    d3.select("#dispDataRange").text("datarange: ["+C.datarange.map(d3.format(".3r"))+"]") 
	C.PoleValues = [C.data[0][C.data[0].length - 1], C.data[0][0]];  
	if (d3.select("#mincontour").node().value!==""&&d3.select("#maxcontour").node().value!==""&&d3.select("#stepcontour").node().value!=="") {dz = contourRange();}
	else dz = 20;                
 nest = d3.nest().key(function(d){return Math.round(+d.level)}).entries(contour(C.data,C.Lats,C.Lons,dz)).sort(function(a,b) {return a.key-b.key})
console.log(nest.map(function(d) {return d.key}))
    nest.unshift({key:2*nest[0].key-nest[1].key})
       for (var ij = 0; ij < nest.length; ij++) {
       AllFeatures = AllFeatures.concat.apply(AllFeatures, [sortLines(nest[ij],box,ij==0,C.PoleValues)])
        }
    paint(AllFeatures, C.datarange)
    return C
}

