/* Fills a placeholder page with the game's title/description from site-config.js. */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var id = document.body.getAttribute("data-game");
  var games = cfg.games || [];
  var idx = -1;
  games.forEach(function (g, i) { if (g.id === id) idx = i; });
  if (idx < 0) return;
  var game = games[idx];
  var num = (idx + 1 < 10 ? "0" : "") + (idx + 1);
  var accent = (cfg.cardAccents || [])[idx % ((cfg.cardAccents || []).length || 1)];
  if (accent) document.documentElement.style.setProperty("--c", accent);
  document.title = "Game " + num + " — " + game.title + " · " + (cfg.brand || "") + " " + (cfg.hubName || "Game Hub");
  document.querySelectorAll("[data-num]").forEach(function (n) { n.textContent = num; });
  document.querySelectorAll("[data-title]").forEach(function (n) { n.textContent = game.title; });
  document.querySelectorAll("[data-folder]").forEach(function (n) { n.textContent = id + "/"; });
  if (game.description) document.querySelectorAll("[data-desc]").forEach(function (n) { n.textContent = game.description; });
})();
