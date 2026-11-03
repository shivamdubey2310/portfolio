#!/usr/bin/env python3
"""Make the WebP variants the projects page uses for a diagram PNG.

Usage:  python3 tools/make-webp.py "project_images/My Project.png" [more PNGs...]

For each PNG it writes, next to it in a web/ folder:
  <slug>-640.webp   card thumbnail (max 640px wide, lossy q82)
  <slug>-full.webp  detail / lightbox image (max 2400px wide, lossless; lossy q90 if > 700 KB)
and prints the slug plus the sizes to use as data-full-w / data-full-h and width / height on the <img>.
The original PNG stays in place as the <img> fallback. Needs Pillow (pip install pillow).
"""
import os, re, sys, unicodedata
from PIL import Image


def slug(name):
    n = unicodedata.normalize('NFKD', name).replace('‑', '-').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', n)).strip('-')


for path in sys.argv[1:]:
    folder, fname = os.path.split(path)
    s = slug(os.path.splitext(fname)[0])
    out = os.path.join(folder, 'web')
    os.makedirs(out, exist_ok=True)
    im = Image.open(path)
    im.load()
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA')
    W, H = im.size
    tw = min(640, W)
    th = round(H * tw / W)
    im.resize((tw, th), Image.LANCZOS).save(os.path.join(out, f'{s}-640.webp'), 'WEBP', quality=82, method=6)
    fw = min(2400, W)
    fh = round(H * fw / W)
    full = im.resize((fw, fh), Image.LANCZOS) if fw != W else im
    target = os.path.join(out, f'{s}-full.webp')
    full.save(target, 'WEBP', lossless=True, method=6)
    if os.path.getsize(target) > 700 * 1024:
        full.save(target, 'WEBP', quality=90, method=6)
    print(f'{s}\n  card <img> width={tw} height={th}\n  data-full-w="{fw}" data-full-h="{fh}"')
