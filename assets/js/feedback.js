/* Key2Enable Game Hub — in-game feedback widget (typed + voice).
   ------------------------------------------------------------------
   Add to any game's index.html, after the game's own scripts:

     <script src="../site-config.js"></script>
     <script src="../assets/js/feedback.js" data-game="game-01"></script>

   It injects a fixed "Feedback" button (bottom-right). Pressing it opens a
   dialog with: a 1–5 face rating, a text box, and a microphone button that
   transcribes speech into the text box (Web Speech API — Chrome / Edge /
   Safari). English and Arabic follow the page's <html lang>.

   Where feedback goes (see SITE_CONFIG.feedback in site-config.js):
     • always saved in this browser's localStorage (trainer export in the hub)
     • POSTed as JSON to `endpoint` if one is configured
     • "Email it" button if `email` is configured

   Options (data-attributes on the script tag):
     data-game="game-01"           id in SITE_CONFIG.games (title + id in records)
     data-title="My Game"          title override when SITE_CONFIG is absent
     data-done="#doneOverlay"      element that becomes .active when a round ends
     data-done-slot=".overlay-card"  where to add a "Share feedback" button inside it
     data-done-class="active"      class name that marks `data-done` as shown

   While the dialog is open every key press is kept inside it, so typing
   digits never triggers Key-X shortcuts in the game underneath. */
(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script"); return s[s.length - 1];
  })();
  function attr(n, d) { var v = script && script.getAttribute(n); return v == null ? d : v; }

  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.feedback) || {};
  if (cfg.enabled === false) return;

  var gameId = attr("data-game", "");
  var game = null;
  if (window.SITE_CONFIG && window.SITE_CONFIG.games) {
    window.SITE_CONFIG.games.forEach(function (g) { if (g.id === gameId) game = g; });
  }
  var gameTitle = attr("data-title", (game && game.title) || document.title || gameId || "this game");
  var STORAGE_KEY = cfg.storageKey || "k2e-feedback";
  var ENDPOINT = cfg.endpoint || "";
  var EMAIL = cfg.email || "";
  var MAX_STORED = 300;

  /* ---------- strings ---------- */
  var STR = {
    en: {
      fab: "Feedback",
      fabAria: "Give feedback about " + gameTitle,
      title: "How was " + gameTitle + "?",
      intro: "Tell us what you thought. You can type or just speak.",
      ratingLabel: "Pick a face",
      faces: ["Hard", "Okay", "Good", "Great", "Loved it"],
      textLabel: "Tell us more (optional)",
      placeholder: "What was fun? What was hard? Anything we should change?",
      speak: "Speak",
      stop: "Stop",
      listening: "Listening\u2026 speak now",
      voiceHint: "Press the microphone and talk — your words appear here.",
      noVoice: "Voice typing isn't available in this browser. Chrome or Edge on a laptop works best — you can still type.",
      micDenied: "The microphone is blocked. Allow it in the address bar and press Speak again.",
      micError: "Voice typing stopped. Press Speak to try again.",
      nameLabel: "Your name (optional)",
      send: "Send feedback",
      cancel: "Not now",
      need: "Pick a face or write / say something first.",
      sending: "Sending\u2026",
      thanksSaved: "Thank you! Your feedback is saved on this device.",
      thanksSent: "Thank you! Your feedback was sent.",
      sendFailed: "We couldn't reach the server, so your feedback is saved on this device instead.",
      copy: "Copy text",
      copied: "Copied!",
      emailIt: "Email it to the trainer",
      emailHint: "One more tap: this opens your mail app with the feedback ready to send.",
      close: "Close",
      done: "Share feedback",
      keysHint: "Keys 1–5 pick a face"
    },
    ar: {
      fab: "رأيك",
      fabAria: "شاركنا رأيك في " + gameTitle,
      title: "كيف كانت لعبة " + gameTitle + "؟",
      intro: "أخبرنا برأيك. يمكنك الكتابة أو التحدث فقط.",
      ratingLabel: "اختر وجهًا",
      faces: ["صعبة", "مقبولة", "جيدة", "رائعة", "أحببتها"],
      textLabel: "أخبرنا أكثر (اختياري)",
      placeholder: "ما الذي كان ممتعًا؟ ما الذي كان صعبًا؟ ما الذي يجب تغييره؟",
      speak: "تحدث",
      stop: "توقف",
      listening: "أستمع… تحدث الآن",
      voiceHint: "اضغط على الميكروفون وتحدث — ستظهر كلماتك هنا.",
      noVoice: "الكتابة الصوتية غير متاحة في هذا المتصفح. يعمل Chrome أو Edge على الحاسوب بشكل أفضل — يمكنك الكتابة.",
      micDenied: "الميكروفون محظور. اسمح به من شريط العنوان ثم اضغط تحدث مرة أخرى.",
      micError: "توقفت الكتابة الصوتية. اضغط تحدث للمحاولة مرة أخرى.",
      nameLabel: "اسمك (اختياري)",
      send: "إرسال الرأي",
      cancel: "ليس الآن",
      need: "اختر وجهًا أو اكتب / قل شيئًا أولًا.",
      sending: "جارٍ الإرسال…",
      thanksSaved: "شكرًا لك! تم حفظ رأيك على هذا الجهاز.",
      thanksSent: "شكرًا لك! تم إرسال رأيك.",
      emailHint: "ضغطة واحدة بعد: سيُفتح بريدك والرأي جاهز للإرسال.",
      sendFailed: "لم نتمكن من الوصول إلى الخادم، لذا تم حفظ رأيك على هذا الجهاز.",
      copy: "نسخ النص",
      copied: "تم النسخ!",
      emailIt: "أرسله بالبريد إلى المدرّب",
      close: "إغلاق",
      done: "شاركنا رأيك",
      keysHint: "المفاتيح 1–5 تختار وجهًا"
    }
  };
  /* Five faces drawn as SVG so they look the same on every laptop (no emoji font needed). */
  var FACE_COLORS = ["#E8A08F", "#F2C97D", "#CFE29A", "#8FD3A8", "#F9B233"];
  var FACE_MOUTHS = [
    "M15 30 q9 -6 18 0",                        /* frown */
    "M15 29 h18",                               /* flat */
    "M15 27 q9 6 18 0",                         /* smile */
    "M14 26 q10 12 20 0 z",                     /* grin */
    "M13 25 q11 15 22 0 z"                      /* big grin */
  ];
  function faceSvg(i, size) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 48 48"); s.setAttribute("width", size); s.setAttribute("height", size); s.setAttribute("aria-hidden", "true");
    var ns = "http://www.w3.org/2000/svg";
    var c = document.createElementNS(ns, "circle"); c.setAttribute("cx", 24); c.setAttribute("cy", 24); c.setAttribute("r", 21); c.setAttribute("fill", FACE_COLORS[i]); c.setAttribute("stroke", "#3b362f"); c.setAttribute("stroke-width", 2); s.appendChild(c);
    [16, 32].forEach(function (x) {
      var e = document.createElementNS(ns, "circle"); e.setAttribute("cx", x); e.setAttribute("cy", i === 4 ? 18 : 19); e.setAttribute("r", i === 4 ? 3.6 : 2.6); e.setAttribute("fill", "#3b362f"); s.appendChild(e);
      if (i === 4) { var st = document.createElementNS(ns, "path"); st.setAttribute("d", "M" + x + " 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z"); st.setAttribute("fill", "#fff"); st.setAttribute("opacity", ".9"); s.appendChild(st); }
    });
    if (i === 0) { var b1 = document.createElementNS(ns, "path"); b1.setAttribute("d", "M12 14 l8 2 M36 14 l-8 2"); b1.setAttribute("stroke", "#3b362f"); b1.setAttribute("stroke-width", 2); b1.setAttribute("stroke-linecap", "round"); s.appendChild(b1); }
    var m = document.createElementNS(ns, "path"); m.setAttribute("d", FACE_MOUTHS[i]); m.setAttribute("fill", i >= 3 ? "#3b362f" : "none"); m.setAttribute("stroke", "#3b362f"); m.setAttribute("stroke-width", 2.4); m.setAttribute("stroke-linecap", "round"); m.setAttribute("stroke-linejoin", "round"); s.appendChild(m);
    return s;
  }
  function lang() { return (document.documentElement.lang || "en").toLowerCase().indexOf("ar") === 0 ? "ar" : "en"; }
  function t(k) { return STR[lang()][k]; }

  /* ---------- styles ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".k2e-fb-fab{position:fixed;right:0;bottom:0;margin:14px;z-index:2147482999;display:inline-flex;align-items:center;gap:8px;" +
    "padding:10px 16px;border:0;border-radius:999px;background:#F76C5E;color:#fff;cursor:pointer;" +
    "font:600 15px/1.1 'Fredoka','Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.2);opacity:.94;transition:transform .15s ease,opacity .2s ease}" +
    "html[lang=ar] .k2e-fb-fab{font-family:'Readex Pro',Tahoma,Arial,sans-serif}" +
    ".k2e-fb-fab svg{width:20px;height:20px;flex:none}" +
    ".k2e-fb-fab:hover,.k2e-fb-fab:focus-visible{transform:translateY(-2px);opacity:1}" +
    ".k2e-fb-fab:focus-visible,.k2e-fb button:focus-visible,.k2e-fb textarea:focus-visible,.k2e-fb input:focus-visible,.k2e-fb a:focus-visible,.k2e-fb-done:focus-visible{outline:3px solid #1F6FEB;outline-offset:3px}" +
    ".k2e-fb-fab.is-nudge{animation:k2e-fb-nudge 1.1s ease 2}" +
    "@keyframes k2e-fb-nudge{0%,100%{transform:none}30%{transform:translateY(-6px) scale(1.05)}60%{transform:translateY(0) scale(1)}}" +
    ".k2e-fb-done{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:10px 18px;border-radius:999px;cursor:pointer;" +
    "border:2px solid var(--accent,#F76C5E);background:transparent;color:var(--ink,#23324A);font:inherit;font-weight:700;font-size:1rem}" +
    ".k2e-fb-done svg{width:18px;height:18px}" +
    ".k2e-fb-done:hover{background:var(--panel-soft,#FFF1DC)}" +
    ".k2e-fb{border:0;padding:0;margin:auto;background:transparent;max-width:min(560px,calc(100vw - 24px));width:100%;color:var(--ink,#23324A)}" +
    ".k2e-fb::backdrop{background:rgba(10,14,20,.6);backdrop-filter:blur(2px)}" +
    ".k2e-fb--fallback{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,14,20,.6);max-width:none;z-index:2147483001}" +
    ".k2e-fb__card{background:var(--panel,#fff);border-radius:22px;padding:24px 24px 20px;box-shadow:0 24px 60px rgba(0,0,0,.35);max-height:calc(100vh - 24px);overflow:auto;" +
    "font-family:inherit;line-height:1.45}" +
    ".k2e-fb__card h2{margin:0 0 6px;font-size:1.45rem;line-height:1.2}" +
    ".k2e-fb__intro{margin:0 0 18px;color:var(--ink-soft,#55627A)}" +
    ".k2e-fb__label{display:block;font-weight:700;margin:14px 0 8px}" +
    ".k2e-fb__faces{display:flex;gap:8px;flex-wrap:wrap}" +
    ".k2e-fb__face{flex:1 1 84px;min-height:78px;border:2px solid var(--panel-soft,#E8DCC8);border-radius:16px;background:var(--panel-soft,#FFF8EE);color:inherit;cursor:pointer;" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:inherit;font-size:.85rem;font-weight:600;padding:8px 4px;transition:transform .12s ease,border-color .12s ease}" +
    ".k2e-fb__face svg{display:block}" +
    ".k2e-fb__face:hover{transform:translateY(-2px)}" +
    ".k2e-fb__face[aria-pressed=true]{border-color:var(--accent,#F76C5E);box-shadow:0 0 0 3px var(--accent,#F76C5E) inset;transform:translateY(-2px)}" +
    ".k2e-fb__hint{margin:6px 0 0;font-size:.82rem;color:var(--ink-soft,#55627A)}" +
    ".k2e-fb__textwrap{position:relative}" +
    ".k2e-fb textarea{width:100%;box-sizing:border-box;min-height:120px;resize:vertical;border:2px solid var(--panel-soft,#E8DCC8);border-radius:14px;padding:12px 14px;" +
    "font:inherit;font-size:1.05rem;line-height:1.45;background:var(--panel-soft,#FFF);color:inherit}" +
    ".k2e-fb textarea.is-listening{border-color:#E0483B;box-shadow:0 0 0 3px rgba(224,72,59,.25)}" +
    ".k2e-fb__voice{display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap}" +
    ".k2e-fb__mic{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;" +
    "background:#2A7A5E;color:#fff;font:inherit;font-weight:700;font-size:1rem}" +
    ".k2e-fb__mic svg{width:20px;height:20px}" +
    ".k2e-fb__mic.is-on{background:#E0483B;animation:k2e-fb-pulse 1.2s ease-in-out infinite}" +
    "@keyframes k2e-fb-pulse{0%,100%{box-shadow:0 0 0 0 rgba(224,72,59,.55)}50%{box-shadow:0 0 0 10px rgba(224,72,59,0)}}" +
    ".k2e-fb__status{flex:1 1 200px;font-size:.92rem;color:var(--ink-soft,#55627A);margin:0}" +
    ".k2e-fb__status.is-error{color:inherit;font-weight:700}" +
    ".k2e-fb__status.is-error::before,.k2e-fb__msg:not(:empty)::before{content:'\\26A0\\FE0F ';}" +
    ".k2e-fb input[type=text]{width:100%;box-sizing:border-box;min-height:46px;border:2px solid var(--panel-soft,#E8DCC8);border-radius:12px;padding:8px 14px;font:inherit;font-size:1rem;background:var(--panel-soft,#FFF);color:inherit}" +
    ".k2e-fb__actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:20px}" +
    ".k2e-fb__btn{min-height:48px;padding:0 20px;border-radius:999px;border:2px solid transparent;cursor:pointer;font:inherit;font-weight:700;font-size:1rem}" +
    ".k2e-fb__btn--primary{background:#D8503F;color:#fff}" +
    ".k2e-fb__btn--ghost{background:transparent;border-color:var(--ink-soft,#55627A);color:inherit}" +
    ".k2e-fb__btn[disabled]{opacity:.6;cursor:default}" +
    ".k2e-fb__msg{margin:8px 0 0;min-height:1.2em;font-weight:700}" +
    ".k2e-fb__thanks{text-align:center;padding:12px 0 4px}" +
    ".k2e-fb__thanks .k2e-fb__big{display:flex;justify-content:center;margin-bottom:10px}.k2e-fb__thanks .k2e-fb__big>svg{width:72px;height:72px}" +
    ".k2e-fb__thanks p{font-size:1.1rem;margin:0 0 18px}" +
    ".k2e-fb__thanks .k2e-fb__actions{justify-content:center}" +
    "@media (max-width:600px){.k2e-fb-fab{font-size:14px;padding:8px 13px;margin:10px}.k2e-fb__card{padding:18px 16px 16px;border-radius:18px}.k2e-fb__face{flex-basis:30%;min-height:68px}.k2e-fb__face svg{width:30px;height:30px}}" +
    "@media (prefers-reduced-motion:reduce){.k2e-fb-fab.is-nudge,.k2e-fb__mic.is-on{animation:none}.k2e-fb__face,.k2e-fb-fab{transition:none}}";
  document.head.appendChild(css);

  /* ---------- helpers ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(path) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2.2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    s.setAttribute("aria-hidden", "true");
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", path); s.appendChild(p);
    return s;
  }
  var ICON_CHAT = "M21 12a8 8 0 01-8 8H8l-5 3 1.5-4.5A8 8 0 1121 12zM8 12h.01M12 12h.01M16 12h.01";
  var ICON_MIC = "M12 15a4 4 0 004-4V6a4 4 0 10-8 0v5a4 4 0 004 4zm7-4a7 7 0 01-14 0M12 18v4m-4 0h8";
  var ICON_STOP = "M7 7h10v10H7z";

  function readStore() {
    try { var v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function writeStore(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_STORED))); return true; } catch (e) { return false; }
  }

  /* ---------- floating button ---------- */
  var fab = el("button", { type: "button", class: "k2e-fb-fab" }, [svg(ICON_CHAT), el("span", { text: t("fab") })]);
  fab.setAttribute("aria-label", t("fabAria"));
  fab.addEventListener("click", function () { openDialog(fab); });

  /* ---------- dialog ---------- */
  var dlg = el("dialog", { class: "k2e-fb", "aria-labelledby": "k2eFbTitle" });
  var supportsDialog = typeof dlg.showModal === "function";
  var card = el("div", { class: "k2e-fb__card" });
  dlg.appendChild(card);

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var rating = 0, rec = null, listening = false, committed = "", opener = null;
  var ui = {};

  function buildForm() {
    card.innerHTML = "";
    rating = 0; committed = "";
    var L = lang();

    var faces = el("div", { class: "k2e-fb__faces", role: "group", "aria-label": t("ratingLabel") });
    ui.faceBtns = FACE_COLORS.map(function (_, i) {
      var b = el("button", { type: "button", class: "k2e-fb__face", "aria-pressed": "false", "data-value": String(i + 1) },
        [faceSvg(i, 36), el("span", { text: t("faces")[i] })]);
      b.addEventListener("click", function () { setRating(i + 1); });
      faces.appendChild(b);
      return b;
    });

    ui.text = el("textarea", { id: "k2eFbText", placeholder: t("placeholder"), rows: "4", lang: L, dir: "auto", autocomplete: "off" });
    ui.text.addEventListener("input", function () { if (!listening) committed = ui.text.value; });

    ui.mic = el("button", { type: "button", class: "k2e-fb__mic", "aria-pressed": "false" }, [svg(ICON_MIC), el("span", { text: t("speak") })]);
    ui.status = el("p", { class: "k2e-fb__status", role: "status", "aria-live": "polite", text: SR ? t("voiceHint") : t("noVoice") });
    if (SR) ui.mic.addEventListener("click", toggleListening); else ui.mic.hidden = true;

    ui.name = el("input", { type: "text", id: "k2eFbName", autocomplete: "name", lang: L, dir: "auto" });
    ui.msg = el("p", { class: "k2e-fb__msg", role: "alert" });
    ui.send = el("button", { type: "button", class: "k2e-fb__btn k2e-fb__btn--primary", text: t("send") });
    ui.cancel = el("button", { type: "button", class: "k2e-fb__btn k2e-fb__btn--ghost", text: t("cancel") });
    ui.send.addEventListener("click", submit);
    ui.cancel.addEventListener("click", closeDialog);

    card.appendChild(el("h2", { id: "k2eFbTitle", text: t("title") }));
    card.appendChild(el("p", { class: "k2e-fb__intro", text: t("intro") }));
    card.appendChild(el("span", { class: "k2e-fb__label", id: "k2eFbRatingLabel", text: t("ratingLabel") }));
    faces.setAttribute("aria-labelledby", "k2eFbRatingLabel");
    card.appendChild(faces);
    card.appendChild(el("p", { class: "k2e-fb__hint", text: t("keysHint") }));
    card.appendChild(el("label", { class: "k2e-fb__label", for: "k2eFbText", text: t("textLabel") }));
    card.appendChild(el("div", { class: "k2e-fb__textwrap" }, [ui.text]));
    card.appendChild(el("div", { class: "k2e-fb__voice" }, [ui.mic, ui.status]));
    card.appendChild(el("label", { class: "k2e-fb__label", for: "k2eFbName", text: t("nameLabel") }));
    card.appendChild(ui.name);
    card.appendChild(ui.msg);
    card.appendChild(el("div", { class: "k2e-fb__actions" }, [ui.cancel, ui.send]));
  }

  function setRating(v) {
    rating = v;
    ui.faceBtns.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i + 1 === v)); });
    ui.msg.textContent = "";
  }

  /* ---------- speech to text ---------- */
  function tidy(s) {
    s = s.replace(/\s+/g, " ").trim();
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function joinText(a, b) {
    if (!a) return b;
    if (!b) return a;
    var sep = /[\s\n]$/.test(a) ? "" : (/[.!?،؟]$/.test(a) ? " " : ". ");
    return a + sep + b;
  }
  function setStatus(msg, isError) {
    ui.status.textContent = msg;
    ui.status.classList.toggle("is-error", !!isError);
  }
  function toggleListening() { if (listening) stopListening(); else startListening(); }

  function startListening() {
    if (!SR) return;
    committed = ui.text.value;
    var r = new SR();
    r.lang = lang() === "ar" ? "ar-SA" : (navigator.language && /^en/i.test(navigator.language) ? navigator.language : "en-US");
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    var sessionFinal = "";
    r.onresult = function (e) {
      var interim = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) sessionFinal = joinText(sessionFinal, tidy(chunk));
        else interim += chunk;
      }
      var shown = joinText(committed, sessionFinal);
      if (interim) shown = joinText(shown, tidy(interim));
      ui.text.value = shown;
      ui.text.scrollTop = ui.text.scrollHeight;
    };
    r.onerror = function (e) {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        listening = false; setStatus(t("micDenied"), true); updateMicUi();
      } else if (e.error === "no-speech" || e.error === "aborted") {
        /* fall through to onend, which restarts while still listening */
      } else {
        listening = false; setStatus(t("micError"), true); updateMicUi();
      }
    };
    r.onend = function () {
      committed = joinText(committed, sessionFinal);
      sessionFinal = "";
      ui.text.value = committed;
      if (listening && rec === r) {
        try { r.start(); } catch (err) { listening = false; updateMicUi(); }
      } else if (rec === r) { rec = null; updateMicUi(); }
    };
    rec = r;
    try {
      r.start();
      listening = true;
      setStatus(t("listening"), false);
    } catch (err) {
      listening = false; setStatus(t("micError"), true);
    }
    updateMicUi();
  }
  function stopListening() {
    listening = false;
    if (rec) { try { rec.stop(); } catch (e) {} }
    setStatus(t("voiceHint"), false);
    updateMicUi();
    ui.text.focus();
  }
  function updateMicUi() {
    ui.mic.classList.toggle("is-on", listening);
    ui.mic.setAttribute("aria-pressed", String(listening));
    ui.mic.innerHTML = "";
    ui.mic.appendChild(svg(listening ? ICON_STOP : ICON_MIC));
    ui.mic.appendChild(el("span", { text: listening ? t("stop") : t("speak") }));
    ui.text.classList.toggle("is-listening", listening);
  }

  /* ---------- submit ---------- */
  function submit() {
    if (listening) stopListening();
    var text = ui.text.value.replace(/\s+/g, " ").trim();
    if (!rating && !text) { ui.msg.textContent = t("need"); ui.faceBtns[0].focus(); return; }
    var entry = {
      ts: new Date().toISOString(),
      game: gameId || gameTitle,
      gameTitle: gameTitle,
      rating: rating || null,
      ratingLabel: rating ? STR.en.faces[rating - 1] : "",
      text: text,
      name: ui.name.value.trim(),
      lang: lang(),
      page: location.href,
      ua: navigator.userAgent
    };
    var list = readStore(); list.push(entry); writeStore(list);

    if (!ENDPOINT) { showThanks(entry, "thanksSaved"); return; }
    ui.send.disabled = true; ui.send.textContent = t("sending");
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 8000);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(entry),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      var all = readStore();
      for (var i = all.length - 1; i >= 0; i--) { if (all[i].ts === entry.ts) { all[i].sent = true; break; } }
      writeStore(all);
      showThanks(entry, "thanksSent");
    }).catch(function () {
      showThanks(entry, "sendFailed");
    }).then(function () { if (timer) clearTimeout(timer); });
  }

  function summary(entry) {
    var lines = [gameTitle + " — " + (lang() === "ar" ? "رأي" : "feedback")];
    if (entry.rating) lines.push((lang() === "ar" ? "التقييم: " : "Rating: ") + entry.rating + "/5 (" + t("faces")[entry.rating - 1] + ")");
    if (entry.text) lines.push(entry.text);
    if (entry.name) lines.push("— " + entry.name);
    lines.push("", entry.ts.replace("T", " ").slice(0, 16) + " UTC · " + entry.lang);
    return lines.join("\n");
  }

  function showThanks(entry, key) {
    card.innerHTML = "";
    var actions = el("div", { class: "k2e-fb__actions" });
    var emailPrimary = !!EMAIL && key !== "thanksSent";
    if (EMAIL) {
      var mail = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(gameTitle + " feedback" + (entry.name ? " — " + entry.name : "")) + "&body=" + encodeURIComponent(summary(entry));
      actions.appendChild(el("a", { class: "k2e-fb__btn " + (emailPrimary ? "k2e-fb__btn--primary" : "k2e-fb__btn--ghost"), href: mail, text: t("emailIt"), style: "display:inline-flex;align-items:center;text-decoration:none" }));
    }
    var copyBtn = el("button", { type: "button", class: "k2e-fb__btn k2e-fb__btn--ghost", text: t("copy") });
    copyBtn.addEventListener("click", function () {
      var txt = summary(entry);
      var done = function () { copyBtn.textContent = t("copied"); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, function () {});
      else { var ta = el("textarea", { text: txt }); document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} document.body.removeChild(ta); }
    });
    actions.appendChild(copyBtn);
    var closeBtn = el("button", { type: "button", class: "k2e-fb__btn " + (emailPrimary ? "k2e-fb__btn--ghost" : "k2e-fb__btn--primary"), text: t("close") });
    closeBtn.addEventListener("click", closeDialog);
    actions.appendChild(closeBtn);
    var kids = [
      el("div", { class: "k2e-fb__big", "aria-hidden": "true" }, [entry.rating ? faceSvg(entry.rating - 1, 72) : svg(ICON_CHAT)]),
      el("h2", { id: "k2eFbTitle", text: t(key) })
    ];
    if (emailPrimary) kids.push(el("p", { text: t("emailHint") }));
    kids.push(actions);
    card.appendChild(el("div", { class: "k2e-fb__thanks" }, kids));
    (emailPrimary ? actions.firstChild : closeBtn).focus();
  }

  /* ---------- open / close, key isolation ---------- */
  function trapKeys(e) {
    if (!isOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeDialog(); return; }
    e.stopPropagation();
    var tag = (e.target && e.target.tagName || "").toLowerCase();
    if (tag !== "textarea" && tag !== "input" && ui.faceBtns && /^[1-5]$/.test(e.key)) {
      e.preventDefault(); setRating(+e.key); ui.faceBtns[+e.key - 1].focus();
    }
  }
  function swallow(e) { if (isOpen()) e.stopPropagation(); }
  function isOpen() { return dlg.hasAttribute("open"); }

  function openDialog(from) {
    if (isOpen()) return;
    opener = from || null;
    buildForm();
    if (supportsDialog) dlg.showModal(); else { dlg.classList.add("k2e-fb--fallback"); dlg.setAttribute("open", ""); }
    window.addEventListener("keydown", trapKeys, true);
    window.addEventListener("keyup", swallow, true);
    window.addEventListener("keypress", swallow, true);
    setTimeout(function () { ui.faceBtns[0].focus(); }, 30);
  }
  function closeDialog() {
    if (listening) stopListening();
    if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
    window.removeEventListener("keydown", trapKeys, true);
    window.removeEventListener("keyup", swallow, true);
    window.removeEventListener("keypress", swallow, true);
    if (supportsDialog) { if (dlg.open) dlg.close(); } else { dlg.removeAttribute("open"); dlg.classList.remove("k2e-fb--fallback"); }
    if (opener && document.contains(opener)) { try { opener.focus(); } catch (e) {} }
  }
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeDialog(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });

  /* ---------- "round done" hook: button inside the game's finish overlay ---------- */
  function watchDone() {
    var sel = attr("data-done", ""); if (!sel) return;
    var doneEl = document.querySelector(sel); if (!doneEl) return;
    var slotSel = attr("data-done-slot", ""), cls = attr("data-done-class", "active");
    var btn = el("button", { type: "button", class: "k2e-fb-done" }, [svg(ICON_CHAT), el("span", { text: t("done") })]);
    btn.addEventListener("click", function () { openDialog(btn); });
    var slot = (slotSel && doneEl.querySelector(slotSel)) || doneEl;
    slot.appendChild(btn);
    new MutationObserver(function () {
      if (doneEl.classList.contains(cls)) {
        btn.querySelector("span").textContent = t("done");
        fab.classList.remove("is-nudge"); void fab.offsetWidth; fab.classList.add("is-nudge");
      }
    }).observe(doneEl, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- follow the game's language switch ---------- */
  new MutationObserver(function () {
    fab.querySelector("span").textContent = t("fab");
    fab.setAttribute("aria-label", t("fabAria"));
    var d = document.querySelector(".k2e-fb-done span"); if (d) d.textContent = t("done");
    if (isOpen() && !listening) { var keep = ui.text ? ui.text.value : ""; var nm = ui.name ? ui.name.value : ""; var r = rating; buildForm(); ui.text.value = keep; committed = keep; ui.name.value = nm; if (r) setRating(r); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  function mount() {
    document.body.appendChild(fab);
    document.body.appendChild(dlg);
    watchDone();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  window.K2E_FEEDBACK = { open: function () { openDialog(fab); }, storageKey: STORAGE_KEY, entries: readStore };
})();
