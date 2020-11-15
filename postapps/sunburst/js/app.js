var fname = "/postapps/sunburst/data/Z.json";
var selector = "#d3_app";
var dateFormat = "%Y-%m-%d";
var colors = ["#8dd3c7","#a6cee3","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#d9ffd9","#fccd35"];

//sunbust modified from: https://bl.ocks.org/kerryrodden/766f8f6d31f645c39f488a0befa1e3c8
d3.json(fname,function(Z) {

        //toggle views
        d3.selectAll("input").on("change", function () {
            var id = d3.select(this).property("value");
            d3.selectAll("g.view").style("display", "none");
            d3.select("g#" + id).style("display", "inline");
        });

        var locations = Z.map(d=>d.location);
        var locationSet = d3.set(d3.values(locations)).values();
        locationSet.unshift("All");

        var selectLoc = d3.select("#chart").select("select");

            selectLoc.selectAll("option")
            .data(locationSet).enter().append("option")
            .attr("value",function(d) {return d})
            .text(function(d) {return d});

        selectLoc.on("change",function() {
            var location = d3.select(this).property("value");
            var Ztemp;
            if (location=="All") {
                Ztemp = Z;
                d3.select("#location").text("")
            }
            else {
                Ztemp = Z.filter(function (z) {
                    return z.location == location
                });
                d3.select("#location").text(location)
            }
            createSun(Ztemp);
        });


        var totalSize = Z.length;


        //calculate a "date elapsed field" for the spaghetti chart
        //and might be useful elsewhere
        Z.forEach(function (z) {
            z.location = locations[z.key];
            var startDate = d3.timeParse(dateFormat)(z.values[0].key.split("_")[0]);
            z.startDate = startDate;
            z.values.forEach(function (v) {
                var key = v.key.split("_");
                v.date = d3.timeParse(dateFormat)(key[0]);
                v.elapsedDays = (v.date - startDate) / 86400000;
                v.event = key[1]
            });
        });

        //some geometry
        var width = 800;
        var height = 600;
        //create Initial DOM
        var margin = {top: 10, right: 30, bottom: 10, left: 100};
        margin.width = width - margin.left - margin.right;
        margin.height = height - margin.top - margin.bottom;

        var svg = initialize({selector: selector, x: 0, y: 0, tooltip: 1, geom: margin});

        // Breadcrumbs
        var b = {
            w: 82, h: 30, s: 3, t: 10
        };

        //this is all toggle stuff to change the view
        //when we eliminate the toggle at the end, then just leave the
        //group that we need.
        svg.append("g")
            .attr("id", "sunburst")
            .classed("view", 1)
            .attr("transform","translate(-90,0)")

        //every view uses the cScale
        window.cScale = d3.scaleOrdinal()
            .domain(events)
            .range(colors);

        //sunburst
        var vis = d3.select("g#sunburst")
            .append("g")
            .attr("id","container")
            .attr("transform", "translate(" + (margin.width/2) + "," + (margin.height/2) + ")");

        var radius = Math.min(margin.width/2,margin.height/2);
        vis.append("circle")
            .attr("r", radius)
            .style("opacity", 0);

        var partition = d3.partition()
            .size([2 * Math.PI, radius * radius]);

        var arc = d3.arc()
            .startAngle(function (d) {
                return d.x0;
            })
            .endAngle(function (d) {
                return d.x1;
            })
            .innerRadius(function (d) {
                return Math.sqrt(d.y0);
            })
            .outerRadius(function (d) {
                return Math.sqrt(d.y1);
            });

        vis.append("text")
            .attr("id","expl")
            .attr("text-anchor","middle")
            .style("visibility","hidden")
            .append("tspan")
            .html("<tspan id=percentage></tspan> <tspan id=plural>families</tspan> on this journey</tspan>")
            .style("font-size","75%");

        vis.append("text")
            .attr("id","intro")
            .attr("text-anchor","middle")
            .html("<tspan id=num></tspan> families")
            .style("fill","grey");

        vis.append("text")
            .attr("id","location")
            .attr("y",20)
            .style("font-size","75%")
            .attr("text-anchor","middle")
            .text("")
            .style("fill","grey");

        initializeBreadcrumbTrail();
        drawLegend();
        createSun(Z);

        //functions
        // Generate a string that describes the points of a breadcrumb polygon.
        function breadcrumbPoints(d, i) {
            var points = [];
            points.push("0,0");
            points.push(b.w + ",0");
            points.push(b.w + b.t + "," + (b.h / 2));
            points.push(b.w + "," + b.h);
            points.push("0," + b.h);
            if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
                points.push(b.t + "," + (b.h / 2));
            }
            return points.join(" ");
        }

        function buildHierarchy(csv) {
            var root = {"name": "root", "children": []};
            for (var i = 0; i < csv.length; i++) {
                var sequence = csv[i][0];
                var size = +csv[i][1];
                var set = csv[i][2];
                if (isNaN(size)) { // e.g. if this is a header row
                    continue;
                }
                var parts = sequence.split("_");
                var currentNode = root;
                for (var j = 0; j < parts.length; j++) {
                    var children = currentNode["children"];
                    var nodeName = parts[j];
                    var childNode;
                    if (j + 1 < parts.length) {
                        // Not yet at the end of the sequence; move down the tree.
                        var foundChild = false;
                        for (var k = 0; k < children.length; k++) {
                            if (children[k]["name"] == nodeName) {
                                childNode = children[k];
                                foundChild = true;
                                break;
                            }
                        }
                        // If we don't already have a child node for this branch, create it.
                        if (!foundChild) {
                            childNode = {"name": nodeName, "children": []};
                            children.push(childNode);
                        }
                        currentNode = childNode;
                    } else {
                        // Reached the end of the sequence; create a leaf node.
                        childNode = {"name": nodeName, "size": size, set:set};
                        children.push(childNode);
                    }
                }
            }
            return root;
        };

        function createSun(Z) {
            var sunburstData = Z.map(function (d) {
                return {key: d.key,path:d.values.map(function (e) {
                    return e.event
                        .replace(/^[0-9]*/, "")
                }).join("_")
                    .concat("_end")}
            });

            var sunburstSet = [];
            d3.set(sunburstData.map(function(d) {return d.path})).values()
                .forEach(function(d) {
                    var v = sunburstData.filter(function(e) {return d == e.path});
                    sunburstSet.push([d, v.length, v])
                });

            var json = buildHierarchy(sunburstSet);
            createVisualization(json,sunburstData);
        }

        function createVisualization(json,sunburstData) {
            var newL = sunburstData.length;
            d3.select("#intro #num").text(newL);

            var root = d3.hierarchy(json)
                .sum(function (d) {
                    return d.size
                })
                .sort(function (a, b) {
                    return b.value - a.value
                });
            // For efficiency, filter nodes to keep only those large enough to see.
            var nodes = partition(root).descendants()
                .filter(function(d) {
                    return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
                });

            var path = vis.data([json]).selectAll("path")
                .data(nodes,function(d) {return d.ancestors().map(d=>d.data.name).join("_")});

            path.enter().append("path")
                .attr("display", function(d) { return d.depth ? null : "none"; })
                .attr("d", arc)
                .classed("arc",1)
                .attr("fill-rule", "evenodd")
                .style("fill", function(d) {return cScale(d.data.name); })
                .style("opacity", 1)
                .style("stroke-width",function(d) {return d.value<5?0.5:1})
                .style("stroke",function(d) {return ((d.x1- d.x0)<(0.05))?cScale(d.data.name):"white"})
                .on("mouseover",mouseover);

            path.attr("d",arc)
            path.style("fill", function(d) {return cScale(d.data.name); })
                .style("stroke",function(d) {return d.value<5?cScale(d.data.name):"white"});

            path.exit().remove();

            d3.selectAll(".arc")
                .filter(function(d) {return d.data.name=="end"})
                .remove();

            // Add the mouseleave handler to the bounding circle.
            //the bounding circle is too big (ready for the 17 event family
            //but single families are too thin to show up on the plot
            d3.select("#container").select("circle").attr("r",230)
                .style("fill","#fafafa")
                .style("opacity",1);

            d3.select("#container").on("mouseleave", mouseleave);

            d3.select("#expl").raise();

            // Fade all but the current sequence, and show it in the breadcrumb trail.
            function mouseover(d) {
                var route = d.ancestors().reverse()
                    .map(function(d) {return d.data.name});
                route.shift();
                route = route.join("_");

                //this is the set of family IDs that belong in this arc
                var rawData = sunburstData.filter(function(d) {
                    return d.path.split(route)[0]==""
                }).map(function(d) {
                    return d.key
                });


                d3.select("#intro").style("visibility","hidden");
                var percentage = (100 * d.value / totalSize).toPrecision(3);
                var percentageString = percentage + "%";
                if (percentage < 0.1) {
                    percentageString = "< 0.1%";
                }

                d3.select("#percentage")
                    .text(d.value);

                if (d.value==1) {
                    d3.select("#plural").text("family")

                } else {
                    d3.select("#plural").text("families")
                    }

                d3.select("#trail")
                    .style("visibility", "");
                d3.select("#expl").style("visibility","");

                var sequenceArray = d.ancestors().reverse();
                sequenceArray.shift(); // remove root node from the array
                updateBreadcrumbs(sequenceArray, percentageString);

                // Fade all the segments.
                d3.selectAll("path")
                    .style("opacity", 0.15);

                // Then highlight only those that are an ancestor of the current segment.
                vis.selectAll("path")
                    .filter(function(node) {
                        return (sequenceArray.indexOf(node) >= 0);
                    })
                    .style("opacity", 1);
            }

            function mouseleave() {
                // Hide the breadcrumb trail
                d3.select("#trail")
                    .style("visibility", "hidden");

                d3.select("#expl")
                    .style("visibility", "hidden");
                // Deactivate all segments during transition.
                d3.selectAll("path").on("mouseover", null);

                // Transition each segment to full opacity and then reactivate it.
                d3.selectAll("path")
                    .transition()
                    .duration(400)
                    .style("opacity", 1)
                    .on("end", function() {
                        d3.select(this).on("mouseover", mouseover);
                    });

                d3.select("#trail")
                    .style("visibility", "hidden");
                d3.select("#intro").transition().delay(400).style("visibility","");
            }
        };

        function drawLegend() {

            // Dimensions of legend item: width, height, spacing, radius of rounded rect.
            var li = {
                w: 85, h: 30, s: 3, r: 3
            };

            var legend = d3.select("g#sunburst").append("g")
                .attr("width", li.w)
                .attr("height", cScale.domain().length * (li.h + li.s))
                .attr("transform","translate(0,50)")
                .attr("id","legend");

            var g = legend.selectAll("g")
                .data(cScale.domain())
                .enter().append("g")
                .attr("transform", function(d, i) {
                    return "translate(0," + i * (li.h + li.s) + ")";
                });

            g.append("rect")
                .attr("rx", li.r)
                .attr("ry", li.r)
                .attr("width", li.w)
                .attr("height", li.h)
                .style("fill", function(d) { return cScale(d); });

            g.append("text")
                .attr("x", li.w / 2)
                .attr("y", li.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(function(d) { return d; });
        }

        function findLocationInfo(sheet) {
            var locations = {};
            var keys = d3.keys(sheet[0]);
            sheet.forEach(function(row) {
                locations[row[keys[0]]] = row[keys[1]];
            })
            return locations
        }

        function initializeBreadcrumbTrail() {
            // Add the svg area.
            var trail = d3.select("g#sunburst").append("g")
                .attr("id", "trail")
            // .attr("transform","translate("+(-margin.width/2)+","+(-margin.height/2)+")")
            // Add the label at the end, for the percentage.
            trail.append("text")
                .attr("id", "endlabel")
                .style("fill", "#000");
        }


      // Update the breadcrumb trail to show the current sequence and percentage.
        function updateBreadcrumbs(nodeArray, percentageString) {

            // Data join; key function combines name and depth (= position in sequence).
            var trail = d3.select("#trail")
                .selectAll("g")
                .data(nodeArray, function(d) { return d.data.name + d.depth; });

            // Remove exiting nodes.
            trail.exit().remove();

            // Add breadcrumb and label for entering nodes.
            var entering = trail.enter().append("g");

            entering.append("polygon")
                .attr("points", breadcrumbPoints)
                .style("fill", function(d) { return cScale(d.data.name); });

            entering.append("text")
                .attr("x", (b.w + b.t) / 2)
                .attr("y", b.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(function(d) { return d.data.name.replace(" - "," "); })
                .style("font-size","8px");

            // Merge enter and update selections; set position for all nodes.
            entering.merge(trail).attr("transform", function(d, i) {
                return "translate(" + i * (b.w + b.s) + ", 0)";
            });

            // Now move and update the percentage at the end.
            d3.select("#trail").select("#endlabel")
                .attr("x", (nodeArray.length + 0.25) * (b.w + b.s))
                .attr("y", b.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(percentageString)
                .style("font-size","8px");

            // Make the breadcrumb trail visible, if it's hidden.
            d3.select("#trail")
                .style("visibility", "");
        }

        function initialize(obj) {
            svg = d3.select(obj.selector).append("svg")
                .attr("viewBox","0 0 "+obj.geom.width+" "+obj.geom.height)
                .append("g")
                .attr("id","chart")
                .attr("transform","translate("+obj.geom.left+","+obj.geom.top+")");
            if (obj.x) svg.append("g")
                .classed("x",1)
                .classed("axis",1)
            if (obj.y) svg.append("g")
                .classed("y",1)
                .classed("axis",1);

            if (obj.tooltip) {
                var tooltip = d3.select(obj.selector).append("div")
                    .attr("id", "tooltip");

                ["header1", "header-rule", "header2"]
                    .forEach(function (c) {
                        tooltip.append("div")
                            .classed(c, 1);
                    });
            }
            return svg
        }
    })
    .get();




