const WORLD_SIZE = 2000;
const WORLD_HALF_SIZE = 2000;
const FLOOR_POSITION = -200;

let params = {
  color: "FFF",
};

let cubes = [];
let plane;

function setupThree() {
  plane = getPlane();
  scene.add(plane);
  plane.scale.set(WORLD_SIZE, WORLD_SIZE, 1);
  plane.rotation.x = -Math.PI/2;
  plane.position.y = FLOOR_POSITION;
  

  let tCube = new Cube()
    .setPosition(0, FLOOR_POSITION, 0)
    .setScale(50,200, 50)
    .setTranslation(0, 0.5, 0);
  cubes.push(tCube);
}

function updateThree() {
  for (let cube of cubes) {
    cube.update();
  }
}

function getBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshNormalMaterial({
    // color: 0xffffff,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function getPlane() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
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
    this.mass = 1; //this.scl.x * this.scl.y * this.scl.z;
 
 
    this.rot = createVector();
    this.rotVel = createVector();
    this.rotAcc = createVector();
 
 
    this.lifespan = 1.0;
    this.lifeReduction = random(0.005, 0.010);
    this.isDone = false;
 
 
    this.mesh = getBox();
    scene.add(this.mesh); // don't forget to add to scene
  }



 setTranslation(x, y, z) {
  this.mesh.geometry.translate(x, y, z);
  return this;
}

  setPosition(x, y, z) {
    this.pos = createVector(x, y, z);
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
    const minScale = 0.01;
    if (w < minScale) w = minScale;
    if (h < minScale) h = minScale;
    if (d < minScale) d = minScale;
    this.scl = createVector(w, h, d);
    this.mass = this.scl.x * this.scl.y * this.scl.z;
    this.mass = 1;
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
    force.div(this.mass);
    this.acc.add(force);
  }
  reappear() {
    if (this.pos.z > WORLD_SIZE / 2) {
      this.pos.z = -WORLD_SIZE / 2;
    }
  }
  disappear() {
    if (this.pos.z > WORLD_SIZE / 2) {
      this.isDone = true;
    }
  }
  age() {
    this.lifespan -= this.lifeReduction;
    if (this.lifespan <= 0) {
      this.lifespan = 0;
      this.isDone = true;
    }
  }
  update() {
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.mesh.rotation.set(this.rot.x, this.rot.y, this.rot.z);
 
 
    let newScale = p5.Vector.mult(this.scl, this.lifespan);
    this.mesh.scale.set(newScale.x, newScale.y, newScale.z);
  }
 }
 