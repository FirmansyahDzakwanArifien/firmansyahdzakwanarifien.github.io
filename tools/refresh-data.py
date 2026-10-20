#!/usr/bin/env python3
"""Refresh the build-time data behind the live widgets, so visitors never call third-party APIs.

  _data/kev.json        newest CISA Known Exploited Vulnerabilities  (Threat Watch, Labs page)
  _data/github.json     public contribution calendar + recently pushed repos  (home page)
  _data/scorecard.json  this site's Mozilla Observatory grade + security headers  (home page)

Usage: python3 tools/refresh-data.py [kev|github|scorecard ...]   (default: all)
Each source is independent: a failing source keeps its previous file and the script exits 1.
"""
import html
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

USER = "FirmansyahDzakwanArifien"
SITE = "cyphera.my.id"
UA = {"User-Agent": "cyphera-data-refresh/1.0 (+https://cyphera.my.id)"}


def get(url, method="GET", headers=None):
    req = urllib.request.Request(url, method=method, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read().decode("utf-8"), res.headers


def write(name, data):
    path = f"_data/{name}.json"
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {path}")


def kev():
    body, _ = get("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json")
    feed = json.loads(body)
    vulns = sorted(feed["vulnerabilities"], key=lambda v: (v["dateAdded"], v["cveID"]), reverse=True)[:6]
    write("kev", {
        "catalog_version": feed.get("catalogVersion"),
        "total": feed.get("count", len(feed["vulnerabilities"])),
        "items": [{
            "cve": v["cveID"],
            "vendor": v["vendorProject"],
            "product": v["product"],
            "name": v["vulnerabilityName"],
            "added": v["dateAdded"],
            "due": v.get("dueDate"),
            "ransomware": v.get("knownRansomwareCampaignUse") == "Known",
        } for v in vulns],
    })


def github():
    page, _ = get(f"https://github.com/users/{USER}/contributions")
    levels = {}
    for cell in re.finditer(r'<td[^>]*class="ContributionCalendar-day"[^>]*>', page):
        tag = cell.group(0)
        date = re.search(r'data-date="([\d-]+)"', tag)
        level = re.search(r'data-level="(\d)"', tag)
        cid = re.search(r'id="([^"]+)"', tag)
        if date and level:
            levels[cid.group(1) if cid else date.group(1)] = (date.group(1), int(level.group(1)))
    counts = {}
    for tip in re.finditer(r'<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</tool-tip>', page):
        m = re.match(r"\s*(\d+|No) contribution", html.unescape(tip.group(2)))
        counts[tip.group(1)] = 0 if not m or m.group(1) == "No" else int(m.group(1))
    days = sorted(((d, lvl, counts.get(k, 0)) for k, (d, lvl) in levels.items()))
    if not days:
        raise RuntimeError("contribution calendar not found (GitHub markup changed?)")

    headers = {"Accept": "application/vnd.github+json"}
    if os.environ.get("GH_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['GH_TOKEN']}"
    body, _ = get(f"https://api.github.com/users/{USER}/repos?sort=pushed&per_page=30&type=owner", headers=headers)
    repos = [r for r in json.loads(body) if not r["fork"] and not r["archived"] and not r["private"]][:4]

    write("github", {
        "total": sum(c for _, _, c in days),
        "first": days[0][0],
        "days": [[d, lvl] for d, lvl, _ in days],
        "repos": [{
            "name": r["name"],
            "description": r["description"] or "",
            "language": r["language"] or "",
            "stars": r["stargazers_count"],
            "pushed": r["pushed_at"][:10],
            "url": r["html_url"],
        } for r in repos],
    })


# What each header does, shown under its value on the home page.
HEADER_PURPOSE = {
    "Strict-Transport-Security": "Browsers only ever connect over HTTPS, even if a link says http://.",
    "Content-Security-Policy": "Only approved sources may load; injected scripts, plugins, and framing are blocked.",
    "X-Frame-Options": "No other site can embed these pages in a frame (clickjacking).",
    "X-Content-Type-Options": "Files are only used as their declared type, never guessed (MIME sniffing).",
    "Referrer-Policy": "Other sites only see the domain a visitor came from, not the full URL.",
    "Permissions-Policy": "Browser features the site never uses are switched off for it and any embed.",
}


def summarize(name, value):
    """A short, specific reading of a header value for the scorecard."""
    if value is None:
        return "missing"
    if name == "Strict-Transport-Security":
        age = re.search(r"max-age=(\d+)", value)
        parts = [f"max-age {int(age.group(1)) // 86400} days" if age else value]
        parts += [flag for flag in ("includeSubDomains", "preload") if flag.lower() in value.lower()]
        return " · ".join(parts)
    if name == "Content-Security-Policy":
        policy = {d.split()[0]: d.split()[1:] for d in (x.strip() for x in value.split(";")) if d}
        scripts = policy.get("script-src", policy.get("default-src", []))
        parts = ["inline JS blocked" if "'unsafe-inline'" not in scripts else "inline JS allowed",
                 f"scripts from self + {len([s for s in scripts if s.startswith('https://')])} origins"]
        parts += [f"{d} {' '.join(policy[d])}" for d in ("object-src", "frame-ancestors", "base-uri") if d in policy]
        return " · ".join(parts)
    if name == "Permissions-Policy":
        off = re.findall(r"([a-z-]+)=\(\)", value)
        return f"{', '.join(off)} off" if off else value
    return value


def scorecard():
    body, _ = get(f"https://observatory-api.mdn.mozilla.net/api/v2/scan?host={SITE}", method="POST")
    scan = json.loads(body)
    if scan.get("error"):
        raise RuntimeError(f"observatory: {scan['error']}")
    _, headers = get(f"https://{SITE}/", method="HEAD")
    write("scorecard", {
        "grade": scan["grade"],
        "score": scan["score"],
        "passed": scan["tests_passed"],
        "total": scan["tests_quantity"],
        "checked": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "report": f"https://developer.mozilla.org/en-US/observatory/analyze?host={SITE}",
        "headers": [{
            "name": h,
            "present": headers.get(h) is not None,
            "value": summarize(h, headers.get(h)),
            "purpose": purpose,
        } for h, purpose in HEADER_PURPOSE.items()],
    })


SOURCES = {"kev": kev, "github": github, "scorecard": scorecard}

if __name__ == "__main__":
    failed = False
    for name in (sys.argv[1:] or SOURCES):
        try:
            SOURCES[name]()
        except Exception as exc:  # keep the other sources and the previous file
            print(f"::warning::{name} refresh failed: {exc}")
            failed = True
    sys.exit(1 if failed else 0)
