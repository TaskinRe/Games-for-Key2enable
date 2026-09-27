#!/usr/bin/env python3
"""Encrypt a game's HTML with its access code.

    python3 tools/encrypt-game.py game-04 GAME4-8147 ~/Downloads/robot.html

Writes <game folder>/game.enc (the encrypted game) and <game folder>/index.html
(the small loader that decrypts it in the browser). The game folder and title
are read from site-config.js; the code is checked against that game's hash.

Same format as assets/js/vault.js and the hub's "Encrypt a game file" tool:
    key  = PBKDF2-SHA256(normalised code, salt, 200 000 rounds) -> AES-256
    file = b"K2EV1" | salt(16) | iv(12) | AES-GCM(html)

Needs the `cryptography` package:  python3 -m pip install cryptography
"""
import hashlib
import os
import re
import sys

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except ImportError:  # pragma: no cover
    sys.exit("Missing dependency: run  python3 -m pip install cryptography")

MAGIC = b"K2EV1"
ROUNDS = 200_000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LOADER = os.path.join(ROOT, "assets", "vault-loader.html")


def normalize(code):
    return re.sub(r"[\s\-_]+", "", code.upper())


def encrypt(code, data):
    salt, iv = os.urandom(16), os.urandom(12)
    key = hashlib.pbkdf2_hmac("sha256", normalize(code).encode(), salt, ROUNDS, 32)
    return MAGIC + salt + iv + AESGCM(key).encrypt(iv, data, None)


def decrypt(code, blob):
    assert blob[: len(MAGIC)] == MAGIC, "not an encrypted game file"
    salt, iv, ct = blob[5:21], blob[21:33], blob[33:]
    key = hashlib.pbkdf2_hmac("sha256", normalize(code).encode(), salt, ROUNDS, 32)
    return AESGCM(key).decrypt(iv, ct, None)


def game_from_config(game_id):
    cfg = open(os.path.join(ROOT, "site-config.js"), encoding="utf-8").read()
    m = re.search(r'\{[^{}]*?\bid:\s*"' + re.escape(game_id) + r'"[^{}]*\}', cfg, re.S)
    if not m:
        sys.exit(f"{game_id} not found in site-config.js")
    block = m.group(0)
    url = re.search(r'\burl:\s*"([^"]*)"', block)
    title = re.search(r'\btitle:\s*"([^"]*)"', block)
    key = re.search(r'"' + re.escape(game_id) + r'":\s*"([0-9a-fA-F]{64})"', cfg)
    brand = re.search(r'\bbrand:\s*"([^"]*)"', cfg)
    hub = re.search(r'\bhubName:\s*"([^"]*)"', cfg)
    return {
        "folder": (url.group(1) if url else game_id + "/").rstrip("/"),
        "title": title.group(1) if title else game_id,
        "hash": key.group(1).lower() if key else "",
        "brand": brand.group(1) if brand else "Key2Enable",
        "hub": hub.group(1) if hub else "Game Hub",
    }


def main(argv):
    if len(argv) != 4:
        sys.exit(__doc__)
    game_id, code, src = argv[1:]
    g = game_from_config(game_id)
    if g["hash"] and hashlib.sha256(normalize(code).encode()).hexdigest() != g["hash"]:
        sys.exit(f"{code!r} is not the current code for {game_id} (access.keys hash differs). "
                 "Use the game's code, or update the hash in site-config.js first.")
    folder = os.path.join(ROOT, g["folder"])
    os.makedirs(folder, exist_ok=True)
    html = open(src, "rb").read()
    blob = encrypt(code, html)
    assert decrypt(code, blob) == html
    with open(os.path.join(folder, "game.enc"), "wb") as f:
        f.write(blob)
    loader = open(LOADER, encoding="utf-8").read()
    for k, v in {"title": g["title"], "game_id": game_id, "brand": g["brand"], "hub": g["hub"]}.items():
        loader = loader.replace("{{" + k + "}}", v)
    with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
        f.write(loader)
    print(f"{g['folder']}/game.enc  {len(blob):,} bytes  (from {os.path.basename(src)})")
    print(f"{g['folder']}/index.html  loader")


if __name__ == "__main__":
    main(sys.argv)
