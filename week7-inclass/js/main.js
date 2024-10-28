let params = {
  numOfPoints: 0,
  numOfParticles: 0
};
let NUM_OF_POINTS = 10000;
const WORLD_SIZE = 1000;
const WORLD_HALF_SIZE = 500;
let pointCloud;
let particles = [];

function setupThree() {
  pointCloud = getPoints();
  scene.add(pointCloud);

  gui.add(params, "numOfPoints").listen();
  gui.add(params, "numOfParticles").listen();

}

function updateThree() {
  // pointCloud.rotation.x += 0.01;
  // pointCloud.rotation.y += 0.01;
  // pointCloud.rotation.z += 0.01;



  for (let i = 0; i < 10; i++) {
    let x = cos(frame * 0.01) * WORLD_HALF_SIZE;
    let y = sin(frame * 0.01) * WORLD_HALF_SIZE;
    let tParticle = new Particle()
      .setPosition(x, y, 0)
      .setVelocity(random(-0.5, 0.5), random(-0.5, 0.5), random(-0.5, 0.5))
    particles.push(tParticle);
  }

  let posArray = pointCloud.geometry.attributes.position.array;
  let colorArray = pointCloud.geometry.attributes.color.array;



  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    p.move();
    p.age();

    let ptIndex = i * 3;
    posArray[ptIndex] = p.pos.x;
    posArray[ptIndex + 1] = p.pos.y;
    posArray[ptIndex + 2] = p.pos.z;


    colorArray[ptIndex] = p.r * p.lifespan;
    colorArray[ptIndex + 1] = p.g * p.lifespan;
    colorArray[ptIndex + 2] = p.b * p.lifespan;
    if (p.isDone) {
      particles.splice(i, 1);
      i--;
    }

  }
  while (particles.length > NUM_OF_POINTS) {
    particles.splice(0, 1);
  }

  pointCloud.geometry.attributes.position.needsUpdate = true;
  pointCloud.geometry.attributes.color.needsUpdate = true;
  pointCloud.geometry.setDrawRange(0, particles.length);


  params.numOfPoints = pointCloud.geometry.attributes.position.count;
  params.numOfParticles = particles.length;
}

function getPoints() {




  // const vertices = [];

  // for (let i = 0; i < 50000 * 3; i += 3) {

  //   // SPHERE-LIKE 2
  //   let vector = new p5.Vector.random3D();
  //   vector.mult(random(500));

  //   vertices[i + 0] = vector.x;
  //   vertices[i + 1] =  vector.y;
  //   vertices[i + 2] =  vector.z;

  // let tParticle = new Particle()
  //   .setPosition(vector.x, vector.y, vector.z)
  //   .setVelocity(random(-5, 5), random(-5, 5), random(-5, 5))
  // particles.push(tParticle);


  // SPHERE-LIKE
  // let vector = new p5.Vector.random3D();
  // vector.mult(500);

  // vertices[i + 0] = vector.x;
  // vertices[i + 1] =  vector.y;
  // vertices[i + 2] =  vector.z;


  // RING-LIKE
  // vertices[i + 0] = cos(i) * 500;
  // vertices[i + 1] = sin(i) * 500;
  // vertices[i + 2] = random(-100, 100);

  // BOX-LIKE
  //   vertices[i+0] = random(-500, 500);
  //   vertices[i+1] = random(-500, 500);
  //   vertices[i+2] = random(-500, 500);
  // }

  // for (let i = 0; i < 50000; i+= 1) {
  //   let x = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
  //   let y = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
  //   let z = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
  //   vertices.push(x, y, z);
  // }

  const texture = new THREE.TextureLoader().load('assets/particle_texture.jpg');

  const vertices = new Float32Array(NUM_OF_POINTS * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  const colors = new Float32Array(NUM_OF_POINTS * 3);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  const material = new THREE.PointsMaterial({
    // color: 0xffffff,
    vertexColors: true,
    size: 10,
    map: texture,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.Points(geometry, material);
  return mesh;
}

// CLASS

class Particle {
  constructor() {
    this.pos = createVector();
    this.vel = createVector();
    this.acc = createVector();

    this.scl = createVector(1, 1, 1);
    this.mass = 1;
    //this.setMass(); // feel free to use this method; it arbitrarily defines the mass based on the scale.

    this.lifespan = 1.0;
    this.lifeReduction = random(0.001, 0.005);
    this.isDone = false;


    this.r = 0.7;
    this.g = 0.5;
    this.b = 0;

  }
  setPosition(x, y, z) {
    this.pos = createVector(x, y, z);
    return this;
  }
  setVelocity(x, y, z) {
    this.vel = createVector(x, y, z);
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
      this.mass = 1 + this.scl.x * this.scl.y * this.scl.z * 0.000001; // arbitrary
    }
    return this;
  }
  move() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  adjustVelocity(amount) {
    this.vel.mult(1 + amount);
  }
  applyForce(f) {
    let force = f.copy();
    if (this.mass > 0) {
      force.div(this.mass);
    }
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
  attractedTo(x, y, z) {
    let target = new p5.Vector(x, y, z);
    let force = p5.Vector.sub(target, this.pos);
    if (force.mag() < 100) {
      force.mult(-0.005);
    } else {
      force.mult(0.0001);
    }
    this.applyForce(force);
  }
  flow() {
    let xFreq = this.pos.x * 0.05 + frame * 0.005;
    let yFreq = this.pos.y * 0.05 + frame * 0.005;
    let zFreq = this.pos.z * 0.05 + frame * 0.005;
    let noiseValue = map(noise(xFreq, yFreq, zFreq), 0.0, 1.0, -1.0, 1.0);
    let force = new p5.Vector(
      cos(frame * 0.005),
      sin(frame * 0.005),
      sin(frame * 0.002)
    );
    force.normalize();
    force.mult(noiseValue * 0.01);
    this.applyForce(force);
  }
}
