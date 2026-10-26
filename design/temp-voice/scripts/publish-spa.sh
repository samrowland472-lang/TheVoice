#!/bin/bash
# Publish only the vanilla studio. Never ship aether/ or design/ Grok
# workspaces — they leak source, lockfiles, and auth helpers.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/dist"
rm -rf "$out"
mkdir -p "$out/js"

copy_if() {
  if [ -f "$root/$1" ]; then
    mkdir -p "$out/$(dirname "$1")"
    cp "$root/$1" "$out/$1"
  fi
}

copy_if index.html
copy_if style.css
copy_if theme.css
copy_if ui-shell.js
copy_if favicon.svg
copy_if 404.html
copy_if hero-range.jpg
copy_if og.jpg

for f in "$root"/js/*.js; do
  cp "$f" "$out/js/$(basename "$f")"
done

echo "spa dist: $(find "$out" -type f | wc -l) files"
