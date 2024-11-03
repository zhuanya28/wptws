let params = {
  terrainColor: "#4CAF50",
  treeColor: "#228B22",
  numberOfTrees: 50
};

let terrain;
let trees = [];

let trunkMaterialColor = "#4A3F35";
let terrainColor = "#0A3200";
let treeColor = "#0A3200";
let treeColorLight = "#228B22";

class Tree {
  constructor(x, y, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const leavesGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: trunkMaterialColor });
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: params.treeColor });

    this.trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    this.leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);

    this.trunk.position.set(x, y, z);
    this.leaves.position.set(x, y + 1, z);

    this.group = new THREE.Group();
    this.group.add(this.trunk);
    this.group.add(this.leaves);
  }

  setColor(color) {
    this.leaves.material.color.set(color);
  }
}

function setupThree() {
  // Create terrain
  terrain = createTerrain();
  scene.add(terrain);

  // Add trees
  addTrees();

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Setup GUI
  // gui.addColor(params, "terrainColor").onChange(updateTerrainColor);
  // gui.addColor(params, "treeColor").onChange(updateTreesColor);
  // gui.add(params, "numberOfTrees", 0, 200, 1).onChange(updateNumberOfTrees);
}

function updateThree() {
  // Any continuous updates can go here
}

function createTerrain() {
  const geometry = getPlaneGeometry(100, 100, 128, 128);
  const material = new THREE.MeshPhongMaterial({
    color: terrainColor,
    wireframe: false,
    side: THREE.DoubleSide
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;

  // Create hills
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = Math.sin(vertices[i] / 10) * Math.cos(vertices[i + 1] / 10) * 5;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return terrain;
}

function getPlaneGeometry(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  return geometry;
}

function addTrees() {
  for (let i = 0; i < params.numberOfTrees; i++) {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    const y = getTerrainHeight(x, z);

    const tree = new Tree(x, y, z);
    trees.push(tree);
    scene.add(tree.group);
  }
}

function getTerrainHeight(x, z) {
  // Simplified height calculation based on the terrain function
  return Math.sin(x / 10) * Math.cos(z / 10) * 5;
}

function updateTerrainColor() {
  terrain.material.color.set(params.terrainColor);
}

function updateTreesColor() {
  trees.forEach(tree => tree.setColor(params.treeColor));
}

function updateNumberOfTrees() {
  // Remove existing trees
  trees.forEach(tree => scene.remove(tree.group));
  trees = [];

  // Add new trees
  addTrees();
}