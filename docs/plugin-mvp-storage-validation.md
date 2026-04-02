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

## PMVP-T14: External Output Directory

- Validation date: 2026-04-02
- Output path under test: an absolute external directory outside the vault root
- Validation surface: the same runtime entrypoints the Provenance panel calls, `generatePanelResponse` and `saveGeneratedResponse`
- Runtime composition under test:
  - Obsidian active-note adapter
  - shared mock `LLMGateway`
  - filesystem artifact writer with an absolute external output configuration

### Observed Outcome

The external-directory configuration also succeeds end to end against a temporary fixture. A markdown note at `notes/source-note.md` generated a response and saved an artifact at an absolute `external-artifacts/source-note-research.md` path outside the vault root while still honoring the configured output-root boundary.

### Storage Notes

- Setup friction: the external mode requires the operator to choose and maintain a machine-owned directory outside the vault instead of relying on a repo-local default such as `.provenance/...`.
- Path safety behavior: the writer still constrains saves to the configured output root, so switching from a relative in-vault path to an absolute external path changes the storage location but does not bypass the boundary guard.
- Browsing ergonomics: external storage cleanly separates machine-owned artifacts from the vault tree, but the panel now reports an absolute filesystem path rather than a vault-relative location, which is less convenient for manual navigation inside Obsidian.

### Evidence

- Automated validation: `apps/provenance-obsidian-plugin/src/services/runtime.test.ts`

## PMVP-T15: MVP Decision and Final Validation

- Decision date: 2026-04-02
- Recommended MVP storage default: keep generated artifacts inside the vault under `.provenance/knowledge/research`
- Validation gate: `bun run check`

### Decision Summary

The MVP should default to the in-vault `.provenance/...` storage model. It preserves the machine-owned boundary, keeps the reported save location vault-relative, and avoids the extra setup step required by an external directory while still using the same guarded writer and collision policy. External output should remain supported as an override for operators who need stronger separation from the vault tree.

Pi integration is suitable for the MVP as an optional runtime mode behind the shared `LLMGateway` contract, not as the default validation path. The adapter is now isolated behind the same workflow surface as mock mode, but deterministic mock mode remains the right default for repo validation because it is stable, credential-free, and exercises the same panel and save flow.

The panel workflow is useful enough for the MVP because the same runtime path now covers active-note reads, typed generation failures, deterministic or Pi-backed generation, and guarded artifact saves. The main remaining caveat is still desktop-only: this repo-level validation does not confirm how Obsidian indexes or surfaces dot-prefixed `.provenance` folders in the file explorer, search, or graph views.

### Evidence

- Storage validation: `apps/provenance-obsidian-plugin/src/services/runtime.test.ts`
- Typed workflow and gateway coverage: `packages/engine/test/workflows.test.ts`
- Save-boundary and panel failure coverage: `apps/provenance-obsidian-plugin/src/services/artifactWriter.test.ts`, `apps/provenance-obsidian-plugin/src/ui/panelFailure.test.ts`
