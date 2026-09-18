# Saeed Mousavi — Portfolio Website

A bilingual (English / Persian) portfolio site for industrial machinery design.
Plain HTML, CSS and JavaScript. No build step, no framework, no monthly cost.

**Three documents come with this site:**

| Document | What it is for |
|---|---|
| **`راهنمای-فارسی.md`** | **The complete guide in Persian — start here** |
| **`راهنمای-گیت‌هاب-پیجز.md`** | **Persian: publish on GitHub Pages + set up the /admin editor** |
| `README.md` (this file) | What each file and folder does |
| `EDITING-GUIDE.md` | How to change anything on the site, section by section |
| `LAUNCH-GUIDE.md` | How to get the site online, from zero to a live web address |

---

## How to look at the site on your own computer

Double-click **`preview.cmd`** (it sits in the folder *above* this one), then open
**http://localhost:4321** in your browser. Leave the black window open while you work;
close it when you are finished.

> **Why can't I just double-click `index.html`?**
> The site reads its text from `content.json`. Browsers block that when a page is opened
> directly from your hard drive as a security precaution. The preview window solves it.

---

## The folder structure

```
site/
├── index.html          The page skeleton. You will rarely touch this.
├── content.json    ★   ALL your text, images, colours and projects live here.
├── favicon.svg         The small icon shown in the browser tab.
├── robots.txt          Tells Google it may list your site.
├── sitemap.xml         A map of your site for Google.
├── .nojekyll           Tells GitHub Pages to serve files as-is (keep it).
│
├── admin/              The visual editor you open at yoursite.com/admin
│   ├── index.html      Loads the editor.
│   └── config.yml      Decides which boxes the editor shows you (GitHub login).
│
└── assets/
    ├── css/
    │   └── styles.css      All the visual design. Colours come from content.json.
    ├── js/
    │   └── main.js         Reads content.json and draws the page. Do not edit.
    ├── files/
    │   └── cv-saeed-mousavi-en.pdf    Your CV (the "Download CV" button).
    └── images/
        ├── portrait-placeholder.svg   Your photo goes here (still a placeholder).
        ├── og-image.jpg               Preview picture for WhatsApp/LinkedIn shares.
        └── projects/                  Your project photos, from the 1404/1405 reports.
```

★ = the only file you normally need to change.

---

## The one idea behind this site

Every word, colour, image path and project on the site is stored in **`content.json`**.
The file `main.js` reads that file and builds the page from it.

That means:

- To change the site, you change `content.json`. Nothing else.
- You can change it two ways: through the **visual editor** at `yoursite.com/admin`
  (recommended — buttons and boxes, no code), or by opening `content.json` in a text
  editor if you prefer.
- If you break `content.json`, the site shows a friendly message telling you how to
  fix it, instead of a blank page.

---

## The bilingual system

Every piece of text is stored twice:

```json
"headline": {
  "en": "I design and build the machines that build your product.",
  "fa": "من ماشین‌آلاتی را طراحی و می‌سازم که محصول شما را تولید می‌کنند."
}
```

`en` is English, `fa` is Persian. Visitors switch with the **EN / فا** button in the
top-right corner. When Persian is chosen the entire page flips to right-to-left
automatically and switches to a Persian font — you do not have to do anything.

The browser remembers each visitor's choice for their next visit.

---

## What is deliberately NOT here

- **No database.** Nothing to back up, nothing to get hacked, nothing to pay for.
- **No build step.** The files in this folder *are* the website. What you see is
  what gets published.
- **No framework.** Nothing to update, and nothing that stops working in two years.

---

## Technical notes (for anyone who works on this later)

- The whole page is rendered client-side by `assets/js/main.js` from `content.json`.
- Section order and visibility are driven by the `sections` array in `content.json`.
  Reordering that array reorders the page and the navigation menu.
- All content is escaped before insertion into the DOM, so text in `content.json`
  cannot inject markup.
- Animations use `IntersectionObserver` and are disabled automatically for visitors
  who have "reduce motion" turned on, or when `theme.enableAnimations` is `false`.
- Colours are CSS custom properties on `:root`, overwritten at runtime from
  `content.json` → `theme`. The values in `styles.css` are fallbacks only.
- RTL is handled with CSS logical properties (`inset-inline-start`, `padding-inline`),
  so there is no separate Persian stylesheet.
- The site is hosted on **GitHub Pages**; the `/admin` editor uses Decap CMS with
  the GitHub backend and a small Cloudflare Worker OAuth helper
  (`cloudflare-oauth-worker.js`, one folder up). See `راهنمای-گیت‌هاب-پیجز.md`.
- The contact form is currently OFF (`contact.showForm: false`) because GitHub Pages
  cannot process form posts; contact is via the email / phone / WhatsApp details.
  The renderer still supports `formspree` / `mailto` if you re-enable it.
