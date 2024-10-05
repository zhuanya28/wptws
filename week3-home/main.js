let light, lightMesh;
let sculpture;
let jumpingSphere;
let cylinders = [];

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
  renderer.setClearColor("#CCCCCC");

  // add ambient light
  ambiLight = new THREE.AmbientLight("#999999");
  scene.add(ambiLight);

  // add point light
  light = getPointLight("#FFFFFF");
  scene.add(light);

  // add a small sphere for the light
  lightMesh = getBasicSphere();
  light.add(lightMesh);
  lightMesh.scale.set(10, 10, 10);

  sculpture = new THREE.Group();


  for (let i = 0; i < numCylinders; i++) {
    const geometry = new THREE.CylinderGeometry(100, 100, height, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x0077ff });
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

  scene.add(sculpture);
}


function updateThree() {
  let angle = frame * 0.01;
  let radDist = 500;
  let x = cos(angle) * radDist;
  let y = 300;
  let z = sin(angle) * radDist;
  light.position.set(x, y, z);

  cylinders.forEach((cylinder, index) => {
    const phaseShift = (index * Math.PI * 2) / numCylinders;
    cylinder.position.y = Math.sin(frame * 0.05 + phaseShift) * 100;
  });


    // Update transition progress
    transitionProgress += transitionSpeed;

    if (transitionProgress >= 1) {
      transitionProgress = 0;
      currentCylinderIndex = nextCylinderIndex;
      nextCylinderIndex = (nextCylinderIndex + 1) % numCylinders;
    }
  
    // Interpolate between current and next cylinder
    const currentCylinder = cylinders[currentCylinderIndex];
    const nextCylinder = cylinders[nextCylinderIndex];
  
    // jumpingSphere.position.x = THREE.MathUtils.lerp(
    //   currentCylinder.position.x,
    //   nextCylinder.position.x,
    //   transitionProgress
    // );
    
    // jumpingSphere.position.y = THREE.MathUtils.lerp(
    //   currentCylinder.position.y + height,
    //   nextCylinder.position.y + height,
    //   transitionProgress
    // );
  
    // jumpingSphere.position.z = THREE.MathUtils.lerp(
    //   currentCylinder.position.z,
    //   nextCylinder.position.z,
    //   transitionProgress
    // );

    const newPosition = new THREE.Vector3(
        THREE.MathUtils.lerp(currentCylinder.position.x, nextCylinder.position.x, transitionProgress),
        THREE.MathUtils.lerp(currentCylinder.position.y + height / 2+40, nextCylinder.position.y + height / 2+40, transitionProgress),
        THREE.MathUtils.lerp(currentCylinder.position.z, nextCylinder.position.z, transitionProgress)
      );
    
      // Calculate direction vector and apply rotation
      const direction = newPosition.clone().sub(jumpingSphere.position).normalize();
      
      const axis = new THREE.Vector3(0, -1, 0); // Rotate around Y-axis
      const angleToRotate = direction.length() * transitionSpeed; // Adjust rotation speed
      jumpingSphere.rotateOnWorldAxis(axis, angleToRotate);
    
      jumpingSphere.position.copy(newPosition);
  


  sculpture.rotation.y = frame * 0.01;
}



function createJumpingSphere() {
  const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({ color: "#ff0000" });
  jumpingSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  return jumpingSphere;
}

function getBasicSphere() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: "#ffffff",
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function getPointLight(color) {
  const light = new THREE.PointLight(color, 2, 0, 0.1); // ( color , intensity, distance (0=infinite), decay )
  return light;
}
