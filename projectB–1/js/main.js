let params = {
  treeCount: 50
};

let terrainColor = "#0A3200";
 let  trunkColor=  "#8B4513";
 let treeColor = "#0A3200"

let NUM_OF_POINTS = 50;
let pointCloud;
let particles = [];
let particlePool = [];
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
  gui.add(params, "treeCount", 1, 100).step(1).onChange(updateTrees);
}

function updateThree() {
  updateLightPositions();
  updateParticles();
}

function updateParticles() {
  if (frame % 5 === 0) { // Create particles every 5 frames
    for (let i = 0; i < 2; i++) { // Create fewer particles
      let x = cos(frame * 0.002) * WORLD_HALF_SIZE;
      let y = sin(frame * 0.001) * 10 + 30;
      let tParticle = getParticle()
        .setPosition(x, y, 0)
        .setVelocity(random(-0.1, 0.1), random(-0.1, 0.1), random(-0.1, 0.1));
      particles.push(tParticle);
    }
  }

  let posArray = pointCloud.geometry.attributes.position.array;
  let colorArray = pointCloud.geometry.attributes.color.array;

  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    p.move();
    p.flow();
    p.age();
    let ptIndex = i * 3;
    posArray[ptIndex] = p.pos.x;
    posArray[ptIndex + 1] = p.pos.y;
    posArray[ptIndex + 2] = p.pos.z;
    colorArray[ptIndex] = p.r * p.lifespan;
    colorArray[ptIndex + 1] = p.g * p.lifespan;
    colorArray[ptIndex + 2] = p.b * p.lifespan;

    if (frame % 3 === 0) { // Update light every 3 frames
      p.updateLight();
    }

    if (p.isDone) {
      returnParticle(p);
      particles.splice(i, 1);
      i--;
    }
  }

  while (particles.length > NUM_OF_POINTS) {
    returnParticle(particles.shift());
  }

  pointCloud.geometry.attributes.position.needsUpdate = true;
  pointCloud.geometry.attributes.color.needsUpdate = true;
  pointCloud.geometry.setDrawRange(0, particles.length);
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
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 100, 100);
  const material = new THREE.MeshStandardMaterial({
    color: terrainColor,
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
    tree.position.y += 4;
    scene.add(tree);
    trees.push(tree);
  }
}

function createPineTree() {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.5, 10, 8),
    new THREE.MeshStandardMaterial({ color: trunkColor })
  );

  const leaves = new THREE.Group();
  const levels = 4 + Math.floor(Math.random() * 3); 
  for (let i = 0; i < levels; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(3 - i * 0.5, 4, 8),
      new THREE.MeshStandardMaterial({ color: treeColor })
    );
    cone.position.y = i * 2 + 5;
    leaves.add(cone);
  }

  const tree = new THREE.Group();
  tree.add(trunk, leaves);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  leaves.castShadow = true;
  leaves.receiveShadow = true;

  return tree;
}

function createTree() {
  if (Math.random() < 0.5) {
    return createPineTree();
  }
  else {

    return createNormalTree();
  }
}

function createNormalTree(){
  const trunkRadius = 1 + Math.random() * 1.5;
  const trunkHeight = 8 + Math.random() * 4;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8),
    new THREE.MeshStandardMaterial({ color: trunkColor })
  );

  const leavesRadius = 3 + Math.random() * 2;
  const leavesHeight = 6 + Math.random() * 4;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(leavesRadius, leavesHeight, 8),
    new THREE.MeshStandardMaterial({ color: treeColor })
  );
  leaves.position.y = trunkHeight / 2 + 2;
  const tree = new THREE.Group();
  tree.add(trunk, leaves);

  trunk.castShadow = true;
  trunk.receiveShadow = true;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
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

function getPoints() {
  const texture = new THREE.TextureLoader().load('assets/sprite.jpg');
  const vertices = new Float32Array(NUM_OF_POINTS * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const colors = new Float32Array(NUM_OF_POINTS * 3);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1,
    map: texture,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Points(geometry, material);
}

function getParticle() {
  if (particlePool.length > 0) {
    return particlePool.pop().reset();
  }
  if (Math.random() < 0.5) {
    return new Particle(true);
  } else {
    return new Particle(false);
  }


}

function returnParticle(particle) {
  particle.remove();
  particlePool.push(particle);
}

class Particle {
  constructor(emitsLight = false) {
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
    this.emitsLight = emitsLight;
    if (this.emitsLight) {
      this.light = new THREE.PointLight(0xffaa00, 5, 500);
      this.light.intensity = 0.5;
      this.light.castShadow = true;
      this.light.receiveShadow = true;
      scene.add(this.light);
    }
  }

  reset() {
    this.pos = createVector();
    this.vel = createVector();
    this.acc = createVector();
    this.lifespan = 1.0;
    this.isDone = false;
    if (this.emitsLight) {
      this.light.intensity = 0.5;
    }
    return this;
  }

  updateLight() {
    if (this.emitsLight) {
      this.light.position.set(this.pos.x, this.pos.y, this.pos.z);
      this.light.intensity = this.lifespan * 2;
      this.light.shadow.mapSize.width = 512;
      this.light.shadow.mapSize.height = 512;
      this.light.shadow.camera.near = 0.5;
      this.light.shadow.camera.far = 500;

      const hue = (frame * 0.01) % 1;
      this.light.color.setHSL(hue, 1, 0.5);
    }
  }

  remove() {
    if (this.emitsLight) {
      scene.remove(this.light);
    }
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
    this.mass = mass || 1 + this.scl.x * this.scl.y * this.scl.z * 0.000001;
    return this;
  }

  move() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    if (this.pos.y < 50) {
      this.pos.y = 60;
      this.vel.y *= -0.5;
    }
  }

  age() {
    this.lifespan -= this.lifeReduction;
    if (this.lifespan <= 0) {
      this.lifespan = 0;
      this.isDone = true;
    }
  }

  applyForce(f) {
    let force = f.copy();
    if (this.mass > 0) {
      force.div(this.mass);
    }
    this.acc.add(force);
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