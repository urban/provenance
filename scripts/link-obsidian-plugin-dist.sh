#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/vault" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
SOURCE_DIR="$REPO_ROOT/apps/provenance-obsidian-plugin/dist"
VAULT_DIR="$1"
OBSIDIAN_DIR="$VAULT_DIR/.obsidian"
PLUGINS_DIR="$OBSIDIAN_DIR/plugins"
PLUGIN_DIR="$PLUGINS_DIR/provenance-mvp"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source dist directory does not exist: $SOURCE_DIR" >&2
  echo "Run the plugin build first." >&2
  exit 1
fi

if [[ ! -d "$OBSIDIAN_DIR" ]]; then
  echo "Not a valid Obsidian vault: missing $OBSIDIAN_DIR" >&2
  exit 1
fi

mkdir -p "$PLUGINS_DIR"

if [[ -L "$PLUGIN_DIR" ]]; then
  rm "$PLUGIN_DIR"
elif [[ -d "$PLUGIN_DIR" ]]; then
  rm -rf "$PLUGIN_DIR"
elif [[ -e "$PLUGIN_DIR" ]]; then
  rm -f "$PLUGIN_DIR"
fi

ln -s "$SOURCE_DIR" "$PLUGIN_DIR"

echo "Linked:"
echo "  $PLUGIN_DIR -> $SOURCE_DIR"
