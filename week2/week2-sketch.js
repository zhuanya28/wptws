
var num = 3000;
var noiseScale=200, noiseStrength=2;
var particles = [num];
let xoff;
let inc = 0.2;

function setup() {
  

  createCanvas(windowWidth, windowHeight);
xoff = 0;
  noStroke();
  for (let i=0; i<num; i++) {
  
    var loc = createVector(width/2, height/2, 1);
    var angle = 0;
    var dir = createVector(cos(angle), sin(angle));
    var speed = 10;
    particles[i]= new Particle(loc, dir, speed);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function draw() {
      background(4, 31, 30, 40);
  fill(0, 10);
  noStroke();

  for (let i=0; i<particles.length; i++) {
    particles[i].run();
    particles[i].updateSpeed();
  }
  

}

class Particle{
  constructor(loc,dir,speed){
    this.loc = loc;
    this.dir = dir;
    this.speed = speed;
  }
  run() {
    this.move();
    this.checkEdges();
    this.update();
  }
  updateSpeed(){
    this.speed = map(mouseX, 0, width, -5, 5) + random(-3, 3);
    xoff = xoff + inc;

  }
  move(){
    let angle=noise(this.loc.x/noiseScale, this.loc.y/noiseScale, frameCount/noiseScale)*TWO_PI*noiseStrength; //0-2PI
    this.dir.x = cos(angle);
    this.dir.y = sin(angle);
    var vel = this.dir.copy();
    var d =2;  //direction change 
    vel.mult(this.speed*d); //vel = vel * (speed*d)
    this.loc.add(vel); //loc = loc + vel
  }
  checkEdges(){
    //float distance = dist(width/2, height/2, loc.x, loc.y);
    //if (distance>150) {
    if (this.loc.x<0 || this.loc.x>width || this.loc.y<0 || this.loc.y>height) {    
      this.loc.x = width/2;
      this.loc.y = height/2;
    }
  }
  update(){
    fill(247, 219, 169);
    ellipse(this.loc.x, this.loc.y, this.loc.z);
  }
}