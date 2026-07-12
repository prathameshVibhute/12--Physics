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

// Plane
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

// Sphere Geometry
const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(1,30,30);
const sphereMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.4,
  metalness: 0.5,
  envMap: texture,
  envMapIntensity: 0.5
});

const boxGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1,1,1);


// Physics code
const world = new CANNON.World();
// Better for performance.
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

// Physics Material
const defaultMaterial = new CANNON.Material('default');

const meshBodyObjectList: any = [];

// const hitSound = new Audio('/sounds/hit.mp3');

// Setup once
const audioCtx = new AudioContext();
let hitBuffer: AudioBuffer;

async function loadHitSound(url: string) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  hitBuffer = await audioCtx.decodeAudioData(arrayBuffer);
}
loadHitSound('/sounds/hit.mp3');

// Play — call this as many times as you want, overlapping is free
function playHitSoundBuffer(volume: number) {
  if (!hitBuffer) return; // not loaded yet

  const source = audioCtx.createBufferSource();
  source.buffer = hitBuffer;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;
  source.connect(gainNode).connect(audioCtx.destination);
  source.start(0);
}

const playHitSound = (collision: any) => {
  const impact: number = collision.contact.getImpactVelocityAlongNormal();
  if (impact > 1.5) {
    playHitSoundBuffer(Math.random());
  }
};

// Creating dynamic sphere
const createSphere = (radius: number, position: any) => {
    // Create mesh
    const sphere = new THREE.Mesh(sphereGeometry,sphereMaterial);
    sphere.castShadow = true;
    sphere.position.set(position.x,position.y,position.z);
    sphere.scale.set(radius,radius,radius);
    scene.add(sphere);

    // Create physics world object
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
        mass: 1,
        shape,
        material: defaultMaterial
    });
    body.position.copy(position);
    world.addBody(body);
    meshBodyObjectList.push({
        threeJSMesh: sphere,
        cannonJSBody: body
    });
}

const createBox = (width: number,height: number, depth: number, position: any) => {
    // Create mesh
    const sphere = new THREE.Mesh(boxGeometry,sphereMaterial);
    sphere.castShadow = true;
    sphere.position.set(position.x,position.y,position.z);
    sphere.scale.set(height,width,depth);
    scene.add(sphere);

    // Create physics world object
    const shape = new CANNON.Box(new CANNON.Vec3(height * 0.5,width * 0.5, depth * 0.5));
    const body = new CANNON.Body({
        mass: 1,
        shape,
        material: defaultMaterial
    });
    body.position.copy(position)
    body.addEventListener('collide',playHitSound);
    world.addBody(body);

    meshBodyObjectList.push({
        threeJSMesh: sphere,
        cannonJSBody: body
    });
}



const ambientLight: THREE.AmbientLight = new THREE.AmbientLight('0xffffff');
scene.add(ambientLight);

const directionalLight: THREE.DirectionalLight = new THREE.DirectionalLight('0xffffff',1);
directionalLight.castShadow = true;
directionalLight.position.x = 1;
scene.add(directionalLight);

const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.3,
    restitution: 0.3
  }
);

world.addContactMaterial(defaultContactMaterial);

const debugObject: any = {};

debugObject.createSphere = () => {
    createSphere(
        (Math.random() * 0.5),
        {
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3
        }
    );
}

debugObject.createBox = () => {
    createBox(
        (Math.random() * 0.7),
        (Math.random() * 0.7),
        (Math.random() * 0.7),
        {
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3
        }
    );
};

gui.add(debugObject,'createSphere');
gui.add(debugObject,'createBox');

// Earths gravity
world.gravity.set(0,-9.82,0);

// Plane
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
  mass: 0,
  shape: floorShape,
  material: defaultMaterial
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
    meshBodyObjectList.forEach((container: any) => {
        container.threeJSMesh.position.copy(container.cannonJSBody.position);
        container.threeJSMesh.quaternion.copy(container.cannonJSBody.quaternion);
    });
}

function animation() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;
  world.step(1/60,deltaTime,3);
  spherePosition();

  controls.update();
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
}