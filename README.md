# Bazaar — Landing Page

Landing page for **Bazaar**, the first permissionless derivatives marketplace — a
decentralized, immutable, governance-free perpetual futures protocol.

Live at **<https://bazaar.finance>**.

Framework-free: no build step, no bundler, no npm install. Open `index.html` and it runs.

## Structure

```
bazaar-landing/
├── index.html      # All markup and copy
├── styles.css      # Styles, theme tokens, responsive breakpoints
├── script.js       # Live prices, theme toggle, glitch, drag marquee, confetti
├── CNAME           # Custom domain for GitHub Pages — bazaar.finance
├── robots.txt      # Allows crawling except /scripts/; points at the sitemap
├── sitemap.xml     # One-page sitemap for search consoles
├── README.md
├── scripts/
│   ├── fetch-prices.py  # Build-time equity/index/gold fetch → prices.json (not committed)
│   └── og-image.html    # Draws assets/og-image.png (the social share image) on a canvas
├── .github/
│   └── workflows/
│       ├── deploy.yml      # Deploys every push to master + every 5 min Sun-Fri
│       └── keepalive.yml   # Weekly: empty commit after 50 quiet days, so GitHub
│                           # never disables the cron schedules (60-day rule)
└── assets/
    ├── bazaar-logo-yellow.png    # Horizontal logo — dark mode
    ├── bazaar-logo-new.png       # Horizontal logo — light mode
    ├── bazaar-logo-icon.png      # Favicon
    ├── bazaar-emblem-yellow.png  # Center emblem of the roles wheel
    ├── og-image.png              # 1200×630 Open Graph / Twitter card image
    └── snek.mp4                  # Plays inside the hero glitch box
```

## Run it

It's a static site — any of these work:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Double-clicking `index.html` also works; fonts and live prices just need a connection.

## Deploy

GitHub Pages. Pushing to `master` publishes to <https://bazaar.finance> automatically —
`.github/workflows/deploy.yml` uploads the repo root as the Pages artifact and deploys it.
The workflow also runs on a 5-minute Sun–Fri cron purely to refresh `prices.json`
(see Live prices below). The only build-time work is that price fetch; everything else
ships exactly as it sits here. Runs appear under the repo's **Actions** tab and can be
started by hand from there.

## Page sections

1. **Hero** — headline with the glitch box, CTAs, live price ticker
2. **What is Bazaar** — positioning + ten feature cards (horizontal marquee)
3. **Trading on Bazaar** — four trader-facing differences (no account, gasless, non-crypto markets, isolated collateral)
4. **Run by independent operators** — the six-role wheel with descriptions
5. **Waitlist** — "Where we are" status strip + Brevo-connected email capture
6. **Footer** — motto, license/status line, GitHub, Docs, Contact

## How things work

**Theme.** Dark is the default for every new visitor — `<html data-theme="dark">` is in the
markup, so there's no flash before CSS loads. The navbar toggle switches to light and saves
the choice to `localStorage` (per device). It intentionally does *not* follow the OS
`prefers-color-scheme` setting.

**Live prices.** Two keyless sources feed the hero ticker
(Pyth Hermes was dropped in August 2026 when it moved behind paid API keys):

- **Crypto (BTC, ETH)** — Coinbase Exchange ticker (`/products/{pair}-USD/ticker`),
  polled every 3s in the browser; the `price` field is the actual last trade. Don't
  swap in the friendlier `/v2/exchange-rates` endpoint — it's server-cached and sits
  still for minutes, which makes the ticker look dead. Prices flash briefly on change
  (disabled under reduced motion).
- **Everything else (TSLA, SPCX, ASML, SPX via ^GSPC, XAU via GC=F, EUR via EURUSD=X)** —
  browsers can't call Yahoo Finance (no CORS header), so `scripts/fetch-prices.py`
  runs inside the deploy workflow, which also fires on a 5-minute Sun–Fri cron
  (GitHub's floor; scheduled runs can lag a few minutes under load). It writes
  `prices.json` into the deployed artifact (never the repo). The page re-fetches it
  every minute with a minute-bucketed `?t=` query — Pages caches for 10 minutes, and
  the changing query is what lets visitors see each new deploy promptly. Effective
  freshness is roughly 0–7 minutes. On failure the script reuses the currently-live
  prices.json.

Every pair is seeded in `script.js` and in the markup, so nothing looks empty if a
source is slow or blocked. SPX is the S&P 500 index itself (`^GSPC`), not the SPY ETF,
because Bazaar's listing rules point proposers at an index rather than its tracker. XAU is
the front-month gold future (`GC=F`), the usual proxy for spot gold — Yahoo has no spot XAU
symbol.

**Glitch box.** The "without permission." phrase flickers with chromatic aberration every
2–4 seconds for 400ms. Hovering it (desktop) or tapping it (touch) plays `snek.mp4` once
inline, pausing the flicker until the clip ends. A 1s cooldown prevents retriggering.

**Feature marquee.** Auto-scrolls continuously and can be grabbed and dragged left or right;
releasing resumes the auto-scroll. Driven by `requestAnimationFrame` in `initFeatures()`.

**Icons.** Every highlight card and "Trading on Bazaar" card has a small line icon. They are `<symbol>`s in one
inline sprite at the top of `<body>`, referenced with `<use href="#i-…">`, so a card icon is one
line and styles (stroke, color) come from the card.

**Scroll reveal.** Elements marked `data-reveal` fade up the first time they scroll into view;
an optional `--reveal-delay` staggers a group. `initReveal()` adds the hiding class to `<html>`
itself, so with JS off or reduced motion on, everything is simply visible.

**Node-network backdrop.** A faint mesh of drifting nodes sits behind "Trading on Bazaar" on a
`<canvas class="mesh-bg">`, drawn by `initMesh()` in the theme's accent color. It runs only while
the section is on screen and the tab is visible, and draws one still frame under reduced motion.
Density, speed, link distance and opacity are the constants at the top of `initMesh()`.

**Status strip.** The four stages in the waitlist section are static markup. Finished stages carry
`is-done` (filled dot); the current one carries `is-now` (a blinking hollow ring). To advance, move
`is-now` forward and add `is-done` to the stage it left.

**Share image.** `assets/og-image.png` is what X, Telegram, Discord and Slack show for a link.
`scripts/og-image.html` draws it from the hero headline on a canvas — open it over HTTP (the
logo must be same-origin), download the PNG, and overwrite the asset whenever the headline or
logo changes. The `og:` / `twitter:` tags in `index.html` point at the live URL.

**Waitlist.** Posts to Brevo through a hidden iframe, so the page never navigates away and
the card keeps its own styling. On a valid submission the form is replaced by the
confirmation badge and a confetti burst fires. Invalid or empty emails are blocked by native
validation and never show the confirmation. To repoint it at a different list, swap the
`action` URL on `#waitlistForm`.

**Reduced motion.** `prefers-reduced-motion` disables the ticker, wheel rotation, the pulsing
badge and status-strip dots, the status-strip flow, marquee, scroll reveal, and confetti.

## Editing

- **Copy** — all in `index.html`. Note the feature cards appear **twice** (the marquee holds
  two copies for a seamless loop), so card text must be changed in both places. If the hero
  headline changes, regenerate the share image too (see above).
- **Cache busting** — `index.html` loads `styles.css?v=…` and `script.js?v=…`. Bump the value
  whenever either file changes, or a returning visitor can pair fresh HTML with a stale asset.
- **Colors** — the `--*` custom properties at the top of `styles.css`, split into
  `[data-theme="dark"]` and `[data-theme="light"]` blocks. Brand yellow is `#FDE000`.
- **Breakpoints** — 640px, 900px, 1024px, at the bottom of `styles.css`.

## Search engines

`robots.txt` lets crawlers index the site but keeps the build helpers in `/scripts/` out, and
points at `sitemap.xml`. `index.html` carries a canonical tag for `https://bazaar.finance/`; the
http, www and github.io addresses all 301 to it. Submit the sitemap in Google Search Console and
Bing Webmaster Tools (both need a DNS TXT record to verify the domain). Bump `<lastmod>` in
`sitemap.xml` after substantial copy changes.

## Outbound links

| Link | Destination |
| --- | --- |
| Docs (nav, hero, footer) | `https://docs.bazaar.finance` |
| GitHub (nav, footer) | `https://github.com/bazaar-finance/bazaar` |
| Contact (footer) | `mailto:bazaarfi@proton.me` |

## Notes

- Fonts (Syne + Inter) load from Google Fonts. Self-host them if you need full offline use.
- The waitlist confirmation is cosmetic beyond the Brevo POST — there's no backend of your own.
