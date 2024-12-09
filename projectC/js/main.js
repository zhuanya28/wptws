
let terrainColor = "#0A3200";
let trunkColor = "#8B4513";
let treeColor = "#0A3200"
let treeColor2 = "#185018";


let flyControls;

let terrain;

let rayToBottom;


const WORLD_SIZE = 4000;
const WORLD_HALF_SIZE = 2000;
let treeCount = WORLD_SIZE / 30;
let grassCount = 50;

let terrainWidthSegments = 200;
let terrainHeightSegments = 200;
let sunLight, moonLight;
let sunLightTarget, moonLightTarget;
let hue = (frame * 0.01) % 1;

let church;
// for controls movements
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();


let moveSpeed = 1000.0; // Default move speed



let numOfClouds = WORLD_SIZE / 100;
let cloudGroup;

let particleGroups = [];

let audioContext;

const listener = new THREE.AudioListener();

let speedOfSunAndMoon = 0.005;

const raycaster = new THREE.Raycaster();
const directionRay = new THREE.Vector3(0, -1, 0);


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

  createChurch();
  setupGUI();

  // createGrass();
  createTrees();
  createParticleGroups(15);

  //music 
  document.body.addEventListener('click', initAudio, { once: true });
  camera.add(listener);
}

function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function updateThree() {

  updateLightPositions();
  updateControls();
  if (cloudGroup) {
    cloudGroup.children.forEach(cloud => {
      cloud.lookAt(camera.position);
    });
  }

  const distanceToChurch = camera.position.distanceTo(church.position);
  const maxDistance = 500;
  const volume = Math.max(0, 1 - distanceToChurch / maxDistance);

  church.children.forEach(child => {
    if (child instanceof THREE.PositionalAudio) {
      child.setVolume(volume);
      if (volume > 0 && !child.isPlaying && audioContext.state === 'running') {
        child.play();
      } else if (volume === 0 && child.isPlaying) {
        child.pause();
      }
    }
  });
  hue = (frame * 0.0005) % 1;
  particleGroups.forEach(group => group.update(frame, camera));

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
  const light = new THREE.SpotLight(color, intensity, WORLD_SIZE * 1.5, Math.PI / 3, 0.2, 1);
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

  const sunPosition = Math.sin(frame * speedOfSunAndMoon);
  const transitionFactor = (sunPosition + 1) / 2;

  const dayBgColor = new THREE.Color(0x87CEEB);
  const dayFogColor = new THREE.Color(0xADD8E6);

  // Night colors
  const nightBgColor = new THREE.Color(0x120A2A);
  const nightFogColor = new THREE.Color(0x1A0F3D);

  // Interpolate colors
  const currentBgColor = new THREE.Color();
  const currentFogColor = new THREE.Color();
  currentBgColor.lerpColors(nightBgColor, dayBgColor, transitionFactor);
  currentFogColor.lerpColors(nightFogColor, dayFogColor, transitionFactor);

  // Update background color
  scene.background.copy(currentBgColor);

  // Update fog color and density
  scene.fog.color.copy(currentFogColor);
  scene.fog.near = 2 + transitionFactor * 8;
  scene.fog.far = WORLD_SIZE / 3 + transitionFactor * (WORLD_SIZE * 2 / 3);

  // Adjust light intensities
  sunLight.intensity = 2400 * transitionFactor;
  moonLight.intensity = 1200 * (1 - transitionFactor);
}

function isDaytime() {
  return sunLight.position.y > 0;
}

// UPDATING LIGHT POSITION (INDIVIDUAL FUNCTION)
function updateLightPosition(light, target, offset) {
  light.position.y = Math.sin(frame * speedOfSunAndMoon + offset) * WORLD_HALF_SIZE;
  if (light.position.y < 0) {
    target.position.y = -WORLD_SIZE;
  }
  target.position.x = light.position.x;
  target.position.z = light.position.z;
  light.position.x = Math.cos(frame * speedOfSunAndMoon + offset) * (WORLD_SIZE + 50);
  light.position.z = 0;
}

//GUI
function setupGUI() {
  gui.add({ moveSpeed: moveSpeed }, 'moveSpeed', 100, 1500).step(10).onChange((value) => {
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

    let size = 20 + Math.random() * 20;

    cloud.position.set(x, y + size / 2, z);
    cloud.scale.set(size, size, size);

    cloudGroup.add(cloud);

  }

  scene.add(cloudGroup);
  return cloudGroup;
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
    color: terrainColor,

    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide
  });
  const terrain = new THREE.Mesh(geometry, material);

  terrain.castShadow = true;
  terrain.receiveShadow = true;

  let posArray = geometry.attributes.position.array;
  for (let i = 0; i < posArray.length; i += 3) {

    let x = posArray[i + 0];
    let y = posArray[i + 1];

    let xOffset = (x + WORLD_HALF_SIZE) * 0.0012;
    let yOffset = (y + WORLD_HALF_SIZE) * 0.0012;

    let noiseValue = noise(xOffset, yOffset) * 1000 * -1;


    posArray[i + 0] = x;
    posArray[i + 1] = noiseValue;
    posArray[i + 2] = y;
  }
  terrain.geometry.attributes.position.needsUpdate = true;
  return terrain;
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

function createChurch() {
  const loader = new GLTFLoader();
  church = new THREE.Group();

  let x = random(-WORLD_HALF_SIZE + 100, WORLD_HALF_SIZE - 100);
  let z = random(-WORLD_HALF_SIZE + 100, WORLD_HALF_SIZE - 100);
  let y = getTerrainHeightAt(x, z);

  loader.load(
    'assets/low_poly_church.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.2, 0.2, 0.2);
      church.add(model);

      model.traverse((node) => {
        if (node.isMesh) {
          node.geometry.translate(0, 0.5, 0);
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      const listener = new THREE.AudioListener();
      camera.add(listener);

      const sound = new THREE.PositionalAudio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load('assets/church_bells.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setRefDistance(500);
        sound.setLoop(true);
        sound.setVolume(0);
        church.add(sound);
      });

      const warmLight = new THREE.PointLight(0xFFAA33, 1, 1000);
      warmLight.position.set(x, 100, z);
      church.add(warmLight);
    },
    (progress) => {
      console.log(`Loading tree model: ${(progress.loaded / progress.total * 100)}%`);
    },
    (error) => {
      console.error('Error loading tree model:', error);
    }
  );


  church.position.set(x, y - 30, z);

  let scaleFactor;

  scaleFactor = 1;

  church.scale.set(scaleFactor, scaleFactor, scaleFactor);

  church.receiveShadow = true;
  church.castShadow = true;
  scene.add(church);
}




function getTerrainHeightAt(x, z) {
  console.log(x, WORLD_HALF_SIZE * 10, z);
  // const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3(x, WORLD_HALF_SIZE * 100, z);
  // const direction = new THREE.Vector3(0, -1, 0);
  raycaster.set(origin, directionRay);

  const intersects = raycaster.intersectObject(terrain);

  if (intersects.length > 0) {
    return intersects[0].point.y;
  } else {
    return null;
  }
}


// PARTICLES 
function createParticleGroups(numberOfGroups) {
  const texture = new THREE.TextureLoader().load('assets/sprite.jpg');
  for (let i = 0; i < numberOfGroups; i++) {
    const group = new ParticleGroup(texture, 0.5, 5 + Math.random() * 5);
    particleGroups.push(group);
  }
}

class ParticleGroup {
  constructor(texture, size, speed) {
    this.size = size;
    this.speed = speed;

    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particle = new THREE.Mesh(geometry, material);
    this.particle.scale.set(this.size, this.size, this.size);

    this.light = new THREE.PointLight(0xffffff, 1, 200);
    this.particle.add(this.light);

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * this.speed,
      0,
      (Math.random() - 0.5) * this.speed
    );

    this.resetParticle();

    this.sound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/magic_sound.mp3', (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setRefDistance(50);
      this.sound.setLoop(true);
      this.sound.setVolume(0);
    });
    this.particle.add(this.sound);

    scene.add(this.particle);
  }

  resetParticle() {
    const x = Math.random() * WORLD_SIZE - WORLD_HALF_SIZE;
    const z = Math.random() * WORLD_SIZE - WORLD_HALF_SIZE;
    const terrainHeight = getTerrainHeightAt(x, z);
    this.particle.position.set(x, terrainHeight + 30, z);
  }

  update(frame, camera) {
    const pos = this.particle.position;
    pos.x += this.velocity.x;
    pos.z += this.velocity.z;

    const terrainHeight = getTerrainHeightAt(pos.x, pos.z);
    const targetHeight = terrainHeight + 30;
    pos.y += (targetHeight - pos.y) * 0.1;

    const worldBoundary = WORLD_HALF_SIZE * 0.95;
    if (Math.abs(pos.x) > worldBoundary || Math.abs(pos.z) > worldBoundary) {
      if (Math.abs(pos.x) > worldBoundary) this.velocity.x *= -1;
      if (Math.abs(pos.z) > worldBoundary) this.velocity.z *= -1;
    }

    const baseIntensity = 5000;
    const intensityVariation = 1000;
    const intensity = baseIntensity + intensityVariation * Math.sin(frame * 0.5);
    this.light.intensity = intensity;

    const hue = (frame * 0.001) % 1;
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    this.light.color = color;
    this.particle.material.color = color;


    const distance = this.particle.position.distanceTo(camera.position);
    const maxDistance = 500;
    const volume = Math.max(0, 1 - distance / maxDistance);
    this.sound.setVolume(volume);

    if (volume > 0 && !this.sound.isPlaying) {
      this.sound.play();
    } else if (volume === 0 && this.sound.isPlaying) {
      this.sound.pause();
    }
  }
}

// NAVIGATION
function updateControls() {
  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 100.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * delta;

  const cameraPosition = controls.object.position;
  const terrainHeight = getTerrainHeightAt(cameraPosition.x, cameraPosition.z);

  const churchPosition = church.position;
  const distanceToChurch = cameraPosition.distanceTo(churchPosition);
  const churchRadius = 200;


  const buffer = 20;
  const isWithinBounds =
    Math.abs(cameraPosition.x) < WORLD_HALF_SIZE - buffer &&
    Math.abs(cameraPosition.z) < WORLD_HALF_SIZE - buffer && distanceToChurch > churchRadius

  if (isWithinBounds) {
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  } else {
    controls.object.position.x = 0;
    controls.object.position.z = 0;
  }


  if (terrainHeight !== null) {
    const minHeightAboveTerrain = 100;
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