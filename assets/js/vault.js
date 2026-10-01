/* Key2Enable Game Hub — encrypted game loader.
   ------------------------------------------------------------------
   A vaulted game folder holds a tiny index.html (the loader) and
   game.enc — the real game's HTML encrypted with that game's code:

     key   = PBKDF2-SHA256(normalised code, salt, 200 000 rounds) → AES-256
     file  = "K2EV1" | salt(16) | iv(12) | AES-GCM(html)

   Without the code the file is just noise; "View source" shows only this
   loader. gate.js runs first (lock panel, ?key= from the QR); once the
   game is unlocked it keeps the code in the grant, and this script fetches
   game.enc, decrypts it and writes the game into the document.

     <script src="../site-config.js"></script>
     <script src="../assets/js/gate.js" data-game="game-04"></script>
     <script src="../assets/js/vault.js" data-src="game.enc"></script>

   The hub loads it without data-src for the helper API:
   window.K2E_VAULT = { encrypt(code, text) → Promise<Uint8Array>,
                        decrypt(code, bytes) → Promise<string>, supported } */
(function () {
  "use strict";
  var MAGIC = "K2EV1", ROUNDS = 200000;
  var subtle = window.crypto && window.crypto.subtle;
  var supported = !!(subtle && window.TextEncoder && window.fetch);

  function normalize(code) { return String(code || "").toUpperCase().replace(/[\s\-_]+/g, ""); }
  function utf8(s) { return new TextEncoder().encode(s); }

  function deriveKey(code, salt, usage) {
    return subtle.importKey("raw", utf8(normalize(code)), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: ROUNDS }, base,
        { name: "AES-GCM", length: 256 }, false, [usage]);
    });
  }

  function encrypt(code, text) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(code, salt, "encrypt").then(function (key) {
      return subtle.encrypt({ name: "AES-GCM", iv: iv }, key, utf8(text));
    }).then(function (ct) {
      var head = utf8(MAGIC);
      var out = new Uint8Array(head.length + 16 + 12 + ct.byteLength);
      out.set(head, 0); out.set(salt, head.length); out.set(iv, head.length + 16);
      out.set(new Uint8Array(ct), head.length + 28);
      return out;
    });
  }

  function decrypt(code, bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    var head = utf8(MAGIC), i;
    for (i = 0; i < head.length; i++) {
      if (b[i] !== head[i]) return Promise.reject(new Error("Not an encrypted game file"));
    }
    var salt = b.slice(head.length, head.length + 16);
    var iv = b.slice(head.length + 16, head.length + 28);
    var ct = b.slice(head.length + 28);
    return deriveKey(code, salt, "decrypt").then(function (key) {
      return subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct);
    }).then(function (pt) { return new TextDecoder().decode(pt); });
  }

  window.K2E_VAULT = { supported: supported, encrypt: encrypt, decrypt: decrypt, normalize: normalize };

  /* ---------- loader ---------- */
  var me = document.currentScript;
  var SRC = me && me.getAttribute("data-src");
  if (!SRC) return;
  var gate = window.K2E_GATE;
  var GAME = me.getAttribute("data-game") || (gate && gate.game) || "";
  var FAILED = "k2e-vault-failed-" + GAME;

  function status(msg, isError) {
    var el = document.getElementById("k2eVaultStatus");
    if (!el) return;
    el.textContent = msg;
    if (isError) el.setAttribute("data-error", "");
  }
  function progress(ratio) {
    var bar = document.getElementById("k2eVaultBar");
    if (!bar) return;
    bar.hidden = ratio == null;
    if (ratio != null) bar.firstElementChild.style.width = Math.round(ratio * 100) + "%";
  }

  function fail(msg) {
    status(msg, true);
    progress(null);
    document.documentElement.classList.remove("k2e-decrypting");
  }

  /* Download with a progress read-out when the browser streams and the
     server sends Content-Length; otherwise a plain arrayBuffer(). */
  function download(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      var total = +r.headers.get("Content-Length") || 0;
      if (!r.body || !r.body.getReader || !total) return r.arrayBuffer();
      var reader = r.body.getReader(), chunks = [], got = 0;
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) {
            var out = new Uint8Array(got), off = 0;
            chunks.forEach(function (c) { out.set(c, off); off += c.length; });
            return out.buffer;
          }
          chunks.push(res.value); got += res.value.length;
          progress(Math.min(got / total, 1));
          status("Downloading\u2026 " + Math.round(Math.min(got / total, 1) * 100) + "%");
          return pump();
        });
      }
      progress(0);
      return pump();
    });
  }

  function run() {
    if (!supported) return fail("This browser can\u2019t open the game \u2014 please use a current Chrome, Edge, Safari or Firefox.");
    if (!gate || !gate.code) return fail("Access script missing.");
    var code = gate.code(GAME);
    if (!code) {
      var keys = ((window.SITE_CONFIG || {}).access || {}).keys || {};
      if (!keys[GAME]) return fail("This game is encrypted but has no code in site-config.js.");
      /* Unlocked by an older grant that never stored the code: ask again. */
      if (gate.isUnlocked(GAME)) { gate.lock(GAME); location.reload(); }
      return;
    }
    document.documentElement.classList.add("k2e-decrypting");
    status("Opening\u2026");
    var slow = setTimeout(function () {
      var el = document.getElementById("k2eVaultHint");
      if (el) el.hidden = false;
    }, 8000);
    download(SRC).then(function (buf) {
      progress(null);
      status("Unlocking\u2026");
      return decrypt(code, buf).then(function (html) {
        clearTimeout(slow);
        try { sessionStorage.removeItem(FAILED); } catch (e) { /* ignore */ }
        document.open();
        document.write(html);
        document.close();
      }, function () {
        clearTimeout(slow);
        /* The stored code no longer opens this file (re-encrypted with a new code). */
        gate.lock(GAME);
        var again = false;
        try { again = !!sessionStorage.getItem(FAILED); sessionStorage.setItem(FAILED, "1"); } catch (e) { /* ignore */ }
        if (again) return fail("This code doesn\u2019t open the game file \u2014 the game was encrypted with a different code. Please tell the trainer.");
        location.reload();
      });
    }).catch(function (e) {
      clearTimeout(slow);
      var offline = typeof navigator.onLine === "boolean" && !navigator.onLine;
      fail(offline
        ? "You\u2019re offline. Reconnect to the Wi-Fi and reload the page."
        : "Couldn\u2019t load the game (" + (e && e.message || e) + "). Check your connection and reload.");
    });
  }

  if (gate && gate.isUnlocked(GAME)) {
    if (document.body) run(); else document.addEventListener("DOMContentLoaded", run);
  } else {
    window.addEventListener("k2e:unlocked", run);
  }
})();
