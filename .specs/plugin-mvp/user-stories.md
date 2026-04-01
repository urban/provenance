---
name: plugin-mvp
created_at: 2026-04-01T22:50:46Z
updated_at: 2026-04-01T22:50:46Z
generated_by:
  root_skill: specification-authoring
  producing_skill: user-story-authoring
  skills_used:
    - specification-authoring
    - user-story-authoring
    - artifact-naming
    - document-traceability
    - visual-diagramming
    - write-user-stories
  skill_graph:
    specification-authoring:
      - user-story-authoring
    user-story-authoring:
      - artifact-naming
      - document-traceability
      - visual-diagramming
      - write-user-stories
    artifact-naming: []
    document-traceability: []
    visual-diagramming: []
    write-user-stories:
      - document-traceability
source_artifacts:
  charter: .specs/plugin-mvp/charter.md
---

# Plugin MVP User Stories

## In-Context Author Assistance

1. As a Human Author, I want to open a Provenance chat panel while I am writing a note, so that I can ask for help without leaving the Obsidian authoring workflow.
2. As a Human Author, I want the plugin to use my active note as context for an LLM request, so that the assistance I receive stays grounded in what I am currently writing.
3. As a Human Author, I want to ask for research based on the current note, so that I can generate supporting material without mixing machine-written content into the note itself.
4. As a Human Author, I want to ask for Socratic questions about the current note, so that I can deepen or challenge my thinking while keeping ownership of the note's final wording.
5. As a Human Author, I want to see the LLM response inside the plugin panel, so that I can judge whether the generated material is useful before saving it as an artifact.

## Artifact Saving and Review

6. As a Human Author, I want to save a useful LLM response as a markdown artifact, so that I can keep generated research or prompts for later review.
7. As a Human Author, I want saved artifacts to include enough source-note context and metadata to understand where they came from, so that I can trust and revisit generated material later.
8. As a Human Author, I want generated artifacts to live in a clearly separate machine-owned location, so that I can distinguish them from my human-authored notes at a glance.
9. As a Human Author, I want to inspect generated artifacts in the chosen storage location or a separate Obsidian view, so that stored machine output remains usable after the chat interaction ends.

## Boundary Enforcement and Configuration

10. As a Plugin Developer, I want artifact writes outside the configured machine-owned path to be rejected, so that the system enforces the authorship boundary even when configuration or implementation mistakes happen.
11. As a Plugin Developer, I want to configure the allowed artifact output path, so that I can test different storage models without changing the core workflow.
12. As a Human Author, I want confidence that the plugin never writes LLM output into my human-authored note area, so that I can use the assistant without worrying that my notes will be silently changed.
13. As a Plugin Developer, I want plugin settings to persist across restarts, so that storage and runtime configuration do not need to be re-entered every time I open Obsidian.

## Architecture and Validation

14. As a Plugin Developer, I want the application code to depend on a narrow LLM gateway instead of Pi-specific calls throughout the codebase, so that I can change or replace the LLM integration without rewriting the plugin.
15. As a Plugin Developer, I want note reading, LLM calls, and artifact writing to sit behind explicit Effect-native service boundaries, so that I can test workflows with substituted layers and keep side effects controlled.
16. As a Plugin Developer, I want to validate at least two artifact storage configurations during the MVP, so that the team can choose the next-phase storage architecture from observed tradeoffs.
17. As a Plugin Developer, I want the implementation to align with the repository's existing `packages/engine`, `packages/shared`, and Obsidian app boundaries, so that the MVP grows from the current codebase instead of starting over.
