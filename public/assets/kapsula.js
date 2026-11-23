import * as THREE from 'three';
import { OrbitControls } from 'three/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/jsm/environments/RoomEnvironment.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0a09');
scene.fog = new THREE.Fog('#0b0a09', 6, 14);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const cam = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
const controls = new OrbitControls(cam, canvas);
controls.enableDamping = true;
controls.target.set(0, 1, 0.1);
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.52;

const front = () => {
  const far = innerWidth < 760 ? 6.4 : 4.6;
  cam.position.set(1.4, 1.25, far);
  controls.target.set(0, 1, 0.1);
};
front();

scene.add(new THREE.HemisphereLight('#fff3e0', '#1a140e', 0.5));
const key = new THREE.DirectionalLight('#ffe7c4', 2.4);
key.position.set(2.5, 4, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3, bottom: -1 });
scene.add(key);
const fill = new THREE.DirectionalLight('#c8d4ff', 0.5);
fill.position.set(-3, 2, 2);
scene.add(fill);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#16130f', roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), new THREE.MeshStandardMaterial({ color: '#1d1a16', roughness: 0.95 }));
wall.position.set(0, 4, 0);
wall.receiveShadow = true;
scene.add(floor, wall);

// плоскость разреза по высоте: показывает слои и полость
const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
renderer.localClippingEnabled = true;

const parts = {};
new GLTFLoader().load('/media/bar/kapsula.glb', gltf => {
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    o.geometry.computeVertexNormals();
    const m = o.material;
    if (o.name.startsWith('door')) {
      o.material = new THREE.MeshStandardMaterial({ color: '#c08a5a', roughness: 0.6, metalness: 0, clippingPlanes: [clip], side: THREE.DoubleSide, flatShading: true });
    } else if (o.name.startsWith('mirror')) {
      o.material = new THREE.MeshStandardMaterial({ color: '#dfe5ea', roughness: 0.12, metalness: 0.55, envMapIntensity: 2.2, emissive: '#2a2e33', side: THREE.DoubleSide });
    } else {
      o.material = new THREE.MeshStandardMaterial({ color: '#2b2b30', roughness: 0.42, metalness: 0.15, emissive: '#151517', side: THREE.DoubleSide });
    }
    m.dispose?.();
    parts[o.name] = o;
  });
  scene.add(gltf.scene);
  document.getElementById('load').classList.add('done');
});

// door_L по раскрою стоит справа (x > 0) и уезжает вправо
const state = { open: 0 };
let target = 0;
const SHIFT = 0.43;
function applyOpen() {
  const s = state.open * SHIFT;
  for (const n of ['door_L', 'mirror_L']) parts[n] && (parts[n].position.x = s);
  for (const n of ['door_R', 'mirror_R']) parts[n] && (parts[n].position.x = -s);
}

const btn = id => document.getElementById(id);
btn('open').onclick = () => {
  target = target ? 0 : 1;
  btn('open').classList.toggle('on', !!target);
  btn('open').textContent = target ? 'Закрыть' : 'Открыть';
};
btn('stand').onclick = () => {
  const on = btn('stand').classList.toggle('on');
  parts.stand && (parts.stand.visible = on);
};
let cutOn = false;
btn('cut').onclick = () => {
  cutOn = !cutOn;
  btn('cut').classList.toggle('on', cutOn);
  clip.constant = cutOn ? 0.3 : 10;
};
btn('reset').onclick = front;

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => {
  state.open += (target - state.open) * 0.06;
  applyOpen();
  controls.update();
  renderer.render(scene, cam);
});
