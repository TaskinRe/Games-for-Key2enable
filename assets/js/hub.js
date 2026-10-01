/* Key2Enable Game Hub — page logic. Reads everything from site-config.js. */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var games = cfg.games || [];
  var accents = cfg.cardAccents || [];

  /* ---------- Language (participant-facing text; Trainer tools stay English) ----------
     Order: ?lang= on the URL → choice saved on this laptop → language the
     games were last played in (sessionStorage "k2e-lang") → English. */
  var LANGS = ["en", "ar"], LANG_KEY = "k2e-hub-lang";
  var LANG = (function () {
    var m = /[?&]lang=(en|ar)\b/i.exec(location.search);
    var v = m && m[1].toLowerCase();
    try { v = v || localStorage.getItem(LANG_KEY) || sessionStorage.getItem("k2e-lang"); } catch (e) { /* private mode */ }
    return LANGS.indexOf(v) > -1 ? v : "en";
  })();
  var STR = {
    en: {
      skipIntro: "Skip intro", skipToGames: "Skip to games", navGames: "Games", navJoin: "Join", navIntro: "Intro",
      replayTitle: "Replay the intro animation", pick: "Pick a game", gamesTitle: "Games",
      codeHint: "Have a game code from the slide? Type it here \u2014 the right game opens.", codePh: "Game code", codeBtn: "Open",
      codeNoMatch: "That code doesn\u2019t match any game \u2014 check the slide.", codeOpening: "Opening {game}\u2026",
      step1: "Scan", step1p: "the QR code on the slide", step2: "Play", step2p: "on your laptop", step3: "Next", step3p: "\u201cBack to Game Hub\u201d",
      join: "Join", joinP: "Scan, or type the address.", copy: "Copy", download: "Download QR", trainer: "Trainer tools",
      game: "GAME", trains: "Trains:", ready: "Ready", soon: "Coming soon", locked: "Locked", unlocked: "Unlocked", play: "Play",
      lockedTitle: "Scan the QR code on the slide, or type its code", unlockedTitle: "Unlocked on this laptop", until: " until ",
      playLocked: "Play \u2014 locked, you will be asked for the game code: ", playOpen: "Play: ", difficulty: "Difficulty {n} of 3",
      copied: "Link copied!", copiedBtn: "Copied", copyPrompt: "Copy this link:", copyAria: "Copy link to "
    },
    ar: {
      skipIntro: "\u062a\u062e\u0637\u0651\u064a \u0627\u0644\u0645\u0642\u062f\u0645\u0629", skipToGames: "\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0623\u0644\u0639\u0627\u0628",
      navGames: "\u0627\u0644\u0623\u0644\u0639\u0627\u0628", navJoin: "\u0627\u0646\u0636\u0645\u0651", navIntro: "\u0627\u0644\u0645\u0642\u062f\u0645\u0629",
      replayTitle: "\u0625\u0639\u0627\u062f\u0629 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0645\u0642\u062f\u0645\u0629", pick: "\u0627\u062e\u062a\u0631 \u0644\u0639\u0628\u0629", gamesTitle: "\u0627\u0644\u0623\u0644\u0639\u0627\u0628",
      codeHint: "\u0644\u062f\u064a\u0643 \u0631\u0645\u0632 \u0644\u0639\u0628\u0629 \u0645\u0646 \u0627\u0644\u0634\u0631\u064a\u062d\u0629\u061f \u0627\u0643\u062a\u0628\u0647 \u0647\u0646\u0627 \u0648\u0633\u062a\u064f\u0641\u062a\u062d \u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629.",
      codePh: "\u0631\u0645\u0632 \u0627\u0644\u0644\u0639\u0628\u0629", codeBtn: "\u0627\u0641\u062a\u062d",
      codeNoMatch: "\u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u0644\u0627 \u064a\u0637\u0627\u0628\u0642 \u0623\u064a \u0644\u0639\u0628\u0629 \u2014 \u062a\u062d\u0642\u0651\u0642 \u0645\u0646 \u0627\u0644\u0634\u0631\u064a\u062d\u0629.",
      codeOpening: "\u062c\u0627\u0631\u064d \u0641\u062a\u062d {game}\u2026",
      step1: "\u0627\u0645\u0633\u062d", step1p: "\u0631\u0645\u0632 QR \u0639\u0644\u0649 \u0627\u0644\u0634\u0631\u064a\u062d\u0629", step2: "\u0627\u0644\u0639\u0628", step2p: "\u0639\u0644\u0649 \u062d\u0627\u0633\u0648\u0628\u0643",
      step3: "\u0627\u0644\u062a\u0627\u0644\u064a", step3p: "\u00ab\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0645\u0631\u0643\u0632 \u0627\u0644\u0623\u0644\u0639\u0627\u0628\u00bb",
      join: "\u0627\u0646\u0636\u0645\u0651", joinP: "\u0627\u0645\u0633\u062d \u0627\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0643\u062a\u0628 \u0627\u0644\u0639\u0646\u0648\u0627\u0646.", copy: "\u0646\u0633\u062e", download: "\u062a\u0646\u0632\u064a\u0644 QR",
      trainer: "\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0645\u062f\u0631\u0651\u0628 (Trainer tools)",
      game: "\u0644\u0639\u0628\u0629", trains: "\u064a\u062f\u0631\u0651\u0628:", ready: "\u062c\u0627\u0647\u0632\u0629", soon: "\u0642\u0631\u064a\u0628\u064b\u0627", locked: "\u0645\u0642\u0641\u0644\u0629", unlocked: "\u0645\u0641\u062a\u0648\u062d\u0629", play: "\u0627\u0644\u0639\u0628",
      lockedTitle: "\u0627\u0645\u0633\u062d \u0631\u0645\u0632 QR \u0639\u0644\u0649 \u0627\u0644\u0634\u0631\u064a\u062d\u0629 \u0623\u0648 \u0627\u0643\u062a\u0628 \u0631\u0645\u0632 \u0627\u0644\u0644\u0639\u0628\u0629", unlockedTitle: "\u0645\u0641\u062a\u0648\u062d\u0629 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062d\u0627\u0633\u0648\u0628", until: " \u062d\u062a\u0649 ",
      playLocked: "\u0627\u0644\u0639\u0628 \u2014 \u0645\u0642\u0641\u0644\u0629\u060c \u0633\u064a\u064f\u0637\u0644\u0628 \u0645\u0646\u0643 \u0631\u0645\u0632 \u0627\u0644\u0644\u0639\u0628\u0629: ", playOpen: "\u0627\u0644\u0639\u0628: ", difficulty: "\u0627\u0644\u0635\u0639\u0648\u0628\u0629 {n} \u0645\u0646 3",
      copied: "\u062a\u0645 \u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637!", copiedBtn: "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e", copyPrompt: "\u0627\u0646\u0633\u062e \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637:", copyAria: "\u0646\u0633\u062e \u0631\u0627\u0628\u0637 "
    }
  };
  function t(key, vars) {
    var str = (STR[LANG] && STR[LANG][key]) || STR.en[key] || key;
    Object.keys(vars || {}).forEach(function (k) { str = str.replace("{" + k + "}", vars[k]); });
    return str;
  }
  /* Config text with an optional Arabic override: cfg.ar.tagline, game.ar.title … */
  function tx(obj, key) {
    var alt = LANG !== "en" && obj && obj[LANG];
    return (alt && alt[key]) || (obj && obj[key]) || "";
  }

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
    button.setAttribute("aria-label", t("copyAria") + label);
    if (button.copyWired) return;
    button.copyWired = true;
    var restore = 0;
    button.addEventListener("click", function () {
      copyText(button.copyText).then(function () {
        toast(t("copied"));
        if (!restore) button.copyOld = button.innerHTML;
        clearTimeout(restore);
        button.classList.add("is-copied");
        button.innerHTML = "";
        button.appendChild(icon("check"));
        button.appendChild(document.createTextNode(" " + t("copiedBtn")));
        restore = setTimeout(function () { restore = 0; button.classList.remove("is-copied"); button.innerHTML = button.copyOld; }, 1600);
      }).catch(function () {
        window.prompt(t("copyPrompt"), button.copyText);
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

  /* ---------- Text bindings (brand, tagline, …) + language ---------- */
  function applyText() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (node) { node.textContent = t(node.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) { node.title = t(node.getAttribute("data-i18n-title")); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) { node.placeholder = t(node.getAttribute("data-i18n-placeholder")); });
    document.querySelectorAll("[data-cfg]").forEach(function (node) {
      var v = tx(cfg, node.getAttribute("data-cfg"));
      if (v) node.textContent = v;
    });
    document.title = (cfg.brand || "") + " " + (tx(cfg, "hubName") || "Game Hub") + " \u2014 " + tx(cfg, "tagline");

    // highlight the last word of the tagline
    var h1 = document.getElementById("heroTitle");
    var tagline = tx(cfg, "tagline");
    if (h1 && tagline) {
      var words = tagline.split(" ");
      var last = words.pop();
      h1.innerHTML = "";
      h1.appendChild(document.createTextNode(words.join(" ") + " "));
      h1.appendChild(el("span", { class: "hl", text: last }));
    }
    document.querySelectorAll("#langToggle [data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === LANG ? "true" : "false");
    });
  }
  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0 || lang === LANG) return;
    LANG = lang;
    try { localStorage.setItem(LANG_KEY, lang); sessionStorage.setItem("k2e-lang", lang); } catch (e) { /* private mode */ }
    applyText();
    renderCards();
    var msg = document.getElementById("codeEntryMsg");
    if (msg) msg.textContent = "";
  }
  applyText();
  var langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lang]");
      if (b) setLang(b.getAttribute("data-lang"));
    });
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
    try { return d.toLocaleString(LANG === "ar" ? "ar" : undefined, opts); } catch (e) { return d.toString(); }
  }
  var anyGated = games.some(gated);
  var lockWatchers = [], cardWatchers = [];
  function refreshLocks() { lockWatchers.concat(cardWatchers).forEach(function (fn) { fn(); }); }

  /* ---------- Game cards ---------- */
  var grid = document.getElementById("gameGrid");
  function renderCards() {
    grid.innerHTML = "";
    cardWatchers = [];
    games.forEach(function (game, i) {
      var url = gameUrl(game);
      var accent = accents[i % accents.length] || "#F76C5E";
      var titleId = "game-title-" + game.id;

      var dots = el("span", { class: "dots", "aria-hidden": "true" });
      for (var d = 1; d <= 3; d++) dots.appendChild(el("i", { class: d <= (game.difficulty || 0) ? "on" : "" }));

      var trainList = tx(game, "trains") || [];
      var trains = el("div", { class: "game-card__trains" }, [el("span", { class: "tag tag--label", text: t("trains") })].concat(
        trainList.map(function (name) { return el("span", { class: "tag", text: name }); })
      ));

      var play = el("a", { class: "btn btn--primary", href: url, "aria-describedby": titleId }, [icon("play"), document.createTextNode(" " + t("play"))]);
      var card = el("li", { class: "game-card", style: "--c:" + accent }, [
        el("div", { class: "game-card__top" }, [
          el("span", { class: "game-card__icon", "aria-hidden": "true" }, [icon(game.icon || "star", "")]),
          el("span", { class: "game-card__num", text: t("game") + " " + pad(i + 1) })
        ]),
        el("h3", { id: titleId, text: tx(game, "title") }),
        el("p", { class: "game-card__desc", text: tx(game, "description") }),
        trains,
        el("div", { class: "game-card__meta" }, [
          el("span", { class: "game-card__level" }),
          game.ready === false ? el("span", { class: "badge badge--soon", text: t("soon") }) : el("span", { class: "badge", text: t("ready") })
        ]),
        el("div", { class: "game-card__actions" }, [play])
      ]);
      if (game.difficulty) {
        var meta = card.querySelector(".game-card__level");
        meta.appendChild(dots);
        meta.setAttribute("aria-label", t("difficulty", { n: game.difficulty }));
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
          badge.appendChild(document.createTextNode(" " + t(isLocked ? "locked" : "unlocked")));
          var until = !isLocked && gate.until(game.id);
          badge.title = isLocked ? t("lockedTitle") : t("unlockedTitle") + (until ? t("until") + fmtUntil(until) : "");
          play.setAttribute("aria-label", t(isLocked ? "playLocked" : "playOpen") + tx(game, "title"));
        };
        paint();
        cardWatchers.push(paint);
      }
      grid.appendChild(card);
    });
  }
  renderCards();

  /* ---------- Code entry on the hub: a code opens the game it belongs to ---------- */
  (function () {
    var form = document.getElementById("codeEntry");
    if (!form || !anyGated) return;
    form.hidden = false;
    var input = document.getElementById("codeEntryInput"), msg = document.getElementById("codeEntryMsg");
    input.addEventListener("input", function () { msg.textContent = ""; form.classList.remove("is-wrong"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = input.value.trim();
      if (!code) { input.focus(); return; }
      var game = games.filter(function (g) { return gated(g) && gate.verify(g.id, code); })[0];
      if (!game) {
        msg.textContent = t("codeNoMatch");
        form.classList.remove("is-wrong");
        void form.offsetWidth;
        form.classList.add("is-wrong");
        input.select();
        return;
      }
      gate.unlock(game.id, code);
      refreshLocks();
      msg.textContent = t("codeOpening", { game: tx(game, "title") });
      window.location.href = gameUrl(game);
    });
  })();

  /* ---------- Join: hub URL + QR ---------- */
  var hubUrlEl = document.getElementById("hubUrl");
  hubUrlEl.textContent = HUB_URL.replace(/^https?:\/\//, "");
  wireCopy(document.getElementById("copyHubUrl"), HUB_URL, "the Game Hub");
  renderQr(document.getElementById("hubQrImg"), HUB_URL, 200, document.getElementById("hubQrDownload"), "game-hub-qr.png");

  /* ---------- Trainer tools: PIN (access.trainerPin, hashed like game codes) ---------- */
  (function () {
    var pinHash = String(access.trainerPin || "").toLowerCase();
    var form = document.getElementById("pinForm"), body = document.getElementById("trainerBody");
    if (!form || !body || !pinHash || !gate) return;
    var STORE = (access.storageKey || "k2e-access") + "-trainer";
    var input = document.getElementById("pinInput");
    var signedIn = document.getElementById("pinSignedIn"), state = document.getElementById("pinState");
    function store() { return gate.hours > 0 ? localStorage : sessionStorage; }
    function grant() {
      try {
        var g = JSON.parse(store().getItem(STORE) || "null");
        if (!g || g.h !== pinHash) return null;
        if (gate.hours > 0 && (!g.until || g.until < Date.now())) return null;
        return g;
      } catch (e) { return null; }
    }
    function paint() {
      var g = grant();
      form.hidden = !!g;
      body.hidden = !g;
      signedIn.hidden = !g;
      if (g) state.textContent = "Trainer tools open on this laptop" + (g.until ? " until " + fmtUntil(new Date(g.until)) : "") + ".";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pin = input.value.trim();
      if (!pin) { input.focus(); return; }
      if (gate.hash(pin) === pinHash) {
        try { store().setItem(STORE, JSON.stringify({ h: pinHash, at: Date.now(), until: gate.hours > 0 ? Date.now() + gate.hours * 3600000 : 0 })); } catch (err) { /* private mode */ }
        input.value = "";
        paint();
        toast("Trainer tools open");
      } else {
        toast("That PIN doesn\u2019t match");
        input.select();
      }
    });
    document.getElementById("pinSignOut").addEventListener("click", function () {
      try { store().removeItem(STORE); } catch (err) { /* ignore */ }
      paint();
      toast("Trainer tools closed on this laptop");
    });
    window.addEventListener("storage", function (e) { if (!e.key || e.key === STORE) paint(); });
    paint();
  })();

  /* ---------- Share list: per-game link + QR (+ unlock QR when gated) ---------- */
  var shareList = document.getElementById("shareList");
  var shareIntro = document.getElementById("shareIntro");
  var shareTip = document.getElementById("shareTip");
  if (shareTip && anyGated) shareTip.hidden = false;
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
    sel.appendChild(el("option", { value: "trainerPin", text: "Trainer PIN" }));
    document.getElementById("hashForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var code = input.value.trim().toUpperCase();
      if (!code) { input.focus(); return; }
      var isPin = sel.value === "trainerPin";
      var line = isPin ? 'trainerPin: "' + gate.hash(code) + '",' : '"' + sel.value + '": "' + gate.hash(code) + '",';
      out.textContent = "// site-config.js \u2192 access" + (isPin ? "" : ".keys") + "   (" + (isPin ? "PIN" : "code") + ": " + code + ")\n" + line;
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

  /* ---------- Trainer tools: encrypt a game file (game.enc + loader) ---------- */
  (function () {
    var box = document.getElementById("vaultTools");
    var vault = window.K2E_VAULT;
    if (!box || !anyGated || !vault || !vault.supported) return;
    box.hidden = false;
    var sel = document.getElementById("vaultGame");
    var codeIn = document.getElementById("vaultCode");
    var fileIn = document.getElementById("vaultFile");
    var out = document.getElementById("vaultOut");
    games.filter(gated).forEach(function (g) { sel.appendChild(el("option", { value: g.id, text: g.title })); });

    function save(blob, name) {
      var a = el("a", { href: URL.createObjectURL(blob), download: name });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }
    document.getElementById("vaultForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var game = games.filter(function (g) { return g.id === sel.value; })[0];
      var code = codeIn.value.trim(), file = fileIn.files && fileIn.files[0];
      if (!game || !code) { codeIn.focus(); return; }
      if (!file) { fileIn.focus(); return; }
      if (!gate.verify(game.id, code)) { out.textContent = "That isn\u2019t the current code for " + game.title + " \u2014 the game would never open. Change the code hash first, or use the current code."; codeIn.select(); return; }
      out.textContent = "Encrypting\u2026";
      Promise.all([file.text(), fetch("assets/vault-loader.html").then(function (r) { return r.text(); })]).then(function (res) {
        if (!/<(!doctype\s+html|html|body)\b/i.test(res[0])) throw new Error(file.name + " doesn\u2019t look like an HTML page.");
        if (res[0].indexOf("game.enc") !== -1 && /assets\/js\/vault\.js/.test(res[0])) throw new Error(file.name + " is already an encrypted-game loader, not the game itself.");
        return vault.encrypt(code, res[0]).then(function (bytes) {
          var loader = res[1].replace(/\{\{title\}\}/g, game.title).replace(/\{\{game_id\}\}/g, game.id)
            .replace(/\{\{brand\}\}/g, cfg.brand || "Key2Enable").replace(/\{\{hub\}\}/g, cfg.hubName || "Game Hub");
          save(new Blob([bytes], { type: "application/octet-stream" }), "game.enc");
          setTimeout(function () { save(new Blob([loader], { type: "text/html" }), "index.html"); }, 400);
          var folder = (game.url || game.id + "/").replace(/index\.html$/, "");
          out.textContent = "Done \u2014 two downloads: put game.enc and index.html into " + folder + " (replacing what is there) and commit.";
          toast("Encrypted " + game.title);
        });
      }).catch(function (err) { out.textContent = "Couldn\u2019t encrypt: " + (err && err.message || err); });
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
