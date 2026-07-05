import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

interface SIZE {
  width: number,
  height: number
}

const canvas: HTMLElement | null = document.getElementById('three-js');
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({canvas} as any);
const scene: THREE.Scene = new THREE.Scene();

function getSize(): SIZE {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
  roughness: 0.2,
  metalness: 0.5
});
const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(5,5);
const plane: THREE.Mesh = new THREE.Mesh(planeGeometry,material);
plane.rotation.x = Math.PI / 0.4;
plane.receiveShadow = true;
scene.add(plane);

const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.2,30,30);
const sphere: THREE.Mesh = new THREE.Mesh(sphereGeometry,material);
sphere.castShadow = true;
sphere.position.y = 0.2;
scene.add(sphere);

const ambientLight: THREE.AmbientLight = new THREE.AmbientLight('0xffffff');
scene.add(ambientLight);

const directionalLight: THREE.DirectionalLight = new THREE.DirectionalLight('0xffffff',1);
directionalLight.castShadow = true;
directionalLight.position.x = 1;
scene.add(directionalLight);

// Camera
let size: SIZE = getSize();
const fieldOfView: number = 45;
const aspectRatio: number = size.width / size.height;
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(fieldOfView,aspectRatio);
camera.position.z = 10;
camera.position.y = 15;
scene.add(camera);

window.addEventListener('resize',() => {
  size = getSize();
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
});

const controls: OrbitControls = new OrbitControls(camera,canvas);

// Renderer
renderer.setAnimationLoop(animation);
renderer.shadowMap.enabled = true;
renderer.setSize(size.width,size.height);
renderer.render(scene,camera);

function animation() {
  controls.update();
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
}
