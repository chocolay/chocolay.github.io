//queue
(function(){function n(n){function t(){for(;f=a<c.length&&n>p;){var u=a++,t=c[u],r=l.call(t,1);r.push(e(u)),++p,t[0].apply(null,r)}}function e(n){return function(u,l){--p,null==d&&(null!=u?(d=u,a=s=0/0,r()):(c[n]=l,--s?f||t():r()))}}function r(){null!=d?v(d):i?v(d,c):v.apply(null,[d].concat(c))}var o,f,i,c=[],a=0,p=0,s=0,d=null,v=u;return n||(n=1/0),o={defer:function(){return d||(c.push(arguments),++s,t()),o},await:function(n){return v=n,i=!1,s||r(),o},awaitAll:function(n){return v=n,i=!0,s||r(),o}}}function u(){}"undefined"==typeof module?self.queue=n:module.exports=n,n.version="1.0.4";var l=[].slice})();

//globals
var HALFPI = Math.PI/2;
var arc = d3.svg.arc().innerRadius(455).outerRadius(475);

(function() {
    var outerRadius = 700,

        innerRadius = outerRadius*0.82,
        bubbleRadius = outerRadius*0.7,
        linkRadius = outerRadius*0.77,

        nodesTranslate = outerRadius*0.47,
        chordsTranslate = outerRadius*1.17;

    var svg = d3.select("#d3_app").append("div")
        .attr("id","svgDiv")
        .append("svg")
        .attr({
            "viewBox": "0 0 " + (outerRadius*2.3) +" "+(outerRadius*2.3),
            "preserveAspectRatio": "xMidYMin"
        });

    svg.append("g")
        .classed("chords", 1)
        .attr("transform", "translate(" + chordsTranslate + "," + chordsTranslate + ")");

    svg.append("g")
        .classed("links", 1)
        .attr("transform", "translate(" + chordsTranslate + "," + chordsTranslate + ")");

    svg.append("g")
        .classed("nodes", 1)
        .attr("transform",  "translate(" + nodesTranslate + "," + nodesTranslate + ")");

})();

function log(message) {
    //  console.log(message);
}

//convenience function to find objects in an array of objects, by their key-value pair
function filterByKey(arr, key, value) {
    return arr.filter(function (el) {
        return el[key] == value;
    })
}

//initialize
function initialize(C,L,R,linkWords) {
    //this is the circular pack layout
    var nodes = d3.layout.pack()
        .sort(null)
        .size([970,870])
        .padding(1.5)
        .nodes({children: [
                {
                    children : C,
                    value    : d3.sum(C.map(function(d) {return d.value}))
                }
            ]})
        .filter(function(d) {return d.depth==2});


    //these create the links between the outer ring and the circles
    nodes.forEach(function (d) {
        d.relatedLinks  =  L.filter(function(el) {return el[linkWords[0]] ==d[linkWords[0]]});
    });

    return {
        nodes  : nodes,
        chords : buildLinks(R,L,linkWords[1])
    }
}

//events
d3.select("#d3_app").on("click", function() {
    var currentView = d3.select("#d3_app").datum();
    main({view:"mainView",angles:{startAngle: 0, endAngle: 0}});
});

d3.select("input#newData").on("change",function() {
    var view = d3.select("input#newData").property("checked")?"newView":"mainView";
    main({view:view,angles:{startAngle: 0, endAngle: 0}});
});

d3.select("#headerLeft").on("click",function() {
    d3.select(this).selectAll(".vanisher").style("display","none")
})
                                                
var duration = 500;

var tooltip = {};

tooltip.circle = function (d, Rings, info, linkWord) {
    if (d.depth < 2 || meta.completeStatus==false) return;
    d3.select("#toolTip").transition()
        .duration(duration)
        .style("opacity", ".9");
 
    d3.select("#header1").text(info["header1Tag"]);
    d3.select("#head").text(d[info.header]);
    d3.select("#header2").text("Total Access: " + d3.format(",.0f")(d.value));
    d3.select("#toolTip")
        .style({
            "left": (d3.event.pageX + 15) + "px",
            "top": (d3.event.pageY - 75) + "px",
            "height": "100px"
        });

    highlightLinks(d, true, linkWord,false);
};

tooltip.link = function (d, Rings, info, linkWord) {
    if (meta.completeStatus==false) return;
    d3.select("#toolTip").transition()
        .duration(duration)
        .style("opacity", ".9");

    d3.select("#header1").text(filterByKey(Rings,linkWord[1], d[linkWord[1]])[0][info.header1]);
    d3.select("#head").text(d[info.header]);
    d3.select("#header2").text(d3.format(",.0f")(d[info.header2]));
    d3.select("#toolTip")
        .style({
            "left" : (d3.event.pageX + 15) + "px",
            "top"  : (d3.event.pageY - 75) + "px",
            "height": "100px"
        });

    highlightLink(d, true, linkWord);
};

tooltip.text = function(d,Rings,info,linkWord) {
    if (meta.completeStatus==false) return;
    d3.select("#toolTip").transition()
        .duration(duration)
        .style("opacity", ".9");

    d3.select("#header1").text("Active Directory Group");

    d3.select("#head").text(filterByKey(Rings,linkWord[1],d[info.pluck])[0][info.header])
    d3.select("#header2").text("Total Access: " + d3.format(",.0f")(filterByKey(Rings,linkWord[1],d[info.pluck])[0].Amount));

    d3.select("#toolTip")
        .style({
            "left"   : (d3.event.pageX+15) + "px",
            "top"    : (d3.event.pageY-75) + "px",
            "height" : "110px"
        });

    var choose = filterByKey(d3.selectAll("g.arc").data(),"label", d.label)[0];
    highlightLinks(choose,true,linkWord,true);
};

function mouseout(d,type,linkWord) {
    if (meta.completeStatus==false) return;
    if (type =="link") highlightLink(d,false,linkWord);
    else {
        highlightLinks(d,false,linkWord,false)
    }

    d3.select("#toolTip").transition()
        .duration(duration*2)
        .style("opacity", 1e-6);
}

function highlightLink(g,on,l) {
    //Link
    d3.select("#l_" + g.Key)
        //           .transition().duration(on?150:550)
        .transition().duration(duration)
        .style({
            "fill-opacity"   : on ? .6 : .1,
            "stroke-opacity" : on ? .6 : .1
        });

    //Arc
    d3.select("#a_" + g.Key)
        .transition().duration(duration)
        //           .transition().duration(on?150:550)
        .style("fill-opacity", on ? .6 :.2);

    //circle
    d3.select("#c_" + g[l[0]])
        .transition().duration(duration)
        //         .transition().duration(on?150:550)
        .style("opacity",on ?1 :0);

    //text
    d3.select("#t_" + g[l[1]])
        .transition().duration(duration)
        //          .transition().duration(on?0:550)
        .style({
            "fill"         :on ? "#000" : "#777",
            "font-size"    :on ? "20px" : "10px",
            "stroke-width" :on ? 2 : 0
        });
}

function highlightLinks(data,on,l,partial_highlight) {
    data.relatedLinks.forEach(function (d,i) {
        //Link
        d3.select("#l_" + d.Key)
            .transition().duration(duration)
            //         .transition().duration(on ? 150 : 550)
            .style({
                "fill-opacity": on ? .6 : .1,
                "stroke-opacity": on ? .6 : .1
            });

        //Arc
        d3.select("#a_" + d.Key)
            //         .transition().duration(on ? 150 : 550)
            .transition().duration(duration)
            .style("fill-opacity", on ? .6 : .2);

        //circle
        d3.select("#c_" + d[l[0]])
            .transition().duration(duration)
            //       .transition().duration(on ? 150 : 550)
            .style("opacity", on ? 1 : 1e-6);

        d3.selectAll(".partial_highlight")
            .style("opacity",partial_highlight?1:1e-6);
        //text
        d3.select("#t_" + d[l[1]])
            .transition().duration(duration)
            //      .transition().duration(on ? 0 : 550)
            .style({
                "fill": on ? "#000" : "#777",
                "font-size": on ? "20px" : "10px",
                "stroke-width": on ? 2 : 0
            });
    })
}

//buildLinks
function buildLinks(R,L,tag) {
    console.log(R,L,tag)
    var C = d3.layout.chord()
        .padding(.05)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending);

    var  matrix = [];
    R.forEach(function(d,index) {
        matrix[index] = d3.range(R.length).map(function() {return 0})
        matrix[index][index]= +d.Amount;
    });

    var chords = C
        .matrix(matrix)
        .chords();

    chords.forEach(function (d,i) {
        d[tag]             =  R[i][tag];
        d.label            = R[i][tag];
        d.angle            = (d.source.startAngle + d.source.endAngle)/2;
        d.startAngle       = d.source.startAngle;
        d.endAngle         =  d.source.endAngle;
        d.index            = d.source.index;
        d.currentAngle     = d.source.startAngle;
        d.currentLinkAngle = d.source.startAngle;
        d.Amount           = d.source.value;
        d.source           = d.source;
        d.relatedLinks     = L.filter(function(el) {return el[tag] ==d.label})
    });
    return chords;
}

//update
function updateLinks(renderElements, Rings, links, info, linkWord) {
    var diagonal  = d3.svg.diagonal.radial(),
        chordName = linkWord[1],
        nodeName  = linkWord[0],
        linkGroup = d3.select("g.links").selectAll("g")
            .data(links, function(d) {
                return d[chordName]+"_"+d[nodeName]
            });

    var enter = linkGroup.enter()
        .append("g")
        .style("opacity",1e-6);

    enter
        .transition()
        .delay(function(d,i) {return i*(1.5*duration)/links.length})
        .style("opacity",1)
        .call(endAll,function() {
            meta.completeStatus = true;
        });
    
    //  ARC SEGMENTS
    enter
        .append("path")
        .attr("id", function(d,i) {return "a_"+i})
        .attr("class", classAssign)
        .style({
            "fill":color,
            "fill-opacity": .2,
        })
        .attr("d", createArc);

    linkGroup
        .on({
            "mouseover" : function (d) {tooltip.link(d,Rings, info,linkWord);},
            "mouseout"  : function (d) {mouseout (d,"link", linkWord);}
        })
        .on("click", function() {
            if (meta.completeStatus==false) return;
            d3.event.stopPropagation();
            main({view:"arcClickView",angles:arcAngle(d3.select(this).datum())});
        });

    // LINKS
    enter.append("path")
        .classed("link",1)
        .attr("class", classAssign)
        .attr("id", function(d,i) {return "l_"+ d.Key})
        .attr("d", createDiag)
        .style({
            "stroke"          : color,
            "fill"            : color
        });

    linkGroup.selectAll("path")
        .on({
            "mouseover" : function (d) {tooltip.link(d,Rings, info,linkWord);},
            "mouseout"  : function (d) {mouseout (d,"link", linkWord);},
            "click"     : function() {d3.event.stopPropagation();}
        });

    // NODES
    enter.append("g")
        .classed("node",1)
        .append("circle")
        .style({
            "fill": color,
            "fill-opacity": 0.2,
            "stroke-opacity": 1
        })
        .attr({
            "r"  : createCircleRadius,
            "cx" : function(d) {return d.links[0].target.x},
            "cy" : function(d) {return d.links[0].target.y}
        })
        .attr("class", classAssign);


    linkGroup.exit().remove();

    function arcAngle(d) {
        var newArc = {};
        var relatedChord = filterByKey(renderElements.chords,linkWord[1],d[linkWord[1]])[0];
        var angleDiff = (relatedChord.endAngle-relatedChord.startAngle);

        newArc.startAngle = relatedChord.currentAngle;
        newArc.endAngle = relatedChord.currentAngle = relatedChord.currentAngle + (d[info.setAngle]/relatedChord.Amount)*angleDiff;
        //don't see that this is necessary
        //    newArc.value = d[info.setAngle];
        return newArc;
    }

    function createArc(d) {
        return arc(arcAngle(d));
    }

    function createDiag(d, i) {
        d.links = createLinks(d);
        var diag = diagonal(d.links[0], i);
        diag += "L" + String(diagonal(d.links[1], i)).substr(1);
        diag += "A" + (455) + "," + (455) + " 0 0,0 " + d.links[0].source.x + "," + d.links[0].source.y;
        return diag;
        function createLinks(d) {
            var target = {};
            var source = {};
            var link = {};
            var link2 = {};
            var source2 = {};


            var relatedChord = filterByKey(renderElements.chords,linkWord[1],d[linkWord[1]])[0];

            var relatedNode = filterByKey(renderElements.nodes,linkWord[0],[d[nodeName]])[0];
            var r = 455;
            var currX = (r * Math.cos(relatedChord.currentLinkAngle - HALFPI));
            var currY = (r * Math.sin(relatedChord.currentLinkAngle - HALFPI));

            var a = relatedChord.currentLinkAngle - HALFPI; //-90 degrees

            relatedChord.currentLinkAngle = relatedChord.currentLinkAngle + (d[info.setAngle]/relatedChord.Amount)*(relatedChord.endAngle - relatedChord.startAngle);
            var a1 = relatedChord.currentLinkAngle - HALFPI;

            source.x = (r * Math.cos(a));
            source.y = (r * Math.sin(a));
            target.x = relatedNode.x - (490);
            target.y = relatedNode.y - (490);
            source2.x = (r * Math.cos(a1));
            source2.y = (r * Math.sin(a1));
            link.source = source;
            link.target = target;
            link2.source = target;
            link2.target = source2;

            return [link, link2];
        }
    }

    function createPause(d,i) {
        var relatedChord = filterByKey(renderElements.chords,linkWord[1],d[linkWord[1]])[0];
        return relatedChord.currentLinkAngle - HALFPI; //-90 degrees
    }

    function createCircleRadius(d) {
        var relatedNode = filterByKey(renderElements.nodes,linkWord[0],[d[nodeName]])[0];
        relatedNode.currentAmount = relatedNode.currentAmount - d[info.setAngle];
        var ratio = ((relatedNode.Amount - relatedNode.currentAmount) / relatedNode.Amount);
        return relatedNode.r * ratio;
    }
}

function updateNodes(renderElements, Rings, links, info,linkWord) {
    var node = d3.select("g.nodes").selectAll("g")
        .data(renderElements.nodes, function (d) {
            return d[linkWord[0]];
        });

    var enter=node.enter().append("g")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .style("opacity",1e-6);

    enter.transition().delay(links.length*25)
        .style("opacity",1);

    //this is the basic circles
    enter.append("circle")
        .attr("r", function(d) {return d.r; })
        .attr("class", classAssign)
        .style({
            "fill" : color,
            "fill-opacity": function (d) {return (d.depth < 2) ? 0 : 0.00},
            "stroke": color,
            "stroke-opacity": function (d) {return (d.depth < 2) ? 0 : 0.2},
        })

    //this is building a "trim" with two cocentric circles
    // for the mouseover events on the links or the circles?
    //it could be handled more effienciently with a gradient
    var g=enter.append("g")
        .attr("id", function(d) {return "c_" + d[info.idTag]; })
        .style("opacity",0);

    g.append("circle")
        .attr("r", function(d) { return d.r+2; })
        .style({
            "fill-opacity"   : 0,
            "stroke"         : "#fff", //white circle
            "stroke-width"   : 2.5,
            "stroke-opacity" : 0.7});

    g.append("circle")
        .attr("r", function(d) { return d.r;})
        .style({
            "fill-opacity"    : 0,
            "stroke"         : "#ffb751",//this was the black circle I think looks out of place
            "stroke-width"   : 2.5,
            "stroke-opacity" : 1
        })
        .on({
            "mouseover" : function (d) {tooltip.circle(d, Rings, info, linkWord);},
            "mouseout"  : function (d) {mouseout(d,"circle",linkWord);}
        })
        .on("click", function() {
            if (meta.completeStatus==false) return;
            d3.event.stopPropagation();
            main({view:"circleClickView", angles:{startAngle:0,endAngle:0}});
        });

    //popup box for labeling on highlight Links
    var partialText = g.append("text")
        .text(function(d) {return d[info.header]})
        .classed("partial_highlight",1)
        .style({
            "font-size":"2.5em",
            "text-anchor":"middle",
            "fill":"#333"
        });

    g.selectAll("text").each(function() {

        bbox = this.getBBox();
        d3.select(this.parentElement).insert("rect", "text")
            .classed("partial_highlight", 1)
            .classed("test", 1)
            .attr({
                "x": bbox.x - 5,
                "y": bbox.y - 5,
                "width": bbox.width + 10,
                "height": bbox.height + 10
            })
            .style({
                "fill": "#FFFFEF",
                "stroke":"#333"
            })
    })

    node.exit().remove();

}

function updateArcs(renderElements,Rings,info,linkWord,angles) {
    var duration = 500;
    var angle = d3.mean(d3.values(angles))*180/Math.PI-90;

    keyName = info.idTag,
        keyID = linkWord[1];

    var arcGroup = d3.select("g.chords").selectAll("g")
        .data(renderElements.chords, function (d,i) {
            return d[keyID];
        });


    var enter = arcGroup.enter()
        .append("g").attr("class","arc");

    //TEXT
    //position the labels around the ring
    var str0 =  "rotate(" + angle+")translate(481)";
    if (d3.mean(d3.values(angles))>Math.PI) str0 = str0+"rotate(180)";

    enter.append("text")
        .attr({
            "id"          : function (d) {return "t_"+ d.label},
            "dy": ".35em",
            "text-anchor": function(d) {return angle > Math.PI ?"end":"start"},
            "transform": str0
        })
        .style({
            "fill": '#777',
            "font-size": "20px"
        })
        .text(function(d) {return trimLabel(filterByKey(Rings,keyID, d[info.pluck])[0][keyName])})

    arcGroup.on({
        "mouseover" : function (d) {tooltip.text(d,Rings,info,linkWord);},
        "mouseout" :  function (d) {mouseout(d,"text",linkWord);}
    })
        .on("click", function() {
            if (meta.completeStatus==false) return;
            d3.event.stopPropagation();
            var ang = d3.select(this).datum().angle;
            main({view:"arcClickView",angles:{startAngle: ang, endAngle: ang}});
        });


    var arcText = arcGroup.select("text");

    arcText
        .transition().ease("linear").duration(duration)
        .attrTween("transform", function(d) {
            var ang = d.angle*180/Math.PI-90;
            var str = "rotate("+ang+")translate(481)";
            if (d.angle>Math.PI) str = str+"rotate(180)";
            return d3.interpolateString(str0,str);
        })
        .attr({
            "text-anchor": function(d) {return d.angle > Math.PI ?"end":"start"}
        });

    arcText
        .transition().delay(duration).duration(duration*2)
        .style("font-size","10px");


    //ARCS
    enter.append("path")
        .classed("arc",1)
        .style({
            "fill-opacity"   : 0,
            "stroke"        : "#555",
            "stroke-opacity": 0.4
        })
        .attr({"d": function(d) {return arc(angles)}})

    arcGroup
        .select("path")
        .transition()
        .ease("linear")
        .duration(duration)
        .attrTween("d",arcTween)

    arcGroup.exit()
        .remove();


    function arcAngle(d) {
        var newArc = {};
        var relatedChord = filterByKey(renderElements.chords,linkWord[1],d[linkWord[1]])[0];
        var angleDiff = (relatedChord.endAngle-relatedChord.startAngle);

        newArc.startAngle = relatedChord.currentAngle;
        newArc.endAngle = relatedChord.currentAngle = relatedChord.currentAngle + (d[info.setAngle]/relatedChord.Amount)*angleDiff;
        //don't see that this is necessary
        //    newArc.value = d[info.setAngle];
        return newArc;
    }

    function trimLabel(label) {
        return (label.length>25)?String(label).substr(0,25)+"...":label;
    }

    function arcTween(b) {
        var data = {};
        return function(t) {
            data.endAngle = d3.interpolate(angles.endAngle,b.endAngle)(t);
            data.startAngle = d3.interpolate(angles.startAngle,b.source.startAngle)(t);
            return arc(data);
        }
    }
}

function color(d) {
    return (typeof d.COLOR !="undefined" && d.COLOR.charAt(0)=="#")? d.COLOR:"undefined"
}

function classAssign(d) {
    var existingClass = d3.select(this).attr("class");
    d.class = d.class?d.class:"";
    return existingClass ? existingClass + " " + d.class : d.class
}


function endAll (transition, callback) {
    var n;

    if (transition.empty()) {
        callback();
    }
    else {
        n = transition.size();
        transition.each("end", function () {
            n--;
            if (n === 0) {
                callback();
            }
        });
    }
}

//main

//ancillary information about the datasets
//will allow for better structure to the data... if desired
//initially:
//Systems go in the inner circles
//Groups go in the outer ring
//UserAccess creates the links

//linkWords are the common keys between files

var meta = {
    mainView: {
        dirname: "/postapps/linkviews/data/", filesnames: ["Systems", "UserAccess", "Groups"],
        linkWords: ["CAND_ID", "CMTE_ID"],
        nodeInfo: {idTag: "CAND_ID", header: "CAND_NAME", header1Tag: "System"},
        chordInfo: {idTag: "CMTE_NM", pluck: "label", header: "CMTE_NM"},
        linkInfo: {
            setAngle: "TRANSACTION_AMT",
            header1: "CMTE_NM",
            header: "CAND_NAME",
            header2: "TRANSACTION_AMT"
        },
        headerText : "Groups (outer ring) to Systems (circles)"
    },
    circleClickView: {
        dirname: "/postapps/linkviews/drilldowndata/applications/", filesnames: ["Systems", "UserAccess", "Groups"],
        linkWords: ["CAND_ID", "CMTE_ID"],
        nodeInfo: {idTag: "CAND_ID", header: "CAND_NAME", header1Tag: "Application"},
        chordInfo: {idTag: "CMTE_NM", pluck: "label", header: "CMTE_NM"},
        linkInfo: {
            setAngle: "TRANSACTION_AMT",
            header1: "CMTE_NM",
            header: "CAND_NAME",
            header2: "TRANSACTION_AMT"
        },
        headerText : "Groups (outer ring) to Applications (circles) "

    },
    arcClickView: {
        dirname: "/postapps/linkviews/drilldowndata/group/", filesnames: ["Systems", "UserAccess", "Groups"],
        linkWords: ["CAND_ID", "CMTE_ID"],
        nodeInfo: {idTag: "CAND_ID", header: "CAND_NAME", header1Tag: "System"},
        chordInfo: {idTag: "CMTE_NM", pluck: "label", header: "CMTE_NM"},
        linkInfo: {
            setAngle: "TRANSACTION_AMT",
            header1: "CMTE_NM",
            header: "CAND_NAME",
            header2: "TRANSACTION_AMT"
        },
        headerText : "Users (outer ring) to Systems (circles)"
    },
    newView: {
        dirname: "/postapps/linkviews/newData/", filesnames: ["S", "U", "G"],
        linkWords: ["systemID", "ID"],
        nodeInfo: {idTag: "systemID", header: "system", header1Tag: "System"},
        chordInfo: {idTag: "user", pluck: "label", header: "user"},
        linkInfo: {
            setAngle: "TRANSACTION_AMT",
            header1: "user",
            header: "system",
            header2: "TRANSACTION_AMT"
        },
        headerText : "New Data"
    }
};

d3.select(".post-image")
    .style("background-color","white");

//initial setup
setTimeout(function() {
    main({view:"mainView",angles:{startAngle:0,endAngle:0}});

},500)

setTimeout(function() {
    d3.select("#d3_app").style("height",d3.select("#svgDiv").style("height"))
    d3.selectAll(".link, .arc, circle,svg").property("cursor","pointer")
},1200)

d3.select("body").node().onresize = function() {
    d3.select("#d3_app").style("height",d3.select("#svgDiv").style("height"))
};


//once a view is selected, create the chart
function main(obj) {
    //this will keep other transitions from firing while the DOM are being created
    var view = obj.view;

    if (view!=d3.select("#d3_app").datum()) {
        meta.completeStatus = false;
        //hide the old tooltip... because the content has been changed.
        d3.select("#toolTip").transition().duration(250)
            .style("opacity", 1e-6);

        d3.select("input#newData").property("checked", view == "newView");

        //keep track of the view; may want to know it for toggling purposes.
        d3.select("#d3_app").datum(view);

        //we're removing these links because we're switching amongst unlike datasets
        //and so the object constancy isn't logical
        d3.selectAll("g.links, g.nodes")
            .selectAll("*")
            .remove();

        //choose the appropriate set of data
        var dataset = meta[view];

        d3.select("header h1")
            .text(dataset.headerText);

        //check to see if the dataset has already been loaded
        if (!meta[view].elements) {
            var q = queue();
            dataset.filesnames.forEach(function (name) {
                q.defer(d3.csv, dataset.dirname + name + ".csv")
            });
            //main callback for creating the visual
            q.await(function (error, CircleData, LinkData, RingData) {
                if (error) throw error;

                CircleData.forEach(function (d) {
                    d.value = +d.Amount;
                    d.Amount = +d.Amount;
                    d.currentAmount = d.Amount; //this will get decreased to make the stack of circles
                });

                LinkData.forEach(function (d, i) {
                    d.Key = "ID" + (i++)
                    //    d.fullKey = [d[l[0]],d[l[1]]];
                });

                //these get saved for later views so we don't have to keep
                //banging the server for the data
                meta[view].elements = initialize(CircleData, LinkData, RingData, dataset.linkWords);
                meta[view].rings = RingData;
                //the reverse in the following line isn't necessary; it just keeps the "look" consistent with the original
                meta[view].links = LinkData.reverse();

                updateArcs(meta[view].elements, meta[view].rings, dataset.chordInfo, dataset.linkWords, obj.angles); //text
                updateLinks(meta[view].elements, meta[view].rings, meta[view].links, dataset.linkInfo, dataset.linkWords); //links
                updateNodes(meta[view].elements, meta[view].rings, meta[view].links, dataset.nodeInfo, dataset.linkWords);  //circles
            }); //end await callback
        }
        else { //the dataset is already present
            //reset this so the stack of circles
            //appears properly in the updateLinks function
            meta[view].elements.nodes.forEach(function (d) {
                d.currentAmount = d.Amount;
            });
            //reset this so the arcs are filled properly
            d3.values(meta[view].elements.chords).forEach(function (d) {
                d.currentLinkAngle = d.startAngle;
                d.currentAngle = d.startAngle;
            });
            updateArcs(meta[view].elements, meta[view].rings, dataset.chordInfo, dataset.linkWords, obj.angles); //text
            updateLinks(meta[view].elements, meta[view].rings, meta[view].links, dataset.linkInfo, dataset.linkWords); //links
            updateNodes(meta[view].elements, meta[view].rings, meta[view].links, dataset.nodeInfo, dataset.linkWords);  //circles
        }
    }
}
