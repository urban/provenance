---
"@urban/provenance-engine": patch
"@urban/provenance-obsidian-plugin": patch
"@urban/provenance-shared": patch
---

Move the Plugin MVP specification pack to `.specs/plugin-mvp`, keep the local README aligned with the pack contents, wire the Obsidian plugin runtime to read real active-note context through an `ActiveNoteReader` adapter, and make persisted plugin settings update runtime-backed panel behavior without requiring reload.
