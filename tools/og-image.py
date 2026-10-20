#!/usr/bin/env python3
"""Generate 1200x630 social preview cards for posts and projects.

  python3 tools/og-image.py            # write missing/changed cards to assets/img/og/
  python3 tools/og-image.py --force    # regenerate every card

Output: assets/img/og/<collection>-<slug>.jpg, picked up by _includes/head.html for og:image, plus
assets/img/og/labs-homelab.jpg: the thesis testbed diagram drawn from _data/homelab.yml (Labs page and
the thesis project).
Fonts are bundled in tools/fonts (SIL OFL) so the result is identical locally and in CI.
"""
import hashlib
import io
import json
import pathlib
import re
import sys
import urllib.request
from datetime import datetime

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools" / "fonts"
OUT = ROOT / "assets" / "img" / "og"
STAMP = OUT / ".stamps.json"  # content hash per card, so unchanged cards are not rewritten
AVATAR = ("https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main"
          "/blog/img/avatar/avatar-popout-comic.webp")
SOURCES = {"posts": ROOT / "_posts", "projects": ROOT / "_projects"}
VERSION = "2"  # bump to regenerate every card after a design change

W, H = 1200, 630
BG, INK, BLUE = (16, 18, 28), (20, 20, 28), (37, 99, 235)
WHITE, MUTED, ACCENT = (245, 246, 248), (176, 184, 198), (122, 167, 255)


def font(name, size, weight=None):
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight:
        f.set_variation_by_axes([14, weight])
    return f


def front_matter(path):
    m = re.match(r"---\s*\n(.*?)\n---", path.read_text(encoding="utf-8"), re.S)
    return yaml.safe_load(m.group(1)) or {} if m else {}


def wrap(draw, text, fnt, width, max_lines):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while draw.textlength(lines[-1] + "…", font=fnt) > width:
            lines[-1] = lines[-1].rsplit(" ", 1)[0]
        lines[-1] += "…"
    return lines


def avatar_layer():
    with urllib.request.urlopen(urllib.request.Request(AVATAR, headers={"User-Agent": "cyphera-og/1.0"}), timeout=60) as res:
        av = ImageOps.mirror(Image.open(io.BytesIO(res.read())).convert("RGBA"))
    av = av.resize((round(av.width * 470 / av.height), 470), Image.LANCZOS)
    return av


def card(title, kicker, meta, av):
    img = Image.new("RGB", (W, H), BG)
    dots = Image.new("L", (W, H), 0)
    dd = ImageDraw.Draw(dots)
    for y in range(0, H, 14):
        for x in range(0, W, 14):
            fade = max(0.0, 1 - ((x - 1010) ** 2 + (y - 360) ** 2) ** 0.5 / 430)
            r = 2.3 * fade
            if r > 0.4:
                dd.ellipse((x - r, y - r, x + r, y + r), fill=255)
    img.paste(Image.new("RGB", (W, H), (40, 70, 150)), (0, 0), dots)

    ax, ay = W - av.width - 40, H - av.height + 30
    outline = av.getchannel("A").filter(ImageFilter.MaxFilter(7))
    for color, dx, dy in ((BLUE, 9, 9), (INK, 0, 0)):
        mask = Image.new("L", (W, H), 0)
        mask.paste(outline, (ax + dx, ay + dy))
        img.paste(Image.new("RGB", (W, H), color), (0, 0), mask)
    img.paste(av, (ax, ay), av)

    d = ImageDraw.Draw(img)
    x, maxw = 72, 720
    d.text((x, 70), kicker.upper(), font=font("DMSans-Variable.ttf", 22, 600), fill=ACCENT)
    size = 64
    while size > 44:
        tf = font("InstrumentSerif-Regular.ttf", size)
        lines = wrap(d, title, tf, maxw, 4)
        if len(lines) <= 3 or size <= 48:
            break
        size -= 4
    y = 120
    for line in lines:
        d.text((x, y), line, font=tf, fill=WHITE)
        y += int(size * 1.12)
    d.line((x, y + 18, x + 60, y + 18), fill=ACCENT, width=3)
    d.text((x, y + 36), meta, font=font("DMSans-Variable.ttf", 24, 400), fill=MUTED)
    d.text((x, H - 70), "Firmansyah Dzakwan Arifien", font=font("DMSans-Variable.ttf", 24, 600), fill=WHITE)
    d.text((x, H - 40), "cyphera.my.id", font=font("DMSans-Variable.ttf", 20, 400), fill=MUTED)
    return img


ZONES = {"edge": (113, 128, 150), "security": (209, 67, 67), "compute": (90, 140, 245),
         "monitor": (32, 170, 145), "client": (150, 125, 230)}


def homelab_card():
    """The homelab topology on a 1200x630 card, from the same coordinates as the SVG on /labs/."""
    lab = yaml.safe_load((ROOT / "_data" / "homelab.yml").read_text(encoding="utf-8"))
    cw, ch = lab.get("canvas", [800, 460])
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    x0 = 72
    d.text((x0, 52), "LABS · HOMELAB", font=font("DMSans-Variable.ttf", 22, 600), fill=ACCENT)
    d.text((x0, 82), lab.get("title", "Homelab"), font=font("InstrumentSerif-Regular.ttf", 52), fill=WHITE)
    d.text((W - x0, 62), "cyphera.my.id", font=font("DMSans-Variable.ttf", 22, 400), fill=MUTED, anchor="ra")

    top, avail_w, avail_h = 165, W - 2 * 40, H - 165 - 28
    k = min(avail_w / cw, avail_h / ch)
    ox, oy = (W - cw * k) / 2, top

    def pt(x, y):
        return ox + x * k, oy + y * k

    b = lab.get("boundary")
    if b:
        bx, by = pt(b["x"], b["y"])
        bx2, by2 = pt(b["x"] + b["width"], b["y"] + b["height"])
        d.rounded_rectangle((bx, by, bx2, by2), radius=14 * k, fill=(22, 28, 46), outline=(70, 80, 105), width=2)
        d.text((bx + 14 * k, by2 - 12 * k), b.get("label", ""), font=font("DMSans-Variable.ttf", round(12 * k), 600),
               fill=MUTED, anchor="ls")
    nodes = {n["id"]: n for n in lab.get("nodes", [])}
    for l in lab.get("links", []):
        a, c = nodes.get(l["from"]), nodes.get(l["to"])
        if a and c:
            d.line((*pt(a["x"], a["y"]), *pt(c["x"], c["y"])), fill=(95, 105, 130), width=2)
    nf = font("DMSans-Variable.ttf", round(13 * k), 600)
    for n in nodes.values():
        x, y = pt(n["x"] - 82, n["y"] - 22)
        x2, y2 = pt(n["x"] + 82, n["y"] + 22)
        color = ZONES.get(n.get("zone", "compute"), ZONES["compute"])
        d.rounded_rectangle((x, y, x2, y2), radius=10 * k, fill=BG, outline=color, width=3)
        d.ellipse((x + 12 * k, (y + y2) / 2 - 5 * k, x + 22 * k, (y + y2) / 2 + 5 * k), fill=color)
        d.text((x + 32 * k, (y + y2) / 2), n["label"], font=nf, fill=WHITE, anchor="lm")
    return img


def items():
    for collection, folder in SOURCES.items():
        for path in sorted(folder.glob("*.md")):
            fm = front_matter(path)
            if fm.get("published") is False or not fm.get("title"):
                continue
            slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
            cats = fm.get("categories") or []
            cats = cats if isinstance(cats, list) else [cats]
            date = str(fm.get("date", ""))[:10]
            if re.match(r"\d{4}-\d{2}-\d{2}$", date):
                date = datetime.strptime(date, "%Y-%m-%d").strftime("%-d %b %Y" if sys.platform != "win32" else "%#d %b %Y")
            kicker = "Project" if collection == "projects" else (cats[0] if cats else "Post")
            meta = " · ".join(filter(None, [date, ", ".join(str(c) for c in cats[:2])]))
            yield f"{collection}-{slug}", str(fm["title"]), kicker, meta


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    stamps = json.loads(STAMP.read_text()) if STAMP.exists() else {}
    force = "--force" in sys.argv
    av = None
    keep = set()
    for name, title, kicker, meta in items():
        keep.add(name)
        digest = hashlib.sha256(f"{VERSION}|{title}|{kicker}|{meta}".encode()).hexdigest()[:16]
        target = OUT / f"{name}.jpg"
        if not force and target.exists() and stamps.get(name) == digest:
            continue
        av = av or avatar_layer()
        card(title, kicker, meta, av).save(target, "JPEG", quality=84, optimize=True, progressive=True)
        stamps[name] = digest
        print(f"wrote {target.relative_to(ROOT)}")
    lab_src = (ROOT / "_data" / "homelab.yml").read_bytes()
    keep.add("labs-homelab")
    digest = hashlib.sha256(VERSION.encode() + lab_src).hexdigest()[:16]
    target = OUT / "labs-homelab.jpg"
    if force or not target.exists() or stamps.get("labs-homelab") != digest:
        homelab_card().save(target, "JPEG", quality=86, optimize=True, progressive=True)
        stamps["labs-homelab"] = digest
        print(f"wrote {target.relative_to(ROOT)}")
    for stale in set(stamps) - keep:  # post deleted or renamed
        (OUT / f"{stale}.jpg").unlink(missing_ok=True)
        del stamps[stale]
        print(f"removed {stale}.jpg")
    STAMP.write_text(json.dumps(dict(sorted(stamps.items())), indent=1) + "\n")


if __name__ == "__main__":
    main()
