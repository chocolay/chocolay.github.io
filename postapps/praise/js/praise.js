
function resize() {
  let h = parseInt(svg.style("height"));
  d3.select("#svg1")
    .style("top",(-h)+"px");
}

let header = d3.select("h1").text();
d3.select(".page-title-box").remove();

d3.select(".content .container")
  .style("text-align","center")
  .append("h1").text(header);

let svg = d3.select("#svg2");
resize();
d3.select("body").node().onresize = resize;
let words = [];
d3.select("#svg1")
  .selectAll("text")
  .each(function(d,i) { 
    let box = this.getBBox(); //text box
    let T = d3.select(this);
    let P = d3.select(this.parentElement);
    let coord = P.attr("transform").split(/,|\s|\(|\)/g);
  
words[i] = {
  word: T.text(),
  color: T.style("fill"),
  size: parseInt(T.style("font-size")),
  box: box,
  bx: box.x+box.width/2+(+coord[1]),
  by: box.y+box.height/2+(+coord[2]),
  br: Math.sqrt(box.width*box.width+box.height*box.height)/2,
  x: +T.attr("x")+(+coord[1]),
  y: +T.attr("y")+(+coord[2]),
  rotate:coord[5], 
  transform:coord,
  length: T.node().getComputedTextLength()
  };
});
  
svg.selectAll("circle")
  .data(words,d=>d.word)
  .enter()
  .append("circle")
  .attr("id",d=>d.word)
  .attr("cx",d=>d.bx)
  .attr("cy",d=>d.by)
  .style("fill",d=>d.color)
.transition().duration(500)
  .attr("r",d=>d.br);

d3.select("#svg1")
.transition().duration(500)
.style("opacity",1e-6)
.remove();


