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
    button.addEventListener("click", function () {
      copyText(text).then(function () {
        toast("Link copied!");
        button.classList.add("is-copied");
        var old = button.innerHTML;
        button.innerHTML = "";
        button.appendChild(icon("check"));
        button.appendChild(document.createTextNode(" Copied"));
        setTimeout(function () { button.classList.remove("is-copied"); button.innerHTML = old; }, 1600);
      }).catch(function () {
        window.prompt("Copy this link:", text);
      });
    });
    button.setAttribute("aria-label", "Copy link to " + label);
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

  /* ---------- Today's activity ---------- */
  var today = games.filter(function (g) { return g.id === cfg.todaysActivity; })[0];
  var todaySection = document.getElementById("today");
  if (today && todaySection) {
    todaySection.hidden = false;
    var idx = games.indexOf(today);
    var num = "Game " + pad(idx + 1);
    document.getElementById("todayGame").textContent = today.title.indexOf(num) === 0 ? today.title : num + " — " + today.title;
    document.getElementById("todayDesc").textContent = today.description || "";
    document.getElementById("todayLink").href = gameUrl(today);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

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

    var play = el("a", { class: "btn btn--primary", href: url, "aria-describedby": titleId }, [icon("play"), document.createTextNode(" Play Now")]);
    var copy = el("button", { type: "button", class: "btn btn--ghost btn--copy" }, [icon("link"), document.createTextNode(" Copy link")]);
    wireCopy(copy, url, game.title);

    var card = el("li", { class: "game-card", style: "--c:" + accent }, [
      el("div", { class: "game-card__top" }, [
        el("span", { class: "game-card__icon", "aria-hidden": "true" }, [icon(game.icon || "star", "")]),
        el("span", { class: "game-card__num", text: "GAME " + pad(i + 1) })
      ]),
      el("h3", { id: titleId, text: game.title }),
      el("p", { class: "game-card__desc", text: game.description || "" }),
      trains,
      el("div", { class: "game-card__meta" }, [
        game.difficulty ? el("span", { html: "Difficulty" }) : el("span"),
        game.ready === false ? el("span", { class: "badge badge--soon", text: "Coming soon" }) : el("span", { class: "badge", text: "Ready" })
      ]),
      el("div", { class: "game-card__actions" }, [play, copy])
    ]);
    if (game.difficulty) {
      var meta = card.querySelector(".game-card__meta span");
      meta.appendChild(dots);
      meta.setAttribute("aria-label", "Difficulty " + game.difficulty + " of 3");
    }
    grid.appendChild(card);
  });

  /* ---------- Join: hub URL + QR ---------- */
  var hubUrlEl = document.getElementById("hubUrl");
  hubUrlEl.textContent = HUB_URL.replace(/^https?:\/\//, "");
  wireCopy(document.getElementById("copyHubUrl"), HUB_URL, "the Game Hub");
  renderQr(document.getElementById("hubQrImg"), HUB_URL, 200, document.getElementById("hubQrDownload"), "game-hub-qr.png");

  /* ---------- Share list: per-game link + QR ---------- */
  var shareList = document.getElementById("shareList");
  games.forEach(function (game, i) {
    var url = gameUrl(game);
    var qrBox = el("div", { class: "qr__img", role: "img", "aria-label": "QR code for " + game.title });
    var dl = el("a", { class: "btn btn--ghost btn--sm", href: "#", text: "QR (PNG)" });
    var copy = el("button", { type: "button", class: "btn btn--ghost btn--sm btn--copy" }, [icon("link"), document.createTextNode(" Copy")]);
    wireCopy(copy, url, game.title);
    var item = el("li", { class: "share__item" }, [
      qrBox,
      el("div", {}, [
        el("h3", { text: "Game " + pad(i + 1) + " — " + game.title }),
        el("code", { text: url.replace(/^https?:\/\//, "") }),
        el("div", { class: "btn-row" }, [copy, dl, el("a", { class: "btn btn--ghost btn--sm", href: url, text: "Open" })])
      ])
    ]);
    shareList.appendChild(item);
    renderQr(qrBox, url, 84, dl, game.id + "-qr.png");
  });

  /* ---------- Intro replay ---------- */
  var replay = document.getElementById("replayIntro");
  if (replay) {
    replay.addEventListener("click", function () {
      if (window.HubIntro) window.HubIntro.play();
    });
  }
})();
