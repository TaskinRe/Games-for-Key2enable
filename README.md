# Key2Enable Game Hub

A small, static website that presents six training games as one cohesive
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

## Authorship

**The first five games (Keyboard Grove, Floral Artistry, Sky Catch, Robot
Workshop, Typing Teacher) were designed and built by rt2609 (TaskinRe).**
Devin's role for those was limited to deploying them to this hub and
encrypting the game files (the hub site, access-code gate and encryption
tooling in this repository). Game 06 · Note Quest (music theory for students
with cerebral palsy) was built by Devin at rt2609's request.

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
│   ├── js/vault.js         ← decrypts game.enc in the browser after unlock
│   ├── css/vault.css       ← styling for the tiny loader page of an encrypted game
│   ├── vault-loader.html   ← template for that loader page
│   ├── js/feedback.js      ← drop-in in-game Feedback panel (faces, text, voice-to-text)
│   ├── js/placeholder.js   ← fills the placeholder pages from site-config.js
│   ├── img/favicon.svg
│   └── vendor/qrcode.js    ← QR generator (qrcode-generator 1.4.4, MIT)
├── tools/encrypt-game.py   ← command-line alternative to Trainer tools → Encrypt a game file
├── keyboard-grove/         ← Game 01 · Keyboard Grove (live, encrypted: index.html loader + game.enc)
├── floral artistry/        ← Game 02 · Floral Artistry (live, encrypted)
├── game-03/                ← Game 03 · Sky Catch (live, encrypted)
├── game-04/                ← Game 04 · Robot Workshop (live, encrypted)
├── game-05/                ← Game 05 · Typing Teacher (live, encrypted)
└── game-06/                ← Game 06 · Note Quest (live, encrypted)
```

Each game folder is independent: it has its own URL and is not bundled with
the others.

## The six games

| # | Folder              | Title           | Status      | URL |
|---|---------------------|-----------------|-------------|-----|
| 1 | `keyboard-grove/`   | Keyboard Grove  | live        | `https://taskinre.github.io/Games-for-Key2enable/keyboard-grove/` |
| 2 | `floral artistry/`  | Floral Artistry | live        | `https://taskinre.github.io/Games-for-Key2enable/floral%20artistry/` |
| 3 | `game-03/`          | Sky Catch       | live        | `https://taskinre.github.io/Games-for-Key2enable/game-03/` |
| 4 | `game-04/`          | Robot Workshop  | live        | `https://taskinre.github.io/Games-for-Key2enable/game-04/` |
| 5 | `game-05/`          | Typing Teacher  | live        | `https://taskinre.github.io/Games-for-Key2enable/game-05/` |
| 6 | `game-06/`          | Note Quest      | live        | `https://taskinre.github.io/Games-for-Key2enable/game-06/` |

The live games are single self-contained HTML files; the only changes made to
them are the `<script>` lines that add the lock, the "← Back to Game Hub"
button and the Feedback panel. They are then **stored encrypted** (see
[Encrypted game files](#encrypted-game-files-source-protection)) — the
`index.html` you see in a live game's folder is just a small loader.

### Game 06 · Note Quest (music theory)

Note Quest teaches real music — not just a game with musical sound effects —
and is designed for students with cerebral palsy:

- **Piano** — eight big keys (C to high C) with letter + solfège names, the
  note shown on a treble-clef staff as you play, "play the scale", and a
  "find the note" practice.
- **Read the staff** — line notes (E G B D F), space notes (F A C E), then
  all notes; mnemonics as hints; every note can be heard.
- **Rhythm** — whole / half / quarter / eighth notes and how many beats they
  last; "fill the 4/4 bar" problems.
- **Listen (ear training)** — higher or lower, same / step / skip, and
  happy (major) or sad (minor) chords.
- **Play a song** — Hot Cross Buns, Mary Had a Little Lamb, Twinkle Twinkle,
  London Bridge, Jingle Bells, Ode to Joy — one note at a time with the next
  key glowing, lyrics and staff following along. Wrong keys are never
  penalised; there are no timers anywhere in the game.

Accessible input: number keys `1`–`8` press piano keys / answers, `Space` or
`Enter` activates, arrow keys move between buttons, `Esc` goes back, `R`
repeats the sound. The ⚙ Settings panel offers 2/3/4 answers per question,
**switch scanning** (slow / medium / fast, one switch = `Space`/`Enter`),
**hover-to-select** (1 s / 2 s dwell), a **repeat-key guard** against
unintended double presses, larger text, high contrast, reduced animation and
**spoken prompts**. Settings are remembered in the browser. All audio is
synthesised with the Web Audio API, so no sound files are needed.

Like the other games, only the encrypted `game-06/game.enc` and its loader
are published; to change the game, edit the plain HTML source and re-encrypt
it with the game's code: `python3 tools/encrypt-game.py game-06 <CODE> path/to/note-quest.html`.

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
4. Encrypt it (so the source is not readable) — see
   [Encrypted game files](#encrypted-game-files-source-protection). Skipping
   this step still works; the game is then only locked, not encrypted.

### Option B — the game is hosted in another GitHub Pages repo

1. In `site-config.js` change that game's `url` to the full address, e.g.
   `url: "https://username.github.io/other-repo/"`, and set `ready: true`.
2. Optionally add a link back to the hub inside that game.

The `game-0X/` folder can stay as a placeholder or be deleted.

---

## Game codes & unlock QR codes (access control)

The hub itself needs no code — put its link / QR code on the first slide.
Every game, however, opens on a **"… is locked"** screen until it has been
unlocked on that laptop. There is one code per game, in the form `WORD-1234`.
The codes are **not written down anywhere in this repository** — since the
game files are encrypted with them, a published code would give away the
game. The trainer keeps them; if one is lost, set a new one (see *Changing a
code*) and re-encrypt that game.

**Trainer PIN.** *Trainer tools* on the hub is behind a PIN — starter PIN
`TRAIN-4820`. Entering it opens the tools on that laptop for `access.hours`
(**Close Trainer tools** ends it early). Participants never need it. To
change it, pick *Trainer PIN* in *Change a game code* → **Get hash** and paste
the line over `access.trainerPin` in `site-config.js` (`""` removes the PIN).

**Workshop flow**

1. On the hub open *Trainer tools*, enter the trainer PIN,
   type a game's code in its box and press **Unlock QR**. You get the game's
   unlock link — `…/keyboard-grove/?key=WORD-1234` — as a QR code
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
workshop) — except encrypted games, which always need their code to be
decrypted; to publish one of those openly, replace its loader + `game.enc`
with the plain HTML.

> **Limits.** The lock itself is browser-side. Codes are hashed so they can't
> be read from the files, and the game files are encrypted with those codes
> (next section), so without a code there is nothing readable to reach — but
> someone *with* the code can of course still save the game once it is open in
> their browser.

---

## Encrypted game files (source protection)

GitHub Pages is a public website and this repository is public, so anyone
could otherwise read a game's HTML with *View source* or on GitHub. To prevent
that, each live game is stored as two files:

- `game.enc` — the real game page, encrypted with the game's code
  (PBKDF2-SHA256 · 200 000 rounds → AES-256-GCM; format `K2EV1 | salt 16 | iv 12 | ciphertext`).
- `index.html` — a ~1 KB loader: it shows the normal lock screen, and once the
  game is unlocked it fetches `game.enc`, decrypts it in the browser
  (WebCrypto) with the code that was entered / came from the QR link, and
  swaps the decrypted page in. Participants notice nothing; the 48 h unlock
  and `?key=` links work exactly as before.

The code is the key, so **the code in `access.keys` and the code the file was
encrypted with must match**. Both tools below refuse to encrypt with a code
that doesn't match the current hash. If you change a game's code, re-encrypt
that game with the new code in the same commit.

**Encrypting a (new or updated) game file — in the browser**

1. Hub → Trainer tools → *Encrypt a game file*: pick the game, type its code,
   choose the game's HTML file (with the lock / hub-nav / feedback script lines
   from *Adding the real games* already in it), press **Encrypt**.
2. Two files download: `game.enc` and `index.html`. Put both into that game's
   folder in the repo (replacing what is there) and commit.

**— or on the command line** (needs Python 3 and `pip install cryptography`):

```bash
python3 tools/encrypt-game.py game-04 WORD-1234 ~/Downloads/robot.html
```

Keep the plain HTML files somewhere safe (not in the repo) — they are the
editable originals; the repo only holds the encrypted versions.

If a game shows *"This code doesn't open the game file"*, the hash in
`site-config.js` and `game.enc` were made with different codes: re-encrypt.

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
- all six cards open their own page (`/keyboard-grove/`, `/floral artistry/`,
  `/game-03/` … `/game-06/`) on its lock screen; a wrong code is refused,
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
Game 06  https://taskinre.github.io/Games-for-Key2enable/game-06/
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

Games: designed and built by rt2609 (TaskinRe) — see [Authorship](#authorship).
Deployment and encryption only: Devin.
QR codes: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
by Kazuhiko Arase (MIT), vendored in `assets/vendor/qrcode.js`.
Fonts: Plus Jakarta Sans and Inter via Google Fonts (falls back to system fonts offline).
