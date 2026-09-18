/* ==========================================================================
   KINETIC — site renderer + motion engine  (v2 redesign)
   --------------------------------------------------------------------------
   This file reads content.json and draws the whole website from it, then
   brings it to life with motion (loader, 3D gear, cursor, reveals, parallax,
   marquees, tilt cards, scroll-scrubbed text …).
   YOU DO NOT NEED TO EDIT THIS FILE. To change anything you see on the site,
   edit content.json (or use the /admin editor).
   No libraries, no build step — plain JavaScript.
   ========================================================================== */

(() => {
  'use strict';

  const STORE_KEY = 'ps-lang';
  let DATA = null;
  let LANG = 'en';

  const MQ_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MQ_FINE = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionOn = () => !MQ_REDUCED.matches && document.documentElement.dataset.anim !== 'off';

  /* ---------------------------------------------------------------- utils */

  const t = (v) => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    return v[LANG] || v.en || v.fa || '';
  };

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const te = (v) => esc(t(v));
  const on = (item) => item && item.enabled !== false;
  const rtl = () => LANG === 'fa';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Split a text into masked words, each able to rise into view.
  // Persian is only ever split by WORD (never by letter) so the letters keep
  // joining correctly.
  const words = (v, base = 0) => t(v).split(/\s+/).filter(Boolean).map((w, i) =>
    `<span class="w"><span class="w__i" style="--i:${base + i}">${esc(w)}</span></span>`).join(' ');

  // Split into single letters (Latin only) — used for the big hero name.
  const letters = (v) => {
    const s = t(v);
    if (rtl() || /[؀-ۿ]/.test(s)) return words(v);
    let n = 0;
    return s.split(' ').map((word) =>
      `<span class="word-nb">${[...word].map((c) =>
        `<span class="ch"><span class="ch__i" style="--i:${n++}">${esc(c)}</span></span>`).join('')}</span>`
    ).join(' ');
  };

  // Words for scroll-scrubbed "reading" highlight.
  const scrubWords = (v) => t(v).split(/\s+/).filter(Boolean)
    .map((w) => `<span class="sw">${esc(w)}</span>`).join(' ');

  // Rolling label used in nav links and buttons.
  const roll = (label) => `<span class="roll"><span class="roll__a">${label}</span><span class="roll__b" aria-hidden="true">${label}</span></span>`;

  /* ---------------------------------------------------------------- icons */

  const svg = (paths, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;

  const ICONS = {
    arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 'class="i-arrow"'),
    arrowLeft:  svg('<path d="M19 12H5M11 18l-6-6 6-6"/>', 'class="i-arrow"'),
    arrowUp:    svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    arrowNE:    svg('<path d="M7 17L17 7M8 7h9v9"/>'),
    download:   svg('<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>'),
    close:      svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    email:      svg('<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M3 6.5l9 6 9-6"/>'),
    phone:      svg('<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 006.5 6.5l1.5-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014.5 5.2 2 2 0 016.5 3z"/>'),
    location:   svg('<path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    drafting:   svg('<path d="M4 20L12 4l8 16M7.5 14h9"/><circle cx="12" cy="4" r="1.2"/>'),
    analysis:   svg('<path d="M3 20h18M6 20V9M11 20V5M16 20v-7M21 20v-4"/>'),
    manufacturing: svg('<path d="M3 20h18V9l-5 3.5V9l-5 3.5V9L3 12.5V20z"/><path d="M3 12.5L4 4h3l1 8.5"/>'),
    automation: svg('<rect x="4" y="8" width="16" height="10" rx="2"/><path d="M12 8V4M9 4h6M8.5 13h.01M15.5 13h.01"/>'),
    cog:        svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'),
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.950 3.77-1.95C20.4 8.75 21 11 21 14.1V21h-4v-6.1c0-1.46-.03-3.34-2.05-3.34-2.05 0-2.37 1.59-2.370 3.23V21H9z"/></svg>',
    whatsapp:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.05L2 22l5.07-1.33A10 10 0 1012 2zm5.3 14.1c-.23.64-1.33 1.22-1.84 1.27-.5.05-.97.23-3.27-.68-2.75-1.08-4.5-3.870-4.63-4.05-.14-.18-1.11-1.48-1.11-2.82s.7-2 .95-2.28c.25-.27.55-.34.73-.34l.52.01c.17 0 .4-.06.62.48l.85 2.07c.07.14.12.31.02.5l-.3.45-.44.48c-.14.14-.29.3-.12.58.16.28.73 1.2 1.56 1.95 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07l.87-1c.2-.23.37-.18.62-.09l2 .95c.25.12.42.18.48.28.06.1.06.57-.17 1.2z"/></svg>',
    telegram:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3L18.6 19.6c-.25 1.1-.9 1.37-1.83.85l-5.06-3.73-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15 9.37-8.47c.4-.36-.09-.56-.63-.2L5.78 12.9.79 11.34c-1.08-.34-1.1-1.08.23-1.6L20.5 2.9c.9-.33 1.69.2 1.4 1.4z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    grabcad:   svg('<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/>'),
    website:   svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15 0 18M12 3c-2.5 2.7-2.5 15 0 18"/>')
  };
  const icon = (name) => ICONS[name] || ICONS.cog;
  const fwd = () => (rtl() ? ICONS.arrowLeft : ICONS.arrowRight);

  /* ---------------------------------------------------------------- theme */

  function applyTheme(theme = {}) {
    const map = {
      colorBackground: '--bg', colorSurface: '--surface', colorSurfaceRaised: '--surface-2',
      colorBorder: '--border', colorText: '--text', colorTextMuted: '--muted',
      colorAccent: '--accent', colorAccentInk: '--accent-ink', colorBlueprint: '--accent-2',
      cornerRadius: '--radius'
    };
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(map)) {
      if (theme[key]) root.style.setProperty(cssVar, theme[key]);
    }
    const stack = (font, fallback) =>
      font ? `${font.includes(',') ? font : `${font}, ${fallback}`}` : null;
    if (theme.fontDisplay) root.style.setProperty('--font-display', stack(theme.fontDisplay, 'system-ui, sans-serif'));
    if (theme.fontBody)    root.style.setProperty('--font-body',    stack(theme.fontBody, 'system-ui, sans-serif'));
    if (theme.fontMono)    root.style.setProperty('--font-mono',    stack(theme.fontMono, 'ui-monospace, monospace'));

    root.dataset.grid = theme.showBlueprintGrid === false ? 'off' : 'on';
    root.dataset.anim = theme.enableAnimations === false ? 'off' : 'on';
    if (theme.colorBackground) {
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme.colorBackground);
    }
  }

  const cssVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  /* -------------------------------------------------------------- sections */

  const enabledSections = () => (DATA.sections || []).filter((s) => s.enabled !== false);

  function renderChrome() {
    return `
      <div class="grain" aria-hidden="true"></div>
      <div class="scroll-progress" aria-hidden="true"><span id="scroll-progress"></span></div>
      <div class="cursor" id="cursor" aria-hidden="true">
        <span class="cursor__ring"><span class="cursor__label" id="cursor-label"></span></span>
        <span class="cursor__dot"></span>
      </div>
      <div class="curtain" id="curtain" aria-hidden="true"></div>`;
  }

  function renderHeader() {
    const navItems = enabledSections()
      .filter((s) => s.showInNav)
      .map((s, i) => `<a class="nav__link" href="#${esc(s.key)}" data-nav="${esc(s.key)}" style="--i:${i}">
          <span class="nav__num mono">0${i + 1}</span>${roll(te(s.navLabel))}</a>`)
      .join('');

    const langToggle = DATA.site.showLanguageToggle === false ? '' : `
      <div class="lang-toggle ${LANG === 'fa' ? 'is-fa' : ''}" role="group" aria-label="Language">
        <span class="lang-toggle__pill" aria-hidden="true"></span>
        <button type="button" data-lang="en" class="${LANG === 'en' ? 'is-active' : ''}">EN</button>
        <button type="button" data-lang="fa" class="${LANG === 'fa' ? 'is-active' : ''}">فا</button>
      </div>`;

    return `
    <header class="site-header" id="site-header">
      <div class="shell site-header__inner">
        <a class="brand" href="#hero" data-magnetic>
          <span class="brand__mark">${esc(DATA.site.brandInitials || 'SM')}</span>
          <span class="brand__name">${te(DATA.hero.name)}</span>
        </a>
        <nav class="nav" id="nav" aria-label="Main">${navItems}</nav>
        <div class="header__actions">
          ${langToggle}
          <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="nav"
                  aria-label="Menu"><span></span><span></span></button>
        </div>
      </div>
    </header>`;
  }

  function renderHero() {
    const h = DATA.hero;
    return `
    <section class="hero" id="hero">
      <canvas class="hero__canvas" id="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero__glow" aria-hidden="true"></div>
      <div class="shell hero__inner">
        <div class="hero__content" data-hero-fade>
          <p class="hero__eyebrow mono" data-intro="0"><span class="pulse-dot"></span><span data-scramble>${te(h.eyebrow)}</span></p>
          <h1 class="hero__name split" data-intro="1">${letters(h.name)}</h1>
          <p class="hero__headline split" data-intro="2">${words(h.headline)}</p>
          <p class="hero__intro fade-up" data-intro="3">${te(h.intro)}</p>
          <div class="hero__actions fade-up" data-intro="4">
            <a class="btn btn--primary" href="${esc(h.primaryButtonLink)}" data-magnetic>
              <span class="btn__fill"></span>${roll(te(h.primaryButtonLabel))} ${fwd()}
            </a>
            <a class="btn btn--ghost" href="${esc(h.secondaryButtonLink)}" download data-magnetic>
              <span class="btn__fill"></span>${ICONS.download} ${roll(te(h.secondaryButtonLabel))}
            </a>
          </div>
        </div>
        <figure class="hero__figure" data-intro="2">
          <div class="hero__photo" data-tilt data-speed="-0.08">
            <span class="hero__photo-border" aria-hidden="true"></span>
            <img src="${esc(h.photo)}" alt="${te(h.photoAlt)}" width="640" height="800">
            <span class="hero__photo-shine" aria-hidden="true"></span>
            <span class="hero__chip hero__chip--a mono" dir="ltr" aria-hidden="true">Ø 42.00 ±0.02</span>
            <span class="hero__chip hero__chip--b mono" dir="ltr" aria-hidden="true">6 BAR · 0.8 s</span>
          </div>
          <figcaption class="hero__caption mono">${te(h.photoCaption)}</figcaption>
        </figure>
      </div>
      <a class="hero__scroll mono" href="#main-content" aria-hidden="true" tabindex="-1">
        <span class="hero__scroll-line"></span><span>${te(h.scrollHint)}</span>
      </a>
    </section>
    <span id="main-content"></span>`;
  }

  function renderMarquee(reverse = false) {
    const names = [];
    (DATA.skills?.categories || []).filter(on).forEach((c) => names.push(t(c.title)));
    const cats = [...new Set((DATA.projects?.items || []).filter(on).map((i) => t(i.category)).filter(Boolean))];
    const list = (reverse ? cats.concat(names) : names.concat(cats));
    if (!list.length) return '';
    const chunk = list.map((n) => `<span class="marquee__item">${esc(n)}</span><span class="marquee__star" aria-hidden="true">✦</span>`).join('');
    return `
    <div class="marquee ${reverse ? 'marquee--alt' : ''}" aria-hidden="true" data-marquee="${reverse ? -1 : 1}">
      <div class="marquee__track"><div class="marquee__group">${chunk}</div><div class="marquee__group">${chunk}</div></div>
    </div>`;
  }

  function renderStats() {
    const s = DATA.stats;
    if (!s || s.enabled === false || !s.items?.length) return '';
    const cells = s.items.map((it, i) => `
      <div class="stat reveal" style="--d:${i}">
        <svg class="stat__ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" pathLength="100"/>
          <circle class="stat__ring-fg" cx="60" cy="60" r="54" pathLength="100"/>
        </svg>
        <div class="stat__value" dir="ltr" data-count="${esc(it.value)}" data-suffix="${esc(it.suffix || '')}">${esc(it.value)}${esc(it.suffix || '')}</div>
        <div class="stat__label">${te(it.label)}</div>
      </div>`).join('');
    return `${renderMarquee(false)}
    <section class="stats" id="stats"><div class="shell"><div class="stats__grid">${cells}</div></div></section>`;
  }

  function sectionHead(d, extra = '') {
    return `
      <div class="section__head ${extra}">
        <span class="section__bignum" data-speed="0.12" aria-hidden="true">${esc(d.sectionNumber || '')}</span>
        <p class="section__eyebrow mono reveal">
          <span class="section__number">${esc(d.sectionNumber || '')}</span>
          <span class="section__line"></span>
          <span>${te(d.sectionTitle)}</span>
        </p>
        <h2 class="section__title split reveal-split">${words(d.heading)}</h2>
      </div>`;
  }

  function renderAbout() {
    const a = DATA.about;
    const ps = a.paragraphs || [];
    const lead = ps.length ? `<p class="about__lead scrub">${scrubWords(ps[0])}</p>` : '';
    const rest = ps.slice(1).map((p, i) => `<p class="reveal" style="--d:${i}">${te(p)}</p>`).join('');
    const rows = (a.specs || []).map((r, i) => `
      <div class="spec-row" style="--d:${i}">
        <span class="spec-row__key mono">${te(r.label)}</span>
        <span class="spec-row__val">${te(r.value)}</span>
      </div>`).join('');
    return `
    <section class="section" id="about">
      <div class="shell">
        ${sectionHead(a)}
        ${lead}
        <div class="about__grid">
          <div class="about__body">${rest}</div>
          <aside class="spec-card reveal" data-tilt>
            <span class="spec-card__glare" aria-hidden="true"></span>
            <div class="spec-card__head mono"><span class="pulse-dot"></span>${te(a.specSheetTitle)}</div>
            <div class="spec-card__rows stagger">${rows}</div>
          </aside>
        </div>
      </div>
    </section>`;
  }

  function renderSkills() {
    const s = DATA.skills;
    const cards = (s.categories || []).filter(on).map((c, ci) => {
      const rows = (c.skills || []).map((sk, i) => {
        const lvl = clamp(Number(sk.level) || 0, 0, 100);
        return `
        <div class="skill-row" style="--d:${i}">
          <div class="skill-row__top">
            <span>${esc(sk.name)}</span>
            <span class="skill-row__level mono" data-count="${lvl}" data-suffix="%">${lvl}%</span>
          </div>
          <div class="skill-row__track"><div class="skill-row__fill" style="--lvl:${lvl / 100}"></div></div>
        </div>`;
      }).join('');
      return `
      <article class="skill-card reveal" style="--d:${ci}" data-tilt>
        <span class="skill-card__glare" aria-hidden="true"></span>
        <div class="skill-card__top">
          <div class="skill-card__icon">${icon(c.icon)}</div>
          <span class="skill-card__idx mono">/0${ci + 1}</span>
        </div>
        <h3 class="skill-card__title">${te(c.title)}</h3>
        <p class="skill-card__desc">${te(c.description)}</p>
        <div class="skill-card__rows">${rows}</div>
      </article>`;
    }).join('');
    return `
    <section class="section section--alt grid-bg" id="skills">
      <div class="shell">${sectionHead(s)}<div class="skills__grid">${cards}</div></div>
    </section>`;
  }

  const visibleProjects = () => (DATA.projects.items || []).filter(on);

  function renderProjects() {
    const p = DATA.projects;
    const items = visibleProjects();

    let filters = '';
    if (p.showFilters !== false) {
      const cats = [...new Set(items.map((i) => t(i.category)).filter(Boolean))];
      filters = `
        <div class="filters reveal" id="filters">
          <span class="filters__pill" aria-hidden="true"></span>
          <button class="filter is-active" data-filter="*">${te(p.allFilterLabel)}<sup>${items.length}</sup></button>
          ${cats.map((c) => `<button class="filter" data-filter="${esc(c)}">${esc(c)}<sup>${items.filter((i) => t(i.category) === c).length}</sup></button>`).join('')}
        </div>`;
    }

    const viewLabel = rtl() ? 'مشاهده' : 'View';
    const cards = items.map((it, i) => `
      <button class="project-card reveal" data-project="${i}" data-category="${te(it.category)}"
              type="button" aria-haspopup="dialog" data-cursor="${viewLabel}" style="--d:${i % 3}">
        <div class="project-card__media">
          <img src="${esc(it.cover)}" alt="${te(it.title)}" loading="lazy" width="640" height="400">
          <span class="project-card__code mono">${esc(it.code || '')}</span>
          <span class="project-card__year mono">${esc(it.year || '')}</span>
          <span class="project-card__open" aria-hidden="true">${ICONS.arrowNE}</span>
        </div>
        <div class="project-card__body">
          <p class="project-card__category mono">${te(it.category)}</p>
          <h3 class="project-card__title">${te(it.title)}</h3>
          <p class="project-card__summary">${te(it.summary)}</p>
          <span class="project-card__more">${roll(te(p.detailLabels.viewMore))} ${fwd()}</span>
        </div>
      </button>`).join('');

    return `
    <section class="section" id="projects">
      <div class="shell">${sectionHead(p)}${filters}<div class="projects__grid" id="projects-grid">${cards}</div></div>
    </section>
    ${renderMarquee(true)}`;
  }

  function renderExperience() {
    const e = DATA.experience;
    const items = (e.items || []).filter(on).map((it) => {
      const points = (it.points || []).map((pt) => `<li>${te(pt)}</li>`).join('');
      return `
      <article class="tl-item reveal ${it.current ? 'tl-item--current' : ''}">
        <span class="tl-item__node" aria-hidden="true"></span>
        <div class="tl-item__side">
          <p class="tl-item__period mono">${te(it.period)}</p>
          ${it.current ? `<span class="tl-item__now mono"><span class="pulse-dot"></span>${rtl() ? 'اکنون' : 'Now'}</span>` : ''}
        </div>
        <div class="tl-item__card">
          <h3 class="tl-item__role">${te(it.role)}</h3>
          <p class="tl-item__company"><strong>${te(it.company)}</strong> · ${te(it.location)}</p>
          ${points ? `<ul class="tl-item__points">${points}</ul>` : ''}
        </div>
      </article>`;
    }).join('');
    return `
    <section class="section section--alt" id="experience">
      <div class="shell">
        ${sectionHead(e)}
        <div class="timeline" id="timeline">
          <span class="timeline__rail" aria-hidden="true"><span class="timeline__progress" id="timeline-progress"></span></span>
          ${items}
        </div>
      </div>
    </section>`;
  }

  function renderEducation() {
    const e = DATA.education;
    const degrees = (e.degrees || []).filter(on).map((d, i) => `
      <article class="edu-card reveal" style="--d:${i}" data-tilt>
        <span class="edu-card__glare" aria-hidden="true"></span>
        <p class="edu-card__period mono">${te(d.period)}</p>
        <h4 class="edu-card__title">${te(d.degree)}</h4>
        <p class="edu-card__sub">${te(d.school)}</p>
        ${t(d.note) ? `<p class="edu-card__note">${te(d.note)}</p>` : ''}
      </article>`).join('');

    const certs = (e.certifications || []).filter(on).map((c, i) => `
      <article class="edu-card edu-card--slim reveal" style="--d:${i}">
        <p class="edu-card__period mono">${esc(c.year || '')}</p>
        <h4 class="edu-card__title">${te(c.title)}</h4>
        <p class="edu-card__sub">${te(c.issuer)}</p>
        ${c.link ? `<a class="edu-card__link" href="${esc(c.link)}" target="_blank" rel="noopener">Verify ${ICONS.arrowNE}</a>` : ''}
      </article>`).join('');

    return `
    <section class="section" id="education">
      <div class="shell">
        ${sectionHead(e)}
        <div class="edu__grid">
          <div><h3 class="edu__col-title mono reveal">${te(e.educationTitle)}</h3>${degrees}</div>
          <div><h3 class="edu__col-title mono reveal">${te(e.certificationsTitle)}</h3>${certs}</div>
        </div>
      </div>
    </section>`;
  }

  function renderContact() {
    const c = DATA.contact;
    const L = c.formLabels || {};

    const details = (c.details || []).filter(on).map((d, i) => {
      const inner = `
        <span class="contact-row__icon">${icon(d.type)}</span>
        <span class="contact-row__label mono">${te(d.label)}</span>
        <span class="contact-row__value" dir="ltr">${esc(d.value)}</span>
        <span class="contact-row__arrow">${ICONS.arrowNE}</span>`;
      return d.link
        ? `<a class="contact-row reveal" style="--d:${i}" href="${esc(d.link)}">${inner}</a>`
        : `<div class="contact-row reveal" style="--d:${i}">${inner}</div>`;
    }).join('');

    const socials = (c.socials || []).filter(on).map((s) => `
      <a class="social" href="${esc(s.url)}" target="_blank" rel="noopener" data-magnetic
         aria-label="${esc(s.label)}" title="${esc(s.label)}">${icon(s.icon)}</a>`).join('');

    const form = c.showForm === false ? '' : `
      <form class="form reveal" id="contact-form" name="contact" method="POST"
            data-provider="${esc(c.formProvider || 'netlify')}"
            data-endpoint="${esc(c.formspreeEndpoint || '')}" novalidate>
        <input type="hidden" name="form-name" value="contact">
        <p style="display:none"><label>Do not fill<input name="bot-field"></label></p>
        <div class="field"><input id="cf-name" name="name" type="text" required autocomplete="name" placeholder=" "><label for="cf-name">${te(L.name)}</label></div>
        <div class="field"><input id="cf-email" name="email" type="email" required autocomplete="email" placeholder=" "><label for="cf-email">${te(L.email)}</label></div>
        <div class="field"><input id="cf-company" name="company" type="text" autocomplete="organization" placeholder=" "><label for="cf-company">${te(L.company)}</label></div>
        <div class="field"><textarea id="cf-message" name="message" required placeholder=" "></textarea><label for="cf-message">${te(L.message)}</label></div>
        <button class="btn btn--primary btn--block" type="submit" data-magnetic><span class="btn__fill"></span>${roll(te(L.submit))}</button>
        <p class="form__status" id="form-status" role="status"
           data-sending="${te(L.sending)}" data-success="${te(L.success)}" data-error="${te(L.error)}"></p>
      </form>`;

    const email = (c.details || []).find((d) => on(d) && d.type === 'email');

    return `
    <section class="section contact grid-bg" id="contact">
      <div class="shell">
        ${sectionHead(c, 'section__head--center')}
        ${email ? `
        <a class="contact__big" href="${esc(email.link || 'mailto:' + email.value)}" data-cursor="${rtl() ? 'ایمیل' : 'Write'}">
          <span class="contact__big-orb" aria-hidden="true"></span>
          <span class="contact__big-text" dir="ltr">${esc(email.value)}</span>
        </a>` : ''}
        <div class="contact__grid ${form ? '' : 'contact__grid--single'}">
          <div>
            <p class="contact__intro reveal">${te(c.intro)}</p>
            <div class="contact__rows">${details}</div>
            <div class="socials reveal">${socials}</div>
          </div>
          ${form}
        </div>
      </div>
    </section>`;
  }

  function renderFooter() {
    const f = DATA.footer;
    const year = new Date().getFullYear();
    return `
    <footer class="site-footer">
      <div class="shell">
        <div class="site-footer__top">
          <p class="site-footer__tagline">${te(f.tagline)}</p>
          <a class="to-top" href="#hero" data-magnetic aria-label="${te(f.backToTop)}">${ICONS.arrowUp}<span>${te(f.backToTop)}</span></a>
        </div>
        <div class="site-footer__giant" aria-hidden="true"><span>${esc(t(DATA.hero.name))}</span></div>
        <p class="site-footer__meta mono">© ${year} ${te(f.copyrightName)} — ${te(f.note)}</p>
      </div>
    </footer>`;
  }

  const RENDERERS = {
    hero: renderHero, stats: renderStats, about: renderAbout, skills: renderSkills,
    projects: renderProjects, experience: renderExperience,
    education: renderEducation, contact: renderContact
  };

  /* ------------------------------------------------------------ page build */

  function render() {
    const html = enabledSections()
      .map((s) => (RENDERERS[s.key] ? RENDERERS[s.key]() : ''))
      .join('');

    $('#app').innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      ${renderChrome()}
      ${renderHeader()}
      <main id="main">${html}</main>
      ${renderFooter()}
      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-hidden="true"></div>`;

    $('#app').removeAttribute('aria-busy');
    wireUp();
  }

  function applyLanguage() {
    const html = document.documentElement;
    html.lang = LANG;
    html.dir = rtl() ? 'rtl' : 'ltr';
    document.title = t(DATA.site.pageTitle);
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', t(DATA.site.metaDescription));
    try { localStorage.setItem(STORE_KEY, LANG); } catch (e) { /* private mode */ }
  }

  function setLanguage(lang) {
    if (lang === LANG) return;
    const swap = () => {
      LANG = lang;
      applyLanguage();
      render();
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.classList.add('is-ready');
      introHero();
    };
    const curtain = $('#curtain');
    if (!motionOn() || !curtain) { swap(); return; }
    curtain.classList.add('is-in');
    setTimeout(() => {
      swap();
      const c2 = $('#curtain');
      c2.classList.add('is-in', 'no-trans');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        c2.classList.remove('no-trans');
        c2.classList.add('is-out');
      }));
      setTimeout(() => c2.classList.remove('is-in', 'is-out'), 900);
    }, 620);
  }

  /* -------------------------------------------------------------- behaviour */

  let revealIO = null;
  let spyIO = null;
  let heroIO = null;

  function wireUp() {
    initNav();
    initReveal();
    initProjects();
    initForm();
    initStructuredData();
    initPointerFx();
    initHeroCanvas();
    collectScrollTargets();
  }

  function initNav() {
    const nav = $('#nav');
    const menuBtn = $('#menu-btn');

    const setMenu = (open) => {
      nav.classList.toggle('is-open', open);
      menuBtn.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('no-scroll', open);
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('.nav__link')) setMenu(false); });

    $$('[data-lang]').forEach((btn) =>
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

    const links = $$('[data-nav]');
    if (spyIO) spyIO.disconnect();
    if (!links.length) return;
    spyIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((l) => { const sec = document.getElementById(l.dataset.nav); if (sec) spyIO.observe(sec); });
  }

  function animateCount(el, dur = 1600) {
    const raw = el.dataset.count || '';
    const target = parseFloat(raw);
    if (Number.isNaN(target)) return;
    const pad = /^0\d/.test(raw.trim());
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 4);
      const val = Math.round(target * eased);
      el.textContent = (pad && val < 10 ? '0' + val : String(val)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Letters "decode" from random glyphs into the real text (Latin only).
  function scramble(el) {
    const final = el.textContent;
    if (!motionOn() || /[؀-ۿ]/.test(final)) return;
    const glyphs = '!<>-_\\/[]{}—=+*^?#01ØΔ§';
    const len = final.length;
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const k = (now - start) / dur;
      let out = '';
      for (let i = 0; i < len; i++) {
        const reveal = i / len;
        if (k > reveal + 0.15 || final[i] === ' ') out += final[i];
        else if (k > reveal - 0.25) out += glyphs[(Math.random() * glyphs.length) | 0];
        else out += ' ';
      }
      el.textContent = out;
      if (k < 1.2) requestAnimationFrame(tick); else el.textContent = final;
    };
    requestAnimationFrame(tick);
  }

  function introHero() {
    const sc = $('[data-scramble]');
    if (sc) scramble(sc);
  }

  function activate(el) {
    el.classList.add('is-visible');
    if (!motionOn()) return;
    if (el.classList.contains('stat')) {
      const v = $('.stat__value', el);
      if (v) animateCount(v);
    }
    $$('.skill-row__level', el).forEach((v, i) => setTimeout(() => animateCount(v, 1300), 250 + i * 90));
  }

  function initReveal() {
    const els = $$('.reveal, .reveal-split');
    if (revealIO) revealIO.disconnect();
    if (!motionOn()) { els.forEach((el) => el.classList.add('is-visible')); return; }

    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        activate(en.target);
        revealIO.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => revealIO.observe(el));
  }

  /* ----------------------------------------------- pointer: cursor, tilt… */

  const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, active: false };
  const cursorPos = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };

  function initPointerFx() {
    if (!MQ_FINE.matches || !motionOn()) return;
    document.documentElement.classList.add('has-cursor');
    const label = $('#cursor-label');
    const cursor = $('#cursor');

    // Hover states for the cursor ring
    $$('a, button, [data-cursor], input, textarea').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover');
        if (el.dataset.cursor) { label.textContent = el.dataset.cursor; cursor.classList.add('has-label'); }
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover', 'has-label');
      });
    });

    // Magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      const strength = el.classList.contains('social') || el.classList.contains('to-top') ? 0.45 : 0.3;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    // 3D tilt + moving glare
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.classList.remove('is-tilting');
      });
    });

    // Buttons: the fill blob starts where the pointer enters
    $$('.btn').forEach((el) => {
      el.addEventListener('mouseenter', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--bx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--by', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  // Global listeners (registered only once, survive re-renders)
  function initGlobalListeners() {
    window.addEventListener('mousemove', (e) => {
      pointer.x = e.clientX; pointer.y = e.clientY;
      pointer.nx = e.clientX / innerWidth - 0.5;
      pointer.ny = e.clientY / innerHeight - 0.5;
      pointer.active = true;
      document.documentElement.style.setProperty('--px', e.clientX + 'px');
      document.documentElement.style.setProperty('--py', e.clientY + 'px');
    }, { passive: true });
    window.addEventListener('mousedown', () => $('#cursor')?.classList.add('is-down'));
    window.addEventListener('mouseup', () => $('#cursor')?.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => $('#cursor')?.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => $('#cursor')?.classList.remove('is-hidden'));
    window.addEventListener('resize', () => { collectScrollTargets(); sizeCanvas(); }, { passive: true });

    document.addEventListener('keydown', (e) => {
      const modal = $('#modal');
      if (!modal || !modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeProject();
      if (e.key === 'ArrowRight') stepGallery(rtl() ? -1 : 1);
      if (e.key === 'ArrowLeft')  stepGallery(rtl() ? 1 : -1);
    });

    requestAnimationFrame(loop);
  }

  /* ------------------------------------------- scroll-driven motion loop */

  let S = { parallax: [], scrub: [], marquees: [], timeline: null, tlBar: null, heroFade: null, header: null, bar: null, footerGiant: null };
  let lastY = window.scrollY;
  let velocity = 0;
  let headerHidden = false;

  function collectScrollTargets() {
    S = {
      parallax: $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed) || 0 })),
      scrub: $$('.scrub').map((el) => ({ el, words: $$('.sw', el) })),
      marquees: $$('[data-marquee]').map((el) => ({
        el, track: $('.marquee__track', el), group: $('.marquee__group', el),
        dir: parseFloat(el.dataset.marquee) || 1, x: 0
      })),
      timeline: $('#timeline'),
      tlBar: $('#timeline-progress'),
      heroFade: $('[data-hero-fade]'),
      header: $('#site-header'),
      bar: $('#scroll-progress'),
      footerGiant: $('.site-footer__giant span')
    };
  }

  function loop() {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    velocity = lerp(velocity, dy, 0.12);
    const vh = innerHeight;
    const moving = motionOn();

    // cursor
    const cur = $('#cursor');
    if (cur && document.documentElement.classList.contains('has-cursor')) {
      cursorPos.x = lerp(cursorPos.x, pointer.x, 0.9);
      cursorPos.y = lerp(cursorPos.y, pointer.y, 0.9);
      cursorPos.rx = lerp(cursorPos.rx, pointer.x, 0.16);
      cursorPos.ry = lerp(cursorPos.ry, pointer.y, 0.16);
      cur.style.setProperty('--cx', cursorPos.x + 'px');
      cur.style.setProperty('--cy', cursorPos.y + 'px');
      cur.style.setProperty('--rx', cursorPos.rx + 'px');
      cur.style.setProperty('--ry', cursorPos.ry + 'px');
    }

    // progress bar + header
    const max = document.documentElement.scrollHeight - vh;
    if (S.bar) S.bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (S.header) {
      S.header.classList.toggle('is-stuck', y > 20);
      const menuOpen = $('#nav')?.classList.contains('is-open');
      if (!menuOpen && Math.abs(dy) > 2) {
        const hide = dy > 0 && y > vh * 0.6;
        if (hide !== headerHidden) { headerHidden = hide; S.header.classList.toggle('is-hidden', hide); }
      }
    }

    if (moving) {
      // hero content drifts & fades on the way out
      if (S.heroFade && y < vh * 1.2) {
        const k = clamp(y / (vh * 0.9), 0, 1);
        S.heroFade.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
        S.heroFade.style.opacity = String(1 - k * 1.1);
        S.heroFade.style.filter = k > 0.02 ? `blur(${k * 6}px)` : '';
      }

      // parallax
      for (const p of S.parallax) {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const off = (r.top + r.height / 2 - vh / 2) * p.speed;
        p.el.style.setProperty('--py-offset', off.toFixed(1) + 'px');
      }

      // scroll-scrubbed reading highlight
      for (const s of S.scrub) {
        const r = s.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const k = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
        const lit = Math.floor(k * s.words.length * 1.05);
        s.words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      }

      // timeline progress
      if (S.timeline && S.tlBar) {
        const r = S.timeline.getBoundingClientRect();
        const k = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
        S.tlBar.style.transform = `scaleY(${k})`;
        $$('.tl-item', S.timeline).forEach((it) => {
          const ir = it.getBoundingClientRect();
          it.classList.toggle('is-passed', ir.top < vh * 0.6);
        });
      }

      // marquees react to scroll speed
      const skew = clamp(velocity * -0.35, -12, 12);
      for (const m of S.marquees) {
        if (!m.group) continue;
        const w = m.group.offsetWidth;
        m.x -= (0.6 + Math.abs(velocity) * 0.25) * m.dir;
        if (m.x <= -w) m.x += w;
        if (m.x > 0) m.x -= w;
        m.track.style.transform = `translate3d(${m.x}px,0,0) skewX(${skew}deg)`;
      }

      if (S.footerGiant) {
        const left = max - y;                       // pixels left to the bottom
        const k = clamp(1 - left / (vh * 0.6), 0, 1);
        S.footerGiant.style.setProperty('--k', k.toFixed(3));
      }
    }

    requestAnimationFrame(loop);
  }

  /* ------------------------------------ hero: a 3D point-cloud gear train */

  const G = { canvas: null, ctx: null, w: 0, h: 0, dpr: 1, pts: null, visible: true, t: 0, raf: 0, mx: 0, my: 0 };

  function buildGearPoints() {
    const pts = [];   // [x, y, z, gearId]
    const gear = (id, teeth, R, root, thick, cx, cy) => {
      const samples = teeth * 22;
      for (let s = 0; s < samples; s++) {
        const a = (s / samples) * Math.PI * 2;
        const ph = ((a / (Math.PI * 2)) * teeth) % 1;   // 0..1 within one tooth
        // trapezoid tooth profile
        let r;
        if (ph < 0.18) r = root + (R - root) * (ph / 0.18);
        else if (ph < 0.5) r = R;
        else if (ph < 0.68) r = R - (R - root) * ((ph - 0.5) / 0.18);
        else r = root;
        for (const z of [-thick, 0, thick]) pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z, id, a]);
      }
      // hub + bore
      const hubN = Math.round(60 * R);
      for (let s = 0; s < hubN; s++) {
        const a = (s / hubN) * Math.PI * 2;
        for (const z of [-thick * 1.6, thick * 1.6]) {
          pts.push([cx + Math.cos(a) * R * 0.28, cy + Math.sin(a) * R * 0.28, z, id, a]);
          pts.push([cx + Math.cos(a) * R * 0.14, cy + Math.sin(a) * R * 0.14, z, id, a]);
        }
      }
      // spokes
      const spokes = 5;
      for (let k = 0; k < spokes; k++) {
        const a = (k / spokes) * Math.PI * 2;
        for (let s = 0; s <= 14; s++) {
          const r = R * 0.28 + (root * 0.92 - R * 0.28) * (s / 14);
          pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0, id, a]);
        }
      }
      // inner rim
      const rimN = Math.round(120 * R);
      for (let s = 0; s < rimN; s++) {
        const a = (s / rimN) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * root * 0.92, cy + Math.sin(a) * root * 0.92, thick, id, a]);
      }
    };
    gear(0, 18, 1.0, 0.86, 0.1, 0, 0);
    gear(1, 10, 0.58, 0.46, 0.1, 1.44, -0.62);
    // orbit ring of loose particles
    for (let s = 0; s < 220; s++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.9 + (Math.random() - 0.5) * 0.18;
      pts.push([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.2, 2, a]);
    }
    return pts;
  }

  function sizeCanvas() {
    if (!G.canvas) return;
    const r = G.canvas.getBoundingClientRect();
    G.dpr = Math.min(2, window.devicePixelRatio || 1);
    G.w = r.width; G.h = r.height;
    G.canvas.width = Math.round(r.width * G.dpr);
    G.canvas.height = Math.round(r.height * G.dpr);
  }

  function initHeroCanvas() {
    cancelAnimationFrame(G.raf);
    G.canvas = $('#hero-canvas');
    if (!G.canvas) return;
    G.ctx = G.canvas.getContext('2d');
    if (!G.pts) G.pts = buildGearPoints();
    sizeCanvas();

    if (heroIO) heroIO.disconnect();
    heroIO = new IntersectionObserver(([en]) => { G.visible = en.isIntersecting; });
    heroIO.observe(G.canvas);

    const colA = cssVar('--accent', '#D4FF3A');
    const colB = cssVar('--accent-2', '#7C5CFF');
    const colC = cssVar('--muted', '#8C91A1');
    const cols = [colA, colB, colC];

    const draw = (time) => {
      G.raf = requestAnimationFrame(draw);
      if (!G.visible) return;
      const animate = motionOn();
      G.t = animate ? time * 0.001 : 1.2;
      const { ctx, w, h, dpr } = G;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      G.mx = lerp(G.mx, pointer.nx, 0.05);
      G.my = lerp(G.my, pointer.ny, 0.05);
      const scrollK = clamp(window.scrollY / innerHeight, 0, 1.5);

      const mobile = w < 900;
      const dirX = rtl() ? -1 : 1;
      const cx = mobile ? w * (rtl() ? 0.25 : 0.75) : w * (rtl() ? 0.3 : 0.7);
      const cy = mobile ? h * 0.2 : h * 0.5;
      const scale = (mobile ? Math.min(w, h) * 0.32 : Math.min(w * 0.3, h * 0.42)) * (1 + scrollK * 0.35);

      const rx = 0.95 + G.my * 0.5 + Math.sin(G.t * 0.3) * 0.06;
      const ry = -0.55 * dirX + G.mx * 0.7 + Math.cos(G.t * 0.25) * 0.08;
      const sx = Math.sin(rx), cxr = Math.cos(rx), sy = Math.sin(ry), cyr = Math.cos(ry);
      const spin = G.t * 0.35 + scrollK * 2.2;
      const spin1 = -spin * (18 / 10) + 0.17;
      const spinRing = G.t * 0.08;
      const focal = 3.6;

      for (let i = 0; i < G.pts.length; i++) {
        const p = G.pts[i];
        let x = p[0], y = p[1], z = p[2];
        const id = p[3];
        // spin each gear about its own axle
        if (id === 0) { const c = Math.cos(spin), s = Math.sin(spin); const nx = x * c - y * s; y = x * s + y * c; x = nx; }
        else if (id === 1) {
          const ox = 1.44, oy = -0.62; const lx = x - ox, ly = y - oy;
          const c = Math.cos(spin1), s = Math.sin(spin1);
          x = ox + lx * c - ly * s; y = oy + lx * s + ly * c;
        } else { const c = Math.cos(spinRing), s = Math.sin(spinRing); const nx = x * c - y * s; y = x * s + y * c; x = nx; }
        // tilt whole assembly
        let y2 = y * cxr - z * sx; let z2 = y * sx + z * cxr;
        let x2 = x * cyr + z2 * sy; z2 = -x * sy + z2 * cyr;
        const f = focal / (focal + z2);
        const X = cx + x2 * scale * f;
        const Y = cy + y2 * scale * f;
        const depth = clamp((1.6 - z2) / 3.2, 0.12, 1);
        const size = (id === 2 ? 1.2 : 1.7) * f;
        ctx.globalAlpha = depth * (id === 2 ? 0.5 : 0.9) * (mobile ? 0.55 : 1);
        ctx.fillStyle = cols[id];
        ctx.fillRect(X, Y, size, size);
      }
      ctx.globalAlpha = 1;
      if (!animate) cancelAnimationFrame(G.raf);
    };
    G.raf = requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------- project modal */

  let galleryIndex = 0;
  let galleryImages = [];
  let lastFocused = null;

  function initProjects() {
    const grid = $('#projects-grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('[data-project]');
      if (card) openProject(Number(card.dataset.project), card, e);
    });

    const filters = $('#filters');
    const movePill = (btn) => {
      if (!filters || !btn) return;
      const pill = $('.filters__pill', filters);
      pill.style.width = btn.offsetWidth + 'px';
      pill.style.height = btn.offsetHeight + 'px';
      pill.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    };
    requestAnimationFrame(() => movePill($('.filter.is-active')));
    document.fonts && document.fonts.ready.then(() => movePill($('.filter.is-active')));
    window.addEventListener('resize', () => movePill($('.filter.is-active')), { passive: true });

    $$('.filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.filter').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        movePill(btn);
        const f = btn.dataset.filter;
        const cards = $$('.project-card', grid);

        // FLIP: remember positions, change layout, animate from old to new
        const first = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
        cards.forEach((card) => {
          const hide = f !== '*' && card.dataset.category !== f;
          card.classList.toggle('is-hidden', hide);
          card.classList.add('is-visible');
        });
        if (!motionOn()) return;
        cards.forEach((card, i) => {
          if (card.classList.contains('is-hidden')) return;
          const a = first.get(card);
          const b = card.getBoundingClientRect();
          const wasHidden = a.width === 0;
          const kf = wasHidden
            ? [{ opacity: 0, transform: 'scale(.85) translateY(30px)' }, { opacity: 1, transform: 'none' }]
            : [{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }];
          card.animate(kf, { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', delay: wasHidden ? i * 40 : 0, fill: 'backwards' });
        });
      });
    });
  }

  function openProject(i, trigger, evt) {
    const p = DATA.projects;
    const item = visibleProjects()[i];
    if (!item) return;
    const L = p.detailLabels;
    lastFocused = trigger || null;

    galleryImages = (item.gallery && item.gallery.length)
      ? item.gallery
      : [{ image: item.cover, caption: item.title }];
    galleryIndex = 0;

    const thumbs = galleryImages.length > 1 ? `
      <div class="gallery__thumbs">
        ${galleryImages.map((g, n) => `
          <button class="gallery__thumb ${n === 0 ? 'is-active' : ''}" data-thumb="${n}" type="button"
                  aria-label="Image ${n + 1}"><img src="${esc(g.image)}" alt="" loading="lazy"></button>`).join('')}
      </div>` : '';

    const navBtns = galleryImages.length > 1 ? `
      <button class="gallery__nav gallery__nav--prev" data-step="-1" type="button" aria-label="Previous">${rtl() ? ICONS.arrowRight : ICONS.arrowLeft}</button>
      <button class="gallery__nav gallery__nav--next" data-step="1"  type="button" aria-label="Next">${rtl() ? ICONS.arrowLeft : ICONS.arrowRight}</button>
      <span class="gallery__count mono" id="gallery-count">01 / ${String(galleryImages.length).padStart(2, '0')}</span>` : '';

    const specs = (item.specs || []).map((s) => `
      <div class="spec-row">
        <span class="spec-row__key mono">${te(s.label)}</span>
        <span class="spec-row__val">${te(s.value)}</span>
      </div>`).join('');

    let n = 0;
    const block = (label, body) => t(body)
      ? `<div class="detail-block m-in" style="--d:${n++}"><p class="detail-block__label mono">${te(label)}</p><p>${te(body)}</p></div>` : '';

    const modal = $('#modal');
    const ox = evt ? evt.clientX : innerWidth / 2;
    const oy = evt ? evt.clientY : innerHeight / 2;
    modal.style.setProperty('--ox', ox + 'px');
    modal.style.setProperty('--oy', oy + 'px');

    modal.innerHTML = `
      <div class="modal__panel" role="document">
        <button class="modal__close" id="modal-close" type="button" aria-label="${te(L.close)}">${ICONS.close}</button>
        <div class="modal__inner">
          <header class="modal__head">
            <p class="modal__meta mono m-in" style="--d:0">
              <span>${esc(item.code || '')}</span>
              <span>${te(item.category)}</span>
              <span>${esc(item.year || '')}</span>
              ${t(item.client) ? `<span>${te(item.client)}</span>` : ''}
            </p>
            <h2 class="modal__title split" id="modal-title">${words(item.title)}</h2>
            <p class="modal__summary m-in" style="--d:2">${te(item.summary)}</p>
          </header>

          <div class="gallery m-in" style="--d:3">
            <div class="gallery__main">
              <img id="gallery-img" src="${esc(galleryImages[0].image)}" alt="${te(item.title)}">
              ${navBtns}
            </div>
            <p class="gallery__caption" id="gallery-caption">${te(galleryImages[0].caption)}</p>
            ${thumbs}
          </div>

          <div class="modal__grid">
            <div>
              ${block(L.problem, item.problem)}
              ${block(L.solution, item.solution)}
              ${block(L.role, item.role)}
            </div>
            <aside>
              ${t(item.outcome) ? `
                <div class="outcome-box detail-block m-in" style="--d:${n++}">
                  <p class="detail-block__label mono">${te(L.outcome)}</p>
                  <p>${te(item.outcome)}</p>
                </div>` : ''}
              ${(item.tools || []).length ? `
                <div class="detail-block m-in" style="--d:${n++}">
                  <p class="detail-block__label mono">${te(L.tools)}</p>
                  <div class="tag-list">${item.tools.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
                </div>` : ''}
              ${specs ? `
                <div class="spec-card spec-card--flat m-in" style="--d:${n++}">
                  <div class="spec-card__head mono">${te(L.specs)}</div>${specs}
                </div>` : ''}
            </aside>
          </div>
        </div>
      </div>`;

    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.remove('is-closing');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.classList.add('no-scroll');

    $('#modal-close').addEventListener('click', closeProject);
    modal.onclick = (e) => { if (e.target === modal) closeProject(); };
    $$('[data-step]', modal).forEach((b) =>
      b.addEventListener('click', () => stepGallery(Number(b.dataset.step))));
    $$('[data-thumb]', modal).forEach((b) =>
      b.addEventListener('click', () => showGallery(Number(b.dataset.thumb))));

    // swipe on touch screens
    const main = $('.gallery__main', modal);
    let sx = null;
    main.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) stepGallery((dx < 0 ? 1 : -1) * (rtl() ? -1 : 1));
      sx = null;
    });

    setTimeout(() => $('#modal-close')?.focus({ preventScroll: true }), 50);
  }

  function showGallery(nIdx, dir = 1) {
    if (!galleryImages.length) return;
    galleryIndex = (nIdx + galleryImages.length) % galleryImages.length;
    const g = galleryImages[galleryIndex];
    const img = $('#gallery-img');
    if (motionOn() && img.animate) {
      const off = 40 * dir * (rtl() ? -1 : 1);
      img.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-off}px) scale(.98)` }],
        { duration: 180, easing: 'ease-in' }).onfinish = () => {
        img.src = g.image;
        img.animate([{ opacity: 0, transform: `translateX(${off}px) scale(1.02)` }, { opacity: 1, transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      };
    } else img.src = g.image;
    $('#gallery-caption').textContent = t(g.caption);
    const cnt = $('#gallery-count');
    if (cnt) cnt.textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(galleryImages.length).padStart(2, '0')}`;
    $$('[data-thumb]').forEach((b) => b.classList.toggle('is-active', Number(b.dataset.thumb) === galleryIndex));
  }

  const stepGallery = (d) => showGallery(galleryIndex + d, d);

  function closeProject() {
    const modal = $('#modal');
    modal.classList.add('is-closing');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { if (!modal.classList.contains('is-open')) { modal.innerHTML = ''; modal.classList.remove('is-closing'); } }, 700);
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------- form */

  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('#form-status');

    const say = (kind) => {
      status.textContent = status.dataset[kind];
      status.className = 'form__status is-visible ' +
        (kind === 'success' ? 'is-ok' : kind === 'error' ? 'is-error' : '');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (form.querySelector('[name="bot-field"]').value) return;

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      say('sending');

      const provider = form.dataset.provider;
      const data = new FormData(form);

      try {
        if (provider === 'formspree' && form.dataset.endpoint) {
          const res = await fetch(form.dataset.endpoint, {
            method: 'POST', body: data, headers: { Accept: 'application/json' }
          });
          if (!res.ok) throw new Error('bad response');
        } else if (provider === 'mailto') {
          const to = (DATA.contact.details.find((d) => d.type === 'email') || {}).value || '';
          const body = `${data.get('name')} (${data.get('email')})\n${data.get('company')}\n\n${data.get('message')}`;
          window.location.href = `mailto:${to}?subject=${encodeURIComponent('Website enquiry')}&body=${encodeURIComponent(body)}`;
        } else {
          const res = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString()
          });
          if (!res.ok) throw new Error('bad response');
        }
        say('success');
        form.reset();
      } catch (err) {
        say('error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ------------------------------------- structured data (SEO: Google) --- */

  function initStructuredData() {
    const email = (DATA.contact.details || []).find((d) => d.type === 'email');
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: t(DATA.hero.name),
      jobTitle: t(DATA.hero.eyebrow),
      description: t(DATA.site.metaDescription),
      url: DATA.site.siteUrl || undefined,
      email: email ? email.value : undefined,
      sameAs: (DATA.contact.socials || []).filter(on).map((s) => s.url)
    };
    let tag = $('#ld-json');
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = 'ld-json';
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(data);
  }

  /* --------------------------------------------------------------- loader */

  function runLoader(readyPromise) {
    const loader = $('#loader');
    const count = $('#loader-count');
    const bar = $('#loader-bar');
    const finish = () => {
      document.documentElement.classList.remove('is-loading');
      document.documentElement.classList.add('is-ready');
      introHero();
      if (loader) setTimeout(() => loader.remove(), 1400);
    };
    if (!loader || !motionOn()) { if (loader) loader.remove(); document.documentElement.classList.remove('is-loading'); document.documentElement.classList.add('is-ready'); return; }

    if (DATA?.site?.brandInitials) $('.loader__brand', loader).textContent = DATA.site.brandInitials;
    let ready = false;
    readyPromise.then(() => { ready = true; });
    const t0 = performance.now();
    let shown = 0;
    const step = (now) => {
      const elapsed = now - t0;
      // run to 85% on a timer, the rest once everything is loaded
      const target = ready ? 100 : Math.min(85, elapsed / 14);
      shown = lerp(shown, target, ready ? 0.14 : 0.08);
      if (ready && shown > 99.4) shown = 100;
      const v = Math.round(shown);
      count.textContent = String(v).padStart(3, '0');
      bar.style.transform = `scaleX(${v / 100})`;
      if (v >= 100 && elapsed > 900) { loader.classList.add('is-done'); setTimeout(finish, 450); return; }
      if (elapsed > 7000) { loader.classList.add('is-done'); setTimeout(finish, 450); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------------- boot */

  async function boot() {
    try {
      const res = await fetch('content.json?v=' + Date.now());
      if (!res.ok) throw new Error('content.json could not be loaded (HTTP ' + res.status + ')');
      DATA = await res.json();
    } catch (err) {
      $('#loader')?.remove();
      $('#app').innerHTML = `
        <div style="padding:4rem 1.5rem;max-width:640px;margin:auto;font-family:system-ui;color:#F3F1EA">
          <h1 style="font-size:1.4rem">The site content could not be loaded</h1>
          <p style="color:#8C91A1">There is probably a small typo in <code>content.json</code> —
             a missing comma, bracket or quote mark.</p>
          <p style="color:#8C91A1">Paste the file into <a href="https://jsonlint.com" style="color:#D4FF3A">jsonlint.com</a>
             to find the exact line, fix it, and reload this page.</p>
          <pre style="color:#FF6B5B;white-space:pre-wrap">${esc(err.message)}</pre>
        </div>`;
      return;
    }

    let saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
    LANG = saved || DATA.site.defaultLanguage || 'en';

    applyTheme(DATA.theme || {});
    applyLanguage();
    render();
    initGlobalListeners();

    const heroImg = $('.hero__photo img');
    const imgReady = heroImg && !heroImg.complete
      ? new Promise((r) => { heroImg.onload = heroImg.onerror = r; }) : Promise.resolve();
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    runLoader(Promise.all([imgReady, fontsReady]).then(() => {
      collectScrollTargets();
    }));
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
