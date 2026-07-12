import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui';
import CANNON from 'cannon';


interface SIZE {
  width: number,
  height: number
}

const canvas: HTMLElement | null = document.getElementById('three-js');
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({canvas} as any);
const scene: THREE.Scene = new THREE.Scene();
const gui = new dat.GUI();

function getSize(): SIZE {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

const cubeTextureLoader: THREE.CubeTextureLoader = new THREE.CubeTextureLoader()
let texture = cubeTextureLoader.load([
  '/textures/environmentMaps/0/px.png',
  '/textures/environmentMaps/0/nx.png',
  '/textures/environmentMaps/0/py.png',
  '/textures/environmentMaps/0/ny.png',
  '/textures/environmentMaps/0/pz.png',
  '/textures/environmentMaps/0/nz.png',
]);

const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(5,5);
const planeMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: '#777777',
  roughness: 0.3,
  metalness: 0.4,
  envMap: texture,
  envMapIntensity: 0.5,
  side: THREE.DoubleSide
})
const plane: THREE.Mesh = new THREE.Mesh(planeGeometry,planeMaterial);
plane.rotation.x = Math.PI / 0.4;
plane.receiveShadow = true;
scene.add(plane);

const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.2,30,30);
const sphereMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.4,
  metalness: 0.5,
  envMap: texture,
  envMapIntensity: 0.5
})
const sphere: THREE.Mesh = new THREE.Mesh(sphereGeometry,sphereMaterial);
sphere.castShadow = true;
sphere.position.y = 0.2;
scene.add(sphere);

const ambientLight: THREE.AmbientLight = new THREE.AmbientLight('0xffffff');
scene.add(ambientLight);

const directionalLight: THREE.DirectionalLight = new THREE.DirectionalLight('0xffffff',1);
directionalLight.castShadow = true;
directionalLight.position.x = 1;
scene.add(directionalLight);


// Physics code
const world = new CANNON.World();

// Physics Material
const concreteMaterial = new CANNON.Material('concrete');
const plasticMaterial = new CANNON.Material('plastic');

const concretePlasticContactMaterial = new CANNON.ContactMaterial(
  concreteMaterial,
  plasticMaterial,
  {
    friction: 0.3,
    restitution: 0.7
  }
);

world.addContactMaterial(concretePlasticContactMaterial);

// Earths gravity
world.gravity.set(0,-9.82,0);

// Sphere
const sphereShape = new CANNON.Sphere(0.2);
const sphereBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0,3,0),
  shape: sphereShape,
  material: plasticMaterial,
});
sphereBody.applyForce(new CANNON.Vec3(100,0,0),sphereBody.position);
world.addBody(sphereBody);

// Plane
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
  mass: 0,
  shape: floorShape,
  material: concreteMaterial
});
/**
 * Quaternion:
 * Quaternion is nothing but a mathematical object representing Axis and angular.
 * A quaternion contains 4 properties x, y, z, w (angle).
 * In below example -1 means to rotate the body from negative x axis
 */
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0),Math.PI * 0.5)
world.addBody(floorBody);

// Camera
let size: SIZE = getSize();
const fieldOfView: number = 45;
const aspectRatio: number = size.width / size.height;
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(fieldOfView,aspectRatio);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// gui.add(camera.position,'x').min(0).max(10).step(0.01).name("PositionX");
// gui.add(camera.position,'y').min(0).max(10).step(0.01).name("PositionY");
// gui.add(camera.position,'z').min(0).max(10).step(0.01).name("PositionZ");

window.addEventListener('resize',() => {
  size = getSize();
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(size.width,size.height);
});

const controls: OrbitControls = new OrbitControls(camera,canvas);

// Renderer
renderer.setAnimationLoop(animation);
renderer.shadowMap.enabled = true;
renderer.setSize(size.width,size.height);
renderer.render(scene,camera);

const clock = new THREE.Clock();
let oldElapsedTime: number = 0;

function spherePosition() {
  sphere.position.copy(sphereBody.position)
}

function animation() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;
  world.step(1/60,deltaTime,3);
  sphereBody.applyLocalForce(new CANNON.Vec3(-0.1,0,0), sphereBody.position);
  spherePosition();

  controls.update();
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
}