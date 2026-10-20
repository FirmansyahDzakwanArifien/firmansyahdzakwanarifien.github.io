#!/usr/bin/env python3
"""Draw the home hero art: an isometric rack (firewall, switch, Linux servers) with a floating SIEM screen
and a shield, in the site's comic style (ink outlines, pop-art blue, white sticker rim).

  python3 tools/hero-art.py   # writes assets/img/hero/hero-iso.svg

Every face is drawn in flat 2D coordinates and mapped onto its isometric plane with an SVG matrix, so
labels and ports sit on the faces like real panels. The canvas is 271x442, the slot the hero expects.
"""
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img" / "hero" / "hero-iso.svg"
CW, CH = 271, 442
# CTF flag 5 ("Picture This", _data/ctf.yml), base64-encoded so it takes a little forensics to read.
CTF_NOTE = "Q1RGIGZsYWcgNS81OiBjeXBoZXJhezN4MWZfZDR0NF90M2xsc19zdDByMTNzfQ=="
INK, BLUE = "#14141c", "#2563eb"
C, S = math.cos(math.radians(30)), math.sin(math.radians(30))

# Scene in world units: x runs right-down, y runs left-down, z is up.
W, D, H = 74, 46, 152          # rack width (front), depth, height
SCREEN = dict(x0=-12, x1=90, z0=H + 40, z1=H + 118, y=D + 8, t=5)
SHIELD = dict(y=D + 34, x=-12, z=14, w=50, h=66, t=8)


class Iso:
    def __init__(self, scale, ox, oy):
        self.s, self.ox, self.oy = scale, ox, oy

    def p(self, x, y, z):
        return self.ox + (x - y) * C * self.s, self.oy + (x + y) * S * self.s - z * self.s

    def front(self, y):
        """Plane y=const; local (u, v) = (x, -z)."""
        e, f = self.p(0, y, 0)
        return f"matrix({C * self.s:.4f} {S * self.s:.4f} 0 {self.s:.4f} {e:.2f} {f:.2f})"

    def side(self, x):
        """Plane x=const; local (u, v) = (y, -z)."""
        e, f = self.p(x, 0, 0)
        return f"matrix({-C * self.s:.4f} {S * self.s:.4f} 0 {self.s:.4f} {e:.2f} {f:.2f})"

    def top(self, z):
        """Plane z=const; local (u, v) = (x, y)."""
        e, f = self.p(0, 0, z)
        return f"matrix({C * self.s:.4f} {S * self.s:.4f} {-C * self.s:.4f} {S * self.s:.4f} {e:.2f} {f:.2f})"


def box(iso, x0, x1, y0, y1, z0, z1, top, front, side, stroke=3.2):
    """A solid box: top, front (y=y1) and right (x=x1) faces."""
    pts = lambda *ps: " ".join(f"{a:.2f},{b:.2f}" for a, b in (iso.p(*q) for q in ps))
    st = f'stroke="{INK}" stroke-width="{stroke}" stroke-linejoin="round"'
    return "\n".join([
        f'<polygon points="{pts((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))}" fill="{top}" {st}/>',
        f'<polygon points="{pts((x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (x0, y1, z0))}" fill="{front}" {st}/>',
        f'<polygon points="{pts((x1, y0, z1), (x1, y1, z1), (x1, y1, z0), (x1, y0, z0))}" fill="{side}" {st}/>',
    ])


def scene(iso):
    out = []
    ns = 'vector-effect="non-scaling-stroke"'

    # Rack cabinet
    out.append(box(iso, 0, W, 0, D, 0, H, "#4a5873", "#2b3445", "#1c2433"))
    # Vents on the side panel
    out.append(f'<g transform="{iso.side(W)}" stroke="#2b3445" stroke-width="2.2" stroke-linecap="round" {ns}>'
               + "".join(f'<path d="M8 {-z} H{D - 8}" {ns}/>' for z in range(30, H - 20, 14)) + "</g>")

    # Devices on the front panel (local u = x, v = -z)
    f = [f'<g transform="{iso.front(D)}">']
    unit = lambda z0, z1, fill: f'<rect x="4" y="{-z1}" width="{W - 8}" height="{z1 - z0}" rx="1.5" fill="{fill}" stroke="{INK}" stroke-width="2" {ns}/>'
    # Firewall
    f.append(unit(H - 24, H - 6, "#334056"))
    f.append(f'<rect x="4" y="{-(H - 6)}" width="16" height="18" rx="1.5" fill="#ea580c" stroke="{INK}" stroke-width="2" {ns}/>')
    f.append(f'<text x="12" y="{-(H - 18.5)}" font-family="system-ui,Segoe UI,Arial,sans-serif" font-weight="800" font-size="7.5" fill="#fff" text-anchor="middle">FW</text>')
    for i in range(6):
        f.append(f'<rect x="{25 + i * 7}" y="{-(H - 18)}" width="5" height="7" rx="0.8" fill="#0f172a"/>')
    for i in (0, 1, 2, 4):
        f.append(f'<circle cx="{27.5 + i * 7}" cy="{-(H - 21)}" r="1.1" fill="#22c55e"/>')
    f.append(f'<circle cx="{W - 9}" cy="{-(H - 15)}" r="2.4" fill="#22c55e" stroke="{INK}" stroke-width="1" {ns}/>')
    # Switch
    f.append(unit(H - 44, H - 28, "#3d4a61"))
    for i in range(10):
        f.append(f'<rect x="{8 + i * 6.2}" y="{-(H - 39.5)}" width="4.4" height="6" rx="0.8" fill="#0f172a"/>')
    # Patch cables from the firewall to the switch
    for x0, x1, col in ((27.5, 12, "#facc15"), (34.5, 31, "#60a5fa"), (41.5, 52, "#22c55e")):
        f.append(f'<path d="M{x0} {-(H - 11)} C{x0} {-(H - 30)} {x1} {-(H - 26)} {x1} {-(H - 36)}" fill="none" stroke="{col}" stroke-width="2.6" stroke-linecap="round" {ns}/>')
    # Linux servers
    for k, (z0, led2) in enumerate(((H - 78, "#7aa7ff"), (H - 110, "#f59e0b"), (H - 142, "#7aa7ff"))):
        z1 = z0 + 28
        f.append(unit(z0, z1, "#2b3445"))
        mid = -(z0 + 14)
        f.append(f'<circle cx="11" cy="{mid}" r="2.6" fill="#22c55e"/><circle cx="18" cy="{mid}" r="2" fill="{led2}"/>')
        f.append(f'<text x="24" y="{mid + 2.6}" font-family="ui-monospace,Consolas,monospace" font-weight="700" font-size="7" fill="#cbd5e1">srv{k + 1}</text>')
        f.append("".join(f'<path d="M{x} {mid - 7} v14" stroke="{INK}" stroke-width="2" stroke-linecap="round" {ns}/>'
                         for x in range(44, W - 6, 5)))
    f.append("</g>")
    out.append("\n".join(f))

    # Network nodes (shaded spheres) wired to the screen
    a, b, c_ = iso.p(-30, D + 8, H + 104), iso.p(-42, D + 8, H + 66), iso.p(-16, D + 8, H + 134)
    scr = iso.p(SCREEN["x0"], SCREEN["y"], H + 70)
    out.append(f'<path d="M{b[0]:.1f} {b[1]:.1f} L{a[0]:.1f} {a[1]:.1f} L{c_[0]:.1f} {c_[1]:.1f} M{a[0]:.1f} {a[1]:.1f} L{scr[0]:.1f} {scr[1]:.1f}" '
               f'stroke="{INK}" stroke-width="2.5" stroke-linecap="round" fill="none"/>')
    for (x, y), r, grad in ((a, 11, "g-teal"), (b, 8, "g-violet"), (c_, 7, "g-white")):
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#{grad})" stroke="{INK}" stroke-width="2.8"/>')

    # Floating SIEM screen (thin slab) with a stand post into the rack top
    sc = SCREEN
    post_top, post_bot = iso.p(W / 2, D / 2, sc["z0"]), iso.p(W / 2, D / 2, H)
    out.append(f'<path d="M{post_bot[0]:.1f} {post_bot[1]:.1f} V{post_top[1]:.1f}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
               f'<path d="M{post_bot[0]:.1f} {post_bot[1]:.1f} V{post_top[1]:.1f}" stroke="#4a5873" stroke-width="3.5" stroke-linecap="round"/>')
    out.append(box(iso, sc["x0"], sc["x1"], sc["y"] - sc["t"], sc["y"], sc["z0"], sc["z1"], "#4a5873", "#0f172a", "#1c2433"))
    u0, u1, v0, v1 = sc["x0"], sc["x1"], -sc["z1"], -sc["z0"]
    g = [f'<g transform="{iso.front(sc["y"])}">']
    g.append(f'<path d="M{u0 + 2} {v0 + 9} H{u1 - 2}" stroke="#334155" stroke-width="1.5" {ns}/>')
    for i, col in enumerate(("#ef4444", "#f59e0b", "#22c55e")):
        g.append(f'<circle cx="{u0 + 6 + i * 5}" cy="{v0 + 4.5}" r="1.6" fill="{col}"/>')
    g.append(f'<text x="{u1 - 4}" y="{v0 + 7}" font-family="ui-monospace,Consolas,monospace" font-weight="700" font-size="5" fill="#94a3b8" text-anchor="end">SIEM</text>')
    base = v0 + 52
    for i, (hgt, col) in enumerate(((10, "#3b82f6"), (15, "#3b82f6"), (8, "#3b82f6"), (36, "#ef4444"), (12, "#3b82f6"))):
        g.append(f'<rect x="{u0 + 6 + i * 7}" y="{base - hgt}" width="5" height="{hgt}" rx="0.8" fill="{col}"/>')
    g.append(f'<path d="M{u0 + 4} {base} H{u0 + 42}" stroke="#475569" stroke-width="1.2" {ns}/>')
    ax = u0 + 46
    g.append(f'<rect x="{ax}" y="{v0 + 14}" width="{u1 - ax - 4}" height="38" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.6" {ns}/>')
    g.append(f'<rect x="{ax + 4}" y="{v0 + 18}" width="26" height="9" rx="4.5" fill="#ef4444"/>')
    g.append(f'<text x="{ax + 17}" y="{v0 + 24.6}" font-family="system-ui,Segoe UI,Arial,sans-serif" font-weight="800" font-size="5.6" fill="#fff" text-anchor="middle">ALERT</text>')
    g.append(f'<text x="{ax + 4}" y="{v0 + 36}" font-family="ui-monospace,Consolas,monospace" font-weight="700" font-size="6" fill="#f5f6f8">rule 5712</text>')
    g.append(f'<text x="{ax + 4}" y="{v0 + 46}" font-family="ui-monospace,Consolas,monospace" font-weight="700" font-size="5.2" fill="#fca5a5">ssh brute force</text>')
    g.append(f'<text x="{u0 + 5}" y="{v1 - 7}" font-family="ui-monospace,Consolas,monospace" font-weight="700" font-size="6.2" fill="#22c55e">$ ufw deny from &lt;ip&gt;</text>')
    g.append(f'<rect x="{u1 - 10}" y="{v1 - 13}" width="4" height="7" fill="#f5f6f8"/>')
    g.append("</g>")
    out.append("\n".join(g))

    # Extruded shield in front of the rack
    sd = SHIELD
    def shield_path(dy):
        x, w, z, h = sd["x"], sd["w"], sd["z"], sd["h"]
        cx = x + w / 2
        pts = [(cx, z + h), (x + w, z + h - 8), (x + w, z + 26), (cx, z), (x, z + 26), (x, z + h - 8)]
        q = [iso.p(px, sd["y"] + dy, pz) for px, pz in pts]
        # Rounded bottom: quadratic curves through the tip
        return (f'M{q[0][0]:.1f} {q[0][1]:.1f} L{q[1][0]:.1f} {q[1][1]:.1f} L{q[2][0]:.1f} {q[2][1]:.1f} '
                f'Q{iso.p(x + w, sd["y"] + dy, z + 8)[0]:.1f} {iso.p(x + w, sd["y"] + dy, z + 8)[1]:.1f} {q[3][0]:.1f} {q[3][1]:.1f} '
                f'Q{iso.p(x, sd["y"] + dy, z + 8)[0]:.1f} {iso.p(x, sd["y"] + dy, z + 8)[1]:.1f} {q[4][0]:.1f} {q[4][1]:.1f} '
                f'L{q[5][0]:.1f} {q[5][1]:.1f} Z')
    out.append(f'<path d="{shield_path(-sd["t"])}" fill="#1d3fa8" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>')
    for i in range(1, 4):  # fill the extrusion gap
        out.append(f'<path d="{shield_path(-sd["t"] * i / 4)}" fill="#1d3fa8"/>')
    out.append(f'<path d="{shield_path(0)}" fill="url(#g-shield)" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>')
    lk = [f'<g transform="{iso.front(sd["y"])}">']
    cx, cz = sd["x"] + sd["w"] / 2, sd["z"] + 30
    lk.append(f'<path d="M{cx - 7} {-cz} v-7 a7 7 0 0 1 14 0 v7" fill="none" stroke="{INK}" stroke-width="2.6" {ns}/>')
    lk.append(f'<rect x="{cx - 11}" y="{-cz}" width="22" height="17" rx="3" fill="#f5f6f8" stroke="{INK}" stroke-width="2.6" {ns}/>')
    lk.append(f'<circle cx="{cx}" cy="{-cz + 7}" r="2.6" fill="{INK}"/><path d="M{cx} {-cz + 8} v5" stroke="{INK}" stroke-width="2" stroke-linecap="round" {ns}/>')
    lk.append("</g>")
    out.append("\n".join(lk))
    return out


def floor_shadow(iso):
    """Pop-art floor shadow, drawn outside the sticker rim so it stays a soft tint."""
    sh = [iso.p(x, y, 0) for x, y in ((-6, -6), (W + 16, -6), (W + 16, D + 22), (-6, D + 22))]
    return f'<polygon points="{" ".join(f"{a:.2f},{b:.2f}" for a, b in sh)}" fill="{BLUE}" opacity="0.3"/>'


def bounds(iso):
    pts = [iso.p(x, y, z) for x, y, z in (
        (-6, -6, 0), (W + 16, -6, 0), (W + 16, D + 22, 0), (-6, D + 22, 0),   # floor shadow
        (W, 0, H), (SCREEN["x1"], SCREEN["y"] - SCREEN["t"], SCREEN["z1"]),     # rack and screen, right/top
        (SCREEN["x0"], SCREEN["y"], SCREEN["z1"]), (-42, D + 8, H + 66),       # screen and nodes, left
        (-16, D + 8, H + 134), (SHIELD["x"], SHIELD["y"], SHIELD["z"]))]
    pts += [(x - 12, y - 12) for x, y in pts[-3:]] + [(x + 12, y + 12) for x, y in pts[-3:]]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), max(xs), min(ys), max(ys)


def main():
    probe = Iso(1, 0, 0)
    x0, x1, y0, y1 = bounds(probe)
    s = min((CW - 16) / (x1 - x0), (CH - 16) / (y1 - y0))
    iso = Iso(s, 0, 0)
    x0, x1, y0, y1 = bounds(iso)
    iso.ox, iso.oy = (CW - (x1 - x0)) / 2 - x0, CH - 8 - y1

    defs = f"""<defs>
  <radialGradient id="g-teal" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#0f766e"/></radialGradient>
  <radialGradient id="g-violet" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></radialGradient>
  <radialGradient id="g-white" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cbd5e1"/></radialGradient>
  <linearGradient id="g-shield" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8bff"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient>
  <filter id="rim" x="-5%" y="-5%" width="110%" height="110%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="grown"/>
    <feFlood flood-color="#ffffff"/>
    <feComposite in2="grown" operator="in"/>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>"""
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CW} {CH}" width="{CW}" height="{CH}">\n'
           '<title>Isometric rack with a firewall, switch, and Linux servers, a floating SIEM screen showing an SSH '
           'brute-force alert, and a shield</title>\n'
           f'<metadata>ImageDescription: {CTF_NOTE}</metadata>\n'
           f'{defs}\n{floor_shadow(iso)}\n<g filter="url(#rim)">\n' + "\n".join(scene(iso)) + "\n</g>\n</svg>\n")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg, encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(svg.encode()) // 1024} KB, scale {s:.2f})")


if __name__ == "__main__":
    main()
