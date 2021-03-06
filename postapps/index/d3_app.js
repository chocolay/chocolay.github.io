//All rights reserved. 
   let ss = parseInt(d3.select("body").style("width"))

   const s = 960, S = 500,     
    radius = 180,
    rpatch = 64,
    gamma = 1;


    let paper = d3.select(".hero__image").append("svg")
     .attr( "width",ss/3)
     .attr("height",ss/6)
    .attr("viewBox","0 0 "+s+" "+ (s/2))   
    .append("g")
.attr("transform","translate(0,0)");

const tau = 2 * Math.PI, period = tau * 4 * Math.pow(radius, 2) / gamma, dt = period / 100,
    comega = Math.cos(dt / (2 * period)), somega = Math.sin(dt / (2 * period)),
    angstep = dt * 360 / (tau * period)
    Nt = 77, it = 0,
    ns = 600, stop = 2 * Math.PI * (1 + 1 / ns), b = 0.1, c = 1,
    xscale = d3.scaleLinear().domain([-S, 0]).range([0,s/2]),
    yscale = d3.scaleLinear().domain([-S/2, S/2]).range([s/2,0]),
    v1o = v1mid = v1new = [radius, 0],

window.onresize = function() {
    let ss = parseInt(d3.select("body").style("width"))
    d3.select("svg")
     .attr( "width",ss/6)
     .attr("height",ss/12);
}

    patchbd = paper.append('path')
     .style('fill', "D95D2A") //"#96B6B1") //"D95D2A") // '#978F67', #4A696E
        .style('opacity', 1),
    p = d3.range(0, stop, stop / ns).map(init),
    line = d3.line().x(function(d) {
        return xscale(d[0])
    }).y(function(d) {
        return yscale(d[1])
    });

patchbd.attr('d', line(p))
let timer = d3.timer(animate,1000)

function advance() {
    v1mid = [v1o[0] * comega - v1o[1] * somega, v1o[0] * somega + v1o[1] * comega];
    v1new = [v1mid[0] * comega - v1mid[1] * somega, v1mid[0] * somega + v1mid[1] * comega];
    p = p.map(function(e) {
        mvo = e;
        return rk4(dblv)
    })
    v1o = v1new
}

function animate() {
    it++;
    advance();
    resample();
    patchbd.attr('d', line(p))
    .attr("transform","rotate("+(it*angstep)+","+(s/2)+","+(s/4)+")")
    if (it>Nt) timer.stop();
}

function dblv(vold, aold) {
    var dv = [aold[0] - vold[0], aold[1] - vold[1]],
        mv = [aold[0] + vold[0], aold[1] + vold[1]],
        d2 = dv[0] * dv[0] + dv[1] * dv[1],
        m2 = mv[0] * mv[0] + mv[1] * mv[1];
    return [-(gamma * dt) /tau * (dv[1] / d2 + mv[1] / m2), (gamma * dt) /tau * (dv[0] / d2 + mv[0] / m2)]
}

function init(arg) {
    return [rpatch * Math.cos(arg), rpatch * Math.sin(arg)]
}

function resample() {
    for (is = p.length - 1; is > 0; is--) {
        d2 = Math.pow(p[is][0] - p[is - 1][0], 2) + Math.pow(p[is][1] - p[is - 1][1], 2);
        if (d2 < b) {
            p.splice(is - 1, 1)
        };
        if (d2 > c) {
            p.splice(is, 0, [(p[is][0] + p[is - 1][0]) / 2, (p[is][1] + p[is - 1][1]) / 2]);
        }
    }
    p = p.filter(function(val) {
        return !(typeof val == 'undefined')
    });
}

function rk4(fn) {
    mvk1 = fn(v1o, mvo),
        mvk2 = fn(v1mid, [mvo[0] + 0.5 * mvk1[0], mvo[1] + 0.5 * mvk1[1]]),
        mvk3 = fn(v1mid, [mvo[0] + 0.5 * mvk2[0], mvo[1] + 0.5 * mvk2[1]]),
        mvk4 = fn(v1mid, [mvo[0] + mvk3[0], mvo[1] + mvk3[1]])
    return [mvo[0] + mvk1[0] / 6 + mvk2[0] / 3 + mvk3[0] / 3 + mvk4[0] / 6, mvo[1] + mvk1[1] / 6 + mvk2[1] / 3 + mvk3[1] / 3 + mvk4[1] / 6]
}
