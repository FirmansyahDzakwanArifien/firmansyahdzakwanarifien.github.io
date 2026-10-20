#!/usr/bin/env bash
#
# Create a new post with the site's front matter, ready to edit.
#
# Usage:
#   bash tools/new-post.sh "Post title"                 # regular post
#   bash tools/new-post.sh "Fortinet NSE 6" --cert      # certification post (also add it to _data/certifications.yml)
#
# The file lands in _posts/YYYY-MM-DD-slug.md and the URL becomes /posts/slug/.

set -euo pipefail

title="${1:-}"
kind="${2:-}"
if [ -z "$title" ]; then
  echo "usage: bash tools/new-post.sh \"Post title\" [--cert]" >&2
  exit 1
fi

safe_title=$(printf '%s' "$title" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')  # escaped for a double-quoted YAML string
slug=$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
date_day=$(date +%Y-%m-%d)
file="_posts/${date_day}-${slug}.md"
cdn="https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/posts"

if [ -e "$file" ]; then
  echo "already exists: $file" >&2
  exit 1
fi

if [ "$kind" = "--cert" ]; then
  extra="type: certification
issuer: ISSUER NAME
categories: [Certification, Cybersecurity]
tags: [Certification]"
else
  extra="categories: [Learning, Cybersecurity]
tags: []"
fi

cat > "$file" <<EOF
---
title: "${safe_title}"
date: $(date '+%Y-%m-%d %H:%M:%S %z')
description: One or two sentences shown in previews and search results.
${extra}
image:
  path: ${cdn}/${slug}.webp
  alt: "${safe_title}"
---

Write the post here. Images go in the assets repo (blog/img/posts/), compressed to WebP first.
EOF

echo "created $file"
echo "url after deploy: /posts/${slug}/"
