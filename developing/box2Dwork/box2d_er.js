
var  b2Vec2 = Box2D.Common.Math.b2Vec2,
b2AABB = Box2D.Collision.b2AABB,
b2BodyDef = Box2D.Dynamics.b2BodyDef,
b2Body = Box2D.Dynamics.b2Body,
b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
b2Fixture = Box2D.Dynamics.b2Fixture,
b2World = Box2D.Dynamics.b2World,
b2MassData = Box2D.Collision.Shapes.b2MassData,
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
b2DebugdrawCanvas = Box2D.Dynamics.b2DebugdrawCanvas,
b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
b2Listener = Box2D.Dynamics.b2ContactListener,
listener = new b2Listener,
init = {
setup: function() {
	tnow = 0
  box2d.create.world();
  box2d.create.defaultFixture();            
  this.surroundings(); 
if (addWithClick) {this.createClicker(); this.createSVGClicker()}},

timeseries: function(m) {
	w2 = m.w-m.r-m.l,h2 = m.h-m.t-m.b,
	x = d3.scale.linear().range([0,w2]), y = d3.scale.linear().range([h2,0]), v = d3.scale.linear().range([h2,0]);	
	svg2x = d3.select("#xtimeseries").append("svg").attr("width",w2+m.r+m.l).attr("height",h2+m.t+m.b).attr("class","notmap")
	.append("g").attr("transform","translate("+(m.l)+","+(m.t)+")"),
	svg2v = d3.select("#vtimeseries").append("svg").attr("width",w2+m.r+m.l).attr("height",h2+m.t+m.b).attr("class","notmap")
	.append("g").attr("transform","translate("+(m.l)+","+(m.t)+")");
	line.x = d3.svg.line().x(function(d) {return x(d.t)}).y(function(d) {return y(d.x)}).interpolate("basis");
	line.y = d3.svg.line().x(function(d) {return x(d.t)}).y(function(d) {return y(d.y)}).interpolate("basis");
	line.u = d3.svg.line().x(function(d) {return x(d.t)}).y(function(d) {return v(d.u)}).interpolate("basis");
	line.v = d3.svg.line().x(function(d) {return x(d.t)}).y(function(d) {return v(d.v)}).interpolate("basis");
	axis.x = d3.svg.axis().scale(x).tickSize(-h2).ticks(4).orient("bottom");
	axis.y = d3.svg.axis().scale(y).tickSize(-w2).orient("left").ticks(5);
	axis.v = d3.svg.axis().scale(v).tickSize(-w2).ticks(5).orient("left");
	x.domain([0,Tfinal]);
	y.domain([0,h/SCALE]);
	v.domain([-20,20]);	

	svg2x.append("g").attr("class", "x axis").attr("transform", "translate(0," + h2 + ")").call(axis.x);
	svg2v.append("g").attr("class", "x axis").attr("transform", "translate(0," + h2 + ")").call(axis.x);

	var gyx = svg2x.append("g").attr("class", "y axis").call(axis.y);
	var gyv = svg2v.append("g").attr("class", "y axis").call(axis.v);

},

createClicker: function() {
if (typeof canvas != 'undefined') {
canvas.addEventListener('click',function(e) {
var shapeOptions = {y: (canvas.height/SCALE)*(e.offsetY/canvas.height),x: (canvas.width/SCALE)*(e.offsetX/canvas.width)};
add.random(shapeOptions)},false)}},

createSVGClicker: function() {
svg.on('click', function() {
mcoord = d3.mouse(this); 
var shapeOptions = {y: (h/SCALE)*(mcoord[1]/h),x: (w/SCALE)*(mcoord[0]/w)};
add.random(shapeOptions)},false)}},

             
loop = {
drawCanvas: function() {
if (typeof canvas != 'undefined') {
ctx.clearRect(0,0,canvas.width,canvas.height); for (var i in shapes) {shapes[i].drawCanvas()}
}}, 

drawSVG: function() { 
  d3.selectAll("circle:not(.static)")
    .attr("cy",function(d) {return shapes[this.id].y*SCALE})
    .attr("cx",function(d) {return shapes[this.id].x*SCALE})
    .attr("transform",function(d){return "rotate("+(shapes[this.id].angle*180/Math.PI)+","+(shapes[this.id].x)*SCALE + "," + (shapes[this.id].y)*SCALE + ")"})
  d3.selectAll("rect:not(.static)")
    .attr("y",function(d) {return (shapes[this.id].y-shapes[this.id].height/2)*SCALE})
    .attr("x",function(d) {return (shapes[this.id].x-shapes[this.id].width/2)*SCALE})
    .attr("transform",function(d){return "rotate("+(shapes[this.id].angle*180/Math.PI)+","+(shapes[this.id].x)*SCALE + "," + (shapes[this.id].y)*SCALE + ")"})},

step: function() {tnow = tnow+stepRate; world.Step(stepRate,10,10); world.ClearForces()},

update: function () {for (var b = world.GetBodyList(); b; b = b.m_next) {
   if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
	posn = b.GetWorldCenter()
	b.ApplyForce(new b2Vec2(-hooke*(posn.x-springCenter.x),-hooke*(posn.y-springCenter.y)),posn)
   shapes[b.GetUserData()].update(box2d.get.bodySpec(b))}}}},


add = {
random: function(options) {options = options || {};
 if (Math.random() >0){this.circle(options)} else {this.box(options)}},
circle: function(options) {
options.radius = Math.random()*0.5+0.25;
 var shape = new Circle(options);
  shapes[shape.id] = shape;
  box2d.addToWorld(shape);

timeseries.start = tnow;
timeseries.hstry = []
 svg.datum(timeseries).append("circle").attr({"cx":options.x*SCALE,"cy":options.y*SCALE,"r":options.radius*SCALE,"fill":shape.color,"id":""+shape.id,"class":options.isStatic?"static":"dynamic"})
  .attr("transform",function(d){return "rotate("+(shapes[this.id].angle*180/Math.PI)+","+(shapes[this.id].x)*SCALE + "," + (shapes[this.id].y)*SCALE + ")"})
},
box: function(options) {
  options.width = options.width || 0.5 + Math.random()*2;
  options.height = options.height || 0.5 + Math.random()*2;
  var shape = new Box(options);
  shapes[shape.id] = shape;
  box2d.addToWorld(shape);
timeseries.start = tnow;
timeseries.hstry = []
 svg.datum(timeseries).append("rect")
.attr({"x":(options.x-options.width/2)*SCALE,"y":(options.y-options.height/2)*SCALE,"width":options.width*SCALE,"height":options.height*SCALE,"fill":shape.color,"id":""+shape.id,"class":options.isStatic?"static":"dynamic"})
  .attr("transform",function(d){return "rotate("+(shapes[this.id].angle*180/Math.PI)+","+(shapes[this.id].x)*SCALE + "," + (shapes[this.id].y)*SCALE + ")"})
}}


box2d = {
addToWorld: function(shape) {
  var bodyDef = this.create.bodyDef(shape),
  body = world.CreateBody(bodyDef);
  if (shape.radius) {
  fixDef.shape = new b2CircleShape(shape.radius)} 
  else {fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(shape.width/2,shape.height/2)}
  body.CreateFixture(fixDef)},
create: {
  world: function() {world = new b2World(new b2Vec2(0,gravity),true)},
  defaultFixture: function() {
    fixDef = new b2FixtureDef;
    fixDef.density = Math.random();
    fixDef.friction = Math.random();
    fixDef.restitution = Math.random()/3+0.333},
  bodyDef: function(shape) {
    var bodyDef = new b2BodyDef;
    if (shape.isStatic == true) {bodyDef.type = b2Body.b2_staticBody} 
    else {bodyDef.type = b2Body.b2_dynamicBody}
    bodyDef.position.x = shape.x;
    bodyDef.position.y = shape.y;
    bodyDef.userData = shape.id;
    bodyDef.angle = shape.angle;
    return bodyDef}},
get: {
  bodySpec: function(b) {return {
  x: b.GetPosition().x, 
  y: b.GetPosition().y, 
  angle: b.GetAngle(), 
  center: {x: b.GetWorldCenter().x, y: b.GetWorldCenter().y}}}}},

Shape = function(v) { 
  this.id = "s"+Math.round(Math.random() * 1000000);
  this.x = v.x || Math.random()*Math.round(w);
  this.y = v.y || 0;
  this.angle = 0;
  this.color = v.color || helpers.randomColor();
  this.center = { x: null, y: null };
  this.isStatic = v.isStatic || false;
  this.update = function(options) {
  this.angle = options.angle;
  this.center = options.center;
  this.x = options.x;
  this.y = options.y}},

Box = function(options) {
  Shape.call(this, options); 
  this.width = options.width || Math.random()*2+0.5;
  this.height = options.height || Math.random()*2+0.5;  
  this.angle = options.angle || 0;
  this.drawCanvas = function() {
    ctx.save();
    ctx.translate(this.x*SCALE,this.y*SCALE);
    ctx.rotate(this.angle);
    ctx.translate(-(this.x)*SCALE,-(this.y)*SCALE);
    ctx.fillStyle = this.color;
    ctx.fillRect(
      (this.x-(this.width/2))*SCALE,
      (this.y-(this.height/2))*SCALE,
      this.width*SCALE,
      this.height*SCALE);
      ctx.restore()}},
			
Circle = function(options) {
  Shape.call(this, options);
  this.radius = options.radius || 1;
  this.angle = options.angle || 0;
  this.drawCanvas = function() {
    ctx.save();
    ctx.translate(this.x*SCALE, this.y*SCALE);
    ctx.rotate(this.angle);
    ctx.translate(-(this.x)*SCALE, -(this.y)*SCALE);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x*SCALE, this.y*SCALE, this.radius*SCALE, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
   ctx.restore()}};
    
  Circle.prototype = Shape;
  Box.prototype = Shape;
