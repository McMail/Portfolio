#!/usr/bin/env python3
"""Scans media/<folder>/ and writes media/manifest.json.

Run locally:   python build_manifest.py
On GitHub:     the deploy workflow runs this automatically on every push.

Folder order = alphabetical, so prefix with 01-, 02-, ... to control the menu order.
The prefix is hidden on the site ("01-rockit-productions" -> "Rockit Productions").
"""
import json, re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).parent
MEDIA = ROOT / "media"
IMAGES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
VIDEOS = {".mp4", ".webm", ".mov", ".m4v"}

def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

def nice_title(name):
    name = re.sub(r"^\d+[-_. ]+", "", name)
    words = re.sub(r"[-_]+", " ", name).split()
    return " ".join(w[:1].upper() + w[1:] if w.islower() else w for w in words)

folders = []
for d in sorted((p for p in MEDIA.iterdir() if p.is_dir() and not p.name.startswith(".")),
                key=lambda p: natural(p.name)):
    items = []
    for f in sorted((p for p in d.iterdir() if p.is_file()), key=lambda p: natural(p.name)):
        ext = f.suffix.lower()
        kind = "image" if ext in IMAGES else "video" if ext in VIDEOS else None
        if kind:
            items.append({"src": "media/" + quote(d.name) + "/" + quote(f.name), "type": kind})
    folders.append({"slug": d.name, "title": nice_title(d.name), "items": items})

(MEDIA / "manifest.json").write_text(json.dumps({"folders": folders}, indent=2), encoding="utf-8")
print(f"manifest.json written: {len(folders)} folders, {sum(len(f['items']) for f in folders)} files")
