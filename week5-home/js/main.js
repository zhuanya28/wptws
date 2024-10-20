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
  maxRingRadius: 300,
  baseRotationSpeed: 0.01,
};

let cones = [];

let planets = [];
let plane;
let spotLight;

let sunLight, moonLight;
let sunOrbit, moonOrbit;

let spotLightHelper, spotLightTarget;

function setupThree() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.background = new THREE.Color(0x2660a4);
  // scene.fog = new THREE.Fog(0x2660a4, 1, 4000);

  // const ambilight = new THREE.AmbientLight("#FFFFFF"); // soft white light
  // scene.add(ambilight);

  //SUN
  sunLight = new THREE.SpotLight(
    0xfefffe,
    100,
    WORLD_SIZE,
    Math.PI / 4,
    0,
    0.3
  );
  sunLight.position.set(0, -FLOOR_POSITION*2, 0);
  sunLight.castShadow = true;
  let sunSphere = getLightSphere(0xffff00, 20);
  sunLight.add(sunSphere);

  sunLightTarget = 



  //MOON
  moonLight = new THREE.SpotLight(
    0xaaaaff,
    50,
    WORLD_SIZE,
    Math.PI / 4,
    0,
    0.3
  );
  moonLight.castShadow = true;
  moonOrbit = new THREE.Group();
  moonOrbit.add(moonLight);
  scene.add(moonOrbit);

  let moonSphere = getLightSphere(0xaaaaff, 10);
  moonLight.add(moonSphere);

  //spotlight
  spotLight = new THREE.SpotLight(
    0xfefffe,
    100,
    WORLD_SIZE,
    Math.PI / 4,
    0,
    0.3
  );
  spotLight.position.set(WORLD_HALF_SIZE, 0, WORLD_HALF_SIZE);
  spotLight.castShadow = true;
  scene.add(spotLight);

  let sphere = getLightSphere();
  sphere.scale.set(5, 5, 5);
  spotLight.add(sphere);

  // //SPOTLIGHT HELPER

  // //SPOTLIGHT TARGET
  spotLightTarget = getBox();
  spotLightTarget.position.set(0, -FLOOR_POSITION, 0);
  spotLightTarget.scale.set(0, 0, 0);
  spotLightTarget.material = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
  });

  spotLight.target = spotLightTarget;
  scene.add(spotLightTarget);

  //plane
  plane = getPlane();
  scene.add(plane);
  plane.scale.set(WORLD_SIZE * 2, WORLD_SIZE * 2, 1);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = FLOOR_POSITION;

  //planets fill in
  for (let i = 0; i < params.numPlanets; i++) {
    let planet = new Planet();
    planets.push(planet);
  }

  let distance = 200;
  for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z += distance) {
    for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x += distance) {
      let height = random(1, 20);

      if (Math.random() > 0.5) {
        let tCone = new Cone()
          .setPosition(x, FLOOR_POSITION, z)
          .setScale(distance / 5, height, distance / 5);
        cones.push(tCone);
      }
    }
  }

  // GUI setup
  gui.add(params, "numPlanets", 1, 20, 1).onChange(updatePlanetCount);
  gui.add(params, "minRings", 1, 15, 1).onChange(updateRingCount);
  gui.add(params, "maxRings", 15, 50, 1).onChange(updateRingCount);
  gui.add(params, "minRingRadius", 50, 150, 1).onChange(updateRingRadii);
  gui.add(params, "maxRingRadius", 150, 500, 1).onChange(updateRingRadii);
  gui.add(params, "baseRotationSpeed", 0, 0.05).name("Base Rotation Speed");
  gui.add(sunLight, "intensity", 0, 200).name("Sun Intensity");
  gui.add(moonLight, "intensity", 0, 100).name("Moon Intensity");
}

function updateThree() {
  planets.forEach((planet) => planet.update());

  spotLight.position.y = cos(frame * 0.01) * WORLD_SIZE-WORLD_HALF_SIZE;
  spotLight.position.x = sin(frame * 0.01) * WORLD_SIZE-WORLD_HALF_SIZE;
  spotLight.position.z = cos(frame * 0.01) * WORLD_SIZE- WORLD_HALF_SIZE;
  spotLightTarget.position.x = sin(frame * 0.01) * 500;
  spotLightTarget.position.z = cos(frame * 0.01) * 500;


  // let sunAngle = frame * 0.005;
  // sunOrbit.rotation.y = sunAngle;
  // sunLight.position.set(
  //   Math.cos(sunAngle) * WORLD_HALF_SIZE,
  //   WORLD_HALF_SIZE / 2,
  //   Math.sin(sunAngle) * WORLD_HALF_SIZE
  // );

  // let moonAngle = frame * 0.01 + Math.PI; // Offset by PI to start on opposite side
  // moonOrbit.rotation.y = moonAngle;
  // moonLight.position.set(
  //   Math.cos(moonAngle) * WORLD_HALF_SIZE,
  //   WORLD_HALF_SIZE / 2,
  //   Math.sin(moonAngle) * WORLD_HALF_SIZE
  // );

  // let dayColor = new THREE.Color(0x2660a4);
  // let nightColor = new THREE.Color(0x0a1a2a);
  // let sunHeight = (Math.sin(sunAngle) + 1) / 2; // 0 to 1


  // //all little adjustments
  // scene.background.copy(dayColor).lerp(nightColor, 1 - sunHeight);
  // scene.fog.color.copy(scene.background);

  // sunLight.intensity = 100 * Math.max(0, Math.sin(sunAngle));
  // moonLight.intensity = 30 * Math.max(0, -Math.sin(sunAngle));
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
    color: 0x2660a4,
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

function getLightSphere(color, size) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
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

class Ring {
  constructor(radius, color, ringsWidth) {
    this.radius = radius;
    this.color = color;
    this.ringsWidth = ringsWidth;
    this.mesh = getRing(
      radius - this.ringsWidth,
      radius + this.ringsWidth,
      this.color
    );

    this.mesh.rotation.x = Math.random() * Math.PI * 2;
    this.mesh.rotation.y = Math.random() * Math.PI * 2;
  }

  update() {
    this.mesh.rotation.y += params.baseRotationSpeed;
    this.mesh.rotation.x += params.baseRotationSpeed;
  }

  updateRadius(newRadius) {
    this.radius = newRadius;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.RingGeometry(
      this.radius - this.ringsWidth,
      this.radius + this.ringsWidth,
      64
    );
  }
}

class Planet {
  constructor() {
    this.group = new THREE.Group();
    this.color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.addSphere();
    this.ringsWidth = random(0.5, 5);
    this.createRings();

    this.rotationDirection = Math.random() < 0.5 ? 1 : -1;

    this.xoff = random(10);
    this.yoff = random(10);
    this.group.position.set(
      Math.random() * WORLD_SIZE - WORLD_HALF_SIZE,
      (Math.random() * WORLD_HALF_SIZE) / 3,
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
      const ring = new Ring(radius, this.color, this.ringsWidth);
      ring.rotationSpeed *= this.rotationDirection;
      this.rings.push(ring);
      this.group.add(ring.mesh);
    }
  }

  update() {
    this.rings.forEach((ring) => ring.update());
    this.group.position.x += noise(this.xoff) * sin(this.xoff);
    this.group.position.y += noise(this.yoff) * cos(this.yoff);
    this.xoff += 0.01;
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
        const ring = new Ring(radius, this.color, this.ringsWidth);
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

function getCone() {
  const geometry = new THREE.ConeGeometry(5, 20, 4);

  geometry.translate(0, 10, 0); // translated to align with plane easier
  const material = new THREE.MeshStandardMaterial({ color: 0xf19953 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

class Cone {
  constructor() {
    this.mesh = getCone();
    scene.add(this.mesh);
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
    return this;
  }

  setScale(w, h, d) {
    this.mesh.scale.set(w, h, d);
    return this;
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
