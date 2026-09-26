/* Key2Enable Game Hub — per-game access gate.
   ------------------------------------------------------------------
   The hub itself is open. Every game page loads this script in <head>,
   right after site-config.js, with the game's id:

     <script src="../site-config.js"></script>
     <script src="../assets/js/gate.js" data-game="game-01"></script>

   Until that game has been unlocked in this browser the page is hidden
   behind a full-screen "This game is locked" panel and keyboard events
   never reach the game underneath. Each game has its own code
   (SITE_CONFIG.access.keys, stored as SHA-256 hashes). The instructor's
   slide carries a QR code / link of the form  <game url>?key=CODE  — opening
   it unlocks the game for `access.hours` hours (0 = until the tab closes);
   the code can also be typed into the panel. Changing a code in
   site-config.js re-locks that game everywhere.

   The hub loads the same script without data-game to get the helper API:
   window.K2E_GATE = { hash(code), verify(id, code), unlock(id, code),
                       isUnlocked(id), until(id), lock(id), hours } */
(function () {
  "use strict";
  var site = window.SITE_CONFIG || {};
  var cfg = site.access || {};
  var KEYS = cfg.keys || {};
  var HOURS = typeof cfg.hours === "number" ? cfg.hours : 48;
  var STORE = cfg.storageKey || "k2e-access";
  var enabled = cfg.enabled !== false;
  var html = document.documentElement;

  /* ---------- SHA-256 (sync, works on file:// too) ---------- */
  function sha256(str) {
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = [], i, c;
    str = unescape(encodeURIComponent(str));
    for (i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    var w = new Array(64);
    for (var off = 0; off < bytes.length; off += 64) {
      for (i = 0; i < 16; i++) {
        w[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
      }
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], cc = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & cc) ^ (b & cc);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = "";
    for (i = 0; i < 8; i++) { c = (H[i] >>> 0).toString(16); while (c.length < 8) c = "0" + c; out += c; }
    return out;
  }

  /* Codes are compared case-insensitively and ignoring spaces / dashes. */
  function normalize(code) { return String(code || "").toUpperCase().replace(/[\s\-_]+/g, ""); }
  function hashCode(code) { return sha256(normalize(code)); }
  function expectedHash(id) { return String(KEYS[id] || "").toLowerCase(); }

  /* ---------- storage: { "game-01": { h, until }, ... } ---------- */
  function store() { return HOURS > 0 ? localStorage : sessionStorage; }
  function readAll() {
    try { var v = JSON.parse(store().getItem(STORE) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  }
  function writeAll(v) { try { store().setItem(STORE, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function grant(id) {
    var g = readAll()[id], h = expectedHash(id);
    if (!g || !h || g.h !== h) return null;
    if (HOURS > 0 && (!g.until || g.until < Date.now())) return null;
    return g;
  }
  function verify(id, code) { var h = expectedHash(id); return !!h && hashCode(code) === h; }
  function unlock(id, code) {
    if (!verify(id, code)) return false;
    var all = readAll();
    all[id] = { h: expectedHash(id), at: Date.now(), until: HOURS > 0 ? Date.now() + HOURS * 3600000 : 0 };
    writeAll(all);
    return true;
  }
  function isLocked(id) { return enabled && !!expectedHash(id) && !grant(id); }

  window.K2E_GATE = {
    enabled: enabled,
    hours: HOURS,
    hash: hashCode,
    verify: verify,
    unlock: unlock,
    isUnlocked: function (id) { return !isLocked(id); },
    until: function (id) { var g = grant(id); return g && g.until ? new Date(g.until) : null; },
    lock: function (id) {
      var all = readAll();
      if (id) delete all[id]; else all = {};
      writeAll(all);
      try { sessionStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- which game is this page? ---------- */
  var me = document.currentScript;
  var GAME = (me && me.getAttribute("data-game")) || "";
  if (!GAME) {
    (site.games || []).some(function (g) {
      var u = g.url ? new URL(g.url, location.href).pathname.replace(/index\.html$/, "") : "";
      if (u && location.pathname.replace(/index\.html$/, "") === u) { GAME = g.id; return true; }
      return false;
    });
  }
  if (!GAME) return; // the hub — API only
  var game = (site.games || []).filter(function (g) { return g.id === GAME; })[0] || {};

  /* ?key=CODE in the URL (from the instructor's QR) counts as typing it. */
  var m = /[?&]key=([^&#]+)/.exec(location.search);
  if (m) {
    unlock(GAME, decodeURIComponent(m[1].replace(/\+/g, " ")));
    try {
      var clean = location.search.replace(/([?&])key=[^&#]*&?/, "$1").replace(/[?&]$/, "");
      history.replaceState(null, "", location.pathname + clean + location.hash);
    } catch (e) { /* ignore */ }
  }

  if (!isLocked(GAME)) return;

  /* ---------- locked: hide the page, block keys, show the panel ---------- */
  html.classList.add("k2e-locked");
  var style = document.createElement("style");
  style.textContent =
    "html.k2e-locked body>*:not(.k2e-gate){visibility:hidden!important}" +
    "html.k2e-locked{overflow:hidden}" +
    ".k2e-gate{position:fixed;inset:0;z-index:2147483600;visibility:visible;display:grid;place-items:center;padding:20px;direction:ltr;" +
      "background-color:#FFF8EE;background-image:radial-gradient(circle at 20% 15%,rgba(249,178,51,.28),transparent 45%),radial-gradient(circle at 85% 90%,rgba(63,184,175,.25),transparent 45%);" +
      "font:16px/1.45 'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;color:#23324A}" +
    ".k2e-gate *{box-sizing:border-box}" +
    ".k2e-gate__card{width:min(460px,100%);background:#fff;border:2px solid #23324A;border-radius:24px;padding:34px 30px 26px;text-align:center;" +
      "box-shadow:8px 8px 0 #23324A;animation:k2e-gate-in .4s ease-out}" +
    "@keyframes k2e-gate-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    ".k2e-gate__brand{font-family:'Fredoka','Nunito',system-ui,sans-serif;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.8rem;color:#D8503F;margin:0 0 6px}" +
    ".k2e-gate__lock{width:64px;height:64px;margin:4px auto 12px;border-radius:20px;background:#23324A;display:grid;place-items:center;transform:rotate(-6deg)}" +
    ".k2e-gate__lock svg{width:34px;height:34px;fill:none;stroke:#F9B233;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}" +
    ".k2e-gate h1{font-family:'Fredoka','Nunito',system-ui,sans-serif;font-weight:600;font-size:1.65rem;margin:0 0 6px;line-height:1.15}" +
    ".k2e-gate p{margin:0 0 4px;color:#55627A;font-size:1rem}" +
    ".k2e-gate__ar{direction:rtl;font-size:1.05rem;color:#55627A;margin:0 0 18px}" +
    ".k2e-gate__row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}" +
    ".k2e-gate input{flex:1 1 180px;min-width:0;font:inherit;font-size:1.25rem;font-weight:700;letter-spacing:.12em;text-align:center;text-transform:uppercase;" +
      "padding:12px 14px;border-radius:14px;border:2px solid #23324A;background:#FFF8EE;color:#23324A;outline:none}" +
    ".k2e-gate input:focus-visible{box-shadow:0 0 0 4px rgba(63,184,175,.45)}" +
    ".k2e-gate button{font:inherit;font-weight:800;font-size:1.05rem;padding:12px 22px;border-radius:14px;border:2px solid #23324A;background:#F76C5E;color:#fff;cursor:pointer;" +
      "box-shadow:0 5px 0 #23324A;transition:transform .12s ease,box-shadow .12s ease}" +
    ".k2e-gate button:hover{transform:translateY(-1px)}.k2e-gate button:active{transform:translateY(3px);box-shadow:0 2px 0 #23324A}" +
    ".k2e-gate button:focus-visible{outline:3px solid #1F6FEB;outline-offset:3px}" +
    ".k2e-gate__err{min-height:1.4em;margin-top:12px;font-weight:700;color:#D8503F}" +
    ".k2e-gate__card.is-wrong{animation:k2e-gate-shake .45s ease}" +
    "@keyframes k2e-gate-shake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}" +
    ".k2e-gate__foot{margin-top:18px;font-size:.9rem;color:#8A94A6}" +
    ".k2e-gate__foot a{color:#23324A;font-weight:700}" +
    "@media (prefers-reduced-motion:reduce){.k2e-gate__card,.k2e-gate__card.is-wrong{animation:none}}" +
    "@media (max-width:480px){.k2e-gate__card{padding:26px 20px 22px;border-radius:18px}.k2e-gate h1{font-size:1.4rem}}";
  (document.head || html).appendChild(style);

  var gateEl = null;
  var trap = function (e) {
    if (gateEl && gateEl.contains(e.target)) return;
    e.stopImmediatePropagation();
  };
  window.addEventListener("keydown", trap, true);
  window.addEventListener("keyup", trap, true);
  window.addEventListener("keypress", trap, true);

  function build() {
    var brand = site.brand || "Key2Enable";
    var hubName = site.hubName || "Game Hub";
    var hubHref = (me && me.getAttribute("data-hub")) || "../";
    var gate = document.createElement("div");
    gate.className = "k2e-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "k2eGateTitle");
    gate.innerHTML =
      '<form class="k2e-gate__card" novalidate>' +
        '<p class="k2e-gate__brand">' + brand + " \u00b7 " + hubName + "</p>" +
        '<div class="k2e-gate__lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/><circle cx="12" cy="15.5" r="1.4" fill="#F9B233" stroke="none"/></svg></div>' +
        '<h1 id="k2eGateTitle"></h1>' +
        "<p>Scan the QR code on your instructor\u2019s slide, or type the game code shown under it." +
          (HOURS > 0 ? " This laptop then stays unlocked for " + HOURS + " hours." : "") + "</p>" +
        '<p class="k2e-gate__ar" lang="ar">\u0627\u0645\u0633\u062d \u0631\u0645\u0632 QR \u0645\u0646 \u0634\u0631\u064a\u062d\u0629 \u0627\u0644\u0645\u062f\u0631\u0628 \u0623\u0648 \u0627\u0643\u062a\u0628 \u0631\u0645\u0632 \u0627\u0644\u0644\u0639\u0628\u0629</p>' +
        '<div class="k2e-gate__row">' +
          '<input id="k2eGateKey" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Game code" placeholder="GAME CODE">' +
          '<button type="submit">Unlock</button>' +
        "</div>" +
        '<div class="k2e-gate__err" role="alert" aria-live="assertive"></div>' +
        '<p class="k2e-gate__foot"><a href="' + hubHref + '">\u2190 Back to ' + hubName + "</a></p>" +
      "</form>";
    gate.querySelector("h1").textContent = (game.title || "This game") + " is locked";
    document.body.appendChild(gate);
    gateEl = gate;
    /* Some games rebuild <body> on load — put the panel back if it disappears. */
    new MutationObserver(function () {
      if (html.classList.contains("k2e-locked") && !document.body.contains(gate)) document.body.appendChild(gate);
    }).observe(document.body, { childList: true });

    var form = gate.firstChild, input = gate.querySelector("input"), err = gate.querySelector(".k2e-gate__err");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value;
      if (!normalize(v)) { input.focus(); return; }
      if (unlock(GAME, v)) {
        open(gate);
      } else {
        err.textContent = "That code isn\u2019t right for this game \u2014 check the slide or ask your instructor. \u00b7 \u0627\u0644\u0631\u0645\u0632 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d";
        form.classList.remove("is-wrong"); void form.offsetWidth; form.classList.add("is-wrong");
        input.select();
      }
    });
    input.addEventListener("input", function () { err.textContent = ""; });
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }

  function open(gate) {
    window.removeEventListener("keydown", trap, true);
    window.removeEventListener("keyup", trap, true);
    window.removeEventListener("keypress", trap, true);
    html.classList.remove("k2e-locked");
    gate.style.transition = "opacity .35s ease";
    gate.style.opacity = "0";
    setTimeout(function () { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 380);
    try { window.dispatchEvent(new CustomEvent("k2e:unlocked", { detail: { game: GAME } })); } catch (e) { /* old browsers */ }
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
