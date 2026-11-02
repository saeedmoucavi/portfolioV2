# Saeed Mousavi — Portfolio

A bilingual (Persian / English) portfolio for a mechanical engineer who designs production fixtures and assembly machines.
It is plain HTML, CSS and JavaScript, with no build step, hosted free on GitHub Pages.

**Live:** https://saeedmoucavi.github.io/portfolioV2/
**Edit:** https://saeedmoucavi.github.io/portfolioV2/?edit

📖 **The full guide (in Persian) is in [`راهنمای-فارسی.md`](راهنمای-فارسی.md).**

## How it works

- All text, images, colours and projects live in **`content.json`**. `assets/js/main.js` builds the page from it.
- Each project gets its own case-study page at `#/project/<id>`.
- Visitors can switch between light and dark mode and between Persian and English.

## Editing

Open the site with `?edit`. The on-site editor (`assets/js/editor.js`) lets you:

- click any text to edit it, separately for each language
- click or drag onto any image to replace it (images are resized and compressed in the browser)
- hover any item to move, add, duplicate, hide, delete it or open its details panel
- reorder and hide sections, and change colours, the default theme and site settings
- autosave a draft locally, with undo and redo
- **Publish:** one commit to this repository through the GitHub API, using a fine-grained token with *Contents: read & write* on this repo only. Publishing also refreshes the SEO tags in `index.html`.

## Files

```
index.html             page shell + SEO block (rewritten on publish)
content.json           all content
assets/css/styles.css  site design
assets/js/main.js      renderer
assets/js/editor.js    on-site editor (loaded only with ?edit)
assets/css/editor.css  editor UI
assets/images/         images (editor uploads go to assets/images/uploads/)
assets/files/          CV and other downloads
admin/                 redirects to ?edit
```

Local preview: run `python -m http.server 4321` in this folder and open http://localhost:4321.
