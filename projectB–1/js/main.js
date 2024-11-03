let params = {
  terrainColor: "#0A3200",
  treeColor: "#0A3200",
  trunkColor: "#8B4513",
  terrainScale: 100,
  treeCount: 50,
  treeMinSize: 10,
  treeMaxSize: 20,

};

let terrain;
let trees = [];

const WORLD_SIZE = 200;
const WORLD_HALF_SIZE = 100;



let sunLight, moonLight;
let sunLightTarget, moonLightTarget;
let plane;

function setupThree() {

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;


  scene.background = new THREE.Color(0xFFFFFF);
  scene.fog = new THREE.Fog(0xFFFFFF, 1, 4000);

  //sun light
  sunLight = new THREE.SpotLight(
    0xE6AF2E,
    2000,
    WORLD_SIZE * 1.5,
    Math.PI / 2,
    0,
    0.7
  );
  sunLight.position.set(WORLD_HALF_SIZE, 0, WORLD_HALF_SIZE);
  sunLight.castShadow = true;
  scene.add(sunLight);

  let sun = getLightSphere(0xE6AF2E, 1);
  sun.scale.set(10, 10, 10);
  sunLight.add(sun);

  // sunlight target
  sunLightTarget = getBox();
  sunLightTarget.position.set(0, 0, 0);
  sunLightTarget.scale.set(0, 0, 0);
  sunLightTarget.material = new THREE.MeshStandardMaterial({
    color: 0xE6AF2E,
  });

  sunLight.target = sunLightTarget;
  scene.add(sunLightTarget);

  //moon light
  moonLight = new THREE.SpotLight(
    0xB1C6FF,
    1500,
    WORLD_SIZE * 1.5,
    Math.PI / 2,
    0,
    0.7
  );

  moonLight.position.set(WORLD_HALF_SIZE, 0, WORLD_HALF_SIZE);
  moonLight.castShadow = true;
  scene.add(moonLight);

  let moon = getLightSphere(0x0E34A0, 1);
  moon.scale.set(5, 5, 5);
  moonLight.add(moon);

  //moonlight target
  moonLightTarget = getBox();
  moonLightTarget.position.set(0, 0, 0);
  moonLightTarget.scale.set(0, 0, 0);
  moonLightTarget.material = new THREE.MeshStandardMaterial({
    color: 0x0E34A0,
  });

  moonLight.target = moonLightTarget;
  scene.add(sunLightTarget);


  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  // terrain
  terrain = createTerrain();
  scene.add(terrain);

  //trees
  createTrees();


  // gui
  gui.addColor(params, "terrainColor");
  gui.addColor(params, "treeColor");
  gui.addColor(params, "trunkColor");
  gui.add(params, "terrainScale", 50, 200).onChange(updateTerrainScale);
  gui.add(params, "treeCount", 1, 100).step(1).onChange(updateTrees);
  gui.add(params, "treeMinSize", 5, 50).onChange(updateTrees);
  gui.add(params, "treeMaxSize", 10, 100).onChange(updateTrees);

}


function updateThree() {
  terrain.material.color.set(params.terrainColor);
  trees.forEach(tree => {
    tree.children[0].material.color.set(params.trunkColor);
    tree.children[1].material.color.set(params.treeColor);
  });

  sunLight.position.y = sin(frame * 0.005) * WORLD_HALF_SIZE;
  if (sunLight.position.y < 0) {
    sunLightTarget.position.y = -WORLD_SIZE;
    currentColor = "#2F3061"
  }

  sunLightTarget.position.x = sunLight.position.x;
  sunLightTarget.position.z = sunLight.position.z;
  sunLight.position.x = cos(frame * 0.005) * (WORLD_SIZE + 50);
  sunLight.position.z = 0;

  moonLight.position.y = sin(frame * 0.005 + Math.PI) * WORLD_HALF_SIZE;
  if (moonLight.position.y < 0) {
    moonLightTarget.position.y = -WORLD_SIZE;
    currentColor = "#A25716"
  }

  moonLightTarget.position.x = moonLight.position.x;
  moonLightTarget.position.z = moonLight.position.z;
  moonLight.position.x = cos(frame * 0.005 + Math.PI) * (WORLD_SIZE + 50);
  moonLight.position.z = 0;
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

  // hills
  const vertices = terrain.geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / params.terrainScale;
    const y = vertices[i + 1] / params.terrainScale;
    vertices[i + 2] = noise(x, y) * 20;
  }

  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();

  terrain.rotation.x = -Math.PI / 2;
  return terrain;
}

function createTrees() {
  // remove existing trees
  trees.forEach(tree => scene.remove(tree));
  trees = [];

  // new trees
  for (let i = 0; i < params.treeCount; i++) {
    const tree = createTree();
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    const y = Math.random() * 10 + 5;
    tree.position.set(x, y, z);
    scene.add(tree);
    trees.push(tree);
  }
}

function createTree() {
  const treeSize = Math.random() * (params.treeMaxSize - params.treeMinSize) + params.treeMinSize;
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, treeSize, 8);
  const trunkMaterial = new THREE.MeshPhongMaterial({ color: params.trunkColor });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const leavesGeometry = new THREE.ConeGeometry(treeSize / 3, treeSize * 2 / 3, 8);
  const leavesMaterial = new THREE.MeshPhongMaterial({ color: params.treeColor });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = treeSize / 2;
  leaves.castShadow = true;
  leaves.receiveShadow = true;

  const tree = new THREE.Group();
  tree.add(trunk);
  tree.add(leaves);
  tree.castShadow = true;
  tree.receiveShadow = true;
  return tree;
}


function updateTerrainScale() {
  const vertices = terrain.geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / params.terrainScale;
    const y = vertices[i + 1] / params.terrainScale;
    vertices[i + 2] = noise.perlin2(x, y) * 100;
  }
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  updateTrees();
}

function updateTrees() {
  createTrees();
}



function getPlane() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6B0504,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}


function getLightSphere(color, size) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
  return new THREE.Mesh(geometry, material);
}

function getBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
