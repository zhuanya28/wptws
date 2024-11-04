let params = {
  terrainColor: "#0A3200",
  treeColor: "#0A3200",
  trunkColor: "#8B4513",
  treeCount: 50,
  treeMinSize: 20,
  treeMaxSize: 50,
};

let NUM_OF_POINTS = 100;
let pointCloud;
let particles = [];


const raycaster = new THREE.Raycaster();
let terrain;
let trees = [];

const WORLD_SIZE = 200;
const WORLD_HALF_SIZE = 100;

let sunLight, moonLight;
let sunLightTarget, moonLightTarget;

function setupThree() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  scene.background = new THREE.Color(0x372772);
  scene.fog = new THREE.Fog(0x372772, 10, WORLD_SIZE);

  setupLights();
  setupTerrain();
  createTrees();

  setupGUI();

  pointCloud = getPoints();
  scene.add(pointCloud);


}

function setupLights() {
  sunLight = createSpotLight(0xE6AF2E, 2000);
  moonLight = createSpotLight(0xB1C6FF, 1500);

  sunLightTarget = createLightTarget(0xE6AF2E);
  moonLightTarget = createLightTarget(0x0E34A0);

  sunLight.target = sunLightTarget;
  moonLight.target = moonLightTarget;

  scene.add(sunLight, moonLight, sunLightTarget, moonLightTarget);
}

function createSpotLight(color, intensity) {
  const light = new THREE.SpotLight(color, intensity, WORLD_SIZE * 1.5, Math.PI / 2, 0, 0.7);
  light.position.set(WORLD_HALF_SIZE, 0, WORLD_HALF_SIZE);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  return light;
}

function createLightTarget(color) {
  const target = getBox();
  target.position.set(0, 0, 0);
  target.scale.set(0, 0, 0);
  target.material = new THREE.MeshStandardMaterial({ color: color });
  return target;
}

function setupTerrain() {
  terrain = createTerrain();
  scene.add(terrain);
}

function setupGUI() {
  gui.addColor(params, "terrainColor");
  gui.addColor(params, "treeColor");
  gui.addColor(params, "trunkColor");
  gui.add(params, "treeCount", 1, 100).step(1).onChange(updateTrees);
  gui.add(params, "treeMinSize", 5, 50).onChange(updateTrees);
  gui.add(params, "treeMaxSize", 10, 100).onChange(updateTrees);
}

function updateThree() {
  updateColors();
  updateLightPositions();

  updateParticles();

}

function updateParticles(){
  for (let i = 0; i < 10; i++) {
    let x = cos(frame * 0.002) * WORLD_HALF_SIZE;
    let y = sin(frame * 0.001) * 10 + 30;
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


  numOfPoints = pointCloud.geometry.attributes.position.count;
  numOfParticles = particles.length;
}


function updateColors() {
  terrain.material.color.set(params.terrainColor);
  trees.forEach(tree => {
    tree.children[0].material.color.set(params.trunkColor);
    tree.children[1].material.color.set(params.treeColor);
  });
}

function updateLightPositions() {
  updateLightPosition(sunLight, sunLightTarget, 0);
  updateLightPosition(moonLight, moonLightTarget, Math.PI);
}

function updateLightPosition(light, target, offset) {
  light.position.y = Math.sin(frame * 0.005 + offset) * WORLD_HALF_SIZE;
  if (light.position.y < 0) {
    target.position.y = -WORLD_SIZE;
  }
  target.position.x = light.position.x;
  target.position.z = light.position.z;
  light.position.x = Math.cos(frame * 0.005 + offset) * (WORLD_SIZE + 50);
  light.position.z = 0;
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 200, 200);
  const material = new THREE.MeshStandardMaterial({
    color: params.terrainColor,
    wireframe: false,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.castShadow = true;
  terrain.receiveShadow = true;

  const vertices = terrain.geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / 50;
    const y = vertices[i + 1] / 50 - 300;
    vertices[i + 2] = noise(x, y) * 100;
  }

  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  terrain.rotation.x = -Math.PI / 2;

  return terrain;
}

function createTrees() {
  trees.forEach(tree => scene.remove(tree));
  trees = [];

  for (let i = 0; i < params.treeCount; i++) {
    const tree = createTree();
    const x = Math.random() * WORLD_SIZE - WORLD_HALF_SIZE;
    const z = Math.random() * WORLD_SIZE - WORLD_HALF_SIZE;

    raycaster.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
    const intersects = raycaster.intersectObject(terrain);

    tree.position.set(x, intersects.length > 0 ? intersects[0].point.y : 0, z);

    scene.add(tree);
    trees.push(tree);
  }
}

function createTree() {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x4A7023 })
  );

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(4, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x3CB371 })
  );
  leaves.position.y = 5;

  const tree = new THREE.Group();
  tree.add(trunk, leaves);
  return tree;
}

function updateTrees() {
  createTrees();
}

function getBox() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}


function getPoints() {const texture = new THREE.TextureLoader().load('assets/sprite.jpg');

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
    vertexColors: true,
    size: 1,
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
