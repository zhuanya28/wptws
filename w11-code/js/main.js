let params = {
  color: "#FFF"
};

let cubes = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


function setupThree() {
  for (let i = 0; i < 100; i++) {
    let tCube = new Cube()
      .setPosition(random(-500, 500), random(-500, 500), random(-500, 500))
      .setVelocity(random(-0.1, 0.1), random(-0.1, 0.1), random(-0.1, 0.1))
      .setRotationVelocity(random(-0.01, 0.01), random(-0.01, 0.01), random(-0.01, 0.01))
      .setScale(random(10, 30), random(10, 30), random(10, 30));
    cubes.push(tCube);
  }
}

function updateThree() {
  for (let c of cubes) {
    // c.intersect(intersections);
    c.move();
    c.rotate();
    c.update();
  }
}



function getBox() {
  let geometry = new THREE.BoxGeometry(1, 1, 1);
  let material = new THREE.MeshBasicMaterial({
    wireframe: true
  });
  let mesh = new THREE.Mesh(geometry, material);
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
    this.isSelected = false;
    this.mesh = getBox();
    scene.add(this.mesh);
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
  intersect(intersections) {
    let isIntersected = false;
    // if you only want to select the first (closest) one.
    if (intersections.length > 0) {
      if (this.mesh === intersections[0].object) {
        isIntersected = true;
      }
    }
    /*
    // if you want to select the whole objects on the ray.
    for (let i of intersections) {
      if (this.mesh  === i.object ) {
        isIntersected = true;
      }
    }
    */
    if (isIntersected) {
      this.mesh.material.wireframe = false;
      this.mesh.material.color.set(0x00ff00);
    } else {
      this.mesh.material.wireframe = true;
      this.mesh.material.color.set(0xffffff);
    }
  }
  update() {
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.mesh.rotation.set(this.rot.x, this.rot.y, this.rot.z);
    this.mesh.scale.set(this.scl.x, this.scl.y, this.scl.z);
  }
}