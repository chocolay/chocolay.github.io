function animate() {
    Uhat = rk4(kdv, Uhat, t, params)
    t += dt;
    expfn = new numeric.T(params.k.map(function(e) {
        return Math.cos(e * e * e * t)
    }), params.k.map(function(e) {
        return Math.sin(e * e * e * t)
    }))

    patchbd
        .attr('d', line((expfn.mul(Uhat)).ifft().x))//+" Z"
    d3.select("#timeDisplay").html("T = " + d3.round(t * 1000) / 1000)
    return (t > 0.1) || stopit
}

function dftmtx_arg(N) {
    var A = [];
    for (var ij = 0; ij < N; ij++) {
        A[ij] = [];
        for (var jj = 0; jj < N; jj++) {
            A[ij][jj] = -ij * jj * τ / N;
        }
    }
    return A
}

function calcFFT(N) {
    return (new numeric.T(numeric.rep([N, N], 0), dftmtx_arg(N))).exp()
}

function iFFT(FFT) {
    return FFT.conj().div(FFT.x.length)
}

function calcD2x(N) {
    FFT = calcFFT(N);
    k = d3.range(0, N / 2 + 1).concat(d3.range(-N / 2 + 1, 0));
    k2 = numeric.diag(k.map(function(e) {
        return -e * e
    }));
    return FFT.dot(k2).dot(FFT.conj().div(FFT.x.length)).x
}

function calcEig(D2, u) {
    return numeric.eig(numeric.add(D2, numeric.diag(u))).lambda.x.filter(function(e) {
        return e > 0
    })
}

function kdv(Uhat, t, params) {
    expfn = new numeric.T(params.k.map(function(e) {
        return Math.cos(e * e * e * t)
    }), params.k.map(function(e) {
        return Math.sin(e * e * e * t)
    }))
    u = (expfn.mul(Uhat)).ifft().x,
        usqhat = (new numeric.T(u.map(function(e) {
            return e * e
        }), numeric.rep([N], 0))).fft();
    minus3ik = new numeric.T(numeric.rep([N], 0), params.k.map(function(e) {
        return -3 * e
    }))
    return (usqhat.mul(expfn.conj())).mul(minus3ik)
}

function reset() {
    stopit = false;
    d3.selectAll("#eiglines").remove()
    d3.selectAll("#eigtext").remove()
    a = d3.select("#slidr").data()

    u0 = kind == "sech2" ? soliton(τ / 4, a / 2, x) : x.map(function(e) {
        return a * Math.exp(-alpha * (e - τ / 4) * (e - τ / 4))
    })

    Uhat = (new numeric.T(u0, u0.map(function() {
        return 0
    }))).fft();
    t = 0;
    d3.timer(animate, 250);
}

function rk4(fn, sol_o, t, params) {
    k1 = fn(sol_o, t, params),
        k2 = fn(sol_o.add(k1.mul(dt / 2)), t + params.dt / 2, params),
        k3 = fn(sol_o.add(k2.mul(dt / 2)), t + params.dt / 2, params),
        k4 = fn(sol_o.add(k3.mul(dt)), t + params.dt, params);
    return sol_o.add(k1.mul(dt / 6)).add(k2.mul(dt / 3)).add(k3.mul(dt / 3)).add(k4.mul(dt / 6))
}

function dotheeig() {
    if (typeof D2 == "undefined") D2 = calcD2x(u0.length);
    lambda = calcEig(D2, u0);
    D = paper.selectAll("#eiglines").data(lambda).enter()
    D.append("line")
        .attr("x1", 0)
        .attr("x2", 960)
        .attr("y1", function(d) {return yscale(2 * d)})
        .attr("y2", function(d) {return yscale(2 * d)})
        .attr("id", "eiglines")
        .style("stroke", "darkgrey")
}

function soliton(offset, A, x) {
    return x.map(function(e) {
        var sech = 2 / (Math.exp(Math.sqrt(A) * (e - offset)) + Math.exp(-Math.sqrt(A) * (e - offset)))
        return 2 * A * sech * sech
    })
}

function mkslider(amp) {

    w = xscale(Math.sqrt(-Math.log(1 / 2) / alpha) * 64 / Math.PI)

    dragster = d3.behavior.drag().on("drag", function(d) {
        stopit = true;
        a = d3.round(d3.max([d3.min([yscale.invert(d3.event.y), 100]), 0]));
        d3.select(this).data([a]);
        d3.select(this).attr("y", function(d) {
            return yscale(a)
        })
        u0 = kind == "sech2" ? soliton(τ / 4, a / 2, x) : x.map(function(e) {
            return a * Math.exp(-alpha * (e - τ / 4) * (e - τ / 4))
        })
        patchbd.attr('d', line(u0))
        d3.select("#greyheight").attr("height",yscale(a))
    }).on("dragend", reset)

    dragw = d3.behavior.drag().on("drag", function(d) {
        stopit = true;
        w = d3.min([d3.max([18, d3.event.x - xscale(32)]), 150]);
        d3.select(this)
            .attr("cx", w+xscale(32))
        alpha = d3.round(16181 / (w * w))
        d3.select("#graywslider").attr("width", w + 5)
        u0 = x.map(function(e) {
            return a * Math.exp(-alpha * (e - τ / 4) * (e - τ / 4))
        })
        patchbd.attr('d', line(u0))
    }).on("dragend", reset)



    slider = paper.append("g")
    slider.append("rect")
        .attr("id","greyheight")
        .attr("x", xscale(32) - 5)
        .attr("y", yscale(100))
        .attr("width", 10)
        .attr("height", s / 4 - yscale(100))
        .style("fill", "grey")

    slider.selectAll("#slidr").data(amp).enter().append("circle")
        .attr("cx", xscale(32) - 15 - 5)
        .attr("cy", function(d) {return yscale(d) - 2.5})
        .attr("r",15)
        .attr("id", "slidr")
        .style("fill", "orangered")
        .call(dragster)

    slider.append("rect")
        .attr("id", "graywslider")
        .attr("x", xscale(32) - 5)
        .attr("y", yscale(0))
        .attr("width", w + 5)
        .attr("height", 5)
        .style("fill", "grey")


    slider.append("circle")
        .attr("id", "wslider")
        .attr("cx", xscale(32) + w - 5)
        .attr("cy", yscale(0) - 5)
        .attr("r", 15)
        .style("fill", "orangered")
        .call(dragw)
}

d3.select("#starter").on("click",dotheeig);

var kind = "nsech2",
    i = new numeric.T(0, 1),
    τ = Math.PI * 2,
    stopit = false,
    a = 64,
    alpha = 8,
    N = 128,
    x = d3.range(0, τ, τ / N),
    dt = (0.2) / (N * N),
    params = {
        k: d3.range(0, N / 2 + 1).concat(d3.range(-N / 2 + 1, 0)),
        dt: dt
    },
    u0 = kind == "sech2" ? soliton(τ / 4, a / 2, x) : x.map(function(e) {
        return a * Math.exp(-alpha * (e - τ / 4) * (e - τ / 4))
    });

var s = 960,
    paper = d3.select('#d3_app')
        .append("svg")
        .attr("width", s)
        .attr("height",s/2); //height is s/2 for straight line
d3.select("#d3_app").style("height","250px");

var xscale = d3.scale.linear().domain([0, N]).range([0, s]),
    yscale = d3.scale.linear().domain([0, 175]).range([s / 4, 0]),
    line = d3.svg.line().x(function(d, i) {
        return xscale(i)
    }).y(function(d) {
        return yscale(d)
    }).interpolate("basis"),

    //line = d3.svg.line().x(function(d,i) {return 340+(yscale(100-d))*Math.cos(x[i])}).y(function(d,i) {return 340+(yscale(100-d))*Math.sin(x[i])}).interpolate("basis")

    patchbd = paper.append('svg:path')
        .style('fill','none')
        .style('stroke', '#D95D2A')
        .style('stroke-width', 2.5);

mkslider([a]);

t = 0;
Uhat = (new numeric.T(u0, u0.map(function() {
    return 0
}))).fft();

d3.timer(animate)
