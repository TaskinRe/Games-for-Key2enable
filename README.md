# Key2Enable Game Hub

A small, static website that presents five training games as one cohesive
"Game Hub". Built for a live workshop: participants open the hub on their
laptops (or scan a QR code), pick a game, play it on its own page, and come
back for the next one.

- Pure HTML / CSS / JavaScript — no build step, no backend, no login.
- The hub is open; each game is locked until the participant scans that
  game's QR code (or types its code) from the instructor's slide.
- Hosted on GitHub Pages; works from any repository sub-path.
- Everything editable lives in **one file**: `site-config.js`.
- Opens with a short hand-drawn "pencil sketch" intro (skippable, once per
  session, honours `prefers-reduced-motion`).

---

## Project structure

```
/
├── index.html              ← the Game Hub (landing page)
├── site-config.js          ← ★ edit this: titles, descriptions, links
├── README.md
├── assets/
│   ├── css/hub.css         ← hub styling
│   ├── css/placeholder.css ← styling for the placeholder game pages
│   ├── js/hub.js           ← renders cards, copy-link, QR codes
│   ├── js/intro.js         ← pencil-sketch intro animation
│   ├── js/hub-nav.js       ← drop-in "← Back to Game Hub" button for any game
│   ├── js/gate.js          ← per-game lock screen (codes + unlock QR links)
│   ├── js/feedback.js      ← drop-in in-game Feedback panel (faces, text, voice-to-text)
│   ├── js/placeholder.js   ← fills the placeholder pages from site-config.js
│   ├── img/favicon.svg
│   └── vendor/qrcode.js    ← QR generator (qrcode-generator 1.4.4, MIT)
├── keyboard-grove/index.html   ← Game 01 · Keyboard Grove (live)
├── floral artistry/index.html  ← Game 02 · Floral Artistry (live)
├── game-03/index.html          ← Game 03 (placeholder)
├── game-04/index.html          ← Game 04 (placeholder)
└── game-05/index.html          ← Game 05 (placeholder)
```

Each game folder is independent: it has its own URL and is not bundled with
the others.

## The five games

| # | Folder              | Title           | Status      | URL |
|---|---------------------|-----------------|-------------|-----|
| 1 | `keyboard-grove/`   | Keyboard Grove  | live        | `https://taskinre.github.io/Games-for-Key2enable/keyboard-grove/` |
| 2 | `floral artistry/`  | Floral Artistry | live        | `https://taskinre.github.io/Games-for-Key2enable/floral%20artistry/` |
| 3 | `game-03/`          | Game 03         | placeholder | `https://taskinre.github.io/Games-for-Key2enable/game-03/` |
| 4 | `game-04/`          | Game 04         | placeholder | `https://taskinre.github.io/Games-for-Key2enable/game-04/` |
| 5 | `game-05/`          | Game 05         | placeholder | `https://taskinre.github.io/Games-for-Key2enable/game-05/` |

The two live games are single self-contained HTML files; the only changes made
to them are the `<script>` lines at the end that add the "← Back to Game Hub"
button (and, for Keyboard Grove, the Feedback panel). Titles, descriptions and "trains" lists for games 3–5 are temporary
labels — replace them in `site-config.js` when the games are known.

---

## Adding the real games

There are two ways to plug a game in. Both need only `site-config.js` to be
updated afterwards.

### Option A — the game lives in this repository

1. Copy the game's files into its folder, e.g. `game-03/` (or any folder name —
   just set `url` to match). The game's main page must be `index.html` so that
   `…/game-03/` opens it directly. Keep the game's own assets/scripts/CSS
   alongside — don't rewrite the game.
2. Lock it and give it a way back to the hub. Add these two lines as the
   **first** thing inside `<head>` (the lock screen must load before the game):

   ```html
   <script src="../site-config.js"></script>
   <script src="../assets/js/gate.js" data-game="game-03"></script>
   ```

   and this one line before `</body>` (it injects a small fixed
   "← Back to Game Hub" button):

   ```html
   <script src="../assets/js/hub-nav.js"></script>
   ```

   Options (all optional): `data-position="top-left|top-right|bottom-left|bottom-right"`,
   `data-theme="dark|light"`, `data-label="Back to hub"`, `data-href="../"`.
   If you'd rather use a plain link, `<a href="../">← Back to Game Hub</a>` works too.
3. In `site-config.js` set the game's `url`, `title`, `description`, `trains`,
   `difficulty`, `icon`, and set `ready: true`.

### Option B — the game is hosted in another GitHub Pages repo

1. In `site-config.js` change that game's `url` to the full address, e.g.
   `url: "https://username.github.io/other-repo/"`, and set `ready: true`.
2. Optionally add a link back to the hub inside that game.

The `game-0X/` folder can stay as a placeholder or be deleted.

---

## Game codes & unlock QR codes (access control)

The hub itself needs no code — put its link / QR code on the first slide.
Every game, however, opens on a **"… is locked"** screen until it has been
unlocked on that laptop. There is one code per game:

| Game | Code (change these!) |
|------|------|
| 01 Keyboard Grove  | `GROVE-2481` |
| 02 Floral Artistry | `BLOOM-7316` |
| 03 | `GAME3-5029` |
| 04 | `GAME4-8147` |
| 05 | `GAME5-3692` |

**Workshop flow**

1. On the hub open *Trainer tools → game codes, unlock QR codes & feedback*,
   type a game's code in its box and press **Unlock QR**. You get the game's
   unlock link — `…/keyboard-grove/?key=GROVE-2481` — as a QR code
   (**QR (PNG)** downloads a 1024 px version) plus the code in a yellow chip.
2. Put that QR code **and** the code on the slide for that game.
3. Participants scan the QR code (opens the game already unlocked) or, on a
   laptop, click the game on the hub and type the code. Case, spaces and
   dashes don't matter (`grove 2481` works).
4. The unlock is remembered on that laptop for `access.hours` (48 h by
   default; set `0` to re-lock when the tab closes). Unlocking one game does
   not unlock the others. The hub cards show a padlock / "Unlocked" badge.
5. **Lock here** (per game) and **Lock all games on this laptop** in Trainer
   tools clear those grants — handy on the presenter laptop.

**Changing a code.** Codes are never stored on the site — only SHA-256
fingerprints in `site-config.js → access.keys`. In Trainer tools →
*Change a game code*, pick the game, type the new code, press **Get hash** and
paste the resulting line over that game's entry:

```js
access: {
  enabled: true,
  hours: 48,
  keys: {
    "game-01": "b4e3…f1f8",   // ← paste the new hash here
    …
  }
}
```

The moment the new file is deployed, old QR codes and unlocks for that game
stop working. Set `enabled: false` to open everything (e.g. after the
workshop).

> **Limits.** This is a browser-side lock, meant to keep games out of
> circulation and off Google, not a security boundary: the site is static, so a
> determined person reading the source could still reach a game. Codes are
> hashed so they can't be read from the files, but a game's HTML itself is
> not encrypted.

---

## Participant feedback (in-game)

Keyboard Grove shows a floating **Feedback** button while playing and a
**Share feedback** button on the "Chapter done!" card. The panel has:

* five faces (Hard → Loved it; keys `1`–`5` also pick one),
* a text box, and a **Speak** button — browser speech-to-text types the words
  for the participant (English or Arabic, following the game's language),
* an optional name field.

While the panel is open, key presses do **not** reach the game, so typing a
`4` in the text box never triggers Key-X button 4.

### Where the feedback goes

Configured in `site-config.js`:

```js
feedback: {
  enabled: true,
  endpoint: "https://formspree.io/f/xgavnqva", // Formspree form — every entry is POSTed here
  email: "rt2609@nyu.edu",                     // fallback "Email it to the trainer" button
  storageKey: "k2e-feedback"
}
```

* **Formspree (primary).** The moment a participant presses *Send feedback* the
  entry is POSTed as JSON to the form above. Formspree emails it to the form
  owner and keeps it in the dashboard at https://formspree.io/forms (search,
  CSV export). Fields: `_subject` (e.g. "Keyboard Grove feedback — Great (4/5)
  — Sara"), `game, rating, message, name, lang, time, page, browser`.
  The free plan has a monthly submission cap — check the dashboard before a
  large workshop. Any other URL that accepts a JSON POST works the same way.
* **Email fallback.** If the POST fails (offline, cap reached), the participant
  sees a highlighted **Email it to the trainer** button — a `mailto:` with the
  rating, text, name and time pre-filled, one more tap to send from their mail
  app. (Shown also when `endpoint` is empty.)
* **Per laptop (always on).** Every entry is also saved in that laptop's
  browser (`localStorage`); the hub's *Trainer tools → Participant feedback*
  offers **Download CSV** and **Clear** for that browser. Entries that reached
  Formspree are marked `sent = yes` in the CSV.

Set `enabled: false` to hide the Feedback button everywhere.

### Voice input

Voice-to-text uses the browser's built-in Web Speech API — no keys or services
to set up. It works in **Chrome, Edge and Safari** (an internet connection is
needed); Firefox does not support it, so there the Speak button is hidden and
participants simply type. The first time, the browser asks for microphone
permission. Speech recognition needs a secure page (`https://` — GitHub Pages
is — or `localhost`).

### Adding the panel to another game

Add this before `</body>`, after the game's own scripts:

```html
<script src="../site-config.js"></script>
<script src="../assets/js/feedback.js" data-game="game-03"></script>
```

Optional: `data-done="#doneOverlay"` (a selector for the game's "finished"
element; a *Share feedback* button is added inside it and the floating button
nudges when it appears), `data-done-slot=".card"` (where inside it to put the
button), `data-done-class="active"` (class that marks it visible),
`data-title="My Game"`.

---

## Test locally

Open a terminal in the project folder and run one of:

```bash
python3 -m http.server 8000        # Python 3
# or
npx serve .                        # Node
```

Then open <http://localhost:8000/>. Check:

- the intro plays (add `?intro=1` to force it again, or use "Replay intro");
- all five cards open their own page (`/keyboard-grove/`, `/floral artistry/`,
  `/game-03/` … `/game-05/`) on its lock screen; a wrong code is refused,
  the game's code (or `?key=CODE` on the URL) unlocks only that game;
- "← Back to Game Hub" returns to the hub;
- "Copy link" shows "Link copied!";
- the "Join the activity" QR code renders and downloads.

Opening `index.html` directly from the file system also works for browsing,
but use a local server to test paths and QR codes properly.

---

## Deploy to GitHub Pages

This repository is already published with GitHub Pages from the `main` branch,
root folder (**Settings → Pages → Build and deployment → Deploy from a branch →
`main` / `/ (root)`**). Anything merged into `main` goes live within a minute
or two — no build step.

If you ever move the hub to a different repository, push the same files to its
`main` branch and enable Pages the same way; all links are relative so nothing
else needs changing.

### Final URLs

```
Hub      https://taskinre.github.io/Games-for-Key2enable/
Game 01  https://taskinre.github.io/Games-for-Key2enable/keyboard-grove/
Game 02  https://taskinre.github.io/Games-for-Key2enable/floral%20artistry/
Game 03  https://taskinre.github.io/Games-for-Key2enable/game-03/
Game 04  https://taskinre.github.io/Games-for-Key2enable/game-04/
Game 05  https://taskinre.github.io/Games-for-Key2enable/game-05/
```

All links in the site are relative, so the repository name never has to be
typed into the code.

---

## QR codes for the workshop

The hub generates QR codes **from whatever address it is opened at**, so they
are always correct for the deployed site — nothing to configure.

- **Hub QR** — on the hub, scroll to *Join the activity*. The QR and the short
  URL are shown there; **Download QR (PNG)** saves a print-ready image for a
  slide or a poster.
- **Per-game unlock QR** — open *Trainer tools* (below the join box), type
  the game's code and press **Unlock QR** (see *Game codes & unlock QR codes*
  above). Without a code the QR is the plain game link, which opens on the
  lock screen.

Tip: hub QR on the first slide; then one slide per game with that game's
unlock QR and its code printed underneath for laptop users.

---

## Accessibility notes

- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) and a
  skip-to-content link.
- Everything reachable by keyboard with visible focus rings; nothing relies
  on hover.
- Intro can be skipped with the button or `Esc`; with
  `prefers-reduced-motion` the sketch is shown already finished and fades
  quickly.
- Copy / QR actions announce their result in an `aria-live` toast.

## Credits

QR codes: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
by Kazuhiko Arase (MIT), vendored in `assets/vendor/qrcode.js`.
Fonts: Plus Jakarta Sans and Inter via Google Fonts (falls back to system fonts offline).
