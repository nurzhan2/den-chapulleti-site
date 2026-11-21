import { slabCanvas, plankCanvas } from './wood.js';

gsap.registerPlugin(ScrollTrigger);

/* ---------- плавный скролл ---------- */
export const lenis = new Lenis({ lerp: 0.085 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.lenis = lenis;

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"], a[href^="/#"]');
  if (!a) return;
  const hash = a.getAttribute('href').replace(/^\//, '');
  if (a.getAttribute('href').startsWith('/#') && location.pathname !== '/') return;
  const el = document.querySelector(hash);
  if (!el) return;
  e.preventDefault();
  lenis.scrollTo(el, { duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) });
});

ScrollTrigger.create({ start: 60, onToggle: s => document.getElementById('hdr').classList.toggle('scrolled', s.isActive) });

/* ---------- RU / EN ---------- */
const textEls = () => document.querySelectorAll('[data-en], [data-en-html]');
let lang = 'ru';

export function setLang(l) {
  lang = l;
  textEls().forEach(el => {
    const html = el.hasAttribute('data-en-html');
    if (!('ru' in el.dataset)) el.dataset.ru = html ? el.innerHTML : el.textContent;
    const val = l === 'en' ? (html ? el.dataset.enHtml : el.dataset.en) : el.dataset.ru;
    if (!val) return;
    if (html) el.innerHTML = val; else el.textContent = val;
  });
  document.documentElement.lang = l;
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  try { localStorage.setItem('lang', l); } catch {}
  document.dispatchEvent(new CustomEvent('lang', { detail: l }));
  ScrollTrigger.refresh();
}
export const getLang = () => lang;

document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
let saved = new URLSearchParams(location.search).get('lang');
try { saved = saved || localStorage.getItem('lang'); } catch {}

/* ---------- разбивка заголовков на слова ---------- */
export function split(el) {
  if (!('ru' in el.dataset) && (el.dataset.en || el.dataset.enHtml)) el.dataset.ru = el.innerHTML;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(' ');
        const w = document.createElement('span');
        w.className = 'w';
        const i = document.createElement('i');
        i.textContent = part;
        w.append(i);
        frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(el);
}

// при смене языка заголовок перерисовываем и сразу показываем
document.addEventListener('lang', () => {
  document.querySelectorAll('.split, .big').forEach(el => {
    split(el);
    gsap.set(el.querySelectorAll('.w > i'), { y: 0 });
    gsap.set(el.querySelectorAll('.w'), { opacity: 1 });
  });
});

/* ---------- текстуры-заглушки до получения фото ---------- */
export function fillTextures(root = document) {
  root.querySelectorAll('img[data-tex]:not([src])').forEach(img => {
    const t = JSON.parse(img.dataset.tex);
    const c = t.kind === 'slab'
      ? slabCanvas({ size: 900, seed: t.seed, lava: t.lava, tone: t.tone }).map
      : plankCanvas({ w: 800, h: 1000, seed: t.seed, tone: t.tone, resin: t.resin });
    img.src = c.toDataURL('image/jpeg', 0.84);
  });
}

/* ---------- тосты ---------- */
const toastEl = document.getElementById('toast');
let tt;
export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(tt);
  tt = setTimeout(() => toastEl.classList.remove('on'), 3400);
}

/* ---------- AR ---------- */
export async function openAR(glb) {
  if (!glb) {
    toast(lang === 'en'
      ? 'AR try-on will be enabled once the 3D models of the pieces are uploaded'
      : 'AR-примерка включится после загрузки 3D-моделей изделий');
    return;
  }
  if (!customElements.get('model-viewer')) {
    await import('https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js');
  }
  const m = document.createElement('div');
  m.className = 'ar-modal';
  const usdz = glb.replace(/\.glb$/i, '.usdz');
  m.innerHTML = `<button class="hs-x" aria-label="Закрыть">×</button>
    <model-viewer src="${glb}" ios-src="${usdz}" ar ar-modes="webxr scene-viewer quick-look" camera-controls auto-rotate shadow-intensity="1" exposure="1.1"></model-viewer>`;
  document.body.append(m);
  m.querySelector('.hs-x').onclick = () => m.remove();
  const mv = m.querySelector('model-viewer');
  mv.addEventListener('load', () => { if (mv.canActivateAR) mv.activateAR(); }, { once: true });
}

/* ---------- форма заявки ---------- */
const utm = {};
const qs = new URLSearchParams(location.search);
['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'].forEach(k => {
  if (qs.get(k)) utm[k] = qs.get(k);
});
try {
  if (Object.keys(utm).length) sessionStorage.setItem('utm', JSON.stringify(utm));
  else Object.assign(utm, JSON.parse(sessionStorage.getItem('utm') || '{}'));
} catch {}

document.querySelectorAll('.lead-form').forEach(f => {
  const msg = f.querySelector('.form-msg');
  f.addEventListener('submit', async e => {
    e.preventDefault();
    let bad = false;
    f.querySelectorAll('[required]').forEach(i => {
      const empty = !i.value.trim();
      i.closest('.field').classList.toggle('err', empty);
      bad ||= empty;
    });
    if (bad) return;
    const data = Object.fromEntries(new FormData(f));
    const btn = f.querySelector('.btn');
    btn.disabled = true;
    let ok = false;
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, exhibit: f.dataset.exhibit || window.currentModel || '', page: location.pathname, utm }),
      });
      ok = r.ok;
    } catch {}
    btn.disabled = false;
    const k = (ok ? 'ok' : 'err') + (lang === 'en' ? 'En' : '');
    msg.textContent = msg.dataset[k];
    if (ok) {
      gsap.to(f.querySelectorAll('.field, .btn'), { opacity: 0, y: -10, stagger: 0.05, duration: 0.4, onComplete: () => f.querySelectorAll('.field, .btn').forEach(x => (x.style.display = 'none')) });
      gsap.from(msg, { opacity: 0, y: 16, duration: 1, delay: 0.3 });
      window.ym?.(window.YM_ID, 'reachGoal', 'lead');
    }
  });
});

/* ---------- общие появления ---------- */
export function reveals() {
  document.querySelectorAll('.split').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(el.querySelectorAll('.w > i'), { y: 0, duration: 1.3, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  gsap.utils.toArray('.audit-box, .mark, .arch-list li, .files span, .geo-list li, .ex-story p').forEach(el => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  document.querySelectorAll('[data-count]').forEach(el => {
    const o = { v: 0 }, to = +el.dataset.count;
    gsap.to(o, { v: to, duration: 2.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' }, onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('ru-RU')) });
  });
}

document.querySelectorAll('.split').forEach(split);
if (saved === 'en') setLang('en');
