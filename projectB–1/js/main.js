let params = {
  terrainColor: "#4CAF50",
  treeColor: "#228B22",
  trunkColor: "#8B4513",
  terrainScale: 100,
  treeCount: 50,
  treeMinSize: 10,
  treeMaxSize: 20,
  ambientLightIntensity: 0.5,
  directionalLightIntensity: 0.8
};

let terrain;
let trees = [];

let ambientLight;
let directionalLight;

function setupThree() {
  // Create terrain
  terrain = createTerrain();
  scene.add(terrain);

  // Create trees
  createTrees();

  ambientLight = new THREE.AmbientLight(0xffffff, params.ambientLightIntensity);
  scene.add(ambientLight);

  // Add directional light
  directionalLight = new THREE.DirectionalLight(0xffffff, params.directionalLightIntensity);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);


  // Setup GUI
  gui.addColor(params, "terrainColor");
  gui.addColor(params, "treeColor");
  gui.addColor(params, "trunkColor");
  gui.add(params, "terrainScale", 50, 200).onChange(updateTerrainScale);
  gui.add(params, "treeCount", 1, 100).step(1).onChange(updateTrees);
  gui.add(params, "treeMinSize", 5, 50).onChange(updateTrees);
  gui.add(params, "treeMaxSize", 10, 100).onChange(updateTrees);
  gui.add(params, "ambientLightIntensity", 0, 1).onChange(updateLights);
  gui.add(params, "directionalLightIntensity", 0, 1).onChange(updateLights);
}


function updateThree() {
  terrain.material.color.set(params.terrainColor);
  trees.forEach(tree => {
    tree.children[0].material.color.set(params.trunkColor);
    tree.children[1].material.color.set(params.treeColor);
  });
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  const material = new THREE.MeshPhongMaterial({
    color: params.terrainColor,
    wireframe: false,
    flatShading: true
  });

  const terrain = new THREE.Mesh(geometry, material);

  // Generate terrain using Perlin noise
  const vertices = terrain.geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / params.terrainScale;
    const y = vertices[i + 1] / params.terrainScale;
    vertices[i + 2] = noise(x, y) * 10;
  }

  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();

  terrain.rotation.x = -Math.PI / 2;
  return terrain;
}

function createTrees() {
  // Remove existing trees
  trees.forEach(tree => scene.remove(tree));
  trees = [];

  // Create new trees
  for (let i = 0; i < params.treeCount; i++) {
    const tree = createTree();
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    const y = getTerrainHeight(x, z);
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

  const leavesGeometry = new THREE.ConeGeometry(treeSize / 3, treeSize * 2 / 3, 8);
  const leavesMaterial = new THREE.MeshPhongMaterial({ color: params.treeColor });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = treeSize / 2;

  const tree = new THREE.Group();
  tree.add(trunk);
  tree.add(leaves);
  return tree;
}

function getTerrainHeight(x, z) {
  const raycaster = new THREE.Raycaster();
  raycaster.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
  const intersects = raycaster.intersectObject(terrain);
  return intersects.length > 0 ? intersects[0].point.y : 0;
}

function updateTerrainScale() {
  const vertices = terrain.geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / params.terrainScale;
    const y = vertices[i + 1] / params.terrainScale;
    vertices[i + 2] = noise.perlin2(x, y) * 10;
  }
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  updateTrees();
}

function updateTrees() {
  createTrees();
}

function updateLights() {
  ambientLight.intensity = params.ambientLightIntensity;
  directionalLight.intensity = params.directionalLightIntensity;
}
