const fs = require('fs');
const path = require('path');
const { exhibits, cats, sections } = require('./data/exhibits');
const contacts = require('./data/contacts');

const MEDIA = path.join(__dirname, 'public', 'media');
const IMG = /\.(jpe?g|png|webp|avif)$/i;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const en = s => ` data-en="${esc(s)}"`;
const enh = s => ` data-en-html="${esc(s)}"`;

function ls(dir, re) {
  try { return fs.readdirSync(path.join(MEDIA, dir)).filter(f => re.test(f)).sort(); } catch { return []; }
}
const has = f => fs.existsSync(path.join(MEDIA, f));

const photos = slug => ls(`exhibits/${slug}`, IMG).map(f => `/media/exhibits/${slug}/${f}`);
const videoOf = slug => ls(`exhibits/${slug}`, /\.mp4$/i).map(f => `/media/exhibits/${slug}/${f}`)[0];
const models = () => Object.fromEntries(ls('models', /\.glb$/i).map(f => [f.replace(/\.glb$/i, ''), `/media/models/${f}`]));

const statusLabel = s => s === 'production'
  ? `<span class="chip chip-res"${en('In production · Reservations open')}>В производстве · Открыта бронь</span>`
  : `<span class="chip"${en('In the collection')}>В коллекции</span>`;

function texAttr(ex) { return esc(JSON.stringify(ex.tex)); }

function cover(ex, cls = '') {
  const ph = photos(ex.slug)[0];
  return ph
    ? `<img class="${cls}" src="${ph}" alt="${esc(ex.title)}" loading="lazy">`
    : `<img class="${cls}" data-tex="${texAttr(ex)}" alt="${esc(ex.title)}">`;
}

const wa = text => `https://wa.me/${contacts.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
const edition = ex => ex.edition > 1
  ? { ru: `Лимит: ${ex.edition} экземпляра в мире`, en: `Limited: ${ex.edition} pieces worldwide`, short: `Лимит ${ex.edition} экз.`, shortEn: `Edition of ${ex.edition}` }
  : { ru: 'Уникальный экземпляр (Тираж 1/1)', en: 'Unique piece (Edition 1/1)', short: 'Тираж 1/1', shortEn: 'Unique 1/1' };

function logo() {
  const f = ['logo.svg', 'logo.png'].find(has);
  return f
    ? `<img class="brand-logo" src="/media/${f}" alt="DEN CHAPULLETI">`
    : 'DEN <b>CHAPULLETI</b>';
}

function socials() {
  const c = contacts;
  const links = [
    c.whatsapp && ['WhatsApp', wa()],
    c.telegram && ['Telegram', `https://t.me/${c.telegram}`],
    c.vk && ['VK', c.vk],
    c.youtube && ['YouTube Shorts', c.youtube],
    c.pinterest && ['Pinterest', c.pinterest],
    c.max && ['MAX', c.max],
    ...c.instagram.map(n => [`Instagram* @${n}`, `https://instagram.com/${n}`]),
  ].filter(Boolean);
  return links.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener"${n === 'WhatsApp' ? ' data-goal="whatsapp_click"' : ''}>${esc(n)}</a>`).join('');
}

const metrika = () => process.env.METRIKA_ID
  ? `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${Number(process.env.METRIKA_ID)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});window.METRIKA_ID=${Number(process.env.METRIKA_ID)};</script>`
  : '';

function layout({ base, title, desc, canonical, og, jsonld, body, page, script, waText, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${base}${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DEN CHAPULLETI">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${base}${canonical}">
<meta property="og:image" content="${og.startsWith('http') ? og : base + og}">
<meta property="og:locale" content="ru_RU">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#050505">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/cormorant-garamond/300.css">
<link rel="stylesheet" href="/fonts/cormorant-garamond/300-italic.css">
<link rel="stylesheet" href="/fonts/cormorant-garamond/400.css">
<link rel="stylesheet" href="/fonts/cormorant-garamond/400-italic.css">
<link rel="stylesheet" href="/fonts/cormorant-garamond/500.css">
<link rel="stylesheet" href="/fonts/forum/400.css">
<link rel="stylesheet" href="/fonts/manrope/300.css">
<link rel="stylesheet" href="/fonts/manrope/400.css">
<link rel="stylesheet" href="/fonts/manrope/500.css">
<link rel="stylesheet" href="/fonts/manrope/600.css">
<link rel="stylesheet" href="/fonts/tenor-sans/400.css">
<script>(()=>{const q=new URLSearchParams(location.search).get('font');try{q?sessionStorage.setItem('font',q):0}catch(e){}let f=q;try{f=f||sessionStorage.getItem('font')}catch(e){}if(f)document.documentElement.dataset.font=f})()</script>
<link rel="stylesheet" href="/assets/site.css">
<script type="importmap">{"imports":{"three":"/vendor/three.module.min.js","three/jsm/":"/vendor/jsm/"}}</script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${metrika()}
${extraHead}
</head>
<body class="page-${page}">
${header(page)}
${body}
${footer()}
<a class="wa-float" href="${esc(wa(waText || 'Здравствуйте! Пишу с сайта DEN CHAPULLETI.'))}" target="_blank" rel="noopener" data-goal="whatsapp_click" aria-label="Написать в WhatsApp">
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z"/></svg>
</a>
<div class="cookie" id="cookie" hidden>
  <p${en('We use cookies to make the site work and to measure visits.')}>Мы используем cookie, чтобы сайт работал корректно, и для учёта посещений. <a href="/privacy"${en('Details')}>Подробнее</a></p>
  <button class="btn btn-sm" id="cookieOk"${en('OK')}>Хорошо</button>
</div>
<div class="toast" id="toast"></div>
<script src="/vendor/gsap.min.js"></script>
<script src="/vendor/ScrollTrigger.min.js"></script>
<script src="/vendor/lenis.min.js"></script>
<script type="module" src="/assets/common.js"></script>
<script type="module" src="/assets/${script || page}.js"></script>
</body>
</html>`;
}

const NAV = [
  ['/sculpture', 'Скульптура', 'Sculpture'],
  ['/tables', 'Столы 10–11 см', 'Tables 10–11 cm'],
  ['/cabinets-seating', 'Шкафы и кресла', 'Cabinets & seating'],
  ['/materials', 'Породы', 'Woods'],
  ['/sculptor', 'Скульптор', 'Sculptor'],
  ['/#architects', 'Архитекторам', 'Architects'],
];

function header(page) {
  const links = NAV.map(([u, ru, e]) => `<a href="${page === 'home' && u.startsWith('/#') ? u.slice(1) : u}"${en(e)}>${ru}</a>`).join('');
  return `<header class="hdr" id="hdr">
  <a class="brand" href="/">${logo()}<span class="brand-sub">Sculptor &amp; Collectible Design</span></a>
  <nav class="nav">${links}</nav>
  <div class="hdr-r">
    <div class="lang"><button data-lang="ru" class="on">RU</button>/<button data-lang="en">EN</button></div>
    <a class="btn btn-sm hdr-cta" href="#audit"${en('Private request')}>Приватный запрос</a>
    <button class="burger" id="burger" aria-label="Меню"><i></i><i></i></button>
  </div>
</header>
<div class="mnav" id="mnav">
  <nav>${links}<a href="#audit"${en('Private request')}>Приватный запрос</a></nav>
  <a class="mnav-wa" href="${esc(wa())}" target="_blank" rel="noopener" data-goal="whatsapp_click">WhatsApp · ${esc(contacts.whatsappLabel)}</a>
</div>`;
}

function footer() {
  const l = contacts.legal;
  const req = [l.name, l.inn && `ИНН ${l.inn}`, l.ogrn && `ОГРНИП ${l.ogrn}`].filter(Boolean).join(' • ');
  return `<footer class="ftr">
  <div class="ftr-top">
    <a class="brand" href="/">${has('logo-vert.svg') ? '<img class="ftr-logo" src="/media/logo-vert.svg" alt="DEN CHAPULLETI — Новая роскошь: жить в экологичных и долговечных интерьерах">' : logo()}</a>
    <div class="ftr-cols">
      <div class="ftr-links">
        ${NAV.map(([u, ru, e]) => `<a href="${u}"${en(e)}>${ru}</a>`).join('')}
        <a href="/sculptor#press"${en('For curators & press · Media Kit')}>Кураторам и прессе · Media Kit</a>
      </div>
      <div class="ftr-soc">
        <a class="ftr-wa" href="${esc(wa())}" target="_blank" rel="noopener" data-goal="whatsapp_click">${esc(contacts.whatsappLabel)}</a>
        ${socials()}
      </div>
    </div>
  </div>
  <div class="ftr-bot">
    <span>© ${new Date().getFullYear()} DEN CHAPULLETI${req ? ` • ${esc(req)}` : ''}</span>
    <a href="/privacy"${en('Privacy policy')}>Политика конфиденциальности</a>
  </div>
  <small class="ftr-note">*Instagram принадлежит компании Meta, деятельность которой запрещена в России как экстремистская.</small>
</footer>`;
}

function auditForm(exhibit, topic) {
  return `<section class="audit" id="audit">
  <div class="audit-box">
    <div>
      <div class="eyebrow"${en('A private dialogue with the manufacture')}>Приватный диалог с мануфактурой</div>
      <h2 class="h2"${enh('Discuss a commission<br><em>or request the private catalogue</em>')}>Обсудить создание объекта<br><em>или запросить закрытый каталог</em></h2>
      <p class="lead"${en('Leave your contacts — we will send a private presentation of available pieces, workshop videos, or discuss a commission with the sculptor.')}>Оставьте контакты — мы направим закрытую презентацию доступных экспонатов, видео из мастерской или обсудим индивидуальный заказ со скульптором.</p>
      <a class="audit-wa" href="${esc(wa(exhibit ? `Здравствуйте! Интересует «${exhibit}» (denchapulleti.ru). Подскажите, пожалуйста, статус и детали.` : 'Здравствуйте! Пишу с сайта DEN CHAPULLETI.'))}" target="_blank" rel="noopener" data-goal="whatsapp_click"><span${en('Message us directly on WhatsApp')}>Написать напрямую в WhatsApp</span> · ${esc(contacts.whatsappLabel)}</a>
    </div>
    <form class="lead-form" data-exhibit="${esc(exhibit || '')}" novalidate>
      <div class="field"><input name="name" id="f-name" placeholder=" " required autocomplete="name"><label for="f-name"${en('Your name or architectural studio')}>Ваше имя или архитектурное бюро</label></div>
      <div class="field"><input name="contact" id="f-contact" placeholder=" " required autocomplete="tel"><label for="f-contact"${en('Phone / Telegram / WhatsApp')}>Телефон / Telegram / WhatsApp</label></div>
      <div class="field"><input name="topic" id="f-topic" placeholder=" " value="${esc(topic || '')}"><label for="f-topic"${en('Direction or task (optional)')}>Интересующее направление или задача (необязательно)</label></div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off">
      <label class="consent"><input type="checkbox" name="consent" required><span${enh('I agree to the processing of personal data under the <a href="/privacy">privacy policy</a>')}>Согласен на обработку персональных данных в соответствии с <a href="/privacy">политикой конфиденциальности</a></span></label>
      <button class="btn" type="submit"><span class="dot"></span><span${en('Send request')}>Отправить запрос</span></button>
      <p class="form-msg" data-ok="Запрос получен. Консьерж мануфактуры свяжется с вами лично в течение рабочего дня." data-ok-en="Request received. The manufacture’s concierge will contact you personally within one business day." data-err="Не удалось отправить. Напишите нам напрямую в WhatsApp." data-err-en="Could not send. Please message us on WhatsApp." data-consent="Отметьте согласие на обработку данных." data-consent-en="Please confirm consent to data processing."></p>
    </form>
  </div>
</section>`;
}

function card(ex, i) {
  const ed = edition(ex);
  return `<a class="card card-${i % 5}" href="/exhibits/${ex.slug}" data-cat="${ex.cat}">
    <div class="card-ph">${cover(ex)}<span class="card-open"${en('Open the exhibit →')}>Открыть экспонат →</span></div>
    <div class="card-meta">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="card-cat"${en(cats[ex.cat].en)}>${cats[ex.cat].ru}</span>
    </div>
    <h3 class="card-t"${en(ex.titleEn)}>${esc(ex.title)}</h3>
    <div class="card-row"><span${en(ed.shortEn)}>${ed.short}</span>${statusLabel(ex.status)}</div>
  </a>`;
}

function emptyCard(cat) {
  return `<a class="card card-empty" href="#audit" data-cat="${cat}">
    <div class="card-ph"><div class="card-empty-in"><span class="eyebrow"${en(cats[cat].en)}>${cats[cat].ru}</span><p${en('Works in this section are presented in the private catalogue')}>Работы этого раздела представлены в закрытом каталоге</p><span class="card-open"${en('Request →')}>Запросить →</span></div></div>
  </a>`;
}

// ---------------- главная ----------------
function home(base) {
  const vid = has('lava-hero.mp4');
  const poster = has('lava-hero.jpg') ? ' poster="/media/lava-hero.jpg"' : '';
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DEN CHAPULLETI',
    description: 'Монументальная скульптура и коллекционная мебель из цельного бревна',
    url: base,
    logo: has('logo.svg') ? `${base}/media/logo.svg` : `${base}/assets/og.jpg`,
    sameAs: contacts.instagram.map(n => `https://instagram.com/${n}`),
  };
  const sorted = [...exhibits].sort((a, b) => photos(b.slug).length - photos(a.slug).length);
  const empty = Object.keys(cats).filter(c => !exhibits.some(e => e.cat === c));

  const body = `
<div class="loader" id="loader">
  ${has('logo-vert.svg') ? '<img class="loader-logo loader-logo-v" src="/media/logo-vert.svg" alt="DEN CHAPULLETI — Новая роскошь: жить в экологичных и долговечных интерьерах">' : '<div class="loader-logo">DEN CHAPULLETI</div>'}
  <div class="loader-bar"><i></i></div>
</div>

${vid ? `<video class="hero-video" id="heroVideo" autoplay muted loop playsinline preload="auto"${poster}>
  ${has('lava-hero.webm') ? '<source src="/media/lava-hero.webm" type="video/webm">' : ''}
  ${has('lava-hero-m.mp4') ? '<source src="/media/lava-hero-m.mp4" type="video/mp4" media="(max-width: 820px) and (orientation: portrait)">' : ''}
  <source src="/media/lava-hero.mp4" type="video/mp4">
</video>` : ''}
<canvas class="gl" id="gl"></canvas>
<div class="vignette"></div>
<div class="grain"></div>
<div class="hotspots" id="hotspots"></div>
<div class="hs-card" id="hsCard"><button class="hs-x" id="hsClose" aria-label="Закрыть">×</button><div class="num" id="hsN"></div><h3 id="hsT"></h3><p id="hsP"></p></div>
<script id="cfg" type="application/json">${JSON.stringify({ video: vid, models: models() })}</script>

<main class="story">
  <section class="hero" id="hero">
    <div class="hero-in">
      <div class="eyebrow">Sculptor DEN CHAPULLETI · Private Manufacture</div>
      <h1 class="h1 h1-long split"${enh('Monumental sculpture<br>and collectible furniture <em>from a single log</em>')}>Монументальная скульптура<br>и коллекционная мебель <em>из&nbsp;цельного бревна</em></h1>
      <p class="lead"${en('Forms that command space. We create art objects and architectural tables 10–11 cm thick as one of a kind for private residences and gallery halls. Every piece carries a steel nameplate with an engraved QR code for a direct line to the author on WhatsApp.')}>Формы, подчиняющие себе пространство. Создаём арт-объекты и архитектурные столы толщиной 10–11&nbsp;см в&nbsp;единственном экземпляре для частных резиденций и галерейных залов. Каждый экспонат маркируется именным стальным шильдом с гравированным QR-кодом для прямой связи с автором в WhatsApp.</p>
      <div class="ctas">
        <a class="btn" href="#audit"><span class="dot"></span><span${en('Request the private catalogue')}>Запросить закрытый каталог</span></a>
        <a class="btn btn-ghost" href="#collection"${en('View the exhibition')}>Смотреть экспозицию</a>
      </div>
    </div>
    <div class="scroll-hint"><span${en('Explore')}>Исследовать</span><i></i></div>
  </section>

  <section class="chapter" id="material">
    <div class="txt">
      <div class="eyebrow"${en('Exhibit I · Relict bog oak')}>Экспонат I · Реликтовый скальный дуб</div>
      <h2 class="h2 split"${enh('The “Lava” table.<br><em>Wood that outlived glaciers</em>')}>Стол «Лава».<br><em>Дерево, пережившее ледники</em></h2>
      <p class="lead"${en('The 190–205 cm, 10–11 cm thick top is a monolithic cut of bog oak that lay in the ground for about 400,000 years. Natural radial cracks are filled with optical resin lit from within, turning the top into frozen magma.')}>В основе столешницы диаметром 190–205&nbsp;см и толщиной 10–11&nbsp;см — монолитный срез скального дуба, пролежавшего в земле около 400&nbsp;тысяч лет. Природные радиальные трещины заполнены оптическим полимером со скрытой подсветкой, превращающей столешницу в застывшую магму.</p>
      <div class="stats stats-3">
        <div class="stat"><b>190–205</b><span${en('cm — diameter of the solid top')}>см — диаметр цельной столешницы</span></div>
        <div class="stat"><b data-count="400000">0</b><span${en('years — geological age of the oak')}>лет — геологический возраст скального дуба</span></div>
        <div class="stat"><b data-count="100">0</b><span${en('% — hand-sculpted base and edge')}>% — ручная скульптурная пластика опор и торца</span></div>
      </div>
    </div>
  </section>

  <section class="chapter chapter-r" id="detail">
    <div class="txt">
      <div class="eyebrow"${en('Base')}>Подстолье</div>
      <h2 class="h2 split"${enh('Three spheres.<br><em>Carved by hand</em>')}>Три сферы.<br><em>Высечены вручную</em></h2>
      <p class="lead"${en('Three massive oak spheres in the base are carved and finished by hand without lathe automation, and the outer edge of the top is worked with sculptural relief carving.')}>Три массивные дубовые сферы в основании высечены и доведены вручную без применения токарной автоматики, а внешний торец проработан рельефной скульптурной резьбой.</p>
    </div>
  </section>

  <section class="showcase" id="showcase">
    <div class="showcase-top">
      <div>
        <div class="eyebrow"${en('360° · AR')}>360° · AR</div>
        <h2 class="h2 split"${enh('Explore the form<br>and texture in 360°')}>Изучите пластику<br>и текстуру в 360°</h2>
      </div>
      <div class="hint"><svg width="28" height="14" viewBox="0 0 28 14" fill="none" stroke="#C8A45D"><path d="M1 7h26M5 3 1 7l4 4M23 3l4 4-4 4"/></svg><span${en('Rotate the piece with one touch or try it at 1:1 scale in your residence with your phone camera (AR)')}>Вращайте экспонат одним касанием или примерьте в масштабе 1:1 в пространстве вашей резиденции через камеру смартфона (AR)</span></div>
    </div>
    <div class="switcher" id="switcher">
      <button class="on" data-m="lava"${en('“Lava” table')}>Стол «Лава»</button>
      <button data-m="moai"${en('Moai idol (207 cm)')}>Идол Моаи (207 см)</button>
      <button data-m="bulldog"${en('“French Bulldog” bench')}>Банкетка «Французский бульдог»</button>
      <button class="sw-ar" data-ar data-goal="ar_launch"${en('◎ Try in your residence (AR)')}>◎ Примерить в резиденции (AR)</button>
    </div>
  </section>

  <section class="provenance" id="provenance">
    <div class="rings">
      <canvas id="rings" width="1200" height="1200"></canvas>
      <div class="rings-r">
        <div class="eyebrow"${en('Signature · DEN CHAPULLETI')}>Авторский почерк · DEN CHAPULLETI</div>
        <div class="count" id="count">400 000</div>
        <div class="unit"${en('years ago')}>лет назад</div>
        <div class="epochs">
          <div class="epoch"><h3${en('The oak begins to grow')}>Дуб начинает расти</h3><p${en('~400,000 years ago. The first growth ring of the future piece.')}>~400&nbsp;000 лет назад. Первое годовое кольцо будущего экспоната.</p></div>
          <div class="epoch"><h3${en('Homo sapiens appears')}>Появление Homo sapiens</h3><p${en('About 300,000 years ago. The tree is already ~100,000 years old.')}>Около 300&nbsp;000 лет назад. Дереву уже ~100&nbsp;000 лет.</p></div>
          <div class="epoch"><h3${en('Ice age')}>Ледниковый период</h3><p${en('Ice and pressure compact the wood for millennia. The oak turns dark and dense.')}>Лёд и давление веками уплотняют древесину. Дуб каменеет и темнеет.</p></div>
          <div class="epoch"><h3${en('Holocene')}>Голоцен</h3><p${en('About 12,000 years ago the last glaciation ends. The trunk is still in the ground.')}>Около 12&nbsp;000 лет назад заканчивается последнее оледенение. Ствол всё ещё в земле.</p></div>
          <div class="epoch"><h3${en('Today')}>Сегодня</h3><p${en('The “Lava” table is in a private residence, glowing with optical resin.')}>Стол «Лава» — в частной резиденции. Внутри светится оптический полимер.</p></div>
        </div>
        <div class="tl"><i id="tlBar"></i></div>
      </div>
    </div>
    <div class="manifest">
      <h2 class="h2 manifest-h"${enh('We do not assemble furniture.<br><em>We free the form from a single trunk</em>')}>Мы не собираем мебель.<br><em>Мы освобождаем форму из цельного ствола</em></h2>
      <p class="big" id="manifest"${enh('New luxury is living in eco-friendly, lasting interiors. Every work by Den Chapulleti rests on respect for the primal power of wood. We refuse glued timber, veneer and mass production: <em>sculptures are carved from a single log by hand</em>, monumental tables are made largely by hand with jewel-like finishing of edges, bases and surface.')}>Новая роскошь — жить в экологичных и долговечных интерьерах. В основе каждой работы Дена Чапуллети лежит уважение к первозданной мощи дерева. Мы принципиально отказываемся от клееного бруса, шпона и массового тиражирования. <em>Все скульптуры высекаются из цельного бревна вручную</em>, а монументальные столы создаются преимущественно вручную с ювелирной проработкой торцов, опор и поверхности.</p>
      <div class="marks marks-4">
        <div class="mark"><div class="num">01</div><h3${en('Single log, 10–11 cm solid wood')}>Цельное бревно и массив 10–11 см</h3><p${en('We work only with monolithic trunks, root bases and slabs up to 2.1 m across. Our signature tabletop thickness is 10–11 cm.')}>Работаем исключительно с монолитными стволами, корневищами и слэбами диаметром до 2,1 метра. Фирменный стандарт толщины наших столешниц — 10–11 см.</p></div>
        <div class="mark"><div class="num">02</div><h3${en('Hand-sculpted form')}>Ручная скульптурная пластика</h3><p${en('Every facet, base sphere and live edge is finished by the master’s hands with multi-stage sanding and organic oils and waxes.')}>Каждая грань, сфера подстолья и живой край доводятся руками мастера с многоступенчатой шлифовкой и защитой органическими маслами и восками.</p></div>
        <div class="mark"><div class="num">03</div><h3${en('Steel nameplate and direct QR contact')}>Стальной шильд и прямой QR-контакт</h3><p${en('Each piece carries an inset steel nameplate with the DC monogram and an engraved QR code — one scan opens a direct dialogue with the author on WhatsApp.')}>На каждом изделии врезан именной стальной шильд с монограммой DC и гравированным QR-кодом — одно сканирование открывает прямой диалог с автором в WhatsApp.</p></div>
        <div class="mark"><div class="num">04</div><h3${en('Strict NDA and careful logistics')}>Строгий NDA и бережная логистика</h3><p${en('Full confidentiality of owners and properties. Pieces are made and finished in the workshop and delivered across Russia (no on-site construction work).')}>Полная конфиденциальность владельцев и объектов. Изготавливаем и доводим изделия в мастерской с доставкой по всей России (без проведения строительно-монтажных работ на объекте).</p></div>
      </div>
    </div>
  </section>

  <section class="collection" id="collection">
    <div class="coll-head">
      <div>
        <div class="eyebrow"${en('The manufacture’s exhibition')}>Экспозиция мануфактуры</div>
        <h2 class="h2"${enh('A collection<br><em>of one-offs</em>')}>Коллекция<br><em>единственных</em></h2>
        <p class="lead coll-sub"${en('Every exhibit exists as a single piece or is created individually for the architecture of your residence.')}>Каждый экспонат существует в единственном экземпляре или создаётся индивидуально под архитектуру вашей резиденции.</p>
      </div>
      <div class="filters" id="filters">
        <button class="on" data-f="all"${en('All exhibits')}>Все экспонаты</button>
        ${Object.keys(cats).map(c => `<button data-f="${c}"${en(cats[c].en)}>${cats[c].ru}</button>`).join('')}
      </div>
    </div>
    <div class="track" id="grid">
      ${sorted.map(card).join('')}
      ${empty.map(emptyCard).join('')}
    </div>
    <div class="car-nav">
      <button class="car-prev" aria-label="Назад">←</button>
      <div class="car-bar"><i></i></div>
      <button class="car-next" aria-label="Вперёд">→</button>
    </div>
  </section>

  <section class="architects" id="architects">
    <div>
      <div class="eyebrow">B2B-сервис для бюро · @denchapulleti.studio</div>
      <h2 class="h2"${enh('BIM modelling<br>and <em>integration into interiors</em>')}>BIM-моделирование<br>и <em>интеграция в интерьеры</em></h2>
      <p class="lead"${en('A premium B2B service for architects, decorators and project managers. We create key art dominants for private residences, grand halls and view penthouses strictly to your project’s dimensions.')}>Премиальный B2B-сервис для архитекторов, декораторов и руководителей проектов. Создаём ключевые арт-доминанты для частных резиденций, парадных холлов и видовых пентхаусов строго по размерам вашего проекта.</p>
      <div class="files"><span>.MAX</span><span>.FBX</span><span>.OBJ</span><span>BIM</span></div>
      <a class="btn" href="#audit" data-topic="Запрос 3D-библиотеки и условий для бюро"><span class="dot"></span><span${en('Request the 3D library and studio terms')}>Запросить 3D-библиотеку и условия для бюро</span></a>
    </div>
    <ul class="arch-list">
      <li><b${en('3D / BIM library')}>3D / BIM-библиотека</b><span${en('Accurate polygon models (.max, .fbx, .obj) for your renders and working drawings.')}>Передаём точные полигональные модели (.max, .fbx, .obj) для интеграции в ваши визуализации и рабочие чертежи.</span></li>
      <li><b${en('Live samples at your studio')}>Живые образцы в бюро</b><span${en('Fragments of stabilised solid wood, burl, resin and stains for client approval.')}>Отправляем фрагменты стабилизированного массива, капа, полимера и выкрасов для согласования с заказчиком.</span></li>
      <li><b${en('Strict NDA')}>Строгий NDA</b><span${en('Guaranteed non-disclosure of the property, its location and the owner’s identity.')}>Гарантия неразглашения информации об объекте, локации и личности владельца.</span></li>
      <li><b${en('Factory-ready')}>Заводская готовность</b><span${en('Furniture, sculpture and 2 cm grey barn board ceiling/beam kits made in the workshop with specifications handed to the contractor (no on-site installation).')}>Изготавливаем мебель, скульптуру и комплекты потолков и балок из серой амбарной доски 2&nbsp;см в мастерской с передачей спецификаций подрядчику (без проведения монтажных работ на объекте).</span></li>
    </ul>
  </section>

  <section class="geo" id="geo">
    <div class="geo-head">
      <div class="eyebrow">География присутствия · Strict NDA</div>
      <h2 class="h2"${enh('Private residences<br><em>and closed collections</em>')}>Частные резиденции<br><em>и закрытые коллекции</em></h2>
    </div>
    <div class="marquee"><div class="mq" id="mq">${['Москва', 'Подмосковье', 'Санкт-Петербург', 'Валдай', 'Тверь', 'Алтай', 'Урал', 'Владивосток', 'Камчатка'].map(c => `<span>${c}</span>`).join('')}</div></div>
    <p class="lead geo-note"${en('Works by DEN CHAPULLETI are held in private residences, estates and view penthouses across Russia. Owners, locations and individual projects are fully confidential under strict NDA.')}>Работы DEN CHAPULLETI находятся в закрытых частных резиденциях, усадьбах и видовых пентхаусах по всей России. Полная конфиденциальность владельцев, локаций и индивидуальных проектов по строгому NDA.</p>
  </section>
</main>
${auditForm('')}`;

  return layout({
    base,
    page: 'home',
    title: 'DEN CHAPULLETI — монументальная скульптура и коллекционная мебель из цельного бревна',
    desc: 'Арт-объекты и архитектурные столы толщиной 10–11 см в единственном экземпляре для частных резиденций. Скульптура из цельного бревна, скальный дуб ~400 000 лет.',
    canonical: '/',
    og: '/assets/og.jpg',
    jsonld,
    body,
  });
}

// ---------------- страница изделия ----------------
function exhibit(ex, base) {
  const ph = photos(ex.slug);
  const vid = videoOf(ex.slug);
  const url = `${base}/exhibits/${ex.slug}`;
  const og = ph[0] || '/assets/og.jpg';
  const i = exhibits.indexOf(ex);
  const prev = exhibits[(i - 1 + exhibits.length) % exhibits.length];
  const next = exhibits[(i + 1) % exhibits.length];
  const related = exhibits.filter(e => e.slug !== ex.slug && e.cat === ex.cat)
    .concat(exhibits.filter(e => e.cat !== ex.cat)).slice(0, 3);
  const ed = edition(ex);
  const sec = Object.entries(sections).find(([, s]) => s.cats.includes(ex.cat));
  const waText = ex.status === 'production'
    ? `Здравствуйте! Интересует бронь на «${ex.title}» в производстве (denchapulleti.ru).`
    : `Здравствуйте! Интересует «${ex.title}» (denchapulleti.ru). Подскажите, пожалуйста, статус и детали.`;
  const specs = [
    ...ex.specs,
    ['Статус тиража', 'Edition', ed.ru, ed.en],
    ['Техника', 'Technique', 'Ручная скульптурная резьба по цельному массиву, глубокая стабилизация, стальной шильд DC', 'Hand sculptural carving of solid wood, deep stabilisation, DC steel nameplate'],
  ];

  const gallery = ph.length
    ? ph.map((src, n) => `<img src="${src}" alt="${esc(ex.title)} — фото ${n + 1}"${n ? ' loading="lazy"' : ''}>`).join('')
    : [0, 1, 2].map(n => `<img data-tex="${esc(JSON.stringify({ ...ex.tex, seed: ex.tex.seed + n * 7 }))}" alt="${esc(ex.title)}">`).join('');

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': ['Product', 'VisualArtwork'],
      name: ex.title,
      description: ex.short,
      url,
      image: (ph.length ? ph : [og]).map(s => base + s),
      brand: { '@type': 'Brand', name: 'DEN CHAPULLETI' },
      creator: { '@type': 'Person', name: 'Ден Чапуллети' },
      category: cats[ex.cat].ru,
      artform: cats[ex.cat].ru,
      artEdition: ex.edition || 1,
      artMedium: ex.specs.find(s => /Сырьё|Материал/.test(s[0]))?.[2],
      additionalProperty: specs.map(s => ({ '@type': 'PropertyValue', name: s[0], value: s[2] })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DEN CHAPULLETI', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: sec ? sec[1].ru : cats[ex.cat].ru, item: base + (sec ? `/${sec[0]}` : '/#collection') },
        { '@type': 'ListItem', position: 3, name: ex.title, item: url },
      ],
    },
  ];

  const body = `
<main class="ex">
  <nav class="crumbs"><a href="/">DEN CHAPULLETI</a><span>/</span><a href="${sec ? `/${sec[0]}` : '/#collection'}"${en(sec ? sec[1].en : cats[ex.cat].en)}>${sec ? sec[1].ru : cats[ex.cat].ru}</a></nav>
  <section class="ex-top">
    <div class="ex-gallery" id="gallery">
      <div class="ex-main" id="exMain">${gallery}${vid ? `<video src="${vid}" muted loop playsinline controls preload="metadata"></video>` : ''}</div>
      <div class="ex-thumbs" id="exThumbs"></div>
    </div>
    <div class="ex-info">
      <div class="eyebrow"${en(cats[ex.cat].en)}>${cats[ex.cat].ru}</div>
      <h1 class="h1-ex"${en(ex.titleEn)}>${esc(ex.title)}</h1>
      <div class="ex-chips"><span class="chip chip-ed"${en(ed.en)}>${ed.ru}</span>${statusLabel(ex.status)}</div>
      <p class="lead"${en(ex.shortEn)}>${esc(ex.short)}</p>
      <table class="specs">
        ${specs.map(s => `<tr><th${en(s[1])}>${esc(s[0])}</th><td${en(s[3])}>${esc(s[2])}</td></tr>`).join('')}
      </table>
      <div class="ctas">
        <a class="btn" href="${esc(wa(waText))}" target="_blank" rel="noopener" data-goal="whatsapp_click"><span class="dot"></span><span${en(ex.status === 'production' ? 'Reserve on WhatsApp' : 'Ask the author on WhatsApp')}>${ex.status === 'production' ? 'Забронировать в WhatsApp' : 'Спросить автора в WhatsApp'}</span></a>
        <button class="btn btn-ghost" data-ar data-goal="ar_launch" data-glb="${models()[ex.slug] || ''}"${en('Try in AR')}>Примерить (AR)</button>
      </div>
      <a class="ex-req" href="#audit"${en('Request passport and private catalogue')}>Запросить паспорт и закрытый каталог →</a>
    </div>
  </section>

  <section class="ex-story">
    <div class="eyebrow"${en('The story of the trunk')}>История ствола</div>
    ${ex.story.map((p, n) => `<p${en(ex.storyEn[n] || '')}>${esc(p)}</p>`).join('')}
  </section>

  <nav class="ex-pn">
    <a href="/exhibits/${prev.slug}" class="ex-prev"><span${en('← Previous exhibit')}>← Предыдущий экспонат</span><b${en(prev.titleEn)}>${esc(prev.title)}</b></a>
    <a href="/exhibits/${next.slug}" class="ex-next"><span${en('Next exhibit →')}>Следующий экспонат →</span><b${en(next.titleEn)}>${esc(next.title)}</b></a>
  </nav>

  <section class="ex-related">
    <div class="eyebrow"${en('Other exhibits')}>Другие экспонаты</div>
    <div class="grid grid-3">${related.map(e => card(e, exhibits.indexOf(e))).join('')}</div>
  </section>
</main>
${auditForm(ex.title)}`;

  return layout({
    base,
    page: 'exhibit',
    title: `${ex.title} — ${ed.short} — DEN CHAPULLETI`,
    desc: ex.short,
    canonical: `/exhibits/${ex.slug}`,
    og,
    jsonld,
    body,
    waText,
  });
}

// ---------------- разделы каталога ----------------
function section(key, base) {
  const s = sections[key];
  const items = exhibits.filter(e => s.cats.includes(e.cat));
  const body = `
<main class="pg">
  <nav class="crumbs"><a href="/">DEN CHAPULLETI</a><span>/</span><span${en(s.en)}>${s.ru}</span></nav>
  <header class="pg-head">
    <div class="eyebrow"${en(s.eyebrowEn)}>${s.eyebrowRu}</div>
    <h1 class="h1-ex"${en(s.h1En)}>${s.h1Ru}</h1>
    <p class="lead"${en(s.leadEn)}>${s.leadRu}</p>
  </header>
  ${items.length
    ? `<div class="grid grid-3">${items.map(e => card(e, exhibits.indexOf(e))).join('')}</div>`
    : `<div class="pg-empty"><p${en('Works in this section are presented in the private catalogue. Leave a request — we will send a presentation.')}>Работы этого раздела представлены в закрытом каталоге. Оставьте запрос — пришлём презентацию.</p><a class="btn" href="#audit"><span class="dot"></span><span${en('Request the private catalogue')}>Запросить закрытый каталог</span></a></div>`}
</main>
${auditForm('', s.ru)}`;
  return layout({
    base,
    page: 'list',
    title: `${s.h1Ru} — DEN CHAPULLETI`,
    desc: s.leadRu,
    canonical: `/${key}`,
    og: items.map(e => photos(e.slug)[0]).find(Boolean) || '/assets/og.jpg',
    body,
  });
}

const WOODS = [
  ['Скальный дуб', 'Bog oak', 'возрастом до 400 000 лет', 'up to 400,000 years old', 'relic'],
  ['Вековой дуб', 'Centuries-old oak', 'плотный массив с выразительной текстурой', 'dense wood with an expressive grain', 'relic'],
  ['Каповый и горный тополь', 'Burl and mountain poplar', 'белолистница, свилеватый рисунок', 'white poplar, curly figure', 'relic'],
  ['Каповый карагач', 'Burl elm', 'наплывы с неповторимым рисунком', 'burls with a unique pattern', 'relic'],
  ['Ива', 'Willow', 'мягкая пластика, светлый тон', 'soft form, light tone', 'relic'],
  ['Клён', 'Maple', 'светлый плотный массив', 'light dense wood', 'relic'],
  ['Азиатский каповый карагач', 'Asian burl elm', 'крупные каповые наплывы', 'large burls', 'exotic'],
  ['Африканский махагон', 'African mahogany', 'редкие спилы большого диаметра', 'rare large-diameter cuts', 'exotic'],
  ['Парота', 'Parota', 'широкие слэбы с контрастной текстурой', 'wide slabs with contrasting grain', 'exotic'],
  ['Суар', 'Suar', 'монолитные слэбы для столов', 'monolithic slabs for tables', 'exotic'],
  ['Грецкий и американский орех', 'Walnut & American walnut', 'глубокий тёплый тон', 'deep warm tone', 'exotic'],
  ['Экзотические стволы под заказ', 'Exotic trunks on request', 'штучный подбор под проект', 'sourced individually for a project', 'exotic'],
];

function materials(base) {
  const group = (k, ru, e) => `<div class="woods-g"><div class="eyebrow"${en(e)}>${ru}</div><div class="woods">${WOODS.filter(w => w[4] === k).map(w => `<div class="wood"><h3${en(w[1])}>${w[0]}</h3><p${en(w[3])}>${w[2]}</p></div>`).join('')}</div></div>`;
  const body = `
<main class="pg">
  <nav class="crumbs"><a href="/">DEN CHAPULLETI</a><span>/</span><span${en('Woods')}>Породы</span></nav>
  <header class="pg-head">
    <div class="eyebrow"${en('Encyclopedia of materials')}>Энциклопедия сырья</div>
    <h1 class="h1-ex"${en('Rare wood from around the world')}>Редкая древесина со всего мира</h1>
    <p class="lead"${en('We select trunks and burls with unique natural patterns and carry out multi-stage stabilisation and vacuum drying, adapting the wood to the climate of modern residences with panoramic glazing and underfloor heating.')}>Мы отбираем стволы и каповые наплывы с неповторимым природным рисунком и проводим многоступенчатую стабилизацию и вакуумную сушку, адаптируя массив к климату современных резиденций с панорамным остеклением и тёплыми полами.</p>
  </header>
  ${group('relic', 'Реликтовые и российские породы', 'Relict and Russian species')}
  ${group('exotic', 'Ценные и экзотические породы', 'Precious and exotic species')}
</main>
${auditForm('', 'Подбор породы под проект')}`;
  return layout({ base, page: 'list', title: 'Библиотека редких пород — DEN CHAPULLETI', desc: 'Скальный дуб до 400 000 лет, африканский махагон, каповый карагач, тополь, орех и другие редкие породы. Стабилизация и вакуумная сушка массива.', canonical: '/materials', og: '/assets/og.jpg', body });
}

function sculptor(base) {
  const body = `
<main class="pg">
  <nav class="crumbs"><a href="/">DEN CHAPULLETI</a><span>/</span><span${en('Sculptor')}>Скульптор</span></nav>
  <header class="pg-head">
    <div class="eyebrow">Artist Statement</div>
    <h1 class="h1-ex"${en('Den Chapulleti')}>Ден Чапуллети</h1>
    <p class="lead"${en('Sculptor and author of collectible design objects.')}>Скульптор и автор объектов коллекционного дизайна.</p>
  </header>
  <section class="statement">
    <p${en('At the centre of his practice is a dialogue with the primal matter of wood: from relict bog oak that lay in the ground for about 400,000 years to monumental trunks of elm, poplar and rare African mahogany. Refusing replication and glued constructions, the author works only with solid wood by hand, revealing the architecture hidden inside the trunk and turning a natural monolith into a museum artefact (Edition 1/1).')}>В центре художественной практики — диалог с первозданной материей дерева: от реликтового скального дуба, пролежавшего в земле около 400&nbsp;000 лет, до монументальных стволов карагача, тополя и редкого африканского махагона. Отказываясь от тиражирования и клееных конструкций, автор работает исключительно с цельным массивом вручную, выявляя скрытую внутри ствола архитектуру и превращая природный монолит в музейный артефакт (Тираж 1/1).</p>
  </section>
  <section class="press" id="press">
    <div>
      <div class="eyebrow"${en('For curators, galleries and press')}>Кураторам, галереям и прессе</div>
      <h2 class="h2"${enh('Media Kit<br><em>and talks</em>')}>Media Kit<br><em>и выступления</em></h2>
      <p class="lead"${en('Biography and method, key works in high resolution for publications and selection committees, talk topics and a direct contact for organisers.')}>Биография и творческий метод, ключевые работы в высоком разрешении для публикаций и отборочных комиссий, темы выступлений и прямой контакт для организаторов.</p>
      <a class="btn" href="${esc(wa('Здравствуйте! Пишу как куратор / от редакции. Пришлите, пожалуйста, Media Kit DEN CHAPULLETI.'))}" target="_blank" rel="noopener" data-goal="whatsapp_click"><span class="dot"></span><span${en('Request the Media Kit (PDF)')}>Запросить Media Kit (PDF)</span></a>
    </div>
    <ul class="arch-list">
      <li><b${en('Talk')}>Выступление</b><span${en('“Memory of matter: working with 400,000-year-old relict wood and a single trunk in contemporary architecture.”')}>«Память материи: как работать с реликтовым массивом возрастом 400&nbsp;000 лет и цельным стволом в современной архитектуре».</span></li>
      <li><b${en('Talk')}>Выступление</b><span${en('“Between sculpture and function: creating collectible objects in an edition of 1/1 for private residences.”')}>«На грани скульптуры и функции: создание коллекционных объектов тиражом 1/1 для частных резиденций».</span></li>
      <li><b${en('Contact for organisers')}>Контакт для организаторов</b><span>WhatsApp ${esc(contacts.whatsappLabel)}</span></li>
    </ul>
  </section>
</main>
${auditForm('', 'Кураторам и прессе')}`;
  return layout({ base, page: 'list', title: 'Скульптор Ден Чапуллети — Artist Statement — DEN CHAPULLETI', desc: 'Ден Чапуллети — скульптор и автор объектов коллекционного дизайна. Работа с реликтовым скальным дубом и цельным массивом, музейные объекты тиражом 1/1.', canonical: '/sculptor', og: '/assets/og.jpg', body });
}

function privacy(base) {
  const l = contacts.legal;
  const op = `${esc(l.name)} (ИНН ${esc(l.inn)}, ОГРНИП ${esc(l.ogrn)})`;
  const body = `
<main class="pg legal">
  <nav class="crumbs"><a href="/">DEN CHAPULLETI</a><span>/</span><span>Политика конфиденциальности</span></nav>
  <h1 class="h1-ex">Политика конфиденциальности и обработки персональных данных</h1>
  <p>Дата публикации: 25 ноября 2026 г.<br>Адрес сайта: https://denchapulleti.ru</p>
  <p>Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и защиты персональных данных пользователей сайта https://denchapulleti.ru (далее — «Сайт»), принадлежащего индивидуальному предпринимателю ${op} (далее — «Оператор»).</p>
  <p>Использование Сайта, отправка заявок через формы обратной связи, скачивание материалов или переход в мессенджеры означает согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки его персональных данных.</p>
  <h2>1. Какие данные собирает Оператор</h2>
  <p>Оператор обрабатывает только те персональные данные, которые Пользователь добровольно предоставляет при заполнении форм на Сайте (запрос закрытого каталога, расчёт стоимости, запрос 3D/BIM-библиотеки, обращение куратора):</p>
  <ul>
    <li>имя (или наименование архитектурного бюро / организации);</li>
    <li>контактный номер телефона, имя пользователя в мессенджерах Telegram или WhatsApp, адрес электронной почты (при указании);</li>
    <li>текст комментария, параметры проекта или выбранный экспонат.</li>
  </ul>
  <p>Также на Сайте происходит автоматический сбор обезличенных технических данных о посетителях (в том числе файлов cookie, IP-адреса, типа браузера и устройства, источника перехода и UTM-меток) с помощью сервиса веб-аналитики Яндекс Метрика (ООО «ЯНДЕКС») в целях улучшения работы Сайта и анализа пользовательской активности.</p>
  <h2>2. Цели обработки персональных данных</h2>
  <p>Оператор обрабатывает персональные данные Пользователя исключительно в следующих целях:</p>
  <ul>
    <li>идентификация Пользователя для обратной связи и консультирования по изделиям и услугам мануфактуры DEN CHAPULLETI;</li>
    <li>направление закрытого каталога, расчёта стоимости, видеоматериалов, портфолио (Media Kit) или файлов 3D/BIM-моделей по запросу Пользователя;</li>
    <li>подготовка, заключение и исполнение договоров на изготовление и поставку авторской мебели и скульптуры;</li>
    <li>улучшение качества работы Сайта, удобства его использования и аналитика посещаемости.</li>
  </ul>
  <h2>3. Правовые основания и порядок обработки данных</h2>
  <p>3.1. Обработка персональных данных осуществляется на основании Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и добровольного согласия Пользователя, выраженного путём проставления отметки (чекбокса) перед отправкой формы на Сайте.</p>
  <p>3.2. Оператор обеспечивает сохранность персональных данных и принимает все необходимые правовые, организационные и технические меры для защиты данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования или распространения.</p>
  <p>3.3. Персональные данные Пользователя не передаются третьим лицам, за исключением случаев, прямо предусмотренных действующим законодательством Российской Федерации, либо когда передача необходима для исполнения запроса самого Пользователя (например, при оформлении доставки заказа).</p>
  <p>3.4. Обработка и хранение персональных данных граждан Российской Федерации осуществляются с использованием баз данных, находящихся на территории Российской Федерации.</p>
  <h2>4. Срок хранения и отзыв согласия</h2>
  <p>4.1. Персональные данные обрабатываются до достижения целей обработки, указанных в разделе 2 настоящей Политики, либо до момента отзыва согласия Пользователем.</p>
  <p>4.2. Пользователь вправе в любой момент уточнить свои персональные данные, потребовать их блокирования или уничтожения, а также отозвать согласие на их обработку, направив уведомление Оператору по электронной почте ${esc(l.email)} или в мессенджер по номеру ${esc(contacts.whatsappLabel)}.</p>
  <h2>5. Использование файлов cookie и сервисов аналитики</h2>
  <p>5.1. Файлы cookie — это небольшие текстовые файлы, сохраняемые в браузере Пользователя для корректной работы интерфейса Сайта (включая запоминание выбранного языка RU / EN и параметров 3D-просмотра) и сбора обезличенной статистики через Яндекс Метрику.</p>
  <p>5.2. Пользователь может в любой момент ограничить или отключить использование файлов cookie в настройках своего браузера.</p>
  <h2>6. Реквизиты и контакты Оператора</h2>
  <ul>
    <li>Оператор: ${esc(l.name)}</li>
    <li>ИНН: ${esc(l.inn)}</li>
    <li>ОГРНИП: ${esc(l.ogrn)}</li>
    <li>Электронная почта: ${esc(l.email)}</li>
    <li>Телефон / WhatsApp / Telegram: ${esc(contacts.whatsappLabel)}</li>
  </ul>
</main>`;
  return layout({ base, page: 'list', title: 'Политика конфиденциальности — DEN CHAPULLETI', desc: 'Политика обработки персональных данных сайта DEN CHAPULLETI.', canonical: '/privacy', og: '/assets/og.jpg', body });
}

function notFound(base) {
  return layout({
    base,
    page: 'list',
    title: 'Экспонат не найден — DEN CHAPULLETI',
    desc: 'Страница не найдена',
    canonical: '/',
    og: '/assets/og.jpg',
    body: `<main class="pg nf">${has('logo-vert.svg') ? '<img class="nf-mark" src="/media/logo-vert.svg" alt="DEN CHAPULLETI">' : ''}<div class="eyebrow">404</div><h1 class="h1-ex"${en('The exhibit was not found or is held in a private collection')}>Экспонат не найден или находится в закрытой коллекции</h1><a class="btn" href="/#collection"><span class="dot"></span><span${en('Back to the exhibition')}>Вернуться в экспозицию</span></a></main>`,
  });
}

module.exports = { home, exhibit, section, materials, sculptor, privacy, notFound, sections };
