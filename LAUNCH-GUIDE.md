# Getting your website online — from zero to live

**Written for someone who has never published a website.**
Follow it in order. Nothing here needs any coding.

Total time: about **90 minutes** the first time.
Total cost: **the domain name only** — roughly **$10–15 per year**. The hosting is free.

---

## Contents

1. [The plan in one picture](#1-the-plan-in-one-picture)
2. [Before you start — a note if you are in Iran](#2-before-you-start--a-note-if-you-are-in-iran)
3. [Step 1 — Buy a domain name](#step-1--buy-a-domain-name)
4. [Step 2 — Choose hosting](#step-2--choose-hosting)
5. [Step 3 — Put your files on GitHub](#step-3--put-your-files-on-github)
6. [Step 4 — Publish with Netlify](#step-4--publish-with-netlify)
7. [Step 5 — Connect your domain](#step-5--connect-your-domain)
8. [Step 6 — Turn on HTTPS (the padlock)](#step-6--turn-on-https-the-padlock)
9. [Step 7 — Switch on your visual editor](#step-7--switch-on-your-visual-editor)
10. [Step 8 — Contact form messages](#step-8--contact-form-messages)
11. [Step 9 — After launch: SEO, testing, analytics](#step-9--after-launch-seo-testing-analytics)
12. [What it costs, per year](#what-it-costs-per-year)
13. [Troubleshooting](#troubleshooting)

---

## 1. The plan in one picture

```
   Your files                GitHub                  Netlify              Your domain
  (this folder)   ──────►  (the safe copy)  ──────► (the publisher) ────► yourname.com
                  upload             automatic              points at
                   once               forever                 it
```

- **GitHub** keeps a permanent, versioned copy of your site. Free.
- **Netlify** watches GitHub and publishes any change within a minute. Free.
- **Your domain** is the address people type. This is the only part you pay for.

Once it is set up, you never touch GitHub or Netlify again — you just edit at
`yoursite.com/admin` and the site updates itself.

---

## 2. Before you start — a note if you are in Iran

Netlify, Vercel and GitHub are US companies. In practice this means two things you
should know **before** spending time on the setup:

- **Signing up may require a VPN**, and their sign-up pages sometimes block Iranian IP
  addresses. Accounts have occasionally been suspended.
- **Paying an international registrar needs an international payment card**, which is
  not straightforward from inside Iran.

**You have two honest options. Read both and pick one before continuing.**

### Option A — International (Netlify + an international registrar)

Best if your audience is international clients and partners, and if you can access a
foreign payment method. Everything in this guide from Step 1 onward describes this route.
Fastest, free hosting, best performance for visitors outside Iran.

### Option B — Iranian (a local host + a local registrar)

Best if your clients are domestic factories, and it avoids all payment and access
problems. The site itself works identically — it is plain HTML files, so **any** web
host on earth can serve it.

- **Domains:** buy through an Iranian registrar (for example Parsdata, IranServer,
  HostIran, ParsPack). A `.ir` domain is registered through IRNIC and is inexpensive;
  a `.com` can also be bought through these companies in rials.
- **Hosting:** any basic Iranian shared-hosting plan with cPanel will do — roughly
  500,000–2,000,000 rials a year. Or a local platform such as **Liara** or
  **ArvanCloud**, which work much like Netlify.
- **To publish:** log into your host's cPanel → **File Manager** → open `public_html` →
  upload everything inside the `site` folder → done. To update, upload the changed files.
- **SSL:** every Iranian host offers free Let's Encrypt SSL in cPanel — turn it on
  (see Step 6).
- **The trade-off:** the visual editor at `/admin` and the contact form both depend on
  Netlify's services. On an Iranian host you would instead edit `content.json` by hand
  (see `EDITING-GUIDE.md`, "Way B") and set `formProvider` to `"formspree"` or
  `"mailto"`. **Tell me if you choose this route** — I can wire the form up to an
  alternative that works, and simplify the admin folder away.

### Option C — Both

Publish on Netlify with a `.com` for international clients, and mirror the same files
on an Iranian host with a `.ir` for domestic ones. It is the same folder uploaded twice.

**The rest of this guide describes Option A.** If you chose Option B, read Step 1
(domain advice still applies), then skip to your host's cPanel upload and Step 6.

---

## Step 1 — Buy a domain name

### What to choose

**Best choice:** `saeedmousavi.com` — your own name. It stays true for your whole
career, it is what people search for, and it is what a hiring manager expects on a CV.

If that exact name is taken, in order of preference:

1. `saeedmousavi.com` with a middle initial, e.g. `saeedmmousavi.com`
2. `mousavi.engineer` or `saeedmousavi.engineer` — `.engineer` is a real extension and
   reads well for your field
3. `saeedmousavi.me` or `.co`
4. A descriptive name, e.g. `mousavi-machinery.com` — good if you want it to read as a
   company rather than a person

### What to look for

| Do | Don't |
|---|---|
| Keep it short and easy to say out loud on the phone | Use hyphens if you can avoid them — "dash" is painful to dictate |
| Prefer `.com` — it is what people type by default | Use numbers, they create confusion ("is that 4 or four?") |
| Check the price you pay in **year two** | Fall for a $1 first year that renews at $40 |
| Buy the free WHOIS privacy that hides your home address | Pay extra for privacy — good registrars include it free |
| Buy for 1 year first | Buy 10 years up front before you're sure |

### Where to buy

| Registrar | Roughly | Notes |
|---|---|---|
| **Cloudflare Registrar** ⭐ | $10/yr | **Recommended.** Sells at cost, no markup, no upselling, free WHOIS privacy, renewal price = first-year price. You need a free Cloudflare account. |
| **Porkbun** | $10–11/yr | Very good, friendly interface, free privacy, honest renewals. Easiest for a first-timer. |
| **Namecheap** | $10–15/yr | Popular and reliable. Watch the renewal price. |
| **Netlify itself** | $15/yr | Costs a little more, but zero configuration — Step 5 becomes one click. Worth it if you want the simplest possible path. |
| ~~GoDaddy~~ | — | Avoid. Cheap first year, expensive renewals, relentless upselling. |

### How

1. Go to the registrar's site, type your desired name into the search box.
2. If it is available, add it to the basket. **Refuse every extra** they offer —
   you do not need their hosting, email, SSL, or "site protection".
3. Pay. You now own the name for a year.
4. **Turn on auto-renew.** People lose their domains by forgetting to renew, and
   getting one back after it lapses is expensive or impossible.

---

## Step 2 — Choose hosting

### The short answer: use Netlify. It is free and it is the right tool for this site.

Your site is plain HTML, CSS and JavaScript files. It needs no server, no database and
no PHP. That means the best hosting for it is a **static host** — and static hosts are
free at your traffic level.

| Option | Cost | Verdict |
|---|---|---|
| **Netlify** ⭐ | **Free** | **Recommended.** Free hosting, free SSL, free global CDN, plus the two things this site actually uses: the contact form (100 messages/month free) and the login system behind your `/admin` editor. Nothing else gives you all of that at zero cost. |
| Vercel | Free | Just as good for hosting, but has no built-in form handling and no user login, so your `/admin` editor and contact form would both need extra set-up. |
| Cloudflare Pages | Free | Excellent and very fast. Same two gaps as Vercel. |
| GitHub Pages | Free | Fine for hosting, but no forms and no login. Simplest fallback. |
| Traditional shared hosting (cPanel) | $30–70/yr | Works, but you pay for a database and PHP you will never use, and you upload files by hand every time. Only choose this for the Iranian route in section 2. |

**Free is not a trial.** Netlify's free tier is a real, permanent product — 100 GB of
traffic a month, which is far more than a portfolio will ever use.

---

## Step 3 — Put your files on GitHub

GitHub stores your site and keeps a history of every change, so nothing is ever lost.

1. Go to [github.com](https://github.com) and create a free account.
2. Click the **+** in the top-right → **New repository**.
3. Name it `portfolio`. Choose **Private** if you prefer. **Do not** tick any of the
   "add a README" boxes. Click **Create repository**.
4. On the next page click **uploading an existing file**.
5. Open your `site` folder on your computer. Select **everything inside it**
   (`index.html`, `content.json`, `admin`, `assets`, and the rest) and drag it all into
   the browser window.

   > **Critical:** upload the *contents* of the `site` folder, not the folder itself.
   > When you are done, GitHub should list `index.html` at the top level. If it shows
   > a single folder called `site`, delete it and upload again.

6. Wait for the upload to finish, then click the green **Commit changes** button.

---

## Step 4 — Publish with Netlify

1. Go to [netlify.com](https://netlify.com) → **Sign up** → choose **Sign up with GitHub**.
   Authorise it when asked.
2. On your dashboard: **Add new site** → **Import an existing project** → **GitHub**.
3. Pick your `portfolio` repository from the list.
4. Netlify shows build settings. Because there is nothing to build:
   - **Build command:** leave completely empty
   - **Publish directory:** leave empty (or type `.`)

   The `netlify.toml` file already sets this correctly, so the defaults should be right.
5. Click **Deploy**.

About thirty seconds later your site is live at a random address like
`https://sparkling-otter-4a2b91.netlify.app`. **Open it and check it works.**

> To make that temporary address nicer: **Site configuration → Change site name** →
> type `saeedmousavi`. It becomes `saeedmousavi.netlify.app`.

**From this moment on, your site updates itself.** Any change saved to GitHub — including
every Publish you press in the `/admin` editor — appears live within a minute.

---

## Step 5 — Connect your domain

In Netlify: **Domain management** → **Add a domain** → type `saeedmousavi.com` → **Verify** → **Add**.

Netlify then shows you what to do. There are two routes:

### Route A — Point the nameservers (recommended, simpler)

Netlify shows you four addresses like `dns1.p03.nsone.net`.

1. Log into your **registrar** (where you bought the domain).
2. Find the setting called **Nameservers** (sometimes "DNS" or "Custom DNS").
3. Replace the existing ones with the four Netlify gave you. Save.

### Route B — Keep your registrar's DNS and add records

If you would rather leave the nameservers alone, add these two records in your
registrar's DNS panel instead:

| Type | Name / Host | Value |
|---|---|---|
| `A` | `@` | `75.2.60.5` |
| `CNAME` | `www` | `your-site-name.netlify.app` |

> Netlify shows the exact values for your site on screen — **use those**, not these,
> if the two ever differ.

### Then wait

DNS changes spread across the internet in **anywhere from 10 minutes to 48 hours**
(usually about an hour). During that time the site may load for you but not for a friend,
or vice versa. **This is normal. Do not change anything while you wait.**

Check progress at [dnschecker.org](https://dnschecker.org) — type your domain and watch
the green ticks appear around the world.

---

## Step 6 — Turn on HTTPS (the padlock)

HTTPS is the little padlock in the browser bar. Without it, browsers show visitors a
**"Not secure"** warning — fatal for a site meant to impress industrial clients.

**On Netlify it is automatic.** Once your domain has connected (Step 5), go to
**Domain management → HTTPS**. You should see a Let's Encrypt certificate already issued.
If it says "waiting on DNS propagation", wait an hour and press **Verify DNS configuration**.

Then turn on **Force HTTPS**. This sends anyone typing `http://` to the secure `https://`
version automatically.

> **If you chose the Iranian hosting route:** in cPanel look for **SSL/TLS Status** or
> **Let's Encrypt SSL**, tick your domain, click **Run AutoSSL** / **Issue**. Then find
> **Force HTTPS Redirect** and turn it on. Both are free. If your host charges for SSL,
> change host — nobody should charge for this.

**Check it worked:** open `https://yourdomain.com` and look for the padlock. Then try
`http://yourdomain.com` and confirm it jumps to the padlocked version.

---

## Step 7 — Switch on your visual editor

This is what lets you edit the site at `yoursite.com/admin` with no code, from any
computer or phone. It takes about five minutes, once.

1. In Netlify: **Site configuration** → **Identity** → **Enable Identity**.
2. Still in Identity → **Registration preferences** → set to **Invite only**.
   *(Do not skip this. "Open" would let strangers sign up and edit your website.)*
3. Scroll to **Services → Git Gateway** → **Enable Git Gateway**.
4. Go to the **Identity** tab at the top → **Invite users** → enter your own email
   address → **Send**.
5. Check your inbox, click the invitation link, choose a password.
6. Go to `https://yourdomain.com/admin`, log in, and you will see your whole website
   as editable boxes.

**How to use it from now on:** open `/admin`, open a panel, change what you want, press
**Publish**. Wait one minute. Refresh your site. That is the entire workflow.

> **If your repository is private**, also go to your GitHub profile →
> **Settings → Applications** and confirm Netlify has access to it.

---

## Step 8 — Contact form messages

Nothing to configure — the form works as soon as the site is on Netlify.

1. Send yourself a test message through the form on your live site.
2. In Netlify go to **Forms**. Your test message should be listed.
3. Click the `contact` form → **Settings & usage** → **Form notifications** →
   **Add notification → Email notification** → enter your email address.

Now every enquiry arrives in your inbox as well as being stored in Netlify.

> **Spam:** the form already includes a hidden trap field that catches most bots.
> If spam ever gets through, turn on Netlify's built-in reCAPTCHA in the same settings page.

---

## Step 9 — After launch: SEO, testing, analytics

### Fix the three placeholder addresses

Search for `YOUR-DOMAIN-HERE.com` and replace it with your real address in:

- `robots.txt`
- `sitemap.xml`
- `content.json` → `site` → `siteUrl`

### Tell Google your site exists

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. **Add property** → **URL prefix** → type your full `https://` address.
3. Verify ownership — choose the **HTML tag** method, copy the tag it gives you, and
   ask for help pasting it into `index.html` (it is one line, in the `<head>`).
4. Once verified: **Sitemaps** → type `sitemap.xml` → **Submit**.

Google usually indexes a new site within a few days to two weeks.

### SEO basics that actually matter for you

- **Your page title and description** are in `content.json` → `site` → `pageTitle` and
  `metaDescription`. Write them for a human searching for what you do, e.g.
  *"Saeed Mousavi — Industrial Machinery Design Engineer | Production Line Equipment"*.
- **Use the words your clients use.** If factories search for "طراحی خط تولید" or
  "custom packaging machinery", those exact phrases should appear in your About and
  project text. Do not stuff them — just use natural language that matches real searches.
- **Your project write-ups are your SEO.** They are the only substantial, specific text
  on the site. Detailed project descriptions with real industry terms are what will
  actually bring you search traffic.
- **Name your image files descriptively** — `bottle-capping-machine-render.jpg`, not
  `IMG_2847.jpg`. Google reads filenames.
- **The site already includes** a sitemap, a robots file, and structured data telling
  Google you are a person with a job title, an email and social profiles.

### Test before you tell anyone

- [ ] Open the site on your own phone. Read the whole thing. Tap every button.
- [ ] Switch to Persian and read it all again — check the layout mirrors properly.
- [ ] Open every project and click through its whole gallery.
- [ ] Send a message through the contact form and confirm it arrives.
- [ ] Click your LinkedIn/WhatsApp buttons and check they go to the right places.
- [ ] Download your own CV from the button.
- [ ] Run the address through [pagespeed.web.dev](https://pagespeed.web.dev) —
      you should score very high; this site is deliberately lightweight.
- [ ] Paste your address into a WhatsApp message to yourself and check the preview
      card looks right.
- [ ] Ask two people — one engineer, one non-engineer — to look at it and tell you
      what they think you do. If the non-engineer cannot say, rewrite your intro.

### Analytics (optional)

Only if you want to know how many people visit.

| Tool | Cost | Notes |
|---|---|---|
| **Netlify Analytics** | $9/month | Built in, one click, no code, no cookie banner needed |
| **Google Analytics** | Free | The standard. Needs a code snippet added, and legally needs a cookie notice in Europe |
| **Plausible / Umami** | ~$9/mo or free self-hosted | Simple, private, no cookie banner needed |

**My honest advice: skip analytics at first.** For a personal portfolio, the number that
matters is how many enquiries arrive in your inbox — and you already have that from the
contact form. Add analytics later if you genuinely want it.

### Then

- Put the address on your CV, your LinkedIn profile, your email signature and your
  business cards.
- Add it to your LinkedIn profile's **Website** field.
- Set a reminder for **eleven months from now** to check your domain renewed.

---

## What it costs, per year

| | |
|---|---|
| Domain name | **$10–15** |
| Netlify hosting | **Free** |
| SSL certificate | **Free** |
| Contact form (up to 100 messages/month) | **Free** |
| Visual editor and login | **Free** |
| GitHub storage | **Free** |
| **Total** | **about $12 a year** |

The only way this grows is if you exceed 100 form messages a month or 100 GB of traffic —
at which point the site is doing its job extremely well.

---

## Troubleshooting

**"Page not found" on the Netlify address**
The files were uploaded one level too deep. Go to GitHub; if you see a single `site`
folder instead of `index.html` at the top, that is the problem. Delete it and re-upload
the *contents* of the folder.

**The site is up but shows "The site content could not be loaded"**
`content.json` has a typo. Paste it into [jsonlint.com](https://jsonlint.com) to find
the exact line.

**My domain still shows the registrar's parking page**
DNS has not spread yet. Wait — up to 48 hours. Check on
[dnschecker.org](https://dnschecker.org). Do not change settings while waiting; changing
them restarts the clock.

**"Not secure" warning in the browser**
The certificate has not issued yet. Netlify → **Domain management → HTTPS** →
**Verify DNS configuration**. If DNS is correct it issues within an hour.

**I can't log in at /admin**
Check all three: Identity is enabled, **Git Gateway is enabled** (this is the one people
forget), and you accepted the email invitation. If the invitation link expired, send
yourself a new one.

**Pictures work on my computer but not on the live site**
Almost always a capital-letter or a space in the filename. Windows treats `Photo.JPG`
and `photo.jpg` as the same file; a web server does not. Rename your files to lower-case
with hyphens and no spaces, and update `content.json` to match.

**I edited in /admin and pressed Publish but nothing changed**
Give it a full minute — Netlify has to rebuild. Then press `Ctrl + F5` to force your
browser to fetch the new version rather than its cached copy.

**Netlify won't let me sign up from my location**
See section 2. Either use a VPN for the sign-up, or take the Iranian hosting route.
