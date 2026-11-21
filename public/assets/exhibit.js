import { fillTextures, reveals, openAR } from './common.js';

fillTextures();
reveals();

const main = document.getElementById('exMain');
const thumbs = document.getElementById('exThumbs');

if (main) {
  const items = [...main.children];
  let cur = 0;
  const show = i => {
    cur = i;
    items.forEach((el, j) => el.classList.toggle('on', i === j));
    [...thumbs.children].forEach((b, j) => b.classList.toggle('on', i === j));
    items.forEach(el => el.tagName === 'VIDEO' && (el.classList.contains('on') ? el.play() : el.pause()));
  };
  const paint = () => items.forEach((el, i) => {
    const b = thumbs.children[i];
    if (el.tagName === 'IMG' && el.src) b.style.backgroundImage = `url("${el.src}")`;
  });
  items.forEach((el, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Фото ${i + 1}`);
    if (el.tagName === 'VIDEO') b.textContent = '▶';
    b.onclick = () => show(i);
    thumbs.append(b);
  });
  paint();
  if (items.length < 2) thumbs.remove();
  show(0);

  // свайп по фото на телефоне
  let x0 = null;
  main.addEventListener('touchstart', e => (x0 = e.touches[0].clientX), { passive: true });
  main.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) {
      show((cur + (dx < 0 ? 1 : -1) + items.length) % items.length);
    }
    x0 = null;
  });

  gsap.from('.ex-main', { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.out' });
  gsap.from('.ex-info > *', { y: 30, opacity: 0, duration: 1.2, stagger: 0.07, ease: 'expo.out', delay: 0.2 });
}

document.querySelectorAll('[data-ar]').forEach(b => b.addEventListener('click', () => openAR(b.dataset.glb)));
