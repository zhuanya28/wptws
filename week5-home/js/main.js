const WORLD_SIZE = 2000;
const WORLD_HALF_SIZE = 1000;
const FLOOR_POSITION = -200;

let params = {
  numPlanets: 5,
  minPlanetRadius: 3,
  maxPlanetRadius: 8,
  minRings: 5,
  maxRings: 20,
  minRingRadius: 10,
  maxRingRadius: 50,
  rotationSpeed: 0.01,
};

let planets = [];
let plane;

function setupThree() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.background = new THREE.Color(0x04395E);
  scene.fog = new THREE.Fog(0xDAB785, 1, 2000);

  //spotlight 

  spotLight = new THREE.SpotLight(0xffffff, 100, 1000, Math.PI / 4, 1.0, 0.01);
  spotLight.position.set(0, 300, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);



  //plane
  plane = getPlane();
  scene.add(plane);
  plane.scale.set(WORLD_SIZE, WORLD_SIZE, 1);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = FLOOR_POSITION;

  //planets fill in
  for (let i = 0; i < params.numPlanets; i++) {
    let planet = new Planet();
    planets.push(planet);
  }

  // GUI setup
  gui.add(params, "numPlanets", 1, 20, 1).onChange(updatePlanetCount);
  gui.add(params, "minRings", 1, 15, 1).onChange(updateRingCount);
  gui.add(params, "maxRings", 15, 50, 1).onChange(updateRingCount);
  gui.add(params, "minRingRadius", 5, 30, 1).onChange(updateRingRadii);
  gui.add(params, "maxRingRadius", 31, 100, 1).onChange(updateRingRadii);
  gui.add(params, "rotationSpeed", 0, 0.1);
}

function updateThree() {
  planets.forEach((planet) => planet.update());
}

function getRing(innerRadius, outerRadius, thisColor) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const material = new THREE.MeshBasicMaterial({
    color: thisColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  return new THREE.Mesh(geometry, material);
}

function getPlane() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

class Ring {
  constructor(radius, color) {
    this.radius = radius;
    this.color = color;
    this.mesh = getRing(radius - 0.5, radius + 0.5, this.color);
    this.mesh.rotation.x = random(Math.PI * 2);
  }

  update() {
    this.mesh.rotation.y += params.rotationSpeed;
  }

  updateRadius(newRadius) {
    this.radius = newRadius;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.RingGeometry(
      this.radius - 0.5,
      this.radius + 0.5,
      64
    );
  }
}

function getSphere(thisColor) {
  const radius = THREE.MathUtils.randFloat(
    params.minPlanetRadius,
    params.maxPlanetRadius
  );
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: thisColor });
  this.mesh = new THREE.Mesh(geometry, material);
  return this.mesh;
}

class Planet {
  constructor() {
    this.group = new THREE.Group();
    this.color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.addSphere();
    this.createRings();
    this.setRandomPosition();
    scene.add(this.group);
  }

  addSphere() {
    this.group.add(getSphere(this.color));
  }

  createRings() {
    this.rings = [];
    const numRings = THREE.MathUtils.randInt(params.minRings, params.maxRings);
    for (let i = 0; i < numRings; i++) {
      const radius = THREE.MathUtils.lerp(
        params.minRingRadius,
        params.maxRingRadius,
        i / (numRings - 1)
      );
      const ring = new Ring(radius, this.color);
      this.rings.push(ring);
      this.group.add(ring.mesh);
    }
  }

  setRandomPosition() {
    const range = 200;
    this.group.position.set(
      THREE.MathUtils.randFloatSpread(range),
      THREE.MathUtils.randFloatSpread(range),
      THREE.MathUtils.randFloatSpread(range)
    );
  }

  update() {
    this.rings.forEach((ring) => ring.update());
  }

  updateSphereSize() {
    const newRadius = THREE.MathUtils.randFloat(
      params.minPlanetRadius,
      params.maxPlanetRadius
    );
    this.sphere.geometry.dispose();
    this.sphere.geometry = new THREE.SphereGeometry(newRadius, 32, 32);
  }

  updateRingCount() {
    const currentRingCount = this.rings.length;
    const targetRingCount = THREE.MathUtils.randInt(
      params.minRings,
      params.maxRings
    );

    if (targetRingCount > currentRingCount) {
      // Add new rings
      for (let i = currentRingCount; i < targetRingCount; i++) {
        const radius = THREE.MathUtils.lerp(
          params.minRingRadius,
          params.maxRingRadius,
          i / (targetRingCount - 1)
        );
        const ring = new Ring(radius, this.color);
        this.rings.push(ring);
        this.group.add(ring.mesh);
      }
    } else if (targetRingCount < currentRingCount) {
      // Remove excess rings
      for (let i = currentRingCount - 1; i >= targetRingCount; i--) {
        const ring = this.rings.pop();
        this.group.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        ring.mesh.material.dispose();
      }
    }
    this.updateRingRadii();
  }

  updateRingRadii() {
    const numRings = this.rings.length;
    this.rings.forEach((ring, i) => {
      const newRadius = THREE.MathUtils.lerp(
        params.minRingRadius,
        params.maxRingRadius,
        i / (numRings - 1)
      );
      ring.updateRadius(newRadius);
    });
  }
}

function updatePlanetCount() {
  while (planets.length > params.numPlanets) {
    const planet = planets.pop();
    scene.remove(planet.group);
  }
  while (planets.length < params.numPlanets) {
    const planet = new Planet();
    planets.push(planet);
  }
}

function updatePlanetSizes() {
  planets.forEach((planet) => planet.updateSphereSize());
}

function updateRingCount() {
  planets.forEach((planet) => planet.updateRingCount());
}

function updateRingRadii() {
  planets.forEach((planet) => planet.updateRingRadii());
}
