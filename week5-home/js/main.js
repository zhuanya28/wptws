const WORLD_SIZE = 2000;
const WORLD_HALF_SIZE = 1000;
const FLOOR_POSITION = -300;

let params = {
  numPlanets: 10,
  minPlanetRadius: 40,
  maxPlanetRadius: 50,
  minRings: 5,
  maxRings: 20,
  minRingRadius: 100,
  maxRingRadius: 200,
  rotationSpeed: 0.01,
};

let planets = [];
let plane;
let spotLight;

let spotLightHelper, spotLightTarget;

function setupThree() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.background = new THREE.Color(0x000000);
  // scene.fog = new THREE.Fog(0xDAB785, 1, 2000);

  //spotlight
  spotLight = new THREE.SpotLight(0xffffff, 100, WORLD_SIZE, Math.PI / 7, 0, 0.4);
  spotLight.position.set(0, -FLOOR_POSITION*5, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);

  let sphere = getLightSphere();
  sphere.scale.set(10, 10, 10);
  spotLight.add(sphere);

  //SPOTLIGHT HELPER

  //SPOTLIGHT TARGET
  spotLightTarget = getBox();
  spotLightTarget.position.set(0, -FLOOR_POSITION, 0);
  spotLightTarget.scale.set(0, 0, 0);
  spotLightTarget.material = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
  });

  spotLight.target = spotLightTarget;
  scene.add(spotLightTarget);

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
  gui.add(params, "minRingRadius", 100, 300, 1).onChange(updateRingRadii);
  gui.add(params, "maxRingRadius", 400, 700, 1).onChange(updateRingRadii);
  gui.add(params, "rotationSpeed", 0, 0.1);
}

function updateThree() {
  planets.forEach((planet) => planet.update());

  spotLightTarget.position.x = sin(frame * 0.01) * 300;
  spotLightTarget.position.z = cos(frame * 0.01) * 300;
}

function getRing(innerRadius, outerRadius, thisColor) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const material = new THREE.MeshStandardMaterial({
    color: thisColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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

function getBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

class Ring {
  constructor(radius, color) {
    this.radius = radius;
    this.color = color;
    this.mesh = getRing(radius - 0.5, radius + 0.5, this.color);
    this.mesh.rotation.x = Math.random() * Math.PI * 2;
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

function getLightSphere() {
  const geometry = new THREE.SphereGeometry(10, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  return new THREE.Mesh(geometry, material);
}
function getSphere(thisColor) {
  const radius = THREE.MathUtils.randFloat(
    params.minPlanetRadius,
    params.maxPlanetRadius
  );
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: thisColor });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

class Planet {
  constructor() {
    this.group = new THREE.Group();
    this.color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.addSphere();
    this.createRings();
    this.xoff = random(10);
    this.yoff = random(10);
    this.group.position.set(
      (Math.random() * WORLD_SIZE - WORLD_HALF_SIZE)/2,
      Math.random() * WORLD_HALF_SIZE/3,
      Math.random() * WORLD_SIZE - WORLD_HALF_SIZE
    );
    scene.add(this.group);
  }

  addSphere() {
    this.sphere = getSphere(this.color);
    this.group.add(this.sphere);
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

  update() {
    this.rings.forEach((ring) => ring.update());
    this.group.position.x += sin(this.xoff);
    this.group.position.y += cos(this.yoff);
    this.xoff +=0.01;
    this.yoff += 0.01;
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
