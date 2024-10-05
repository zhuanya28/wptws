let light, lightMesh;
let sculpture;
let jumpingSphere;
let cylinders = [];
let bottomCircle;


const numCylinders = 7;
const radius = 250;
const height = 600;
const angleStep = (2 * Math.PI) / numCylinders;

let currentCylinderIndex = 0;
let nextCylinderIndex = 1;
let transitionProgress = 0;
const transitionSpeed = 0.01;

function setupThree() {
  // change the background color
  renderer.setClearColor("#231651");

  // add ambient light
  ambiLight = new THREE.AmbientLight("#D6FFF6");
  scene.add(ambiLight);

  // add point light
  light = getPointLight("#D6FFF6");
  scene.add(light);

  // add a small sphere for the light
  lightMesh = getBasicSphere();
  light.add(lightMesh);
  lightMesh.scale.set(10, 10, 10);

  sculpture = new THREE.Group();

  for (let i = 0; i < numCylinders; i++) {
    const geometry = new THREE.CylinderGeometry(100, 100, height, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x4DCCBD });
    const cylinder = new THREE.Mesh(geometry, material);

    const angle = i * angleStep;
    cylinder.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    sculpture.add(cylinder);
    cylinders.push(cylinder);
  }
  jumpingSphere = createJumpingSphere();
  sculpture.add(jumpingSphere);

  bottomCircle = getCircle();
  sculpture.add(bottomCircle);

  scene.add(sculpture);
}

function updateThree() {
    let angle = frame * 0.01;
    let radDist = 500;
    let x = cos(angle) * radDist;
    let y = 300;
    let z = sin(angle) * radDist;
    light.position.set(x, y, z);

  
    updateCylinders();
    updateSphere();
  
    sculpture.rotation.y = frame * 0.01;
  }

function updateCylinders() {
  cylinders.forEach((cylinder, index) => {
    const phaseShift = (index * Math.PI * 2) / numCylinders;
    cylinder.position.y = Math.sin(frame * 0.05 + phaseShift) * 100;
  });
}


function updateSphere() {
  transitionProgress += transitionSpeed;

  if (transitionProgress >= 1) {
    transitionProgress = 0;
    currentCylinderIndex = nextCylinderIndex;
    nextCylinderIndex = (nextCylinderIndex + 1) % numCylinders;
  }

  // Interpolate between current and next cylinder
  const currentCylinder = cylinders[currentCylinderIndex];
  const nextCylinder = cylinders[nextCylinderIndex];

  //FIRST SPHERE
  let newPosition = new THREE.Vector3(
    THREE.MathUtils.lerp(
      currentCylinder.position.x,
      nextCylinder.position.x,
      transitionProgress
    ),
    THREE.MathUtils.lerp(
      currentCylinder.position.y + (height / 4) * 3,
      nextCylinder.position.y + (height / 4) * 3,
      transitionProgress
    ),
    THREE.MathUtils.lerp(
      currentCylinder.position.z,
      nextCylinder.position.z,
      transitionProgress
    )
  );

  // Calculate direction vector and apply rotation
  let direction = newPosition.clone().sub(jumpingSphere.position).normalize();

  let axis = new THREE.Vector3(0, -1, 0); // Rotate around Y-axis
  let angleToRotate = direction.length() * transitionSpeed; // Adjust rotation speed
  jumpingSphere.rotateOnWorldAxis(axis, angleToRotate);

  jumpingSphere.position.copy(newPosition);
}


function createJumpingSphere() {
  const sphereGeometry = new THREE.SphereGeometry(70, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({ color: "#FF8484" });
  localJumpingSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  return localJumpingSphere;
}

function getBasicSphere() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: "#ffffff",
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function getCircle(){
    const geometry = new THREE.CircleGeometry(500, 100);
  const material = new THREE.MeshBasicMaterial({ color: 0x2374AB });
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position the circle below all cylinders and spheres
  mesh.rotation.x = -Math.PI / 2; 
  mesh.position.y = -height / 2 - 50; 
  
  return mesh;
}

function getPointLight(color) {
  const light = new THREE.PointLight(color, 2, 0, 0.1); // ( color , intensity, distance (0=infinite), decay )
  return light;
}
