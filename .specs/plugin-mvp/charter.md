---
name: plugin-mvp
created_at: 2026-04-01T22:50:46Z
updated_at: 2026-04-01T22:50:46Z
generated_by:
  root_skill: specification-authoring
  producing_skill: charter
  skills_used:
    - specification-authoring
    - charter
    - artifact-naming
    - document-traceability
    - write-charter
  skill_graph:
    specification-authoring:
      - charter
    charter:
      - artifact-naming
      - document-traceability
      - write-charter
    artifact-naming: []
    document-traceability: []
    write-charter:
      - document-traceability
source_artifacts: {}
---

## Goals

- Validate a small Obsidian plugin MVP that can read the active note, use that note as LLM context, and return useful assistance inside the authoring workflow.
- Preserve a hard authorship boundary so generated artifacts remain in an LLM-owned location and never become implicit writes into the human-authored note space.
- Evaluate at least two storage configurations for LLM-owned artifacts so the team can choose a longer-term storage model from observed behavior rather than preference.
- Establish a lightweight Effect-native architecture with narrow service boundaries that matches the repository's existing `packages/engine`, `packages/shared`, and Obsidian app split.
- Keep the MVP small enough to learn from quickly, with enough validation to decide whether the plugin interaction model and Pi-backed LLM integration are worth deeper investment.

## Non-Goals

- Ship a production-polished Obsidian plugin UI, marketplace-ready packaging, or mobile support in this phase.
- Let the LLM write directly into the human-authored vault area or automatically rewrite the source note.
- Build long-term memory, semantic search, embeddings, graph intelligence, or multi-agent orchestration into the MVP.
- Commit to a permanent storage architecture before the team has compared in-vault and external LLM-owned artifact locations.
- Expand Pi usage beyond the narrow adapter boundary needed to validate the MVP workflow.

## Personas / Actors

- Human Author: writes notes in Obsidian, asks for assistance, and decides whether generated artifacts are useful enough to keep.
- Plugin Developer: implements and validates the plugin, storage boundary enforcement, and Effect-based service seams.
- Research Assistant LLM: produces research-oriented artifacts and Socratic prompts from active-note context without owning the human-authored note space.
- Local Environment Administrator: configures vault paths, external output directories, and local runtime conditions needed to test storage options.

## Success Criteria

- SC1.1: The Obsidian plugin loads in the desktop environment and exposes a working chat surface without requiring a hosted backend.
- SC1.2: The plugin can read the active note and include its content in an LLM request used for in-context assistance.
- SC1.3: The plugin can generate and persist at least one markdown artifact type, such as a research note, from active-note context.
- SC1.4: All plugin-managed artifact writes are confined to a configured LLM-owned output location, and attempted writes outside that boundary are blocked.
- SC1.5: At least two storage configurations are exercised successfully, with enough evidence to compare usability, visibility, and operational friction.
- SC1.6: Human-authored note locations remain untouched by generated output unless the human manually copies content across the boundary.
- SC1.7: The resulting implementation shape aligns with the repository's Effect-first engine and shared package boundaries closely enough to extend without a rewrite.
- SC1.8: The team finishes the MVP with a defensible decision about whether the plugin workflow, storage model, and Pi-backed adapter deserve the next implementation phase.
