import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load( '/retro_computer.glb', function ( gltf ) {
    var scene = new THREE.Scene();
	scene.add( gltf.scene );

}, undefined, function ( error ) {

	console.error( error );

} );

//buttons
const buttonsElement = document.getElementById("buttons");
const accelerateButton = document.getElementById("accelerate");
const decelerateButton = document.getElementById("decelerate");

let lastTimestamp;
lastTimestamp = undefined;

// Set up the scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a shadow map
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
/*
const controls = new THREE.FlyControls(camera, renderer.domElement)
controls.movementSpeed = 1000
controls.domElement = render.domElement
controls.rollSpeed = Math.PI / 24
controls.autoForward = false
controls.dragToLook = false
*/

// Add a light source
var light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 0, 5);
scene.add(light);

// Add a directional light
var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 5);
scene.add(directionalLight);

// Add a spotlight
var spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0, 0, 5);
spotLight.castShadow = true;
scene.add(spotLight);

scene.background = new THREE.Color(0x262626)
// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)
//light.position.set(-10, 10, -10)

// plane
const planeGeometry = new THREE.PlaneGeometry(100, 100)
const plane = new THREE.Mesh(
   planeGeometry,
   new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide })
)
plane.rotateX(Math.PI / 2)
plane.position.y = -1.75
plane.receiveShadow = true
scene.add(plane)

// Load a texture
var textureLoader = new THREE.TextureLoader();
var cubeTexture = textureLoader.load('texture.jpg');

// Create a cube
var geometry = new THREE.BoxGeometry();
var material = new THREE.MeshPhongMaterial({ map: cubeTexture });
var cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;

scene.add(cube);



// Create an outline for the cube
var edges = new THREE.EdgesGeometry(geometry);
var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
var cubeEdges = new THREE.LineSegments(edges, lineMaterial);
scene.add(cubeEdges);

camera.position.z = 5;


accelerateButton.addEventListener("mousedown", function () {
    startGame();
    accelerate = true;
  });
  decelerateButton.addEventListener("mousedown", function () {
    startGame();
    decelerate = true;
  });
  accelerateButton.addEventListener("mouseup", function () {
    accelerate = false;
  });
  decelerateButton.addEventListener("mouseup", function () {
    decelerate = false;
  });
  window.addEventListener("keydown", function (event) {
    if (event.key == "ArrowUp") {
      startGame();
      accelerate = true;
      return;
    }
    if (event.key == "ArrowDown") {
      decelerate = true;
      return;
    }
    if (event.key == "R" || event.key == "r") {
      reset();
      return;
    }
  });
  window.addEventListener("keyup", function (event) {
    if (event.key == "ArrowUp") {
      accelerate = false;
      return;
    }
    if (event.key == "ArrowDown") {
      decelerate = false;
      return;
    }
  });

// move

function movePlayer(timeDelta) {
    /*const playerSpeed = getPlayerSpeed();
    //playerAngleMoved -= playerSpeed * timeDelta;
  
    //const totalPlayerAngle = playerAngleInitial + playerAngleMoved;
  
    const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
    const playerY = Math.sin(totalPlayerAngle) * trackRadius;
  
    playerCar.position.x = playerX;
    playerCar.position.y = playerY;
  
    playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;*/
  }

// speed

let playerAngleMoved;
const speed = 0.0017;
function getPlayerSpeed() {
    if (accelerate) return speed * 2;
    if (decelerate) return speed * 0.5;
    return speed;
  }

// Animation loop
function animate(timestamp) {
    requestAnimationFrame(animate);

    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        return;
      }

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Rotate the edges
    cubeEdges.rotation.x += 0.01;
    cubeEdges.rotation.y += 0.01;

    const timeDelta = timestamp - lastTimestamp;

    movePlayer(timeDelta);

    renderer.render(scene, camera);
}

animate();

// Resize the scene when the window is resized
window.addEventListener('resize', onWindowResize, false);

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
