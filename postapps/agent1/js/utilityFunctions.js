
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
