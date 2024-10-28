let params = {
  // (add)
};

const WORLD_SIZE = 1000;
let ball;

function setupThree() {


  ball = getSphere();
  scene.add(ball);
  ball.scale.set(400, 400, 400);


  const light = new THREE.PointLight( 0xffffff, 1, 4000 );
  light.position.set( 500, 0, 0 );
  scene.add( light );
}

function updateThree() {

}

function getSphere() {

  let texture = new THREE.TextureLoader().load('assets/moon.jpg');
  let dTexture = new THREE.TextureLoader().load('assets/earth-displacement.png');

  const geometry = new THREE.SphereGeometry(15, 32, 16);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    map: texture,
    // side: THREE.DoubleSide
    displacementMap: dTexture,
    displacementScale: 0.05
  });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}