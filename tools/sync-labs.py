#!/usr/bin/env python3
"""Add new Hashnode writeups to _data/labs.yml.

Reads the blog's RSS feed, keeps posts that look like security writeups, and prepends an entry
for every one whose URL is not in labs.yml yet. Platform, kind, and difficulty are best guesses
from the title and text, so the result is meant to be reviewed in a pull request.

Usage: python3 tools/sync-labs.py [labs.yml]   (prints the titles it added)
"""
import html
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

FEED = "https://blog.cyphera.my.id/rss.xml"
LABS = sys.argv[1] if len(sys.argv) > 1 else "_data/labs.yml"

WRITEUP = re.compile(r"ctf|htb|hack the box|sherlock|cyberdefenders|tryhackme|\bthm\b|write-?up|cve-\d|vulnerab|forensic", re.I)

PLATFORMS = [
    (r"sherlock", "Hack The Box · Sherlock"),
    (r"hack the box|\bhtb\b", "Hack The Box"),
    (r"picoctf\s*(\d{4})?", "picoCTF"),
    (r"cyberdefenders", "CyberDefenders"),
    (r"tryhackme|\bthm\b", "TryHackMe"),
    (r"cve-\d|vulnerab", "Vulnerability analysis"),
]

KINDS = [
    (r"cve-\d|vulnerab|privilege escalation", "vuln"),
    (r"network|pcap|traffic|wireshark|jaringan|lalu lintas|smb|lateral movement", "network"),
    (r"\blogs?\b|event log|auth\.log|evtx", "logs"),
    (r"\bctf\b", "ctf"),
]


def text(el, tag):
    found = el.find(tag)
    return (found.text or "").strip() if found is not None else ""


def plain(raw):
    raw = re.sub(r"<[^>]+>", " ", html.unescape(raw))
    return re.sub(r"\s+", " ", raw).strip()


def guess_platform(title, body):
    for pattern, name in PLATFORMS:
        m = re.search(pattern, title, re.I) or re.search(pattern, body[:400], re.I)
        if m:
            if name == "picoCTF" and m.lastindex and m.group(1):
                return f"picoCTF {m.group(1)}"
            return name
    return "Writeup"


def guess_kind(title, body):
    for pattern, kind in KINDS:
        if re.search(pattern, title, re.I):
            return kind
    for pattern, kind in KINDS:
        if re.search(pattern, body[:600], re.I):
            return kind
    return "dfir"


def short_title(title):
    title = re.sub(r"^(htb|hack the box)?\s*sherlock\s*write-?up\s*", "", title, flags=re.I)
    return re.split(r"\s+[—–-]\s+", title)[0].strip() or title


def summary_of(body):
    scenario = re.search(r"\bscenario\s+(.+)", body, re.I)
    if scenario:
        body = scenario.group(1)
    body = re.sub(r"^(introduction|challenge overview|challenge information)\s*", "", body, flags=re.I)
    first = re.split(r"(?<=[.!?])\s", body, maxsplit=1)[0]
    return (first[:220].rsplit(" ", 1)[0] + "…") if len(first) > 220 else first


def yaml_str(value):
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main():
    req = urllib.request.Request(FEED, headers={"User-Agent": "cyphera-labs-sync/1.0 (+https://cyphera.my.id)"})
    with urllib.request.urlopen(req, timeout=30) as res:
        root = ET.fromstring(res.read())

    labs = open(LABS, encoding="utf-8").read()
    known = set(re.findall(r"^\s*url:\s*(\S+)", labs, re.M))

    entries, added = [], []
    for item in root.iter("item"):
        title, link = plain(text(item, "title")), text(item, "link")
        body = plain(text(item, "description"))
        if link in known or not WRITEUP.search(title):
            continue
        date = parsedate_to_datetime(text(item, "pubDate")).date().isoformat()
        diff = re.search(r"difficulty\s+(very easy|easy|medium|hard|insane)", body, re.I)
        entries.append("\n".join([
            f"- title: {yaml_str(short_title(title))}",
            f"  platform: {guess_platform(title, body)}",
            f"  kind: {guess_kind(title, body)}",
            f"  difficulty: {diff.group(1).title() if diff else ''}".rstrip(),
            f"  date: {date}",
            f"  summary: {yaml_str(summary_of(body))}",
            "  tools: []",
            f"  url: {link}",
        ]))
        added.append(title)

    if not entries:
        return

    # Insert after the header comments so the newest entries stay on top.
    head, sep, rest = labs.partition("\n- ")
    labs = head.rstrip("\n") + "\n\n" + "\n\n".join(entries) + "\n\n- " + rest
    open(LABS, "w", encoding="utf-8", newline="\n").write(labs)
    print("\n".join(added))


if __name__ == "__main__":
    main()
