# How to edit your website

**Written for someone who has never written a line of code.**
Nothing in this guide requires you to understand programming.

---

## Contents

1. [The two ways to edit](#1-the-two-ways-to-edit)
2. [The golden rules](#2-the-golden-rules)
3. [Editing text — section by section](#3-editing-text--section-by-section)
4. [Adding and removing projects](#4-adding-and-removing-projects)
5. [Changing pictures and your photo](#5-changing-pictures-and-your-photo)
6. [Changing colours and fonts](#6-changing-colours-and-fonts)
7. [Reordering, hiding and showing sections](#7-reordering-hiding-and-showing-sections)
8. [Adding your CV](#8-adding-your-cv)
9. [Where contact form messages go](#9-where-contact-form-messages-go)
10. [If something breaks](#10-if-something-breaks)
11. [Your first-day checklist](#11-your-first-day-checklist)

---

## 1. The two ways to edit

### Way A — the visual editor (recommended)

Once the site is online (see `LAUNCH-GUIDE.md`), go to:

```
https://your-website-address.com/admin
```

Log in, and you get a normal-looking editor: text boxes, image upload buttons,
colour pickers, and **+** buttons to add projects. Press **Publish** and your site
updates by itself in about a minute.

**This is the way you should normally work.** No code, nothing to break.

### Way B — editing the file directly

Open `site/content.json` in **Notepad** (Windows) or any text editor. Change the words
between the `"quote marks"`, save, and refresh the preview.

Use this when you want to make a lot of changes quickly, or before the site is online.

---

## 2. The golden rules

When editing `content.json` by hand, only ever change **the text inside quote marks**.

```
  "headline": {
    "en": "I design and build the machines that build your product.",
             ↑___________ change ONLY this bit ___________↑
```

**Do not delete:**

| Symbol | What it does |
|---|---|
| `"` | Marks the start and end of a piece of text. Always comes in pairs. |
| `,` | Separates one item from the next. |
| `{` `}` | Groups things together. |
| `[` `]` | Marks a list of things. |

**If your text contains a quote mark**, write `\"` instead of `"`.
For example: `"He said \"yes\" immediately."`

**Always keep both languages filled in.** Every text has an `"en"` and a `"fa"`.
If you leave `"fa"` empty, Persian visitors see the English instead — which works, but
looks unfinished.

**After hand-editing, always check your work:** go to
[jsonlint.com](https://jsonlint.com), paste the whole file in, click *Validate*.
Green means fine, red tells you the exact line that has a problem.

---

## 3. Editing text — section by section

Every section below tells you: what it is on screen, where to find it in the visual
editor, and what to search for in `content.json`.

### The top of the page (hero)

> The big first screen with your name and photo.

- **Visual editor:** panel *"Top of the page"*
- **In `content.json`:** search for `"hero"`

| What you see on screen | The setting to change |
|---|---|
| Small orange line above your name | `eyebrow` |
| Your big name | `name` |
| The orange sentence | `headline` |
| The grey paragraph below it | `intro` |
| Orange button text | `primaryButtonLabel` |
| Where the orange button goes | `primaryButtonLink` |
| Second button text | `secondaryButtonLabel` |
| Your CV file | `secondaryButtonLink` |
| Your photograph | `photo` |
| Small caption under the photo | `photoCaption` |

### The four big numbers (stats)

> "00+ Years of experience" etc.

- **Visual editor:** panel *"Headline numbers"*
- **In `content.json`:** search for `"stats"`

Change `value` to your real number (e.g. `"12"`), `suffix` to the symbol after it
(`"+"`, `"%"`, or empty `""`), and `label` to what it means.

The numbers count up when a visitor scrolls to them. To remove the whole strip, set
`"enabled": false`.

> **Now filled in** from your performance reports: 5+ years, 30+ projects, 290+ units,
> 6 production halls. Check each one and correct anything you disagree with.

### About me

- **Visual editor:** panel *"About me"*
- **In `content.json`:** search for `"about"`

- `heading` — the large statement
- `paragraphs` — your biography. Each `{ "en": ..., "fa": ... }` block is one paragraph.
  To add a fourth paragraph, copy an entire block including its `{ }`, paste it after
  the last one, and put a comma between them.
- `specs` — the boxed panel on the right (Based in, Experience, Focus…).
  Each row has a `label` (left) and a `value` (right).

### Skills & expertise

- **Visual editor:** panel *"Skills"*
- **In `content.json`:** search for `"skills"`

There are four groups. For each group:

- `icon` — choose one of: `drafting`, `analysis`, `manufacturing`, `automation`, `cog`
- `title` and `description` — the group name and its one-line explanation
- `skills` — the list inside. Each has a `name` and a `level` from 0 to 100 which
  draws the little orange bar.

> **Now filled in** from your CV: anything marked Advanced is 90, Intermediate is 65,
> the rest estimated from your projects. Review them — this is your claim, not mine.
> Scale: 90 = you teach it, 75 = confident daily use, 50 = competent, 30 = basic.
> If you would rather not rate yourself at all, say so and I will remove the bars.

To hide a whole group, add `"enabled": false` to it.

### Projects

See [section 4](#4-adding-and-removing-projects) — it is the most important part of the site.

### Work experience

- **Visual editor:** panel *"Work experience"*
- **In `content.json`:** search for `"experience"`

Each job has `role`, `company`, `location`, `period`, and a list of `points`
(the bullet points). Set `"current": true` on your present job — it gets the filled
orange dot on the timeline. List jobs newest first.

To add a job in the visual editor, press **+**. To add one by hand, copy an entire
job block from `{` to `}`, paste it, and put a comma between the two.

### Education & certifications

- **Visual editor:** panel *"Education & certificates"*
- **In `content.json`:** search for `"education"`

Two lists: `degrees` (left column) and `certifications` (right column).
Certificates can have a `link` to an online verification page — leave it as `""` if
you do not have one, and no link is shown.

### Contact

- **Visual editor:** panel *"Contact"*
- **In `content.json`:** search for `"contact"`

- `heading` and `intro` — the wording
- `details` — the email/phone/location rows. **Change these to your real details
  before going live.** The `link` must start with `mailto:` for an email and `tel:`
  for a phone number.
- `socials` — the round icon buttons. Set `"enabled": true` to show one,
  `false` to hide it. Available icons: `linkedin`, `whatsapp`, `telegram`,
  `instagram`, `grabcad`, `website`.

### Footer

- **Visual editor:** panel *"Footer"*
- **In `content.json`:** search for `"footer"`

The year updates itself every January — you never need to touch it.

---

## 4. Adding and removing projects

### In the visual editor (easy)

1. Open `yoursite.com/admin`, open the **Projects** panel.
2. Scroll to **"My projects"**. You will see your projects listed.
3. Press **+** to add one, or the **rubbish-bin icon** to delete one.
4. **Drag a project by its handle** to change the order it appears in.
5. Fill in the boxes, press **Publish**.

### By hand in `content.json`

Find `"items": [` inside the `"projects"` section. Each project runs from a `{` to
its matching `}`. To add one, copy an entire existing project block, paste it after
the last one, put a comma between them, and change these:

| Field | What to put |
|---|---|
| `id` | Any unique word, e.g. `"project-5"` |
| `code` | The little tag on the card, e.g. `"PRJ-05"` |
| `title` | The project name |
| `category` | Groups the filter buttons — reuse an existing category name to group projects together, or invent a new one and a new button appears automatically |
| `year` | e.g. `"2025"` |
| `client` | The customer's name, or `"Confidential"` |
| `summary` | One sentence, shown on the card |
| `problem` | What was wrong before you built it |
| `solution` | What you designed and how it works |
| `role` | Exactly what you did |
| `outcome` | The result — **use numbers here if you possibly can** |
| `tools` | A list, e.g. `["SolidWorks", "ANSYS"]` |
| `specs` | The technical table (capacity, footprint, cycle time…) |
| `cover` | The picture on the card |
| `gallery` | The pictures inside, each with a caption |

**To temporarily hide a project** without deleting it, set `"enabled": false`.

### Writing a good project entry

From the research on what makes engineering portfolios persuasive:

- **Three excellent projects beat seven thin ones.** Delete the ones you can't
  document properly.
- **Lead with the outcome, in the client's language.** "Raised output from 400 to
  620 parts/hour and paid for itself in 7 months" is worth more than a list of
  bearing sizes.
- **Show the range of images:** a CAD render, a fabrication photo, and the machine
  installed and running. That sequence proves you can take a design all the way.
- **Keep the jargon in the specs table**, not in the description. The person deciding
  whether to hire you is often not an engineer.
- **If a project is confidential**, write "Confidential" as the client, describe the
  mechanism generically, and use a render rather than a site photo.

---

## 5. Changing pictures and your photo

### In the visual editor

Click the image box, press **Choose an image**, upload from your computer. Done.

### By hand

1. Put your picture into `site/assets/images/` (or `site/assets/images/projects/`).
2. In `content.json`, change the path to match, e.g.
   `"photo": "assets/images/my-photo.jpg"`

**Rules that matter:**

| | |
|---|---|
| **Your portrait** | About 800 × 1000 pixels, upright. It is shown in slight greyscale to match the design. |
| **Project pictures** | About 1600 × 1000 pixels, landscape. |
| **File size** | Keep every picture under about 400 KB, or the site gets slow. Use [squoosh.app](https://squoosh.app) — drag your photo in, drag the quality slider to about 75, download. |
| **File names** | Use lower-case letters, numbers and hyphens only: `filling-machine-render.jpg`. **No spaces, no Persian characters.** A space in a filename breaks the picture on the live site. |
| **Format** | `.jpg` for photographs, `.png` for drawings with sharp lines and text. |

### The icons

The icons (the little symbols on the skill cards and contact rows) are drawn by the
site itself — there are no icon files to manage. You choose which one appears by name:

- **Skill cards:** `drafting`, `analysis`, `manufacturing`, `automation`, `cog`
- **Contact rows:** `email`, `phone`, `location`, `website`
- **Social buttons:** `linkedin`, `whatsapp`, `telegram`, `instagram`, `grabcad`, `website`

If you need an icon that is not on this list, ask and it can be added.

---

## 6. Changing colours and fonts

- **Visual editor:** panel *"Colours & fonts"* — each colour has a proper colour picker.
- **In `content.json`:** search for `"theme"`

| Setting | What it controls |
|---|---|
| `colorBackground` | The main dark page background |
| `colorSurface` | The slightly lighter alternating bands |
| `colorSurfaceRaised` | Cards and boxes |
| `colorBorder` | All thin dividing lines |
| `colorText` | Main writing |
| `colorTextMuted` | Secondary grey writing |
| `colorAccent` | **The orange.** Change this one and the whole site changes character. |
| `colorAccentInk` | The text colour on top of orange buttons |
| `colorBlueprint` | The faint blue technical line work |
| `showBlueprintGrid` | `true`/`false` — the faint grid pattern |
| `enableAnimations` | `false` turns off all fade-in movement |

Colours are written as `"#F2A33C"` — a `#` followed by six characters. Pick new ones at
[coolors.co](https://coolors.co) or with the visual editor's colour picker.

**A warning about the accent colour:** if you change it to something pale, the black
text on your buttons may become hard to read. After changing it, paste your background
and accent colours into [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) —
you want a ratio of at least 4.5.

**Fonts:** `fontDisplay` (headings), `fontBody` (paragraphs), `fontMono` (the small
technical labels). To use a different font you must also add it to the font line in
`index.html` — ask for help with this one, it is the only change that needs the code.

---

## 7. Reordering, hiding and showing sections

- **Visual editor:** panel *"Sections — drag to reorder, untick to hide"*
- **In `content.json`:** search for `"sections"`

```json
{ "key": "projects", "enabled": true, "showInNav": true,
  "navLabel": { "en": "Projects", "fa": "پروژه‌ها" } }
```

| Setting | What it does |
|---|---|
| `key` | Which section this is. **Never change this word.** |
| `enabled` | `true` shows the section, `false` removes it completely |
| `showInNav` | `true` puts a link in the top menu |
| `navLabel` | What that menu link says |

**The order of this list is the order of the page.** Move a whole `{ ... }` block up or
down and that section moves up or down on the site, and its menu link moves with it.

Example: to put Projects immediately after the hero (a good idea once you have strong
project photos), move the `projects` block up so it sits just after `stats`.

---

## 8. Adding your CV

Your English CV is already on the site at
`assets/files/cv-saeed-mousavi-en.pdf`, and the **Download CV** button serves it.

To update it, replace that file with a new PDF of the same name. Nothing else changes.

In the visual editor: open *"Top of the page"*, find **Second button link**, upload
the PDF there.

---

## 9. Where contact form messages go

The setting is `contact.formProvider` in `content.json`. Three choices:

| Setting | What happens | Set-up needed |
|---|---|---|
| `"netlify"` | Messages appear in your Netlify dashboard, and Netlify emails you. **100 free messages per month.** | None — it works the moment the site is on Netlify |
| `"formspree"` | Messages are emailed by Formspree. 50 free per month. | Sign up at formspree.io, paste your form address into `formspreeEndpoint` |
| `"mailto"` | Opens the visitor's own email program with the message pre-filled | None, but many visitors have no email program set up and it silently fails for them |

**Recommended: leave it on `"netlify"`.** It needs no accounts and no configuration.

To remove the form entirely and show only your email and phone, set
`"showForm": false`.

---

## 10. If something breaks

### The site shows "The site content could not be loaded"

You have a small typo in `content.json` — nearly always a missing comma, or a deleted
quote mark. Go to [jsonlint.com](https://jsonlint.com), paste the whole file in, press
*Validate*. It tells you the exact line. Fix it, save, refresh.

### A picture is missing / shows a broken icon

- Check the file name in `content.json` matches the real file **exactly**, including
  capital letters — `Photo.JPG` and `photo.jpg` are different files on a web server.
- Check the file name has no spaces in it.
- Check the file is actually in the folder the path points to.

### My change does not appear

- **Preview:** press `Ctrl + F5` to force a full reload.
- **Live site:** Netlify takes about a minute to publish. Wait, then `Ctrl + F5`.

### The Persian version looks wrong

Check that you filled in the `"fa"` value and not just the `"en"` one. If a Persian
line looks broken with Latin words mixed in, it may need the words reordering by hand —
mixed-direction text is fiddly in every language.

### I broke it completely and want to start again

Every save through the visual editor is stored in your GitHub repository's history,
so nothing is ever really lost. Ask for help restoring a previous version — it takes
about a minute.

**Before any big hand-editing session, make a copy of `content.json` first.**
Call it `content-backup.json` and keep it somewhere safe.

---

## 11. Your first-day checklist

Work through this before showing the site to anyone.

Most of the site is now filled in from your CV and your 1404 / 1405 performance
reports. These are the gaps I could not fill:

- [ ] **Replace the portrait placeholder with a real photograph** — still empty
- [ ] **Add your real LinkedIn profile URL** — your CV only said "Page link"
- [ ] **Write the Talash B.S.R job description** — the job is listed but has no detail
- [ ] Confirm the four headline numbers (5+, 30+, 290+, 6) — I derived them from your reports
- [ ] Review the skill percentages — they are your claim, not mine
- [ ] Read the three About paragraphs and correct anything I got wrong
- [ ] Decide on confidentiality: the projects come from your employer's internal
      reports. Make sure publishing them is acceptable under your contract.
- [ ] Replace `YOUR-DOMAIN-HERE.com` in `robots.txt`, `sitemap.xml` and
      `content.json` → `site.siteUrl` with your real address
- [ ] Read the whole site once in English, then once in Persian, on a phone
- [ ] Send yourself a test message through the contact form and check it arrives
