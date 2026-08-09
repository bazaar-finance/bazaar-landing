#!/usr/bin/env python3
"""Fetch equity + oil prices at build time and write prices.json.

Runs in the Pages deploy workflow (stdlib only, no pip installs). The browser
can't call Yahoo directly (no CORS header), but the Actions runner can, so these
five instruments are baked into the artifact and the page reads prices.json.

Failure policy: start from the currently-deployed prices.json (last good), then
overwrite whichever symbols fetch cleanly. A total failure still exits 0 — the
seeded values in script.js are the final fallback, and a stale price beats a
broken deploy.
"""

import json
import sys
import time
import urllib.request

# Yahoo symbol -> pair key used by script.js / the markup.
SYMBOLS = {
    "TSLA": "TSLA/USD",
    "SPCX": "SPCX/USD",  # SpaceX — public on NASDAQ since June 2026
    "SPY": "SPY/USD",
    "ASML": "ASML/USD",
    "CL=F": "WTI/USD",  # front-month WTI futures, the usual spot proxy
    "EURUSD=X": "EUR/USD",  # intraday interbank rate; beats the once-daily ECB fixing
}

LIVE_URL = "https://bazaar.finance/prices.json"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) bazaar-landing-build"}


def get_json(url, timeout=15):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def yahoo_price(symbol):
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + urllib.request.quote(symbol)
        + "?interval=1d&range=1d"
    )
    meta = get_json(url)["chart"]["result"][0]["meta"]
    price = meta["regularMarketPrice"]
    if not isinstance(price, (int, float)) or price <= 0:
        raise ValueError(f"bad price for {symbol}: {price!r}")
    return float(price)


def main():
    prices = {}

    # Last-good baseline so one bad fetch never blanks a symbol.
    try:
        live = get_json(LIVE_URL)
        prices = {k: v for k, v in live.items() if k in SYMBOLS.values()}
        print(f"last-good baseline: {sorted(prices)}")
    except Exception as e:
        print(f"no last-good baseline ({e}); starting empty")

    for symbol, pair in SYMBOLS.items():
        for attempt in range(3):
            try:
                prices[pair] = round(yahoo_price(symbol), 4)
                print(f"{pair}: {prices[pair]}")
                break
            except Exception as e:
                print(f"{pair}: attempt {attempt + 1} failed: {e}")
                time.sleep(2 * (attempt + 1))

    if not prices:
        # Nothing fetched and no baseline: deploy without the file rather than
        # shipping an empty one; the client seeds cover it.
        print("no prices at all; skipping prices.json")
        return 0

    prices["updated"] = int(time.time())
    with open("prices.json", "w") as f:
        json.dump(prices, f, indent=1)
    print(f"wrote prices.json with {len(prices) - 1} pairs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
