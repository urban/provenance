---
name: plugin-mvp
created_at: 2026-04-01T22:50:46Z
updated_at: 2026-04-01T22:50:46Z
generated_by:
  root_skill: specification-authoring
  producing_skill: requirements
  skills_used:
    - specification-authoring
    - requirements
    - artifact-naming
    - document-traceability
    - write-requirements
  skill_graph:
    specification-authoring:
      - requirements
    requirements:
      - artifact-naming
      - document-traceability
      - write-requirements
    artifact-naming: []
    document-traceability: []
    write-requirements:
      - document-traceability
source_artifacts:
  charter: .specs/plugin-mvp/charter.md
  user_stories: .specs/plugin-mvp/user-stories.md
---

## Functional Requirements

- FR1.1: The system shall load as a valid Obsidian desktop plugin and expose a Provenance UI surface that the user can open from the Obsidian workspace.
- FR1.2: The system shall provide a chat-oriented interaction surface for the active vault session.
- FR1.3: The system shall read the current active note and return its path, title, and markdown content to application workflows.
- FR1.4: The system shall allow the human author to submit a prompt or question from the plugin UI.
- FR1.5: The system shall combine the submitted prompt with active-note context before sending the request to the LLM gateway.
- FR1.6: The system shall display the returned LLM response in the plugin UI.
- FR1.7: The system shall allow the human author to save a returned LLM response as a markdown artifact.
- FR1.8: The system shall save generated artifacts only within a configured LLM-owned output location.
- FR1.9: The system shall reject any attempted artifact write whose resolved target path is outside the configured LLM-owned output location.
- FR1.10: The system shall create at least one artifact type during the MVP, initially a research artifact in markdown format.
- FR1.11: The system shall record enough artifact metadata to relate a saved artifact back to its source note and generation context.
- FR1.12: The system shall persist plugin settings needed for the MVP across Obsidian restarts.
- FR1.13: The system shall surface meaningful errors for invalid configuration, failed LLM requests, blocked writes, and artifact write failures.
- FR1.14: The system shall support validation of at least two storage configurations for generated artifacts during MVP evaluation.

## Non-Functional Requirements

- NFR2.1: The system must preserve strict separation between human-authored note space and LLM-generated artifact space.
- NFR2.2: The MVP should remain small enough to reason about and validate without introducing platform-scale orchestration or memory features.
- NFR2.3: Core side effects should be isolated behind explicit service boundaries so workflows remain testable and composable.
- NFR2.4: The MVP should work in a local-first development environment without requiring a hosted backend.
- NFR2.5: The system should make generated content easy to inspect in the chosen storage configuration without obscuring its machine-owned status.
- NFR2.6: The architecture should allow the LLM implementation and storage configuration to change without requiring a rewrite of UI workflows.

## Technical Constraints

- TC3.1: The implementation shall use TypeScript.
- TC3.2: The implementation shall integrate with the Obsidian plugin runtime for commands, views, settings, and workspace access.
- TC3.3: The implementation shall align with the repository's existing monorepo structure, including `apps/provenance-obsidian-plugin`, `packages/engine`, and `packages/shared`.
- TC3.4: The implementation shall follow Effect-native patterns already present in `packages/engine`, including `Effect.fn`, `ServiceMap.Service`, and layer-based substitution.
- TC3.5: The LLM integration shall remain behind a narrow gateway boundary so Pi remains an implementation detail rather than a pervasive dependency.
- TC3.6: Output paths shall be validated before artifact creation using normalized path comparisons or an equivalent safe boundary check.
- TC3.7: Generated artifacts shall be stored as markdown files.
- TC3.8: The MVP shall prefer simple, explicit adapter boundaries over speculative abstractions for future capabilities that are not yet in scope.

## Data Requirements

- DR4.1: Active note context shall include the note path, note title, and markdown body.
- DR4.2: A generated artifact draft shall include at least a title, generated body, and source note path.
- DR4.3: A saved artifact record shall preserve the resolved artifact path returned after a successful write.
- DR4.4: Plugin settings shall include a configured LLM-owned output path and may include additional runtime toggles needed for MVP testing.
- DR4.5: Saved artifact content should include timestamp and source-context metadata in a human-readable form. TODO: Confirm exact metadata block shape.

## Integration Requirements

- IR5.1: The plugin shall integrate with the Obsidian API to discover the active note and render the plugin interface.
- IR5.2: The application core shall integrate with an LLM gateway service that accepts structured note context and returns structured LLM responses.
- IR5.3: The initial LLM gateway implementation shall be compatible with Pi-backed execution while keeping Pi-specific details inside the adapter layer.
- IR5.4: The artifact-writing path shall integrate with filesystem access appropriate for Obsidian desktop plugin execution.

## Dependencies

- DEP6.1: Obsidian desktop plugin runtime.
- DEP6.2: Effect library and related packages used by the application core.
- DEP6.3: Local filesystem access to the configured LLM-owned output location.
- DEP6.4: A Pi-compatible LLM runtime or provider configuration for generating responses.
- DEP6.5: A test vault and at least two candidate storage configurations for MVP validation.

## Further Notes

- Assumptions: The current repository structure and early engine services represent the intended foundation for the MVP; the plugin targets desktop Obsidian; generated artifacts remain markdown files during this phase.
- Open questions: Whether `.provenance/knowledge` is ergonomically acceptable inside a vault; whether external storage plus a separate Obsidian vault view is better than in-vault storage; how much metadata should be embedded in artifact files.
- TODO: Confirm: Exact persisted settings schema for provider and model selection; artifact filename strategy for collisions and repeat saves; final UX for saving and reopening generated artifacts.
