/* =============================================================================
   On-site editor — loaded only when the page is opened with  ?edit
   Click any text and type. Hover a block for its toolbar (move, copy, hide,
   details, delete). Click a picture to replace it. Press «انتشار» to publish:
   the editor commits content.json (+ new images) straight to GitHub.
   ============================================================================= */
(() => {
  'use strict';
  const Site = window.Site;
  if (!Site) return;

  /* ------------------------------------------------------------ helpers -- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isI18n = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'fa' in v) &&
    Object.keys(v).every((k) => k === 'en' || k === 'fa');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const keys = (path) => String(path).split('.');
  const get = (path, o = Site.data) => keys(path).reduce((a, k) => (a == null ? a : a[k]), o);
  function set(path, val, o = Site.data) {
    const ks = keys(path);
    const last = ks.pop();
    const parent = ks.reduce((a, k) => a[k], o);
    parent[last] = val;
  }
  const parentOf = (path) => { const ks = keys(path); const i = +ks.pop(); return { list: ks.join('.'), i }; };
  const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = () => { clearTimeout(t); fn(); }; return d; };
  const I = Site.icons;
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 005.4-1.6"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'),
    open: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
    undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>'),
    redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 000 10h3"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'),
    palette: svg('<path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 005-5c0-4.4-4-7.8-9-7.8z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/>'),
    sliders: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    send: svg('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>'),
    more: svg('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>'),
    file: svg('<path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z"/><path d="M14 3v5h5"/>'),
    check: svg('<path d="M5 12l5 5L20 7"/>'),
  };

  /* ---------------------------------------------------- labels (Persian) -- */
  const LABELS = {
    site: 'تنظیمات پایه', brandInitials: 'حروف لوگو', defaultLanguage: 'زبانی که اول نمایش داده می‌شود',
    showLanguageToggle: 'نمایش دکمهٔ تغییر زبان', pageTitle: 'عنوان تب مرورگر و گوگل', metaDescription: 'توضیح کوتاه در نتایج گوگل',
    siteUrl: 'آدرس اصلی سایت', ogImage: 'تصویر پیش‌نمایش لینک (واتس‌اپ، لینکدین)', github: 'اتصال به گیت‌هاب', owner: 'نام کاربری گیت‌هاب',
    repo: 'نام مخزن', branch: 'شاخه', cvLabel: 'متن دکمهٔ رزومه در منو',
    theme: 'ظاهر', defaultMode: 'حالت پیش‌فرض', showModeToggle: 'نمایش دکمهٔ روشن / تاریک برای بازدیدکننده',
    accentLight: 'رنگ تأکید — حالت روشن', accentDark: 'رنگ تأکید — حالت تاریک', showBlueprintGrid: 'شبکهٔ نقشه‌کشی در پس‌زمینه', enableAnimations: 'انیمیشن‌ها',
    sections: 'بخش‌ها', key: 'کلید', enabled: 'نمایش داده شود', showInNav: 'نمایش در منوی بالا', navLabel: 'نام در منو',
    hero: 'بخش معرفی (بالای صفحه)', eyebrow: 'متن کوچک بالای نام', name: 'نام', headline: 'تیتر', intro: 'معرفی کوتاه',
    primaryButtonLabel: 'متن دکمهٔ اصلی', primaryButtonLink: 'لینک دکمهٔ اصلی', secondaryButtonLabel: 'متن دکمهٔ دوم',
    secondaryButtonLink: 'فایل رزومه / لینک دکمهٔ دوم', photo: 'عکس پرتره', photoAlt: 'توضیح عکس (برای گوگل و نابینایان)',
    photoCaption: 'زیرنویس عکس', availability: 'وضعیت همکاری (خالی = پنهان)',
    stats: 'آمار', items: 'موارد', value: 'مقدار', suffix: 'پسوند (مثل +)', label: 'برچسب',
    about: 'درباره من', sectionNumber: 'شمارهٔ بخش', sectionTitle: 'عنوان کوچک بخش', heading: 'تیتر بخش', paragraphs: 'پاراگراف‌ها',
    specSheetTitle: 'عنوان جدول مشخصات', specs: 'مشخصات',
    skills: 'مهارت‌ها', categories: 'دسته‌ها', icon: 'آیکون', title: 'عنوان', description: 'توضیح', level: 'سطح (۰ تا ۱۰۰)',
    projects: 'پروژه‌ها', showFilters: 'نمایش فیلتر دسته‌ها', allFilterLabel: 'متن فیلتر «همه»', detailLabels: 'برچسب‌های صفحهٔ پروژه',
    id: 'شناسه (در آدرس صفحهٔ پروژه، فقط حروف انگلیسی)', code: 'کد پروژه', year: 'سال', category: 'دسته', client: 'کارفرما',
    summary: 'خلاصه (روی کارت)', problem: 'نیازمندی و چالش', solution: 'توصیف پروژه', role: 'نقش من', outcome: 'نتیجه و سودمندی',
    tools: 'ابزارها', cover: 'تصویر اصلی', gallery: 'گالری تصاویر', image: 'تصویر', caption: 'زیرنویس',
    viewMore: 'متن «مشاهدهٔ پروژه»', close: 'متن «بستن»', back: 'متن «همهٔ پروژه‌ها»', prev: 'متن «پروژهٔ قبلی»', next: 'متن «پروژهٔ بعدی»',
    experience: 'سوابق کاری', current: 'شغل فعلی است', currentLabel: 'برچسب «فعلی»', company: 'شرکت', location: 'محل', period: 'بازهٔ زمانی', points: 'شرح وظایف',
    education: 'تحصیلات', educationTitle: 'عنوان ستون تحصیلات', certificationsTitle: 'عنوان ستون دوره‌ها', degrees: 'مدارک',
    degree: 'مدرک', school: 'دانشگاه', note: 'توضیح', certifications: 'دوره‌ها و انتشارات', issuer: 'صادرکننده', link: 'لینک',
    contact: 'تماس', showForm: 'نمایش فرم تماس', formProvider: 'سرویس فرم', formspreeEndpoint: 'آدرس فرم Formspree',
    formLabels: 'برچسب‌های فرم', details: 'راه‌های ارتباطی', type: 'نوع', socials: 'شبکه‌های اجتماعی', url: 'آدرس',
    footer: 'پانویس', tagline: 'شعار', copyrightName: 'نام در کپی‌رایت', backToTop: 'متن «بازگشت به بالا»',
    email: 'ایمیل', company_: 'شرکت', message: 'پیام', submit: 'دکمهٔ ارسال', sending: 'در حال ارسال', success: 'پیام موفقیت', error: 'پیام خطا',
  };
  const label = (k) => LABELS[k] || String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  const ICON_OPTS = ['drafting', 'manufacturing', 'automation', 'analysis', 'cog', 'email', 'phone', 'location', 'website',
    'linkedin', 'whatsapp', 'telegram', 'instagram', 'grabcad', 'github'];
  const SELECTS = {
    defaultLanguage: [['fa', 'فارسی'], ['en', 'English']],
    defaultMode: [['light', 'روشن'], ['dark', 'تاریک'], ['auto', 'خودکار (مطابق دستگاه بازدیدکننده)']],
    type: [['email', 'ایمیل'], ['phone', 'تلفن'], ['location', 'آدرس / شهر'], ['website', 'وب‌سایت']],
    formProvider: [['mailto', 'باز کردن ایمیل بازدیدکننده'], ['formspree', 'Formspree (ارسال مستقیم)']],
    icon: ICON_OPTS.map((x) => [x, x]),
  };
  const HIDDEN_KEYS = new Set(['_README', 'key']);
  const isImgKey = (k, v) => ['photo', 'cover', 'image', 'ogImage'].includes(k) || /\.(jpe?g|png|webp|gif|svg)$/i.test(v || '');
  const isFileKey = (k, v) => /\.pdf$/i.test(v || '') || k === 'secondaryButtonLink';
  const isColorKey = (k, v) => /^accent|^color/i.test(k) && /^#[0-9a-f]{3,8}$/i.test(v || '');
  const isLtrKey = (k) => /url|link|endpoint|owner|repo|branch|id$|^id|siteUrl/i.test(k);

  /* ---------------------------------------------------------- state -- */
  const DRAFT_KEY = 'sm-draft';
  const TOKEN_KEY = 'sm-gh-token';
  const WELCOME_KEY = 'sm-editor-welcome';
  const E = {
    base: '',            // JSON of the last published content
    baseSha: null,       // blob sha of content.json on GitHub when loaded
    history: [], hIdx: -1,
    token: localStorage.getItem(TOKEN_KEY) || '',
    uploads: new Map(),  // repo path -> { b64, type }
    preview: false,
  };
  const repoCfg = () => Object.assign({ owner: 'saeedmoucavi', repo: 'portfolioV2', branch: 'main' }, Site.data.site.github || {});
  const json = () => JSON.stringify(Site.data);
  const dirty = () => json() !== E.base || E.uploads.size > 0;

  /* ---------------------------------------------------------- IndexedDB -- */
  const idb = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('sm-editor', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('uploads');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction('uploads', mode);
        const out = fn(t.objectStore('uploads'));
        t.oncomplete = () => res(out && out.result);
        t.onerror = () => rej(t.error);
      });
    };
    return {
      put: (k, v) => tx('readwrite', (s) => s.put(v, k)).catch(() => {}),
      del: (k) => tx('readwrite', (s) => s.delete(k)).catch(() => {}),
      clear: () => tx('readwrite', (s) => s.clear()).catch(() => {}),
      all: async () => {
        try {
          const db = await open();
          return await new Promise((res) => {
            const out = [];
            const c = db.transaction('uploads').objectStore('uploads').openCursor();
            c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); };
            c.onerror = () => res(out);
          });
        } catch (e) { return []; }
      },
    };
  })();

  const b64ToBlob = (b64, type) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  };
  const blobToB64 = (blob) => new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.readAsDataURL(blob);
  });
  const utf8ToB64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const b64ToUtf8 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  function addUpload(path, b64, type) {
    E.uploads.set(path, { b64, type });
    Site.srcMap[path] = URL.createObjectURL(b64ToBlob(b64, type));
    idb.put(path, { b64, type });
  }

  /* ------------------------------------------------------ history / draft -- */
  const saveDraft = debounce(() => {
    try {
      if (dirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: Site.data, base: E.base, baseSha: E.baseSha, at: Date.now() }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch (e) { toast('پیش‌نویس ذخیره نشد (حافظهٔ مرورگر پر است).', 'err'); }
    updateDock();
  }, 300);

  function commit() {
    const s = json();
    if (E.history[E.hIdx] === s) { updateDock(); return; }
    E.history = E.history.slice(0, E.hIdx + 1);
    E.history.push(s);
    if (E.history.length > 150) E.history.shift();
    E.hIdx = E.history.length - 1;
    saveDraft();
    updateDock();
  }
  const commitSoon = debounce(commit, 600);

  function restore(i) {
    commitSoon.flush();
    if (i < 0 || i >= E.history.length) return;
    E.hIdx = i;
    Site.data = JSON.parse(E.history[i]);
    rerender();
    saveDraft();
  }
  const undo = () => { commitSoon.flush(); restore(E.hIdx - 1); };
  const redo = () => restore(E.hIdx + 1);

  /** Structural change: mutate, re-render, record. */
  function change(fn, opt = {}) {
    commitSoon.flush();
    fn();
    rerender(opt);
    commit();
    if (E.inspector) E.inspector.refresh();
  }

  function rerender(opt = {}) {
    const y = scrollY;
    Site.render();
    if (!opt.noScroll) scrollTo(0, y);
  }

  /* --------------------------------------------------- page decoration -- */
  function decorate() {
    const root = document.documentElement;
    root.classList.toggle('ed-on', !E.preview);
    if (E.preview) return;

    $$('[data-edit]').forEach((el) => {
      try { el.contentEditable = 'plaintext-only'; } catch (e) { el.contentEditable = 'true'; }
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
      el.spellcheck = false;
      const v = get(el.dataset.edit);
      if (isI18n(v) && !v[Site.lang]) el.classList.add('ed-missing');
    });

    // lists that are empty get an explicit "add" button
    $$('[data-list]').forEach((list) => {
      const arr = get(list.dataset.list);
      if (Array.isArray(arr) && !list.querySelector('[data-item]')) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ed-add';
        b.innerHTML = `${IC.plus}<span>افزودن مورد</span>`;
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); insertItem(list.dataset.list, arr.length); };
        list.after(b);
      }
    });
    hideBars();
  }

  /* --------------------------------------------------------- text edits -- */
  function onInput(e) {
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (!el || E.preview) return;
    const path = el.dataset.edit;
    let txt = el.innerText.replace(/ /g, ' ');
    if (!el.hasAttribute('data-multi')) txt = txt.replace(/\n+/g, ' ');
    txt = txt.replace(/\n$/, '');
    const cur = get(path);
    if (isI18n(cur)) {
      cur[Site.lang] = txt;
      el.classList.toggle('ed-missing', !txt);
    } else if (typeof cur === 'number') {
      const n = parseFloat(txt.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      set(path, isFinite(n) ? n : txt);
    } else {
      set(path, txt);
    }
    if (path === 'hero.name') $$('.brand__name').forEach((b) => { b.textContent = txt; });
    commitSoon();
    saveDraft();
    updateDock();
  }

  function onKeydown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); openPublish(); return; }
    if (e.key === 'Escape') { closePanel(); closeModal(); if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur(); }
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (el && e.key === 'Enter' && !el.hasAttribute('data-multi')) { e.preventDefault(); el.blur(); }
  }

  function onPaste(e) {
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (!el) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, el.hasAttribute('data-multi') ? text : text.replace(/\s*\n\s*/g, ' '));
  }

  function onClick(e) {
    if (E.preview) return;
    if (e.target.closest('.ed-ui')) return;
    const img = e.target.closest('[data-edit-img]');
    if (img) { e.preventDefault(); e.stopPropagation(); pickImage(img.dataset.editImg); return; }
    const a = e.target.closest('a');
    if (!a) return;
    if (e.target.closest('[data-edit]')) { e.preventDefault(); return; }
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) return;                 // in-page / project navigation is fine
    e.preventDefault();                                // external links: edit them instead
    const item = a.closest('[data-item]');
    if (item) openInspector(item.dataset.item);
    else if (a.classList.contains('hdr__cv') || href === Site.data.hero.secondaryButtonLink) openInspector('hero', ['secondaryButtonLink', 'secondaryButtonLabel']);
    else if (a.closest('.hero__cta')) openInspector('hero', ['primaryButtonLink', 'secondaryButtonLink']);
  }

  /* ------------------------------------------------------ item toolbars -- */
  let bar, secBar, imgBar, curItem, curSec;
  function buildBars() {
    bar = document.createElement('div');
    bar.className = 'ed-ui ed-bar';
    document.body.appendChild(bar);
    secBar = document.createElement('div');
    secBar.className = 'ed-ui ed-bar ed-bar--sec';
    document.body.appendChild(secBar);
    imgBar = document.createElement('button');
    imgBar.type = 'button';
    imgBar.className = 'ed-ui ed-imgbtn';
    imgBar.innerHTML = `${IC.image}<span>تغییر تصویر</span>`;
    document.body.appendChild(imgBar);

    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b && curItem) itemAction(b.dataset.act, curItem);
    });
    secBar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b && curSec != null) sectionAction(b.dataset.act, curSec);
    });
    imgBar.addEventListener('click', () => { if (imgBar.dataset.path) pickImage(imgBar.dataset.path); });
  }
  const hideBars = () => {
    [bar, secBar, imgBar].forEach((b) => b && b.classList.remove('is-on'));
    curItem = null; curSec = null;
  };

  function place(el, target, where = 'top-end') {
    const r = target.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    el.classList.add('is-on');
    const w = el.offsetWidth;
    let left = rtl ? r.left + 6 : r.right - w - 6;
    if (where === 'top-start') left = rtl ? r.right - w - 6 : r.left + 6;
    left = Math.max(6, Math.min(innerWidth - w - 6, left));
    let top = r.top + scrollY - el.offsetHeight - 6;
    if (r.top - el.offsetHeight - 6 < 70) top = r.top + scrollY + 6;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function showItemBar(item) {
    const path = item.dataset.item;
    if (curItem === path && bar.classList.contains('is-on')) return;
    curItem = path;
    const v = get(path);
    const { list, i } = parentOf(path);
    const arr = get(list) || [];
    const canHide = v && typeof v === 'object' && !Array.isArray(v) && !isI18n(v) && 'enabled' in v;
    const isProject = /^projects\.items\.\d+$/.test(path);
    const isObj = v && typeof v === 'object' && !isI18n(v);
    const onCase = !!$('#case');
    if (onCase && isProject) { bar.classList.remove('is-on'); curItem = null; return; }
    bar.innerHTML = `
      <span class="ed-bar__lbl">${esc(itemName(list))}</span>
      ${isProject ? `<button data-act="open" title="باز کردن صفحهٔ پروژه">${IC.open}</button>` : ''}
      <button data-act="up" title="جابه‌جایی به قبل" ${i === 0 ? 'disabled' : ''}>${IC.up}</button>
      <button data-act="down" title="جابه‌جایی به بعد" ${i === arr.length - 1 ? 'disabled' : ''}>${IC.down}</button>
      <button data-act="add" title="افزودن مورد جدید بعد از این">${IC.plus}</button>
      <button data-act="dup" title="کپی">${IC.copy}</button>
      ${canHide ? `<button data-act="hide" title="${v.enabled === false ? 'نمایش' : 'پنهان کردن'}">${v.enabled === false ? IC.eye : IC.eyeOff}</button>` : ''}
      ${isObj ? `<button data-act="gear" title="جزئیات و لینک‌ها">${IC.gear}</button>` : ''}
      <button data-act="del" class="ed-danger" title="حذف">${IC.trash}</button>`;
    place(bar, item);
  }

  function itemName(list) {
    const k = list.split('.').filter((x) => !/^\d+$/.test(x)).pop();
    return { paragraphs: 'پاراگراف', specs: 'ردیف', categories: 'دسته', skills: 'مهارت', points: 'مورد', degrees: 'مدرک',
      certifications: 'دوره', details: 'راه ارتباطی', socials: 'شبکهٔ اجتماعی', gallery: 'تصویر', tools: 'ابزار' }[k] ??
      label(list.split('.')[0]);
  }

  function showSecBar(sec) {
    const i = +sec.dataset.sectionIndex;
    if (curSec === i && secBar.classList.contains('is-on')) return;
    curSec = i;
    const s = Site.data.sections[i];
    const n = Site.data.sections.length;
    secBar.innerHTML = `
      <span class="ed-bar__lbl">${esc(label(s.key))}</span>
      <button data-act="up" title="بخش قبل" ${i === 0 ? 'disabled' : ''}>${IC.up}</button>
      <button data-act="down" title="بخش بعد" ${i === n - 1 ? 'disabled' : ''}>${IC.down}</button>
      <button data-act="hide" title="${s.enabled === false ? 'نمایش بخش' : 'پنهان کردن بخش'}">${s.enabled === false ? IC.eye : IC.eyeOff}</button>
      <button data-act="gear" title="تنظیمات این بخش">${IC.gear}</button>`;
    place(secBar, sec, 'top-start');
  }

  function onPointer(e) {
    if (E.preview || e.target.closest('.ed-ui')) return;
    const img = e.target.closest('[data-edit-img]');
    if (img) {
      imgBar.dataset.path = img.dataset.editImg;
      const r = img.getBoundingClientRect();
      imgBar.classList.add('is-on');
      imgBar.style.left = `${r.left + r.width / 2 - imgBar.offsetWidth / 2}px`;
      imgBar.style.top = `${r.top + scrollY + r.height / 2 - imgBar.offsetHeight / 2}px`;
    } else imgBar.classList.remove('is-on');

    const item = e.target.closest('[data-item]');
    if (item) showItemBar(item); else { bar.classList.remove('is-on'); curItem = null; }
    const sec = e.target.closest('[data-section-index]');
    if (sec && Site.data.sections[sec.dataset.sectionIndex]) showSecBar(sec); else { secBar.classList.remove('is-on'); curSec = null; }
  }

  function blank(v, key = '') {
    if (isI18n(v)) return { en: '', fa: '' };
    if (Array.isArray(v)) return [];
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).forEach((k) => { o[k] = blank(v[k], k); });
      if ('enabled' in o) o.enabled = true;
      if ('current' in o) o.current = false;
      if ('id' in o) o.id = `project-${Date.now().toString(36)}`;
      return o;
    }
    if (typeof v === 'string') {
      if (['icon', 'type', 'image', 'cover', 'photo'].includes(key)) return v;
      return '';
    }
    return v;
  }

  function insertItem(list, at, template) {
    const arr = get(list);
    const sample = template !== undefined ? template : arr[Math.max(0, Math.min(at - 1, arr.length - 1))];
    let item;
    if (sample === undefined) item = /tools/.test(list) ? '' : { en: '', fa: '' };
    else item = blank(clone(sample));
    if (list === 'projects.items' && item && typeof item === 'object') {
      item.code = `PRJ-${String(arr.length + 1).padStart(2, '0')}`;
      item.title = { en: 'New project', fa: 'پروژهٔ جدید' };
    }
    change(() => arr.splice(at, 0, item));
    const path = `${list}.${at}`;
    requestAnimationFrame(() => {
      const el = $(`[data-item="${path}"]`);
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.add('ed-flash');
      const imgEl = el.querySelector('[data-edit-img]');
      if (/gallery/.test(list) && imgEl) pickImage(imgEl.dataset.editImg);
      else {
        const t = el.matches('[data-edit]') ? el : el.querySelector('[data-edit]');
        if (t) setTimeout(() => t.focus(), 350);
      }
    });
  }

  function itemAction(act, path) {
    const { list, i } = parentOf(path);
    const arr = get(list);
    if (act === 'open') { location.hash = `#/project/${get(path).id}`; hideBars(); return; }
    if (act === 'gear') { openInspector(path); return; }
    if (act === 'add') { insertItem(list, i + 1); return; }
    if (act === 'dup') {
      const c = clone(arr[i]);
      if (c && c.id) c.id = `${c.id}-copy`;
      change(() => arr.splice(i + 1, 0, c));
      toast('کپی شد.');
      return;
    }
    if (act === 'up' && i > 0) change(() => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
    if (act === 'down' && i < arr.length - 1) change(() => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
    if (act === 'hide') change(() => { arr[i].enabled = arr[i].enabled === false; });
    if (act === 'del') {
      change(() => arr.splice(i, 1));
      toast('حذف شد.', '', { label: 'برگرداندن', fn: undo });
    }
    hideBars();
  }

  function sectionAction(act, i) {
    const arr = Site.data.sections;
    if (act === 'gear') { openInspector(arr[i].key, null, i); return; }
    if (act === 'up' && i > 0) change(() => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
    if (act === 'down' && i < arr.length - 1) change(() => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
    if (act === 'hide') change(() => { arr[i].enabled = arr[i].enabled === false; });
    hideBars();
  }

  /* --------------------------------------------------------------- images -- */
  const slug = (s) => String(s || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const stamp = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

  async function processImage(file) {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return { blob: file, ext: file.type === 'image/gif' ? 'gif' : 'svg', type: file.type };
    const bmp = await createImageBitmap(file);
    const max = 2000;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 450 * 1024 && /png|jpe?g|webp/.test(file.type)) {
      const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
      return { blob: file, ext, type: file.type };
    }
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
    return { blob, ext: 'jpg', type: 'image/jpeg' };
  }

  function pickFile(accept) {
    return new Promise((res) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = accept;
      inp.onchange = () => res(inp.files[0] || null);
      inp.click();
    });
  }

  async function useImageFile(path, file) {
    if (!file || !/^image\//.test(file.type)) { toast('لطفاً یک فایل تصویر انتخاب کنید.', 'err'); return; }
    toast('در حال آماده‌سازی تصویر…');
    try {
      const { blob, ext, type } = await processImage(file);
      const repoPath = `assets/images/uploads/${stamp()}-${slug(file.name)}.${ext}`;
      addUpload(repoPath, await blobToB64(blob), type);
      change(() => set(path, repoPath));
      toast(`تصویر جایگزین شد (${Math.round(blob.size / 1024)} KB). با «انتشار» آپلود می‌شود.`, 'ok');
    } catch (err) {
      toast('این تصویر قابل خواندن نبود. یک JPG یا PNG دیگر امتحان کنید.', 'err');
    }
  }
  const pickImage = async (path) => useImageFile(path, await pickFile('image/*'));

  async function useDocFile(path, file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast('حجم فایل بیش از ۲۰ مگابایت است.', 'err'); return; }
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const repoPath = `assets/files/${slug(file.name)}.${ext}`;
    addUpload(repoPath, await blobToB64(file), file.type || 'application/octet-stream');
    change(() => set(path, repoPath));
    toast('فایل انتخاب شد و با «انتشار» آپلود می‌شود.', 'ok');
  }

  function onDrop(e) {
    if (E.preview) return;
    const img = e.target.closest('[data-edit-img]');
    $$('.ed-drop').forEach((x) => x.classList.remove('ed-drop'));
    if (!img || !e.dataTransfer.files.length) return;
    e.preventDefault();
    useImageFile(img.dataset.editImg, e.dataTransfer.files[0]);
  }
  function onDragOver(e) {
    const img = e.target.closest && e.target.closest('[data-edit-img]');
    if (!img || E.preview) return;
    e.preventDefault();
    img.classList.add('ed-drop');
  }

  /* --------------------------------------------------------------- panel -- */
  let panel;
  function openPanel(title, bodyFn, opt = {}) {
    closePanel();
    hideBars();
    panel = document.createElement('aside');
    panel.className = 'ed-ui ed-panel';
    panel.innerHTML = `
      <header class="ed-panel__head">
        <div><p class="ed-panel__kicker">${esc(opt.kicker || 'ویرایش')}</p><h2>${esc(title)}</h2></div>
        <button class="ed-icon" data-close title="بستن">${IC.x}</button>
      </header>
      <div class="ed-panel__body"></div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]').onclick = closePanel;
    const body = panel.querySelector('.ed-panel__body');
    const refresh = () => { const st = body.scrollTop; body.innerHTML = ''; bodyFn(body); body.scrollTop = st; };
    refresh();
    requestAnimationFrame(() => panel.classList.add('is-on'));
    document.documentElement.classList.add('ed-panel-open');
    return { el: panel, refresh };
  }
  function closePanel() {
    if (!panel) return;
    const p = panel;
    panel = null;
    E.inspector = null;
    p.classList.remove('is-on');
    document.documentElement.classList.remove('ed-panel-open');
    setTimeout(() => p.remove(), 250);
    $$('.ed-dock [data-panel]').forEach((b) => b.classList.remove('is-on'));
  }

  /* ---------------------------------------------------------- form builder -- */
  const liveRender = debounce(() => { rerender(); commit(); }, 350);

  function field(lbl, inner, hint = '') {
    const d = document.createElement('div');
    d.className = 'ed-field';
    d.innerHTML = `<label class="ed-field__lbl">${esc(lbl)}</label>${hint ? `<p class="ed-field__hint">${hint}</p>` : ''}`;
    if (typeof inner === 'string') d.insertAdjacentHTML('beforeend', inner); else d.appendChild(inner);
    return d;
  }

  function input(value, onChange, opt = {}) {
    const long = opt.long || String(value || '').length > 70;
    const el = document.createElement(long ? 'textarea' : 'input');
    el.className = 'ed-input';
    if (!long) el.type = opt.type || 'text';
    if (long) el.rows = Math.min(8, Math.max(2, Math.ceil(String(value || '').length / 48)));
    el.value = value ?? '';
    if (opt.dir) el.dir = opt.dir;
    if (opt.placeholder) el.placeholder = opt.placeholder;
    el.addEventListener('input', () => onChange(el.value));
    return el;
  }

  /** Build an editor for any value inside content.json. */
  function buildField(path, key, val, container, only) {
    if (HIDDEN_KEYS.has(key) || key.startsWith('_')) return;
    if (only && !only.includes(key)) return;
    const lbl = label(key);

    if (isI18n(val)) {
      const long = String(val.fa || '').length > 60 || String(val.en || '').length > 70 || /intro|summary|problem|solution|role|outcome|note|description|paragraph/.test(path);
      const wrap = document.createElement('div');
      wrap.className = 'ed-i18n';
      [['fa', 'فارسی', 'rtl'], ['en', 'English', 'ltr']].forEach(([l, name, dir]) => {
        const box = document.createElement('div');
        box.innerHTML = `<span class="ed-lang">${name}</span>`;
        box.appendChild(input(val[l], (v) => { get(path)[l] = v; liveRender(); }, { long, dir }));
        wrap.appendChild(box);
      });
      container.appendChild(field(lbl, wrap));
      return;
    }

    if (typeof val === 'boolean') {
      const id = `ed-${Math.random().toString(36).slice(2)}`;
      const d = document.createElement('label');
      d.className = 'ed-switch';
      d.htmlFor = id;
      d.innerHTML = `<input type="checkbox" id="${id}" ${val ? 'checked' : ''}><span class="ed-switch__ui"></span><span>${esc(lbl)}</span>`;
      d.querySelector('input').onchange = (e) => change(() => set(path, e.target.checked));
      container.appendChild(d);
      return;
    }

    if (typeof val === 'number') {
      if (key === 'level') {
        const d = document.createElement('div');
        d.className = 'ed-range';
        d.innerHTML = `<input type="range" min="0" max="100" step="5" value="${val}"><output>${val}</output>`;
        const r = d.querySelector('input');
        r.oninput = () => { d.querySelector('output').textContent = r.value; set(path, +r.value); liveRender(); };
        container.appendChild(field(lbl, d));
      } else container.appendChild(field(lbl, input(val, (v) => { set(path, v === '' ? '' : +v); liveRender(); }, { type: 'number', dir: 'ltr' })));
      return;
    }

    if (typeof val === 'string' || val == null) {
      if (SELECTS[key]) {
        const s = document.createElement('select');
        s.className = 'ed-input';
        const opts = SELECTS[key].some(([v]) => v === val) ? SELECTS[key] : [[val, val], ...SELECTS[key]];
        s.innerHTML = opts.map(([v, n]) => `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(n)}</option>`).join('');
        s.onchange = () => change(() => set(path, s.value));
        if (key === 'icon') {
          const wrap = document.createElement('div');
          wrap.className = 'ed-iconpick';
          wrap.innerHTML = ICON_OPTS.map((n) => `<button type="button" data-v="${n}" class="${n === val ? 'is-on' : ''}" title="${n}">${I[n] || ''}</button>`).join('');
          wrap.onclick = (e) => { const b = e.target.closest('button'); if (b) change(() => set(path, b.dataset.v)); };
          container.appendChild(field(lbl, wrap));
          return;
        }
        container.appendChild(field(lbl, s));
        return;
      }
      if (isColorKey(key, val)) {
        const d = document.createElement('div');
        d.className = 'ed-color';
        const presets = ['#D9480F', '#FF7A3D', '#2A57C2', '#7493F2', '#0F9D58', '#34D399', '#C2185B', '#F59E0B', '#14171C', '#ECEDEF'];
        d.innerHTML = `<input type="color" value="${esc(val)}"><input class="ed-input" dir="ltr" value="${esc(val)}">
          <div class="ed-swatches">${presets.map((c) => `<button type="button" style="--c:${c}" data-c="${c}" title="${c}"></button>`).join('')}</div>`;
        const [pick, txt] = d.querySelectorAll('input');
        const apply = (c) => { pick.value = c; txt.value = c; set(path, c); Site.applyTheme(); liveRender(); };
        pick.oninput = () => apply(pick.value);
        txt.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(txt.value)) apply(txt.value); };
        d.querySelector('.ed-swatches').onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) apply(b.dataset.c); };
        container.appendChild(field(lbl, d));
        return;
      }
      if (isImgKey(key, val)) {
        const d = document.createElement('div');
        d.className = 'ed-imgfield';
        const s = Site.srcMap[val] || val;
        d.innerHTML = `<div class="ed-thumb">${val ? `<img src="${esc(s)}" alt="">` : IC.image}</div>
          <div class="ed-imgfield__side"><button type="button" class="ed-btn ed-btn--sm">${IC.image}انتخاب تصویر جدید</button>
          <span class="ed-path" dir="ltr">${esc(val || '—')}</span></div>`;
        d.querySelector('button').onclick = () => pickImage(path);
        d.ondragover = (e) => { e.preventDefault(); d.classList.add('ed-drop'); };
        d.ondragleave = () => d.classList.remove('ed-drop');
        d.ondrop = (e) => { e.preventDefault(); d.classList.remove('ed-drop'); if (e.dataTransfer.files[0]) useImageFile(path, e.dataTransfer.files[0]); };
        container.appendChild(field(lbl, d));
        return;
      }
      const inp = input(val, (v) => { set(path, v); liveRender(); }, { dir: isLtrKey(key) ? 'ltr' : 'auto', long: /description|note/.test(key) });
      if (isFileKey(key, val)) {
        const d = document.createElement('div');
        d.className = 'ed-filefield';
        d.appendChild(inp);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ed-btn ed-btn--sm';
        b.innerHTML = `${IC.file}آپلود فایل`;
        b.onclick = async () => useDocFile(path, await pickFile('.pdf,application/pdf'));
        d.appendChild(b);
        container.appendChild(field(lbl, d, 'می‌توانید فایل PDF رزومهٔ جدید را مستقیم آپلود کنید.'));
        return;
      }
      let hint = '';
      if (key === 'id') hint = 'آدرس صفحه: <span dir="ltr">#/project/' + esc(val) + '</span>';
      if (key === 'url' && /YOUR-/.test(val)) hint = '⚠️ این آدرس هنوز نمونه است و تا وقتی درستش نکنید در سایت نمایش داده نمی‌شود.';
      container.appendChild(field(lbl, inp, hint));
      return;
    }

    if (Array.isArray(val)) {
      const box = document.createElement('details');
      box.className = 'ed-group';
      box.open = val.length <= 6;
      box.innerHTML = `<summary>${esc(lbl)} <span class="ed-count">${val.length}</span></summary>`;
      const listEl = document.createElement('div');
      listEl.className = 'ed-list';
      val.forEach((it, i) => {
        const p = `${path}.${i}`;
        const row = document.createElement('div');
        row.className = 'ed-row';
        const simple = typeof it === 'string' || isI18n(it);
        const head = document.createElement('div');
        head.className = 'ed-row__head';
        head.innerHTML = `<span class="ed-row__n">${i + 1}</span><span class="ed-row__t">${esc(summaryOf(it))}</span>
          <span class="ed-row__acts">
            ${it && it.enabled !== undefined ? `<button type="button" data-a="hide" title="نمایش / پنهان">${it.enabled === false ? IC.eyeOff : IC.eye}</button>` : ''}
            <button type="button" data-a="up" ${i === 0 ? 'disabled' : ''}>${IC.up}</button>
            <button type="button" data-a="down" ${i === val.length - 1 ? 'disabled' : ''}>${IC.down}</button>
            <button type="button" data-a="del" class="ed-danger">${IC.trash}</button>
          </span>`;
        head.onclick = (e) => {
          const b = e.target.closest('[data-a]');
          if (!b) { if (!simple) row.classList.toggle('is-open'); return; }
          const arr = get(path);
          if (b.dataset.a === 'up') change(() => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
          if (b.dataset.a === 'down') change(() => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
          if (b.dataset.a === 'del') change(() => arr.splice(i, 1));
          if (b.dataset.a === 'hide') change(() => { arr[i].enabled = arr[i].enabled === false; });
        };
        row.appendChild(head);
        const body = document.createElement('div');
        body.className = 'ed-row__body';
        if (typeof it === 'string') body.appendChild(input(it, (v) => { set(p, v); liveRender(); }, { dir: 'auto' }));
        else if (isI18n(it)) buildField(p, '', it, body);
        else if (it && typeof it === 'object') Object.keys(it).forEach((k) => buildField(`${p}.${k}`, k, it[k], body));
        row.appendChild(body);
        if (simple) row.classList.add('is-simple', 'is-open');
        listEl.appendChild(row);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'ed-btn ed-btn--ghost ed-btn--sm';
      add.innerHTML = `${IC.plus}افزودن`;
      add.onclick = () => {
        const arr = get(path);
        const sample = arr[arr.length - 1];
        change(() => arr.push(sample === undefined ? (/tools/.test(path) ? '' : { en: '', fa: '' }) : blank(clone(sample))));
      };
      box.appendChild(listEl);
      box.appendChild(add);
      container.appendChild(box);
      return;
    }

    if (val && typeof val === 'object') {
      const box = document.createElement('details');
      box.className = 'ed-group';
      box.open = !['detailLabels', 'formLabels', 'github'].includes(key);
      box.innerHTML = `<summary>${esc(lbl)}</summary>`;
      const inner = document.createElement('div');
      inner.className = 'ed-group__body';
      Object.keys(val).forEach((k) => buildField(`${path}.${k}`, k, val[k], inner));
      box.appendChild(inner);
      container.appendChild(box);
    }
  }

  function summaryOf(it) {
    if (typeof it === 'string') return it;
    if (isI18n(it)) return it.fa || it.en || '—';
    if (!it || typeof it !== 'object') return String(it);
    for (const k of ['title', 'name', 'role', 'degree', 'label', 'value', 'caption', 'url', 'image']) {
      if (it[k]) return isI18n(it[k]) ? it[k].fa || it[k].en : String(it[k]);
    }
    return '—';
  }

  function openInspector(path, only, sectionIndex) {
    const v = get(path);
    const title = path.includes('.') ? (summaryOf(v) || label(keys(path).pop())) : label(path);
    const p = openPanel(title, (body) => {
      if (sectionIndex != null) {
        const s = Site.data.sections[sectionIndex];
        const box = document.createElement('div');
        box.className = 'ed-card';
        buildField(`sections.${sectionIndex}.enabled`, 'enabled', s.enabled, box);
        buildField(`sections.${sectionIndex}.showInNav`, 'showInNav', s.showInNav, box);
        buildField(`sections.${sectionIndex}.navLabel`, 'navLabel', s.navLabel, box);
        body.appendChild(box);
      }
      const cur = get(path);
      if (cur && typeof cur === 'object' && !isI18n(cur) && !Array.isArray(cur)) {
        Object.keys(cur).forEach((k) => buildField(`${path}.${k}`, k, cur[k], body, only));
      } else buildField(path, keys(path).pop(), cur, body);
      if (only) {
        const all = document.createElement('button');
        all.className = 'ed-btn ed-btn--ghost ed-btn--sm';
        all.textContent = 'نمایش همهٔ فیلدها';
        all.onclick = () => openInspector(path);
        body.appendChild(all);
      }
    }, { kicker: 'جزئیات' });
    E.inspector = p;
  }

  /* -------------------------------------------------- dock panels (global) -- */
  function openSections() {
    E.inspector = openPanel('بخش‌های سایت', (body) => {
      body.insertAdjacentHTML('beforeend', '<p class="ed-note">ترتیب بخش‌ها را عوض کنید، پنهانشان کنید یا تعیین کنید در منوی بالا باشند یا نه. برای ویرایش متن هر بخش، روی خود صفحه کلیک کنید.</p>');
      Site.data.sections.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = `ed-secrow${s.enabled === false ? ' is-off' : ''}`;
        row.innerHTML = `
          <span class="ed-row__n">${i + 1}</span>
          <div class="ed-secrow__main"><b>${esc(s.navLabel?.fa || label(s.key))}</b><small dir="ltr">${esc(s.navLabel?.en || s.key)}</small></div>
          <button type="button" class="ed-chipbtn ${s.showInNav ? 'is-on' : ''}" data-a="nav" title="نمایش در منو">منو</button>
          <button type="button" data-a="hide" title="نمایش / پنهان">${s.enabled === false ? IC.eyeOff : IC.eye}</button>
          <button type="button" data-a="up" ${i === 0 ? 'disabled' : ''}>${IC.up}</button>
          <button type="button" data-a="down" ${i === Site.data.sections.length - 1 ? 'disabled' : ''}>${IC.down}</button>
          <button type="button" data-a="go" title="رفتن به بخش">${IC.open}</button>`;
        row.onclick = (e) => {
          const b = e.target.closest('[data-a]');
          if (!b) return;
          const arr = Site.data.sections;
          if (b.dataset.a === 'up') change(() => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
          if (b.dataset.a === 'down') change(() => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
          if (b.dataset.a === 'hide') change(() => { arr[i].enabled = arr[i].enabled === false; });
          if (b.dataset.a === 'nav') change(() => { arr[i].showInNav = !arr[i].showInNav; });
          if (b.dataset.a === 'go') {
            if (Site.route() != null) location.hash = '#' + s.key;
            const el = document.getElementById(s.key === 'hero' ? 'top' : s.key);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        };
        body.appendChild(row);
      });
    }, { kicker: 'ساختار' });
  }

  function openDesign() {
    E.inspector = openPanel('ظاهر سایت', (body) => {
      const th = Site.data.theme;
      const modes = document.createElement('div');
      modes.className = 'ed-modes';
      [['light', 'روشن', '#F5F4F0', '#14171C'], ['dark', 'تاریک', '#0D1015', '#ECEDEF'], ['auto', 'خودکار', 'linear-gradient(135deg,#F5F4F0 50%,#0D1015 50%)', '#888']].forEach(([v, n, bg, fg]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `ed-mode ${th.defaultMode === v ? 'is-on' : ''}`;
        b.innerHTML = `<span class="ed-mode__sw" style="background:${bg};color:${fg}">Aa</span>${n}`;
        b.onclick = () => {
          try { localStorage.removeItem('sm-mode'); } catch (e) { /* ignore */ }
          change(() => { th.defaultMode = v; });
        };
        modes.appendChild(b);
      });
      body.appendChild(field('حالت پیش‌فرض برای بازدیدکننده', modes));
      ['accentLight', 'accentDark', 'showModeToggle', 'showBlueprintGrid', 'enableAnimations'].forEach((k) => buildField(`theme.${k}`, k, th[k], body));
      body.insertAdjacentHTML('beforeend', '<hr class="ed-hr">');
      ['defaultLanguage', 'showLanguageToggle', 'brandInitials'].forEach((k) => buildField(`site.${k}`, k, Site.data.site[k], body));
    }, { kicker: 'رنگ و حالت' });
  }

  function openSettings() {
    E.inspector = openPanel('تنظیمات', (body) => {
      const d = Site.data;
      const groups = [
        ['site', ['pageTitle', 'metaDescription', 'ogImage', 'siteUrl', 'cvLabel']],
        ['hero', ['primaryButtonLink', 'secondaryButtonLink', 'photo', 'photoAlt']],
        ['contact', ['details', 'socials', 'showForm', 'formProvider', 'formspreeEndpoint']],
        ['footer', null],
      ];
      groups.forEach(([k, only]) => {
        const box = document.createElement('details');
        box.className = 'ed-group';
        box.open = k === 'site';
        box.innerHTML = `<summary>${esc(label(k))}</summary>`;
        const inner = document.createElement('div');
        inner.className = 'ed-group__body';
        Object.keys(d[k]).forEach((f) => buildField(`${k}.${f}`, f, d[k][f], inner, only));
        box.appendChild(inner);
        body.appendChild(box);
      });
      const more = document.createElement('details');
      more.className = 'ed-group';
      more.innerHTML = '<summary>برچسب‌ها و متن‌های کوچک</summary>';
      const inner = document.createElement('div');
      inner.className = 'ed-group__body';
      buildField('projects.detailLabels', 'detailLabels', d.projects.detailLabels, inner);
      buildField('contact.formLabels', 'formLabels', d.contact.formLabels, inner);
      buildField('site.github', 'github', d.site.github, inner);
      more.appendChild(inner);
      body.appendChild(more);
    }, { kicker: 'سایت' });
  }

  /* ---------------------------------------------------------------- dock -- */
  let dock;
  function buildDock() {
    dock = document.createElement('div');
    dock.className = 'ed-ui ed-dock';
    dock.dir = 'rtl';
    document.body.appendChild(dock);
    renderDock();
  }
  function renderDock() {
    if (E.preview) {
      dock.innerHTML = `<button class="ed-btn" data-do="preview">${IC.x}بازگشت به ویرایش</button>`;
      return;
    }
    dock.innerHTML = `
      <div class="ed-dock__brand"><span class="ed-dot"></span><b>حالت ویرایش</b></div>
      <div class="ed-seg" role="group" title="زبانی که در حال ویرایش آن هستید">
        <button data-lang="fa" class="${Site.lang === 'fa' ? 'is-on' : ''}">فارسی</button>
        <button data-lang="en" class="${Site.lang === 'en' ? 'is-on' : ''}">English</button>
      </div>
      <span class="ed-sep"></span>
      <button class="ed-icon" data-do="undo" title="واگرد (Ctrl+Z)">${IC.undo}</button>
      <button class="ed-icon" data-do="redo" title="ازنو (Ctrl+Shift+Z)">${IC.redo}</button>
      <span class="ed-sep"></span>
      <button class="ed-icon ed-icon--lbl" data-panel="sections" title="بخش‌ها">${IC.layers}<span>بخش‌ها</span></button>
      <button class="ed-icon ed-icon--lbl" data-panel="design" title="ظاهر">${IC.palette}<span>ظاهر</span></button>
      <button class="ed-icon ed-icon--lbl" data-panel="settings" title="تنظیمات">${IC.sliders}<span>تنظیمات</span></button>
      <button class="ed-icon ed-icon--lbl" data-do="preview" title="پیش‌نمایش">${IC.eye}<span>پیش‌نمایش</span></button>
      <span class="ed-sep"></span>
      <span class="ed-status" id="ed-status"></span>
      <button class="ed-btn ed-btn--primary" data-do="publish">${IC.send}<span>انتشار</span></button>
      <button class="ed-icon" data-do="menu" title="بیشتر">${IC.more}</button>`;
    updateDock();
  }
  function updateDock() {
    if (!dock || E.preview) return;
    const u = $('[data-do="undo"]', dock);
    const r = $('[data-do="redo"]', dock);
    if (u) u.disabled = E.hIdx <= 0;
    if (r) r.disabled = E.hIdx >= E.history.length - 1;
    const st = $('#ed-status');
    const pub = $('[data-do="publish"]', dock);
    const d = dirty();
    if (st) st.innerHTML = d ? '<i class="ed-dot ed-dot--warn"></i>تغییرات منتشرنشده' : `<i class="ed-dot"></i>همه‌چیز منتشر شده`;
    if (pub) pub.disabled = !d;
  }
  function onDock(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lang) { commitSoon.flush(); Site.setLang(b.dataset.lang); renderDock(); return; }
    const p = b.dataset.panel;
    if (p) {
      const wasOn = b.classList.contains('is-on');
      closePanel();
      if (wasOn) return;
      ({ sections: openSections, design: openDesign, settings: openSettings })[p]();
      b.classList.add('is-on');
      return;
    }
    const act = b.dataset.do;
    if (act === 'undo') undo();
    if (act === 'redo') redo();
    if (act === 'publish') openPublish();
    if (act === 'menu') openMenu(b);
    if (act === 'preview') {
      commitSoon.flush();
      E.preview = !E.preview;
      Site.editing = !E.preview;
      closePanel();
      hideBars();
      rerender();
      renderDock();
    }
  }

  function openMenu(anchor) {
    const m = document.createElement('div');
    m.className = 'ed-ui ed-menu';
    m.dir = 'rtl';
    m.innerHTML = `
      <button data-m="help">${IC.help}راهنمای سریع</button>
      <button data-m="token">${IC.gear}اتصال گیت‌هاب${E.token ? ' ✓' : ''}</button>
      <button data-m="discard" ${dirty() ? '' : 'disabled'}>${IC.undo}کنار گذاشتن همهٔ تغییرات</button>
      <button data-m="download">${IC.file}دانلود نسخهٔ پشتیبان (content.json)</button>
      <hr>
      <button data-m="exit">${IC.x}خروج از حالت ویرایش</button>`;
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    m.style.left = `${Math.max(8, r.left)}px`;
    m.style.bottom = `${innerHeight - r.top + 8}px`;
    const close = (e) => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true));
    m.onclick = async (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      m.remove();
      document.removeEventListener('pointerdown', close, true);
      const k = b.dataset.m;
      if (k === 'help') showWelcome(true);
      if (k === 'token') openConnect();
      if (k === 'download') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(Site.data, null, 2)], { type: 'application/json' }));
        a.download = 'content.json';
        a.click();
      }
      if (k === 'discard') {
        if (!(await confirmBox('همهٔ تغییرات منتشرنشده کنار گذاشته شوند؟', 'این کار قابل برگشت نیست.', 'بله، کنار بگذار'))) return;
        Site.data = JSON.parse(E.base);
        E.uploads.clear();
        Site.srcMap = {};
        await idb.clear();
        localStorage.removeItem(DRAFT_KEY);
        E.history = [E.base]; E.hIdx = 0;
        rerender();
        updateDock();
        toast('تغییرات کنار گذاشته شد.');
      }
      if (k === 'exit') {
        if (dirty()) toast('تغییرات شما به‌صورت پیش‌نویس در همین مرورگر ذخیره شده است.');
        const u = new URL(location.href);
        u.searchParams.delete('edit');
        setTimeout(() => { location.href = u.toString(); }, dirty() ? 900 : 0);
      }
    };
  }

  /* -------------------------------------------------------- modal / toast -- */
  let modal;
  function openModal(html, opt = {}) {
    closeModal();
    modal = document.createElement('div');
    modal.className = 'ed-ui ed-modal';
    modal.dir = 'rtl';
    modal.innerHTML = `<div class="ed-modal__box ${opt.wide ? 'is-wide' : ''}">${html}</div>`;
    document.body.appendChild(modal);
    modal.addEventListener('pointerdown', (e) => { if (e.target === modal && !opt.sticky) closeModal(); });
    requestAnimationFrame(() => modal.classList.add('is-on'));
    return modal;
  }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  function confirmBox(title, text, ok) {
    return new Promise((res) => {
      const m = openModal(`<h3>${esc(title)}</h3><p>${esc(text)}</p>
        <div class="ed-actions"><button class="ed-btn ed-btn--ghost" data-r="0">انصراف</button><button class="ed-btn ed-btn--danger" data-r="1">${esc(ok)}</button></div>`);
      m.onclick = (e) => { const b = e.target.closest('[data-r]'); if (b) { closeModal(); res(b.dataset.r === '1'); } };
    });
  }

  let toastWrap;
  function toast(msg, kind = '', action) {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'ed-ui ed-toasts';
      toastWrap.dir = 'rtl';
      document.body.appendChild(toastWrap);
    }
    const t = document.createElement('div');
    t.className = `ed-toast ${kind ? `is-${kind}` : ''}`;
    t.innerHTML = `<span>${msg}</span>`;
    if (action) {
      const b = document.createElement('button');
      b.textContent = action.label;
      b.onclick = () => { action.fn(); t.remove(); };
      t.appendChild(b);
    }
    toastWrap.appendChild(t);
    setTimeout(() => t.classList.add('is-out'), action ? 7000 : 3800);
    setTimeout(() => t.remove(), action ? 7400 : 4200);
  }

  /* ------------------------------------------------------------ welcome -- */
  function showWelcome(force) {
    if (!force) { try { if (localStorage.getItem(WELCOME_KEY)) return; } catch (e) { return; } }
    const m = openModal(`
      <p class="ed-kicker">خوش آمدید</p>
      <h3>سایت را مستقیم روی خودش ویرایش کنید</h3>
      <ol class="ed-steps">
        <li><b>متن:</b> روی هر نوشته‌ای کلیک کنید و تایپ کنید. نوشته‌های کم‌رنگ یعنی هنوز برای این زبان پر نشده‌اند.</li>
        <li><b>تصویر:</b> روی هر عکس کلیک کنید یا فایل را رویش بکشید. عکس‌ها خودکار فشرده می‌شوند.</li>
        <li><b>موارد:</b> نشانگر را روی یک پروژه، مهارت یا ردیف ببرید؛ نوار کوچکی برای جابه‌جایی، کپی، پنهان‌کردن، جزئیات و حذف ظاهر می‌شود.</li>
        <li><b>زبان:</b> از نوار پایین بین «فارسی» و «English» جابه‌جا شوید تا نسخهٔ دیگر را ویرایش کنید.</li>
        <li><b>انتشار:</b> تغییرات خودکار در همین مرورگر ذخیره می‌شوند. هر وقت آماده بودید «انتشار» را بزنید؛ حدود یک دقیقه بعد روی سایت است.</li>
      </ol>
      <p class="ed-note">میانبرها: <kbd>Ctrl</kbd>+<kbd>Z</kbd> واگرد · <kbd>Ctrl</kbd>+<kbd>S</kbd> انتشار · <kbd>Esc</kbd> بستن</p>
      <div class="ed-actions"><button class="ed-btn ed-btn--primary" data-ok>${IC.check}شروع کنیم</button></div>`, { wide: true });
    m.querySelector('[data-ok]').onclick = () => { try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) { /* ignore */ } closeModal(); };
  }

  /* -------------------------------------------------------------- GitHub -- */
  async function gh(path, opt = {}) {
    const { owner, repo } = repoCfg();
    const url = path.startsWith('http') ? path : `https://api.github.com/repos/${owner}/${repo}${path}`;
    const res = await fetch(url, {
      method: opt.method || 'GET',
      headers: {
        Authorization: `Bearer ${opt.token || E.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opt.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) {
      let msg = '';
      try { msg = (await res.json()).message; } catch (e) { /* ignore */ }
      const err = new Error(msg || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function ghError(err) {
    if (err.status === 401) return 'کلید دسترسی گیت‌هاب نامعتبر یا منقضی شده است. از منوی «بیشتر» ← «اتصال گیت‌هاب» کلید جدید وارد کنید.';
    if (err.status === 403 || err.status === 404) return 'این کلید اجازهٔ نوشتن در مخزن را ندارد. هنگام ساخت کلید، مخزن portfolioV2 و دسترسی «Contents: Read and write» را انتخاب کنید.';
    if (err.status === 409 || err.status === 422) return 'مخزن هم‌زمان تغییر کرد. دوباره «انتشار» را بزنید.';
    if (err.message === 'Failed to fetch') return 'اتصال اینترنت برقرار نیست یا گیت‌هاب در دسترس نیست. کمی بعد دوباره امتحان کنید.';
    return `خطا: ${esc(err.message)}`;
  }

  function openConnect(after) {
    const { owner, repo } = repoCfg();
    const m = openModal(`
      <p class="ed-kicker">یک‌بار برای همیشه</p>
      <h3>اتصال به گیت‌هاب</h3>
      <p>برای اینکه دکمهٔ «انتشار» بتواند تغییرات را روی سایت بگذارد، یک «کلید دسترسی» از گیت‌هاب لازم است. فقط یک بار انجامش می‌دهید و کلید فقط در همین مرورگر ذخیره می‌شود.</p>
      <ol class="ed-steps">
        <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">این صفحه را در گیت‌هاب باز کنید ↗</a></li>
        <li>یک نام بدهید (مثلاً <span dir="ltr">Portfolio editor</span>) و مدت اعتبار را تا حداکثر ممکن بگذارید.</li>
        <li>در «Repository access» گزینهٔ <b>Only select repositories</b> و سپس مخزن <b dir="ltr">${esc(repo)}</b> را انتخاب کنید.</li>
        <li>در «Permissions → Repository permissions» مقدار <b dir="ltr">Contents</b> را روی <b dir="ltr">Read and write</b> بگذارید.</li>
        <li>دکمهٔ <b dir="ltr">Generate token</b> را بزنید، کلید را کپی کنید و اینجا بچسبانید:</li>
      </ol>
      <input class="ed-input" id="ed-token" dir="ltr" placeholder="github_pat_…" value="${esc(E.token)}" autocomplete="off">
      <p class="ed-msg" id="ed-token-msg"></p>
      <div class="ed-actions">
        ${E.token ? '<button class="ed-btn ed-btn--ghost" data-a="forget">حذف کلید از این مرورگر</button>' : ''}
        <button class="ed-btn ed-btn--ghost" data-a="cancel">بعداً</button>
        <button class="ed-btn ed-btn--primary" data-a="save">${IC.check}اتصال</button>
      </div>`, { wide: true });
    const msg = m.querySelector('#ed-token-msg');
    m.onclick = async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'cancel') { closeModal(); return; }
      if (b.dataset.a === 'forget') { E.token = ''; localStorage.removeItem(TOKEN_KEY); closeModal(); toast('کلید حذف شد.'); return; }
      const tok = m.querySelector('#ed-token').value.trim();
      if (!tok) { msg.textContent = 'کلید را وارد کنید.'; return; }
      b.disabled = true;
      msg.textContent = 'در حال بررسی…';
      try {
        const info = await gh('', { token: tok });
        if (info.permissions && !info.permissions.push) throw Object.assign(new Error('no push'), { status: 403 });
        E.token = tok;
        localStorage.setItem(TOKEN_KEY, tok);
        closeModal();
        toast(`به مخزن ${esc(owner)}/${esc(repo)} وصل شدید.`, 'ok');
        await syncFromGitHub();
        if (after) after();
      } catch (err) {
        msg.innerHTML = ghError(err);
        msg.classList.add('is-err');
        b.disabled = false;
      }
    };
  }

  /** Fetch the latest content.json from GitHub (the live site can lag ~1 min). */
  async function syncFromGitHub() {
    if (!E.token) return;
    try {
      const { branch } = repoCfg();
      const f = await gh(`/contents/content.json?ref=${encodeURIComponent(branch)}`);
      const remote = JSON.parse(b64ToUtf8(f.content));
      const remoteStr = JSON.stringify(remote);
      E.baseSha = f.sha;
      if (remoteStr !== E.base) {
        const wasDirty = dirty();
        E.base = remoteStr;
        if (!wasDirty) {
          Site.data = remote;
          E.history = [remoteStr]; E.hIdx = 0;
          rerender();
        }
        saveDraft();
      }
    } catch (err) { /* offline or no access: keep working locally */ }
  }

  function seoBlock(d) {
    const lang = d.site.defaultLanguage || 'fa';
    const tr = (v) => (v && typeof v === 'object' ? v[lang] || v.en || v.fa || '' : v || '');
    const url = String(d.site.siteUrl || '').replace(/\/$/, '');
    const title = esc(tr(d.site.pageTitle));
    const desc = esc(tr(d.site.metaDescription));
    const og = d.site.ogImage ? (/^https?:/.test(d.site.ogImage) ? d.site.ogImage : `${url}/${d.site.ogImage}`) : '';
    return `<!-- SEO:START -->
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${esc(url)}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${esc(url)}/">
${og ? `<meta property="og:image" content="${esc(og)}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<!-- SEO:END -->`;
  }

  function missingTranslations() {
    let n = 0;
    const walk = (v, path) => {
      if (isI18n(v)) { if (!!v.fa !== !!v.en) n++; return; }
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}.${i}`));
      else if (v && typeof v === 'object') {
        if (v.enabled === false) return;
        Object.keys(v).forEach((k) => { if (!k.startsWith('_')) walk(v[k], `${path}.${k}`); });
      }
    };
    walk(Site.data, '');
    return n;
  }

  function openPublish() {
    commitSoon.flush();
    if (!dirty()) { toast('تغییری برای انتشار وجود ندارد.'); return; }
    if (!E.token) { openConnect(openPublish); return; }
    const miss = missingTranslations();
    const used = [...E.uploads.keys()].filter((p) => json().includes(p));
    const m = openModal(`
      <p class="ed-kicker">انتشار</p>
      <h3>تغییرات روی سایت قرار بگیرد؟</h3>
      <ul class="ed-summary">
        <li>${IC.file}محتوای سایت (content.json)</li>
        ${used.length ? `<li>${IC.image}${used.length.toLocaleString('fa')} فایل جدید</li>` : ''}
        ${miss ? `<li class="is-warn">⚠️ ${miss.toLocaleString('fa')} متن فقط در یک زبان پر شده است (در زبان دیگر، همان متن نمایش داده می‌شود).</li>` : ''}
      </ul>
      <label class="ed-field__lbl" for="ed-msg">توضیح کوتاه (اختیاری)</label>
      <input class="ed-input" id="ed-msg" placeholder="مثلاً: اضافه کردن پروژهٔ جدید">
      <p class="ed-msg" id="ed-pub-msg"></p>
      <div class="ed-actions">
        <button class="ed-btn ed-btn--ghost" data-a="cancel">انصراف</button>
        <button class="ed-btn ed-btn--primary" data-a="go">${IC.send}انتشار</button>
      </div>`);
    m.onclick = async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'cancel') { closeModal(); return; }
      b.disabled = true;
      const out = m.querySelector('#ed-pub-msg');
      const note = m.querySelector('#ed-msg').value.trim();
      try {
        await publish(note, (s) => { out.textContent = s; });
        closeModal();
        const url = String(Site.data.site.siteUrl || '').replace(/\/$/, '');
        openModal(`
          <div class="ed-done">${IC.check}</div>
          <h3>منتشر شد!</h3>
          <p>گیت‌هاب معمولاً ظرف ۱ تا ۲ دقیقه سایت را به‌روز می‌کند.</p>
          <div class="ed-actions">
            ${url ? `<a class="ed-btn ed-btn--ghost" href="${esc(url)}/" target="_blank" rel="noopener">${IC.open}دیدن سایت</a>` : ''}
            <button class="ed-btn ed-btn--primary" data-ok>ادامهٔ ویرایش</button>
          </div>`).querySelector('[data-ok]').onclick = closeModal;
      } catch (err) {
        if (err.cancelled) { toast('انتشار لغو شد.'); return; }
        const box = $('#ed-pub-msg');
        if (box) { box.innerHTML = ghError(err); box.classList.add('is-err'); } else toast(ghError(err), 'err');
        if (modal && !modal.querySelector('[data-a="go"]')) setTimeout(closeModal, 4000);
        b.disabled = false;
        if (err.status === 401) { E.token = ''; localStorage.removeItem(TOKEN_KEY); }
      }
    };
  }

  async function publish(note, progress) {
    const { branch } = repoCfg();
    const data = Site.data;
    const text = `${JSON.stringify(data, null, 2)}\n`;

    progress('در حال بررسی آخرین نسخه…');
    let remoteSha = null;
    try { remoteSha = (await gh(`/contents/content.json?ref=${encodeURIComponent(branch)}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
    if (E.baseSha && remoteSha && remoteSha !== E.baseSha) {
      const ok = await confirmBox('محتوای سایت از جای دیگری هم تغییر کرده است',
        'از وقتی ویرایش را شروع کردید، content.json روی گیت‌هاب عوض شده (مثلاً از یک دستگاه دیگر). اگر ادامه دهید، نسخهٔ شما جایگزین آن می‌شود.', 'جایگزین کن');
      if (!ok) throw Object.assign(new Error('انتشار لغو شد.'), { cancelled: true });
      openModal('<p class="ed-kicker">انتشار</p><h3>در حال انتشار…</h3><p class="ed-msg" id="ed-pub-msg"></p>', { sticky: true });
      progress = (s) => { const el = $('#ed-pub-msg'); if (el) el.textContent = s; };
    }

    const attempt = async () => {
      const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
      const head = ref.object.sha;
      const commitObj = await gh(`/git/commits/${head}`);
      const tree = [];

      const used = [...E.uploads.entries()].filter(([p]) => text.includes(p));
      let n = 0;
      for (const [p, f] of used) {
        progress(`آپلود فایل ${(++n).toLocaleString('fa')} از ${used.length.toLocaleString('fa')}…`);
        const blob = await gh('/git/blobs', { method: 'POST', body: { content: f.b64, encoding: 'base64' } });
        tree.push({ path: p, mode: '100644', type: 'blob', sha: blob.sha });
      }

      progress('ذخیرهٔ محتوا…');
      const cj = await gh('/git/blobs', { method: 'POST', body: { content: text, encoding: 'utf-8' } });
      tree.push({ path: 'content.json', mode: '100644', type: 'blob', sha: cj.sha });

      try {
        const idx = await gh(`/contents/index.html?ref=${encodeURIComponent(branch)}`);
        const html = b64ToUtf8(idx.content);
        if (html.includes('<!-- SEO:START -->')) {
          const next = html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, seoBlock(data));
          if (next !== html) {
            const ib = await gh('/git/blobs', { method: 'POST', body: { content: utf8ToB64(next), encoding: 'base64' } });
            tree.push({ path: 'index.html', mode: '100644', type: 'blob', sha: ib.sha });
          }
        }
      } catch (e) { /* SEO update is optional */ }

      progress('ثبت تغییرات…');
      const newTree = await gh('/git/trees', { method: 'POST', body: { base_tree: commitObj.tree.sha, tree } });
      const c = await gh('/git/commits', {
        method: 'POST',
        body: { message: `Update site from editor${note ? `: ${note}` : ''}`, tree: newTree.sha, parents: [head] },
      });
      await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: { sha: c.sha } });
      return cj.sha;
    };

    let sha;
    try { sha = await attempt(); } catch (err) {
      if (err.status === 409 || err.status === 422) sha = await attempt(); else throw err;
    }

    E.base = JSON.stringify(data);
    E.baseSha = sha;
    E.uploads.clear();
    await idb.clear();
    localStorage.removeItem(DRAFT_KEY);
    updateDock();
  }

  /* ---------------------------------------------------------------- boot -- */
  async function start() {
    try { await Site.ready; } catch (e) { return; }
    E.base = json();

    // restore unfinished work
    let restored = false;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft && draft.data) {
        Site.data = draft.data;
        E.base = draft.base || E.base;
        E.baseSha = draft.baseSha || null;
        restored = true;
      }
    } catch (e) { /* ignore */ }
    for (const [p, f] of await idb.all()) {
      E.uploads.set(p, f);
      Site.srcMap[p] = URL.createObjectURL(b64ToBlob(f.b64, f.type));
    }

    Site.editing = true;
    Site.hooks.afterRender.push(decorate);
    E.history = [json()]; E.hIdx = 0;

    buildBars();
    buildDock();
    Site.render();

    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('paste', onPaste);
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onPointer);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    document.addEventListener('dragleave', (e) => { const i = e.target.closest && e.target.closest('[data-edit-img]'); if (i) i.classList.remove('ed-drop'); });
    dock.addEventListener('click', onDock);
    addEventListener('scroll', () => { if (bar.classList.contains('is-on') || imgBar.classList.contains('is-on')) hideBars(); }, { passive: true });
    addEventListener('beforeunload', () => { commitSoon.flush(); saveDraft.flush(); });

    if (restored && dirty()) {
      toast('پیش‌نویس منتشرنشدهٔ قبلی بازیابی شد.', '', {
        label: 'کنار گذاشتن',
        fn: async () => {
          Site.data = JSON.parse(E.base); E.uploads.clear(); Site.srcMap = {}; await idb.clear();
          localStorage.removeItem(DRAFT_KEY); E.history = [E.base]; E.hIdx = 0; rerender(); updateDock();
        },
      });
    }
    updateDock();
    showWelcome(false);
    syncFromGitHub();
  }
  start();
})();
