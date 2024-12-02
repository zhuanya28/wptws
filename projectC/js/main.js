
let terrainColor = "#0A3200";
let trunkColor = "#8B4513";
let treeColor = "#0A3200"
let treeColor2 = "#185018";

let cloudParticles = [];


let flyControls;

let NUM_OF_POINTS = 30;
let pointCloud;
let particles = [];
let particlePool = [];

let terrainVertices = [];
let terrain;
let trees = [];

const WORLD_SIZE = 3000;
const WORLD_HALF_SIZE = 1500;
let treeCount = WORLD_SIZE / 20;

let terrainWidthSegments = 200;
let terrainHeightSegments = 200;
let sunLight, moonLight;
let sunLightTarget, moonLightTarget;
let hue = (frame * 0.01) % 1;

// for controls movements
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();


let moveSpeed = 400.0; // Default move speed


const cloudParams = {
  layerCount: 10,
  cloudCountPerLayer: 10,
  layerHeight: WORLD_SIZE / 1000 + 100,
  minRadius: WORLD_HALF_SIZE / 100,
  maxRadius: WORLD_HALF_SIZE / 50,
};

function setupThree() {
  const renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  scene.background = new THREE.Color(0x372772);
  scene.fog = new THREE.Fog(0x372772, 2, WORLD_SIZE);

  setupLights();
  terrain = createTerrain();
  scene.add(terrain);
  createTrees();


  controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  document.body.addEventListener('click', function () {
    controls.lock();
  });

  controls.addEventListener('lock', function () {
    // Handle locked state
  });

  controls.addEventListener('unlock', function () {
    // Handle unlocked state
  });

  pointCloud = getPoints();
  scene.add(pointCloud);

  const clouds = createCloudLayers();
  scene.add(clouds);

  setupGUI();

  createTrees();
  const everything = new THREE.Group();
  everything.add(terrain, pointCloud);  // Add specific objects
  scene.add(everything);
}

function updateThree() {
  updateLightPositions();
  updateParticles();
  updateControls();

  cloudParticles.forEach(cloud => {
    cloud.lookAt(camera.position);
  });



  hue = (frame * 0.0005) % 1;
}


// SUN & MOON
function setupLights() {
  sunLight = createSpotLight(0xE6AF2E, 1200);
  moonLight = createSpotLight(0xB1C6FF, 400);
  sunLightTarget = createLightTarget(0xE6AF2E);
  moonLightTarget = createLightTarget(0x0E34A0);
  sunLight.target = sunLightTarget;
  moonLight.target = moonLightTarget;
  scene.add(sunLight, moonLight, sunLightTarget, moonLightTarget);
}


// SPOTLIGHT FOR SUN & MUN
function createSpotLight(color, intensity) {
  const light = new THREE.SpotLight(color, intensity, WORLD_SIZE * 1.5, Math.PI / 2, 0, 0.7);
  light.position.set(WORLD_HALF_SIZE, 0, WORLD_HALF_SIZE);
  light.castShadow = true;
  light.shadow.mapSize.width = WORLD_SIZE;
  light.shadow.mapSize.height = WORLD_SIZE;
  return light;
}

// SET SPOTLIGHT TARGET 
function createLightTarget(color) {
  const target = getBox();
  target.position.set(0, 0, 0);
  target.scale.set(0, 0, 0);
  target.material = new THREE.MeshStandardMaterial({ color: color });
  return target;
}

// UPDATING SUN & MOON POSITIONS

function updateLightPositions() {
  updateLightPosition(sunLight, sunLightTarget, 0);
  updateLightPosition(moonLight, moonLightTarget, Math.PI);
}

// UPDATING LIGHT POSITION (INDIVIDUAL FUNCTION)
function updateLightPosition(light, target, offset) {
  light.position.y = Math.sin(frame * 0.0009 + offset) * WORLD_HALF_SIZE;
  if (light.position.y < 0) {
    target.position.y = -WORLD_SIZE;
  }
  target.position.x = light.position.x;
  target.position.z = light.position.z;
  light.position.x = Math.cos(frame * 0.0009 + offset) * (WORLD_SIZE + 50);
  light.position.z = 0;
}

//GUI
function setupGUI() {
  gui.add({ moveSpeed: moveSpeed }, 'moveSpeed', 100, 1000).step(10).onChange((value) => {
    moveSpeed = value;
  });
}


// PARTICLE CLOUD UPDATE
function updateParticles() {
  if (frame % 5 === 0) {
    for (let i = 0; i < 2; i++) {
      let x = Math.sin(frame * 0.001) * WORLD_HALF_SIZE;
      let z = Math.cos(frame * 0.001) * WORLD_HALF_SIZE;

      // let y = getTerrainHeightAt(x, z) * 0.3;
      let y = getTerrainHeightAt(x, z);
      let tParticle = getParticle()
        .setPosition(x, y, z)
        .setVelocity(random(-0.1, 0.1), random(-0.5, 0.5), random(-0.1, 0.1));
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

    if (frame % 3 === 0) {
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


// CREATE TERRAIN
function createTerrain() {
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, terrainWidthSegments, terrainHeightSegments);

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('assets/ground-texture-8.png');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  const material = new THREE.MeshStandardMaterial({
    // map: texture,
    wireframe: false,
    side: THREE.DoubleSide,
    color: terrainColor
  });
  const terrain = new THREE.Mesh(geometry, material);

  terrain.castShadow = true;
  terrain.receiveShadow = true;
  let vertices = terrain.geometry.attributes.position.array;
  terrainVertices = [];
  for (let i = 0; i < vertices.length; i += 3) {
    let x = vertices[i + 0];
    let y = vertices[i + 1];
    let z = vertices[i + 2];

    let xOffset = (x + WORLD_HALF_SIZE) * 0.005;
    let yOffset = (y + WORLD_HALF_SIZE) * 0.005;
    
    // Calculate distance from one edge (e.g., right edge)
    let distanceFromEdge = (x + WORLD_HALF_SIZE) / WORLD_SIZE;
    
    // Vary amplitude based on distance from edge
    let baseAmp = 10;
    let maxAmp = 50;
    let amp = baseAmp + (maxAmp - baseAmp) * Math.pow(distanceFromEdge, 2);
    
    let noiseValue = (noise(xOffset * 0.5, yOffset * 0.5) * amp) **2;

    vertices[i + 2] = noiseValue;

    terrainVertices.push({ x: x, y: noiseValue, z: y });
  }
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.rotation.x = Math.PI / 2;

  return terrain;
}



// CREATING TREES
function createTrees() {
  trees.forEach(tree => scene.remove(tree));
  trees = [];
  for (let i = 0; i < treeCount; i++) {
    let tree;
    const treeType = Math.random();
    if (treeType < 0.33) {
      tree = createPineTree();
    } else if (treeType < 0.66) {
      tree = createNormalTree();
    } else {
      tree =  createTexturedTree();
    }


    const randomVertex = terrainVertices[Math.floor(Math.random() * terrainVertices.length)];

    const x = randomVertex.x;
    const z = randomVertex.z;


    const y = -randomVertex.y;

    tree.position.set(x, y, z);

    tree.position.y += 3;

    let scaleFactor;
    if (tree.type === 'textured') {
      scaleFactor = Math.random() * 2 + 1; // Adjust scale for the imported model
    } else {
      scaleFactor = Math.random() * 20 + 0.5;
    }
    tree.scale.set(scaleFactor, scaleFactor, scaleFactor);


    tree.receiveShadow = true;
    tree.castShadow = true;

    scene.add(tree);
    trees.push(tree);
  }
}




// DRAWING TREE
function createPineTree() {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.5, 10, 8),
    new THREE.MeshStandardMaterial({ color: trunkColor })
  );

  const leaves = new THREE.Group();
  const levels = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < levels; i++) {
    if (Math.random() < 0.5) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(3 - i * 0.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: treeColor })
      );
      cone.position.y = i * 2 + 5;
      leaves.add(cone);
    }
    else {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(3 - i * 0.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: treeColor2 })
      );
      cone.position.y = i * 2 + 5;
      leaves.add(cone);
    }
  }

  const tree = new THREE.Group();
  tree.add(trunk, leaves);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  tree.receiveShadow = true;

  tree.type = 'pine';

  return tree;
}

// CREATE NORMAL TREE
function createNormalTree() {
  const trunkRadius = 1 + Math.random() * 1.5;
  const trunkHeight = 8 + Math.random() * 4;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8),
    new THREE.MeshStandardMaterial({ color: trunkColor })
  );

  const leavesRadius = 3 + Math.random() * 1;
  const leavesHeight = 6 + Math.random() * 2;
  let leaves;
  if (Math.random() < 0.5) {
    leaves = new THREE.Mesh(
      new THREE.ConeGeometry(leavesRadius, leavesHeight, 8),
      new THREE.MeshStandardMaterial({ color: treeColor })
    );
  }
  else {
    leaves = new THREE.Mesh(
      new THREE.ConeGeometry(leavesRadius, leavesHeight, 8),
      new THREE.MeshStandardMaterial({ color: treeColor2 })
    );
  }

  leaves.position.y = trunkHeight / 2 + 2;
  const tree = new THREE.Group();
  tree.add(trunk, leaves);

  trunk.castShadow = true;
  trunk.receiveShadow = true;
  leaves.castShadow = true;
  leaves.receiveShadow = true;

  tree.type = 'normal';

  return tree;
}

//TEXTURE FOR TREE
function createTexturedTree() {
  const tree = new THREE.Group();
  tree.type = 'textured';

  const loader = new GLTFLoader();
  loader.load(
    'assets/pine_tree_low-poly.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
      tree.add(model);

      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
    },
    (progress) => {
      console.log(`Loading tree model: ${(progress.loaded / progress.total * 100)}%`);
    },
    (error) => {
      console.error('Error loading tree model:', error);
    }
  );

  return tree;
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
  const color = new THREE.Color();
  color.setHSL(hue, 1, 0.5);

  for (let i = 0; i < NUM_OF_POINTS; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
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

function createCloudLayers() {
  const cloudTexture = new THREE.TextureLoader().load('assets/creature.png'); // Load your cloud texture
  const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });

  const cloudGroup = new THREE.Group();

  for (let i = 0; i < cloudParams.layerCount; i++) {
    const layer = new THREE.Group();

    for (let j = 0; j < cloudParams.cloudCountPerLayer; j++) {
      const cloudGeometry = new THREE.PlaneGeometry(400, 400);
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

      const randomVertex = terrainVertices[Math.floor(Math.random() * terrainVertices.length)];


      const x = randomVertex.x + (Math.random() - 0.5) * WORLD_SIZE * 0.2; // Random offset in X
      const z = randomVertex.z + (Math.random() - 0.5) * WORLD_SIZE * 0.2; // Random offset in Z
      const y = randomVertex.y - 400;

      cloud.position.set(x, y, z);

      cloud.rotation.z = Math.random() * Math.PI * 2;

      const scale = 2 + Math.random() * 1;
      cloud.scale.set(scale, scale, scale);

      layer.add(cloud);
      cloudParticles.push(cloud);
    }

    layer.position.y = i * (cloudParams.layerHeight + Math.random() * 20);
    cloudGroup.add(layer);
  }

  return cloudGroup;
}
class Particle {
  constructor(emitsLight) {
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
      this.light = new THREE.PointLight(0xff00aa, 10, 500);
      this.light.color.setHSL(hue, 1, 0.5);
      this.light.intensity = 2000;
      this.light.castShadow = true;
      scene.add(this.light);
    }
  }

  reset() {
    this.pos = createVector();
    this.vel = createVector();
    this.acc = createVector();
    this.lifespan = 1.0;
    this.isDone = false;
    return this;
  }

  updateLight() {
    if (this.emitsLight) {

      this.light.position.set(this.pos.x, this.pos.y, this.pos.z);
      this.light.shadow.mapSize.width = WORLD_HALF_SIZE;
      this.light.shadow.mapSize.height = WORLD_HALF_SIZE;
      this.light.shadow.camera.near = 0.5;
      this.light.shadow.camera.far = 100;

      this.light.color.setHSL(hue, 1, 0.5);
      scene.add(this.light);
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
    // if (this.pos.y < 50) {
    //   this.pos.y = 60;
    //   this.vel.y *= -0.5;
    // }
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
    let xFreq = this.pos.x * 0.005 + frame * 0.001;
    let yFreq = this.pos.y * 0.005 + frame * 0.001;
    let zFreq = this.pos.z * 0.005 + frame * 0.001;
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


// CALCULATING TERRAIN
function getTerrainHeightAt(x, z) {
  const size = Math.sqrt(terrainVertices.length) - 1;
  const cellSize = WORLD_SIZE / size;

  const xIndex = Math.floor((x + WORLD_SIZE / 2) / cellSize);
  const zIndex = Math.floor((z + WORLD_SIZE / 2) / cellSize);

  const clampedXIndex = Math.max(0, Math.min(xIndex, size));
  const clampedZIndex = Math.max(0, Math.min(zIndex, size));

  const index = clampedZIndex * (size + 1) + clampedXIndex;

  return terrainVertices[index].y;

}



// NAVIGATION
function updateControls() {
  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 100.0 * delta; // Add gravity

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  // Get the current camera position
  const cameraPosition = controls.getObject().position;

  // Calculate the terrain height at the camera's x and z position
  const terrainHeight = getTerrainHeightAt(cameraPosition.x, cameraPosition.z);

  // Set a minimum height above the terrain
  const minHeightAboveTerrain = 10;

  // Update the camera's y position
  cameraPosition.y = Math.max(terrainHeight + minHeightAboveTerrain, cameraPosition.y + velocity.y * delta);

  // Check if the camera is on or below the terrain
  if (cameraPosition.y <= terrainHeight + minHeightAboveTerrain) {
    velocity.y = 0;
    cameraPosition.y = terrainHeight + minHeightAboveTerrain;
    canJump = true;
  }

  prevTime = time;
}

function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      break;
    case 'Space':
      if (canJump === true) velocity.y += 350;
      canJump = false;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);