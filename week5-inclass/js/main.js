const WORLD_SIZE = 2000;
const WORLD_HALF_SIZE = 1000;
const FLOOR_POSITION = -200;

let params = {
  color: "#FFF",
};

let cubes = [];
let plane;
let pointlight;
let spotLight, spotLightHelper, spotLightTarget;
let lightTarget, directionalLightHelper, directionalLight;

function setupThree() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

  //FOG
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 1, 2000);

  //LIGHT

  const ambilight = new THREE.AmbientLight("#333"); // soft white light
  // scene.add(ambilight);

  //HEMISPHERRE LIGHT

  const hemispherelight = new THREE.HemisphereLight(0xff0000, 0x0000ff, 0.05);
  // scene.add( hemispherelight );

  //POINT LIGHT
  //set the decay value (very low)
  pointlight = new THREE.PointLight(0xff0000, 10, 1000, 0.01);
  pointlight.position.set(0, 200, 0);
  pointlight.castShadow = true;
  // scene.add(pointlight);

  //SPOTLIGHT
  //color, instensity, distance, angle, penumbra, decay
  spotLight = new THREE.SpotLight(0xffffff, 100, 1000, Math.PI / 4, 1.0, 0.01);
  spotLight.position.set(0, 300, 0);
  spotLight.castShadow = true;
  // scene.add(spotLight);

  //ADD SPHERE
  let sphere = getSphere();
  sphere.scale.set(20, 20, 20);
  // sphere.position.copy(pointlight.position);
  spotLight.add(sphere);

  //SPOTLIGHT TARGET
  spotLightTarget = getBox();
  spotLightTarget.position.set(0, 300, 0);
  spotLightTarget.scale.set(30, 30, 30);
  spotLightTarget.material = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
  });

  spotLight.target = spotLightTarget;
  // scene.add(spotLightTarget);

  //SPOTLIGHT HELPER
  spotLightHelper = new THREE.SpotLightHelper(spotLight);
  // scene.add(spotLightHelper);

  //DIRECTIONAL LIGHT
  let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.castShadow = true;
  directionalLight.position.set(0, 300, 0);
  scene.add(directionalLight);


  lightTarget = getBox();
  lightTarget.position.set(0, 100, 0);
  lightTarget.scale.set(30, 30, 30);
  lightTarget.material = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
  });

  directionalLight.target = lightTarget;


  directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight, 5 );
  scene.add( directionalLightHelper );





  plane = getPlane();
  scene.add(plane);
  plane.scale.set(WORLD_SIZE, WORLD_SIZE, 1);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = FLOOR_POSITION;

  let distance = 100;
  for (let z = -WORLD_HALF_SIZE; z <= WORLD_HALF_SIZE; z += distance) {
    for (let x = -WORLD_HALF_SIZE; x <= WORLD_HALF_SIZE; x += distance) {
      let tCube = new Cube()
        .setPosition(x, FLOOR_POSITION, z)
        .setTranslation(0, 0.5, 0)
        .setScale(50, random(3, 18) ** 2, 50);
      cubes.push(tCube);
    }
  }
}

function updateThree() {
  // spotLightTarget.position.x = sin(frame * 0.01) * 300;
  // spotLightTarget.position.z = cos(frame * 0.01) * 300;
  // spotLightHelper.update();


  lightTarget.position.x = sin(frame * 0.01) * 300;
  lightTarget.position.z = cos(frame * 0.01) * 300;
  directionalLightHelper.update();

  for (let cube of cubes) {
    cube.update();
  }
}

function getSphere() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

function getBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// getPlane
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

class Cube {
  constructor() {
    this.pos = createVector();
    this.vel = createVector();
    this.acc = createVector();
    this.scl = createVector(1, 1, 1);
    this.mass = 1;
    //this.setMass(); // feel free to use this method; it arbitrarily defines the mass based on the scale.
    this.rot = createVector();
    this.rotVel = createVector();
    this.rotAcc = createVector();
    this.mesh = getBox();
    scene.add(this.mesh); // don't forget to add to scene
  }
  setPosition(x, y, z) {
    this.pos = createVector(x, y, z);
    return this;
  }
  setTranslation(x, y, z) {
    this.mesh.geometry.translate(x, y, z);
    return this;
  }
  setVelocity(x, y, z) {
    this.vel = createVector(x, y, z);
    return this;
  }
  setRotationAngle(x, y, z) {
    this.rot = createVector(x, y, z);
    return this;
  }
  setRotationVelocity(x, y, z) {
    this.rotVel = createVector(x, y, z);
    return this;
  }
  setScale(w, h = w, d = w) {
    // or
    //h = (h === undefined) ? w : h;
    //d = (d === undefined) ? w : d;
    const minScale = 0.01;
    if (w < minScale) w = minScale;
    if (h < minScale) h = minScale;
    if (d < minScale) d = minScale;
    this.scl = createVector(w, h, d);
    return this;
  }
  setMass(mass) {
    if (mass) {
      this.mass = mass;
    } else {
      this.mass = 1 + this.scl.x * this.scl.y * this.scl.z * 0.000001; // arbitrary
    }
    return this;
  }
  move() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  rotate() {
    this.rotVel.add(this.rotAcc);
    this.rot.add(this.rotVel);
    this.rotAcc.mult(0);
  }
  applyForce(f) {
    let force = f.copy();
    if (this.mass > 0) {
      force.div(this.mass);
    }
    this.acc.add(force);
  }
  update() {
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.mesh.rotation.set(this.rot.x, this.rot.y, this.rot.z);
    this.mesh.scale.set(this.scl.x, this.scl.y, this.scl.z);
  }
}
