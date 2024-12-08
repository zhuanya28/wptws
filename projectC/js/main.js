/*
terrran
- noise?
- trees'y to terrain?




*/



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

let terrain;

let rayToBottom;


const WORLD_SIZE = 5000;
const WORLD_HALF_SIZE = 2500;
let treeCount = WORLD_SIZE / 50;
let grassCount = 50;

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


const raycaster = new THREE.Raycaster();
const startPoint = new THREE.Vector3();
const directionRay = new THREE.Vector3(0, -1, 0);


let numOfClouds = WORLD_SIZE / 50;
let cloudGroup;



function setupThree() {
  const renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  scene.background = new THREE.Color(0x372772);
  scene.fog = new THREE.Fog(0x372772, 2, WORLD_SIZE);

  setupLights();
  terrain = createTerrain();
  scene.add(terrain);

  controls = new PointerLockControls(camera, document.body);
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

  cloudGroup = createClouds();

  setupGUI();

  // createGrass();
  createTrees();
  const everything = new THREE.Group();
  everything.add(terrain, pointCloud);  // Add specific objects
  scene.add(everything);
}

function updateThree() {
  updateLightPositions();
  // updateParticles();
  updateControls();

  if (cloudGroup) {
    cloudGroup.children.forEach(cloud => {
      cloud.lookAt(camera.position);
    });
  }

  hue = (frame * 0.0005) % 1;
}


// SUN & MOON
function setupLights() {
  sunLight = createSpotLight(0xE6AF2E, 1200);
  moonLight = createSpotLight(0xB1C6FF, 600);
  sunLightTarget = createLightTarget(0xE6AF2E);
  moonLightTarget = createLightTarget(0xB1C6FF);
  sunLight.target = sunLightTarget;
  moonLight.target = moonLightTarget;
  scene.add(sunLight, moonLight, sunLightTarget, moonLightTarget);
}


// SPOTLIGHT FOR SUN & MOON
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

function createClouds() {
  const cloudTexture = new THREE.TextureLoader().load('assets/creature.png');
  const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });

  const cloudGroup = new THREE.Group();

  for (let i = 0; i < numOfClouds; i++) {

    const cloudGeometry = new THREE.PlaneGeometry(100, 100);
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);


    let x = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    let z = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    let y = getTerrainHeightAt(x, z);

    let size = 50 + Math.random() * 1;

    cloud.position.set(x, y + size / 2, z);
    cloud.scale.set(size, size, size);

    cloudGroup.add(cloud);

  }

  scene.add(cloudGroup);
  return cloudGroup;
}


// PARTICLE CLOUD UPDATE



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

  let posArray = geometry.attributes.position.array;
  for (let i = 0; i < posArray.length; i += 3) {

    let x = posArray[i + 0];
    let y = posArray[i + 1];
    let z = posArray[i + 2];

    let xOffset = (x + WORLD_HALF_SIZE) * 0.0012;
    let yOffset = (y + WORLD_HALF_SIZE) * 0.0012;

    let distanceFromCenter = abs(x);
    let amp = map(distanceFromCenter, 0, WORLD_HALF_SIZE, 5, 1);
    let inc = map(distanceFromCenter, 0, WORLD_HALF_SIZE, 4, 1);

    let noiseValue = noise(xOffset, yOffset) * 1000 * -1;


    posArray[i + 0] = x;
    posArray[i + 1] = noiseValue;
    posArray[i + 2] = y;
  }
  terrain.geometry.attributes.position.needsUpdate = true;
  return terrain;
}


// grass
function createGrass() {
  for (let i = 0; i < grassCount; i++) {
    let grass = new THREE.Group();

    const loader = new GLTFLoader();
    loader.load(
      'assets/grass.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(40, 40, 40);
        grass.add(model);

        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
      },
      (progress) => {
        console.log(`Loading grass model: ${(progress.loaded / progress.total * 100)}%`);
      },
      (error) => {
        console.error('Error loading grass model:', error);
      }
    );

    //grass code
    let x = Math.random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    let z = Math.random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    let y = 0; //getTerrainHeightAt(x, z);

    grass.position.set(x, y, z);
    grass.scale.set(10, 10, 10);

    grass.receiveShadow = true;
    grass.castShadow = true;

    scene.add(grass);
    console.log("added grass!");
  }
}




// CREATING TREES
function createTrees() {
  for (let i = 0; i < treeCount; i++) {
    const treeType = Math.random();
    let tree = new THREE.Group();
    const loader = new GLTFLoader();

    if (treeType < 0.5) {
      tree.type = 'pine2';
      loader.load(
        'assets/pine_tree-2.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.5, 0.5, 0.5);
          tree.add(model);

          model.traverse((node) => {
            if (node.isMesh) {
              node.geometry.translate(0, 0.5, 0);
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
    }
    else if (treeType >= 0.5) {
      tree.type = 'pine1'
      loader.load(
        'assets/pine_tree_low-poly.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.5, 0.5, 0.5);
          tree.add(model);

          model.traverse((node) => {
            if (node.isMesh) {
              node.geometry.translate(0, 0.5, 0);
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
    }


    let x = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    let z = random(-WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    let y = getTerrainHeightAt(x, z);
    tree.position.set(x, y - 10, z);

    let scaleFactor;
    if (tree.type === 'pine1') {
      scaleFactor = Math.random() * 1 + 1;
    } else {
      scaleFactor = Math.random() * 10 + 100;
    }

    tree.scale.set(scaleFactor, scaleFactor, scaleFactor);


    tree.receiveShadow = true;
    tree.castShadow = true;

    scene.add(tree);
  }
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



function getTerrainHeightAt(x, z) {
  console.log(x, WORLD_HALF_SIZE * 10, z);
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3(x, WORLD_HALF_SIZE * 100, z);
  const direction = new THREE.Vector3(0, -1, 0);
  raycaster.set(origin, direction);

  const intersects = raycaster.intersectObject(terrain);

  if (intersects.length > 0) {
    return intersects[0].point.y;
  } else {
    return null;
  }
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

  //const cameraPosition = controls.getObject().position;
  const cameraPosition = controls.object.position;
  const terrainHeight = getTerrainHeightAt(cameraPosition.x, cameraPosition.z);

  if (terrainHeight !== null) {
    const minHeightAboveTerrain = 100;  // it was 20
    cameraPosition.y = Math.max(terrainHeight + minHeightAboveTerrain, cameraPosition.y + velocity.y * delta);

    if (cameraPosition.y <= terrainHeight + minHeightAboveTerrain) {
      velocity.y = 0;
      cameraPosition.y = terrainHeight + minHeightAboveTerrain;
      canJump = true;
    }
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