/* Key2Enable Game Hub — motion layer.
   Restrained product-motion touches, all off under prefers-reduced-motion:
   - .reveal sections/cards rise + fade in as they scroll into view
   - game cards tilt toward the cursor with a soft light sheen
   - hero doodles drift gently with the pointer */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveal ---------- */
  function markReveal() {
    var items = [];
    var heroBits = document.querySelectorAll(".hero .eyebrow, .hero__title, .hero__lead, .hero__actions, .sponsor");
    heroBits.forEach(function (n, i) { items.push({ el: n, d: i * 70 }); });
    var head = document.querySelector(".games .section-head");
    if (head) items.push({ el: head, d: 0 });
    document.querySelectorAll(".game-card").forEach(function (n, i) { items.push({ el: n, d: 60 + i * 70 }); });
    document.querySelectorAll(".steps li").forEach(function (n, i) { items.push({ el: n, d: i * 70 }); });
    document.querySelectorAll(".join .section-head, .join__card, .share").forEach(function (n, i) { items.push({ el: n, d: i * 80 }); });

    items.forEach(function (it) {
      it.el.classList.add("reveal");
      it.el.style.setProperty("--rd", it.d + "ms");
      it.el.style.animation = "none"; // reveal takes over from card-in etc.
    });
    return items.map(function (it) { return it.el; });
  }

  if (!reduced && "IntersectionObserver" in window) {
    var els = markReveal();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    // cards render before this script runs; anything still hidden after 1.6s (e.g. no scroll) is shown anyway
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-in"); }); }, 1600);
  }

  /* ---------- pointer tilt + sheen ----------
     Enabled per-event: only reacts to mouse/pen, so touch taps never tilt
     and desktops work even when the pointer:fine media query is missing. */
  if (!reduced) {
    var TILT = 5; // degrees, max
    var mouse = function (e) { return e.pointerType === "mouse" || e.pointerType === "pen" || !e.pointerType; };
    document.querySelectorAll(".game-card, .sponsor").forEach(function (card) {
      card.classList.add("tiltable");
      var raf = 0, ex = 0, ey = 0;
      card.addEventListener("pointermove", function (e) {
        if (!mouse(e)) return;
        ex = e.clientX; ey = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = card.getBoundingClientRect();
          var fx = (ex - r.left) / r.width;   // 0..1
          var fy = (ey - r.top) / r.height;   // 0..1
          card.style.setProperty("--ry", ((fx - 0.5) * TILT).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((0.5 - fy) * TILT).toFixed(2) + "deg");
          card.style.setProperty("--mx", (fx * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (fy * 100).toFixed(1) + "%");
        });
      });
      card.addEventListener("pointerleave", function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    /* ---------- hero doodle parallax ---------- */
    var hero = document.querySelector(".hero");
    var doodles = document.querySelectorAll(".hero__doodles .doodle");
    if (hero && doodles.length) {
      var hraf = 0;
      hero.addEventListener("pointermove", function (e) {
        if (!mouse(e) || hraf) return;
        hraf = requestAnimationFrame(function () {
          hraf = 0;
          var r = hero.getBoundingClientRect();
          var dx = (e.clientX - r.left) / r.width - 0.5;
          var dy = (e.clientY - r.top) / r.height - 0.5;
          doodles.forEach(function (d, i) {
            var depth = 8 + i * 5; // px, each doodle drifts a little differently
            d.style.translate = (dx * depth).toFixed(1) + "px " + (dy * depth).toFixed(1) + "px";
          });
        });
      });
    }
  }
})();
