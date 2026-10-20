#!/usr/bin/env python3
"""Create the 640px-wide "-640" variants used in srcset for post and album images.

  python3 tools/make-variants.py ../firmansyahdzakwanarifien-assets

Run it after adding images to blog/img/posts/, album/, or projects/ in the assets repo, then commit both.
Every image there needs a variant: templates reference name-640.ext for any image in those folders
(_includes/srcset.html, assets/js/custom/photo.js), and site-checks fails on a missing one.
"""
import pathlib
import sys

from PIL import Image, ImageOps

WIDTH = 640
FOLDERS = ["blog/img/posts", "blog/img/album", "blog/img/projects"]
EXTS = {".jpg", ".jpeg", ".webp", ".png"}

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../firmansyahdzakwanarifien-assets")
made = 0
for folder in FOLDERS:
    for src in sorted((root / folder).rglob("*")):
        if src.suffix.lower() not in EXTS or src.stem.endswith("-640"):
            continue
        out = src.with_name(f"{src.stem}-640{src.suffix}")
        if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
            continue
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.width > WIDTH:
                im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
            fmt = {".jpg": "JPEG", ".jpeg": "JPEG", ".webp": "WEBP", ".png": "PNG"}[src.suffix.lower()]
            if fmt == "JPEG":
                im.convert("RGB").save(out, fmt, quality=78, optimize=True, progressive=True)
            elif fmt == "WEBP":
                im.save(out, fmt, quality=82, method=6)
            else:
                im.save(out, fmt, optimize=True)
        made += 1
        print(f"{out.relative_to(root)}  {out.stat().st_size // 1024} KB")
print(f"{made} variant(s) written")
