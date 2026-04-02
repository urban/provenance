# Plugin MVP Storage Validation

## PMVP-T13: In-Vault Machine-Owned Path

- Validation date: 2026-04-02
- Output path under test: `.provenance/knowledge/research`
- Validation surface: the same runtime entrypoints the Provenance panel calls, `generatePanelResponse` and `saveGeneratedResponse`
- Runtime composition under test:
  - Obsidian active-note adapter
  - shared mock `LLMGateway`
  - filesystem artifact writer with in-vault output configuration

### Observed Outcome

The in-vault configuration succeeds end to end against a temporary vault fixture. A markdown note at `notes/source-note.md` generated a response and saved an artifact at `.provenance/knowledge/research/source-note-research.md` without violating the write boundary. The saved artifact kept the expected heading, metadata section, and response body.

### Storage Notes

- Visibility: the returned save path is relative to the vault root, so the panel can show an operator-facing location without leaking an absolute machine path.
- Ergonomics: keeping generated files under `.provenance/...` preserves a clear folder boundary between human-authored notes and machine-owned artifacts while still keeping the artifacts inside the same vault tree.
- Indexing behavior: not directly verified in this headless repo environment. The validation run confirms filesystem placement only; a literal desktop Obsidian click-through is still needed to confirm how dot-prefixed folders appear in the file explorer, search, and graph views.

### Evidence

- Automated validation: `apps/provenance-obsidian-plugin/src/services/runtime.test.ts`
