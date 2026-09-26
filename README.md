# Key2Enable Game Hub

A small, static website that presents five training games as one cohesive
"Game Hub". Built for a live workshop: participants open the hub on their
laptops (or scan a QR code), pick a game, play it on its own page, and come
back for the next one.

- Pure HTML / CSS / JavaScript — no build step, no backend, no login.
- Hosted on GitHub Pages; works from any repository sub-path.
- Everything editable lives in **one file**: `site-config.js`.
- Opens with a short hand-drawn "pencil sketch" intro (skippable, once per
  session, honours `prefers-reduced-motion`).

---

## Project structure

```
/
├── index.html              ← the Game Hub (landing page)
├── site-config.js          ← ★ edit this: titles, descriptions, links, Today's Activity
├── README.md
├── assets/
│   ├── css/hub.css         ← hub styling
│   ├── css/placeholder.css ← styling for the placeholder game pages
│   ├── js/hub.js           ← renders cards, copy-link, QR codes
│   ├── js/intro.js         ← pencil-sketch intro animation
│   ├── js/hub-nav.js       ← drop-in "← Back to Game Hub" button for any game
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
2. Give the game a way back to the hub. Easiest: add this one line before
   `</body>` in the game's `index.html` (it injects a small fixed
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

### Today's Activity

```js
todaysActivity: "game-01",   // any game id, or null to hide the banner
```

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

The site is static (no server), so a page cannot email anything by itself.
Three channels are available, and they can be combined:

* **Email (configured: `rt2609@nyu.edu`).** After sending, the participant sees
  a highlighted **Email it to the trainer** button; it opens their mail app with
  the rating, text, name and time pre-filled, so one more tap delivers it.
  Relies on the laptop having a mail app / webmail handler set up.
* **Per laptop (always on).** Every entry is saved in that laptop's browser
  (`localStorage`). Open the hub on that laptop → *Trainer tools* →
  *Participant feedback* → **Download CSV**. (**Clear** wipes the saved entries.)
* **Automatic collection in one place (recommended if you want zero extra taps).**
  Set an endpoint in `site-config.js` and every entry is POSTed there as JSON
  the moment it is sent — no mail app needed:

  ```js
  feedback: {
    enabled: true,
    endpoint: "https://formspree.io/f/xxxxxxx", // any URL that accepts a JSON POST
    email: "rt2609@nyu.edu",                     // "Email it to the trainer" button
    storageKey: "k2e-feedback"
  }
  ```

  Fastest setup: [Formspree](https://formspree.io) (free tier) → sign up with
  the trainer email → *New form* → copy the form's endpoint URL
  (`https://formspree.io/f/…`) into `endpoint`. Every submission is then
  emailed to that address and listed in the Formspree dashboard, exportable
  as CSV. A Google Apps Script web app or any small webhook works too.
  Fields sent: `ts, game, gameTitle, rating, ratingLabel, text, name, lang,
  page, ua`.

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
  `/game-03/` … `/game-05/`);
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
- **Per-game QR** — open *Trainer tools* (below the join box). Every game has
  its direct link, a Copy button, and a Download QR button.

Tip: put the hub QR on the first slide; participants scan once and then use
the cards to move between games.

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
Fonts: Fredoka and Nunito via Google Fonts (falls back to system fonts offline).
