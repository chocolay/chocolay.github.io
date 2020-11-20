var ua = window.navigator.userAgent;
var msie = ua.indexOf("MSIE ");

if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
    d3.selectAll("#mapModule *").remove();
    d3.select("#mapModule")
        .append("div")
        .text("Este boceto está optimizado sólo para navegadores Chrome y Firefox")
        .style({
            "font-size":"300%",
            "line-height":"1.25em"
        });

}

else {
    var composite_index_word = "Índice compuesto";

    var cset = [];
    [".overall-", ".primary-", ".secondary-1-", ".secondary-2-", ".complement-"]
        .forEach(function (c) {
            [1, 2, 0, 3, 4].forEach(function (num) {
                cset.push(c + num);
            })
        });

    var colornew = {
        ".overall-1": "#D98ACF",
        ".overall-2": "#BE59B2",
        ".overall-0": "#A7389A",
        ".overall-3": "#9A1D8A",
        ".overall-4": "#790D6C",
        ".primary-1": "rgb(128, 202, 170)",
        ".primary-2": "rgb(80, 171, 132)",
        ".primary-0": "rgb(49, 148, 106)",
        ".primary-3": "rgb(26, 128, 84)",
        ".primary-4": "rgb(9, 102, 62)",
        ".secondary-1-1": "rgb(132, 157, 198)",
        ".secondary-1-2": "rgb(85, 116, 164)",
        ".secondary-1-0": "rgb(56, 90, 143)",
        ".secondary-1-3": "rgb(34, 69, 124)",
        ".secondary-1-4": "rgb(17, 49, 98)",
        ".secondary-2-1": "rgb(255, 221, 162)",
        ".secondary-2-2": "rgb(249, 201, 116)",
        ".secondary-2-0": "rgb(216, 164, 72)",
        ".secondary-2-3": "rgb(187, 133, 38)",
        ".secondary-2-4": "rgb(149, 100, 14)",
        ".complement-1": "rgb(255, 188, 162)",
        ".complement-2": "rgb(249, 154, 116)",
        ".complement-0": "rgb(216, 113, 72)",
        ".complement-3": "rgb(187, 80, 38)",
        ".complement-4": "rgb(149, 52, 14)"
    };

    var DimensionColorSet = {
        "Overall": "overall-",
        "Económica": "primary-",
        "Politica": "secondary-1-",
        "Social": "secondary-2-",
        "Ambiental": "complement-"
    };


    var state = {dims: {}, groups: {}}; //will store information that sets which dimensions to display on map
    var tau = 2 * Math.PI;
    var width = 960;
    var height = 600;

    var projection = d3.geo.mercator()
        .rotate([-11, 0])
        .translate([0.5 * width, height * 0.72])
        .scale((width - 1) / 2 / Math.PI);
    var path = d3.geo.path().projection(projection);

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 9.5])
        .size([width, height])
        .on("zoom", function () {
            gMap.style("stroke-width", 1.5 / d3.event.scale + "px");
            gMap.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        });

    var color = d3.scale.threshold()
        .domain([0, 1, 2, 3, 4, 5]);

    var legendX = d3.scale.linear()
        .domain([1, 6])
        .range([0, 300]);

    var cAxis = d3.svg.axis()
        .scale(legendX)
        .orient("bottom")
        .tickSize(20)
        .tickValues(color.domain())
        .tickFormat(d3.format("f"));

    var radius = 400;

    var sunX = d3.scale.linear()
        .range([0, tau]);

    var sunY = d3.scale.sqrt()
        .range([0, radius]);

    var arc = d3.svg.arc()
        .startAngle(function (d) {
            return Math.max(0, Math.min(tau, sunX(d.x)))
        })
        .endAngle(function (d) {
            return Math.max(0, Math.min(tau, sunX(d.x + d.dx)))
        })
        .innerRadius(function (d) {
            return Math.max(0, sunY(d.y))
        })
        .outerRadius(function (d) {
            return Math.max(0, sunY(d.y + d.dy))
        });

    var partition = d3.layout.partition()
        .value(function (d) {
            return d.s
        });


    var timeScale = d3.scale.linear()
        .domain([2005, 2015])
        .range([100, width - 100])
        .clamp(true);

    var sunSVG = d3.select("#sunburstMenu").append("svg")
        .attr({
            "viewBox": "0 0 " + width + " " + width,
            "preserveAspectRatio": "xMidYMin"
        })
        .append("g")
        .attr("transform", "translate(480,480)");

    sunSVG.append("text").attr({
        "class": "instruction"
    })
        .append("tspan").text("Haga click en el gráfico para seleccionar dimensiones y políticas")
        .attr({
            "x": 0,
            "y": -460,
            "text-anchor": "middle"
        });
    sunSVG.select("text.instruction")
        .append("tspan").text("Haga click en el espacio blanco para cerrar esta ventana")
        .attr({
            "x": 0,
            "y": -420,
            "text-anchor": "middle"
        });

    sunSVG.append("text")
        .text("Indice compuesto")
        .attr({
            "id": "overall",
            "text-anchor": "middle"
        });

    d3.select("#sunburstMenu")
        .datum("hidden")
        .on("click", function () {
            if (d3.select("#sunburstMenu").datum() == "hidden") {
                d3.select("#sunburstMenu").datum("open");
                var width = parseInt(d3.select("#mapModule").style("height")) * 0.85;
                d3.select("#sunburstMenu")
                    .transition().duration(500)
                    .style({width: width + "px", height: width + "px"});
            }

            else {
                d3.select("#sunburstMenu")
                    .selectAll("#overall")
                    .style("display", "none");

                d3.select("#sunburstMenu").datum("hidden");
                d3.select("#sunburstMenu")
                    .transition().duration(500)
                    .style({
                        "width": "64px",
                        "height": "64px"
                    });
            }
            return true;
        });

    var timeSVG = d3.select("#timeSlider").append("svg")
        .attr({
            "viewBox": "0 0 " + width + " " + 100,
            "width": "90%",
            "height": 100
        })
        .append("g")
        .attr("transform", "translate(" + 50 + "," + 60 + ")");

    timeSVG.append("g")
        .attr("class", "time axis")
        .call(d3.svg.axis()
            .scale(timeScale)
            .orient("bottom")
            .tickFormat(function (d) {
                return d
            })
            .tickSize(0)
            .tickPadding(12));


    var mapSVG = d3.select("#map").append("svg")
        .attr({
            "viewBox": "0 0 " + width + " " + height,
            "preserveAspectRatio": "xMidYMid",
            "height": (100 * height / width) + "%",
            "width": "100%"
        });

    gMap = mapSVG.append("g");

    mapSVG
        .call(zoom)
        .call(zoom.event);


    d3.select(window).on("resize", function () {
        var sun = d3.select("#sunburstMenu")
        var width = parseInt(d3.select("#mapModule").style("height")) * 0.85;
        if (sun.datum() != "hidden")
            sun.style({
                "width": width + "px",
                "height": width + "px"
            })
    })


    d3.selectAll(".zoomControl i")
        .on("click", function () {
            zoomByFactor(d3.select(this).classed("fa-search-plus") ? 1.25 : 0.8);
        });

    d3.select("#leftPanel").datum("closed");

    //closingPanels
    d3.selectAll(".closer")
        .on("click", function () {
            reset();
            d3.select(this.parentElement)
                .transition().duration(500).ease("linear")
                .style("left", "-375px");
            ;
            d3.select(this.parentElement).transition().delay(500).style("opacity", 1e-6);
        });

//when the left button is clicked, open the left panel
    d3.select("#leftButtons").on("click", function () {
        d3.select("#leftPanel").style("opacity", 1)
            .transition().duration(500).ease("linear")
            .style("left", "0px");
        d3.select("#leftPanel").selectAll("#description, table")
            .style("display", "block");
        d3.select("#leftPanel").select("#countryDetail")
            .style("display", "none");
        d3.select("#leftPanel #cname").text("Ranking");
    });


    var countries = cleanCountries(topojson
        .feature(world, world.objects.countries)
        .features);

    createMap(countries, names, flags);

    //creating the data structure
    var dimensions = ["Económica", "Politica", "Social", "Ambiental"];
    //populate the policy menu
    var data = createData(dimensions, dummy), //flat dummy data
        policies = {},
        Descriptions = {};
    dimensions.forEach(function (dimension) {
        policies[dimension] = d3.set(data.filter(function (d) {
            return d.dimension == dimension
        }).map(
            function (d) {
                return d.policy
            })).values();
        Descriptions[dimension] = {};
        policies[dimension].forEach(function (policy) {
            Descriptions[dimension][policy] = dimension + ": " + policy;
        });
    });

    //initiate chart
    state.dimension = null;
    state.policy = null;
    state.year = 2012;

    // should these lines be moved out of the callback fu(nction?
    var brush = d3.svg.brush()
            .x(timeScale)
            .extent([state.year, state.year])
            .on("brush", brushed)
            .on("brushend", brushended),

        slider = timeSVG.append("g")
            .classed("slider", true)
            .call(brush);

    slider.selectAll(".extent,.resize").remove();
    slider.select("background").attr("height", 100);

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(0,0)")
        .attr("r", 10);

    slider
        .call(brush.event);

    timeSVG.select(".domain")
        .on("click", function () {
            state.year = Math.round(timeScale.invert(d3.mouse(this)[0]));
            d3.select(".handle").attr("cx", timeScale(state.year) + "px");
            newState();
        });

    newState();

    d3.selectAll(".country")
        .on("click", countryDetail);


    d3.select("#mapModule #main")
        .style("display", "block");
    d3.select("#loading").remove();

    createSun(data);

}

//FUNCTIONS

    function brushed() {
        var value = brush.extent()[0];
        if (d3.event.sourceEvent) {
            value = timeScale.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
        }
        handle.attr("cx", timeScale(value));
    }

    function brushended() {
        if (!d3.event.sourceEvent) return; // only transition after input
        var extent0 = brush.extent(),
            extent1 = extent0.map(Math.round);

        brush.extent(extent1);
        handle.attr("cx", timeScale(extent1[0]));
        state.year = extent1[0];
        newState();
    }

    function countryDetail() {
        //TODO see how this gets called
        var sel = d3.select(this).datum(),
            id = sel.id || +d3.keys(names)[d3.values(names).indexOf(sel)];

        if (d3.select(this).style("fill") != "rgb(227, 227, 227)") {
            d3.selectAll("path.country")
                .transition().duration(500)
                .style({
                    "fill-opacity": function (d) {
                        return d.id == id ? 1 : 0.1
                    },
                    "stroke-width": function (d) {
                        return d.id == id ? 1 : 0
                    },
                    "stroke": function (d) {
                        var c;
                        if (d.id != id) c = null;
                        else {
                            if (d3.rgb(d3.select(this).style("fill")).hsl().l < 0.2) {
                                c = d3.rgb(204, 171, 171).toString();
                            }
                            else c = "black";
                        }
                        return c
                    }
                });

            d3.select("#leftPanel").style("opacity", 1);
            d3.select("#leftPanel")
                .transition().duration(500).ease("linear")
                .style("left", "0px");
            d3.select("#leftPanel #countryDetail")
                .style("display", "block");

            d3.select("#leftPanel").selectAll("#description,table")
                .style("display", "none");

            d3.selectAll("#leftPanel #cname")
                .text(names[id]);
        }
    }

    function createSun(data) {
        //TODO
        //it might be that some dimensions are only available for some years; handle that later
        //be able to handle sub-dimensions later

        var dimensions = d3.set(data.map(function (d) {
            return d.dimension
        })).values();
        var root = {name: composite_index_word, children: []};
        dimensions.forEach(function (dimension) {
            var subset = data.filter(function (d) {
                return d.dimension == dimension
            });
            var p = {name: dimension, children: []};
            var policies = d3.set(subset
                .map(function (d) {
                    return d.policy
                })).values();
            policies.forEach(function (pol) {
                p.children.push({name: pol, s: 1})
            });
            root.children.push(p);
        });

        var path = sunSVG.selectAll("path")
            .data(partition.nodes(root))
            .enter().append("path")
            .attr("class", fillArc)
            .attr("d", arc)
            .on("click", sunClick)
            .on("mouseenter", function (d) {
                if (d3.select("#sunburstMenu").datum() != "hidden" &&
                    d.name != "Índice compuesto") {
                    d3.select("#sunburstMenu").datum("open");
                    d3.select("#sunburstMenu #label")
                        .style({
                            "display": "block",
                            "left": (10 + d3.mouse(d3.select("#sunburstMenu").node())[0]) + "px",
                            "top": d3.mouse(d3.select("#sunburstMenu").node())[1] + "px"
                        })
                        .text(d.name);
                }
            })
            .on("mouseout", function () {
                d3.select("#sunburstMenu #label").style("display", "none");
            });

        d3.select("#sunburstMenu #overall").on("click", function () {
            state.policy = null;
            state.dimension = null;
            newState();
        });

        function sunClick(d) {
            if (d.depth == 0) {

                d3.select("#overall")
                    .transition().delay(500)
                    .style("display", "block");
                d3.select("#overall").moveToFront();
            }

            else d3.select("#overall").style("display","none");
            if (d3.select("#sunburstMenu").datum() != "hidden") {
                d3.select("#sunburstMenu").datum("hidden");
                //we're not in an "icon mode"
                path.transition().duration(750)
                    .attrTween("d", arcTween(d));
                if (d.depth == 1) {
                    state.policy = null;
                    state.dimension = d.name;
                }
                if (typeof d.children == "undefined") {
                    state.policy = d.name;
                    state.dimension = d.parent.name;
                    //    setTimeout(closeSun,1000);
                }
                newState();
                //   setTimeout(closeSun,1000);
            }
            //   else closeSun();
        }

        function fillArc(d) {
            var colorStyle = "sun ";
            if (d.depth == 1) {
                colorStyle += DimensionColorSet[d.name] + "0";
            }
            if (d.depth == 2) {
                colorStyle += DimensionColorSet[d.parent.name] + "1";
            }
            return colorStyle
        }
    }

    function newState() {
        if (state.year && state.dimension && state.policy) { //TODO
            state.dataset = data.filter(function (d) {
                return d.year == state.year && d.dimension == state.dimension && d.policy == state.policy
            });
        } else {
            state.dataset = state.ids.map(function (country) {
                return {id: +country, value: Math.random() * 5}
            });
        }


        state.dataset = state.dataset
            .sort(function (a, b) {
                return names[b.id] > names[a.id]
            })
            .sort(function (a, b) {
                return b.value - a.value
            });


        brush.extent([state.year, state.year]);

        var text;
        if (state.dimension == null)
            text = composite_index_word;
        else {
            var description = Descriptions[state.dimension];
            if (state.policy == null)
                text = state.dimension;
            else
                text = description[state.policy];
        }
        d3.select("#legend p").text(text);

        d3.selectAll("path.country")
            .transition().duration(500)
            .style("fill", fillColor);

        //need to change values in left table
        populateLeftTable(names, flags);

        d3.selectAll("#policyToggle li")
            .filter(function (d) {
                return d == state.policy
            })
            .classed("selected", true);

    }

    function populateLeftTable(names, flags) {

        //just start a new table each time
        d3.select("#leftPanel tbody").selectAll("tr").remove();

        var trows = d3.select("#leftPanel tbody").selectAll("tr")
            .data(state.dataset, function (d) {
                return d.id
            });

        //also don't have the colors  handled properly?

        trows.enter()
            .append("tr")
            .selectAll("td").data(function (row, i) {
                return [(i + 1), "<img src = " + flags[row.id] + " width=20px height=20px> ", names[row.id], d3.format(".3g")(row.value)]
            })
            .enter().append("td").html(function (element) {
                return element
            })
            .style("color", function (row, i, j) {
                return (i != 2) ? color(state.dataset[j].value) : "black"
            })
            .attr("class", function (row, i) {
                return i == 2 ? "country" : ""
            });

    }

//THE ABOVE WERE INSIDE THE AWAIT CALLBACK

    function arcTween(d) {
        var xd = d3.interpolate(sunX.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(sunY.domain(), [d.y, 1]),
            yr = d3.interpolate(sunY.range(), [d.y ? 20 : 0, radius]);
        return function (d, i) {
            return i
                ? function () {
                return arc(d);
            }
                : function (t) {
                sunX.domain(xd(t));
                sunY.domain(yd(t)).range(yr(t));
                return arc(d);
            };
        };
    }

    function cleanCountries(countries) {
        var c = countries.filter(function (country) {
            return country.id != 10
        }); //eliminate Antarctica

        var france = c.filter(function (d) {
            return d.id == 250
        })[0];
        var franceIndex = c.indexOf(france);
        var french_guiana = france.geometry.coordinates.splice(0, 1)[0];
        c[franceIndex] = france;
        c.push({type: "Feature", id: 254, properties: {}, geometry: {type: "Polygon", coordinates: french_guiana}});
        var usa = c.filter(function (d) {
            return d.id == 840
        })[0];
        var usaIndex = c.indexOf(usa);
        usa.geometry.coordinates.splice(8, 1);
        c[usaIndex] = usa;

        c = c.filter(function (d) {
            return d.id != undefined
        });
        //should also combine Somalia
        return c
    }

    function createData(dimensions, dummy) {

        var policyset = d3.range(1, 21).map(function (d) {
            return "Política  " + d
        });
        data = [];

        dummy.map(function (row) {
            row.policy.map(function (p, i) {
                data.push({
                    id: row.id,
                    year: row.year,
                    dimension: dimensions[row.dimension - 1],
                    policy: (policyset[i]),
                    value: p
                })
            })
        });

        state.ids = d3.set(dummy.map(function (d) {
            return d.id
        })).values();

        return data;

    }

    function closeSun() {
        if (d3.select("#sunburstMenu").datum() == "hidden") {
            d3.select("#sunburstMenu").datum("open");
            var width = parseInt(d3.select("#mapModule").style("height")) * 0.85;
            d3.select("#sunburstMenu")
                .transition().duration(500)
                .style({width: width + "px", height: width + "px"});
        }

        else {
            d3.select("#sunburstMenu")
                .selectAll("#overall")
                .style("display", "none");

            d3.select("#sunburstMenu").datum("hidden");
            d3.select("#sunburstMenu")
                .transition().duration(500)
                .style({
                    "width": "64px",
                    "height": "64px"
                });
        }
        return true;
    }

    function closingPanels() {
//set up the closers for the panels
        d3.selectAll(".closer")
            .on("click", function () {
                reset();
                d3.select(this.parentElement)
                    .transition().duration(500).ease("linear")
                    .style("left", "-375px");
                ;
                d3.select(this.parentElement).transition().delay(500).style("opacity", 1e-6);
            });

//when the left button is clicked, open the left panel
        d3.select("#leftButtons").on("click", function () {
            d3.select("#leftPanel").style("opacity", 1)
                .transition().duration(500).ease("linear")
                .style("left", "0px");
            d3.select("#leftPanel").selectAll("#description, table")
                .style("display", "block");
            d3.select("#leftPanel").select("#countryDetail")
                .style("display", "none");
            d3.select("#leftPanel #cname").text("Ranking");
        });
    }

    function createMap(c, n, f) {
        gMap.selectAll(".country")
            .data(c)
            .enter().append("path")
            .classed("country", true)
            .attr("d", path)
            .on("mouseenter", function () {
                var keyset = state.dataset
                    .sort(function (a, b) {
                        return b.value - a.value
                    })
                    .map(function (row) {
                        return row.id
                    });

                var d = d3.select(this).datum();

                var ind = keyset.indexOf(d.id);

                if (ind > -1) {
                    var avg = state.dataset[ind].value;
                    d3.select("#map #tooltip")
                        .style({
                            "opacity": 1
                        });
                    d3.select("#map #tooltip #flag")
                        .attr({
                            "src": f[d.id],
                            "alt": n[d.id] + " flag"
                        });

                    d3.select("#map #tooltip #cname")
                        .text(n[d.id]);
                    d3.select("#map #tooltip #description1")
                        .text("Ranking: #: " + (ind + 1));
                    d3.select("#map #tooltip #description2")
                        .text(d3.format(".3g")(avg));
                }
            })
            .on("mousemove", function () {
                d3.select("#map #tooltip")
                    .style({
                        "left": (d3.mouse(d3.select("#map svg g").node())[0]) + "px",
                        "top": (d3.mouse(d3.select("#map svg g").node())[1]) + "px"
                    });
            })
            .on("mouseleave", function () {
                d3.select("#map #tooltip")
                    .style("opacity", 1e-6);
            });

        gMap.insert("rect", "path")
            .classed("overlay", true)
            .attr({
                "width": "100%",
                "height": "100%"
            })
            .on("click", reset);
    }

    function fillColor(d) {
        var chosen = state.dataset.filter(function (dat) {
            return dat.id == d.id
        })[0];
        if (typeof chosen != "undefined") {
            var c = "." + DimensionColorSet[state.dimension || "Overall"] + [1, 2, 0, 3, 4][Math.ceil(chosen.value) - 1];
            return colornew[c];
        }
        else {
            return "rgb(227,227,227)"
        }
    }

    function mkColorKey() {
        var set;
        if (state.dimension == null)  set = "." + DimensionColorSet["Overall"];
        else  set = "." + DimensionColorSet[state.dimension];

        var colors = [1, 2, 0, 3, 4].map(function (d) {
            return colornew[set + d]
        });

        color.range(colors);
        var g = d3.select("#legend #scale");
        g.selectAll("rect")
            .data(colors.map(function (d, i) {
                return {
                    x0: i ? legendX(color.domain()[i + 1]) : legendX.range()[0],
                    x1: i < color.domain().length ? legendX(i + 2) : legendX.range()[1],
                    color: d
                }
            }))
            .enter()
            .append("rect")
            .attr({
                "height": 10,
                "x": function (d) {
                    return d.x0
                },
                "width": function (d) {
                    return d.x1 - d.x0
                }
            });

        g.selectAll("rect")
            .style("fill", function (d) {
                return d.color
            });

        g.call(cAxis)
            .append("text")
            .attr({"class": "caption", "y": 50, "x": 150, "text-anchor": "middle"})
            .text(""); //TO DO this will need to be updated also


        g.selectAll(".tick text").attr("transform", function (d, i) {
            var info = g.selectAll("rect").data()[i - 1];
            return i == 0 ? "translate(0,0)" : "translate(" + (info.x1 - info.x0) / 2 + ",-5)"
        });

    }

    function readStyle(fname, cset) {
        s = d3.values(document.styleSheets);
        s.pop();
        s.pop();
        var sty =
            d3.values(s
                .filter(function (d) {
                    return d.href.indexOf(fname) > -1
                })[0]
                .cssRules);
        sty.pop();
        sty.pop();
        var selectors = sty.map(function (s) {
            return s.selectorText
        });
        var colorset = {};
        cset.map(function (selector) {
            colorset[selector] = sty[selectors.indexOf(selector)].cssText.split(/fill:\s|\;/)[1];
        });
        return colorset
    }

    function reset() {
        d3.selectAll("path.country")
            .transition().duration(500)
            .style({
                "fill-opacity": 1,
                "stroke": "rgb(204,171,171)",
                "stroke-width": 1
            });

        d3.select("#leftPanel #countryDetail")
            .style("display", "none");

        d3.select("#leftPanel").selectAll("#description,table")
            .style("display", "block");

        d3.select("#leftPanel h6").text("Ranking");
    }

    function when(conditionF, execF, interval) {
        conditionF() ? execF() : setTimeout(function () {
            when(conditionF, execF, interval);
        }, interval)
    }

    function zoomByFactor(factor) {
        var scale = zoom.scale();
        var extent = zoom.scaleExtent();
        var newScale = scale * factor;
        if (extent[0] <= newScale && newScale <= extent[1]) {
            var t = zoom.translate();
            var c = [width / 2, height / 2];
            zoom
                .scale(newScale)
                .translate(
                [c[0] + (t[0] - c[0]) / scale * newScale,
                    c[1] + (t[1] - c[1]) / scale * newScale])
                .event(mapSVG.transition().duration(350));
        }
    }

    function zoomed() {
        gMap.style("stroke-width", 1.5 / d3.event.scale + "px");
        gMap.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };

    d3.selection.prototype.size = function () {
        var n = 0;
        this.each(function () {
            ++n;
        });
        return n;
    };

    if (!String.prototype.includes) {
        String.prototype.includes = function () {
            'use strict';
            return String.prototype.indexOf.apply(this, arguments) !== -1;
        };
    }

