
let header = d3.select("h1").text();
d3.select(".page-title-box").remove();

d3.select(".content .container")
  .style("text-align","center")
  .append("h1").text(header);

let svg = d3.select("#svg2");
let h = parseInt(svg.style("height"));

d3.select("#svg1")
  .style("top",(-h)+"px");
   
let words = [];
d3.select("#svg1")
  .selectAll("text")
  .each(function(d,i) { 
let T = d3.select(this);
let P = d3.select(this.parentElement);
let coord = P.attr("transform").split(/,|\s|\(|\)/g);
  
words[i] = {
  word: T.text(),
  color: T.style("fill"),
  size: parseInt(T.style("font-size")),
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
  .attr("r",d=>d.size/20)
  .attr("cx",d=>d.x)
  .attr("cy",d=>d.y)
  .style("fill",d=>d.color);

d3.select("svg1").style("opacity","0.2")
