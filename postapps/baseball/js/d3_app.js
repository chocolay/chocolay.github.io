var div_id = "#d3_app"; //the id of the div to be filled 
var fname = "/postapps/baseball/data/24007.json"; //given file
var ballradius = 8; 
var balledge = "red";
var ballcolor = "white"; 
var delayVariable = 500 //so the balls don't appear before the field does
var svg = d3.select(div_id).append('svg').attr({"width": 950,"height": 950,"id": "base"}),
    img = svg.append("svg:image").attr({"xlink:href":"/images/genericpark.jpg", "width": 950, "height": 950}),
    ang45 = Math.PI/4;
var hitter = [474, 820], pitcher = [475, 730];
{
var leftangle = {
    oolfl:        -45, oolf: -39, oolcf: -22.5, oocf: -8, oorcf: 8, oorf: 22.5, oorfl: 39,
    oflfl_deep:   -45, oflf_deep:    -39, oflcf_deep:    -22.5, ofcf_deep: -8,    ofrcf_deep: 8,   ofrf_deep:   22.5,  ofrfl_deep: 39,
    oflfl_normal: -45, oflf_normal:  -39, oflcf_normal:  -22.5, ofcf_normal: -8,  ofrcf_normal: 8, ofrf_normal: 22.5,  ofrfl_normal: 39,
    oflfl_shallow:-45, oflf_shallow: -39, oflcf_shallow: -22.5, ofcf_shallow: -8, ofrcf_shallow:8, ofrf_shallow: 22.5, ofrfl_shallow: 39,
    iftbss: -30.5, ifsssb: -8, ifsbfb: 15.5,
    iftbl: -45, iftb: -39, ifss: -22.5, ifsb: 0,iffb: 22.5, iffbl: 39,
    ifpica: -45
};

var rightangle = {
    oolfl: -39, oolf: -22.5, oolcf: -8, oocf: 8, oorcf: 22.5, oorf: 39, oorfl: 45,
    oflfl_deep:    -39, oflf_deep:   -22.5, oflcf_deep:   -8, ofcf_deep:   8, ofrcf_deep:    22.5, ofrf_deep:  39,  ofrfl_deep:   45,
    oflfl_normal:  -39, oflf_normal: -22.5, oflcf_normal: -8, ofcf_normal: 8, ofrcf_normal:  22.5, ofrf_normal:39,  ofrfl_normal: 45,
    oflfl_shallow: -39, oflf_shallow:-22.5, oflcf_normal: -8, ofcf_shallow:8, ofrcf_shallow: 22.5, ofrf_shallow:39, ofrfl_shallow:45,
    iftbss: -15.5, ifsssb: 8, ifsbfb: 32.5, 
    iftbl: -39, iftb: -22.5, ifss: 0, ifsb: 22.5, iffb: 39,iffbl: 45,
    ifpica: 45
};

var ring = {
    oolfl: 7, oolf: 7, oolcf: 7, oocf: 7, oorcf: 7, oorf: 7, oorfl: 7,
    oflfl_deep: 6, oflf_deep: 6, oflcf_deep: 6, ofcf_deep: 6, ofrcf_deep: 6, ofrf_deep: 6, ofrfl_deep: 6,
    oflfl_normal: 5, oflf_normal: 5, oflcf_normal: 5, ofcf_normal: 5, ofrcf_normal: 5, ofrf_normal: 5, ofrfl_normal: 5,
    oflfl_shallow: 4, oflf_shallow: 4, oflcf_shallow: 4, ofcf_shallow: 4, ofrcf_shallow: 4, ofrf_shallow: 4, ofrfl_shallow: 4,
    iftbss: 3, ifsssb: 3, ifsbfb: 3, iftbl: 2, iftb: 2, ifss: 2, ifsb: 2, iffb: 2,iffbl: 2,
    ifpica: 1
}
}
var edge_radius = [0, 100, 213, 265, 329, 427, 516, 626],
    center_radius = [0, 100, 244, 307, 391, 541, 640, 791],
    deltaR = [],
    radius_scale = [];
for (var ij = 0; ij < 8; ij++) {
    deltaR[ij] = center_radius[ij] - edge_radius[ij];
    radius_scale[ij] = deltaR[ij] /(2025);
}


//may need to make a separate ring for iftbl & iffbl

function randomAngle(key) {return Math.random()*(rightangle[key]-leftangle[key])+leftangle[key]}

function randomRadius(ring, angle) {
    var bottom = center_radius[ring-1] - (radius_scale[ring-1] * angle * angle),
        tops = topRadius(ring,angle)
		if (ring==6) tops = tops-5;
		if (ring==7) bottom = bottom+10;   
    return bottom + (tops - bottom) * Math.random()
}

function topRadius(ring,angle) {
var tops =  center_radius[ring] - (radius_scale[ring] * angle * angle);           
 if (ring==6) {        
	var ang = Math.PI*angle/180,
       a = 0.00202; b = -592,
       tops = Math.cos(ang) - Math.sqrt(Math.cos(ang)*Math.sqrt(Math.cos(ang))-4*a*b*Math.sin(ang)*Math.sin(ang));
	   tops = -tops/(2*a*Math.sin(ang)*Math.sin(ang));
	   if (ang==0) tops = topRadius(6,0.01)
	}     
	return tops      
}

function randomPt(key) {
    var angle = randomAngle(key);
    var radius = randomRadius(ring[key], angle);
    return {
        x: Math.sin(angle * Math.PI / 180) * radius + hitter[0],
        y: hitter[1] - Math.cos(angle * Math.PI / 180) * radius,
        key: key, 
	    ring: ring[key], 
	    radius:radius, 
		angle:angle,
    }
}

d3.select("#toggle").on("change",function() {d3.selectAll(".grid").style("opacity",(d3.select("#toggle").node().checked)?1:1e-6)})


function ang2rad(ang) {return Math.PI*ang/180}

function mkFoulLine(side,ring) {
  svg.append("path").attr({"class":"grid","d":d3.svg.line.radial()([[0,side=='right'?-ang45:ang45],[topRadius(7,45),side=='right'?-ang45:ang45]])})
}
function mkInnerLine(ang) {
	svg.append("path").attr({"class":"grid","d":d3.svg.line.radial()([[100,ang2rad(ang)],[topRadius(2,ang),ang2rad(ang)]])})  
}

function mkMidLine(ang) {
	svg.append("path").attr({"class":"grid","d":d3.svg.line.radial()([[topRadius(2,ang),ang2rad(ang)],[topRadius(3,ang),ang2rad(ang)]])})  
} 
function mkOuterLine(ang) {
	svg.append("path").attr({"class":"grid","d":d3.svg.line.radial()([[topRadius(3,ang),ang2rad(ang)],[topRadius(7,ang),ang2rad(ang)]])})  
} 


mkFoulLine('left',7); mkFoulLine('right',7);       
mkInnerLine(-39); mkInnerLine(39); mkInnerLine(-22.5); mkInnerLine(22.5); mkInnerLine(0)  

mkMidLine(-32.5); mkMidLine(-15.5); mkMidLine(-8); mkMidLine(8); mkMidLine(15.5); mkMidLine(32.5); 

mkOuterLine(-39); mkOuterLine(39); mkOuterLine(-22.5); mkOuterLine(22.5); mkOuterLine(8); mkOuterLine(-8);

for (var ij = 0; ij<center_radius.length; ij++) svg.append("path").attr({"class":"grid","d":d3.svg.line.radial()(d3.range(-Math.PI/4,Math.PI/4,0.01).map(function(d) {return [topRadius(ij,d*180/Math.PI),d]}))})

d3.selectAll(".grid").attr("transform","translate(475,820)").style("opacity",1e-6)
d3.json(fname, function(err, data) {if (err) console.log(err)  
	D = data; 
 var pts = [];       
    for (var key in data[0].location) {
		if (data[0].location[key] !=null) {for (var i = 0; i < data[0].location[key]; i++) {pts.push(randomPt(key));}}
	}
    var P = svg.selectAll(".pts").data(pts);
    P.enter().append("circle")
	.style({"fill": ballcolor,"stroke": balledge,"opacity":1e-6})
        .style("opacity",1)
	.transition().delay(function(d) {return 500 + Math.random()*delayVariable})
        .attr({"cx": function(d) {return d.x},"cy": function(d) {return d.y},"r": ballradius,"class": "pts","id":function(d) {return d.key}})
   

keyarray = [];
keyarray[0] = ['ifpica'];
keyarray[1] = ['iftbl','iftb','ifss','ifsb','iffb','iffbl'];
keyarray[2] = [null,'iftbss',null,'ifsssb',null,'ifsbfb',null];
keyarray[3] = ['oflfl_shallow','oflf_shallow',  null,         'ofcf_shallow',  null,         'ofrf_shallow','ofrfl_shallow'];
keyarray[4] = ['oflfl_normal', 'oflf_normal', 'oflcf_normal', 'ofcf_normal',  'ofrcf_normal','ofrf_normal', 'ofrfl_normal'];
keyarray[5] = ['oflfl_deep',   'oflf_deep',   'oflcf_deep',    'ofcf_deep',   'ofrcf_deep',  'ofrf_deep',  'ofrfl_deep'];
keyarray[6] = ['oolfl','oolf','oolcf','oocf','oorcf','oorf','oorfl'];
 

function hover() {
if (d3.select("#hovertoggle").node().checked) {
 var posn = d3.mouse(this),
 dx = posn[0]-hitter[0], dy = posn[1]-hitter[1], 
 r = Math.sqrt(dx*dx+dy*dy), theta = Math.asin(dx/r)*180/Math.PI, 
origin = d3.select(this).node().getBoundingClientRect(); 
 
radii = d3.range(0,8).map(function(d) {return topRadius(d,theta)}); 
ring = d3.bisect(radii,r); 

if (ring<8) {                                    
if (ring>3) var segment = d3.bisect([-45,-39,-22.5,-8,8,22.5,39,45] ,theta)-1; 
if (ring ==3) var segment = d3.bisect([-45,-32.5,-15,-8,8,15,32.5,45],theta)-1;
if (ring==2) var segment = d3.bisect([-45,-39,-22.5,0,22.5,39],theta)-1;
if (ring==1) var segment = 0;       
                                         
var thiskey = keyarray[ring-1][segment];
if (thiskey!=undefined) { 
d3.select("#hoverdiv")
.style({"left":(posn[0]+origin.left)+"px","top":(posn[1]+origin.top)+"px","opacity":1})
d3.select("#hoverdiv").select("p").html(D[0].location[thiskey]||0)
}
else
d3.select("#hoverdiv").style("opacity",1e-6)
}
}
}


})
