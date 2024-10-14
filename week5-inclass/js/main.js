const WORLD_SIZE = 2000;
const WORLD_HALF_SIZE = 1000;
const FLOOR_POSITION = -200;


let params = {
 color: "#FFF"
};


let cubes = [];
let plane;


function setupThree() {


 plane = getPlane();
 scene.add(plane);
 plane.scale.set(WORLD_SIZE, WORLD_SIZE, 1);
 plane.rotation.x = -Math.PI / 2;
 plane.position.y = FLOOR_POSITION;


 let distance = 100;
 for (let z = -WORLD_HALF_SIZE; z <= WORLD_HALF_SIZE; z += distance) {
   for (let x = -WORLD_HALF_SIZE; x <= WORLD_HALF_SIZE; x += distance) {
     let tCube = new Cube()
       .setPosition(x, FLOOR_POSITION, z)
       .setTranslation(0, 0.5, 0)
       .setScale(50, random(3, 18) ** 2, 50);
     cubes.push(tCube);
   }
 }
}


function updateThree() {
 for (let cube of cubes) {
   cube.update();
 }
}


function getBox() {
 const geometry = new THREE.BoxGeometry(1, 1, 1);
 const material = new THREE.MeshBasicMaterial();
 const mesh = new THREE.Mesh(geometry, material);
 return mesh;
}


// getPlane
function getPlane() {
 const geometry = new THREE.PlaneGeometry(1, 1);
 const material = new THREE.MeshBasicMaterial({
   color: 0xFFFFFF,
   side: THREE.DoubleSide
 });
 const mesh = new THREE.Mesh(geometry, material);
 return mesh;
}


class Cube {
 constructor() {
   this.pos = createVector();
   this.vel = createVector();
   this.acc = createVector();
   this.scl = createVector(1, 1, 1);
   this.mass = 1;
   //this.setMass(); // feel free to use this method; it arbitrarily defines the mass based on the scale.
   this.rot = createVector();
   this.rotVel = createVector();
   this.rotAcc = createVector();
   this.mesh = getBox();
   scene.add(this.mesh); // don't forget to add to scene
 }
 setPosition(x, y, z) {
   this.pos = createVector(x, y, z);
   return this;
 }
 setTranslation(x, y, z) {
   this.mesh.geometry.translate(x, y, z);
   return this;
 }
 setVelocity(x, y, z) {
   this.vel = createVector(x, y, z);
   return this;
 }
 setRotationAngle(x, y, z) {
   this.rot = createVector(x, y, z);
   return this;
 }
 setRotationVelocity(x, y, z) {
   this.rotVel = createVector(x, y, z);
   return this;
 }
 setScale(w, h = w, d = w) {
   // or
   //h = (h === undefined) ? w : h;
   //d = (d === undefined) ? w : d;
   const minScale = 0.01;
   if (w < minScale) w = minScale;
   if (h < minScale) h = minScale;
   if (d < minScale) d = minScale;
   this.scl = createVector(w, h, d);
   return this;
 }
 setMass(mass) {
   if (mass) {
     this.mass = mass;
   } else {
     this.mass = 1 + (this.scl.x * this.scl.y * this.scl.z) * 0.000001; // arbitrary
   }
   return this;
 }
 move() {
   this.vel.add(this.acc);
   this.pos.add(this.vel);
   this.acc.mult(0);
 }
 rotate() {
   this.rotVel.add(this.rotAcc);
   this.rot.add(this.rotVel);
   this.rotAcc.mult(0);
 }
 applyForce(f) {
   let force = f.copy();
   if (this.mass > 0) {
     force.div(this.mass);
   }
   this.acc.add(force);
 }
 update() {
   this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
   this.mesh.rotation.set(this.rot.x, this.rot.y, this.rot.z);
   this.mesh.scale.set(this.scl.x, this.scl.y, this.scl.z);
 }
}
