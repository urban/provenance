---
name: plugin-mvp-tasks
created_at: 2026-04-01T23:13:21Z
updated_at: 2026-04-01T23:13:21Z
generated_by:
  root_skill: task-generation
  producing_skill: task-generation
  skills_used:
    - task-generation
    - document-traceability
    - write-task-tracking
  skill_graph:
    task-generation:
      - document-traceability
      - write-task-tracking
    document-traceability: []
    write-task-tracking:
      - document-traceability
source_artifacts:
  plan: .specs/plugin-mvp/execution-plan.md
---

## Task Summary

- Parent plan: `.specs/plugin-mvp/execution-plan.md`
- Scope: Implement the Plugin MVP execution plan as thin, production-bound tracer bullets that deliver the end-to-end Obsidian authoring flow, guarded artifact persistence, and storage validation.
- Tracking intent: Use this document as the local execution surface during implementation. Update task status, blockers, and active stream as real work lands so the work stays aligned to the approved execution plan.
- Runtime-edge obligations: Preserve the Obsidian user-visible behavior from the parent plan: the plugin must load in desktop Obsidian, open a panel from the workspace, read the active note when the user submits a prompt, render workflow results back into the panel, and route artifact saves through guarded filesystem writes rather than direct UI-side mutation.

## Stream Groups

### Stream 1: Obsidian Runtime and Panel UX

Objective: Deliver a minimal but working panel-driven flow that can invoke engine workflows against the active note.

#### Task PMVP-T1

- Title: Replace the placeholder panel with a minimal interactive prompt-and-response flow
- Status: Completed
- Blocked by: None
- Plan references:
  - Stream 1: Obsidian Runtime and Panel UX
  - Work Breakdown: replace the placeholder panel content with a minimal interactive chat flow
- What to build: A panel UI that accepts a prompt, shows loading and response state, and exposes a save-artifact action against the current generated response.
- Acceptance criteria:
  - The Provenance panel renders an input, a submit action, visible response state, and a disabled or hidden save action until a response exists.
  - A user can open the panel in Obsidian, enter a prompt, and observe that the panel attempts the generation workflow rather than remaining static placeholder text.
- Notes:
  - Keep the UI thin and avoid embedding provider or filesystem logic in the view.

#### Task PMVP-T2

- Title: Assemble the plugin runtime once and expose workflow access to commands and views
- Status: Not started
- Blocked by: PMVP-T1
- Plan references:
  - Stream 1: Obsidian Runtime and Panel UX
  - Work Breakdown: implement runtime assembly in `apps/provenance-obsidian-plugin`
- What to build: A single app-level runtime assembly seam that wires settings, Obsidian adapters, and engine services without ad hoc `provide` calls in individual UI paths.
- Acceptance criteria:
  - The app package has one visible runtime-construction path that can be shared by the panel and command surfaces.
  - Panel actions execute through the assembled runtime and continue to work after reopening the panel or reloading the plugin.
- Notes:
  - Preserve the technical design requirement that runtime composition stays in the app package.

#### Task PMVP-T3

- Title: Add an Obsidian-backed active-note adapter
- Status: Not started
- Blocked by: PMVP-T2
- Plan references:
  - Stream 1: Obsidian Runtime and Panel UX
  - Work Breakdown: add an Obsidian-backed active-note adapter
- What to build: An adapter that satisfies `ActiveNoteReader` by returning the active note title, path, and markdown body from the current Obsidian workspace state.
- Acceptance criteria:
  - Engine workflows can retrieve real `ActiveNoteContext` values from an open note through the adapter.
  - When no valid active note exists, the adapter returns a meaningful failure path that the UI can surface.
- Notes:
  - Align the returned fields with the existing shared `ActiveNoteContext` contract.

#### Task PMVP-T4

- Title: Thread persisted settings into runtime creation and live panel behavior
- Status: Not started
- Blocked by: PMVP-T2
- Plan references:
  - Stream 1: Obsidian Runtime and Panel UX
  - Work Breakdown: wire persisted settings into runtime creation and settings UI updates
- What to build: Settings flow that keeps `llmMode` and `llmOutputPath` available to runtime assembly and makes changed settings affect subsequent workflow calls.
- Acceptance criteria:
  - Changing settings and re-running a panel action uses the updated mode and output-path values.
  - Plugin reload preserves settings and restores behavior consistent with the saved configuration.
- Notes:
  - Keep settings handling explicit so later validation can switch storage modes without code edits.

### Stream 2: Engine Workflow and LLM Gateway Delivery

Objective: Deliver the smallest end-to-end generation path from active note context to structured LLM response.

#### Task PMVP-T5

- Title: Separate generate-response behavior from save-artifact behavior in the engine
- Status: Not started
- Blocked by: PMVP-T3
- Plan references:
  - Stream 2: Engine Workflow and LLM Gateway Delivery
  - Work Breakdown: split or refine the current workflow boundary
- What to build: Explicit engine behavior boundaries so generation and persistence can be tested independently while still composing into one user flow.
- Acceptance criteria:
  - The engine exposes a generate-oriented path that can return a response without forcing a save operation.
  - Save behavior can be tested independently using a previously generated response or equivalent artifact input.
- Notes:
  - TODO: Confirm whether this should land as two workflow exports or one workflow plus an explicit save command boundary.

#### Task PMVP-T6

- Title: Implement deterministic mock generation mode
- Status: Completed
- Blocked by: PMVP-T3
- Plan references:
  - Stream 2: Engine Workflow and LLM Gateway Delivery
  - Work Breakdown: implement a mock `LLMGateway` adapter
- What to build: A mock `LLMGateway` implementation that produces stable research-oriented output from active-note context for development and tests.
- Acceptance criteria:
  - Running the generation flow in mock mode returns structured output without requiring Pi or external connectivity.
  - Tests can assert on stable mock responses without brittle timing or network dependencies.
- Notes:
  - This task unlocks the first full tracer bullet and should land before Pi-specific work.

#### Task PMVP-T7

- Title: Implement Pi-backed generation mode behind the shared gateway contract
- Status: Not started
- Blocked by: PMVP-T6
- Plan references:
  - Stream 2: Engine Workflow and LLM Gateway Delivery
  - Work Breakdown: implement a Pi-backed `LLMGateway` adapter
- What to build: A Pi-backed adapter that satisfies the same engine-facing `LLMGateway` contract as mock mode.
- Acceptance criteria:
  - Switching from mock mode to Pi mode does not require changes to the panel or engine workflow contracts.
  - The panel flow can generate a response through Pi mode and render it back to the user through the same UI path used in mock mode.
- Notes:
  - Treat Pi as an adapter detail rather than a runtime-wide dependency.

#### Task PMVP-T8

- Title: Surface typed workflow failures to the UI
- Status: Not started
- Blocked by: PMVP-T5, PMVP-T6
- Plan references:
  - Stream 2: Engine Workflow and LLM Gateway Delivery
  - Work Breakdown: add typed error handling for missing active note, failed generation, and invalid runtime configuration
- What to build: Typed failure handling across generation paths so the panel can distinguish missing-note, config, and generation errors.
- Acceptance criteria:
  - The engine returns distinguishable failure cases for missing active note, invalid configuration, and generation failure.
  - The panel renders a user-visible error state that changes based on the workflow failure rather than collapsing all failures into generic text.
- Notes:
  - Preserve the Effect-first error-channel design from the approved technical design.

### Stream 3: Artifact Persistence and Boundary Enforcement

Objective: Deliver safe markdown artifact saves that prove the human-versus-machine write boundary.

#### Task PMVP-T9

- Title: Implement artifact writing from generated response to markdown file
- Status: Completed
- Blocked by: PMVP-T5, PMVP-T6, PMVP-T4
- Plan references:
  - Stream 3: Artifact Persistence and Boundary Enforcement
  - Work Breakdown: implement artifact path derivation, markdown content assembly, and successful-write result reporting
- What to build: An artifact writer adapter that turns a generated response into persisted markdown and returns the saved path.
- Acceptance criteria:
  - Saving a generated response produces a markdown file in the configured machine-owned output location.
  - The save path is returned to the panel so the user can confirm where the artifact was written.
- Notes:
  - Keep the metadata shape aligned with the shared artifact draft contract.

#### Task PMVP-T10

- Title: Enforce guarded write boundaries before filesystem mutation
- Status: Not started
- Blocked by: PMVP-T9
- Plan references:
  - Stream 3: Artifact Persistence and Boundary Enforcement
  - Work Breakdown: enforce write-boundary checks against the configured output root
- What to build: Boundary validation that rejects any save target outside the configured machine-owned root before write attempts occur.
- Acceptance criteria:
  - An in-bounds artifact save succeeds when the resolved target stays under the configured output path.
  - An out-of-bounds save attempt is rejected before file creation and surfaces a blocked-write result to the caller.
- Notes:
  - This task must preserve the runtime-edge behavior that saves route through guarded filesystem writes rather than direct UI-side mutation.

#### Task PMVP-T11

- Title: Finalize artifact metadata and naming policy for repeat saves
- Status: Completed
- Blocked by: PMVP-T9
- Plan references:
  - Stream 3: Artifact Persistence and Boundary Enforcement
  - Work Breakdown: define artifact metadata shape and add conflict-handling behavior
- What to build: A concrete MVP policy for persisted artifact metadata and filename collision handling.
- Acceptance criteria:
  - Saved artifacts include source-note reference, timestamp, and generation context in one consistent markdown format.
  - Repeat saves from the same note follow one documented collision policy that preserves prior artifacts via deterministic numeric suffixes.
- Notes:
  - Use a heading-plus-section markdown format with a dedicated metadata section and response section for the MVP.

#### Task PMVP-T12

- Title: Add semantic tests for allowed, blocked, and failed artifact saves
- Status: Not started
- Blocked by: PMVP-T10, PMVP-T11
- Plan references:
  - Stream 3: Artifact Persistence and Boundary Enforcement
  - Work Breakdown: add explicit blocked-write and failed-write test coverage
- What to build: Test coverage that proves the artifact writer and boundary guard behave correctly under success, blocked-write, and write-failure conditions.
- Acceptance criteria:
  - Automated tests verify that in-bounds saves succeed and out-of-bounds saves fail without mutating forbidden locations.
  - Automated tests verify that write failures surface meaningful results without losing the generated response needed for retry or manual copy.
- Notes:
  - Favor behavior assertions over file-by-file implementation coupling.

### Stream 4: Storage Evaluation and MVP Validation

Objective: Close the MVP with real workflow validation across the candidate storage modes.

#### Task PMVP-T13

- Title: Validate the in-vault machine-owned storage path with the real panel flow
- Status: Not started
- Blocked by: PMVP-T10
- Plan references:
  - Stream 4: Storage Evaluation and MVP Validation
  - Work Breakdown: validate an in-vault `.provenance/...` output configuration
- What to build: A manual validation pass for the in-vault storage mode using the same panel-driven generation and save flow intended for real users.
- Acceptance criteria:
  - The panel can generate and save an artifact into the in-vault machine-owned path without violating the configured boundary.
  - Observations are recorded for visibility, indexing behavior, and ergonomics of keeping machine-owned artifacts inside the vault.
- Notes:
  - Use the real runtime path, not a mock document-only review.

#### Task PMVP-T14

- Title: Validate the external output directory with the real panel flow
- Status: Not started
- Blocked by: PMVP-T10, PMVP-T4
- Plan references:
  - Stream 4: Storage Evaluation and MVP Validation
  - Work Breakdown: validate an external output directory configuration
- What to build: A manual validation pass for an external directory configuration using the same generation and save flow as the in-vault test.
- Acceptance criteria:
  - The panel can generate and save an artifact into an external machine-owned output directory using persisted settings.
  - Observations are recorded for setup friction, path safety behavior, and browsing ergonomics relative to the in-vault option.
- Notes:
  - This task depends on live settings changes being wired correctly.

#### Task PMVP-T15

- Title: Record the MVP storage and integration decision with final repo validation
- Status: Completed
- Blocked by: PMVP-T12, PMVP-T13, PMVP-T14
- Plan references:
  - Stream 4: Storage Evaluation and MVP Validation
  - Work Breakdown: capture final MVP findings and run full repo validation
- What to build: A closeout step that consolidates findings from implementation and storage validation and confirms the repo is in a passing state.
- Acceptance criteria:
  - A short implementation note or equivalent summary records the recommended storage model, Pi suitability, and workflow usefulness findings.
  - `bun run check` passes after the MVP implementation work needed for the tracer bullets has landed.
- Notes:
  - TODO: Confirm whether separate LLM vault validation must be completed before this task can be marked complete.

## Dependency Map

- PMVP-T1 -> None
- PMVP-T2 -> PMVP-T1
- PMVP-T3 -> PMVP-T2
- PMVP-T4 -> PMVP-T2
- PMVP-T5 -> PMVP-T3
- PMVP-T6 -> PMVP-T3
- PMVP-T7 -> PMVP-T6
- PMVP-T8 -> PMVP-T5, PMVP-T6
- PMVP-T9 -> PMVP-T5, PMVP-T6, PMVP-T4
- PMVP-T10 -> PMVP-T9
- PMVP-T11 -> PMVP-T9
- PMVP-T12 -> PMVP-T10, PMVP-T11
- PMVP-T13 -> PMVP-T10
- PMVP-T14 -> PMVP-T10, PMVP-T4
- PMVP-T15 -> PMVP-T12, PMVP-T13, PMVP-T14

## Tracking Notes

- Active stream: Stream 1: Obsidian Runtime and Panel UX
- Global blockers: None
- TODO: Confirm: Whether the MVP needs a separate LLM-vault validation task in addition to in-vault and external storage validation, and whether generate-only and save-artifact behavior should become two workflow exports or one workflow plus a separate save command boundary.
