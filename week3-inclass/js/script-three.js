let container;
let scene, camera, renderer;
let controls;

let cube;
let ball;


function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);



  container = document.getElementById("container-three");
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  setupThree();

}

function setupThree() {
  // setup like p5

  camera.position.z = 5;


  cube = getCube();
  scene.add(cube);

  ball = getSphere();
  scene.add(ball);

  renderer.setAnimationLoop(animate);
}

function updateThree() {
//
}


function animate() {
  updateThree();
  renderer.render(scene, camera);


}


function getCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshNormalMaterial({
    color: 0x00ff00
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function getSphere() {
  const geometry = new THREE.SphereGeometry( 15, 32, 16 );
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}
