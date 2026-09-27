/* Key2Enable Game Hub — "Back to Game Hub" button for game pages.
   ------------------------------------------------------------------
   Add ONE line inside any game's index.html (just before </body>):

     <script src="../assets/js/hub-nav.js"></script>

   It injects a small, fixed "← Back to Game Hub" pill in the top-left corner
   that links to the hub (one folder up). It never touches the game's own
   layout, styles or scripts.

   Options (optional data-attributes on the script tag):
     data-position="top-left" | "top-right" | "bottom-left" | "bottom-right"
     data-href="../"           custom link target
     data-label="← Back to Game Hub"
     data-theme="light" | "dark"   pill colours (default: dark) */
(function () {
  "use strict";
  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script"); return s[s.length - 1];
  })();
  var pos = (script && script.getAttribute("data-position")) || "top-left";
  var href = (script && script.getAttribute("data-href")) || "../";
  var label = (script && script.getAttribute("data-label")) || "\u2190 Back to Game Hub";
  var theme = (script && script.getAttribute("data-theme")) || "dark";

  var css = document.createElement("style");
  css.textContent =
    ".k2e-hub-nav-region{display:contents}" +
    ".k2e-hub-nav{position:fixed;z-index:2147483000;margin:14px;font:600 15px/1.1 'Fredoka','Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "text-decoration:none;padding:10px 16px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;" +
    "box-shadow:0 6px 18px rgba(0,0,0,.18);transition:transform .15s ease,opacity .2s ease;opacity:.92}" +
    ".k2e-hub-nav:hover,.k2e-hub-nav:focus-visible{transform:translateY(-2px);opacity:1}" +
    ".k2e-hub-nav:focus-visible{outline:3px solid #1F6FEB;outline-offset:3px}" +
    ".k2e-hub-nav--dark{background:#23324A;color:#fff}" +
    ".k2e-hub-nav--light{background:#fff;color:#23324A;border:2px solid #23324A}" +
    ".k2e-hub-nav--top-left{top:0;left:0}.k2e-hub-nav--top-right{top:0;right:0}" +
    ".k2e-hub-nav--bottom-left{bottom:0;left:0}.k2e-hub-nav--bottom-right{bottom:0;right:0}" +
    "@media (max-width:600px){.k2e-hub-nav{font-size:14px;padding:8px 13px;margin:10px}}";
  document.head.appendChild(css);

  var a = document.createElement("a");
  a.className = "k2e-hub-nav k2e-hub-nav--" + theme + " k2e-hub-nav--" + pos;
  a.href = href;
  a.textContent = label;
  a.setAttribute("aria-label", "Back to Game Hub");
  a.setAttribute("dir", "ltr");

  var nav = document.createElement("nav");
  nav.className = "k2e-hub-nav-region";
  nav.setAttribute("aria-label", "Game Hub");
  nav.appendChild(a);

  function mount() { document.body.appendChild(nav); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
