import { fillTextures, reveals } from './common.js';

fillTextures();
reveals();

// мягкий световой блик за курсором на карточках пород
document.querySelectorAll('.wood').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}));
