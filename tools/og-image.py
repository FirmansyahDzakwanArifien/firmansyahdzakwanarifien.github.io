#!/usr/bin/env python3
"""Generate 1200x630 social preview cards for posts and projects.

  python3 tools/og-image.py            # write missing/changed cards to assets/img/og/
  python3 tools/og-image.py --force    # regenerate every card

Output: assets/img/og/<collection>-<slug>.jpg, picked up by _includes/head.html for og:image, plus
assets/img/og/labs-homelab.jpg: the thesis testbed diagram drawn from _data/homelab.yml (Labs page and
the thesis project), and assets/img/og/site.jpg: the default card for pages without an image.
The art on the right is tools/hero-iso.png (the home hero art). Fonts are bundled in tools/fonts (SIL OFL) so the result is identical locally and in CI.
"""
import hashlib
import json
import pathlib
import re
import sys
from datetime import datetime

import yaml
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools" / "fonts"
OUT = ROOT / "assets" / "img" / "og"
STAMP = OUT / ".stamps.json"  # content hash per card, so unchanged cards are not rewritten
# The home hero art (assets/img/hero/hero-iso.svg from tools/hero-art.py) as a transparent PNG; PIL cannot
# draw SVG. Re-render it after changing the art (see tools/hero-art.py) so the cards stay in sync.
ART = ROOT / "tools" / "hero-iso.png"
SOURCES = {"posts": ROOT / "_posts", "projects": ROOT / "_projects"}
VERSION = "3"  # bump to regenerate every card after a design change

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
    av = Image.open(ART).convert("RGBA")
    return av.resize((round(av.width * 540 / av.height), 540), Image.LANCZOS)


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

    ax, ay = W - av.width - 90, H - av.height - 30  # the art already carries its outline and shadow
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


def homelab_card(w=W, h=H, header=True):
    """The homelab topology, from the same coordinates as the SVG on /labs/: a 1200x630 social card, or
    (header=False) a bare diagram for the thesis card in Featured Work."""
    lab = yaml.safe_load((ROOT / "_data" / "homelab.yml").read_text(encoding="utf-8"))
    cw, ch = lab.get("canvas", [800, 460])
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    if header:
        x0 = 72
        d.text((x0, 52), "LABS · HOMELAB", font=font("DMSans-Variable.ttf", 22, 600), fill=ACCENT)
        d.text((x0, 82), lab.get("title", "Homelab"), font=font("InstrumentSerif-Regular.ttf", 52), fill=WHITE)
        d.text((w - x0, 62), "cyphera.my.id", font=font("DMSans-Variable.ttf", 22, 400), fill=MUTED, anchor="ra")
    top = 165 if header else 28
    avail_w, avail_h = w - 2 * 40, h - top - 28
    k = min(avail_w / cw, avail_h / ch)
    ox, oy = (w - cw * k) / 2, top + (avail_h - ch * k) / 2

    def pt(x, y):
        return ox + x * k, oy + y * k

    nodes = {n["id"]: n for n in lab.get("nodes", [])}
    # Frames fitted around their nodes, as in _includes/homelab.html.
    for b in lab.get("boundaries", []):
        inside = [nodes[i] for i in b.get("nodes", []) if i in nodes]
        if not inside:
            continue
        pad = b.get("pad", 16)
        bottom = b.get("bottom", pad)
        segment = b.get("style") == "segment"
        bx, by = pt(min(n["x"] for n in inside) - 82 - pad, min(n["y"] for n in inside) - 22 - pad)
        bx2, by2 = pt(max(n["x"] for n in inside) + 82 + pad, max(n["y"] for n in inside) + 22 + bottom)
        d.rounded_rectangle((bx, by, bx2, by2), radius=(10 if segment else 14) * k,
                            fill=(26, 33, 54) if segment else (22, 28, 46), outline=(70, 80, 105), width=1 if segment else 2)
        d.text((bx + 14 * k, by2 - 12 * k), b.get("label", ""),
               font=font("DMSans-Variable.ttf", round((11 if segment else 12) * k), 500 if segment else 600),
               fill=MUTED, anchor="ls")
    for l in lab.get("links", []):
        a, c = nodes.get(l["from"]), nodes.get(l["to"])
        if not (a and c):
            continue
        dx, dy = c["x"] - a["x"], c["y"] - a["y"]
        t = min(87 / abs(dx) if dx else float("inf"), 27 / abs(dy) if dy else float("inf"))
        if t >= 0.5:
            continue
        p1, p2 = pt(a["x"] + dx * t, a["y"] + dy * t), pt(c["x"] - dx * t, c["y"] - dy * t)
        d.line((*p1, *p2), fill=(95, 105, 130), width=2)
        ends = [(p2, p1)] + ([(p1, p2)] if l.get("both") else [])
        for tip, tail in ends:
            ux, uy = tip[0] - tail[0], tip[1] - tail[1]
            ln = (ux * ux + uy * uy) ** 0.5 or 1
            ux, uy, s = ux / ln, uy / ln, 8 * k
            d.polygon([tip, (tip[0] - ux * s - uy * s * 0.55, tip[1] - uy * s + ux * s * 0.55),
                       (tip[0] - ux * s + uy * s * 0.55, tip[1] - uy * s - ux * s * 0.55)], fill=(95, 105, 130))
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
    # Site-wide card for pages without their own image (_config.yml: social_preview_image).
    profile = yaml.safe_load((ROOT / "_data" / "profile.yml").read_text(encoding="utf-8"))
    yield "site", str(profile.get("headline", "Portfolio")), "Portfolio", "Labs · Projects · Thesis · CV"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    stamps = json.loads(STAMP.read_text()) if STAMP.exists() else {}
    force = "--force" in sys.argv
    av = None
    keep = set()
    art = hashlib.sha256(ART.read_bytes()).hexdigest()[:12]  # a new hero art regenerates every card
    for name, title, kicker, meta in items():
        keep.add(name)
        digest = hashlib.sha256(f"{VERSION}|{art}|{title}|{kicker}|{meta}".encode()).hexdigest()[:16]
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
        homelab_card(960, 600, header=False).save(OUT / "labs-homelab-diagram.jpg", "JPEG", quality=86, optimize=True, progressive=True)
        stamps["labs-homelab"] = digest
        print(f"wrote {target.relative_to(ROOT)} and labs-homelab-diagram.jpg")
    for stale in set(stamps) - keep:  # post deleted or renamed
        (OUT / f"{stale}.jpg").unlink(missing_ok=True)
        del stamps[stale]
        print(f"removed {stale}.jpg")
    STAMP.write_text(json.dumps(dict(sorted(stamps.items())), indent=1) + "\n")


if __name__ == "__main__":
    main()
