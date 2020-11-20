/*Copyright 2014 Elise A. Ralph  elise.ralph@gmail.com  

Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/* Weather contouring routines

Namespace:WE
Dependencies: Requires d3.js, conrec.js queue.js and topojson libraries.
N.B.:conrec.js was modified to handle data that wraps across the dateline  
	=> Use conrecGlobe.js

//WAITING on subsets of data to test how well it works on regional datasets.
//with original conrec.js file.

WE.Data contains the dataset, the latitude and longitude arrays, etc.          

WE.contourTools contains functions for manipulating the contours.
	**This includes handling bugs from the 2010 conrec code 
	including broken contours and contours that self-intersect.**

WE.drawing contains functions for making an svg of the contour plot

WE.file contains the information from the original NCEP files   

WE.helper contains a couple of repeatedly used functions

WE.mapping contains functions for making maps, including functions for 
	interpolating the 2D data to a specific point

WE.state contains functions that "read" the menu and select the appropriate 
	file and the contour interval to be considered. 
	These functions should be modified as needed to better handle 
   the selection of data server-side.        

**********************************************************************/
var WE = {
    contourTools: {
        circumpolar: function(cline) {
            var A = d3.pairs(cline.concat(cline[0]))
                .filter(function(d) {
                    return Math.abs(d[0].x - d[1].x) >= 357.5
                })
                .map(function(d) {
                    return d[1].y
                });
            cline.circumpolar = A.length % 2 == 1;
            return cline
        },
        flatArea: function(line) {
            var pairs = d3.pairs(line),
                dx = pairs.map(function(d) {
                    return d[1].x - d[0].x
                }),
                meany = pairs.map(function(d) {
                    return (d[1].y + d[0].y) / 2 - 90
                }),
                A = [];
            for (var ij = 0; ij < dx.length; ij++) {
                if (dx[ij] < -357.5) {
                    dx[ij] = dx[ij] + 360
                };
                if (dx[ij] > 357.5) {
                    dx[ij] = 360 - dx[ij]
                };
                A[ij] = dx[ij] * meany[ij]
            }
            return A.reduce(function(a, b) {
                return a + b
            })
        },
        mkFeature: function(Arr, level) {
            var coords = [];
            for (var ij = 0; ij < Arr.length; ij++) {
                coords.push(Arr[ij].map(function(e) {
                    return [e.x, e.y]
                }))
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
        },
        raycast: function(testcurve, vs) {
            function rmDuplicate(line) {
                var toRemove = d3.pairs(line)
                    .map(function(d) {
                        return d[0] == d[1]
                    })
                    .indexOf(true);
                while (toRemove > -1) {
                    line.splice(toRemove, 1);
                    if (line.length > 1)
                        toRemove = d3.pairs(line)
                        .map(function(d) {
                            return d[0] == d[1]
                        })
                        .indexOf(true);
                    else toRemove = -1;
                }
                return line
            }

            var point = testcurve[0];
            var A = rmDuplicate(d3.pairs(vs.concat(vs[0]))
                .filter(function(d) {
                    return Math.abs(d[0].x - d[1].x) > 357.5
                })
                .map(function(d) {
                    return d[1].y
                }));
            if (vs.circumpolar) {
                if (Math.abs(Math.abs(point.x) - 180) < 2.5) {
                    inside = A.filter(function(d) {
                            return d < point.y
                        })
                        .length % 2 == 1;
                } else {
                    point = testcurve.filter(function(d) {
                        return (Math.abs(d.x % 2.5) < 1e-5 || Math.abs(d.x % 2.5) > 2.5 - 1e-5)
                    })[0];
                    var southOfLine = vs.filter(function(d) {
                            return Math.abs(d.x - point.x) < 1e-5
                        })
                        .filter(function(d) {
                            return d.y < point.y
                        });
                    if (southOfLine.length > 1) southOfLine = rmDuplicate(southOfLine);
                    inside = southOfLine.length % 2 == 1;
                }
            } else //not circumpolar
            {
                if (Math.abs(Math.abs(vs[0].x) - 180) < 2.5) {
                    if (Math.abs(Math.abs(point.x) - 180) < 2.5) {
                        inside = A.filter(function(d) {
                                return d < point.y
                            })
                            .length % 2 == 1;
                    } else {
                        point = testcurve.filter(function(d) {
                            return (Math.abs(d.x % 2.5) < 1e-5 || Math.abs(d.x % 2.5) > 2.5 - 1e-5)
                        })[0];
                        var southOfLine = vs.filter(function(d) {
                                return Math.abs(d.x - point.x) < 1e-5
                            })
                            .filter(function(d) {
                                return d.y < point.y
                            });
                        if (southOfLine.length > 1) southOfLine = rmDuplicate(southOfLine);
                        inside = southOfLine.length % 2 == 1;
                    }
                } else {
                    var x = point.x,
                        y = point.y,
                        inside = false;
                    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                        var xi = vs[i].x,
                            yi = vs[i].y;
                        var xj = vs[j].x,
                            yj = vs[j].y;
                        var dx = (xj - xi),
                            dy = (yj - yi);
                        dx2 = x - xi;
                        var intersect = ((yi > y) != (yj > y)) && ((dx2) < (dx / dy) * (y - yi));
                        if (intersect) {
                            inside = !inside;
                        }
                    }
                }
            }
            return inside;

        },
    },
    drawing: {
        margin: (new function() {
            this.w = 960;
            this.h = this.w / 1.92
        }),
        colormap: function(choose) {
            if (choose == "colorbrewerspectral") return ["#9e0142", "#d53e4f",
                "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598",
                "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"
            ]
            else if (choose = "red2blue") return ["#a50026", "#d73027", "#f46d43",
                "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9",
                "#74add1", "#4575b4", "#313695"
            ]
        },
        mkColorBar: function(datarange, datastep) {
            var colorbarTotalHeight = 450,
                colorbarheightscale = d3.scale.linear()
                .range([12.5, colorbarTotalHeight - 12.5])
                .domain(d3.extent(datarange)),
                colorset = WE.drawing.colormap('red2blue'),
                drange = (typeof datastep == "number") ? d3.scale.linear()
                .domain(d3.extent(datarange))
                .nice()
                .ticks(datastep)
                .reverse() : datastep,
                dmin = d3.min(drange),
                dmax = d3.max(drange),
                colorscale = d3.scale.linear()
                .domain(d3.range(dmax, dmin, (dmin - dmax) / colorset.length))
                .range(colorset)
                .interpolate(d3.interpolateHcl),
                colorbars = WE.svg1.selectAll("g")
                .data(drange)
                .enter()
                .append("g")
                .attr("class", "colorbar");
            colorbars.append("rect")
                .attr({
                    "y": function(d) {
                        return colorbarheightscale(d)
                    },
                    "x": 980,
                    "height": (colorbarTotalHeight / (drange.length)),
                    "width": 50,
                    "fill": function(d) {
                        return colorscale(d)
                    },
                    "stroke": "black",
                    "stroke-width": 0.25
                })
            colorbars.append("text")
                .attr({
                    "y": function(d) {
                        return colorbarheightscale(d)
                    },
                    "x": 1040,
                    "dy": 187.5 / drange.length
                })
                .text(function(d) {
                    return d
                })
                .style("font-size", "16px")
            return colorscale
        }
    },
    helper: {
        clone: function(arr) {
            var ar = arr.slice(0);
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].clone) {
                    ar[i] = arr[i].clone()
                }
            }
            return ar
        },
        findOption: function(id) {
            return d3.select(id)
                .node()
                .options[d3.select(id)
                    .node()
                    .selectedIndex].value
        },
        timeformat: d3.time.format.utc("%B %e %Y %X")
    },
    mapping: {
        convenienceBox: [-90, -90, -90, -90, -90, -45, 0, 45, 90, 90, 90, 90, 90, 45, 0, -45, -90].map(function(d, i) {
            return {
                x: [-180, -90, 0, 90, 180, 180, 180, 180, 180, 90, 0, -90, -180, -180, -180, -180, -180][i],
                y: d
            }
        }),
        formatLatLon: d3.format(".1f"),
        mapdata: "/mapdata/world-50m.json",
        mkMap: function(world) {
            var w = {};
            w.land = WE.svg1.append("path")
                .datum(topojson.feature(world, world.objects.land))
                .attr({
                    "class": "land",
                    "d": WE.mapping.projec_path
                });
            w.border = WE.svg1.append("path")
                .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
                    return a !== b
                }))
                .attr({
                    "class": "boundary",
                    "d": WE.mapping.projec_path
                });
            WE.svg1.append("use")
                .attr({
                    "class": "sphere",
                    "xlink:href": "#sphere"
                });
            w.grat = WE.svg1.append("path")
                .datum(d3.geo.graticule())
                .attr({
                    "class": "graticule",
                    "d": WE.mapping.projec_path
                });
            return w
        },
    },
    state: {
        contourRange: function() {
            return d3.range(+d3.select("#mincontour")
                .node()
                .value, +d3.select("#maxcontour")
                .node()
                .value, Math.max(+d3.select("#stepcontour")
                    .node()
                    .value), 1, +d3.select("#stepcontour")
                .node()
                .value)
        },
        dataFileNameMonMean: function() {
            var varname = d3.select("#variable-menu")
                .selectAll("option")
                .data()
                .filter(function(d) {
                    return d.variable == WE.helper.findOption("#variable-menu")
                })[0].name,
                level = WE.helper.findOption("#height-menu"),
                mon = WE.helper.findOption("#monthstamp")
                .slice(0, 3),
                yr = WE.helper.findOption("#yearstamp")
                .slice(2, 4);
            return "/NCEP/month/" + varname + "/" + varname + "_" + level + "_" + mon + yr + "_mon_mean.json"
        },
        dataFileName4X: function() {
            var varname = d3.select("#variable-menu")
                .selectAll("option")
                .data()
                .filter(function(d) {
                    return d.variable == WE.helper.findOption("#variable-menu")
                })[0].name,
                level = WE.helper.findOption("#height-menu"),
                mon = WE.helper.findOption("#monthstamp")
                .slice(0, 3),
                day = WE.helper.findOption("#daystamp"),
                hr = WE.helper.findOption("#hourstamp");
            return "/NCEP/4Xltm/" + varname + "/" + varname + "_" + level + "_" + mon + day + "H" + hr +
                "_4Xday_1981_2010_ltm.json"
        },
        eraseMenus: function() {
            d3.selectAll("#mincontour,#maxcontour,#stepcontour")
                .property("value", "")
            d3.selectAll("#datamenu,#dispDataRange,#datavalue")
                .text("");
        },
    },
};

WE.contourTools.createContourPlot = function(f) {
    function contour(z, x, y, dz) {
        var c = new Conrec(),
            zrange = (typeof dz == "number") ? d3.scale.linear()
            .domain(d3.extent([].concat.apply([], z)))
            .nice()
            .ticks(dz) : dz,
            resolutionx = resolutiony = WE.Data.resolution;
            WE.contourTools.nudge = d3.mean(zrange) * 1e-6;
        if (typeof dz == "number") {
            d3.select("#mincontour")
                .node()
                .value = zrange[0];
            d3.select("#maxcontour")
                .node()
                .value = zrange[zrange.length - 1];
            d3.select("#stepcontour")
                .node()
                .value = zrange[1] - zrange[0];
        }
        c.contour(z, 0, y.length - 1, 0, x.length - 1, y, x, zrange.length - 1, zrange.map(function(d) {
            return d + WE.contourTools.nudge
        }))
        var Clines = c.contourList();
        Clines = Clines.filter(function(d) {
            return d.length > 4
        });
        Clines = Clines.map(untwist);
        Clines.forEach(function(d) {
            if (WE.contourTools.flatArea(d) < 0) {
                d = d.reverse();
            }
            return d
        });
        Clines = Clines.filter(function(d) {
            return WE.contourTools.flatArea(d) > 2
        });

        function untwist(c) {
            var dsquared = d3.pairs(c)
                .map(distancesquared),
                heads = [0],
                tails = [];
            for (var ij = 0; ij < dsquared.length; ij++) {
                if (dsquared[ij] > 6.25) {
                    heads.push(ij + 1);
                    tails.push(ij);
                }
            }
            tails.push(c.length - 1);
            var newc = c.slice(0, tails[0] + 1);
            heads = heads.slice(1);
            tails = tails.slice(1);
            var count = 0;
            while (newc.length < c.length && count < 1000) {
                count++
                var newhead = heads.map(function(d) {
                        return distancesquared([newc[newc.length - 1], c[d]]) < 6.25
                    })
                    .indexOf(true);
                if (newhead > -1) {
                    newc.push(c.slice(heads[newhead], tails[newhead]));
                    heads.splice(newhead, 1);
                    tails.splice(newtail, 1);
                } else {
                    var newtail = tails.map(function(d) {
                            return distancesquared([newc[newc.length - 1], c[d]]) < 6.25
                        })
                        .indexOf(true);
                    if (newtail > -1) {
                        newc = newc.concat(c.slice(heads[newtail], tails[newtail] + 1)
                            .reverse())
                        heads.splice(newtail, 1);
                        tails.splice(newtail, 1);
                    }
                }
            }
            newc.level = c.level;
            return newc

            function distancesquared(pts) {
                var dx = pts[0].x - pts[1].x,
                    dy = pts[0].y - pts[1].y;
                if (dx > 357.5) dx = dx - 360;
                if (dx < -357.5) dx = dx + 360;
                return dx * dx + dy * dy
            }
        }
        return Clines
    }

    function sortLines(n, box, flag, poles) {
    	function checkIfFlip(lines, level) {
            var lines = lines.map(WE.contourTools.circumpolar);
            for (var j = 0; j < lines.length; j++) {
                for (var i = j + 1; i < lines.length; i++) {
                    if (+level < WE.Data.PoleValues[0] && j == 0) {
                        lines[i] = lines[i].reverse()
                    }
                    if (WE.contourTools.raycast(lines[i], lines[j])) {
                        lines[i] = lines[i].reverse();
                    }
                }
            }
            return lines
        }
        if (flag) {
            F = [box, box];
        } else {
            var F = [],
                lines = WE.helper.clone(n.values);
            lines = lines.map(function(line) {
                var xs = line.map(function(d) {
                    return d.x
                })
                return line.splice(xs.indexOf(d3.max(xs)))
                    .concat(line)
            })
            lines = lines.sort(function(a, b) {
                return WE.contourTools.flatArea(b) - WE.contourTools.flatArea(a)
            });
            if (n.key < poles[0]) {
                lines[0] = lines[0].reverse();
            }
            F = checkIfFlip(lines, n.key)
        }
        return WE.contourTools.mkFeature(F, n.key)
    }

    function readFile(f) {
console.log(f.data.length)
        resolution = 360 / f.Dimensions[f.Dimensions.map(function(d) {
                return d.Name
            })
            .indexOf("lon")].Length;
        return {
            resolution: resolution,
            Data: f.data.slice(f.data.length / 2, f.data.length)
                .concat(f.data.slice(0, f.data.length / 2 + 1)),
            Lons: d3.range(-180, 180 + resolution, resolution),
            Lats: d3.range(90, -90 - resolution, -resolution),
            fname: f.Filename,
            description: f.Attributes[11].Value,
            paramUnit: f.Attributes.filter(function(d) {
                return d.Name == 'units'
            })[0].Value.replace("deg", d3.format("c")(176)),
            origparamUnit: f.paramUnit,
            AllFeatures: []
        }
    }
    WE.Data = readFile(f);
    WE.Data = WE.state.changeUnits(WE.Data);
    WE.Data.datarange = d3.extent([].concat.apply([], WE.Data.Data));
    d3.select("#dispDataRange")
        .text("datarange: [" + WE.Data.datarange.map(d3.format(".3r")) + "]")
    WE.Data.PoleValues = [WE.Data.Data[0][WE.Data.Data[0].length - 1], WE.Data.Data[0][0]];
    WE.Data.dz = (d3.select("#mincontour")
        .node()
        .value !== "" && d3.select("#maxcontour")
        .node()
        .value !== "" && d3.select("#stepcontour")
        .node()
        .value !== "") ? WE.state.contourRange() : 20;
    var nested = d3.nest()
        .key(function(d) {
            return +d.level+WE.contourTools.nudge
        })
        .entries(contour(WE.Data.Data, WE.Data.Lats, WE.Data.Lons, WE.Data.dz))
        .sort(function(a, b) {
            return a.key - b.key
        })
    nested.unshift({
        key: 2 * nested[0].key - nested[1].key
    });
    for (var ij = 0; ij < nested.length; ij++) {
        WE.Data.AllFeatures = WE.Data.AllFeatures.concat.apply(WE.Data.AllFeatures, [sortLines(nested[ij], WE.mapping.convenienceBox, ij == 0, WE.Data.PoleValues)])
    }
    WE.drawing.paint(WE.Data.AllFeatures, WE.Data.datarange)
}

WE.drawing.paint = function(AllFeatures, datarange) {
    WE.svg1.selectAll(".contours")
        .data(AllFeatures)
        .enter()
        .insert("path", ".land")
        .style({
            "fill": function(d) {
                return WE.drawing.mkColorBar(datarange, 20)(d.properties.level)
            },
            "stroke-width": 0.25
        })
        .style("stroke", function(d, i) {
            return i == 0 ? "none" : "black"
        })
        .attr({
            "class": "contours",
            "d": WE.mapping.projec_path,
            "id": function(d) {
                return "level" + (d.properties.level+WE.contourTools.nudge)
            }
        })

}

WE.mapping.projOptions = function() {
    var m = WE.drawing.margin,
        a = m.h / 500;
    return [{
            name: "Equirectangular",
            projection: d3.geo.equirectangular()
                .scale(m.h * 0.3)
                .translate([m.w / 2, m.h / 2])
                .rotate([0, 0])
                .center([0, 0])
        }, {
            name: "North Pole",
            projection: d3.geo.azimuthalEqualArea()
                .scale(m.h * 0.35)
                .translate([m.w / 2, m.h / 2])
                .rotate([90, -90])
                .clipAngle(90)
        }, {
            name: "South Pole",
            projection: d3.geo.azimuthalEqualArea()
                .scale(m.h * 0.35)
                .translate([m.w / 2, m.h / 2])
                .rotate([90, 90])
                .clipAngle(90)
        }, {
            name: "Robinson",
            projection: d3.geo.robinson()
                .scale(m.h * 0.3)
                .translate([m.w / 2, m.h / 2])
                .rotate([0, 0])
                .center([0, 0])
        },

        {
            name: "Europe",
            projection: d3.geo.mercator()
                .center([20, 50])
                .clipExtent([
                    [0, 0],
                    [946, 474]
                ])
                .scale(650)
        }, {
            name: "United States",
            projection: d3.geo.albers()
                .clipExtent([
                    [0, 0],
                    [946, 474]
                ])
        }, {
            name: "East Asia",
            projection: d3.geo.mercator()
                .center([120, 30])
                .clipExtent([
                    [0, 0],
                    [946, 474]
                ])
                .scale(650)
        }
    ]
}();
WE.mapping.newProj = function() {
    WE.mapping.projec = WE.mapping.projOptions[d3.select("#projection-menu")
        .node()
        .selectedIndex].projection;
    WE.mapping.projec_path = d3.geo.path()
        .projection(WE.mapping.projOptions[d3.select("#projection-menu")
            .node()
            .selectedIndex].projection);
}
WE.mapping.getLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(posn) {
            WE.mapping.posn = [{
                lat: posn.coords.latitude,
                lon: posn.coords.longitude
            }];
            d3.select("input#latitude")
                .property("value", WE.mapping.formatLatLon(WE.mapping.posn[0].lat))
            d3.select("input#longitude")
                .property("value", WE.mapping.formatLatLon(WE.mapping.posn[0].lon))
        })
    } else WE.mapping.posn = [{
        lat: NaN,
        lon: NaN
    }]
};
WE.mapping.interp2 = function() {
    if (+d3.select("input#latitude")
        .property("value") > 90) + d3.select("input#latitude")
        .property("value", 90);
    if (+d3.select("input#latitude")
        .property("value") < -90) + d3.select("input#latitude")
        .property("value", -90);
    if (+d3.select("input#longitude")
        .property("value") < -180) + d3.select("input#longitude")
        .property("value", -180);
    if (+d3.select("input#longitude")
        .property("value") > 360) + d3.select("input#longitude")
        .property("value", 180);
    if (+d3.select("input#longitude")
        .property("value") > 180) d3.select("input#longitude")
        .property("value", +d3.select("input#longitude")
            .property("value") - 360);


    WE.mapping.posn[0].lat = +d3.select("input#latitude")
        .property("value");
    WE.mapping.posn[0].lon = +d3.select("input#longitude")
        .property("value");

    var lonIndex = WE.Data.Lons.indexOf(Math.floor(WE.mapping.posn[0].lon / 2.5) * 2.5),
        latIndex = WE.Data.Lats.indexOf(Math.floor(WE.mapping.posn[0].lat / 2.5) * 2.5),
        lonIndexp1 = Math.min(lonIndex + 1, WE.Data.Lons.length - 1),
        latIndexp1 = Math.min(latIndex + 1, WE.Data.Lats.length - 1),
        dx = WE.mapping.posn[0].lon - WE.Data.Lons[lonIndex],
        dy = WE.mapping.posn[0].lat - WE.Data.Lats[latIndex],
        r1 = d3.interpolate(WE.Data.Data[lonIndex][latIndex], WE.Data.Data[lonIndexp1][latIndex])(dx),
        r2 = d3.interpolate(WE.Data.Data[lonIndex][latIndexp1], WE.Data.Data[lonIndexp1][latIndexp1])(dx);
    d3.select("span#datavalue")
        .text(d3.format(".2f")(d3.interpolate(r1, r2)(dy)))

d3.select(".points").remove()
var point = WE.svg1.append("g")
	.attr("class","points")
  .selectAll("g")
	.data(WE.mapping.posn)

  point.enter().append("g")
	.attr("transform",function(d) {return "translate("+WE.mapping.projec([d.lon,d.lat])+")"})

point.append("circle")
	.attr("r",4.5)

}
WE.mapping.setup = function() {
    WE.svg1 = d3.select("#graphic1")
        .append("svg")
        .attr({
            "width": WE.drawing.margin.w + 150,
            "height": WE.drawing.margin.h
        })
    WE.svg1.append("defs")
        .append("path")
        .datum({
            type: "Sphere"
        })
        .attr({
            "id": "sphere",
            "d": WE.mapping.projec_path
        })
}

WE.state.changeDisp = function() {
    WE.state.eraseMenus();
    d3.select("#unitsForRange")
        .text(WE.helper.findOption("#units-menu"))
}
WE.state.changeDataSet = function() {
    d3.select('#yearstamp')
        .style("display", WE.helper.findOption("#dataset-menu") == "4X daily average" ? "none" : "inline")
    d3.selectAll('#daystamp,#hourstamp')
        .style("display", WE.helper.findOption("#dataset-menu") != "4X daily average" ? "none" : "inline")
    WE.state.eraseMenus();

    if (WE.helper.findOption("#dataset-menu") == "4X daily average")
        d3.select("#variable-menu")
        .on("change", WE.state.changeVariable)
        .selectAll("option")
        .data([{
            variable: "air temperature",
            name: "air"
        }, {
            variable: "geopotential height",
            name: "hgt"
        }])
        .enter()
        .append("option")
        .text(function(d) {
            return d.variable
        })

    else d3.select("#variable-menu")
        .on("change", WE.state.changeVariable)
        .selectAll("option")
        .data([{
            variable: "air temperature",
            name: "air"
        }, {
            variable: "geopotential height",
            name: "hgt"
        }, {
            variable: "relative humidity",
            name: "rhum"
        }, {
            variable: "wind speed",
            name: "wspd"
        }])
        .enter()
        .append("option")
        .text(function(d) {
            return d.variable
        })


}
WE.state.changeVariable = function() {
    d3.selectAll("#height-menu, #units-menu")
        .selectAll("option")
        .remove()
    WE.state.eraseMenus();
    if (WE.helper.findOption("#variable-menu") == "relative humidity") {
        d3.select("#height-menu")
            .selectAll("option")
            .data([1000, 925, 850, 700, 600, 500, 400, 300].map(function(d) {
                return {
                    "level": d
                }
            }))
            .enter()
            .append("option")
            .text(function(d) {
                return d.level
            });
        unitMenu = d3.select("#units-menu")
            .selectAll("option")
            .data([{
                "unit": "%"
            }])
            .enter()
            .append("option")
            .text(function(d) {
                return d.unit
            });
    } else {
        d3.select("#height-menu")
            .selectAll("option")
            .data([1000, 925, 850, 700, 600, 500, 400, 300, 250, 200, 150, 100, 70, 50, 30, 20, 10].map(function(d) {
                return {
                    "level": d
                }
            }))
            .enter()
            .append("option")
            .text(function(d) {
                return d.level
            });
        var chosenvar = WE.helper.findOption("#variable-menu");

        if (chosenvar == "air temperature") {
            d3.select("#units-menu")
                .selectAll("option")
                .data([{
                    "unit": "Fahrenheit"
                }, {
                    "unit": "Celsius"
                }, {
                    "unit": "Kelvin"
                }, ])
                .enter()
                .append("option")
                .text(function(d) {
                    return d.unit
                });
        }

        if (chosenvar == "geopotential height") {
            d3.select("#units-menu")
                .selectAll("option")
                .data([{
                    "unit": "m"
                }, {
                    "unit": "feet"
                }])
                .enter()
                .append("option")
                .text(function(d) {
                    return d.unit
                });
        }
        if (chosenvar == "zonal winds (U)") {
            d3.select("#units-menu")
                .selectAll("option")
                .data([{
                    "unit": "m/s"
                }, {
                    "unit": "mph"
                }])
                .enter()
                .append("option")
                .text(function(d) {
                    return d.unit
                });
        }
        if (chosenvar == "meridional winds (V)") {
            d3.select("#units-menu")
                .selectAll("option")
                .data([{
                    "unit": "m/s"
                }, {
                    "unit": "mph"
                }])
                .enter()
                .append("option")
                .text(function(d) {
                    return d.unit
                });
        }
        if (chosenvar == "wind speed") {
            d3.select("#units-menu")
                .selectAll("option")
                .data([{
                    "unit": "m/s"
                }, {
                    "unit": "mph"
                }])
                .enter()
                .append("option")
                .text(function(d) {
                    return d.unit
                });
        }
    }
    d3.select("#unitsForRange")
        .text(" " + WE.helper.findOption("#units-menu"))

}
WE.state.changeCalendarDays = function() {
    WE.state.changeDisp();
    d3.select("#daystamp")
        .selectAll("option")
        .remove();
    var month = WE.helper.findOption("#monthstamp"),
        enddate = 30;
    if (month == "January" || month == "March" || month == "May" || month == "July" || month == "August" || month == "October" || month == "December") enddate = 31;
    if (month == "February") enddate = 28;
    d3.select("#daystamp")
        .selectAll("option")
        .data(d3.range(1, enddate + 1))
        .enter()
        .append("option")
        .text(function(d) {
            return d3.format("02")(d)
        })
}
WE.state.changeData = function() {
    d3.selectAll(".contours, .colorbar")
        .remove();
    var oldstate = WE.state.fname;
    if (WE.helper.findOption("#dataset-menu") == "4X daily average")
        WE.state.fname = WE.state.dataFileName4X();
    else WE.state.fname = WE.state.dataFileNameMonMean();
    if (WE.state.fname == oldstate) {
        WE.contourTools.createContourPlot(WE.file)
    } else {
        d3.json(WE.state.fname, function(err, f) {
            if (typeof f != "undefined") {
                WE.Data.paramUnit = f.Attributes.filter(function(d) {
                    return d.Name == 'units'
                })[0];
                WE.contourTools.createContourPlot(f);
            }
        })
    }
}
WE.state.changeUnits = function(C) {
    var scaleName = d3.select("#units-menu")
        .node()
        .options[d3.select("#units-menu")
            .node()
            .selectedIndex].text,
        scale = d3.scale.linear()
        .domain([0, 100]);
    switch (scaleName) {
        case "Fahrenheit":
            if (WE.helper.findOption("#dataset-menu") == "4X daily average") scale = scale.range([-459.67, -279.67]);
            else scale - scale.range([32, 212]);
            WE.Data.paramUnit = d3.format("c")(176) + "F";
            break;
        case "feet":
            scale = scale.range([0, 328.084]);
            WE.Data.paramUnit = "feet";
            break;
        case "Celsius":
            if (WE.helper.findOption("#dataset-menu") == "4X daily average") scale = scale.range([-273.15, -173.15]);
            else scale = scale.range([0, 100]);
            WE.Data.paramUnit = d3.format("c")(176) + "C";
            break;
        case "Kelvin":
            if (WE.helper.findOption("#dataset-menu") == "4X daily average") {
                scale = scale.range([0, 100]);
            } else scale = scale.range([273.15, 373.15]);
            WE.Data.paramUnit = "K";
            break;
        case "mph":
            scale = scale.range([0, 223.694]);
            WE.Data.paramUnit = "mph";
            break;
        default:
            scale = scale.range([0, 100]);
            WE.Data.paramUnit = C.origparamUnit;
    }
    C.Data = C.Data.map(function(row) {
        return row.map(function(pt) {
            return scale(pt)
        })
    })
    return C
}
WE.state.setupMenus = function() {
    d3.select("#projection-menu")
        .on("change", function() {
            WE.mapping.newProj();
            WE.svg1.selectAll(".graticule, .land, .boundary, #sphere, .contours")
                .attr("d", WE.mapping.projec_path)
		    WE.svg1.selectAll(".points g")	
				.attr("transform",function(d) {return "translate("+WE.mapping.projec([d.lon,d.lat])+")"})   
        })
        .selectAll("option")
        .data(WE.mapping.projOptions)
        .enter()
        .append("option")
        .text(function(d) {
            return d.name
        })
    d3.select("#variable-menu")
        .on("change", WE.state.changeVariable)
        .selectAll("option")
        .data([{
            variable: "air temperature",
            name: "air"
        }, {
            variable: "geopotential height",
            name: "hgt"
        }, ])
        .enter()
        .append("option")
        .text(function(d) {
            return d.variable
        }),
        d3.select("#monthstamp")
        .on("change", WE.state.changeCalendarDays)
        .selectAll("option")
        .data(d3.range(0, 12)
            .map(function(d) {
                return {
                    "month": d3.time.format('%B')(new Date(1, d, 1))
                }
            }))
        .enter()
        .append("option")
        .text(function(d) {
            return d.month
        }),
        d3.select("#dataset-menu")
        .on("change", WE.state.changeDataSet)
        .selectAll("option")
        .data([{
            name: "4X daily average"
        }, {
            name: "monthly 1948-present"
        }])
        .enter()
        .append("option")
        .text(function(d) {
            return d.name
        }),
        d3.select("#height-menu")
        .on("change", WE.state.eraseMenus)
        .selectAll("option")
        .data([1000, 925, 850, 700, 600, 500, 400, 300, 250, 200, 150, 100, 70, 50, 30, 20, 10].map(function(d) {
            return {
                "level": d
            }
        }))
        .enter()
        .append("option")
        .text(function(d) {
            return d.level
        })
    d3.select("#daystamp")
        .on("change", WE.state.changeDisp)
        .selectAll("option")
        .data(d3.range(1, 32))
        .enter()
        .append("option")
        .text(function(d) {
            return d3.format("02")(d)
        }),
        d3.select("#hourstamp")
        .on("change", WE.state.changeDisp)
        .selectAll("option")
        .data([0, 6, 12, 18])
        .enter()
        .append("option")
        .text(function(d) {
            return d3.format("02")(d)
        });
    d3.select("#yearstamp")
        .on("change", WE.state.changeDisp)
        .selectAll("option")
        .data(d3.range(1948, new Date()
            .getFullYear() + 1, 1))
        .enter()
        .append("option")
        .text(function(d) {
            return d
        }),
        d3.select("#units-menu")
        .on("change", WE.state.changeDisp)
        .selectAll("option")
        .data([{
            "unit": "Fahrenheit"
        }, {
            "unit": "Kelvin"
        }, {
            "unit": "Celsius"
        }, ])
        .enter()
        .append("option")
        .text(function(d) {
            return d.unit
        }),
        d3.select("#unitsForRange")
        .text(" " + WE.helper.findOption("#units-menu"))
    d3.select('#yearstamp')
        .style("display", WE.helper.findOption("#dataset-menu") == "4X daily average" ? "none" : "inline")
    d3.selectAll('#daystamp,#hourstamp')
        .style("display", WE.helper.findOption("#dataset-menu") != "4X daily average" ? "none" : "inline")
    d3.select("#land-menu")
        .on("change", function() {
            d3.selectAll(".land,.boundary, .graticule")
                .style({
                    "opacity": WE.helper.findOption("#land-menu") == "visible" ? 0.3 : 0
                })
        })
        .selectAll("option")
        .data([{
            name: "visible",
            opacity: 0.3
        }, {
            name: "invisible",
            opacity: 0
        }])
        .enter()
        .append("option")
        .text(function(d) {
            return d.name
        })
    WE.mapping.newProj();
    WE.state.state = WE.state.dataFileName4X();
}

WE.state.setupMenus();
WE.mapping.setup();
queue()
    .defer(d3.json, WE.state.state)
    .defer(d3.json, WE.mapping.mapdata)
    .await(function(err, f, world) {
        WE.file = f;
        WE.contourTools.createContourPlot(f);
        WE.mapping.mkMap(world);
    })
