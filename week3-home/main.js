// https://threejs.org/docs/index.html?q=light#api/en/lights/PointLight
// https://threejs.org/docs/index.html?q=phong#api/en/materials/MeshPhongMaterial

let light, lightMesh;
let sculpture;
let cubes = [];
let rectNum = 10;

function setupThree() {
  // It is not recommended to explore materials and lights this week!

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

  // add meshes
  for (let i = 0; i < rectNum; i++){
    cubes[i] = getCube();
    cubes[i].position.set(0, i*15, 0);
    cubes[i].scale.set(200, i, 100);
  }
  // change color
//   ball.material.color.set("#FF00FF");
//   // change transparency
//   ball.material.transparent = true;
//   ball.material.opacity = 0.75;

  sculpture = new THREE.Group();
  scene.add(sculpture);
  for (let i = 0; i < rectNum; i++){
    sculpture.add(cubes[i]);
  }
}

function getCube(){
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: "#999999",
      shininess: 100
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function updateThree() {
  let angle = frame * 0.01;
  let radDist = 500;
  let x = cos(angle) * radDist;
  let y = 300;
  let z = sin(angle) * radDist;
  light.position.set(x, y, z);
}


function getBasicSphere() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: "#ffffff"
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function getPointLight(color) {
  const light = new THREE.PointLight(color, 2, 0, 0.1); // ( color , intensity, distance (0=infinite), decay )
  return light;
}





