const http = require('http');
const fs = require('fs');
const path = require('path');
const { exhibits } = require('./data/exhibits');
const views = require('./views');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const NM = path.join(__dirname, 'node_modules');

const vendor = {
  '/vendor/three.module.min.js': 'three/build/three.module.min.js',
  '/vendor/gsap.min.js': 'gsap/dist/gsap.min.js',
  '/vendor/ScrollTrigger.min.js': 'gsap/dist/ScrollTrigger.min.js',
  '/vendor/lenis.min.js': 'lenis/dist/lenis.min.js',
};

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary',
  '.usdz': 'model/vnd.usdz+zip', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};

// старые ссылки на прототипы концепций
const legacy = ['/01-muzey-3d', '/02-svet-iz-temnoty', '/03-letopis-dereva', '/index.html'];

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers.host}`;
}

function send(res, code, body, type = 'text/html; charset=utf-8', extra = {}) {
  res.writeHead(code, { 'Content-Type': type, ...extra });
  res.end(body);
}

function sendFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, views.notFound(siteUrl(req)));
    const type = mime[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const cache = file.includes(`${path.sep}media${path.sep}`) || file.startsWith(NM) ? 'public, max-age=604800' : 'public, max-age=300';
    const range = req.headers.range;
    if (range && type.startsWith('video/')) {
      const [a, b] = range.replace('bytes=', '').split('-');
      const start = +a, end = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': cache });
    fs.createReadStream(file).pipe(res);
  });
}

// ---------- заявки ----------
const hits = new Map();

function readBody(req) {
  return new Promise((ok, fail) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 2e4) req.destroy(); });
    req.on('end', () => ok(data));
    req.on('error', fail);
  });
}

function leadText(l) {
  const rows = [
    '🪵 Заявка с сайта DEN CHAPULLETI',
    `Имя / бюро: ${l.name}`,
    `Контакт: ${l.contact}`,
    l.location && `Локация: ${l.location}`,
    l.exhibit && `Экспонат: ${l.exhibit}`,
    l.page && `Страница: ${l.page}`,
  ];
  const utm = Object.entries(l.utm || {}).map(([k, v]) => `${k}=${v}`).join(', ');
  if (utm) rows.push(`UTM: ${utm}`);
  return rows.filter(Boolean).join('\n');
}

async function deliver(text) {
  const jobs = [];
  const { TG_BOT_TOKEN, TG_CHAT_ID, MAX_BOT_TOKEN, MAX_CHAT_ID } = process.env;
  if (TG_BOT_TOKEN && TG_CHAT_ID) {
    jobs.push(fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text }),
    }));
  }
  if (MAX_BOT_TOKEN && MAX_CHAT_ID) {
    jobs.push(fetch(`https://platform-api.max.ru/messages?chat_id=${MAX_CHAT_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: MAX_BOT_TOKEN },
      body: JSON.stringify({ text }),
    }));
  }
  const res = await Promise.allSettled(jobs);
  return res.some(r => r.status === 'fulfilled' && r.value.ok);
}

async function lead(req, res) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
  const now = Date.now();
  const last = (hits.get(ip) || []).filter(t => now - t < 10 * 60e3);
  if (last.length >= 5) return send(res, 429, '{"ok":false}', 'application/json');
  hits.set(ip, [...last, now]);

  let l;
  try { l = JSON.parse(await readBody(req)); } catch { return send(res, 400, '{"ok":false}', 'application/json'); }
  if (l.website) return send(res, 200, '{"ok":true}', 'application/json'); // honeypot
  const clip = s => String(s || '').trim().slice(0, 300);
  l = { name: clip(l.name), contact: clip(l.contact), location: clip(l.location), exhibit: clip(l.exhibit), page: clip(l.page), utm: l.utm || {} };
  if (!l.name || !l.contact) return send(res, 400, '{"ok":false}', 'application/json');

  const text = leadText(l);
  fs.appendFile(path.join(__dirname, 'leads.log'), JSON.stringify({ at: new Date().toISOString(), ...l }) + '\n', () => {});
  const sent = await deliver(text).catch(() => false);
  if (!sent) console.log('[lead]', text.replace(/\n/g, ' | '));
  send(res, 200, '{"ok":true}', 'application/json');
}

// ---------- роутинг ----------
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  const base = siteUrl(req);

  if (req.method === 'POST' && p === '/api/lead') return lead(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, '');

  if (p === '/') return send(res, 200, views.home(base));
  if (legacy.includes(p.replace(/\.html$/, '')) || legacy.includes(p)) return send(res, 301, '', 'text/plain', { Location: '/' });

  const m = p.match(/^\/exhibits\/([a-z0-9-]+)$/);
  if (m) {
    const ex = exhibits.find(e => e.slug === m[1]);
    return ex ? send(res, 200, views.exhibit(ex, base)) : send(res, 404, views.notFound(base));
  }

  if (p === '/bar') return sendFile(req, res, path.join(PUB, 'bar.html'));
  if (p === '/robots.txt') {
    return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`, 'text/plain; charset=utf-8');
  }
  if (p === '/sitemap.xml') {
    const urls = ['/', ...exhibits.map(e => `/exhibits/${e.slug}`)];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(u => `  <url><loc>${base}${u}</loc><changefreq>weekly</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`)
      .join('\n')}\n</urlset>\n`;
    return send(res, 200, xml, 'application/xml; charset=utf-8');
  }

  if (vendor[p]) return sendFile(req, res, path.join(NM, vendor[p]));
  if (p.startsWith('/vendor/jsm/')) {
    const f = path.normalize(path.join(NM, 'three/examples/jsm', p.slice(12)));
    return f.startsWith(path.join(NM, 'three/examples/jsm')) ? sendFile(req, res, f) : send(res, 403, '');
  }

  if (p.startsWith('/fonts/')) {
    const root = path.join(NM, '@fontsource');
    const f = path.normalize(path.join(root, p.slice(7)));
    return f.startsWith(root) ? sendFile(req, res, f) : send(res, 403, '');
  }

  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB)) return send(res, 403, '');
  sendFile(req, res, file);
}).listen(PORT, () => console.log(`DEN CHAPULLETI on :${PORT}`));
