#!/usr/bin/env python3
"""Print the SHA-256 of a CTF flag for _data/ctf.yml. Usage: python3 tools/ctf-hash.py 'cyphera{...}'"""
import hashlib
import sys

for flag in sys.argv[1:]:
    print(hashlib.sha256(flag.strip().encode("utf-8")).hexdigest(), flag)
