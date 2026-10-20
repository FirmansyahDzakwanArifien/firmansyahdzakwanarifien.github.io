#!/usr/bin/env python3
"""Self-hosted Font Awesome subset: only the icons this site uses (~20 KB instead of ~230 KB).

  python3 tools/fa-subset.py          # rebuild assets/css/fa-subset.css + assets/fonts/fa/*.woff2
  python3 tools/fa-subset.py --check  # fail if the source uses an icon missing from the subset (CI)

Icons are collected from templates, data files, posts, and scripts ("fa-<name>" tokens), the glyph
names in assets/js/custom/homelab.js, and raw codepoints in _sass (e.g. the theme's prompt boxes). After adding an icon anywhere, run this and commit.
Needs: pip install fonttools brotli
"""
import io
import pathlib
import re
import sys
import tarfile
import tempfile
import urllib.request

VERSION = "7.1.0"
ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS_OUT = ROOT / "assets/css/fa-subset.css"
FONT_DIR = ROOT / "assets/fonts/fa"
SCAN = ["_includes", "_layouts", "_tabs", "_data", "_posts", "_projects", "_album", "_javascript",
        "assets/js/custom", "assets/js/data", "index.html", "cv.html", "ctf.html"]
FONTS = ["fa-solid-900.woff2", "fa-regular-400.woff2", "fa-brands-400.woff2"]
ALWAYS = {"circle-half-stroke", "angle-up", "angle-down", "bars", "magnifying-glass", "xmark"}  # theme UI


def package():
    url = f"https://registry.npmjs.org/@fortawesome/fontawesome-free/-/fontawesome-free-{VERSION}.tgz"
    data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "cyphera-fa/1.0"}), timeout=60).read()
    return tarfile.open(fileobj=io.BytesIO(data))


def icon_rules(css):
    """{name: codepoint} from rules like `.fa-house,.fa-home{--fa:"\\f015"}`."""
    out = {}
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        m = re.fullmatch(r'\s*--fa:"\\([0-9a-f]+) ?"\s*;?\s*', body)
        if m and re.fullmatch(r"\s*(\.fa-[a-z0-9-]+\s*,\s*)*\.fa-[a-z0-9-]+\s*", sel):
            for name in re.findall(r"\.fa-([a-z0-9-]+)", sel):
                out[name] = int(m.group(1), 16)
    return out


def used_names(known):
    found = set(ALWAYS)
    for entry in SCAN:
        path = ROOT / entry
        files = [path] if path.is_file() else [p for p in path.rglob("*") if p.is_file()]
        for f in files:
            if f.suffix not in {".html", ".yml", ".yaml", ".md", ".js", ".json"}:
                continue
            text = f.read_text(encoding="utf-8", errors="ignore")
            found.update(n for n in re.findall(r"\bfa-([a-z0-9-]+)", text) if n in known)
            if f.name == "homelab.js":  # SVG <text> glyphs keyed by icon name
                found.update(n for n in re.findall(r"'?([a-z][a-z0-9-]+)'?\s*:\s*'\\u", text) if n in known)
    by_code = {}
    for name, code in known.items():
        by_code.setdefault(code, name)
    for f in (ROOT / "_sass").rglob("*.scss"):  # e.g. @include mx.prompt('info', '\f06a')
        for code in re.findall(r"\\(f[0-9a-f]{3})\b", f.read_text(encoding="utf-8")):
            if int(code, 16) in by_code:
                found.add(by_code[int(code, 16)])
    return found


def build_css(css, keep):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    # Drop the FA 4/5 compatibility faces; keep the three v7 faces, pointed at the subset fonts.
    css = re.sub(r'@font-face\{[^}]*Font Awesome (?:5|4)[^}]*\}', "", css)
    css = re.sub(r'@font-face\{[^}]*fa-v4compatibility[^}]*\}', "", css)
    css = css.replace("../webfonts/", "../fonts/fa/")

    def prune(m):
        sel, body = m.group(1), m.group(2)
        if re.fullmatch(r'\s*--fa:"[^"]*"\s*;?\s*', body):
            names = re.findall(r"\.fa-([a-z0-9-]+)", sel)
            if names and re.fullmatch(r"\s*(\.fa-[a-z0-9-]+\s*,\s*)*\.fa-[a-z0-9-]+\s*", sel):
                kept = [n for n in names if n in keep]
                return ",".join(f".fa-{n}" for n in kept) + "{" + body + "}" if kept else ""
        return m.group(0)

    css = re.sub(r"([^{}@]+)\{([^{}]*)\}", prune, css)
    return f"/* Font Awesome Free {VERSION} subset (tools/fa-subset.py). License: https://fontawesome.com/license/free */\n" + css.strip() + "\n"


def main():
    tar = package()
    css = tar.extractfile("package/css/all.min.css").read().decode("utf-8")
    known = icon_rules(css)
    keep = used_names(known)

    if "--check" in sys.argv:
        built = set(icon_rules(CSS_OUT.read_text(encoding="utf-8")))
        missing = sorted(keep - built)
        for name in missing:
            print(f"::error::Font Awesome icon 'fa-{name}' is used but not in the subset (run python3 tools/fa-subset.py)")
        print(f"{len(keep)} icons used, {len(missing)} missing from the subset")
        sys.exit(1 if missing else 0)

    from fontTools import subset

    FONT_DIR.mkdir(parents=True, exist_ok=True)
    codepoints = sorted({known[n] for n in keep})
    with tempfile.TemporaryDirectory() as tmp:
        for name in FONTS:
            src = pathlib.Path(tmp) / name
            src.write_bytes(tar.extractfile(f"package/webfonts/{name}").read())
            opts = subset.Options()
            opts.flavor = "woff2"
            opts.layout_features = ["*"]
            opts.notdef_outline = True
            font = subset.load_font(str(src), opts)
            sub = subset.Subsetter(opts)
            sub.populate(unicodes=codepoints)
            sub.subset(font)
            subset.save_font(font, str(FONT_DIR / name), opts)
            font.close()  # release the file (Windows will not delete an open temp file)
            print(f"{name}: {(FONT_DIR / name).stat().st_size // 1024} KB")
    CSS_OUT.write_text(build_css(css, keep), encoding="utf-8", newline="\n")
    print(f"{CSS_OUT.relative_to(ROOT)}: {CSS_OUT.stat().st_size // 1024} KB, {len(keep)} icons")


if __name__ == "__main__":
    main()
