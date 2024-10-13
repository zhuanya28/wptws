let params = {
  color: "#FFF",
  rotationSpeed: 0.01,
  numRings: 10,
  minRadius: 10,
  maxRadius: 50,
  centerSphereRadius: 5
};

let rings = [];
let centerSphere;

function setupThree() {
  const sphereGeometry = new THREE.SphereGeometry(params.centerSphereRadius, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  centerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(centerSphere);

  for (let i = 0; i < params.numRings; i++) {
    let radius = THREE.MathUtils.lerp(params.minRadius, params.maxRadius, i / (params.numRings - 1));
    let ring = new Ring(radius);
    rings.push(ring);
  }

  // GUI setup
  gui.addColor(params, "color").onChange(updateRingColors);
  gui.add(params, "rotationSpeed", 0, 0.1);
  gui.add(params, "numRings", 1, 20, 1).onChange(updateRingCount);
  gui.add(params, "minRadius", 5, 30).onChange(updateRingPositions);
  gui.add(params, "maxRadius", 31, 100).onChange(updateRingPositions);
}

function updateThree() {
  rings.forEach(ring => ring.update());
}

function getRing(innerRadius, outerRadius) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const material = new THREE.MeshBasicMaterial({
    color: params.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  });
  return new THREE.Mesh(geometry, material);
}

class Ring {
  constructor(radius) {
    this.radius = radius;
    this.mesh = getRing(radius - 0.5, radius + 0.5);
    this.mesh.rotation.x = Math.PI / 2; // Tilt rings to be horizontal
    scene.add(this.mesh);
  }

  update() {
    this.mesh.rotation.y += params.rotationSpeed;
  }
}

function updateRingColors() {
  rings.forEach(ring => {
    ring.mesh.material.color.setStyle(params.color);
  });
}

function updateRingCount() {
  rings.forEach(ring => scene.remove(ring.mesh));
  rings = [];

  for (let i = 0; i < params.numRings; i++) {
    let radius = THREE.MathUtils.lerp(params.minRadius, params.maxRadius, i / (params.numRings - 1));
    let ring = new Ring(radius);
    rings.push(ring);
  }
}

function updateRingPositions() {
  rings.forEach((ring, i) => {
    let newRadius = THREE.MathUtils.lerp(params.minRadius, params.maxRadius, i / (rings.length - 1));
    ring.radius = newRadius;
    ring.mesh.geometry.dispose();
    ring.mesh.geometry = new THREE.RingGeometry(newRadius - 0.5, newRadius + 0.5, 64);
  });
}