import * as THREE from 'three';
import { OrbitControls } from 'three/jsm/controls/OrbitControls.js';

// форма по кадрам видео: верх со скруглёнными плечами, максимум ширины на линии стойки, круглое дно
const H = 1.8, R = 0.78, SEAM = 0.43 * H;
const AX = 0.46;
const DEPTH = 0.6;
const LIFT = 0.33;
const WING = THREE.MathUtils.degToRad(65);
const GAP = THREE.MathUtils.degToRad(1.4);
const prof = [];
for (let i = 0; i <= 120; i++) {
  const y = H * i / 120, u = (H - y) / H;
  let r;
  if (u <= 0.57) {
    const t = 0.85 * (1 - u / 0.57);
    r = R * Math.sqrt(1 - t * t);
  } else {
    const v = (u - 0.57) / 0.43;
    r = R * Math.max(1 - v ** 2.2, 0) ** (1 / 2.2);
  }
  prof.push([y, r]);
}
prof[prof.length - 1][1] = 0;
const rAt = y => {
  if (y <= 0 || y >= H) return 0;
  for (let i = 1; i < prof.length; i++) {
    const [y1, r1] = prof[i];
    if (y <= y1) {
      const [y0, r0] = prof[i - 1];
      return r0 + (r1 - r0) * (y - y0) / (y1 - y0);
    }
  }
  return 0;
};
const pts = prof.map(([y, r]) => new THREE.Vector2(Math.max(r, 0.0005), y));
const part = (y0, y1) => {
  const a = pts.filter(p => p.y > y0 && p.y < y1);
  return [new THREE.Vector2(Math.max(rAt(y0), 0.0005), y0), ...a, new THREE.Vector2(Math.max(rAt(y1), 0.0005), y1)];
};

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#3b342e');
const pmrem = new THREE.PMREMGenerator(renderer);
{
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }));
  const pos = room.geometry.attributes.position, col = [];
  const top = new THREE.Color('#887c6e'), mid = new THREE.Color('#5c5148'), bot = new THREE.Color('#1c1814');
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 10;
    const c = t > 0 ? mid.clone().lerp(top, t) : mid.clone().lerp(bot, -t * 1.6);
    col.push(c.r, c.g, c.b);
  }
  room.geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const strip = new THREE.Mesh(new THREE.TorusGeometry(8, 0.25, 8, 64), new THREE.MeshBasicMaterial({ color: '#fff6ea' }));
  strip.rotation.x = Math.PI / 2;
  strip.position.y = 2.2;
  env.add(room, strip);
  scene.environment = pmrem.fromScene(env, 0.01).texture;
}

const cam = new THREE.PerspectiveCamera(50, 1, 0.05, 50);
const controls = new OrbitControls(cam, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.4;
controls.maxDistance = 8;
controls.maxPolarAngle = Math.PI * 0.56;
const front = () => {
  cam.position.set(0, 1.4, innerWidth < 760 ? 5.2 : 4.2);
  controls.target.set(0, LIFT + 0.95, 0.4);
};
front();

scene.add(new THREE.HemisphereLight('#f3e9dd', '#1b1510', 1.3));
const spot = new THREE.SpotLight('#fff0dc', 30, 6, 0.7, 0.8, 1.5);
spot.position.set(0, LIFT + H + 0.35, 0.6);
spot.target.position.set(0, LIFT + H * 0.5, 0.5);
scene.add(spot, spot.target);

const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), new THREE.MeshStandardMaterial({ color: '#6e6256', roughness: 0.95 }));
wall.position.set(0, 3, 0);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#2a241f', roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2;
const cove = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.03), new THREE.MeshBasicMaterial({ color: '#fff3e2' }));
cove.position.set(0, LIFT + H - 0.37, 0.003);
scene.add(wall, floor, cove);

const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
const chrome = new THREE.MeshStandardMaterial({ color: '#d9dadd', metalness: 1, roughness: 0.04, envMapIntensity: 1.3, clippingPlanes: [clip] });
const ply = { color: new THREE.Color('#c9a27a'), metalness: 0, roughness: 0.7 };
const mirror = { color: chrome.color.clone(), metalness: 1, roughness: 0.08 };
const burgundy = new THREE.MeshStandardMaterial({ color: '#4a0818', emissive: '#2a030c', emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2, side: THREE.BackSide, clippingPlanes: [clip] });
const darkIn = new THREE.MeshStandardMaterial({ color: '#3a0612', emissive: '#5a0a1e', emissiveIntensity: 0.5, roughness: 0.5, side: THREE.BackSide, clippingPlanes: [clip] });
const pink = new THREE.MeshStandardMaterial({ color: '#2a0410', emissive: '#ff3c6e', emissiveIntensity: 1.25, roughness: 0.9 });
const red = new THREE.MeshStandardMaterial({ color: '#2b030b', emissive: '#a5112f', emissiveIntensity: 0.9, roughness: 0.9 });
const frameMat = new THREE.MeshStandardMaterial({ color: '#1a1416', metalness: 0.8, roughness: 0.25 });
const wood = new THREE.MeshStandardMaterial({ color: '#c7884a', emissive: '#4a2208', emissiveIntensity: 0.4, roughness: 0.4 });
const glass = new THREE.MeshStandardMaterial({ color: '#2a160e', roughness: 0.1, metalness: 0.2 });

const egg = new THREE.Group();
egg.position.set(0, LIFT, AX);
scene.add(egg);

const shell = (y0, y1, p0, len, inner = burgundy) => {
  const g = new THREE.LatheGeometry(part(y0, y1), 128, p0, len).scale(1, 1, DEPTH);
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, chrome), new THREE.Mesh(g, inner));
  return grp;
};

egg.add(shell(0, SEAM, 0, Math.PI * 2, darkIn));
const CROWN = H * 119 / 120;
egg.add(shell(SEAM, CROWN, WING, Math.PI * 2 - 2 * WING, darkIn));
egg.add(shell(CROWN, H, 0, Math.PI * 2, darkIn));

// контур дверцы на чаше
{
  const hw = 0.33, y0 = 0.09, y1 = 0.64;
  const on = (x, y) => new THREE.Vector3(x, y, DEPTH * Math.sqrt(Math.max(rAt(y) ** 2 - x * x, 0)) + 0.002);
  const p = [];
  for (let i = 0; i <= 20; i++) p.push(on(-hw + 2 * hw * i / 20, y1));
  for (let i = 0; i <= 20; i++) p.push(on(hw, y1 - (y1 - y0) * i / 20));
  for (let i = 0; i <= 20; i++) p.push(on(hw - 2 * hw * i / 20, y0));
  for (let i = 0; i <= 20; i++) p.push(on(-hw, y0 + (y1 - y0) * i / 20));
  egg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: '#111' })));
}

// стойка с круглой вставкой
{
  const s = new THREE.Shape();
  s.absarc(0, 0, rAt(SEAM) + 0.015, 0, Math.PI * 2);
  const top = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false, curveSegments: 96 }), frameMat);
  top.rotation.x = -Math.PI / 2;
  top.scale.y = DEPTH;
  top.position.y = SEAM - 0.035;
  const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.004, 64), wood);
  ins.position.set(0, SEAM + 0.002, 0.25);
  egg.add(top, ins);
}

// портал ниши
let pl;
const ZP = 0.18;
const hwAt = y => rAt(y) * Math.sqrt(Math.max(1 - (ZP / (DEPTH * rAt(y) + 1e-6)) ** 2, 0));
{
  const yT = H - 0.06, yShelf = H - 0.46, yBand = H - 0.56;
  const outer = new THREE.Shape();
  const ys = [];
  for (let y = SEAM; y <= yT; y += 0.02) ys.push(y);
  ys.forEach((y, i) => (i ? outer.lineTo(hwAt(y) - 0.004, y) : outer.moveTo(hwAt(y) - 0.004, y)));
  [...ys].reverse().forEach(y => outer.lineTo(-hwAt(y) + 0.004, y));
  const rr = (x0, y0, x1, y1, r) => {
    const p = new THREE.Path();
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
    p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1); p.lineTo(x0 + r, y1);
    p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
    return p;
  };
  const wUp = Math.min(hwAt(yT - 0.05), hwAt(yShelf)) - 0.025;
  const wLo = hwAt(SEAM + 0.15) - 0.06;
  outer.holes.push(rr(-wUp, yShelf, wUp, yT - 0.02, 0.07));
  outer.holes.push(rr(-wLo, SEAM + 0.005, wLo, yBand, 0.05));
  const portal = new THREE.Mesh(new THREE.ShapeGeometry(outer, 24), new THREE.MeshStandardMaterial({ color: '#2a0a12', roughness: 0.4, metalness: 0.3 }));
  portal.position.z = ZP;
  egg.add(portal);

  const back = (x0, y0, x1, y1, m) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, -0.02);
    egg.add(b);
  };
  back(-wUp, yShelf, wUp, yT, pink);
  back(-wLo, SEAM, wLo, yBand, red);

  const bh = yBand - SEAM, yb = SEAM + bh * 0.55;
  const m = new THREE.Shape();
  m.moveTo(-wLo, SEAM);
  m.lineTo(-wLo, yb);
  m.lineTo(-0.42, yb);
  m.bezierCurveTo(-0.25, yb, -0.25, yBand - 0.01, -0.12, yBand - 0.01);
  m.lineTo(0.12, yBand - 0.01);
  m.bezierCurveTo(0.25, yBand - 0.01, 0.25, yb, 0.42, yb);
  m.lineTo(wLo, yb);
  m.lineTo(wLo, SEAM);
  const hill = new THREE.Mesh(new THREE.ShapeGeometry(m, 24), pink);
  hill.position.z = -0.015;
  egg.add(hill);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(wUp * 2, 0.025, 0.18), frameMat);
  shelf.position.set(0, yShelf, 0.07);
  egg.add(shelf);
  [[-0.07, 0.07], [0, 0.16], [0.07, 0.07]].forEach(([x, h]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, h, 20), glass);
    b.position.set(x, yShelf + h / 2 + 0.012, 0.1);
    egg.add(b);
  });
  [[-0.48, 0.1], [-0.36, 0.13], [0.4, 0.2], [0.5, 0.12]].forEach(([x, h]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, h, 20), glass);
    b.position.set(x, SEAM + h / 2, 0.15);
    egg.add(b);
  });
  pl = new THREE.PointLight('#ff4d7a', 2.5, 1.6, 1.5);
  pl.position.set(0, (SEAM + yT) / 2, 0.15);
  egg.add(pl);
}

// крылья: поворот вокруг наружной кромки (от верхнего угла к стойке), ложатся по бокам изнанкой вперёд
const cfg = { open: 125, tilt: 0.3 };
const wings = [];
const buildWings = () => {
  for (const w of wings) egg.remove(w.pivot);
  wings.length = 0;
  for (const sx of [1, -1]) {
    const g = sx > 0 ? shell(SEAM, CROWN, GAP, WING - GAP) : shell(SEAM, CROWN, Math.PI * 2 - WING, WING - GAP);
    const edge = y => new THREE.Vector3(sx * rAt(y) * Math.sin(WING), y, DEPTH * rAt(y) * Math.cos(WING));
    const a = edge(CROWN), b = edge(SEAM);
    b.x = a.x + (b.x - a.x) * cfg.tilt;
    const axis = a.clone().sub(b).normalize();
    const pivot = new THREE.Group();
    pivot.position.copy(a);
    g.position.copy(a).negate();
    pivot.add(g);
    egg.add(pivot);
    const mid = new THREE.Vector3(sx * 0.15, (SEAM + H) / 2, DEPTH * rAt((SEAM + H) / 2)).sub(a);
    const dir = mid.clone().applyAxisAngle(axis, Math.PI / 2).x * sx > mid.clone().applyAxisAngle(axis, -Math.PI / 2).x * sx ? 1 : -1;
    wings.push({ pivot, axis, dir });
  }
};
buildWings();

let cur = 0, target = 0;
const setOpen = e => {
  pl.intensity = 0.4 + 2.2 * e;
  for (const w of wings) w.pivot.quaternion.setFromAxisAngle(w.axis, w.dir * THREE.MathUtils.degToRad(cfg.open) * e);
};
window.eggOpen = v => { buildWings(); cur = target = v; setOpen(v); };
window.eggCfg = cfg;

const btn = id => document.getElementById(id);
btn('open').onclick = () => {
  target = target ? 0 : 1;
  btn('open').classList.toggle('on', !!target);
  btn('open').textContent = target ? 'Закрыть' : 'Открыть';
};
btn('finish').onclick = () => {
  const on = !btn('finish').classList.toggle('on');
  const m = on ? ply : mirror;
  chrome.color.copy(m.color);
  chrome.metalness = m.metalness;
  chrome.roughness = m.roughness;
  btn('finish').textContent = on ? 'Фанера' : 'Зеркало';
};
let cutOn = false;
btn('cut').onclick = () => {
  cutOn = !cutOn;
  btn('cut').classList.toggle('on', cutOn);
  clip.constant = cutOn ? AX + 0.15 : 10;
};
btn('reset').onclick = front;

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
btn('load').classList.add('done');

renderer.setAnimationLoop(() => {
  cur += (target - cur) * 0.04;
  setOpen(cur * cur * (3 - 2 * cur));
  controls.update();
  renderer.render(scene, cam);
});
