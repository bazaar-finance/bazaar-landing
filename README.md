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
├── .github/
│   └── workflows/
│       └── deploy.yml   # Auto-deploys every push to master
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
There is no build step, so the files ship exactly as they sit here. Runs appear under the
repo's **Actions** tab and can also be started by hand from there.

Three one-time settings this depends on:

- The repo must be **public** — Pages needs a paid plan to publish from a private repo.
- **Settings → Pages → Source** set to **GitHub Actions**, not "Deploy from a branch".
- **Settings → Pages → Custom domain** set to `bazaar.finance`. The `CNAME` file keeps the
  domain attached across deploys, but the settings entry is what provisions the TLS
  certificate. Turn on **Enforce HTTPS** once it has been issued.

DNS stays at the registrar — GitHub publishes stable apex addresses, so nothing about the
zone has to move:

| Record | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153` |
| CNAME | `www` | `bazaar-finance.github.io` |

Pages has a soft bandwidth limit of 100 GB/month. At the current page weight that is roughly
50k views; `snek.mp4` is ~2 MB of every cold load and dominates the number.

Nothing here is host-specific. Netlify, Vercel, and Cloudflare Pages all serve the folder
with no build command — Cloudflare needs the domain's nameservers pointed at it, the others
work with the zone as it stands.

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

**Live prices.** Pulled from the Pyth Hermes API every second, feeding both the hero ticker
and the market tiles. Feed IDs live in `PYTH_IDS` at the top of `script.js`
(BTC, ETH, TSLA, NVDA, ASML, SPY, US oil spot, EUR). Every value is seeded with a sample price, so
nothing looks empty if the API is slow or blocked. Note that equity feeds (TSLA, NVDA, ASML, SPY)
only tick during US market hours; crypto, oil, and FX run nearly 24/7.
Avoid Pyth's `.ON` (overnight) feed variants — several have stopped publishing and freeze at a
stale value. Check a feed's `publish_time` before wiring it in.

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
