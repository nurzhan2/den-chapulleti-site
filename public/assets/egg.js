import * as THREE from 'three';
import { OrbitControls } from 'three/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/jsm/environments/RoomEnvironment.js';

const H = 2.0, CAP = 0.18, HINGE_X = 0.08, OPEN = THREE.MathUtils.degToRad(72), LIFT = 0.15;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d0b0a');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

const cam = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
const controls = new OrbitControls(cam, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.55;
const front = () => {
  cam.position.set(1.1, 1.35, innerWidth < 760 ? 6.6 : 4.8);
  controls.target.set(0, 1.12, 0.15);
};
front();

scene.add(new THREE.HemisphereLight('#f5ece2', '#120e0b', 0.45));
const key = new THREE.SpotLight('#fff1dc', 60, 9, 0.5, 0.6, 1.4);
key.position.set(0, 3.6, 1.6);
key.target.position.set(0, 1.1, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key, key.target);
const side = new THREE.DirectionalLight('#c9d3ff', 0.4);
side.position.set(-3, 2, 3);
scene.add(side);

const wallMat = new THREE.MeshStandardMaterial({ color: '#3a332d', roughness: 0.95 });
const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat);
wall.position.set(0, 3, 0);
wall.receiveShadow = true;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#1a1613', roughness: 0.8 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(wall, floor);

// тёплая полоса света вдоль стены, как на видео
const cove = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.02), new THREE.MeshBasicMaterial({ color: '#ffe2bd' }));
cove.position.set(0, 1.0 + LIFT, 0.002);
scene.add(cove);

const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
const chrome = new THREE.MeshStandardMaterial({ color: '#e2e3e6', metalness: 1, roughness: 0.16, envMapIntensity: 2.8, clippingPlanes: [clip], side: THREE.DoubleSide });
const ply = new THREE.MeshStandardMaterial({ color: '#c08a5a', roughness: 0.6, flatShading: true, clippingPlanes: [clip], side: THREE.DoubleSide });
const glow = new THREE.MeshStandardMaterial({ color: '#2a0711', emissive: '#ff2d6e', emissiveIntensity: 1.6, side: THREE.DoubleSide });
const dark = new THREE.MeshStandardMaterial({ color: '#141214', roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide });

// гладкая поверхность после шлифовки и покрытия - тело вращения по тому же профилю, что и слои
const W2 = 0.59, BC = 0.09, EGG = 0.12;
const RK = (() => {
  let m = 0;
  for (let i = 0; i <= 2000; i++) {
    const u = -1 + i / 1000;
    m = Math.max(m, Math.sqrt(1 - u * u) * (1 - EGG * u));
  }
  return W2 / m;
})();
const rAt = y => {
  const u = (y - H / 2) / (H / 2);
  return Math.abs(u) >= 1 ? 0 : RK * Math.sqrt(1 - u * u) * (1 - EGG * u);
};
function lathe(y0, y1, phi0, phiLen, closeTop) {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const y = y0 + (y1 - y0) * i / 64;
    pts.push(new THREE.Vector2(Math.max(rAt(y), 0.001), y));
  }
  if (closeTop) pts.push(new THREE.Vector2(0.001, y1));
  const g = new THREE.LatheGeometry(pts, 96, phi0, phiLen);
  g.translate(0, 0, -BC);
  return g;
}

const egg = new THREE.Group();
egg.position.y = LIFT;
scene.add(egg);
let showSet = () => {};
const wings = {};

const pink = new THREE.PointLight('#ff3d79', 0, 2.2, 1.6);
pink.position.set(0, 1.35, 0.28);
egg.add(pink);

new GLTFLoader().load('/media/bar/egg.glb', gltf => {
  const nodes = {};
  gltf.scene.traverse(o => { if (o.isMesh) nodes[o.name] = o; });
  for (const [name, m] of Object.entries(nodes)) {
    m.geometry.computeVertexNormals();
    m.castShadow = m.receiveShadow = true;
    if (name === 'niche') m.material = glow;
    else if (name === 'shelf') m.material = dark;
    else m.material = ply;
  }
  const zc = 0.9, zt = 0.94;
  const smooth = {
    bowl: new THREE.Mesh(lathe(0, zc, 0, Math.PI * 2), chrome),
    counter: new THREE.Mesh(lathe(zc, zt, 0, Math.PI * 2, true), chrome),
    cap: new THREE.Mesh(lathe(H - CAP, H, 0, Math.PI * 2), chrome),
    wing_L: new THREE.Mesh(lathe(zt, H - CAP, Math.PI, Math.PI), chrome),
    wing_R: new THREE.Mesh(lathe(zt, H - CAP, 0, Math.PI), chrome),
  };
  for (const m of Object.values(smooth)) m.castShadow = true;
  const sets = { layers: nodes, smooth };
  egg.add(nodes.niche, nodes.shelf);
  for (const n of ['bowl', 'counter', 'cap']) egg.add(nodes[n], smooth[n]);
  // крылья вешаем на оси петель у нижней кромки купола
  for (const [n, sx] of [['wing_L', -1], ['wing_R', 1]]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * HINGE_X, H - CAP, 0);
    for (const m of [nodes[n], smooth[n]]) {
      m.position.set(-sx * HINGE_X, -(H - CAP), 0);
      pivot.add(m);
    }
    egg.add(pivot);
    wings[n] = pivot;
  }
  showSet = mirror => {
    for (const n of Object.keys(smooth)) {
      smooth[n].visible = mirror;
      nodes[n].visible = !mirror;
    }
  };
  showSet(true);
  addProps();
  document.getElementById('load').classList.add('done');
});

function addProps() {
  // пара бутылок и бокалов на стойке для масштаба
  const glass = new THREE.MeshPhysicalMaterial({ color: '#2b1a12', roughness: 0.05, transmission: 0.6, thickness: 0.02 });
  const top = 0.94;
  [-0.32, -0.2, 0.22, 0.34].forEach((x, i) => {
    const h = 0.3 + (i % 2) * 0.04;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, h, 24), glass);
    b.position.set(x, top + h / 2, 0.18 + (i % 2) * 0.06);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.09, 16), glass);
    neck.position.set(x, top + h + 0.045, b.position.z);
    egg.add(b, neck);
  });
}

const state = { open: 0 };
let target = 0;
const btn = id => document.getElementById(id);
btn('open').onclick = () => {
  target = target ? 0 : 1;
  btn('open').classList.toggle('on', !!target);
  btn('open').textContent = target ? 'Закрыть' : 'Открыть';
};
btn('finish').onclick = () => {
  const mirror = !btn('finish').classList.contains('on');
  btn('finish').classList.toggle('on', mirror);
  btn('finish').textContent = mirror ? 'Зеркало' : 'Фанера';
  showSet(mirror);
};
let cutOn = false;
btn('cut').onclick = () => {
  cutOn = !cutOn;
  btn('cut').classList.toggle('on', cutOn);
  clip.constant = cutOn ? 0.28 : 10;
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
  state.open += (target - state.open) * 0.045;
  const e = state.open * state.open * (3 - 2 * state.open);
  if (wings.wing_L) {
    wings.wing_L.rotation.z = -OPEN * e;
    wings.wing_R.rotation.z = OPEN * e;
  }
  pink.intensity = 0.4 + 5 * e;
  controls.update();
  renderer.render(scene, cam);
});
