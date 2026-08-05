/* ============================================================
   Bazaar — landing page behavior (framework-free)
   - Live prices from the Pyth Hermes API (updates every 1s)
   - Dark / light theme toggle (persisted to localStorage)
   - Glitch/flicker effect on the "without permission" box
   - Hover-to-play snek video on the same box
   - Cosmetic waitlist form
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Price feed config ---------- */
  var PYTH_IDS = {
    "BTC/USD": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "ETH/USD": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "TSLA/USD": "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
    "ASML/USD": "1a6e324589a0e355919fb1c0389edc3fdf4c46034626bd82aad4e47714cfa94f",
    "SPY/USD": "19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5",
    "NVDA/USD": "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
    "EUR/USD": "a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b",
    "USOILSPOT/USD": "925ca92ff005ae943c158e3563f59698ce7e75c5a8c8dd43303a0a154887b3e6"
  };

  // Seed values so the page never shows an empty state if the API is slow/unreachable.
  var prices = {
    "BTC/USD": 68975.5, "ETH/USD": 3542.18, "TSLA/USD": 408.42, "ASML/USD": 1710.02, "SPY/USD": 771.03,
    "NVDA/USD": 211.93, "EUR/USD": 1.1445, "USOILSPOT/USD": 71.9195
  };

  function fmt(pair, v) {
    if (v == null) return "—";
    if (pair === "EUR/USD") return v.toFixed(4);
    if (v >= 10000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (v >= 100) return v.toFixed(2);
    return v.toFixed(4);
  }

  function renderPrices() {
    document.querySelectorAll("[data-ticker]").forEach(function (el) {
      var p = el.getAttribute("data-ticker");
      el.textContent = prices[p] != null ? "$" + fmt(p, prices[p]) : "—";
    });
    document.querySelectorAll("[data-market-price]").forEach(function (el) {
      var p = el.getAttribute("data-market-price");
      el.textContent = prices[p] != null ? "$" + fmt(p, prices[p]) : "—";
    });
  }

  function fetchPrices() {
    var ids = Object.keys(PYTH_IDS).map(function (k) { return "ids[]=" + PYTH_IDS[k]; }).join("&");
    fetch("https://hermes.pyth.network/v2/updates/price/latest?" + ids)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.parsed) return;
        d.parsed.forEach(function (item) {
          var key = Object.keys(PYTH_IDS).find(function (k) { return PYTH_IDS[k] === item.id; });
          if (key) prices[key] = Number(item.price.price) * Math.pow(10, Number(item.price.expo));
        });
        renderPrices();
      })
      .catch(function () { /* keep last known / seed values */ });
  }

  /* ---------- Theme toggle ---------- */
  function initTheme() {
    var root = document.documentElement;
    var toggle = document.getElementById("themeToggle");

    function current() { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; }
    function apply(theme) {
      root.setAttribute("data-theme", theme);
      try { localStorage.setItem("bazaar-theme", theme); } catch (e) {}
      if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    if (toggle) {
      toggle.textContent = current() === "dark" ? "☀️" : "🌙";
      toggle.addEventListener("click", function () {
        apply(current() === "dark" ? "light" : "dark");
      });
    }
  }

  /* ---------- Glitch box + hover video ---------- */
  function initGlitch() {
    var box = document.getElementById("glitchBox");
    var video = document.getElementById("glitchVideo");
    if (!box) return;

    var hovered = false;
    var glitchTimer = null;
    var glitchOffTimer = null;
    var lastPlayed = 0;
    var COOLDOWN_MS = 1000;

    function schedule() {
      if (hovered) return;
      var delay = 2000 + Math.random() * 2000;
      glitchTimer = setTimeout(function () {
        if (hovered) return;
        box.classList.add("is-glitching");
        glitchOffTimer = setTimeout(function () {
          box.classList.remove("is-glitching");
          schedule();
        }, 400);
      }, delay);
    }

    function endHover() {
      if (!hovered) return;
      hovered = false;
      box.classList.remove("is-hovering");
      if (video) { try { video.pause(); } catch (e) {} }
      schedule();
    }

    function startPlay() {
      var now = Date.now();
      if (now - lastPlayed < COOLDOWN_MS) return;
      lastPlayed = now;
      clearTimeout(glitchTimer);
      clearTimeout(glitchOffTimer);
      hovered = true;
      box.classList.remove("is-glitching");
      box.classList.add("is-hovering");
      if (video) {
        try {
          video.currentTime = 0;
          video.muted = true;
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } catch (e) {}
      }
    }

    box.addEventListener("mouseenter", startPlay);

    // Touch devices have no hover — let a tap play the snek video, then it
    // ends on its own via the "ended" handler below. Gated to no-hover
    // pointers so desktop mouse taps don't double-fire alongside mouseenter.
    var touchOnly = window.matchMedia && window.matchMedia("(hover: none)").matches;
    box.addEventListener("click", function () {
      if (touchOnly) startPlay();
    });

    box.addEventListener("mouseleave", endHover);
    if (video) video.addEventListener("ended", endHover);

    schedule();
  }

  /* ---------- Confetti burst (dependency-free) ---------- */
  function fireConfetti(originEl) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var colors = ["#FDE000", "#ffffff", "#000000", "#22d3ee", "#ef4444"];
    var canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();

    // Burst originates from the target element's center (fallback: screen center).
    var ox = innerWidth / 2, oy = innerHeight / 2;
    if (originEl) { var r = originEl.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; }

    var N = 140, parts = [];
    for (var i = 0; i < N; i++) {
      var ang = Math.PI * 2 * (i / N) + (Math.random() - 0.5);
      var speed = 6 + Math.random() * 9;
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed - 4,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0],
        life: 0, ttl: 90 + Math.random() * 50
      });
    }

    var frame = 0, maxFrames = 160;
    function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      var alive = false;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.life > p.ttl) continue;
        alive = true;
        p.life++;
        p.vy += 0.35;            // gravity
        p.vx *= 0.99;            // drag
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame++;
      if (alive && frame < maxFrames) requestAnimationFrame(tick);
      else remove();
    }
    var removed = false;
    function remove() { if (!removed) { removed = true; canvas.remove(); } }
    requestAnimationFrame(tick);
    setTimeout(remove, 5000); // hard fallback if rAF is throttled (backgrounded tab)
  }

  /* ---------- Waitlist (cosmetic) ---------- */
  function initWaitlist() {
    var form = document.getElementById("waitlistForm");
    var success = document.getElementById("waitlistSuccess");
    if (!form || !success) return;
    // The form POSTs to Brevo via the hidden "brevo_iframe" (see target attr), so the
    // page never navigates away. Native validation blocks invalid emails before submit
    // fires, so this only runs once a valid address is on its way to Brevo.
    form.addEventListener("submit", function () {
      form.hidden = true;
      form.style.display = "none";
      success.hidden = false;
      fireConfetti(success);
    });
  }

  /* ---------- Features marquee: auto-scroll + drag ---------- */
  function initFeatures() {
    var viewport = document.querySelector(".features");
    var track = document.querySelector(".features__track");
    if (!viewport || !track) return;

    // Respect reduced-motion: leave the CSS fallback (native overflow scroll) alone.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var SPEED = 45;          // px per second of auto-scroll
    var offset = 0;          // current translateX magnitude (content moves left as this grows)
    var half = 0;            // width of one copy of the card set (track holds two copies)
    var dragging = false;
    var startX = 0;
    var startOffset = 0;
    var lastT = 0;

    function measure() { half = track.scrollWidth / 2; }
    function wrap(v) { return half > 0 ? ((v % half) + half) % half : 0; }
    function apply() { track.style.transform = "translateX(" + (-offset) + "px)"; }

    measure();
    window.addEventListener("resize", function () { measure(); offset = wrap(offset); apply(); });

    function frame(t) {
      if (!lastT) lastT = t;
      var dt = (t - lastT) / 1000;
      lastT = t;
      if (!dragging) { offset = wrap(offset + SPEED * dt); apply(); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    track.addEventListener("pointerdown", function (e) {
      dragging = true;
      startX = e.clientX;
      startOffset = offset;
      track.classList.add("is-dragging");
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    });

    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      // Drag right → content follows the pointer right → offset decreases.
      offset = wrap(startOffset - (e.clientX - startX));
      apply();
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      try { track.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    initGlitch();
    initWaitlist();
    initFeatures();
    renderPrices();
    fetchPrices();
    setInterval(fetchPrices, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
