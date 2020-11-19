let h = parseInt(d3.select("#svg2").style("height"));
d3.select("#svg1")
  .style("top",(-h)+"px")
             
let words = [];
d3.selectAll("text").each(function(d,i) { 
let T = d3.select(this);
let P = d3.select(this.parentElement);
words[i] = {
  word: T.text(),
  color: T.style("fill"),
  size: T.style("font-size"),
  x: +T.attr("x"),
  y: +T.attr("y"),
  tranform: P.style("transform")
  };
});
