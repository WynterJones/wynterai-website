# WynterAI Funnel

Static landing pages for `wynter.ai`. No build step, no dependencies, deployed on
Netlify. The offer is one thing — **create a free account** — and the copy sells
the outcome (offers, funnels, brands, shipped apps) rather than the product
names, which appear only on the pricing page where they need to stay findable.

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
assets/         logo, favicons, OG image, signature
```

To preview locally:

```bash
python3 serve.py          # http://127.0.0.1:8899
```

Use `serve.py` rather than `python3 -m http.server`. Every internal link is
extensionless (`/about`, not `/about.html`) because that is what Netlify serves,
and a plain file server 404s on the whole nav. `serve.py` adds only the
behaviours Netlify has — clean URLs, a 301 from the `.html` form, and a real
`404.html` — and is never deployed.

## WynterHub lead capture

Use WynterHub for identity, explicit email consent, lead attribution, and
autoresponder enrollment.

**This site does not use the hosted lead page.** `account.wynter.ai/join/wynter-ai`
requires an authenticated session and bounces cold traffic to a login screen, so
every link to it was a dead end for exactly the visitors the site is for. It is
referenced nowhere in this repo — not in the HTML, not in the Netlify redirects.
If you find one, it is a regression.

What replaced it is a real form on the home page posting to `POST /start` — see
below. Create an active autoresponder in WynterHub and select “WynterAI funnel”
as its trigger to start the sequence after consent.

No WynterHub widget is embedded here. `<wynter-login>` renders its own card with
**Sign in** as the primary button, which is the opposite of what this site is
for. Nothing else on a static marketing page needs a widget token.

## The home page signup form

`index.html` carries the site's only signup form, in the hero, at `#get-pace`.
It collects a **name and an email only** — no password field anywhere in this
flow. It posts to WynterHub, which creates the account and emails a sign-in
link:

```
wynter.ai  ──POST name+email+opt-in──▶  account.wynter.ai/start
                                              │  creates the account
                                              │  records consent
                                              │  emails a magic link
                                              ▼
                                        "check your email"
                                              │  (clicking the link is what
                                              │   proves the mailbox is theirs)
                                              ▼
                                          dashboard
```

Two things fall out of that. A CDN-hosted marketing page never touches a
credential — every deploy of this repo would otherwise be a credential-handling
surface. And nobody is signed in until they prove they can read the mailbox, so
an account created here isn't a claim about who owns the address.

```html
<form method="post" action="https://account.wynter.ai/start">
  <input name="name" required>
  <input name="email_address" type="email" required>
  <input name="marketing_opt_in" type="checkbox" value="1">
</form>
```

The field is `email_address`, **not** `email`. Renaming it drops the value
silently — WynterHub reads that exact key and there is no error to see.

A native form POST, not `fetch()` — the browser navigates to account.wynter.ai
to submit, so there's no CORS and no third-party cookie involved, and it works
with JavaScript off. **Nothing in this path may become scripted.** `/start` is
Origin-allowlisted rather than CSRF-protected, so an XHR would be refused
anyway, and a funnel that needs a JS file to load is a funnel one blocked
request kills. Validation errors re-render WynterHub's hosted signup with the
fields filled in, which is why this page has no error state of its own. Success
redirects to WynterHub's own "check your email" screen, so there is no
thank-you page in this repo and no redirect field in the form.

⚠️ **The opt-in wording here is not WynterHub's `ConsentCapture::MARKETING_WORDING`.**
That constant is stored verbatim as consent evidence, so the two are supposed to
match character-for-character. The wording in `index.html` was written for
honesty and readability without visibility into WynterHub's current value.
Before this ships: diff the two, and either copy the constant into `index.html`
or update the constant and bump `MARKETING_FORM_VERSION` (was `marketing-v2`).
Consent records source `quick_signup`, and promotional mail waits for the
magic-link click before it enrolls.

The form asks for a name as well as an email. `User#display_name` in WynterHub
falls back to the local part of the address if it is missing, so the name buys a
greeting rather than an identity; `QuickSignupsController` accepts it.

**The box ships unticked.** Under UK/EU GDPR a pre-ticked box is not valid
consent (Art. 4(11); CJEU *Planet49* C-673/17) — the record would show the box
was checked before the person touched it. Do not add `checked`.

### Required: set SIGNUP_FORM_ORIGINS in Railway

`POST /start` can't use CSRF protection — the form is served from another host —
so an Origin allowlist stands in for it, alongside the existing rate limit. The
list is **empty by default**, so a misconfigured deploy refuses everyone rather
than accepting anyone:

```bash
SIGNUP_FORM_ORIGINS=https://wynter.ai,https://www.wynter.ai
```

Until that variable is set on the WynterHub service, the form returns 403.

An address that already has an account is never duplicated: its owner gets a
sign-in link, and the response is identical either way so the endpoint can't be
used to test which addresses are registered.

### Where each CTA goes

| Page | Action | Target |
| --- | --- | --- |
| Home | the signup form itself | `POST account.wynter.ai/start` |
| About, Pricing, Protocol, Guide | "Get PACE free" | `/#get-pace` |
| Home (secondary) | "Read the whole framework, free" | `/pace/guide/` |
| Every page | "Login" | `account.wynter.ai/login` |
| `/signup`, `/join` | redirect | `/#get-pace` |

Every page except the home page links to the form rather than duplicating it.
One form means one set of field names to keep in sync with WynterHub's contract,
and one copy of the consent wording to keep in sync with `MARKETING_WORDING`.

Every signup CTA on the site reads **"Get PACE free"** and goes to `/#get-pace`.
One `btn-primary` signup button per page — the plan cards on `/pricing` are
`btn-secondary` (both of them: there is no way to buy Pro from this site, you
make a free account and upgrade in billing), and the guide's end CTA is
`btn-secondary` because the PDF download above it is that page's primary action.

## Positioning

The home page sells **the outcome**: ship real software with agents doing the
build. Not the act of registering, and not the price — "free" appears exactly
once on the page, in the card, where it removes a purchase objection rather than
carrying the pitch. It was up to 24 uses at one point; if it starts creeping
back, the offer has drifted from the result to the discount.

Copy leads with what someone walks away with, not product names — nobody arrives
knowing them. The names appear once, on the pricing page's "The apps in the
suite" table, result first and the name small underneath, so brand-name searches
still land somewhere. CreateThisOffer was removed from the lineup on
2026-07-29.

## The signature on /about

`assets/wynter-jones-signature.png` is white strokes on transparent, so like the
logo it only reads on a dark ground. It was generated, then keyed by using the
source's luminance as the alpha channel rather than colour-keying — that keeps
every antialiased edge instead of leaving a fringe.

The prose link rule is scoped `a:not(.btn)`. `.prose a` is specificity (0,1,1)
and `.btn` is (0,1,0), so a `text-decoration: none` on the button loses no
matter where it sits in the file; the About CTA came out underlined until the
exclusion moved onto the prose rule itself.

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
- Everything is plain markup, never widget-rendered. Widget content lives in a
  shadow root, which crawlers don't index.
- The home page leads with outcomes; the product names live on the pricing page
  so brand-name searches still land somewhere.
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
- **App list** — the result/name pairs in the pricing page's "The apps in the
  suite" table, from the `APPS` array in the same file. CreateThisOffer has been
  removed here; it is still seeded in WynterHub.
- **Signup form contract** — the `name` / `email_address` / `marketing_opt_in`
  field names and the consent wording, from `QuickSignupsController` and
  `ConsentCapture::MARKETING_WORDING`.
- **Accessibility** — `--text-muted` and `.btn-primary` deviate from WynterHub's
  scale on purpose (see the note in `styles.css`); don't "fix" them back.
- **Auth paths** — `/join/:slug`, `/login`, from `WynterHub/config/routes.rb`.
- **Contact addresses** — `support@wynter.ai` in the terms and
  `privacy@wynter.ai` in the privacy policy need to exist and route somewhere.
