import * as THREE from 'three';

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

// Camera
let size: SIZE = getSize();
const fieldOfView: number = 45;
const aspectRatio: number = size.width / size.height;
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(fieldOfView,aspectRatio);
camera.position.z = 10;
scene.add(camera);

window.addEventListener('resize',() => {
  size = getSize();
  camera.aspect = size.width / size.height;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
});

// Renderer
renderer.setSize(size.width,size.height);
renderer.render(scene,camera);
