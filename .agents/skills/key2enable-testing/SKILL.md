---
name: key2enable-live-testing
description: Browser testing of the static Key2Enable hub, independent games, sharing and accessibility.
---

# Environment
- Prefer the deployed GitHub Pages URL, preserving its repository subpath.
- No build, backend, login or application dependencies are needed.
- If Pages has not deployed, serve the checkout with Python's HTTP server and explicitly distinguish local results from live results.

# Devin Secrets Needed
None for public-site browser tests.

# Useful browser flows
- Intro state is per tab in sessionStorage (`k2e-intro-seen`). A genuinely fresh tab opened through the address bar avoids copying an opener's session storage. `?intro=1` forces replay.
- Reduced motion intentionally uses a brief static completed sketch. Keep a CDP emulation connection alive through navigation and verify matchMedia before judging results.
- Keyboard Grove setup accepts digit `4` to enter; start the adventure and click the displayed matching button. Chapter one needs six correct matches. This exercises software input, not physical Key-X hardware.
- Floral Artistry starts with PLAY; moving the mouse then creates flowers. Test the injected back link after the game has rebuilt its body and after switching Arabic.
- The Floral folder contains a space; links should use `floral%20artistry/`.
- QR download is a PNG. An independent decoder such as Python `zxing-cpp` with Pillow can check its exact URL; inspect the browser's actual Downloads directory if an auxiliary download listener produces an empty file.
- For resource failures, confirm exact URLs in DevTools or CDP Log/Network events. Auxiliary browser tooling may emit noisy repeated console entries. Hard reload helps expose cached favicon failures.
- The hub should stack at 390px and use two columns around 768px; inspect expanded trainer links too.
