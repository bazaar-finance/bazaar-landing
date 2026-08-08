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
├── README.md
├── scripts/
│   └── fetch-prices.py  # Build-time equity/oil fetch → prices.json (not committed)
├── .github/
│   └── workflows/
│       └── deploy.yml   # Deploys every push to master + every 15 min on weekdays
└── assets/
    ├── bazaar-logo-yellow.png    # Horizontal logo — dark mode
    ├── bazaar-logo-new.png       # Horizontal logo — light mode
    ├── bazaar-logo-icon.png      # Favicon
    ├── bazaar-emblem-yellow.png  # Center emblem of the roles wheel
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
The workflow also runs on a 15-minute weekday cron purely to refresh `prices.json`
(see Live prices below). The only build-time work is that price fetch; everything else
ships exactly as it sits here. Runs appear under the repo's **Actions** tab and can be
started by hand from there.

## Page sections

1. **Hero** — headline with the glitch box, CTAs, live price ticker
2. **What is Bazaar** — positioning + four feature cards (horizontal marquee)
3. **Run by independent operators** — the six-role wheel with descriptions
4. **Every market, one protocol** — live market tiles
5. **Waitlist** — Brevo-connected email capture
6. **Footer** — GitHub, Docs, Contact

## How things work

**Theme.** Dark is the default for every new visitor — `<html data-theme="dark">` is in the
markup, so there's no flash before CSS loads. The navbar toggle switches to light and saves
the choice to `localStorage` (per device). It intentionally does *not* follow the OS
`prefers-color-scheme` setting.

**Live prices.** Two keyless sources feed the hero ticker and the market tiles
(Pyth Hermes was dropped in August 2026 when it moved behind paid API keys):

- **Crypto (BTC, ETH)** — Coinbase Exchange ticker (`/products/{pair}-USD/ticker`),
  polled every 3s in the browser; the `price` field is the actual last trade. Don't
  swap in the friendlier `/v2/exchange-rates` endpoint — it's server-cached and sits
  still for minutes, which makes the ticker look dead. Prices flash briefly on change
  (disabled under reduced motion).
- **Everything else (TSLA, NVDA, SPY, ASML, WTI via CL=F, EUR via EURUSD=X)** —
  browsers can't call Yahoo Finance (no CORS header), so `scripts/fetch-prices.py`
  runs inside the deploy workflow, which also fires on a 15-minute weekday cron. It
  writes `prices.json` into the deployed artifact (never the repo) and the page
  re-fetches it every 5 minutes. Effective freshness is ~15–25 min after Pages'
  10-minute edge cache — fine for instruments that only trade in sessions anyway.
  On failure the script reuses the currently-live prices.json.

Every pair is seeded in `script.js` and in the markup, so nothing looks empty if a
source is slow or blocked. WTI is the front-month future (`CL=F`), the standard proxy
for spot oil.

**Glitch box.** The "without permission." phrase flickers with chromatic aberration every
2–4 seconds for 400ms. Hovering it (desktop) or tapping it (touch) plays `snek.mp4` once
inline, pausing the flicker until the clip ends. A 1s cooldown prevents retriggering.

**Feature marquee.** Auto-scrolls continuously and can be grabbed and dragged left or right;
releasing resumes the auto-scroll. Driven by `requestAnimationFrame` in `initFeatures()`.

**Waitlist.** Posts to Brevo through a hidden iframe, so the page never navigates away and
the card keeps its own styling. On a valid submission the form is replaced by the
confirmation badge and a confetti burst fires. Invalid or empty emails are blocked by native
validation and never show the confirmation. To repoint it at a different list, swap the
`action` URL on `#waitlistForm`.

**Reduced motion.** `prefers-reduced-motion` disables the ticker, wheel rotation, pulsing
dots, marquee, and confetti.

## Editing

- **Copy** — all in `index.html`. Note the feature cards appear **twice** (the marquee holds
  two copies for a seamless loop), so card text must be changed in both places.
- **Colors** — the `--*` custom properties at the top of `styles.css`, split into
  `[data-theme="dark"]` and `[data-theme="light"]` blocks. Brand yellow is `#FDE000`.
- **Breakpoints** — 640px, 900px, 1024px, at the bottom of `styles.css`.

## Outbound links

| Link | Destination |
| --- | --- |
| Docs (nav, hero, footer) | `https://docs.bazaar.finance` |
| GitHub (nav, footer) | `https://github.com/bazaar-finance/bazaar` |
| Contact (footer) | `mailto:bazaarfi@proton.me` |

## Notes

- Fonts (Syne + Inter) load from Google Fonts. Self-host them if you need full offline use.
- The waitlist confirmation is cosmetic beyond the Brevo POST — there's no backend of your own.
