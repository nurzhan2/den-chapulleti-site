// Процедурная генерация текстур дерева (до получения реальных фото/моделей)
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function noise1(r, n) {
  const pts = Array.from({ length: n }, () => r());
  return (t) => {
    const x = ((t % 1) + 1) % 1 * n;
    const i = Math.floor(x), f = x - i;
    const a = pts[i % n], b = pts[(i + 1) % n];
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  };
}

// Поперечный спил: годовые кольца, трещины, кора, опционально — «лава» (светящийся полимер)
export function slabCanvas({ size = 1024, seed = 7, lava = false, tone = 'oak', bark = true } = {}) {
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const cx = size / 2, cy = size / 2, R = size * 0.49;
  const pal = {
    oak: ['#6b4a2b', '#4a3019', '#2a1a0d', '#8a6339'],
    walnut: ['#4b3021', '#2e1b12', '#170d08', '#6e4a33'],
    poplar: ['#a08868', '#7a6247', '#4a3a28', '#c4ab86'],
    mahogany: ['#6d2f1c', '#4a1d10', '#260d06', '#8f4429'],
  }[tone];

  // фон-диск
  const grd = g.createRadialGradient(cx, cy, 0, cx, cy, R);
  grd.addColorStop(0, pal[3]);
  grd.addColorStop(0.6, pal[0]);
  grd.addColorStop(1, pal[1]);
  g.fillStyle = grd;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();

  // кольца
  const wob = noise1(r, 24), wob2 = noise1(r, 9);
  const rings = 140;
  for (let k = 1; k < rings; k++) {
    const rr = (k / rings) * R * 0.94;
    g.beginPath();
    for (let a = 0; a <= 360; a += 2) {
      const t = a / 360;
      const d = rr * (1 + (wob(t) - 0.5) * 0.09 * (k / rings) + (wob2(t + k * 0.003) - 0.5) * 0.03);
      const x = cx + Math.cos(t * Math.PI * 2) * d, y = cy + Math.sin(t * Math.PI * 2) * d;
      a ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
    g.strokeStyle = k % 5 === 0 ? 'rgba(20,10,4,0.55)' : 'rgba(30,16,6,' + (0.12 + r() * 0.2) + ')';
    g.lineWidth = k % 5 === 0 ? 1.6 : 0.8 + r();
    g.stroke();
  }

  // волокно-шум
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 18;
    d[i] += n; d[i + 1] += n * 0.8; d[i + 2] += n * 0.6;
  }
  g.putImageData(img, 0, 0);

  // трещины / каналы
  const em = document.createElement('canvas');
  em.width = em.height = size;
  const e = em.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, size, size);
  const cracks = lava ? 9 : 4;
  for (let i = 0; i < cracks; i++) {
    const a0 = (i / cracks) * Math.PI * 2 + r() * 0.4;
    const pts = [];
    let rad = R * (0.06 + r() * 0.1), a = a0;
    while (rad < R * 0.97) {
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      rad += R * 0.03; a += (r() - 0.5) * 0.07;
    }
    const w = lava ? 2.5 + r() * 6 : 1.5 + r() * 2;
    const draw = (ctx, color, lw, blur) => {
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = blur;
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.stroke(); ctx.restore();
    };
    if (lava) {
      draw(g, '#d9561c', w, 18);
      draw(g, '#ffa04a', w * 0.4, 6);
      draw(e, '#c2400e', w * 1.5, 26);
      draw(e, '#ff8a35', w * 0.5, 8);
    } else {
      draw(g, 'rgba(10,5,2,0.85)', w, 0);
    }
  }
  if (lava) {
    // центральное ядро
    [[g, 1], [e, 1.4]].forEach(([ctx, m]) => {
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.1 * m);
      cg.addColorStop(0, 'rgba(255,170,90,0.85)');
      cg.addColorStop(0.4, 'rgba(255,110,30,0.6)');
      cg.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R * 0.1 * m, 0, Math.PI * 2); ctx.fill();
    });
  }

  // кора
  if (bark) {
    g.save();
    g.lineWidth = size * 0.022;
    g.strokeStyle = '#140b05';
    g.beginPath();
    for (let a = 0; a <= 360; a += 1) {
      const t = a / 360, d2 = R * (0.985 + (wob(t * 3) - 0.5) * 0.02);
      const x = cx + Math.cos(t * Math.PI * 2) * d2, y = cy + Math.sin(t * Math.PI * 2) * d2;
      a ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke(); g.restore();
  }
  return { map: c, emissive: em };
}

// Продольная доска / слэб с живым краем — для карточек галереи
export function plankCanvas({ w = 800, h = 1000, seed = 3, tone = 'oak', resin = false } = {}) {
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const pal = {
    oak: ['#5c3f24', '#3b2615', '#7d5834'],
    walnut: ['#3c2618', '#20130b', '#5b3b27'],
    poplar: ['#8f7759', '#5e4a33', '#b39a76'],
    mahogany: ['#5e2617', '#35130a', '#7d3a23'],
    elm: ['#6a4c2c', '#3d2a17', '#93704a'],
  }[tone];
  const lg = g.createLinearGradient(0, 0, w, 0);
  lg.addColorStop(0, pal[1]); lg.addColorStop(0.5, pal[2]); lg.addColorStop(1, pal[0]);
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
  // широкие цветовые полосы (годовые слои вдоль доски)
  for (let i = 0; i < 26; i++) {
    const x = r() * w, bw = 10 + r() * 60;
    g.fillStyle = r() > 0.5 ? 'rgba(255,220,170,' + (0.03 + r() * 0.06) + ')' : 'rgba(10,5,2,' + (0.05 + r() * 0.1) + ')';
    g.beginPath();
    for (let y = 0; y <= h; y += 20) g.lineTo(x + Math.sin(y / 260 + i) * 14, y);
    for (let y = h; y >= 0; y -= 20) g.lineTo(x + bw + Math.sin(y / 260 + i) * 14, y);
    g.fill();
  }
  const n = noise1(r, 6);
  for (let i = 0; i < 110; i++) {
    const x0 = r() * w, ph = r() * 6, amp = 4 + r() * 10;
    g.beginPath();
    for (let y = 0; y <= h; y += 10) {
      const x = x0 + Math.sin(y / 220 + ph) * amp + (n(y / h * 0.5 + i * 0.03) - 0.5) * 22;
      y ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = 'rgba(15,8,3,' + (0.1 + r() * 0.25) + ')';
    g.lineWidth = 0.5 + r() * 1.6;
    g.stroke();
  }
  // свили / сучки
  for (let k = 0; k < 3; k++) {
    const x = r() * w, y = r() * h, s = 18 + r() * 40;
    for (let j = 8; j > 0; j--) {
      g.beginPath(); g.ellipse(x, y, s * j / 6, s * j / 12, 0, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(20,10,4,0.25)'; g.lineWidth = 1.5; g.stroke();
    }
  }
  if (resin) {
    g.save();
    g.shadowColor = '#e8a64a'; g.shadowBlur = 40;
    g.strokeStyle = 'rgba(232,166,74,0.85)'; g.lineWidth = 10;
    g.beginPath();
    let x = w * (0.35 + r() * 0.3);
    for (let y = 0; y <= h; y += 20) { x += (r() - 0.5) * 30; y ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.restore();
  }
  // виньетка «свет из темноты»
  const vg = g.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  return c;
}
