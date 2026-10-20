#!/usr/bin/env python3
"""Fail if the built site contains inline JavaScript, which the CSP (no 'unsafe-inline') would block.

Flags <script> blocks without src (JSON data blocks are fine), on*="..." event handler attributes,
and javascript: URLs. Put scripts in assets/js/custom/ and wire events with addEventListener.

Usage: python3 tools/check-inline.py [site_dir]
"""
import pathlib
import re
import sys

site = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
DATA_TYPES = {"application/ld+json", "application/json"}

SCRIPT = re.compile(r"<script\b([^>]*)>", re.I)
HANDLER = re.compile(r"<[a-z][^>]*?\son[a-z]+\s*=", re.I)
JS_URL = re.compile(r"""(?:href|src|action)\s*=\s*["']?\s*javascript:""", re.I)
TYPE = re.compile(r"""\btype\s*=\s*["']?([^"'\s>]+)""", re.I)

problems = []
for page in sorted(site.rglob("*.html")):
    html = page.read_text(encoding="utf-8", errors="ignore")
    rel = page.relative_to(site)
    for m in SCRIPT.finditer(html):
        attrs = m.group(1)
        if re.search(r"\bsrc\s*=", attrs, re.I):
            continue
        t = TYPE.search(attrs)
        if t and t.group(1).lower() in DATA_TYPES:
            continue
        problems.append(f"{rel}: inline <script{attrs}>")
    for m in HANDLER.finditer(html):
        problems.append(f"{rel}: inline event handler in {m.group(0)[:80]}...")
    for m in JS_URL.finditer(html):
        problems.append(f"{rel}: javascript: URL")

for p in problems:
    print(f"::error::{p}")
count = len(list(site.rglob("*.html")))
print(f"Scanned {count} pages: {'no inline JavaScript' if not problems else f'{len(problems)} problem(s)'}")
sys.exit(1 if problems else 0)
