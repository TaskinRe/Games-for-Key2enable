/* Key2Enable Game Hub — pencil-sketch intro.
   A pencil sketches a keyboard, hand-writes the "Key2Enable" wordmark,
   then "GAME HUB" pops in with confetti and the page fades to the hub.
   Plays once per browser session (sessionStorage), replay via header button. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.intro) || {};
  var BRAND = (window.SITE_CONFIG && window.SITE_CONFIG.brand) || "Key2Enable";
  var SUB = ((window.SITE_CONFIG && window.SITE_CONFIG.hubName) || "Game Hub").toUpperCase();
  var DURATION = cfg.durationMs || 7200;
  var SEEN_KEY = "k2e-intro-seen";

  var root = document.getElementById("intro");
  var svg = root && root.querySelector(".intro__svg");
  var caption = document.getElementById("introCaption");
  var progress = root && root.querySelector(".intro__progress span");
  var skipBtn = document.getElementById("introSkip");
  if (!root || !svg) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var running = false, raf = 0, startTs = 0, onDoneCb = null;

  /* ---------------- helpers ---------------- */
  function mk(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }
  function circlePath(cx, cy, r) {
    return "M" + (cx - r) + " " + cy + " a" + r + " " + r + " 0 1 0 " + (2 * r) + " 0 a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0";
  }
  function roundRectPath(x, y, w, h, r) {
    return "M" + (x + r) + " " + y +
      " h" + (w - 2 * r) + " a" + r + " " + r + " 0 0 1 " + r + " " + r +
      " v" + (h - 2 * r) + " a" + r + " " + r + " 0 0 1 " + (-r) + " " + r +
      " h" + (-(w - 2 * r)) + " a" + r + " " + r + " 0 0 1 " + (-r) + " " + (-r) +
      " v" + (-(h - 2 * r)) + " a" + r + " " + r + " 0 0 1 " + r + " " + (-r) + " z";
  }
  var ease = function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; };

  /* ---------------- scene ---------------- */
  var scene = {};
  var KEY_COLORS = ["#F76C5E", "#F9B233", "#3FB8AF", "#6C5CE7", "#2ECC71", "#F76C5E", "#F9B233", "#3FB8AF", "#6C5CE7"];

  function buildScene() {
    while (svg.lastChild && svg.lastChild.tagName !== "title") svg.removeChild(svg.lastChild);
    scene = { paths: [], keys: [], letters: [], subLetters: [], confetti: [] };

    var defs = mk("defs", {});
    var f = mk("filter", { id: "sketchy", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
    mk("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: "7", result: "n" }, f);
    mk("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "2.4", xChannelSelector: "R", yChannelSelector: "G" }, f);

    /* --- keyboard sketch (paths are drawn in this order) --- */
    var kb = mk("g", { class: "keyboard", filter: "url(#sketchy)" });
    var X = 300, Y = 30, W = 300, H = 180;
    addPath(kb, roundRectPath(X, Y, W, H, 30), "sk");
    addPath(kb, "M" + (X + 22) + " " + (Y + H - 26) + " h" + (W - 44), "sk sk--thin");        // space-bar line
    var cols = [X + 75, X + 150, X + 225], rows = [Y + 46, Y + 92];
    rows.forEach(function (cy) {
      cols.forEach(function (cx) {
        var p = addPath(kb, circlePath(cx, cy, 18), "sk");
        p.style.fill = "transparent";
        scene.keys.push(p);
      });
    });
    [X + 75, X + 150, X + 225].forEach(function (cx) {
      var p = addPath(kb, circlePath(cx, Y + 138, 14), "sk sk--thin");
      p.style.fill = "transparent";
      scene.keys.push(p);
    });
    // cable
    addPath(kb, "M" + (X + W) + " " + (Y + 60) + " c 40 -10 40 40 80 30 s 30 -40 60 -20", "sk sk--thin");
    // sparks (accent)
    addPath(kb, "M" + (X - 34) + " " + (Y + 8) + " l -14 -14", "sk sk--accent");
    addPath(kb, "M" + (X - 22) + " " + (Y - 10) + " l -6 -18", "sk sk--sun");
    addPath(kb, "M" + (X - 48) + " " + (Y + 28) + " l -18 -4", "sk sk--teal");

    /* --- wordmark (one <text> per letter so each can be stroke-drawn) --- */
    var measure = mk("text", { class: "wordmark", x: 450, y: 340, "text-anchor": "middle", style: "visibility:hidden" });
    measure.textContent = BRAND;
    var wm = mk("g", { class: "wordmark" });
    scene.wordmarkGroup = wm;
    for (var i = 0; i < BRAND.length; i++) {
      var pos = measure.getStartPositionOfChar(i);
      var ext = measure.getExtentOfChar(i);
      var t = mk("text", { x: pos.x, y: 340, "stroke-dasharray": "900", "stroke-dashoffset": "900" }, wm);
      t.textContent = BRAND[i];
      if (/\d/.test(BRAND[i])) t.setAttribute("class", "two");
      scene.letters.push({ el: t, x0: ext.x, x1: ext.x + ext.width, yTop: ext.y, yBot: ext.y + ext.height });
    }
    svg.removeChild(measure);

    /* --- subtitle "GAME HUB" (pop-in letters) --- */
    var m2 = mk("text", { class: "subtitle", x: 450, y: 412, "text-anchor": "middle", style: "visibility:hidden" });
    m2.textContent = SUB;
    var sub = mk("g", { class: "subtitle" });
    for (var j = 0; j < SUB.length; j++) {
      if (SUB[j] === " ") continue;
      var p2 = m2.getStartPositionOfChar(j);
      var t2 = mk("text", { x: p2.x, y: 412, style: "opacity:0" }, sub);
      t2.textContent = SUB[j];
      t2.style.transformBox = "fill-box";
      t2.style.transformOrigin = "center";
      scene.subLetters.push(t2);
    }
    svg.removeChild(m2);

    /* --- confetti doodles --- */
    var conf = mk("g", { class: "confetti-layer" });
    var doodles = [
      ["star", 150, 300, "#F9B233"], ["ring", 780, 290, "#3FB8AF"], ["squig", 120, 400, "#F76C5E"],
      ["dot", 790, 380, "#6C5CE7"], ["star", 700, 470, "#F76C5E"], ["ring", 190, 480, "#F9B233"],
      ["dot", 250, 250, "#3FB8AF"], ["squig", 760, 440, "#2ECC71"], ["dot", 640, 260, "#F9B233"]
    ];
    doodles.forEach(function (d) {
      var shape = d[0], x = d[1], y = d[2], c = d[3], e;
      if (shape === "star") e = mk("path", { d: starPath(x, y, 12), fill: c }, conf);
      else if (shape === "ring") e = mk("circle", { cx: x, cy: y, r: 9, fill: "none", stroke: c, "stroke-width": 3 }, conf);
      else if (shape === "dot") e = mk("circle", { cx: x, cy: y, r: 6, fill: c }, conf);
      else e = mk("path", { d: "M" + (x - 16) + " " + y + " q 8 -12 16 0 t 16 0", fill: "none", stroke: c, "stroke-width": 3, "stroke-linecap": "round" }, conf);
      e.setAttribute("class", "confetti");
      e.style.transformBox = "fill-box";
      e.style.transformOrigin = "center";
      scene.confetti.push(e);
    });

    /* --- pencil (tip at 0,0) --- */
    var pen = mk("g", { class: "pencil", style: "opacity:0" });
    var body = mk("g", { transform: "rotate(32)" }, pen);
    mk("ellipse", { cx: 8, cy: 4, rx: 10, ry: 3, fill: "rgba(35,50,74,.12)" }, body);
    mk("path", { d: "M0 0 L-7 -18 L7 -18 Z", fill: "#23324A" }, body);               // graphite tip
    mk("path", { d: "M-7 -18 L7 -18 L9 -34 L-9 -34 Z", fill: "#F3D9B1" }, body);    // wood
    mk("rect", { x: -9, y: -118, width: 18, height: 84, fill: "#F9B233" }, body);    // barrel
    mk("rect", { x: -3, y: -118, width: 6, height: 84, fill: "rgba(255,255,255,.35)" }, body);
    mk("rect", { x: -9, y: -126, width: 18, height: 8, fill: "#C9CED6" }, body);     // ferrule
    mk("rect", { x: -9, y: -140, width: 18, height: 14, rx: 3, fill: "#F48FB1" }, body); // eraser
    scene.pencil = pen;

    // precompute path lengths
    var total = 0;
    scene.paths.forEach(function (p) { p.len = p.el.getTotalLength(); total += p.len; });
    scene.totalLen = total;
  }

  function addPath(parent, d, cls) {
    var p = mk("path", { d: d, class: cls }, parent);
    scene.paths.push({ el: p });
    return p;
  }
  function starPath(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      pts.push((cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return "M" + pts.join(" L") + " Z";
  }

  /* ---------------- timeline (fractions of DURATION) ---------------- */
  var T = {
    sketch0: 0.04, sketch1: 0.34,   // pencil draws the keyboard
    write0: 0.36, write1: 0.60,     // pencil writes the wordmark
    fill: 0.61,                     // wordmark fills in
    sub0: 0.63, sub1: 0.74,         // GAME HUB pops
    confetti0: 0.66, confetti1: 0.80,
    keys0: 0.70,                    // keys light up
    caption: 0.74,
    leave: 0.995
  };
  var fired = {};
  function once(key, fn) { if (!fired[key]) { fired[key] = true; fn(); } }

  function movePencil(x, y, visible) {
    scene.pencil.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
    scene.pencil.style.opacity = visible ? 1 : 0;
  }

  function frame(ts) {
    if (!running) return;
    if (!startTs) startTs = ts;
    var t = Math.min(1, (ts - startTs) / DURATION);
    progress.style.width = (t * 100).toFixed(2) + "%";

    /* 1. sketch keyboard */
    if (t >= T.sketch0 && t <= T.sketch1) {
      var s = ease((t - T.sketch0) / (T.sketch1 - T.sketch0));
      var target = s * scene.totalLen, acc = 0;
      for (var i = 0; i < scene.paths.length; i++) {
        var p = scene.paths[i];
        var local = Math.max(0, Math.min(p.len, target - acc));
        p.el.style.strokeDasharray = p.len;
        p.el.style.strokeDashoffset = p.len - local;
        if (local > 0 && local < p.len) {
          var pt = p.el.getPointAtLength(local);
          movePencil(pt.x, pt.y, true);
        }
        acc += p.len;
      }
    } else if (t > T.sketch1) {
      once("sketchDone", function () {
        scene.paths.forEach(function (p) { p.el.style.strokeDashoffset = 0; });
      });
    }

    /* 2. write wordmark */
    if (t >= T.write0 && t <= T.write1) {
      var w = (t - T.write0) / (T.write1 - T.write0);
      var n = scene.letters.length, per = 1 / n;
      scene.letters.forEach(function (L, idx) {
        var lp = Math.max(0, Math.min(1, (w - idx * per) / per));
        L.el.setAttribute("stroke-dashoffset", (900 * (1 - lp)).toFixed(1));
        if (lp > 0 && lp < 1) {
          var x = L.x0 + (L.x1 - L.x0) * lp;
          var y = L.yBot - 8 - Math.abs(Math.sin(lp * Math.PI * 2.5)) * (L.yBot - L.yTop) * 0.7;
          movePencil(x, y, true);
        }
      });
    } else if (t > T.write1) {
      once("writeDone", function () {
        scene.letters.forEach(function (L) { L.el.setAttribute("stroke-dashoffset", "0"); });
        scene.pencil.style.opacity = 0;
      });
    }

    if (t >= T.fill) once("fill", function () { scene.wordmarkGroup.classList.add("is-filled"); });

    /* 3. subtitle pop */
    if (t >= T.sub0) {
      var sp = Math.min(1, (t - T.sub0) / (T.sub1 - T.sub0));
      var count = Math.floor(sp * scene.subLetters.length + 0.0001);
      for (var k = 0; k < count && k < scene.subLetters.length; k++) {
        if (!scene.subLetters[k].classList.contains("pop")) scene.subLetters[k].classList.add("pop");
      }
      if (sp >= 1) scene.subLetters.forEach(function (l) { l.classList.add("pop"); });
    }

    /* 4. confetti */
    if (t >= T.confetti0) {
      var cp = Math.min(1, (t - T.confetti0) / (T.confetti1 - T.confetti0));
      var cc = Math.ceil(cp * scene.confetti.length);
      for (var c = 0; c < cc; c++) scene.confetti[c].classList.add("pop");
    }

    /* 5. keys light up + wobble */
    if (t >= T.keys0) {
      var kp = Math.min(1, (t - T.keys0) / 0.12);
      var kc = Math.ceil(kp * scene.keys.length);
      for (var q = 0; q < kc; q++) {
        var key = scene.keys[q];
        if (key.style.fill === "transparent") {
          key.style.fill = KEY_COLORS[q % KEY_COLORS.length];
          key.style.fillOpacity = ".85";
        }
      }
      once("wobble", function () { svg.querySelector(".keyboard").classList.add("wobble"); });
    }

    if (t >= T.caption) once("caption", function () {
      caption.textContent = "Five games · one hub · let's play!";
      caption.classList.add("show");
    });

    if (t >= T.leave) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  /* ---------------- control ---------------- */
  function play(onDone) {
    if (running) return;
    onDoneCb = onDone || null;
    fired = {};
    startTs = 0;
    root.hidden = false;
    root.classList.remove("is-leaving");
    document.body.classList.add("intro-active");
    buildScene();
    caption.textContent = "";
    caption.classList.remove("show");
    progress.style.width = "0%";
    running = true;
    skipBtn.focus({ preventScroll: true });

    if (reduced) {
      // Static version: show the finished sketch briefly, then continue.
      scene.paths.forEach(function (p) { p.el.style.strokeDasharray = "none"; });
      scene.letters.forEach(function (L) { L.el.setAttribute("stroke-dashoffset", "0"); });
      scene.wordmarkGroup.classList.add("is-filled");
      scene.subLetters.forEach(function (l) { l.style.opacity = 1; });
      scene.confetti.forEach(function (e) { e.style.opacity = 1; });
      scene.keys.forEach(function (k, i) { k.style.fill = KEY_COLORS[i % KEY_COLORS.length]; k.style.fillOpacity = ".85"; });
      caption.textContent = "Five games · one hub · let's play!";
      caption.classList.add("show");
      setTimeout(finish, 1400);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) { /* private mode */ }
    root.classList.add("is-leaving");
    document.body.classList.remove("intro-active");
    setTimeout(function () {
      root.hidden = true;
      root.classList.remove("is-leaving");
      if (onDoneCb) onDoneCb();
    }, 650);
  }

  skipBtn.addEventListener("click", finish);
  document.addEventListener("keydown", function (e) { if (running && e.key === "Escape") finish(); });

  window.HubIntro = { play: function () { window.scrollTo(0, 0); play(); }, skip: finish };

  /* ---------------- auto-play once per session ---------------- */
  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { /* ignore */ }
  var force = /[?&]intro=1/.test(location.search);
  if (cfg.enabled !== false && (!seen || force)) {
    root.hidden = false;
    document.body.classList.add("intro-active");
    var start = function () { play(); };
    if (document.fonts && document.fonts.ready) {
      // wait (max 1.2 s) for the display font so the letters are measured correctly
      var done = false;
      var go = function () { if (!done) { done = true; start(); } };
      document.fonts.ready.then(go);
      setTimeout(go, 1200);
    } else {
      start();
    }
  }
})();
