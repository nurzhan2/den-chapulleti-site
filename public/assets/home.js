import * as THREE from 'three';
import { slabCanvas, plankCanvas, rng } from './wood.js';
import { lenis, split, reveals, fillTextures, openAR, getLang } from './common.js';

const cfg = JSON.parse(document.getElementById('cfg').textContent);
const mobile = matchMedia('(max-width:820px)').matches;
const L = (ru, en) => (getLang() === 'en' ? en : ru);

document.body.classList.add('loading');
if (cfg.video) document.body.classList.add('has-video');
lenis.stop();

/* ================= 3D ================= */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !mobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050505');
scene.fog = new THREE.Fog('#050505', 7, 16);
const camera = new THREE.PerspectiveCamera(mobile ? 48 : 36, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 9, 2.6);

const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

scene.add(new THREE.AmbientLight('#2a2119', 0.6));
const key = new THREE.SpotLight('#ffdcae', 45, 18, Math.PI / 6.5, 0.6, 1.6);
key.position.set(1.5, 7, 2.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#c8a45d', 2.2);
rim.position.set(-3, 2.2, -4);
const rim2 = new THREE.DirectionalLight('#7b6a55', 0.8);
rim2.position.set(4, 1, -2);
const fill = new THREE.PointLight('#d9b48a', 7, 9, 2);
fill.position.set(2.2, 0.45, 2.8);
const fill2 = new THREE.PointLight('#8a6a4a', 2.5, 8, 2);
fill2.position.set(-3, 0.6, 1.5);
const lavaLight = new THREE.PointLight('#ff6a1f', 6, 4.5, 2);
lavaLight.position.set(0, 1.2, 0);
scene.add(rim, rim2, fill, fill2, lavaLight);

const floorC = document.createElement('canvas');
floorC.width = floorC.height = 512;
{
  const g = floorC.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, '#1c1813'); gr.addColorStop(0.5, '#0c0b0a'); gr.addColorStop(1, '#050505');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
}
const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 96), new THREE.MeshStandardMaterial({ map: tex(floorC), roughness: 0.55, metalness: 0.2 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const ring = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.565, 160), new THREE.MeshBasicMaterial({ color: '#c8a45d', transparent: true, opacity: 0.35 }));
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.003;
scene.add(ring);

// hs.f — точка в долях габаритов модели (0..1 по x, y, z), так же работает и для будущих .glb
const HS = {
  lava: [
    { f: [0.55, 1, 0.5], n: ['Оптический полимер', 'Optical resin'], d: ['Радиальные каналы с подсветкой. Тёплый янтарный свет проходит сквозь трещины ствола.', 'Lit radial channels. Warm amber light runs through the cracks of the trunk.'] },
    { f: [0.5, 0.86, 1], n: ['Стальной шильд', 'Steel nameplate'], d: ['Именная гравировка мануфактуры и QR-паспорт с историей ствола.', 'Engraved manufacture nameplate and a QR passport with the trunk’s history.'] },
    { f: [0.5, 0.2, 0.86], n: ['Дубовые сферы', 'Oak spheres'], d: ['Три опоры ручной работы из того же ствола, без склейки.', 'Three hand-turned supports from the same trunk, no glue.'] },
    { f: [0, 0.86, 0.5], n: ['Резьба торца', 'Carved edge'], d: ['Ручная резьба по всему периметру. Диаметр 190–205 см.', 'Hand carving all around the edge. 190–205 cm across.'] },
  ],
  moai: [
    { f: [0.5, 0.92, 1], n: ['Цельный ствол', 'Single trunk'], d: ['Высота 207 см. Высечен из одного ствола, поверхность патинирована.', '207 cm tall, carved from a single trunk and patinated.'] },
    { f: [0.5, 0.5, 0], n: ['Петроглифы', 'Petroglyphs'], d: ['На спине — рельеф птиц в технике петроглифа.', 'A bird relief in petroglyph technique on the back.'] },
    { f: [0.95, 0.06, 0.95], n: ['Постамент', 'Plinth'], d: ['Чёрный постамент со скрытой подсветкой. Есть парный Моаи с обжигом Якисуги.', 'Black lit plinth. A twin Moai with Yakisugi charring exists.'] },
  ],
  bulldog: [
    { f: [0.4, 1, 0.5], n: ['Цельный орех', 'Solid walnut'], d: ['Банкетка длиной 100 см высечена из одного бревна ореха Ø 90 см.', 'A 100 cm bench carved from one 90 cm walnut log.'] },
    { f: [1, 0.72, 0.5], n: ['Ядро и заболонь', 'Heart & sapwood'], d: ['Контраст тёмного ядра и светлой заболони работает как окрас.', 'Dark heartwood and pale sapwood read like a coat pattern.'] },
    { f: [0.3, 0.08, 1], n: ['Врезной шильд', 'Inset nameplate'], d: ['Стальной шильд мануфактуры врезан в основание.', 'The steel nameplate is set into the base.'] },
  ],
};

function buildLava() {
  const g = new THREE.Group();
  const s = slabCanvas({ size: mobile ? 1024 : 2048, seed: 11, lava: true, tone: 'oak' });
  const topMat = new THREE.MeshStandardMaterial({ map: tex(s.map), emissiveMap: tex(s.emissive), emissive: new THREE.Color('#fff'), emissiveIntensity: 1.1, roughness: 0.58, metalness: 0.05 });
  const sideT = tex(plankCanvas({ w: 1024, h: 128, seed: 5, tone: 'oak' }));
  sideT.wrapS = THREE.RepeatWrapping;
  sideT.repeat.set(6, 1);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.86, 0.16, 160), [
    new THREE.MeshStandardMaterial({ map: sideT, roughness: 0.8, color: '#6d5a48' }),
    topMat,
    new THREE.MeshStandardMaterial({ color: '#1a120b', roughness: 0.9 }),
  ]);
  top.position.y = 0.82;
  top.castShadow = top.receiveShadow = true;
  g.add(top);
  // подстолье как на фото: три ноги, у каждой шар-«луковица» на своей высоте
  const legMat = new THREE.MeshStandardMaterial({ map: tex(plankCanvas({ w: 512, h: 512, seed: 9, tone: 'oak' })), roughness: 0.5, color: '#9a6a43', emissive: '#3a1d0c', emissiveIntensity: 0.9 });
  const top0 = 0.74;
  [[0.34, Math.PI / 2], [0.4, Math.PI / 2 + 2.1], [0.5, Math.PI / 2 + 4.2]].forEach(([by, a]) => {
    const x = Math.cos(a) * 0.78, z = Math.sin(a) * 0.78;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 64, 40), legMat);
    bulb.scale.y = 0.5;
    bulb.position.set(x, by, z);
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, by, 40), legMat);
    lo.position.set(x, by / 2, z);
    const hi = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, top0 - by, 40), legMat);
    hi.position.set(x, by + (top0 - by) / 2, z);
    for (const m of [bulb, lo, hi]) m.castShadow = true;
    g.add(bulb, lo, hi);
  });
  // тёплый подсвет снизу, иначе ноги под столешницей уходят в черноту
  const under = new THREE.PointLight('#ff8a3d', 14, 2.6, 2);
  under.position.set(0, 0.62, 0);
  const rim = new THREE.PointLight('#ffd9a8', 30, 5, 1.4);
  rim.position.set(0, 0.45, 2.4);
  g.add(under, rim);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.012), new THREE.MeshStandardMaterial({ color: '#cfcac2', metalness: 1, roughness: 0.22 }));
  plate.position.set(0, 0.82, 1.885);
  g.add(plate);
  g.userData.glow = topMat;
  g.userData.embers = true;
  return g;
}

function buildMoai() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ map: tex(plankCanvas({ w: 512, h: 1024, seed: 21, tone: 'poplar' })), roughness: 0.75, color: '#8c7a66' });
  const add = (geo, x, y, z, rx = 0) => {
    const me = new THREE.Mesh(geo, m);
    me.position.set(x, y, z);
    me.rotation.x = rx;
    me.castShadow = true;
    g.add(me);
  };
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1), new THREE.MeshStandardMaterial({ color: '#0d0d0f', roughness: 0.3, metalness: 0.4 }));
  ped.position.y = 0.15;
  ped.castShadow = ped.receiveShadow = true;
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.012, 1.02), new THREE.MeshBasicMaterial({ color: '#c8a45d' }));
  glow.position.y = 0.3;
  g.add(ped, glow);
  add(new THREE.BoxGeometry(0.86, 0.9, 0.62), 0, 0.75, 0);
  add(new THREE.BoxGeometry(0.78, 1.25, 0.66), 0, 1.66, 0.02);
  add(new THREE.BoxGeometry(0.8, 0.14, 0.2), 0, 2.08, 0.32);
  add(new THREE.BoxGeometry(0.16, 0.62, 0.22), 0, 1.72, 0.42, -0.12);
  add(new THREE.BoxGeometry(0.46, 0.08, 0.1), 0, 1.3, 0.38);
  add(new THREE.BoxGeometry(0.56, 0.22, 0.56), 0, 1.06, 0.06);
  add(new THREE.BoxGeometry(0.12, 0.6, 0.14), -0.42, 1.7, 0);
  add(new THREE.BoxGeometry(0.12, 0.6, 0.14), 0.42, 1.7, 0);
  g.scale.setScalar(0.88);
  return g;
}

function buildBulldog() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: tex(slabCanvas({ size: 1024, seed: 77, tone: 'walnut', bark: false }).map), roughness: 0.42, color: '#c9a888' });
  const pale = new THREE.MeshStandardMaterial({ map: tex(plankCanvas({ w: 512, h: 512, seed: 78, tone: 'poplar' })), roughness: 0.5, color: '#e0c9a8' });
  const part = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const me = new THREE.Mesh(geo, mat);
    me.position.set(x, y, z);
    me.scale.set(sx, sy, sz);
    me.castShadow = true;
    g.add(me);
    return me;
  };
  const body = part(new THREE.CapsuleGeometry(0.42, 0.95, 16, 32), wood, 0, 0.66, 0, 1, 1, 1.05);
  body.rotation.z = Math.PI / 2;
  part(new THREE.SphereGeometry(0.36, 48, 32), wood, 0.92, 0.96, 0, 0.95, 0.9, 1);
  part(new THREE.SphereGeometry(0.2, 32, 24), pale, 1.18, 0.86, 0, 0.6, 0.8, 1.1);
  const ear = new THREE.ConeGeometry(0.11, 0.26, 24);
  part(ear, wood, 0.86, 1.3, 0.2).rotation.x = -0.35;
  part(ear, wood, 0.86, 1.3, -0.2).rotation.x = 0.35;
  const leg = new THREE.CylinderGeometry(0.1, 0.12, 0.34, 20);
  [[0.62, 0.2], [0.62, -0.2], [-0.62, 0.22], [-0.62, -0.22]].forEach(([x, z]) => part(leg, wood, x, 0.17, z));
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.01), new THREE.MeshStandardMaterial({ color: '#cfcac2', metalness: 1, roughness: 0.22 }));
  plate.position.set(-0.2, 0.42, 0.45);
  g.add(plate);
  g.scale.setScalar(1.15);
  return g;
}

const builders = { lava: buildLava, moai: buildMoai, bulldog: buildBulldog };
const models = {};
const stage = new THREE.Group();
scene.add(stage);
let current = null;
let currentName = 'lava';

// реальные модели .glb из /media/models подменяют процедурные
async function loadGlb(name) {
  const { GLTFLoader } = await import('three/jsm/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('three/jsm/loaders/DRACOLoader.js');
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync(cfg.models[name]);
  const g = new THREE.Group();
  const obj = gltf.scene;
  obj.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const target = { lava: 3.8, moai: 2.1, bulldog: 2.2 }[name] || 2.5;
  const k = target / Math.max(size.x, size.y, size.z);
  obj.scale.setScalar(k);
  box.setFromObject(obj);
  obj.position.sub(new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2));
  g.add(obj);
  return g;
}

async function getModel(name) {
  if (models[name]) return models[name];
  let g = null;
  if (cfg.models[name]) {
    try { g = await loadGlb(name); } catch (e) { console.warn('glb', name, e); }
  }
  g ||= builders[name]();
  // габариты считаем без учёта масштаба группы — так точки ложатся на модель при любом scale
  const s = g.scale.x;
  g.scale.setScalar(1);
  g.userData.box = new THREE.Box3().setFromObject(g);
  g.userData.k = s;
  g.scale.setScalar(s);
  return (models[name] = g);
}

// угольки над «Лавой»
const EMB = mobile ? 160 : 320;
const eGeo = new THREE.BufferGeometry();
const eArr = new Float32Array(EMB * 3);
const eSpd = new Float32Array(EMB);
for (let i = 0; i < EMB; i++) {
  const a = Math.random() * 6.28, r = Math.random() * 1.6;
  eArr.set([Math.cos(a) * r, 0.9 + Math.random() * 2.5, Math.sin(a) * r], i * 3);
  eSpd[i] = 0.002 + Math.random() * 0.006;
}
eGeo.setAttribute('position', new THREE.BufferAttribute(eArr, 3));
const sprite = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(0.3, 'rgba(255,120,40,.6)'); gr.addColorStop(1, 'rgba(255,80,20,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ size: 0.045, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
stage.add(embers);

async function setModel(name) {
  const next = await getModel(name);
  if (current === next) return;
  const prev = current;
  current = next;
  currentName = name;
  window.currentModel = { lava: 'Стол «Лава»', moai: 'Идол Моаи', bulldog: 'Банкетка «Французский бульдог»' }[name];
  closeCard();
  if (prev) gsap.to(prev.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.6, ease: 'power3.in', onComplete: () => stage.remove(prev) });
  const k = next.userData.k;
  next.scale.setScalar(0.001);
  next.rotation.y = -0.8;
  stage.add(next);
  gsap.to(next.scale, { x: k, y: k, z: k, duration: 1.4, delay: prev ? 0.5 : 0, ease: 'expo.out' });
  gsap.to(next.rotation, { y: 0, duration: 2, delay: prev ? 0.5 : 0, ease: 'expo.out' });
  gsap.to(embers.material, { opacity: name === 'lava' ? 0.9 : 0, duration: 1 });
  buildHotspots();
}

/* ---------- точки-детали ---------- */
const hsLayer = document.getElementById('hotspots');
const card = document.getElementById('hsCard');
let hsEls = [];
let focus = null;

function localPoint(f) {
  const b = current.userData.box;
  return new THREE.Vector3(
    b.min.x + (b.max.x - b.min.x) * f[0],
    b.min.y + (b.max.y - b.min.y) * f[1],
    b.min.z + (b.max.z - b.min.z) * f[2],
  );
}

function buildHotspots() {
  hsLayer.innerHTML = '';
  hsEls = HS[currentName].map((h, i) => {
    const b = document.createElement('button');
    b.className = 'hs';
    b.setAttribute('aria-label', h.n[0]);
    b.onclick = () => openCard(h, i);
    hsLayer.append(b);
    return { el: b, v: localPoint(h.f) };
  });
}

function openCard(h, i) {
  const en = getLang() === 'en';
  document.getElementById('hsN').textContent = `0${i + 1} / 0${HS[currentName].length}`;
  document.getElementById('hsT').textContent = h.n[en ? 1 : 0];
  document.getElementById('hsP').textContent = h.d[en ? 1 : 0];
  card.classList.add('on');
  const w = localPoint(h.f);
  stage.updateMatrixWorld();
  current.localToWorld(w);
  const dir = w.clone().setY(0).normalize();
  if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
  focus = { look: w, pos: w.clone().add(dir.multiplyScalar(1.6)).add(new THREE.Vector3(0, 0.55, 0)) };
}
function closeCard() { card.classList.remove('on'); focus = null; }
document.getElementById('hsClose').onclick = closeCard;

document.querySelectorAll('#switcher [data-m]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#switcher [data-m]').forEach(x => x.classList.toggle('on', x === b));
  setModel(b.dataset.m);
}));
document.querySelectorAll('[data-ar]').forEach(b => b.addEventListener('click', () => openAR(cfg.models[currentName])));

/* ---------- вращение пальцем: только горизонталь, вертикаль остаётся скроллу ---------- */
let drag = false, lastX = 0, vel = 0, userRot = 0;
canvas.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; vel = 0; canvas.classList.add('dragging'); });
addEventListener('pointermove', e => {
  if (!drag) return;
  vel = (e.clientX - lastX) * 0.006;
  lastX = e.clientX;
  userRot += vel;
});
addEventListener('pointerup', () => { drag = false; canvas.classList.remove('dragging'); });
addEventListener('pointercancel', () => { drag = false; canvas.classList.remove('dragging'); });

const lightOff = { x: 0, y: 0 };
addEventListener('mousemove', e => { lightOff.x = (e.clientX / innerWidth - 0.5) * 2; lightOff.y = (e.clientY / innerHeight - 0.5) * 2; });
addEventListener('deviceorientation', e => {
  if (e.gamma == null) return;
  lightOff.x = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
  lightOff.y = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1);
});

/* ---------- сценарий камеры ---------- */
const k = mobile ? 0 : 1;
const S = {
  intro: { cx: 0, cy: 9, cz: 2.6, lx: 0, ly: 0.8, lz: 0, sx: 0, sy: 0 },
  hero: { cx: 0.6, cy: 4.3, cz: 6.4, lx: 0, ly: 0.5, lz: 0, sx: 0.2 * k, sy: 0 },
  material: { cx: 3.6, cy: 2.4, cz: 4.9, lx: 0, ly: 0.6, lz: 0, sx: 0.22 * k, sy: 0 },
  detail: { cx: -3.0, cy: 0.95, cz: 3.3, lx: 0, ly: 0.45, lz: 0, sx: -0.26 * k, sy: 0 },
  show: { cx: 0, cy: 2.6, cz: 6.2, lx: 0, ly: 0.8, lz: 0, sx: 0, sy: 0 },
  out: { cx: 0, cy: 7, cz: 7, lx: 0, ly: 0.3, lz: 0, sx: 0, sy: 0 },
};
if (mobile) {
  Object.assign(S.hero, { cy: 5.6, cz: 7.6, ly: 1.6, sy: 0.36 });
  Object.assign(S.material, { cx: 3.2, cz: 6.4, ly: 1.6, sy: 0.28 });
  Object.assign(S.detail, { cx: -3.4, cz: 3.8, ly: 1.2, sy: 0.26 });
  Object.assign(S.show, { cz: 8.2, ly: 0.9, sy: 0.06 });
}
const cam = { ...S.intro };
let prevState = S.hero;
[['#material', S.material], ['#detail', S.detail], ['#showcase', S.show], ['#provenance', S.out]].forEach(([sel, st]) => {
  gsap.fromTo(cam, { ...prevState }, { ...st, ease: 'none', immediateRender: false, scrollTrigger: { trigger: sel, start: 'top bottom', end: 'top 15%', scrub: 1.2 } });
  prevState = st;
});

const fade = { gl: cfg.video ? 0 : 1, video: 1 };
if (cfg.video) {
  // видео «Лава» растворяется, проявляется 3D
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 20%', scrub: true } })
    .to(fade, { video: 0, gl: 1, ease: 'none' });
}
gsap.to(fade, { gl: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#provenance', start: 'top 90%', end: 'top 30%', scrub: true } });
ScrollTrigger.create({ trigger: '#showcase', start: 'top 55%', end: 'bottom 45%', onToggle: s => { hsLayer.classList.toggle('on', s.isActive); if (!s.isActive) closeCard(); } });

/* ---------- цикл ---------- */
const clock = new THREE.Clock();
const look = new THREE.Vector3(0, 0.6, 0), want = new THREE.Vector3(), wantLook = new THREE.Vector3();
const tmp = new THREE.Vector3(), center = new THREE.Vector3();
const video = document.getElementById('heroVideo');
// iOS в режиме энергосбережения не запускает видео сам — стартуем по первому касанию
if (video) addEventListener('touchstart', () => video.paused && fade.video > 0.01 && video.play().catch(() => {}), { once: true, passive: true });
let autoRot = 0, sx = 0, sy = 0;

function frame() {
  requestAnimationFrame(frame);
  canvas.style.opacity = fade.gl;
  // скрытый канвас не должен держать touch-action: Safari иначе гасит горизонтальные свайпы по всей странице
  const hide = fade.gl < 0.01;
  if (hide !== canvas.hidden) canvas.hidden = hide;
  if (video) {
    video.style.opacity = fade.video;
    if (fade.video < 0.01 && !video.paused) video.pause();
    else if (fade.video > 0.01 && video.paused) video.play().catch(() => {});
  }
  if (fade.gl < 0.01 || !current) return;

  const t = clock.getElapsedTime();
  if (!drag) { vel *= 0.94; userRot += vel; }
  if (!focus) autoRot += 0.0016;
  stage.rotation.y = autoRot + userRot;

  if (focus) { want.copy(focus.pos); wantLook.copy(focus.look); }
  else { want.set(cam.cx, cam.cy, cam.cz); wantLook.set(cam.lx, cam.ly, cam.lz); }
  camera.position.lerp(want, focus ? 0.06 : 0.12);
  look.lerp(wantLook, 0.1);
  camera.lookAt(look);
  sx += ((focus ? 0 : cam.sx) - sx) * 0.08;
  sy += ((focus ? 0 : cam.sy) - sy) * 0.08;
  camera.setViewOffset(innerWidth, innerHeight, -sx * innerWidth, sy * innerHeight, innerWidth, innerHeight);

  const glow = current.userData.glow;
  if (glow) {
    const p = 1.15 + Math.sin(t * 1.3) * 0.35 + Math.sin(t * 3.7) * 0.08;
    glow.emissiveIntensity = p;
    lavaLight.intensity = 4 + p * 2.2;
  } else lavaLight.intensity *= 0.95;
  key.position.x = 1.5 + lightOff.x * 2.2;
  key.position.z = 2.5 + lightOff.y * 1.5;
  rim.position.x = -3 - lightOff.x * 1.5;

  const pa = eGeo.attributes.position.array;
  for (let i = 0; i < EMB; i++) {
    pa[i * 3 + 1] += eSpd[i];
    pa[i * 3] += Math.sin(t + i) * 0.0015;
    if (pa[i * 3 + 1] > 3.6) pa[i * 3 + 1] = 0.9;
  }
  eGeo.attributes.position.needsUpdate = true;

  if (hsLayer.classList.contains('on')) {
    stage.updateMatrixWorld();
    current.getWorldPosition(center);
    const camDir = camera.position.clone().sub(center).setY(0).normalize();
    hsEls.forEach(({ el, v }) => {
      tmp.copy(v);
      current.localToWorld(tmp);
      const facing = tmp.clone().sub(center).setY(0).normalize().dot(camDir);
      tmp.project(camera);
      el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * innerWidth}px,${(-tmp.y * 0.5 + 0.5) * innerHeight}px)`;
      el.classList.toggle('back', facing < -0.25);
    });
  }
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ================= провенанс: кольца + счётчик ================= */
const rc = document.getElementById('rings');
const rx = rc.getContext('2d');
const R = 560, C = 600, rr = rng(77), RINGS = 120;
const shapes = Array.from({ length: RINGS }, (_, i) => {
  const ph = rr() * 6, a1 = rr() * 0.04, a2 = rr() * 0.02;
  return a => 1 + Math.sin(a * 3 + ph) * a1 * (i / RINGS) + Math.sin(a * 7 + ph * 2) * a2;
});
const tones = Array.from({ length: RINGS }, () => rr());
const lavaTex = slabCanvas({ size: 1200, seed: 11, lava: true, tone: 'oak' });

function drawRings(p) {
  rx.clearRect(0, 0, 1200, 1200);
  const n = Math.max(1, Math.floor(p * RINGS));
  const outer = (n / RINGS) * R;
  const g = rx.createRadialGradient(C, C, 0, C, C, outer);
  g.addColorStop(0, '#8a6339'); g.addColorStop(0.7, '#5a3d22'); g.addColorStop(1, '#2c1b0d');
  rx.fillStyle = g;
  rx.beginPath(); rx.arc(C, C, outer, 0, Math.PI * 2); rx.fill();
  for (let i = 0; i < n; i++) {
    const r = ((i + 1) / RINGS) * R, f = shapes[i];
    rx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.04) {
      const d = r * f(a);
      const x = C + Math.cos(a) * d, y = C + Math.sin(a) * d;
      a ? rx.lineTo(x, y) : rx.moveTo(x, y);
    }
    rx.strokeStyle = i === n - 1 ? 'rgba(200,164,93,.95)' : `rgba(20,10,4,${0.18 + tones[i] * 0.3})`;
    rx.lineWidth = i === n - 1 ? 2.5 : i % 6 === 0 ? 1.8 : 0.9;
    rx.stroke();
  }
  rx.lineWidth = 10;
  rx.strokeStyle = '#120a04';
  rx.beginPath(); rx.arc(C, C, outer + 4, 0, Math.PI * 2); rx.stroke();
}

const epochs = [...document.querySelectorAll('.epoch')];
const tl = { p: 0 };
let lastEp = -1;
function renderRings() {
  const rp = Math.min(1, tl.p / 0.85);
  drawRings(rp);
  const lava = Math.max(0, (tl.p - 0.85) / 0.15);
  if (lava > 0) {
    rx.save();
    rx.globalAlpha = lava;
    rx.globalCompositeOperation = 'lighter';
    rx.beginPath(); rx.arc(C, C, R, 0, Math.PI * 2); rx.clip();
    rx.drawImage(lavaTex.emissive, C - R * 1.02, C - R * 1.02, R * 2.04, R * 2.04);
    rx.restore();
  }
  rc.classList.toggle('hot', lava > 0.3);
  const years = Math.round(400000 * (1 - rp));
  document.getElementById('count').textContent = years.toLocaleString('ru-RU');
  document.getElementById('tlBar').style.transform = `scaleX(${rp})`;
  // кольца растут от центра — от древнего к новому
  const ep = years >= 380000 ? 0 : years >= 300000 ? 1 : years >= 12000 ? 2 : years > 2000 ? 3 : 4;
  if (ep !== lastEp) {
    epochs.forEach((e, i) => gsap.to(e, { opacity: i === ep ? 1 : 0, y: i === ep ? 0 : i < ep ? -20 : 20, duration: 0.7, ease: 'expo.out', overwrite: true }));
    lastEp = ep;
  }
}
gsap.to(tl, { p: 1, ease: 'none', onUpdate: renderRings, scrollTrigger: { trigger: '.rings', pin: true, start: 'top top', end: `+=${mobile ? 2000 : 2600}`, scrub: 1 } });
renderRings();

/* ================= манифест, коллекция, гео ================= */
const man = document.getElementById('manifest');
split(man);
gsap.to(man.querySelectorAll('.w'), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: man, start: 'top 80%', end: 'bottom 45%', scrub: true } });
gsap.set(man.querySelectorAll('.w > i'), { y: 0 });

fillTextures(document.getElementById('grid'));
document.querySelectorAll('#filters button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('on', x === b));
  const f = b.dataset.f;
  document.querySelectorAll('#grid .card').forEach(c => c.classList.toggle('hide', f !== 'all' && c.dataset.cat !== f));
  track.scrollTo({ left: 0 });
  carState();
}));
gsap.set('#grid .card', { x: 80, opacity: 0 });
new IntersectionObserver((ents, io) => {
  if (!ents[0].isIntersecting) return;
  gsap.to('#grid .card', { x: 0, opacity: 1, duration: 1.4, stagger: 0.08, ease: 'expo.out' });
  io.disconnect();
}, { threshold: 0.15 }).observe(document.getElementById('grid'));

const track = document.getElementById('grid');
const step = () => (track.querySelector('.card:not(.hide)')?.offsetWidth || 300) + 24;
const carState = () => {
  const max = track.scrollWidth - track.clientWidth;
  const p = max > 0 ? track.scrollLeft / max : 0;
  document.querySelector('.car-bar i').style.transform = `scaleX(${Math.max(0.08, p)})`;
  document.querySelector('.car-prev').disabled = track.scrollLeft < 4;
  document.querySelector('.car-next').disabled = track.scrollLeft > max - 4;
};
document.querySelector('.car-prev').onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
document.querySelector('.car-next').onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });
track.addEventListener('scroll', carState, { passive: true });
addEventListener('resize', carState);
carState();

// перетаскивание мышью; на тач-экранах работает родной свайп
let pull = null;
track.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse') return;
  pull = { x: e.clientX, left: track.scrollLeft, moved: false };
  track.classList.add('drag');
});
addEventListener('pointermove', e => {
  if (!pull) return;
  const dx = e.clientX - pull.x;
  if (Math.abs(dx) > 5) pull.moved = true;
  track.scrollLeft = pull.left - dx;
});
addEventListener('pointerup', () => {
  if (!pull) return;
  track.classList.remove('drag');
  if (pull.moved) track.addEventListener('click', e => e.preventDefault(), { capture: true, once: true });
  pull = null;
});
addEventListener('pointercancel', () => { if (pull) { track.classList.remove('drag'); pull = null; } });

const mq = document.getElementById('mq');
mq.innerHTML += mq.innerHTML;
gsap.to(mq, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });

reveals();

/* ================= старт ================= */
gsap.timeline()
  .to('.loader-mono', { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power3.inOut' })
  .fromTo('.loader-name', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, '-=.3')
  .fromTo('.loader .loader-slogan', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, '-=.7');

await setModel('lava');
frame();
const ld = { p: 0 };
gsap.to(ld, {
  p: 1, duration: 2.8, ease: 'power2.inOut',
  onUpdate: () => (document.querySelector('.loader-bar i').style.transform = `scaleX(${ld.p})`),
  onComplete: () => {
    gsap.timeline()
      .to('#loader', { opacity: 0, duration: 1.1, ease: 'power2.inOut', onComplete: () => { document.getElementById('loader').remove(); document.body.classList.remove('loading'); lenis.start(); } })
      .to(cam, { ...S.hero, duration: 3.2, ease: 'expo.inOut' }, '<')
      .to('.hero .split .w > i', { y: 0, duration: 1.6, stagger: 0.08, ease: 'expo.out' }, '-=1.8')
      .from('.hero .eyebrow, .hero .lead, .hero .ctas, .scroll-hint, .hdr > *', { opacity: 0, y: 20, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, '-=1.2');
  },
});
