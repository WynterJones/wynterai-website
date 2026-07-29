# WynterAI Funnel

Static landing pages for `wynter.ai`. No build step, no dependencies, deployed on
Netlify. The offer is one thing — **create a free Wynter account** — and every
call to action on the site points at the hosted lead page below.

```
index.html      single-viewport opt-in page — the funnel
about.html      Wynter Jones
pricing.html    Free / Pro $28mo / credit packs / FAQ
terms.html      Terms of Service
privacy.html    Privacy Policy
404.html        not found

styles.css      the whole design system, one file
site.js         the whole site's JavaScript, one file
netlify.toml    headers, CSP, redirects, caching
robots.txt  sitemap.xml  site.webmanifest
assets/         logo, favicons, OG image
```

Open a file directly, or serve the directory:

```bash
python3 -m http.server 8899
```

## WynterHub lead capture

Use WynterHub for identity, explicit email consent, lead attribution, and
autoresponder enrollment. The default hosted lead page is:

```text
https://account.wynter.ai/join/wynter-ai
```

A static page can use a normal link:

```html
<a href="https://account.wynter.ai/join/wynter-ai">
  Get WynterAI updates
</a>
```

The visitor signs in or creates their Wynter account, returns to the hosted
consent screen, confirms the opt-in, and is redirected to the safe URL
configured in WynterHub admin. Manage the page at:

```text
https://account.wynter.ai/admin/lead-forms/wynter-ai
```

Create an active autoresponder in WynterHub and select “WynterAI funnel” as its
lead-page trigger to start the sequence after consent.

Every CTA on this site uses that link — the hero card, both pricing plans, the
about page, and the `/signup` and `/join` Netlify redirects — so a signup is
attributed and enrolled no matter which page converted. `/login` links go
straight to `account.wynter.ai/login`; there is nothing to capture from someone
who already has an account.

No WynterHub widget is embedded here. `<wynter-login>` renders its own card with
**Sign in** as the primary button and a sign-up link that bypasses the lead page,
which is the opposite of what this site is for. Nothing else on a static
marketing page needs a widget token.

## Design

Tokens are lifted verbatim from account.wynter.ai's Tailwind theme
(`WynterHub/app/assets/tailwind/application.css`) so the funnel and the product
read as one surface — same ink scale, same `#ff3131` signal red, same Inter, same
12px tile radius. Hand-written here rather than generated: five HTML files don't
justify a Tailwind pipeline to produce a few KB of CSS. The tokens sit at the top
of `styles.css`; change a colour there and it changes everywhere.

Dark only. The Wynter mark is white script with a red `.ai` badge on transparent,
so it only reads on a dark ground; a light theme would need a second logo asset
that doesn't exist.

The home page is laid out as a full-height grid — header, hero, footer — that
fits one viewport without scrolling, and degrades to scrolling below roughly a
landscape phone. On narrow screens the hero reflows so the sign-up card sits
directly under the headline, above the checklist and app strip.

## SEO

- Every page carries a title, meta description, canonical, OG/Twitter tags, and
  JSON-LD: `Organization` + `WebSite` on the home page, `Product` + `FAQPage` on
  pricing, `ProfilePage` on about.
- The app list on the home page is plain markup, not the app-switcher widget.
  Widget content lives in a shadow root, which crawlers don't index, and the
  suite *is* the offer.
- `sitemap.xml` lists all five public pages — update `lastmod` when copy changes
  materially.

## Netlify

`netlify.toml` publishes the repository root, so there is nothing to build.
Netlify serves `about.html` at `/about` and redirects the `.html` URL to the
clean one, which is why every internal link is extensionless.

The CSP forbids `unsafe-inline` for both scripts and styles. That is why every
rule lives in `styles.css` and every line of JS in `site.js` — one `style="..."`
attribute anywhere would force it back open for the whole site. If you add a
page, add classes, not inline styles. The account platform needs no CSP
allowance: the handoff to it is ordinary navigation, not an embedded script.

## Kept in sync with WynterHub by hand

These are static copy here and will drift if the platform changes:

- **Prices** — Pro `$28/mo` and the credit packs (`500/$5`, `1,500/$12`,
  `5,000/$35`), from `WynterHub/db/seeds.rb`.
- **App list** — the nine names in the home page strip, from the `APPS` array in
  the same file.
- **Auth paths** — `/join/:slug`, `/login`, from `WynterHub/config/routes.rb`.
- **Contact addresses** — `support@wynter.ai` in the terms and
  `privacy@wynter.ai` in the privacy policy need to exist and route somewhere.
