#!/usr/bin/env bash
#
# Check that every jsDelivr asset referenced by the built site is reachable, and that the
# assets repo stays under jsDelivr's 50 MB package limit (beyond it, new files return 403).
#
# Usage: bash tools/check-assets.sh [site_dir]   (needs curl; gh for the size check)

set -uo pipefail

SITE_DIR="${1:-_site}"
ASSETS_REPO="firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets"
WARN_MB=40
LIMIT_MB=50
status=0

urls=$(grep -rhoE "https://cdn\.jsdelivr\.net/gh/[^\"' )<>]+" "$SITE_DIR" --include='*.html' --include='*.xml' --include='*.json' |
  sed 's/&amp;/\&/g' | sort -u)
count=$(printf '%s\n' "$urls" | grep -c . || true)
echo "Checking $count jsDelivr URLs..."

failed=$(printf '%s\n' "$urls" | grep . | xargs -P 8 -I{} sh -c \
  'code=$(curl -s -o /dev/null -L --max-time 30 -w "%{http_code}" "{}"); [ "$code" = "200" ] || echo "$code {}"')

if [ -n "$failed" ]; then
  printf '%s\n' "$failed" | while read -r code url; do
    echo "::error::HTTP $code for $url"
  done
  status=1
else
  echo "All $count jsDelivr URLs return 200."
fi

if command -v gh >/dev/null 2>&1; then
  bytes=$(gh api "repos/$ASSETS_REPO/git/trees/HEAD?recursive=1" --jq '[.tree[] | select(.type == "blob") | .size] | add')
  mb=$(awk -v b="$bytes" 'BEGIN { printf "%.1f", b / 1000000 }')
  echo "Assets repo size: $mb MB (jsDelivr limit: $LIMIT_MB MB)"
  if awk -v m="$mb" -v l="$LIMIT_MB" 'BEGIN { exit !(m >= l) }'; then
    echo "::error::Assets repo is $mb MB, over the jsDelivr limit of $LIMIT_MB MB. New files will return 403."
    status=1
  elif awk -v m="$mb" -v w="$WARN_MB" 'BEGIN { exit !(m >= w) }'; then
    echo "::warning::Assets repo is $mb MB, getting close to the jsDelivr limit of $LIMIT_MB MB. Compress images before adding more."
  fi
fi

exit $status
