/* =============================================================================
   Saeed Mousavi — portfolio renderer
   Reads content.json and draws the whole page. You never need to edit this
   file: change your content at  yoursite/?edit  (or in content.json).

   Every editable piece of text carries  data-edit="path.in.content.json"
   and every editable image carries  data-edit-img="path". The on-site editor
   (assets/js/editor.js, loaded only with ?edit) uses those markers.
   ============================================================================= */
(() => {
  'use strict';

  const Site = (window.Site = {
    data: null,
    lang: 'fa',
    editing: false,
    srcMap: {},          // editor: path-in-repo -> temporary preview URL
    hooks: { afterRender: [] },
  });

  const LANG_KEY = 'sm-lang';
  const MODE_KEY = 'sm-mode';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ helpers -- */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const get = (path, o = Site.data) =>
    String(path).split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const isI18n = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'fa' in v);
  const other = () => (Site.lang === 'fa' ? 'en' : 'fa');
  const rtl = () => Site.lang === 'fa';

  /** Text for the current language (falls back to the other language on the live site). */
  const t = (v) => {
    if (!isI18n(v)) return v ?? '';
    const mine = v[Site.lang];
    if (mine) return mine;
    return Site.editing ? '' : (v[other()] || '');
  };
  const DIG = '۰۱۲۳۴۵۶۷۸۹';
  const num = (s) => (rtl() ? String(s ?? '').replace(/\d/g, (d) => DIG[d]) : String(s ?? ''));
  const on = (x) => x && x.enabled !== false;
  const visible = (x) => on(x) || Site.editing;
  const hiddenCls = (x) => (on(x) ? '' : ' is-off');
  const placeholderUrl = (u) => !u || /YOUR-|example\.com/i.test(u);

  /** An editable text element bound to a path in content.json. */
  function E(path, tag = 'span', cls = '', opt = {}) {
    const v = get(path);
    let txt = t(v);
    if (opt.digits) txt = num(txt);
    const ph = isI18n(v) ? (v[other()] || '…') : (opt.ph || '…');
    const attrs = [
      cls && `class="${cls}"`,
      `data-edit="${path}"`,
      opt.multi && 'data-multi',
      `data-ph="${esc(ph)}"`,
      opt.attrs,
    ].filter(Boolean).join(' ');
    return `<${tag} ${attrs}>${esc(txt)}</${tag}>`;
  }
  /** Only render the editable element if it has content (or we are editing). */
  const E_ = (path, tag, cls, opt) => (t(get(path)) || Site.editing ? E(path, tag, cls, opt) : '');

  const src = (p) => Site.srcMap[p] || p || '';
  function IMG(path, cls = '', altPath = '', opt = {}) {
    const p = get(path);
    const alt = altPath ? t(get(altPath)) : '';
    return `<img class="${cls}" src="${esc(src(p))}" alt="${esc(alt)}" data-edit-img="${path}"
      ${opt.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  /** Render list items with data-item markers; hidden items appear (dimmed) only while editing. */
  function each(listPath, fn) {
    const arr = get(listPath) || [];
    return arr.map((x, i) => (x && typeof x === 'object' && 'enabled' in x && !visible(x) ? '' : fn(x, i, `${listPath}.${i}`))).join('');
  }

  /* -------------------------------------------------------------- icons -- */

  const svg = (paths, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;
  const ICONS = {
    arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 'class="i-dir"'),
    arrowLeft: svg('<path d="M19 12H5M11 18l-6-6 6-6"/>', 'class="i-dir"'),
    arrowUp: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    arrowNE: svg('<path d="M7 17L17 7M8 7h9v9"/>'),
    download: svg('<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>'),
    email: svg('<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M3 6.5l9 6 9-6"/>'),
    phone: svg('<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 006.5 6.5l1.5-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014.5 5.2 2 2 0 016.5 3z"/>'),
    location: svg('<path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    drafting: svg('<path d="M4 20L12 4l8 16M7.5 14h9"/><circle cx="12" cy="4" r="1.2"/>'),
    analysis: svg('<path d="M3 20h18M6 20V9M11 20V5M16 20v-7M21 20v-4"/>'),
    manufacturing: svg('<path d="M3 20h18V9l-5 3.5V9l-5 3.5V9L3 12.5V20z"/><path d="M3 12.5L4 4h3l1 8.5"/>'),
    automation: svg('<rect x="4" y="8" width="16" height="10" rx="2"/><path d="M12 8V4M9 4h6M8.5 13h.01M15.5 13h.01"/>'),
    cog: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'),
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95C20.4 8.75 21 11 21 14.1V21h-4v-6.1c0-1.46-.03-3.34-2.05-3.34-2.05 0-2.37 1.59-2.37 3.23V21H9z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.05L2 22l5.07-1.33A10 10 0 1012 2zm5.3 14.1c-.23.64-1.33 1.22-1.84 1.27-.5.05-.97.23-3.27-.68-2.75-1.08-4.5-3.87-4.63-4.05-.14-.18-1.11-1.48-1.11-2.82s.7-2 .95-2.28c.25-.27.55-.34.73-.34l.52.01c.17 0 .4-.06.62.48l.85 2.07c.07.14.12.31.02.5l-.3.45-.44.48c-.14.14-.29.3-.12.58.16.28.73 1.2 1.56 1.95 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07l.87-1c.2-.23.37-.18.62-.09l2 .95c.25.12.42.18.48.28.06.1.06.57-.17 1.2z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3L18.6 19.6c-.25 1.1-.9 1.37-1.83.85l-5.06-3.73-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15 9.37-8.47c.4-.36-.09-.56-.63-.2L5.78 12.9.79 11.34c-1.08-.34-1.1-1.08.23-1.6L20.5 2.9c.9-.33 1.69.2 1.4 1.4z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    grabcad: svg('<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/>'),
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z"/></svg>',
    website: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15 0 18M12 3c-2.5 2.7-2.5 15 0 18"/>'),
  };
  const icon = (n) => ICONS[n] || ICONS.cog;
  const fwd = () => (rtl() ? ICONS.arrowLeft : ICONS.arrowRight);
  const back = () => (rtl() ? ICONS.arrowRight : ICONS.arrowLeft);
  Site.icons = ICONS;

  /* ------------------------------------------------------- theme + mode -- */

  function applyTheme() {
    const th = Site.data.theme || {};
    const root = document.documentElement;
    root.style.setProperty('--accent-light', th.accentLight || '#D9480F');
    root.style.setProperty('--accent-dark', th.accentDark || '#FF7A3D');
    root.classList.toggle('no-grid', th.showBlueprintGrid === false);
    root.classList.toggle('no-motion', th.enableAnimations === false || reduceMotion);
    let mode = null;
    try { if (th.showModeToggle !== false) mode = localStorage.getItem(MODE_KEY); } catch (e) { /* ignore */ }
    if (!mode) {
      mode = th.defaultMode || 'light';
      if (mode === 'auto') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.dataset.mode = mode;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = mode === 'dark' ? '#0D1015' : '#F5F4F0';
  }
  Site.applyTheme = applyTheme;

  function toggleMode() {
    const next = document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(MODE_KEY, next); } catch (e) { /* ignore */ }
    document.documentElement.dataset.mode = next;
    applyTheme();
  }

  /* ---------------------------------------------------------- sections -- */

  const sectionOn = (key) => {
    const s = (Site.data.sections || []).find((x) => x.key === key);
    return !s || s.enabled !== false;
  };

  function secHead(key) {
    const d = Site.data[key];
    return `
      <header class="sec-head reveal">
        <p class="sec-head__meta mono"><span class="sec-head__num" data-edit="${key}.sectionNumber" data-ph="00">${esc(num(d.sectionNumber))}</span>${E(`${key}.sectionTitle`)}</p>
        ${E(`${key}.heading`, 'h2', 'sec-head__title')}
      </header>`;
  }

  function renderHeader() {
    const d = Site.data;
    const navItems = (d.sections || [])
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.showInNav && s.enabled !== false && d[s.key]);
    const cv = d.hero.secondaryButtonLink;
    const showToggle = d.theme.showModeToggle !== false;
    return `
    <header class="hdr" id="hdr">
      <div class="wrap hdr__in">
        <a class="brand" href="#top" aria-label="${esc(t(d.hero.name))}">
          <span class="brand__mark mono" data-edit="site.brandInitials">${esc(d.site.brandInitials)}</span>
          <span class="brand__name">${esc(t(d.hero.name))}</span>
        </a>
        <nav class="nav" id="nav" aria-label="Main">
          ${navItems.map(({ s, i }) => `<a class="nav__link" href="#${s.key}" data-nav="${s.key}">${E(`sections.${i}.navLabel`)}</a>`).join('')}
        </nav>
        <div class="hdr__tools">
          ${d.site.showLanguageToggle !== false ? `<button class="tool-btn mono" id="lang-btn" type="button" aria-label="Language">${Site.lang === 'fa' ? 'EN' : 'فا'}</button>` : ''}
          ${showToggle ? `<button class="tool-btn" id="mode-btn" type="button" aria-label="Light / dark"><span class="i-sun">${ICONS.sun}</span><span class="i-moon">${ICONS.moon}</span></button>` : ''}
          ${cv ? `<a class="btn btn--sm btn--ghost hdr__cv" href="${esc(cv)}" target="_blank" rel="noopener">${ICONS.download}${E('site.cvLabel')}</a>` : ''}
          <button class="tool-btn hdr__menu" id="menu-btn" type="button" aria-label="Menu" aria-expanded="false">${ICONS.menu}</button>
        </div>
      </div>
      <div class="progress" aria-hidden="true"><span id="progress-bar"></span></div>
    </header>`;
  }

  function renderHero() {
    const h = Site.data.hero;
    const placeholder = /placeholder/i.test(h.photo || '');
    const photo = placeholder
      ? `<div class="hero__mono" data-edit-img="hero.photo"><span>${esc(Site.data.site.brandInitials)}</span>${Site.editing ? '<small>+ photo</small>' : ''}</div>`
      : IMG('hero.photo', 'hero__img', 'hero.photoAlt', { eager: true });
    return `
    <section class="hero" id="top" data-section="hero">
      <div class="wrap hero__grid">
        <div class="hero__text">
          ${E_('hero.availability', 'p', 'pill reveal')}
          ${E('hero.eyebrow', 'p', 'hero__eyebrow mono reveal')}
          ${E('hero.name', 'h1', 'hero__name reveal')}
          ${E('hero.headline', 'p', 'hero__headline reveal')}
          ${E('hero.intro', 'p', 'hero__intro reveal', { multi: true })}
          <div class="hero__cta reveal">
            <a class="btn btn--primary" href="${esc(h.primaryButtonLink || '#projects')}">${E('hero.primaryButtonLabel')}${fwd()}</a>
            ${h.secondaryButtonLink ? `<a class="btn btn--ghost" href="${esc(h.secondaryButtonLink)}" target="_blank" rel="noopener">${ICONS.download}${E('hero.secondaryButtonLabel')}</a>` : ''}
          </div>
        </div>
        <figure class="hero__fig reveal">
          <div class="frame">
            <span class="frame__dim frame__dim--h mono" aria-hidden="true"><i></i><b>${num('420')}</b><i></i></span>
            <span class="frame__dim frame__dim--v mono" aria-hidden="true"><i></i><b>${num('560')}</b><i></i></span>
            <div class="frame__photo">${photo}</div>
          </div>
          <figcaption class="tblock mono">
            <span class="tblock__cell tblock__cell--wide">${E('hero.photoCaption')}</span>
            <span class="tblock__cell"><small>SCALE</small>${num('1:1')}</span>
            <span class="tblock__cell"><small>SHEET</small>${num('01/01')}</span>
          </figcaption>
        </figure>
      </div>
    </section>`;
  }

  function renderStats() {
    const s = Site.data.stats;
    return `
    <section class="stats" id="stats" data-section="stats">
      <div class="wrap">
        <ul class="stats__row" data-list="stats.items">
          ${each('stats.items', (x, i, p) => `
            <li class="stat reveal${hiddenCls(x)}" data-item="${p}">
              <span class="stat__value"><span data-count data-edit="${p}.value" data-ph="0">${esc(num(x.value))}</span><span class="stat__suffix" data-edit="${p}.suffix" data-ph="">${esc(x.suffix || '')}</span></span>
              ${E(`${p}.label`, 'span', 'stat__label')}
            </li>`)}
        </ul>
      </div>
    </section>`;
  }

  function renderAbout() {
    const a = Site.data.about;
    return `
    <section class="sec" id="about" data-section="about">
      <div class="wrap">
        ${secHead('about')}
        <div class="about">
          <div class="about__text" data-list="about.paragraphs">
            ${each('about.paragraphs', (x, i, p) => `<div class="about__p reveal" data-item="${p}">${E(p, 'p', i === 0 ? 'lead' : '', { multi: true })}</div>`)}
          </div>
          <aside class="spec reveal">
            ${E('about.specSheetTitle', 'p', 'spec__title mono')}
            <dl class="spec__list" data-list="about.specs">
              ${each('about.specs', (x, i, p) => `
                <div class="spec__row${hiddenCls(x)}" data-item="${p}">
                  ${E(`${p}.label`, 'dt', 'mono')}${E(`${p}.value`, 'dd')}
                </div>`)}
            </dl>
          </aside>
        </div>
      </div>
    </section>`;
  }

  function renderSkills() {
    return `
    <section class="sec sec--alt" id="skills" data-section="skills">
      <div class="wrap">
        ${secHead('skills')}
        <div class="skills" data-list="skills.categories">
          ${each('skills.categories', (c, ci, p) => `
            <article class="skill reveal${hiddenCls(c)}" data-item="${p}">
              <div class="skill__icon">${icon(c.icon)}</div>
              ${E(`${p}.title`, 'h3', 'skill__title')}
              ${E_(`${p}.description`, 'p', 'skill__desc')}
              <ul class="skill__list" data-list="${p}.skills">
                ${each(`${p}.skills`, (s, si, sp) => `
                  <li class="lvl" data-item="${sp}">
                    <span class="lvl__name" data-edit="${sp}.name" data-ph="…">${esc(t(s.name))}</span>
                    ${s.level != null && s.level !== '' ? `<span class="lvl__bar" style="--v:${Math.max(0, Math.min(100, +s.level || 0))}%"><i></i></span>` : ''}
                  </li>`)}
              </ul>
            </article>`)}
        </div>
      </div>
    </section>`;
  }

  function projectCard(x, i, p) {
    return `
      <article class="pcard reveal${hiddenCls(x)}" data-item="${p}" data-cat="${esc(t(x.category))}">
        <a class="pcard__media" href="#/project/${esc(x.id)}" aria-label="${esc(t(x.title))}">
          ${IMG(`${p}.cover`, '', `${p}.title`)}
          <span class="pcard__code mono" data-edit="${p}.code" data-ph="PRJ">${esc(x.code || '')}</span>
        </a>
        <div class="pcard__body">
          <p class="pcard__meta mono">${E(`${p}.category`)}<span class="sep">/</span><span data-edit="${p}.year" data-ph="year">${esc(num(x.year))}</span></p>
          ${E(`${p}.title`, 'h3', 'pcard__title')}
          ${E(`${p}.summary`, 'p', 'pcard__sum')}
          <a class="pcard__more" href="#/project/${esc(x.id)}">${E('projects.detailLabels.viewMore')}${fwd()}</a>
        </div>
      </article>`;
  }

  function renderProjects() {
    const pr = Site.data.projects;
    const cats = [...new Set((pr.items || []).filter(on).map((x) => t(x.category)).filter(Boolean))];
    return `
    <section class="sec" id="projects" data-section="projects">
      <div class="wrap">
        ${secHead('projects')}
        ${pr.showFilters && cats.length > 1 ? `
          <div class="filters reveal" role="tablist">
            <button class="chip is-on" data-filter="*" type="button">${E('projects.allFilterLabel')}</button>
            ${cats.map((c) => `<button class="chip" data-filter="${esc(c)}" type="button">${esc(c)}</button>`).join('')}
          </div>` : ''}
        <div class="pgrid" data-list="projects.items">
          ${each('projects.items', projectCard)}
        </div>
      </div>
    </section>`;
  }

  function renderExperience() {
    const ex = Site.data.experience;
    return `
    <section class="sec sec--alt" id="experience" data-section="experience">
      <div class="wrap">
        ${secHead('experience')}
        <ol class="tl" data-list="experience.items">
          ${each('experience.items', (x, i, p) => `
            <li class="tl__item reveal${hiddenCls(x)}" data-item="${p}">
              <div class="tl__when mono">${E(`${p}.period`)}${x.current ? `<span class="tag tag--accent">${esc(t(ex.currentLabel) || 'Current')}</span>` : ''}</div>
              <div class="tl__body">
                ${E(`${p}.role`, 'h3', 'tl__role')}
                <p class="tl__org">${E(`${p}.company`, 'span', 'tl__company')}${t(x.location) || Site.editing ? `<span class="sep">·</span>${E(`${p}.location`)}` : ''}</p>
                <ul class="tl__points" data-list="${p}.points">
                  ${each(`${p}.points`, (pt, j, pp) => `<li data-item="${pp}">${E(pp, 'span')}</li>`)}
                </ul>
              </div>
            </li>`)}
        </ol>
      </div>
    </section>`;
  }

  function renderEducation() {
    return `
    <section class="sec" id="education" data-section="education">
      <div class="wrap">
        ${secHead('education')}
        <div class="edu">
          <div class="edu__col">
            ${E('education.educationTitle', 'h3', 'edu__h mono')}
            <div data-list="education.degrees">
            ${each('education.degrees', (x, i, p) => `
              <article class="card edu__card reveal${hiddenCls(x)}" data-item="${p}">
                <p class="mono muted">${E(`${p}.period`)}</p>
                ${E(`${p}.degree`, 'h4', 'card__title')}
                ${E(`${p}.school`, 'p', 'edu__school')}
                ${E_(`${p}.note`, 'p', 'muted small', { multi: true })}
              </article>`)}
            </div>
          </div>
          <div class="edu__col">
            ${E('education.certificationsTitle', 'h3', 'edu__h mono')}
            <ul class="certs" data-list="education.certifications">
              ${each('education.certifications', (x, i, p) => `
                <li class="cert reveal${hiddenCls(x)}" data-item="${p}">
                  <span class="cert__year mono" data-edit="${p}.year" data-ph="year">${esc(num(x.year))}</span>
                  <div>
                    ${E(`${p}.title`, 'p', 'cert__title')}
                    <p class="muted small">${E(`${p}.issuer`)}${x.link ? ` <a class="cert__link" href="${esc(x.link)}" target="_blank" rel="noopener">${ICONS.arrowNE}</a>` : ''}</p>
                  </div>
                </li>`)}
            </ul>
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderContact() {
    const c = Site.data.contact;
    const L = c.formLabels || {};
    const socials = (c.socials || []).map((s, i) => ({ s, i }))
      .filter(({ s }) => Site.editing ? true : on(s) && !placeholderUrl(s.url));
    return `
    <section class="sec contact" id="contact" data-section="contact">
      <div class="wrap contact__grid">
        <div>
          ${secHead('contact')}
          ${E('contact.intro', 'p', 'contact__intro reveal', { multi: true })}
          ${socials.length ? `<div class="socials reveal" data-list="contact.socials">
            ${socials.map(({ s, i }) => `<a class="social${hiddenCls(s)}${placeholderUrl(s.url) ? ' is-todo' : ''}" data-item="contact.socials.${i}" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(t(s.label))}" title="${esc(t(s.label))}">${icon(s.icon)}</a>`).join('')}
          </div>` : ''}
        </div>
        <div class="contact__side">
          <ul class="crows reveal" data-list="contact.details">
            ${each('contact.details', (d, i, p) => {
              const inner = `<span class="crow__icon">${icon(d.type)}</span>
                <span class="crow__txt">${E(`${p}.label`, 'small', 'mono muted')}<span class="crow__val" data-edit="${p}.value" data-ph="…" dir="auto">${esc(t(d.value))}</span></span>
                ${d.link ? `<span class="crow__go">${ICONS.arrowNE}</span>` : ''}`;
              return d.link
                ? `<li data-item="${p}" class="${hiddenCls(d).trim()}"><a class="crow" href="${esc(d.link)}">${inner}</a></li>`
                : `<li data-item="${p}" class="${hiddenCls(d).trim()}"><div class="crow">${inner}</div></li>`;
            })}
          </ul>
          ${c.showForm ? `
          <form class="form card reveal" id="contact-form" data-endpoint="${esc(c.formspreeEndpoint || '')}" data-provider="${esc(c.formProvider || '')}" novalidate>
            <label class="field"><span>${esc(t(L.name))}</span><input name="name" required autocomplete="name"></label>
            <label class="field"><span>${esc(t(L.email))}</span><input name="email" type="email" required autocomplete="email" dir="ltr"></label>
            <label class="field"><span>${esc(t(L.company))}</span><input name="company" autocomplete="organization"></label>
            <label class="field"><span>${esc(t(L.message))}</span><textarea name="message" rows="4" required></textarea></label>
            <input type="text" name="bot-field" class="hp" tabindex="-1" autocomplete="off">
            <button class="btn btn--primary" type="submit">${esc(t(L.submit))}${fwd()}</button>
            <p class="form__status" id="form-status" data-sending="${esc(t(L.sending))}" data-success="${esc(t(L.success))}" data-error="${esc(t(L.error))}" aria-live="polite"></p>
          </form>` : ''}
        </div>
      </div>
    </section>`;
  }

  function renderFooter() {
    const f = Site.data.footer;
    return `
    <footer class="ftr">
      <div class="wrap ftr__in">
        <div class="ftr__brand">
          <span class="brand__mark mono">${esc(Site.data.site.brandInitials)}</span>
          ${E('footer.tagline', 'p', 'muted')}
        </div>
        <p class="ftr__copy mono muted">© ${num(new Date().getFullYear())} ${E('footer.copyrightName')} — ${E('footer.note')}</p>
        <a class="ftr__top mono" href="#top">${E('footer.backToTop')}${ICONS.arrowUp}</a>
      </div>
    </footer>`;
  }

  /* ------------------------------------------------------- case study -- */

  function renderCase(idx) {
    const pr = Site.data.projects;
    const L = 'projects.detailLabels';
    const p = `projects.items.${idx}`;
    const x = pr.items[idx];
    const list = pr.items.map((it, i) => ({ it, i })).filter(({ it }) => visible(it));
    const pos = list.findIndex(({ i }) => i === idx);
    const prev = list[(pos - 1 + list.length) % list.length];
    const next = list[(pos + 1) % list.length];
    const block = (key) => (t(x[key]) || Site.editing ? `
      <section class="case__block reveal">
        ${E(`${L}.${key}`, 'h2', 'case__label mono')}
        ${E(`${p}.${key}`, 'p', '', { multi: true })}
      </section>` : '');
    return `
    <main class="case" id="case" data-item="${p}">
      <div class="wrap">
        <a class="case__back mono" href="#projects">${back()}${E(`${L}.back`)}</a>
        <header class="case__head">
          <p class="case__code mono reveal"><span data-edit="${p}.code" data-ph="PRJ">${esc(x.code || '')}</span></p>
          ${E(`${p}.title`, 'h1', 'case__title reveal')}
          ${E(`${p}.summary`, 'p', 'case__sum reveal', { multi: true })}
          <dl class="case__facts reveal">
            <div>${E(`${L}.category`, 'dt', 'mono')}${E(`${p}.category`, 'dd')}</div>
            <div>${E(`${L}.client`, 'dt', 'mono')}${E(`${p}.client`, 'dd')}</div>
            <div>${E(`${L}.year`, 'dt', 'mono')}<dd data-edit="${p}.year" data-ph="year">${esc(num(x.year))}</dd></div>
          </dl>
        </header>
        <figure class="case__cover reveal">${IMG(`${p}.cover`, '', `${p}.title`, { eager: true })}</figure>
        <div class="case__body">
          <div class="case__main">
            ${block('problem')}${block('solution')}${block('role')}${block('outcome')}
          </div>
          <aside class="case__side">
            <div class="spec reveal">
              ${E(`${L}.specs`, 'p', 'spec__title mono')}
              <dl class="spec__list" data-list="${p}.specs">
                ${each(`${p}.specs`, (s, i, sp) => `<div class="spec__row" data-item="${sp}">${E(`${sp}.label`, 'dt', 'mono')}${E(`${sp}.value`, 'dd')}</div>`)}
              </dl>
            </div>
            ${(x.tools || []).length || Site.editing ? `
            <div class="case__tools reveal">
              ${E(`${L}.tools`, 'p', 'spec__title mono')}
              <div class="tags" data-list="${p}.tools">${each(`${p}.tools`, (tl, i, tp) => `<span class="tag" data-item="${tp}" data-edit="${tp}" data-ph="…">${esc(t(tl))}</span>`)}</div>
            </div>` : ''}
          </aside>
        </div>
        ${(x.gallery || []).length || Site.editing ? `
        <section class="case__gallery">
          ${E(`${L}.gallery`, 'h2', 'case__label mono')}
          <div class="gal" data-list="${p}.gallery">
            ${each(`${p}.gallery`, (g, i, gp) => `
              <figure class="gal__item reveal" data-item="${gp}">
                <button class="gal__btn" type="button" data-lightbox="${i}">${IMG(`${gp}.image`, '', `${gp}.caption`)}</button>
                ${E_(`${gp}.caption`, 'figcaption', 'mono muted')}
              </figure>`)}
          </div>
        </section>` : ''}
        ${list.length > 1 ? `
        <nav class="pager">
          <a class="pager__link" href="#/project/${esc(prev.it.id)}"><small class="mono">${back()}${E(`${L}.prev`)}</small><span>${esc(t(prev.it.title))}</span></a>
          <a class="pager__link pager__link--next" href="#/project/${esc(next.it.id)}"><small class="mono">${E(`${L}.next`)}${fwd()}</small><span>${esc(t(next.it.title))}</span></a>
        </nav>` : ''}
      </div>
    </main>`;
  }

  /* ------------------------------------------------------------- render -- */

  const RENDER = {
    hero: renderHero, stats: renderStats, about: renderAbout, skills: renderSkills,
    projects: renderProjects, experience: renderExperience, education: renderEducation, contact: renderContact,
  };

  const route = () => {
    const m = location.hash.match(/^#\/project\/(.+)$/);
    if (!m) return null;
    const id = decodeURIComponent(m[1]);
    const idx = (Site.data.projects.items || []).findIndex((x) => x.id === id);
    return idx >= 0 && visible(Site.data.projects.items[idx]) ? idx : null;
  };

  function render() {
    const d = Site.data;
    const root = document.documentElement;
    root.lang = Site.lang;
    root.dir = rtl() ? 'rtl' : 'ltr';
    applyTheme();

    const caseIdx = route();
    let body;
    if (caseIdx != null) {
      body = renderCase(caseIdx);
      document.title = `${t(d.projects.items[caseIdx].title)} — ${t(d.hero.name)}`;
    } else {
      body = '<main id="main">' + (d.sections || []).map((s, i) => {
        if (!RENDER[s.key] || !d[s.key]) return '';
        if (s.enabled === false && !Site.editing) return '';
        if (s.key === 'stats' && d.stats.enabled === false && !Site.editing) return '';
        let html = RENDER[s.key]();
        if (s.enabled === false) html = html.replace('data-section=', `data-off-label="${esc(t(s.navLabel))}" data-section-off data-section=`);
        return html.replace('data-section=', `data-section-index="${i}" data-section=`);
      }).join('') + '</main>';
      document.title = t(d.site.pageTitle) || t(d.hero.name);
    }
    const desc = $('meta[name="description"]');
    if (desc) desc.content = t(d.site.metaDescription);

    $('#app').innerHTML = renderHeader() + body + renderFooter() + lightboxHtml();
    $('#app').removeAttribute('aria-busy');
    wire();
    structuredData();
    Site.hooks.afterRender.forEach((fn) => fn());
  }
  Site.render = render;
  Site.route = route;

  function setLang(l) {
    Site.lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ }
    const y = scrollY;
    render();
    scrollTo(0, y);
  }
  Site.setLang = setLang;

  /* -------------------------------------------------------------- wiring -- */

  let io;
  function wire() {
    const lb = $('#lang-btn');
    if (lb) lb.onclick = () => setLang(Site.lang === 'fa' ? 'en' : 'fa');
    const mb = $('#mode-btn');
    if (mb) mb.onclick = toggleMode;

    // mobile menu
    const menu = $('#menu-btn');
    const hdr = $('#hdr');
    menu.onclick = () => {
      const open = hdr.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', open);
    };
    $$('.nav__link').forEach((a) => a.addEventListener('click', () => hdr.classList.remove('is-open')));

    // reveal on scroll
    if (io) io.disconnect();
    const items = $$('.reveal');
    if (document.documentElement.classList.contains('no-motion') || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'));
    } else {
      io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
          if (en.target.matches('.stat')) countUp(en.target);
        }
      }), { rootMargin: '0px 0px -8% 0px' });
      items.forEach((el) => io.observe(el));
      // safety net: never leave content invisible
      setTimeout(() => items.forEach((el) => el.classList.add('in')), 2500);
    }

    // project filters
    $$('.filters .chip').forEach((b) => b.addEventListener('click', () => {
      $$('.filters .chip').forEach((x) => x.classList.toggle('is-on', x === b));
      const f = b.dataset.filter;
      $$('.pgrid .pcard').forEach((c) => c.classList.toggle('is-filtered', f !== '*' && c.dataset.cat !== f));
    }));

    // gallery lightbox
    $$('[data-lightbox]').forEach((b) => b.addEventListener('click', (e) => {
      if (Site.editing) return;
      e.preventDefault();
      openLightbox(+b.dataset.lightbox);
    }));

    initForm();
    onScroll();
  }

  function countUp(el) {
    if (Site.editing) return;
    const n = el.querySelector('[data-count]');
    if (!n) return;
    const raw = n.textContent.replace(/[۰-۹]/g, (d) => DIG.indexOf(d));
    const target = parseFloat(raw);
    if (!isFinite(target) || target === 0 || String(target) !== raw.trim()) return;
    const t0 = performance.now();
    const dur = 1200;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      n.textContent = num(Math.round(target * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function onScroll() {
    const hdr = $('#hdr');
    if (!hdr) return;
    hdr.classList.toggle('is-scrolled', scrollY > 8);
    const bar = $('#progress-bar');
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    // scroll-spy
    let cur = '';
    $$('main > section[id]').forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s.id; });
    $$('.nav__link').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === cur));
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------ lightbox -- */

  function lightboxHtml() {
    return `<div class="lb" id="lb" hidden role="dialog" aria-modal="true">
      <button class="lb__x tool-btn" type="button" data-lb="x" aria-label="Close">${ICONS.close}</button>
      <button class="lb__nav lb__nav--prev tool-btn" type="button" data-lb="-1" aria-label="Previous">${ICONS.arrowLeft}</button>
      <figure class="lb__fig"><img alt=""><figcaption class="mono"></figcaption></figure>
      <button class="lb__nav lb__nav--next tool-btn" type="button" data-lb="1" aria-label="Next">${ICONS.arrowRight}</button>
    </div>`;
  }
  let lbIdx = 0;
  function openLightbox(i) {
    const idx = route();
    if (idx == null) return;
    const g = Site.data.projects.items[idx].gallery || [];
    if (!g.length) return;
    lbIdx = (i + g.length) % g.length;
    const lb = $('#lb');
    $('img', lb).src = src(g[lbIdx].image);
    $('img', lb).alt = t(g[lbIdx].caption);
    $('figcaption', lb).textContent = `${num(lbIdx + 1)} / ${num(g.length)}  ${t(g[lbIdx].caption)}`;
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    lb.onclick = (e) => {
      const a = e.target.closest('[data-lb]');
      if (e.target === lb || (a && a.dataset.lb === 'x')) closeLightbox();
      else if (a) openLightbox(lbIdx + (+a.dataset.lb) * (rtl() ? -1 : 1));
    };
  }
  function closeLightbox() {
    const lb = $('#lb');
    if (lb) lb.hidden = true;
    document.body.classList.remove('no-scroll');
  }
  addEventListener('keydown', (e) => {
    const lb = $('#lb');
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') openLightbox(lbIdx + 1);
    if (e.key === 'ArrowLeft') openLightbox(lbIdx - 1);
  });

  /* ---------------------------------------------------------------- form -- */

  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('#form-status');
    const say = (k) => { status.textContent = status.dataset[k]; status.className = `form__status is-${k}`; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (Site.editing || !form.reportValidity() || form.elements['bot-field'].value) return;
      const btn = form.querySelector('button');
      btn.disabled = true;
      say('sending');
      const data = new FormData(form);
      try {
        if (form.dataset.provider === 'formspree' && form.dataset.endpoint) {
          const r = await fetch(form.dataset.endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error();
        } else {
          const to = ((Site.data.contact.details || []).find((d) => d.type === 'email') || {}).value || '';
          const body = `${data.get('name')} (${data.get('email')})\n${data.get('company')}\n\n${data.get('message')}`;
          location.href = `mailto:${to}?subject=${encodeURIComponent('Website enquiry')}&body=${encodeURIComponent(body)}`;
        }
        say('success');
        form.reset();
      } catch (err) { say('error'); } finally { btn.disabled = false; }
    });
  }

  /* --------------------------------------------------------- SEO helper -- */

  function structuredData() {
    const d = Site.data;
    const email = (d.contact.details || []).find((x) => x.type === 'email');
    let tag = $('#ld-json');
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = 'ld-json';
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Person',
      name: t(d.hero.name), jobTitle: t(d.hero.eyebrow), description: t(d.site.metaDescription),
      url: d.site.siteUrl || undefined, email: email ? email.value : undefined,
      sameAs: (d.contact.socials || []).filter((s) => on(s) && !placeholderUrl(s.url)).map((s) => s.url),
    });
  }

  /* -------------------------------------------------------------- routing -- */

  let lastWasCase = false;
  addEventListener('hashchange', () => {
    if (!Site.data) return;
    const isCase = route() != null;
    if (isCase) {
      render();
      scrollTo(0, 0);
    } else if (lastWasCase) {
      render();
      const target = location.hash && $(location.hash.replace(/^#\/?/, '#'));
      if (target) target.scrollIntoView();
      else scrollTo(0, 0);
    }
    lastWasCase = isCase;
  });

  /* ---------------------------------------------------------------- boot -- */

  function chooseLang() {
    const d = Site.data;
    let l = null;
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'fa') l = q;
    if (!l && d.site.showLanguageToggle !== false) { try { l = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ } }
    return l === 'en' || l === 'fa' ? l : d.site.defaultLanguage || 'fa';
  }

  Site.boot = (data) => {
    Site.data = data;
    Site.lang = chooseLang();
    lastWasCase = route() != null;
    render();
    if (location.hash && !lastWasCase) {
      const target = $(location.hash);
      if (target) setTimeout(() => target.scrollIntoView(), 50);
    }
  };

  Site.ready = fetch('content.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data) => { Site.boot(data); return data; })
    .catch((err) => {
      $('#app').innerHTML = `<div class="fatal"><h1>Content could not be loaded</h1>
        <p>محتوای سایت بارگذاری نشد. اگر content.json را دستی ویرایش کرده‌اید، احتمالاً یک کاما یا گیومه جا افتاده است. فایل را در jsonlint.com بررسی کنید.</p>
        <p class="mono">${esc(err.message)}</p></div>`;
      throw err;
    });

  if (new URLSearchParams(location.search).has('edit')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'assets/css/editor.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'assets/js/editor.js';
    document.body.appendChild(s);
  }
})();
