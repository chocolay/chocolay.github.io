function Entity(id,x,y,center) {this.id = id; this.x = x; this.y = y; this.angle = 0; this.center = center}
Entity.prototype.update = function(state) {this.x = state.x; this.y = state.y; this.center = state.c; this.angle = state.a;}
Entity.prototype.draw = function(ctx) {
ctx.beginPath();
ctx.arc(this.x*SCALE,this.y*SCALE,4,0,Math.PI*2,true);
ctx.closePath();
ctx.fill();
ctx.fillstyle = this.color;
ctx.beginPath();
ctx.arc(this.center.x*SCALE,this.center.y*SCALE,2,0,Math.PI*2,true);
ctx.closePath();
ctx.fill()}
    
Entity.build = function(def) {
if (def.radius) {return new CircleEntity(def.id,def.x,def.y,null_CENTER,def.radius)} 
else if (def.points) {return new PolygonEntity(def.id,def.x,def.y,null_CENTER,def.points)} 
else {return new RectangleEntity(def.id,def.x,def.y,null_CENTER,def.halfWidth,def.halfHeight)}}
    
function CircleEntity(id,x,y,center,radius) {Entity.call(this,id,x,y,center); this.radius = radius}
CircleEntity.prototype = new Entity();
CircleEntity.prototype.constructor = CircleEntity;
CircleEntity.prototype.draw = function(ctx) {
ctx.fillstyle = this.color;
ctx.beginPath();
ctx.arc(this.x*SCALE,this.y*SCALE,this.radius*SCALE,0,Math.PI*2,true);
ctx.closePath();
ctx.fill();
Entity.prototype.draw.call(this,ctx)}
    
function RectangleEntity(id,x,y,center,halfWidth,halfHeight) {
Entity.call(this,id,x,y,center);
this.halfWidth = halfWidth;
this.halfHeight = halfHeight}
RectangleEntity.prototype = new Entity();
RectangleEntity.prototype.constructor = RectangleEntity;
RectangleEntity.prototype.draw = function(ctx) {
ctx.save();
ctx.translate(this.x*SCALE,this.y*SCALE);
ctx.rotate(this.angle);
ctx.translate(-(this.x)*SCALE,-(this.y)*SCALE);
ctx.fillstyle = this.color;
ctx.fillRect(
(this.x-this.halfWidth)*SCALE,
(this.y-this.halfHeight)*SCALE,
(this.halfWidth*2)*SCALE,
(this.halfHeight*2)*SCALE);
ctx.restore(); 
Entity.prototype.draw.call(this,ctx)}
    
function PolygonEntity(id,x,y,center,points) {Entity.call(this,id,x,y,center); this.points = points}
PolygonEntity.prototype = new Entity();
PolygonEntity.prototype.constructor = PolygonEntity;
PolygonEntity.prototype.draw = function(ctx) {
ctx.save();
ctx.translate(this.x*SCALE,this.y*SCALE);
ctx.rotate(this.angle);
ctx.translate(-(this.x)*SCALE,-(this.y)*SCALE);
ctx.fillstyle = this.color;
ctx.beginPath();
ctx.moveTo((this.x+this.points[0].x)*SCALE,(this.y+this.points[0].y)*SCALE);
for (var i = 1; i < this.points.length; i++) {ctx.lineTo((this.points[i].x+this.x)*SCALE,(this.points[i].y+this.y)*SCALE)}
ctx.lineTo((this.x+this.points[0].x)*SCALE,(this.y+this.points[0].y)*SCALE);
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.restore();
      
Entity.prototype.draw.call(this,ctx)}
function randomEntity(id) {
var x = Math.random()*35;
var y = Math.random()*10;
if (Math.random() > 0.5) {return new CircleEntity(id,x,y,Math.random()+0.1)}
else {return new RectangleEntity(id,x,y,Math.random()+0.1,Math.random()+0.1)}}
    
   
function update(animStart) {
box.update();
bodiesState = box.getState();      
for (var id in bodiesState) {var entity = world[id]
if (entity) entity.update(bodiesState[id])}}

window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback,/* DOMelement */ element){ 
                window.setTimeout(callback,1000/60)}})();
