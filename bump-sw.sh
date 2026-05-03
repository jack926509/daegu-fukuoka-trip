#!/bin/sh
# Bump sw.js BUILD to current timestamp so PWA users invalidate cached assets.
# Usage: ./bump-sw.sh   (run before git commit)

set -e
cd "$(dirname "$0")"

if [ ! -f sw.js ]; then
  echo "✗ sw.js not found in $(pwd)" >&2
  exit 1
fi

NEW_BUILD="$(date -u +%Y%m%d-%H%M%S)"

# macOS sed needs -i ''; GNU sed needs -i. Use a temp file for portability.
awk -v build="$NEW_BUILD" '
  /^const BUILD = / { print "const BUILD = \x27" build "\x27;"; next }
  { print }
' sw.js > sw.js.tmp && mv sw.js.tmp sw.js

echo "✓ sw.js BUILD → $NEW_BUILD"
