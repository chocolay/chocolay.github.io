

let h = d3.select("h1");
h1.style("float","left")
.text("local roots...")
d3.select(h.parentElement).insert("h1","h1")
.style("float","right")
.text("...global reach");


/***** ALL MATH FUNCTIONS ****/

var to_radians = Math.PI / 180;
var to_degrees = 180 / Math.PI;


// Helper function: cross product of two vectors v0&v1
function cross(v0, v1) {
    return [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
}

//Helper function: dot product of two vectors v0&v1
function dot(v0, v1) {
    for (var i = 0, sum = 0; v0.length > i; ++i) sum += v0[i] * v1[i];
    return sum;
}

// Helper function:
// This function converts a [lon, lat] coordinates into a [x,y,z] coordinate
// the [x, y, z] is Cartesian, with origin at lon/lat (0,0) center of the earth
function lonlat2xyz(coord) {

    var lon = coord[0] * to_radians;
    var lat = coord[1] * to_radians;

    var x = Math.cos(lat) * Math.cos(lon);

    var y = Math.cos(lat) * Math.sin(lon);

    var z = Math.sin(lat);

    return [x, y, z];
}

// Helper function:
// This function computes a quaternion representation for the rotation between to vectors
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quaternion(v0, v1) {

    if (v0 && v1) {

        var w = cross(v0, v1),  // vector pendicular to v0 & v1
            w_len = Math.sqrt(dot(w, w)); // length of w

        if (w_len == 0)
            return;

        var theta = .5 * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1)))),

            qi = w[2] * Math.sin(theta) / w_len;
        qj = -w[1] * Math.sin(theta) / w_len;
        qk = w[0] * Math.sin(theta) / w_len;
        qr = Math.cos(theta);

        return theta && [qr, qi, qj, qk];
    }
}

// Helper function:
// This functions converts euler angles to quaternion
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function euler2quat(e) {

    if (!e) return;

    var roll = .5 * e[0] * to_radians,
        pitch = .5 * e[1] * to_radians,
        yaw = .5 * e[2] * to_radians,

        sr = Math.sin(roll),
        cr = Math.cos(roll),
        sp = Math.sin(pitch),
        cp = Math.cos(pitch),
        sy = Math.sin(yaw),
        cy = Math.cos(yaw),

        qi = sr * cp * cy - cr * sp * sy,
        qj = cr * sp * cy + sr * cp * sy,
        qk = cr * cp * sy - sr * sp * cy,
        qr = cr * cp * cy + sr * sp * sy;

    return [qr, qi, qj, qk];
}

// This functions computes a quaternion multiply
// Geometrically, it means combining two quant rotations
// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
function quatMultiply(q1, q2) {
    if (!q1 || !q2) return;

    var a = q1[0],
        b = q1[1],
        c = q1[2],
        d = q1[3],
        e = q2[0],
        f = q2[1],
        g = q2[2],
        h = q2[3];

    return [
        a * e - b * f - c * g - d * h,
        b * e + a * f + c * h - d * g,
        a * g - b * h + c * e + d * f,
        a * h + b * g - c * f + d * e];

}

// This function computes quaternion to euler angles
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quat2euler(t) {

    if (!t) return;

    return [Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) * to_degrees,
        Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * to_degrees,
        Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) * to_degrees
    ]
}

/*  This function computes the euler angles when given two vectors, and a rotation
    This is really the only math function called with d3 code.

    v0 - starting pos in lon/lat, commonly obtained by projection.invert
    v1 - ending pos in lon/lat, commonly obtained by projection.invert
    o0 - the projection rotation in euler angles at starting pos (v0), commonly obtained by projection.rotate
*/

function eulerAngles(v0, v1, o0) {
    /*
        The math behind this:
        - first calculate the quaternion rotation between the two vectors, v0 & v1
        - then multiply this rotation onto the original rotation at v0
        - finally convert the resulted quat angle back to euler angles for d3 to rotate
    */
    var t = quatMultiply(euler2quat(o0), quaternion(lonlat2xyz(v0), lonlat2xyz(v1)));

    return quat2euler(t);
}


var width = 960,
    height = 720,
    speed = 1.5e-2;

var pincolor = "#2abcd9";
var countrycolor = "#d9b32a";
var redtree = "#d95d2a";

var sphere = {type: "Sphere"};

var graticule = d3.geoGraticule();

var canvas = d3.select("#d3_app").append("canvas")
    .attr("width", width)
    .attr("height", height);

var svg = d3.select("#d3_app").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background","none")
    .style("opacity",0.9)
    .style("pointer-events","none");

var context = canvas.node().getContext("2d");

var projection1 = d3.geoOrthographic()
    .scale(height / 2.1)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .precision(.5);

var projection = projection1;

var path1 = d3.geoPath()
    .projection(projection1)
    .context(context);

var path1_svg = d3.geoPath()
    .projection(projection1);

var projection2 = d3.geoNaturalEarth1();

var path2 = d3.geoPath()
    .projection(projection2)
    .context(context);

var path2_svg = d3.geoPath()
    .projection(projection2);

path = path1;
path_svg = path1_svg;


var colors = ["#135761", "#EC2FBB", "#A6A15A", "#1E42BC", "#66B438", "#7A82AC", "#28E3D9", "#0F3C73", "#10389E", "#3E5B58", "#A9E23A", "#B9DB0B", "#AF12B9", "#5CD29C", "#0851A0", "#36D0E7", "#912EDF", "#730BFA", "#4E31D9", "#2178DA", "#5764D8", "#8E9C73", "#59B9BF", "#CD3C89", "#5A696E", "#096E69", "#3A840A", "#D02C56", "#5C41C1", "#D81B8C", "#1FCC5E", "#203CF2", "#0F6A23", "#DC0217", "#4679AF", "#EC23E8", "#1B0684", "#479E11", "#565A89", "#3FB227", "#083AAE", "#89387C", "#5B0610", "#3A7852", "#5F29A3", "#90C067", "#F7016F", "#34B98A", "#535973", "#32FAC5", "#6D3703", "#925BBF", "#922FE6", "#C62D2E", "#0C2C1A", "#47E174", "#237EDF", "#9E5D9D", "#47EC33", "#BA2815", "#06EA36", "#CF1911", "#EC41C9", "#53B79B", "#1016FE", "#E119A5", "#1A8144", "#19EFD4", "#27F22C", "#1F1CAC", "#0E48A3", "#53BF7D", "#AF0422", "#4633C7", "#D45F5D", "#26FFDA", "#5A4FBE", "#A12B04", "#545173", "#98D63E", "#0C7BB7", "#B2C939", "#722800", "#2D8A24", "#7C5F55", "#B56344", "#215860", "#56ACA0", "#BAA615", "#498203", "#6A277B", "#0C8090", "#C6C423", "#A30D01", "#E5891D", "#9C8B25"];

d3.csv("/postapps/clientfile/data/clientlist.csv").then(function(data,error) {

    var base = {type:"Feature",
        geometry: {type: "Point", coordinates:[-87.317,46.492]},
        properties: {}
    };

    Z = data;

    let features = data.map(d=>{
        var keys = Object.keys(d);
        let P = {};
        keys.forEach(function(k) {
            if (k!="latitude" & k!="longitude") {
                P[k] = d[k];
            }

        });
        return {
            type: "Feature",
            geometry: {type: "Point", coordinates: [d.longitude, d.latitude]},
            properties: P
        }
    });//features_zika

    F = features
    svgGroup = svg.append("g")
        .attr("id","gr")
        .attr("transform","translate("+(width/2)+","+(height/2)+")")



    routes = data.map(function(d) {
       return {
           type:"LineString",
           coordinates:[
               base.geometry.coordinates,
               [d.longitude,d.latitude]
           ]
       }
    });

    //globe
    svgGroup.append("path")
        .datum(sphere)
        .attr("id","sphere")
        .attr("d",path_svg)
        .style("stroke","white")
        .style("stroke-width",1)
        .style("fill","none")
        .attr("transform","translate("+(-width/2)+","+(-height/2)+")")

    svg.selectAll(".pin")
        .data(features)
        .enter().append("path")
        .classed("pin",1)
        .attr("d",path_svg)
        .style("display","none")
        .style("fill",pincolor);


    d3.json("/postapps/clientfile/data/world.json").then(function(c,error) {
        d3.json("/postapps/clientfile/data/world-110m.json").then(function(topo,error) {
        
            if (error) throw error;
            
            const land = topojson.feature(topo, topo.objects.land),
                borders = topojson.mesh(topo, topo.objects.countries, function(a, b) {return a !== b; }),
                countries_ = topojson.feature(c, c.objects.countries1).features
                    .filter(d=>{
                        gcode = d.properties["name"];
                        acode = d.properties["Alpha-2"];
                        zcountries = d3.set(Z.map(d=>d.country)).values();
                        zcodes = d3.set(Z.map(d=>d.countrycode)).values();
                        return (zcountries.indexOf(gcode)>-1) || (zcodes.indexOf(acode)>-1)
                    });
            land.geometry.coordinates = land.geometry.coordinates.filter(d=>d[0][0][1]>-60)
            grid = graticule();

            timerCallback = function() {
                projection1.rotate([speed * (Date.now() - start) +85, -15, 0]);
                drawSphere(sphere, land, borders,countries_,features);
                rotatePoints(".pin, .country_used");
            }


            tooltipIt = function(str,p) {
                d3.select("#tooltip")
                    .style("display","block")
                    .style("left",(p[0]+10)+"px")
                    .style("top",(p[1]-30)+"px")
                d3.select("#tooltip").text(str)
            }


            d3.select("body").on("click",function() {
                d3.select("#tooltip")
                    .style("display","none");
            })
            clickCanvas = function(e) {
                d3.event.stopImmediatePropagation()
                gpos0 = projection.invert(d3.mouse(this))
                features.forEach(d=>{
                    d.properties.tempDist = d3.geoDistance(gpos0,d.geometry.coordinates)
                })
                feat = features.sort(function(a,b) {
                    return a.properties.tempDist-b.properties.tempDist
                })
                if (feat[0].properties.tempDist<0.1) {
                    test = feat[0].properties.country.indexOf("(")
                    if (test>-1)
                        country = feat[0].properties.country.split("(")[0]
                    else
                        country = feat[0].properties.country
                    str = feat[0].properties.city+", "+country+": "+feat[0].properties.headline
                    tooltipIt(str,d3.mouse(d3.select("body").node()))
                }
            }

            d3.timeout(function(e) {
                start = Date.now();
                canvas.call(drag);
                canvas.on("click",clickCanvas)
                timer = d3.timer(timerCallback)
            },500)

            const drawSphere = function(sphere,land,borders,countries_,features) {
                if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
                    canvas.width = innerWidth;    // resize canvas
                    canvas.height = innerHeight;  // also clears the canvas
                } else {
                    context.clearRect(0, 0, canvas.width, canvas.height); // clear if not resized
                }
                context.clearRect(0, 0, width, height);

                context.beginPath();
                path(land);
                context.fillStyle = "LightGray";
                context.fill();

                context.beginPath();
                path(borders);
                context.lineWidth = 1;
                context.strokeStyle = "#fff";
                context.stroke();

                context.beginPath();
                path(grid);
                context.lineWidth = 0.5;
                context.strokeStyle = "rgba(119,119,119,.5)";
                context.stroke();

                countries_.forEach(f=>{
                    context.beginPath();
                    path(f);
                    context.fillStyle = countrycolor;
                    context.fill();
                    context.strokeStyle="white";
                    context.lineWidth=2;
                    context.stroke();
                });

                features
                    .forEach((f,i)=>{
                        let color = pincolor;
                        context.beginPath();
                        path(f)
                        context.fillStyle = color;
                        context.fill()
                        context.strokeStyle = color;
                        context.lineWidth = d3.select(".projflip").datum()=="globe"?2:2;
                        context.stroke();
                    });

                routes.forEach((r,i)=>{
                   let color = redtree;
                    context.beginPath();
                    path(r)
                    context.strokeStyle = color;
                    context.lineWidth = d3.select(".projflip").datum()=="globe"?2:2;
                    context.stroke();
                 
                    context.beginPath();
                    path(base)
                    context.strokeStyle = color;
                    context.lineWidth = d3.select(".projflip").datum()=="globe"?2:2;
                    context.stroke();
                });

            }//drawSphere
            const rotatePoints = function(cl) {
                svg.selectAll(cl).attr("d",path_svg);
            }
            function makeMenu() {
                //be able to start/stop the spinning.
                let menu = d3.select("body").insert("div",".sig")
                    .attr("id","menuDiv")
                    .attr("width",210)
                    .attr("height",100)
                    .style("text-align","right")
                    .style("position","relative")
                    .style("top","-100px")
                    .append("svg")
                    .attr("id","menu")
                    .attr("width",300)
                    .attr("height",100);

                menu.append("circle")
                    .classed("rotate",1)
                    .datum({status:"rotate"})
                    .attr("r",25)
                    .style("stroke-width",5)
                    .style("stroke","lightgrey")
                    .attr("transform","translate(110,60)")
                    .on("mouseenter",function() {
                        p = d3.mouse(d3.select("body").node())
                        if (d3.select(".projflip").datum().status=="globe") {
                            d3.select(this).style("stroke","white");
                            tooltipIt("spin the globe",p)
                            svg.selectAll(".pin")
                                .data(features)
                                .enter().append("path")
                                .classed("pin",1)
                                .attr("d",path_svg)
                                .style("fill","#2abcd9")
                                .style("stroke","#2abcd9")
                                .style("stroke-width",4);

                        }
                    })
                    .on("mouseleave",function() {
                        d3.select("#tooltip")
                            .style("display","none")
                        d3.select(this).style("stroke","darkgrey")
                    })
                    .on("click",function(d) {
                        d3.event.stopImmediatePropagation()
                        if (d3.select(".projflip").datum().status=="globe") {
                            if (d.status == "rotate") {
                                timer.stop();
                                d.status = "stop";
                                d3.select(this.parentElement).select("path#rotate")
                                    .attr("d", "M50 40 L50 80 L80 60 Z");

                            } else {
                                timer.restart(timerCallback);
                                d.status = "rotate";
                                d3.select(this.parentElement).select("path#rotate")
                                    .attr("d", "M50 50 L70 50 L70 70 L50 70 Z");
                                d3.selectAll(".pin").remove();
                            }
                        }
                    })//click rotate

                menu.append("circle")
                    .classed("projflip",1)
                    .datum({status:"globe"})
                    .attr("r",25)
                    .style("stroke-width",5)
                    .style("stroke","lightgrey")
                    .attr("transform","translate(180,60)")
                    .on("mouseenter",function() {
                        d3.select(this).style("stroke","white");
                        d3.select("#tooltip").style("display","block")
                        p = d3.mouse(d3.select("body").node())
                        d3.select(this).style("stroke","white");
                        tooltipIt("change the projection",p)
                    })
                    .on("mouseleave",function() {
                        d3.select(this).style("stroke","darkgrey");
                        d3.select("#tooltip").style("display","none")
                    })
                    .on("click",function(d){
                        d3.event.stopImmediatePropagation();
                        bool = d.status=="globe"
                        d3.select("path#rotate")
                            .style("visibility",bool?"hidden":"visible")
                        d3.select("circle.rotate")
                            .style("fill",bool?"lightgrey":"black");

                        d3.selectAll(".pin").remove();

                        d3.select("path#flip")
                            .attr("d",bool?"M23 60 L 27 60" :"M15 60 L 35 60")
                            .style("stroke-width",bool?25:15)
                        d.status=(bool)?"flat":"globe"
                        path = bool?path2:path1;
                        path_svg = bool?path2_svg:path1_svg;
                        projection = bool?projection2:projection1;
                        d3.select("#sphere").attr("d",path_svg);
                        drawSphere(sphere,land,borders,countries_,features);
                    });//click flip projection



                menu.append("path")
                    .attr("id","rotate")
                    .attr("d","M50 50 L70 50 L70 70 L50 70 Z")
                    .attr("transform","translate(50,0)")
                    .style("fill","#2abcd9")
                    .style("pointer-events","none");


                menu.append("path")
                    .attr("id","flip")
                    .style("stroke","#2abcd9")
                    .attr("transform","translate(155,0)")
                    .style("stroke-linecap","round")
                    .style("pointer-events","none")
                    .attr("d","M15 60 L 35 60")
                    .style("stroke-width",15)


            }//makeMenu


            svg.selectAll(".pin")
                .data(features)
                .enter().append("path")
                .classed("pin",1)
                .attr("d",path_svg)
                .style("fill",(d,i)=>pincolor)

            //drag to the longitude you want
            var drag = d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end",dragend);
            //don't drag all the svg points, for performance
            function dragstarted() {
                gpos0 = projection.invert(d3.mouse(this));
                o0 = projection.rotate();
                drawSphere(sphere, land, borders,countries_,features);
                d3.selectAll(".pin").remove();
                if (d3.select("circle.rotate").datum().status=="rotate") {
                    timer.stop();
                }
            }
            function dragged() {
                var gpos1 = projection.invert(d3.mouse(this));
                o0 = projection.rotate();
                let o1 = eulerAngles(gpos0, gpos1, o0);
                o1[1] = Math.max(Math.min(15,o1[1]),-15)
                projection.rotate([o1[0],o1[1],0]);
                drawSphere(sphere, land, borders,countries_,features);
            }//dragged
            function dragend() {
                //let index = d3.select("select").property("selectedIndex");
                //cat = clusterCat[index]
                if (d3.select("circle.rotate").datum().status=="rotate") {
                    d3.select("circle.rotate").datum({status:"stop"})
                    d3.select("#menu").select("path#rotate")
                        .attr("d","M50 40 L50 80 L80 60 Z");
                } else {
                    svg.selectAll(".pin")
                        .data(features)
                        .enter().append("path")
                        .classed("pin",1)
                        .attr("d",path_svg)

                }
            }

            //begin
            makeMenu();
            projection.rotate([85,-15,0]);
            drawSphere(sphere, land, borders,countries_,features);

        });//data/world-110m
    });//data/world
});//data/df


