/**
 * Created by Elise Ralph
 * All rights reserved
 */



//this is the model
function runSimulation(nodes,obj) {


    updateMarketRents();

    makeDecision();
    newRental();
    moveOut();
    makeReady();
    madeReady();

    moveIn();

    if (d3.timeMonth(obj.currentDate)-obj.currentDate==0) {
        kickOut();
    }
    updateOccupancy();


    //increment the time
    obj.currentDate = d3.timeDay.offset(obj.currentDate, 1);

    /*              simulation functions    */
    function updateMarketRents(){

        if (d3.timeYear(obj.currentDate)-obj.currentDate ==0) {
            clearFilters(obj);

            var actOn = getSet(obj);
            actOn.forEach(function(d) {
                d["Total Market Rent"] *=(1+0.03);
            });
            updateCrossfilter(actOn,obj);
        }
    }//update

    function makeDecision() {

        //for occupied units where the renewal status is undecided
        obj.crossfilter.dims["Status"].filter("OC");
        obj.crossfilter.dims["Renewal Status"].filter("Undecided");


        obj.crossfilter.dims["Lease End Date Current Lease"].filter(function(d) {
            return d3.timeDay.count(obj.currentDate, d) == get("avg-notice-lead-days");

        });

        //this is the set of occupied, undecided renewals whose leases end within  the lead days notice
        var actOn = getSet(obj);


        if(actOn.length > 0 ) {
            //these are renewed for 12 months
            var renewalSample = sampleRandomN(actOn, get("renew-probability") * actOn.length);
            //renewal renewalSample
            renewalSample.forEach(function(unit){
                unit["Renewal Status"] = "Renewed";
                unit["Lease Type Future Lease"] = "Renewal";
                unit["Lease Start Date Future Lease"] = d3.timeDay.offset(unit["Lease End Date Current Lease"],  1);
                unit["Lease End Date Future Lease"] = d3.timeMonth.offset(unit["Lease Start Date Future Lease"], 12);
                log("This tenant renewed!!",unit);
            });

            //these are the units that are not renewed
            var remainingUnits = actOn.filter( function( el ) {
                return !renewalSample.includes( el );
            } );
            var mtmSample = sampleRandomN(remainingUnits, get("longterm-probability") * remainingUnits.length + Math.random() > 0.5 ? 1:0 );

            //make these mtmSampel units go MTM
            mtmSample.forEach(function(unit){
                unit["Renewal Status"] = "Undecided";
                log("This tenant chose to go MTM!!",unit);
            })

            //thee are the ones that are not going month to month; they'll move out
            var ntvSample = remainingUnits.filter( function( el ) {
                return !mtmSample.includes( el );
            } );

            //make the ntvSample give notices
            ntvSample.forEach(function(unit){
                unit["Renewal Status"] = "NTV";
                unit["Status"] = "NA";
                unit["Notice On Date Current Lease"] = obj.currentDate;
                unit["Notice For Date Current Lease"] = unit["Lease End Date Current Lease"];
                unit["Make Ready Date Future Lease"] = d3.timeDay.offset(unit["Lease End Date Current Lease"], get("make-ready-schedule-days") + get("make-ready-days"))
                log("There is one tenant going to move out!!",unit);
            });
        }

        clearFilters(obj); //make the full crossfilter available
        updateCrossfilter(actOn,obj); //update the units that have made a decision

    } // makeDecision

    function newRental() {
        /*
         //for vacant units
         //the new rental is related to vacancy rate, vacancy rate is controled under 3%
         */

        obj.crossfilter.dims["Status"].filter(function(d) {
            return (d == "VA") || (d == "NA")
        });
        actOn = d3.shuffle(getSet(obj));
        var vU = actOn.length; //NA or VA

        if (d3.timeMonday(obj.currentDate)-obj.currentDate==0) {
            //var vUnits = d3.randomInt(3,vU)()
            var vUnits = Math.min(vU / obj.numUnits > 0.03 ? obj.numUnits * 0.03 : Math.random() * vU, get("lease-per-week"));
            actOn.slice(0, vUnits).forEach(function(d, i) {
                var lef = (Math.random() < get("re-12-month-chance")) ? 12 : 6;

                var mTime = d3.randomInt(0, 20)()
                var nDays = d3.timeDay.count(obj.currentDate,d["Make Ready Date Future Lease"]);
                if (obj.currentDate > d["Make Ready Date Future Lease"]) {
                    d["Make Ready Date Future Lease"] = obj.currentDate;
                }
                if (d["Status"] == "VA") { //unit is empty but may need cleaning
                    if (nDays <= 0) { //means the room is cleaned & ready to move in
                        if (mTime > 0) {
                            d["Status"] = "VL";
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate, mTime+50);
                        } else { //move in right today
                            //since we bound mTime to have a minimum of 0... this doesn't get called
                            d["Status"] = "OC";
                            d["Lease End Date Current Lease"] = d3.timeMonth.offset(d["Lease Start Date Future Lease"], lef);
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate,0);
                        }
                    } else { //when the unit is not ready, either need to clean or still tenant live in with "NL"
                        d["Status"] = "VL";
                        //check if make-ready days ahead or later
                        if (nDays < mTime) { //makeReady day before new lease start
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate, mTime);
                        } else { //makeReady day after lease start, then lease start move to ready day
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(d["Make Ready Date Future Lease"], mTime+50);
                        }
                    }
                } else { //the unit is still occupied
                    d["Status"] = "NL";
                    d["Notice For Date Current Lease"] = d3.timeDay.offset(d["Make Ready Date Future Lease"], mTime);
                }
                d["Lease Type"] = "New";
                d["Lease End Date Future Lease"] = d3.timeMonth.offset(d["Lease Start Date Future Lease"], lef);
            });

        }

        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    } //newRental

    //moveOut
    function moveOut() {
        obj.crossfilter.dims["Status"].filter("NA");
        obj.crossfilter.dims["Notice For Date Current Lease"].filter(obj.currentDate);
        actOn = getSet(obj);

        actOn.forEach(function(unit) {
            unit["Status"] = "VA";
            unit["Renewal Status"] = "Inactive";
            log("Empty unit vacated",unit);
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);

        obj.crossfilter.dims["Notice For Date Current Lease"].filter(obj.currentDate);
        obj.crossfilter.dims["Status"].filter("NL");
        actOn = getSet(obj);

        actOn.forEach(function(unit) {
            unit["Status"] = "VL";
            unit["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate,50)
            unit["Make Ready Date Future Lease"] = d3.timeDay.offset(obj.currentDate, get("make-ready-schedule-days") + get("make-ready-days"));
            log("Leased out unit vacated",unit);
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }//moveOut

    //moveIn
    function moveIn(d) {
        O = obj
        obj.crossfilter.dims["Status"].filter("VL");

        actOn = getSet(obj);
        //console.log(actOn.map(d=>d3.timeFormat("%b%d%Y")(d["Lease Start Date Future Lease"])))
        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(obj.currentDate);
        actOn = getSet(obj);
        actOn.forEach(function(unit) {
            unit["Status"] = "OC";
            unit["Lease Start Date Current Lease"] = obj.currentDate;
            unit["Lease End Date Current Lease"] = unit["Lease End Date Future Lease"];


            unit["Lease Start Date Future Lease"] = "";
            unit["Lease End Date Future Lease"] = "";

            unit["Renewal Status"] = "New";
        });

        clearFilters(obj);
        updateCrossfilter(actOn,obj);


        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(obj.currentDate);
        obj.crossfilter.dims["Renewal Status"].filter("Renewed");
        actOn = getSet(obj);

        actOn.forEach(function(unit) {
            unit["Status"] = "OC";
            unit["Lease Start Date Current Lease"] = obj.currentDate;
            unit["Lease End Date Current Lease"] = unit["Lease End Date Future Lease"];


            unit["Lease Start Date Future Lease"] = "";
            unit["Lease End Date Future Lease"] = "";

            unit["Renewal Status"] = "Renewal";
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }


    function makeReady(d) {

    }


    function madeReady(d) {

    }

    //evictions and skips
    function kickOut(d) {

        obj.crossfilter.dims["Status"].filter("OC");
        actOn = getSet(obj);

        var kickout = sampleRandomN(actOn, get("evict-rate") * actOn.length);

        kickout.forEach(function(unit) {
            log("bad boy",unit);
            unit["Status"] = "NA";
            unit["Lease End Date Current Lease"] = obj.currentDate;
            // set make_ready time:plus current-date (make-ready-schedule-days + make-ready-days) "days"]
            unit["Make Ready Date Future Lease"] = d3.timeDay.offset(obj.currentDate, get("make-ready-schedule-days") + get("make-ready-days"))
        });


        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }

    //updateOccupancy
    function updateOccupancy() {
        obj.crossfilter.dims["Status"].filter("OC");
        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(obj.currentDate);
        actOn = getSet(obj);
        actOn.forEach(function(unit) {
            unit["Lease Date Current Lease"] = unit["Lease End Date Future Lease"];
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);

        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(function(t) {
            return d3.timeDay.offset(t, 30) > obj.currentDate
        });
        actOn = getSet(obj);
        actOn.forEach(function(unit) {
            unit["Renewal Status"] = "Undecided"
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);


        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(null);
        obj.crossfilter.dims["Make Ready"].filter(function(d) {
            return d < obj.currentDate
        });
        actOn = getSet(obj);
        obj.VAready = actOn.length;
        obj.VAnotReady = obj.numUnits - actOn.length;
        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }


}//runSimulation


function deepClone (obj) {
    var _out = new obj.constructor;

    var getType = function (n) {
        return Object.prototype.toString.call(n).slice(8, -1);
    }

    for (var _key in obj) {
        if (obj.hasOwnProperty(_key)) {
            _out[_key] = getType(obj[_key]) === 'Object' || getType(obj[_key]) === 'Array' ? deepClone(obj[_key]) : obj[_key];
        }
    }
    return _out;
}

function howManyCat(data,key) {return d3.set(data.map(d=>d[key])).values().length}

function log(arg,obj) {
    //  console.log(arg,obj["Property Name"]," ",obj["Unit Number"])
}

function sampleRandomN(arr,N) {
    return d3.shuffle(arr).slice(0,N);
}//sampleRandomN

function updateCrossfilter(data,obj) {
    var ids = data.map(function(d) {return d.id});
    obj.crossfilter.dims.id.filter(function(d) {
        return ids.indexOf(d)>-1
    });
    obj.crossfilter.remove();
    obj.crossfilter.add(data);
    clearFilters(obj);
}

function isolate(force, filter,obj) {
    var initialize = force.initialize;
    force.initialize = function() { initialize.call(force, obj.data.filter(filter)); };
    return force;
} //isolate

function get(variable) {
    return +d3.select("#" + variable + " input")
        .property("value");
} //get

function getSet(obj) {
    return obj.crossfilter.dims["id"].top(Infinity);
}

function clearFilters(obj) {
    Object.keys(obj.crossfilter.dims).forEach(function(d) {
        obj.crossfilter.dims[d].filter(null);
    });
}

function makeTooltip() {
    var tt = d3.select("#d3_app").append("div")
        .attr("id","tooltip");
    tt.append("header")
    var sections = ["Property Name","Unit Number"];
    tt.select("header").selectAll("span").data(sections).enter()
        .append("span")
        .classed("headerSpan",1);
    var sections = ["Floor Plan Name","Beds","Square Feet","Total Market Rent"];
    tt.selectAll("p").data(sections).enter()
        .append("p")
        .classed("info",1);
}

function boundRandom(min, mean, max, std) {
    var test = -Infinity;
    while (test < min || test > max)
        test = d3.randomNormal(mean, std)();
    return test
}

var url = "/postapps/agent1/assets/rent.csv";

var codes = {
    "Status":["VA","VL","NA","NL","OC","Down"],
    "Renewal Status": ["Inactive","NTV","Undecided","New"],
    "Size":d3.range(0,4),
    "All":[1]
}

var duration = 100;

var color = d3.scaleOrdinal(["#999999","#6495ed","#EDBC64","#FF9586","#7AA25C","#AAAAAA"])
    .domain(codes["Status"]);


var width = 770;
var height = 600;
var id = "#d3_app";


d3.csv(url).then(function(data) {
    obj = { "params": {"currentDate":"14/09/2020"},
        "adjustableParams":[
            {"name":"make ready schedule days","variable":"make-ready-schedule-days","value":10,"domain":[0,14,1]},
            {"name":"make ready days","variable":"make-ready-days","value":10,"domain":[0,14,1]},
            {"name":"average app to mi lead days","variable":"avg-app-to-mi-lead-days","value":15,"domain":[0,60,1]},
            {"name":"maximum app to mi lead days","variable":"max-app-to-mi-lead-days","value":60,"domain":[0,60,1]},
            {"name":"average notice lead days","variable":"avg-notice-lead-days","value":30,"domain":[0,60,1]},
            {"name":"eviction rate","variable":"evict-rate","value":0.05,"domain":[0,0.5,0.001]},
            {"name":"lease per week","variable":"lease-per-week","value":1,"domain":[0,10,1]},
            {"name":"renew 12 month chance","variable":"re-12-month-chance","value":0.9,"domain":[0,1,0.01]},

            {"name":"renew probability","variable":"renew-probability","value":0.7,"domain":[0,1,0.01]},
            {"name":"longterm probability","variable":"longterm-probability","value":0.55,"domain":[0,1,0.01]},
        ],
        "variables":[]
    };

    Keys = Object.keys(data[0]);
    theirvariables = ["", "", "unit_number", "beds", "", "floor_plan", "square_feet", "unit_status", "total_mark", "lease_type", "lease_term", "l_end", "notice_on", "notice_for", "lease_rent", "mtmfees", "length_of_stay", "occupancy_status", "renewal_status", "", "l_start", "lease_end_future_lease", "move_in_date", "lease_renew", "m_ready"];

    var obj = setup(obj, data);
    //TY: can we get currentDate from the CSV file. It is the ReportDate column
    //ER: fixed
    obj.currentDate = data[0]["Report Date"];

    var origData = deepClone(data); //so we can reset the model

    //will need these numbers to make the visualization
    var categoryCounts = {
        "All": 1,
    };
    ["Status","Size","Renewal Status"].forEach(function(key) {
        categoryCounts[key] = codes[key].length;
    });

    //set a scale for the circles based on unit size
    var radiusScale = d3.scaleLinear()
        .domain(d3.extent(obj.data,d=>+d["Square Feet"])) //range of square ft
        .range([4,10]); //range of circle sizes

    initVis(id,obj.data,obj);

    obj.adjustableParams.forEach(function (param,i) {
        makeSlider(d3.select(id +" #menu"), param);
        //makeInput(d3.select("#d3_app"),"renew","renew",50);
    });
    d3.selectAll(".inputBox").filter((d,i)=>i<8)
        .style("display","none")

    /*                                  button behaviors                */

    goButton = d3.select("#menu")
        .append("div").attr("id","controls")
        .append("button")
        .attr("id","go")
        .datum("go"); //to start with it running
    goButton.text(function() {return d3.select(this).datum()=="go"?"stop":" go "});
    goButton.on("click",function() {
        var d = d3.select(this).datum()
        if (d=="stop") { //it has been stopped
            start(d3.select("#toggle").datum());
        }
        else {
            stopForecast();
        }
    });

    resetButton = d3.select("#controls").append("button")
        .attr("id","reset");
    resetButton.text("reset");

    //this resets back to the start
    resetButton
        .on("click",function() {
            stopForecast();

            //remove the current data and refill with the new data

            obj.crossfilter.remove();
            obj.data = deepClone(origData);
            obj.crossfilter.add(obj.data);
            d3.selectAll(".unit").data(obj.data);
            d3.selectAll(".unit")
                .each(function(d) {
                    d3.select(this).select("circle")
                        .datum(d)
                });

            obj.currentDate = obj.data[0]["Report Date"];
            obj.params.currentDate = obj.currentDate;
            d3.select("#timestamp").text(obj.formats.timestampFormat(obj.currentDate));


            //start(d3.select("#toggle").datum());
        });

    d3.select("#controls").append("input")
        .attr("id","durationSlider")
        .property("type", "range")
        .property("min", 5)
        .property("max", 1000)
        .property("step", 5)
        .property("value",900)
        .on("change",function(d) {
            stopForecast();
            start(d3.select("#toggle").datum());
        });

    var t
    var increment = 0;

    /*                                  functions                       */

    function initVis(id,data,obj) {
        var menu = d3.select(id).append("id")
            .attr("id","menu");

        var mainVis = d3.select(id).insert("div","#menu")
            .attr("id","mainVis");

        var buttonTypes = ["Status","Size","Renewal Status","All"];
        mainVis
            .append("div")
            .attr("id","toggle")
            .selectAll("button").data(buttonTypes).enter()
            .append("button")
            .classed("sortButton",1)
            .text(function(d) {return d});

        d3.select(".sortButton").style("background","#4CAF50");

        mainVis.selectAll("button.sortButton").on("click",function() {
            d3.selectAll(".sortButton").style("background","white");
            d3.select(this).style("background"," #4CAF50");
            stopForecast();
            let d = d3.select(this).datum()
            start(d);
        });

        var svg = d3.select("#svg")
            .attr("width",width)
            .attr("height",height)
            .attr("id", "mainSVG")
            .append("g")
            .classed("forecast",1);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "backgroundRect");

        svg.append("text")
            .attr("id","timestamp")
            .style("fill","white")
            .attr("transform","translate(10,20)");

        svg.selectAll(".unit").data(data).enter()
            .append("g")
            .attr("class", "unit")
            .attr("transform","translate(480,300)")
            .append("circle")
            .attr("r",function(d) {return radiusScale(d["Square Feet"])})
        clearFilters(obj);
    }//initVis



    function setup(obj, data) {
        obj.data = data;
        obj.formats = {
            timeParse: d3.timeParse("%d/%m/%Y"),
            timeFormat: d3.timeFormat("%d/%m/%Y"),
            timestampFormat:d3.timeFormat("%b %d, %Y")
        };
        obj.data.forEach(function(unit,index) {
            timeKeys = ["Report Date", "Lease End Date Current Lease", "Lease End Date Future Lease", "Lease Start Date Future Lease", "Make Ready Date Future Lease", "Move In Date Future Lease", "Notice For Date Current Lease", "Notice On Date Current Lease"];
            timeKeys.forEach(function(key) {
                unit[key] = obj.formats.timeParse(unit[key])
                if (!unit[key] || unit[key] == "") unit[key] = obj.formats.timeParse(obj.params.currentDate);
            });
            unit.id = "id"+index;
            unit.All = 1;
            unit["Size"] = +unit["Size"];
        });
        obj.crossfilter = crossfilter(data);

        obj.crossfilter.dims = {};

        var dims = ["id","Status", "Lease End", "Lease Start Date Future Lease", "Renewal Status", "Make Ready", "Lease End Date Current Lease","Notice For Date Current Lease"] //TY: added "Notice For Date Current Lease"
            .forEach(function(key) {
                obj.crossfilter.dims[key] = obj.crossfilter.dimension(function(d) {
                    return d[key]
                });
            });

        obj.numUnits = obj.data.length;
        obj.data = d3.shuffle(obj.data);
        return obj
    } //setup

    //start up a simulation & visualization of it
    start = function(key) {
        d3.select("#go").datum("go").text("stop"); //the datum indicates the simulation is in "go" mode.
        //the text on the button tells the user to click on it to stop the motion

        duration = 1000-(+d3.select("#durationSlider").property("value"));

        d3.select("#toggle").datum(key); //store the field we are going to sort on

        //set up a new forcing function for the visualization
        visualSimulation = d3.forceSimulation(obj.data)
            .force("y", d3.forceY(70))
            .force("charge", d3.forceManyBody().strength(-6))
            .alphaTarget(0.3)
            .on("tick", visTick);
        createCenters(visualSimulation,key);


        timer = d3.interval(function(tim) {
            if (obj.currentDate>new Date(2023,0,1)) {
                timer.stop();
                visualSimulation.stop();
            }
            let ttime = obj.formats.timestampFormat(obj.currentDate);
            d3.select("#timestamp").text(ttime);
            runSimulation(obj.data,obj);
            createCenters(visualSimulation,key);
        },duration);


        d3.selectAll("path.line").each(function() {
            variable = d3.select(this.parentElement.parentElement).attr("id");
            d3.select(this).transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .on("start", plotTick(variable));
        });


    }//start

    stopForecast = function() {
        d3.select("#go").datum("stop").text("go"); //the datum indicates the simulation is in "go" mode.
        //the text on the button tells the user to click on it to stop the motion
        timer.stop();
        visualSimulation.stop();
    } //stop

//move the circles
    function visTick() {
        increment+=1;
        d3.selectAll("circle")
            .attr("transform",function(d) {
                return "translate("+ d.x+","+ d.y+")"
            })
            .style("fill",function(d) {
                return color(d["Status"])
            })
            .style("stroke",function(d) {
                d["Status"]=="VA"?"white":"none"
            })
            .style("stroke-width",function(d) {
                d["Status"]=="VA"?2:0
            })
        //playing with some ways to highlight the motion
        /*
         .attr("r",function(d) {
         var radius = xScale(d["Square Feet"]);
         if (increment>100) {
         radius *= Math.min(1.5,Math.max(1,Math.abs(d.vx)));
         }
         return radius
         });
         d3.selectAll("circle")
         .style("opacity",function(d) {
         return Math.abs(d.vx)>1?1:0.9
         })
         */
    } //visTick

    //set up the centers based on the number of categoryCounts
    function createCenters(vs,key) {
        var Ncenters = categoryCounts[key];
        var centerPos_x = [];
        var catWidth = (width-100)/(Ncenters+1);
        if (Ncenters==1) centerPos_x = [0];
        else {
            d3.range(0,Ncenters).forEach(function(i) {
                centerPos_x.push(catWidth*i-325);
            });
        }
        centerPos_x.forEach(function(d,i) {
            vs.force("center_x_"+i+"_"+Ncenters,isolate(d3.forceX(centerPos_x[i]),
                function(d) {
                    j = codes[key][i];
                    return d[key] === j; },obj))
        });
        d3.selectAll("text.categoryLabel").remove();
        if (key!="All") {
            d3.select("#mainSVG .forecast").selectAll("text.categoryLabel")
                .data(codes[key]).enter()
                .append("text")
                .classed("categoryLabel",1)
                .text(function(d) {return d})
                .style("fill","white")
                .attr("text-anchor","left")
                .attr("transform",function(d,i) {
                    return "translate("+(centerPos_x[i]*1.2+450)+",225)"
                });
        }

        return centerPos_x;
    } //createCenters


    function makeSlider(sel, obj) {
        var humanName = obj.name;
        var variable = obj.variable;
        var defaultValue = obj.value;
        var domain = obj.domain;
        var sel2 = sel.append("div")
            .classed("inputBox", 1)
            .attr("id", variable);

        sel2.append("div")
            .text(humanName + ":")
            .classed("label", 1)
            .style("color","ivory");

        sel2.append("input")
            .property("type", "range")
            .property("min", domain[0])
            .property("max", domain[1])
            .property("step", domain[2])
            .property("value", defaultValue)
            .classed("slider", 1)
            .on("input", change);

        sel2.append("input")
            .property("value", defaultValue)
            .classed("text", 1)
            .classed("slider", 1)
            .on("input", change);

        function change() {
            //update everything about the slider
            sel2.selectAll("input.slider, input.text")
                .property("value", this.value);
            obj.value = this.value;
        }
    } //makeSlider
});

d3.timeout(function() {

    d3.select("#d3_app").append("svg")
               
        var key = "Status";
        var increment = 0;
        start(key);
},500);


