let params = {
  color: "#FFF"
};

const WORLD_HALF = 1000;
let plane;
let controlsDrag;

function setupThree() {
  // controls
  clock = new THREE.Clock();
  // controls = new FlyControls(camera, renderer.domElement);
  // controls.movementSpeed = 100;
  // controls.rollSpeed = 0.5;
  // controls.autoForward = true;

  // controls = new MapControls(camera, renderer.domElement);


  const controls = new PointerLockControls( camera, document.body );

  controlsDrag = new DragControls(scene.children, camera, renderer.domElement);

  controlsDrag.addEventListener('dragstart', function (event) {
    event.object.material.color.setRGB(1, 0, 0);
    controls.enabled = false;
  });
  controlsDrag.addEventListener('dragend', function (event) {
    controls.enabled = true;
    event.object.material.color.setRGB(0, 1, 0);
  });

  //direction
  controls.minDistance = 500;
  controls.maxDistance = 1500;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.5;
  controls.panSpeed = 1.0;
  controls.zoomSpeed = 0.15;

  // controls.listenToKeyEvents(window);
  // controls.keys = {
  //   LEFT: "KeyA",
  //   UP: "KeyW",
  //   RIGHT: "KeyD",
  //   BOTTOM: "KeyS"
  // };

  // plane
  plane = getPlane();
  scene.add(plane);
  plane.position.y = -WORLD_HALF / 4;
  plane.rotation.x = -PI / 2;

  // boxes
  for (let i = 0; i < 100; i++) {
    let box = getBox();
    scene.add(box);

    box.position.x = random(-WORLD_HALF, WORLD_HALF);
    box.position.y = random(-WORLD_HALF / 2, WORLD_HALF);
    box.position.z = random(-WORLD_HALF, WORLD_HALF);

    box.rotation.x = random(TWO_PI);
    box.rotation.y = random(TWO_PI);
    box.rotation.z = random(TWO_PI);

    const size = random(1, 20);
    box.scale.x = size;
    box.scale.y = size;
    box.scale.z = size;

    box.material.transparent = true;
    box.material.opacity = random(0.4, 0.7);


  }
}

function updateThree() {

  // console.log(camera.position.z);
  // let delta = clock.getDelta();
  // controls.update(delta);

  // //to make it less disorienting 
  // camera.position.y = 100;
}

function getBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function getPlane() {
  const geometry = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 100, 100);
  const material = new THREE.MeshBasicMaterial({
    wireframe: true,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);

  //console.log(geometry.attributes.position.array);
  let posArray = geometry.attributes.position.array;
  for (let i = 0; i < posArray.length; i += 3) {
    let x = posArray[i + 0];
    let y = posArray[i + 1];
    let z = posArray[i + 2];

    let xOffset = (x + WORLD_HALF) * 0.005;
    let yOffset = (y + WORLD_HALF) * 0.005;
    let amp = 6;
    let noiseValue = (noise(xOffset, yOffset) * amp) ** 3;

    posArray[i + 2] = noiseValue; // update the z value.
  }
  return mesh;
}