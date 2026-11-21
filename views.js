const fs = require('fs');
const path = require('path');
const { exhibits, cats } = require('./data/exhibits');
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

function logo() {
  const f = ['logo.svg', 'logo.png'].find(has);
  return f
    ? `<img class="brand-logo" src="/media/${f}" alt="DEN CHAPULLETI">`
    : 'DEN <b>CHAPULLETI</b>';
}

function socials() {
  const c = contacts;
  const links = [
    c.telegram && ['Telegram', `https://t.me/${c.telegram}`],
    c.whatsapp && ['WhatsApp', `https://wa.me/${c.whatsapp}`],
    c.max && ['MAX', c.max],
    c.vk && ['VK', c.vk],
    c.youtube && ['YouTube', c.youtube],
    c.instagram && ['Instagram*', `https://instagram.com/${c.instagram}`],
  ].filter(Boolean);
  return links.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('');
}

function layout({ base, title, desc, canonical, og, jsonld, body, page, extraHead = '' }) {
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
<link rel="stylesheet" href="/fonts/playfair-display/400.css">
<link rel="stylesheet" href="/fonts/playfair-display/400-italic.css">
<link rel="stylesheet" href="/fonts/old-standard-tt/400.css">
<link rel="stylesheet" href="/fonts/old-standard-tt/400-italic.css">
<script>(()=>{const q=new URLSearchParams(location.search).get('font');try{q?sessionStorage.setItem('font',q):0}catch(e){}let f=q;try{f=f||sessionStorage.getItem('font')}catch(e){}if(f)document.documentElement.dataset.font=f})()</script>
<link rel="stylesheet" href="/assets/site.css">
<script type="importmap">{"imports":{"three":"/vendor/three.module.min.js","three/jsm/":"/vendor/jsm/"}}</script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${extraHead}
</head>
<body class="page-${page}">
${header(page)}
${body}
${footer()}
<div class="toast" id="toast"></div>
<script src="/vendor/gsap.min.js"></script>
<script src="/vendor/ScrollTrigger.min.js"></script>
<script src="/vendor/lenis.min.js"></script>
<script type="module" src="/assets/common.js"></script>
<script type="module" src="/assets/${page}.js"></script>
</body>
</html>`;
}

function header(page) {
  const h = page === 'home' ? '' : '/';
  return `<header class="hdr" id="hdr">
  <a class="brand" href="/">${logo()}</a>
  <nav class="nav">
    <a href="${h}#showcase"${en('Exhibition')}>Экспозиция</a>
    <a href="${h}#provenance"${en('Provenance')}>Провенанс</a>
    <a href="${h}#collection"${en('Collection')}>Коллекция</a>
    <a href="${h}#architects"${en('Architects')}>Архитекторам</a>
  </nav>
  <div class="hdr-r">
    <div class="lang"><button data-lang="ru" class="on">RU</button>/<button data-lang="en">EN</button></div>
    <a class="btn btn-sm" href="#audit"${en('Private audit')}>Приватный аудит</a>
  </div>
</header>`;
}

function footer() {
  return `<footer class="ftr">
  <div class="ftr-top">
    <a class="brand" href="/">${has('logo-vert.svg') ? '<img class="ftr-logo" src="/media/logo-vert.svg" alt="DEN CHAPULLETI — Новая роскошь: жить в экологичных и долговечных интерьерах">' : logo()}</a>
    <div class="ftr-soc">${socials()}</div>
  </div>
  <div class="ftr-bot">
    <span${en('Private Wood Art Manufacture · Moscow')}>Private Wood Art Manufacture · Москва</span>
    <span>© ${new Date().getFullYear()} DEN CHAPULLETI · @${esc(contacts.instagram)}</span>
  </div>
  <small class="ftr-note">*Деятельность Meta (соцсети Facebook и Instagram) запрещена в России как экстремистская.</small>
</footer>`;
}

function auditForm(exhibit) {
  return `<section class="audit" id="audit">
  <div class="audit-box">
    <div>
      <div class="eyebrow"${en('Concierge service')}>Консьерж-сервис</div>
      <h2 class="h2"${enh('Private audit<br><em>of your space</em>')}>Приватный аудит<br><em>пространства</em></h2>
      <p class="lead"${en('We will select a piece for your residence or your studio’s project. For architects — 3D/BIM models and work under NDA.')}>Подберём экспонат под интерьер резиденции или проект бюро. Для архитекторов — 3D/BIM-модели и работа по NDA.</p>
    </div>
    <form class="lead-form" data-exhibit="${esc(exhibit || '')}" novalidate>
      <div class="field"><input name="name" id="f-name" placeholder=" " required autocomplete="name"><label for="f-name"${en('Name / Studio')}>Имя / Бюро</label></div>
      <div class="field"><input name="contact" id="f-contact" placeholder=" " required autocomplete="tel"><label for="f-contact"${en('Telegram · WhatsApp · Phone')}>Telegram · WhatsApp · Телефон</label></div>
      <div class="field"><input name="location" id="f-loc" placeholder=" "><label for="f-loc"${en('Property location')}>Локация объекта</label></div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off">
      <button class="btn" type="submit"><span class="dot"></span><span${en('Request an audit')}>Запросить аудит</span></button>
      <p class="form-msg" data-ok="Благодарим. Мы свяжемся с вами лично." data-ok-en="Thank you. We will contact you personally." data-err="Не удалось отправить. Напишите нам напрямую." data-err-en="Could not send. Please contact us directly."></p>
    </form>
  </div>
</section>`;
}

function card(ex, i) {
  return `<a class="card card-${i % 5}" href="/exhibits/${ex.slug}" data-cat="${ex.cat}">
    <div class="card-ph">${cover(ex)}</div>
    <div class="card-meta">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="card-cat"${en(cats[ex.cat].en)}>${cats[ex.cat].ru}</span>
    </div>
    <h3 class="card-t"${en(ex.titleEn)}>${esc(ex.title)}</h3>
    <div class="card-row"><span>${esc(ex.specs[0][2])}</span>${statusLabel(ex.status)}</div>
  </a>`;
}

// ---------------- главная ----------------
function home(base) {
  const vid = has('lava-hero.mp4');
  const poster = has('lava-hero.jpg') ? ' poster="/media/lava-hero.jpg"' : '';
  const used = Object.keys(cats).filter(c => exhibits.some(e => e.cat === c));
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DEN CHAPULLETI',
    description: 'Private Wood Art Manufacture — монументальная мебель и скульптура из цельного массива',
    url: base,
    logo: has('logo.svg') ? `${base}/media/logo.svg` : `${base}/assets/og.jpg`,
    sameAs: contacts.instagram ? [`https://instagram.com/${contacts.instagram}`] : [],
  };

  const body = `
<div class="loader" id="loader">
  <div class="loader-logo">DEN CHAPULLETI</div>
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
      <div class="eyebrow">Private Wood Art Manufacture</div>
      <h1 class="h1 split"${enh('Art that is<br><em>400,000 years old</em>')}>Искусство, которому<br><em>400&nbsp;000 лет</em></h1>
      <p class="lead"${en('Monumental furniture and sculpture from solid wood. Every piece is one of a kind, with a steel nameplate and a QR passport.')}>Монументальная мебель и скульптура из цельного массива. Каждый экспонат — единственный, с именным стальным шильдом и QR-паспортом.</p>
      <div class="ctas">
        <a class="btn" href="#showcase"><span class="dot"></span><span${en('Open the exhibition')}>Открыть экспозицию</span></a>
        <button class="btn btn-ghost" data-ar${en('AR try-on')}>AR-примерка</button>
      </div>
    </div>
    <div class="scroll-hint"><span${en('Explore')}>Исследовать</span><i></i></div>
  </section>

  <section class="chapter" id="material">
    <div class="txt">
      <div class="eyebrow"${en('Exhibit I — “Lava” table')}>Экспонат I — Стол «Лава»</div>
      <h2 class="h2 split"${enh('Bog oak.<br><em>Fire within.</em>')}>Скальный дуб.<br><em>Огонь внутри.</em></h2>
      <p class="lead"${en('A trunk that lay in the ground for about 400,000 years. Radial channels of optical resin with built-in lighting make the wood glow like cooling magma.')}>Ствол, пролежавший в земле около 400&nbsp;000 лет. Радиальные каналы оптического полимера со встроенной подсветкой — дерево светится, как остывающая магма.</p>
      <div class="stats">
        <div class="stat"><b data-count="205">0</b><span${en('cm diameter')}>см, диаметр</span></div>
        <div class="stat"><b data-count="400000">0</b><span${en('years of the wood')}>лет сырью</span></div>
      </div>
    </div>
  </section>

  <section class="chapter chapter-r" id="detail">
    <div class="txt">
      <div class="eyebrow"${en('Base')}>Подстолье</div>
      <h2 class="h2 split"${enh('Three spheres.<br><em>Not a single seam.</em>')}>Три сферы.<br><em>Ни одного шва.</em></h2>
      <p class="lead"${en('Massive oak spheres are turned by hand. The edge of the top is hand-carved and shows only in side light.')}>Массивные дубовые сферы выточены вручную. Торец столешницы покрыт ручной резьбой — её видно только при боковом свете.</p>
    </div>
  </section>

  <section class="showcase" id="showcase">
    <div class="showcase-top">
      <div>
        <div class="eyebrow"${en('Interactive showcase')}>Интерактивная витрина</div>
        <h2 class="h2 split"${enh('Hold the piece<br>in your hands')}>Возьмите экспонат<br>в руки</h2>
      </div>
      <div class="hint"><svg width="28" height="14" viewBox="0 0 28 14" fill="none" stroke="#C8A45D"><path d="M1 7h26M5 3 1 7l4 4M23 3l4 4-4 4"/></svg><span${en('Rotate 360° · tap a gold point')}>Вращайте 360° · нажмите на золотую точку</span></div>
    </div>
    <div class="switcher" id="switcher">
      <button class="on" data-m="lava"${en('“Lava” table')}>Стол «Лава»</button>
      <button data-m="moai"${en('Moai idol · 207 cm')}>Идол Моаи · 207 см</button>
      <button data-m="bulldog"${en('“French Bulldog” bench')}>Банкетка «Бульдог»</button>
      <button class="sw-ar" data-ar${en('◎ Try in AR')}>◎ Примерить (AR)</button>
    </div>
  </section>

  <section class="provenance" id="provenance">
    <div class="rings">
      <canvas id="rings" width="1200" height="1200"></canvas>
      <div class="rings-r">
        <div class="eyebrow"${en('Philosophy & provenance')}>Философия и провенанс</div>
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
      <p class="big" id="manifest"${enh('We never glue beams. We find wood that <em>has outlived glaciers</em> and give it a second life — in a residence, a gallery or an exhibition in Milan.')}>Мы не склеиваем брус. Мы находим дерево, которое <em>пережило ледники</em>, и даём ему вторую жизнь — в резиденции, галерее или на выставке в Милане.</p>
      <div class="marks">
        <div class="mark"><div class="num">01</div><h3${en('Solid wood only')}>Цельный массив</h3><p${en('Monolith only, no glued timber. The age of the wood is recorded in the passport.')}>Только монолит, без клееного бруса. Возраст сырья фиксируется в паспорте.</p></div>
        <div class="mark"><div class="num">02</div><h3${en('Steel nameplate')}>Стальной шильд</h3><p${en('An engraved manufacture nameplate on every piece.')}>Именная гравировка мануфактуры на каждом изделии.</p></div>
        <div class="mark"><div class="num">03</div><h3${en('QR passport')}>QR-паспорт</h3><p${en('The trunk’s history, materials and making stages in a digital passport.')}>История ствола, материалы и этапы создания в цифровом паспорте.</p></div>
      </div>
    </div>
  </section>

  <section class="collection" id="collection">
    <div class="coll-head">
      <div>
        <div class="eyebrow"${en('Exhibition')}>Экспозиция</div>
        <h2 class="h2"${enh('A collection<br><em>of one-offs</em>')}>Коллекция<br><em>единственных</em></h2>
      </div>
      <div class="filters" id="filters">
        <button class="on" data-f="all"${en('All')}>Все</button>
        ${used.map(c => `<button data-f="${c}"${en(cats[c].en)}>${cats[c].ru}</button>`).join('')}
      </div>
    </div>
    <div class="grid" id="grid">
      ${exhibits.map(card).join('')}
    </div>
  </section>

  <section class="architects" id="architects">
    <div>
      <div class="eyebrow"${en('For architects & studios')}>Архитекторам и бюро</div>
      <h2 class="h2"${enh('Co-authorship<br>at <em>project</em> level')}>Соавторство<br>на уровне <em>проекта</em></h2>
      <p class="lead"${en('We make pieces and architectural kits in our workshop to your drawings. Delivery is ready to install — no on-site installation by us.')}>Изготавливаем изделия и архитектурные комплекты в мастерской по вашему проекту. На объект приезжает готовый комплект — без монтажа с нашей стороны.</p>
      <div class="files"><span>.OBJ</span><span>.FBX</span><span>.MAX</span><span>BIM</span></div>
    </div>
    <ul class="arch-list">
      <li><b${en('3D / BIM models')}>3D / BIM-модели</b><span${en('for your design project')}>для дизайн-проекта</span></li>
      <li><b${en('Work under NDA')}>Работа по NDA</b><span${en('confidential')}>конфиденциально</span></li>
      <li><b${en('Beams & ceilings')}>Балки и потолки</b><span${en('2 cm grey barn board')}>серая амбарная доска 2 см</span></li>
      <li><b${en('Architectural kits')}>Архитектурные комплекты</b><span${en('made in the workshop, no installation')}>в мастерской, без монтажа</span></li>
      <li><b${en('Wood sourcing')}>Подбор сырья</b><span${en('for a specific property')}>под конкретный объект</span></li>
    </ul>
  </section>

  <section class="geo" id="geo">
    <div class="marquee"><div class="mq" id="mq"><span>Agalarov Estate</span><span>Барвиха</span><span>Новая Рига</span><span>Москва</span><span>Milano</span><span>Paris</span></div></div>
    <div class="geo-cols">
      <div>
        <div class="eyebrow"${en('Residences')}>Резиденции</div>
        <ul class="geo-list"><li>Agalarov Estate</li><li${en('Barvikha')}>Барвиха</li><li${en('Novaya Riga')}>Новая Рига</li><li${en('Moscow')}>Москва</li></ul>
      </div>
      <div>
        <div class="eyebrow"${en('Exhibitions')}>Выставки</div>
        <ul class="geo-list"><li${en('Milan · Italy')}>Милан · Италия</li><li${en('Paris · France')}>Париж · Франция</li></ul>
        <p class="lead"${en('We prepare pieces for international design and art exhibitions.')}>Готовим экспонаты к международным выставкам дизайна и искусства.</p>
      </div>
    </div>
  </section>
</main>
${auditForm('')}`;

  return layout({
    base,
    page: 'home',
    title: 'DEN CHAPULLETI — монументальная мебель и скульптура из цельного массива',
    desc: 'Private Wood Art Manufacture: коллекционные столы, скульптура и архитектурные комплекты из цельного массива возрастом до 400 000 лет. Приватный аудит пространства.',
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
  const related = exhibits.filter(e => e.slug !== ex.slug && e.cat === ex.cat)
    .concat(exhibits.filter(e => e.cat !== ex.cat)).slice(0, 3);

  const gallery = ph.length
    ? ph.map((src, i) => `<img src="${src}" alt="${esc(ex.title)} — фото ${i + 1}"${i ? ' loading="lazy"' : ''}>`).join('')
    : [0, 1, 2].map(i => `<img data-tex="${esc(JSON.stringify({ ...ex.tex, seed: ex.tex.seed + i * 7 }))}" alt="${esc(ex.title)}">`).join('');

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': ['Product', 'VisualArtwork'],
      name: ex.title,
      description: ex.short,
      url,
      image: (ph.length ? ph : [og]).map(s => base + s),
      brand: { '@type': 'Brand', name: 'DEN CHAPULLETI' },
      creator: { '@type': 'Organization', name: 'DEN CHAPULLETI' },
      category: cats[ex.cat].ru,
      artform: cats[ex.cat].ru,
      artMedium: ex.specs.find(s => /Сырьё|Материал/.test(s[0]))?.[2],
      additionalProperty: ex.specs.map(s => ({ '@type': 'PropertyValue', name: s[0], value: s[2] })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DEN CHAPULLETI', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: cats[ex.cat].ru, item: base + '/#collection' },
        { '@type': 'ListItem', position: 3, name: ex.title, item: url },
      ],
    },
  ];

  const body = `
<main class="ex">
  <nav class="crumbs"><a href="/">DEN CHAPULLETI</a><span>/</span><a href="/#collection"${en(cats[ex.cat].en)}>${cats[ex.cat].ru}</a></nav>
  <section class="ex-top">
    <div class="ex-gallery" id="gallery">
      <div class="ex-main" id="exMain">${gallery}${vid ? `<video src="${vid}" muted loop playsinline controls preload="metadata"></video>` : ''}</div>
      <div class="ex-thumbs" id="exThumbs"></div>
    </div>
    <div class="ex-info">
      <div class="eyebrow"${en(cats[ex.cat].en)}>${cats[ex.cat].ru}</div>
      <h1 class="h1-ex"${en(ex.titleEn)}>${esc(ex.title)}</h1>
      ${statusLabel(ex.status)}
      <p class="lead"${en(ex.shortEn)}>${esc(ex.short)}</p>
      <table class="specs">
        ${ex.specs.map(s => `<tr><th${en(s[1])}>${esc(s[0])}</th><td${en(s[3])}>${esc(s[2])}</td></tr>`).join('')}
      </table>
      <div class="ctas">
        <a class="btn" href="#audit"><span class="dot"></span><span${en(ex.status === 'production' ? 'Reserve' : 'Request passport & quote')}>${ex.status === 'production' ? 'Забронировать' : 'Запросить паспорт и расчёт'}</span></a>
        <button class="btn btn-ghost" data-ar data-glb="${models()[ex.slug] || ''}"${en('AR try-on')}>AR-примерка</button>
      </div>
    </div>
  </section>

  <section class="ex-story">
    <div class="eyebrow"${en('The story of the trunk')}>История ствола</div>
    ${ex.story.map((p, i) => `<p${en(ex.storyEn[i] || '')}>${esc(p)}</p>`).join('')}
  </section>

  <section class="ex-related">
    <div class="eyebrow"${en('Other exhibits')}>Другие экспонаты</div>
    <div class="grid grid-3">${related.map((e, i) => card(e, exhibits.indexOf(e))).join('')}</div>
  </section>
</main>
${auditForm(ex.title)}`;

  return layout({
    base,
    page: 'exhibit',
    title: `${ex.title} — DEN CHAPULLETI`,
    desc: ex.short,
    canonical: `/exhibits/${ex.slug}`,
    og,
    jsonld,
    body,
  });
}

function notFound(base) {
  return layout({
    base,
    page: 'exhibit',
    title: 'Страница не найдена — DEN CHAPULLETI',
    desc: 'Страница не найдена',
    canonical: '/',
    og: '/assets/og.jpg',
    body: `<main class="ex nf"><div class="eyebrow">404</div><h1 class="h1-ex"${en('This exhibit is not on display')}>Такого экспоната нет в экспозиции</h1><a class="btn" href="/#collection"${en('To the collection')}>К коллекции</a></main>`,
  });
}

module.exports = { home, exhibit, notFound };
