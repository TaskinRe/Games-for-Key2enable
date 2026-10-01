/* =========================================================================
   Key2Enable Game Hub — SITE CONFIGURATION
   -------------------------------------------------------------------------
   This is the ONLY file you need to edit to change:
     • the hub title / tagline
     • game names, descriptions, what each game trains, difficulty, icon
     • where each game lives (folder or external URL)
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
  description: "Five short games. Pick one, scan its code, play.",
  /* Arabic versions of the texts above (the hub has an EN / عربي switch; any
     field left out falls back to the English one). */
  ar: {
    hubName: "مركز الألعاب",
    tagline: "ألعاب تدريبية تفاعلية",
    description: "خمس ألعاب قصيرة. اختر لعبة، امسح رمزها، والعب."
  },

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
                   files are dropped into its folder. Set to true when live.
     ar          : optional { title, description, trains } shown when the hub
                   is switched to Arabic (falls back to the English fields). */
  games: [
    {
      id: "game-01",
      url: "keyboard-grove/",
      title: "Keyboard Grove",
      description: "Learn your Key-X buttons in a night-time grove, one short chapter at a time.",
      trains: ["Key-X buttons", "Getting started"],
      difficulty: 1,
      icon: "keyboard",
      ready: true,
      ar: {
        title: "بستان المفاتيح",
        description: "تعرّف على أزرار Key-X في بستان ليلي، فصلًا قصيرًا في كل مرة.",
        trains: ["أزرار Key-X", "البداية"]
      }
    },
    {
      id: "game-02",
      url: "floral artistry/",
      title: "Floral Artistry",
      description: "Design your own flower artwork in a calm night garden.",
      trains: ["Creativity", "Making choices"],
      difficulty: 1,
      icon: "star",
      ready: true,
      ar: {
        title: "فن الزهور",
        description: "صمّم لوحتك الزهرية الخاصة في حديقة ليلية هادئة.",
        trains: ["الإبداع", "اتخاذ القرارات"]
      }
    },
    {
      id: "game-03",
      url: "game-03/",
      title: "Sky Catch",
      description: "Catch the falling pictures with the matching number key, then replay the pattern from memory.",
      trains: ["Number keys", "Recognition"],
      difficulty: 2,
      icon: "target",
      ready: true,
      ar: {
        title: "امسك السماء",
        description: "التقط الصور المتساقطة بمفتاح الرقم المطابق، ثم أعد النمط من الذاكرة.",
        trains: ["مفاتيح الأرقام", "التعرّف"]
      }
    },
    {
      id: "game-04",
      url: "game-04/",
      title: "Robot Workshop",
      description: "Click the arrows to plan Byte the robot's route to the charging station, then run it.",
      trains: ["Mouse", "Planning"],
      difficulty: 2,
      icon: "robot",
      ready: true,
      ar: {
        title: "ورشة الروبوت",
        description: "انقر الأسهم لتخطيط مسار الروبوت «بايت» إلى محطة الشحن، ثم شغّله.",
        trains: ["الفأرة", "التخطيط"]
      }
    },
    {
      id: "game-05",
      url: "game-05/",
      title: "Typing Teacher",
      description: "Learn to type one letter at a time: travel the A-to-Z map, practise groups of letters, then build simple words.",
      trains: ["Letter keys", "Typing"],
      difficulty: 2,
      icon: "letters",
      ready: true,
      ar: {
        title: "معلّم الكتابة",
        description: "تعلّم الكتابة حرفًا حرفًا: اعبر خريطة الحروف، تدرّب على مجموعات الحروف، ثم كوّن كلمات بسيطة.",
        trains: ["مفاتيح الحروف", "الكتابة"]
      }
    }
  ],

  /* ---------- Per-game access codes ----------
     The hub is open to everyone; each game stays locked until the participant
     opens the instructor's QR link (<game url>?key=CODE) or types the code on
     the game's lock screen. Codes live here as SHA-256 hashes of the
     UPPERCASE code with spaces/dashes removed — never the code itself.
     To change a code: Trainer tools → "Change a game code" on the hub gives you
     the hash line to paste here. Changing a hash re-locks that game everywhere.
     hours : how long one unlock lasts on that laptop (0 = until the tab closes).
     trainerPin : hash of the PIN that opens Trainer tools on the hub (QR
                  generation, code changes, feedback export). Same hashing as
                  the game codes; "" leaves Trainer tools open to everyone. */
  access: {
    enabled: true,
    hours: 48,
    trainerPin: "ced0d88fe7826dd09f37a9b2147be5849bab92919e01ceb4ca9acab99611fc0f",
    keys: {
      "game-01": "b10d7a42d88651d56ca7ea2133fbdb50e621ef66132cbaeaf9d3705d39556efc",
      "game-02": "c07eda507983ecfdf2c7456605a63673221ab2295eca81b5c387b85c8e76a841",
      "game-03": "6ce251051c975512ed1355b9cda32fe98456efed079a80deed963f5942f34416",
      "game-04": "5c11fc3455e8442a809bb6c4c265d38741ae7333bea6e9fd650216e0353fcb29",
      "game-05": "15a0a5976d1629058a32ceeadb041aebab7e41f1ad3992638a7aa8b5ea0fc0b9"
    },
    storageKey: "k2e-access"
  },


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
