/* Key2Enable Game Hub — page logic. Reads everything from site-config.js. */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var games = cfg.games || [];
  var accents = cfg.cardAccents || [];

  /* Base URL of the hub = the directory this index.html lives in.
     Works at https://user.github.io/repo/ as well as http://localhost:8000/ */
  var HUB_URL = new URL("./", window.location.href).href;

  function gameUrl(game) {
    return new URL(game.url || (game.id + "/"), HUB_URL).href;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function icon(name, cls) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", cls || "ico");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  /* ---------- Clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); }
      catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function wireCopy(button, text, label) {
    button.copyText = text;
    button.setAttribute("aria-label", "Copy link to " + label);
    if (button.copyWired) return;
    button.copyWired = true;
    button.addEventListener("click", function () {
      copyText(button.copyText).then(function () {
        toast("Link copied!");
        button.classList.add("is-copied");
        var old = button.innerHTML;
        button.innerHTML = "";
        button.appendChild(icon("check"));
        button.appendChild(document.createTextNode(" Copied"));
        setTimeout(function () { button.classList.remove("is-copied"); button.innerHTML = old; }, 1600);
      }).catch(function () {
        window.prompt("Copy this link:", button.copyText);
      });
    });
  }

  /* ---------- QR codes (assets/vendor/qrcode.js, MIT) ---------- */
  function makeQrCanvas(text, sizePx) {
    var qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    var n = qr.getModuleCount();
    var margin = 2;
    var cell = Math.floor(sizePx / (n + margin * 2)) || 1;
    var size = cell * (n + margin * 2);
    var canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#23324A";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
    return canvas;
  }

  function renderQr(container, text, sizePx, downloadLink, fileName) {
    try {
      var canvas = makeQrCanvas(text, sizePx);
      container.innerHTML = "";
      container.appendChild(canvas);
      if (downloadLink) {
        // a crisp 1024px version for slides
        downloadLink.href = makeQrCanvas(text, 1024).toDataURL("image/png");
        downloadLink.setAttribute("download", fileName);
      }
    } catch (e) {
      container.innerHTML = "<small>QR unavailable</small>";
      if (downloadLink) downloadLink.hidden = true;
    }
  }

  /* ---------- Text bindings (brand, tagline, …) ---------- */
  document.querySelectorAll("[data-cfg]").forEach(function (node) {
    var key = node.getAttribute("data-cfg");
    if (cfg[key]) node.textContent = cfg[key];
  });
  document.title = (cfg.brand || "") + " " + (cfg.hubName || "Game Hub") + " — " + (cfg.tagline || "");

  // highlight the last word of the tagline
  var h1 = document.getElementById("heroTitle");
  if (h1 && cfg.tagline) {
    var words = cfg.tagline.split(" ");
    var last = words.pop();
    h1.innerHTML = "";
    h1.appendChild(document.createTextNode(words.join(" ") + " "));
    h1.appendChild(el("span", { class: "hl", text: last }));
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Access (per-game codes; see assets/js/gate.js) ---------- */
  var gate = window.K2E_GATE;
  var access = cfg.access || {};
  function gated(game) { return !!(gate && gate.enabled && access.keys && access.keys[game.id]); }
  function locked(game) { return gated(game) && !gate.isUnlocked(game.id); }
  function unlockUrl(game, code) { return gameUrl(game) + (gameUrl(game).indexOf("?") > -1 ? "&" : "?") + "key=" + encodeURIComponent(code); }
  function fmtUntil(d) {
    if (!d) return "";
    var opts = { weekday: "short", hour: "numeric", minute: "2-digit" };
    try { return d.toLocaleString(undefined, opts); } catch (e) { return d.toString(); }
  }
  var anyGated = games.some(gated);
  var lockNote = document.getElementById("lockNote");
  if (lockNote) lockNote.hidden = !anyGated;
  var lockWatchers = [];
  function refreshLocks() { lockWatchers.forEach(function (fn) { fn(); }); }

  /* ---------- Game cards ---------- */
  var grid = document.getElementById("gameGrid");
  games.forEach(function (game, i) {
    var url = gameUrl(game);
    var accent = accents[i % accents.length] || "#F76C5E";
    var titleId = "game-title-" + game.id;

    var dots = el("span", { class: "dots", "aria-hidden": "true" });
    for (var d = 1; d <= 3; d++) dots.appendChild(el("i", { class: d <= (game.difficulty || 0) ? "on" : "" }));

    var trains = el("div", { class: "game-card__trains" }, [el("span", { class: "tag tag--label", text: "Trains:" })].concat(
      (game.trains || []).map(function (t) { return el("span", { class: "tag", text: t }); })
    ));

    var play = el("a", { class: "btn btn--primary", href: url, "aria-describedby": titleId }, [icon("play"), document.createTextNode(" Play")]);
    var card = el("li", { class: "game-card", style: "--c:" + accent }, [
      el("div", { class: "game-card__top" }, [
        el("span", { class: "game-card__icon", "aria-hidden": "true" }, [icon(game.icon || "star", "")]),
        el("span", { class: "game-card__num", text: "GAME " + pad(i + 1) })
      ]),
      el("h3", { id: titleId, text: game.title }),
      el("p", { class: "game-card__desc", text: game.description || "" }),
      trains,
      el("div", { class: "game-card__meta" }, [
        el("span", { class: "game-card__level" }),
        game.ready === false ? el("span", { class: "badge badge--soon", text: "Coming soon" }) : el("span", { class: "badge", text: "Ready" })
      ]),
      el("div", { class: "game-card__actions" }, [play])
    ]);
    if (game.difficulty) {
      var meta = card.querySelector(".game-card__level");
      meta.appendChild(dots);
      meta.setAttribute("role", "img");
      meta.setAttribute("aria-label", "Difficulty " + game.difficulty + " of 3");
    }
    if (gated(game)) {
      var badge = card.querySelector(".badge");
      if (game.ready === false) card.querySelector(".game-card__meta").appendChild(badge = el("span", { class: "badge" }));
      var paint = function () {
        var isLocked = locked(game);
        card.classList.toggle("is-locked", isLocked);
        badge.className = "badge " + (isLocked ? "badge--locked" : "badge--open");
        badge.textContent = "";
        badge.appendChild(icon(isLocked ? "lock" : "unlock"));
        badge.appendChild(document.createTextNode(isLocked ? " Locked" : " Unlocked"));
        var until = !isLocked && gate.until(game.id);
        badge.title = isLocked ? "Scan the QR code on the slide, or type its code" : (until ? "Unlocked on this laptop until " + fmtUntil(until) : "Unlocked on this laptop");
        play.setAttribute("aria-label", (isLocked ? "Play \u2014 locked, you will be asked for the game code: " : "Play: ") + game.title);
      };
      paint();
      lockWatchers.push(paint);
    }
    grid.appendChild(card);
  });

  /* ---------- Join: hub URL + QR ---------- */
  var hubUrlEl = document.getElementById("hubUrl");
  hubUrlEl.textContent = HUB_URL.replace(/^https?:\/\//, "");
  wireCopy(document.getElementById("copyHubUrl"), HUB_URL, "the Game Hub");
  renderQr(document.getElementById("hubQrImg"), HUB_URL, 200, document.getElementById("hubQrDownload"), "game-hub-qr.png");

  /* ---------- Share list: per-game link + QR (+ unlock QR when gated) ---------- */
  var shareList = document.getElementById("shareList");
  var shareIntro = document.getElementById("shareIntro");
  if (shareIntro && anyGated) {
    shareIntro.textContent = "One slide per game: type its code \u2192 Unlock QR \u2192 put the QR code and the code on that slide. Scanning (or typing the code) unlocks just that game" + (gate.hours > 0 ? " for " + gate.hours + " h." : " until the tab closes.");
  }
  games.forEach(function (game, i) {
    var url = gameUrl(game);
    var qrBox = el("div", { class: "qr__img", role: "img", "aria-label": "QR code for " + game.title });
    var dl = el("a", { class: "btn btn--ghost btn--sm", href: "#", text: "QR (PNG)" });
    var copy = el("button", { type: "button", class: "btn btn--ghost btn--sm btn--copy" }, [icon("link"), document.createTextNode(" Copy")]);
    var urlEl = el("code", { text: url.replace(/^https?:\/\//, "") });
    var body = el("div", {}, [el("h3", { text: "Game " + pad(i + 1) + " \u2014 " + game.title }), urlEl]);
    var row = el("div", { class: "btn-row" }, [copy, dl, el("a", { class: "btn btn--ghost btn--sm", href: url, text: "Open" })]);
    shareList.appendChild(el("li", { class: "share__item" }, [qrBox, body]));

    if (!gated(game)) {
      wireCopy(copy, url, game.title);
      body.appendChild(row);
      renderQr(qrBox, url, 84, dl, game.id + "-qr.png");
      return;
    }

    var state = el("p", { class: "share__state" });
    var codeTag = el("span", { class: "share__code", hidden: "" });
    var input = el("input", { type: "text", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "Game code", "aria-label": "Code for " + game.title });
    var make = el("button", { type: "submit", class: "btn btn--ghost btn--sm" }, [icon("qr"), document.createTextNode(" Unlock QR")]);
    var form = el("form", { class: "code-form" }, [input, make]);
    var lockBtn = el("button", { type: "button", class: "btn btn--ghost btn--sm", text: "Lock here" });
    body.appendChild(state); body.appendChild(codeTag); body.appendChild(form); body.appendChild(row);
    row.appendChild(lockBtn);

    function showPlain() {
      urlEl.textContent = url.replace(/^https?:\/\//, "");
      codeTag.hidden = true;
      wireCopy(copy, url, game.title + " (locked link)");
      renderQr(qrBox, url, 84, dl, game.id + "-qr.png");
      qrBox.setAttribute("aria-label", "QR code for " + game.title + " (opens the lock screen)");
    }
    function showUnlock(code) {
      var u = unlockUrl(game, code);
      urlEl.textContent = u.replace(/^https?:\/\//, "");
      codeTag.textContent = code;
      codeTag.hidden = false;
      wireCopy(copy, u, game.title + " (unlock link)");
      renderQr(qrBox, u, 84, dl, game.id + "-unlock-qr.png");
      qrBox.setAttribute("aria-label", "Unlock QR code for " + game.title);
    }
    function paintState() {
      var until = gate.until(game.id);
      state.textContent = locked(game) ? "Locked here" : "Unlocked here" + (until ? " until " + fmtUntil(until) : "");
      lockBtn.hidden = locked(game);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = input.value.trim().toUpperCase();
      if (!code) { input.focus(); return; }
      if (gate.verify(game.id, code)) {
        gate.unlock(game.id, code);
        showUnlock(code);
        refreshLocks();
        toast(game.title + " unlock QR ready \u2014 download it for your slide");
      } else {
        toast("That code doesn\u2019t match " + game.title);
        input.select();
      }
    });
    lockBtn.addEventListener("click", function () {
      gate.lock(game.id);
      input.value = "";
      showPlain();
      refreshLocks();
      toast(game.title + " locked on this laptop");
    });
    showPlain();
    paintState();
    lockWatchers.push(paintState);
  });

  /* ---------- Trainer tools: change a game code / lock all ---------- */
  (function () {
    var box = document.getElementById("accessTools");
    if (!box || !anyGated) return;
    box.hidden = false;
    var sel = document.getElementById("hashGame");
    var input = document.getElementById("hashInput");
    var out = document.getElementById("hashOut");
    var copyBtn = document.getElementById("copyHash");
    games.filter(gated).forEach(function (g) { sel.appendChild(el("option", { value: g.id, text: g.title })); });
    document.getElementById("hashForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var code = input.value.trim().toUpperCase();
      if (!code) { input.focus(); return; }
      var line = '"' + sel.value + '": "' + gate.hash(code) + '",';
      out.textContent = "// site-config.js \u2192 access.keys   (code: " + code + ")\n" + line;
      out.hidden = false;
      copyBtn.hidden = false;
      wireCopy(copyBtn, line, "the config line");
    });
    document.getElementById("lockAll").addEventListener("click", function () {
      gate.lock();
      refreshLocks();
      toast("All games locked on this laptop");
    });
  })();

  /* ---------- Trainer tools: feedback saved in this browser ---------- */
  (function () {
    var key = (cfg.feedback && cfg.feedback.storageKey) || "k2e-feedback";
    var countEl = document.getElementById("feedbackCount");
    var csvBtn = document.getElementById("feedbackCsv");
    var clearBtn = document.getElementById("feedbackClear");
    if (!countEl || !csvBtn || !clearBtn) return;

    function entries() {
      try { var v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
    }
    function refresh() {
      var list = entries();
      countEl.textContent = list.length
        ? list.length + (list.length === 1 ? " entry" : " entries") + " saved in this browser."
        : "Nothing saved in this browser yet.";
      csvBtn.disabled = clearBtn.disabled = !list.length;
    }
    function cell(v) {
      var s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    csvBtn.addEventListener("click", function () {
      var cols = ["ts", "game", "gameTitle", "rating", "ratingLabel", "text", "name", "lang", "sent", "page"];
      var rows = [cols.join(",")].concat(entries().map(function (e) {
        return cols.map(function (c) { return cell(c === "sent" ? (e.sent ? "yes" : "no") : e[c]); }).join(",");
      }));
      var blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
      var a = el("a", { href: URL.createObjectURL(blob), download: "key2enable-feedback.csv" });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast("CSV downloaded");
    });
    clearBtn.addEventListener("click", function () {
      if (!window.confirm("Delete all feedback saved in this browser?")) return;
      try { localStorage.removeItem(key); } catch (e) {}
      refresh();
      toast("Feedback cleared");
    });
    window.addEventListener("storage", function (e) { if (e.key === key) refresh(); });
    window.addEventListener("focus", refresh);
    refresh();
  })();

  /* ---------- Intro replay ---------- */
  var replay = document.getElementById("replayIntro");
  if (replay) {
    replay.addEventListener("click", function () {
      if (window.HubIntro) window.HubIntro.play();
    });
  }
})();
