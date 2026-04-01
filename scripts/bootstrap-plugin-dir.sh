#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/your/vault/.obsidian/plugins/provenance-mvp"
  exit 1
fi

TARGET="$1"
mkdir -p "$TARGET"
cp apps/provenance-obsidian-plugin/manifest.json "$TARGET/manifest.json"
echo "Copy your built dist/main.js into $TARGET/main.js after running the build."
