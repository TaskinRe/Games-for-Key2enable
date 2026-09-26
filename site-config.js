/* =========================================================================
   Key2Enable Game Hub — SITE CONFIGURATION
   -------------------------------------------------------------------------
   This is the ONLY file you need to edit to change:
     • the hub title / tagline
     • game names, descriptions, what each game trains, difficulty, icon
     • where each game lives (folder or external URL)
     • which game is "Today's Activity"
     • the colour theme
     • the intro animation
     • where in-game feedback is sent

   Everything in index.html reads from this file at load time.
   ========================================================================= */

window.SITE_CONFIG = {

  /* ---------- Hub identity ---------- */
  brand: "Key2Enable",
  hubName: "Game Hub",
  tagline: "Interactive Training Games",
  description:
    "Explore five hands-on activities built for the training session. " +
    "Pick a game, play it on your laptop, then come back here for the next one.",

  /* ---------- Today's Activity ----------
     Set to the `id` of the game to highlight, or null to hide the banner. */
  todaysActivity: "game-01",

  /* ---------- Intro animation ----------
     playIntro : true  → the pencil-sketch intro plays once per browser session
     durationMs: how long the intro runs before it hands off to the hub (a Skip
                 button is always shown). */
  intro: {
    enabled: true,
    durationMs: 7200
  },

  /* ---------- Games ----------
     id          : folder name (also used in URLs, e.g. ./game-01/)
     url         : where "Play Now" goes. Relative folder ("game-01/") or a full
                   URL ("https://username.github.io/other-repo/") both work.
                   If a game is hosted elsewhere, just paste its link here.
     title       : shown on the card
     description : one or two short sentences
     trains      : what the activity explores / practises (short list)
     difficulty  : 1, 2 or 3 (dots on the card) — or null to hide
     icon        : one of the built-in icons: "puzzle", "letters", "target",
                   "memory", "music", "keyboard", "star", "rocket"
     ready       : false → card shows a "Coming soon" badge until the game
                   files are dropped into its folder. Set to true when live. */
  games: [
    {
      id: "game-01",
      url: "keyboard-grove/",
      title: "Keyboard Grove",
      description: "Meet your Key-X buttons in a night-time grove and work through short chapters at your own pace.",
      trains: ["Key-X buttons", "Getting started"],
      difficulty: 1,
      icon: "keyboard",
      ready: true
    },
    {
      id: "game-02",
      url: "floral artistry/",
      title: "Floral Artistry",
      description: "Bloom & create — design your own flower artwork in a calm night garden.",
      trains: ["Creativity", "Making choices"],
      difficulty: 1,
      icon: "star",
      ready: true
    },
    {
      id: "game-03",
      url: "game-03/",
      title: "Game 03",
      description: "Placeholder for the third activity. Drop the game files into the game-03/ folder.",
      trains: ["Recall", "Sequencing"],
      difficulty: 2,
      icon: "memory",
      ready: false
    },
    {
      id: "game-04",
      url: "game-04/",
      title: "Game 04",
      description: "Placeholder for the fourth activity. Drop the game files into the game-04/ folder.",
      trains: ["Letters", "Word building"],
      difficulty: 2,
      icon: "letters",
      ready: false
    },
    {
      id: "game-05",
      url: "game-05/",
      title: "Game 05",
      description: "Placeholder for the fifth activity. Drop the game files into the game-05/ folder.",
      trains: ["Problem solving", "Putting it together"],
      difficulty: 3,
      icon: "puzzle",
      ready: false
    }
  ],

  /* ---------- In-game feedback ----------
     Games that include assets/js/feedback.js show a "Feedback" button with a
     face rating, a text box and voice-to-text (speak instead of typing).
     enabled   : false hides the button everywhere
     endpoint  : optional URL that accepts a JSON POST (e.g. a Formspree form
                 "https://formspree.io/f/xxxxxxx", or any small web hook).
                 Leave "" to keep feedback on each participant's device only.
     email     : optional trainer email — adds an "Email it to the trainer"
                 button after sending, which opens the participant's mail app.
     Feedback is always also saved in the browser (localStorage); the hub's
     Trainer tools can download it as CSV from that same browser. */
  feedback: {
    enabled: true,
    endpoint: "https://formspree.io/f/xgavnqva",
    email: "rt2609@nyu.edu",
    storageKey: "k2e-feedback"
  },

  /* ---------- Theme ----------
     Card accent colours are applied in order to the games above.
     All other colours are CSS variables at the top of assets/css/hub.css. */
  cardAccents: ["#F76C5E", "#F9B233", "#3FB8AF", "#6C5CE7", "#2ECC71"]
};
