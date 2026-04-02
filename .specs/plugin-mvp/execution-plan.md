---
name: plugin-mvp-plan
created_at: 2026-04-01T23:09:24Z
updated_at: 2026-04-01T23:09:24Z
generated_by:
  root_skill: execution-planning
  producing_skill: execution-planning
  skills_used:
    - execution-planning
    - artifact-naming
    - document-traceability
    - write-execution-plan
  skill_graph:
    execution-planning:
      - artifact-naming
      - document-traceability
      - write-execution-plan
    artifact-naming: []
    document-traceability: []
    write-execution-plan:
      - document-traceability
source_artifacts:
  charter: .specs/plugin-mvp/charter.md
  user_stories: .specs/plugin-mvp/user-stories.md
  requirements: .specs/plugin-mvp/requirements.md
  technical_design: .specs/plugin-mvp/technical-design.md
---

## Execution Summary

This plan coordinates implementation of the Plugin MVP specification pack for the Provenance Obsidian plugin. The work is organized around four streams: plugin runtime and UI completion, engine workflow and service implementation, storage-boundary enforcement and artifact persistence, and validation across storage modes. The implementation priority is to make the end-to-end note-aware generation loop work first, then harden path safety and storage validation before treating the MVP as complete.

## Scope Alignment

- Charter: `.specs/plugin-mvp/charter.md`
- User Stories: `.specs/plugin-mvp/user-stories.md`
- Requirements: `.specs/plugin-mvp/requirements.md`
- Technical Design: `.specs/plugin-mvp/technical-design.md`
- Runtime-edge obligations: Preserve the Obsidian operator-facing flow described in the approved spec: plugin loads in desktop Obsidian, a panel opens from the workspace, the panel submits prompts against the active note, runtime assembly stays in the app package, workflow outcomes render back into the panel, and artifact saves route through guarded filesystem writes rather than direct UI-side mutation.
- In-scope implementation objective: Deliver a testable Obsidian MVP that reads the active note, generates LLM-backed research assistance, saves markdown artifacts only inside a configured LLM-owned output path, persists settings, and validates at least two storage configurations.

## Implementation Streams

### Stream 1: Obsidian Runtime and Panel UX

- Objective: turn the existing placeholder plugin surface into a working note-aware interaction flow.
- Implements:
  - SC1.1, SC1.2, SC1.7
  - Stories 1, 2, 5, 13, 17
  - FR1.1, FR1.2, FR1.3, FR1.4, FR1.6, FR1.12
  - Technical design components: Obsidian Runtime Edge, Provenance Panel
- Notes: This stream owns the runtime edge and user-facing orchestration, but it should stay thin and delegate business behavior to the engine.

### Stream 2: Engine Workflow and LLM Gateway Delivery

- Objective: complete the Effect-native workflow path from active note context to generated response.
- Implements:
  - SC1.2, SC1.3, SC1.7
  - Stories 2, 3, 4, 14, 15
  - FR1.3, FR1.5, FR1.6, FR1.10, FR1.13
  - Technical design components: Engine Workflows, ActiveNoteReader Service, LLMGateway Service
- Notes: Start with deterministic mock mode, then add Pi-backed execution behind the same `LLMGateway` contract.

### Stream 3: Artifact Persistence and Boundary Enforcement

- Objective: make artifact creation safe, traceable, and constrained to the configured machine-owned output root.
- Implements:
  - SC1.3, SC1.4, SC1.6
  - Stories 6, 7, 8, 10, 11, 12
  - FR1.7, FR1.8, FR1.9, FR1.11, FR1.12, FR1.13
  - Technical design components: ArtifactWriter Service, Path Boundary Guard, Shared Contracts Module
- Notes: This stream should establish the strongest safety guarantees in the MVP. It is not complete until blocked writes are demonstrated, not merely coded.

### Stream 4: Storage Evaluation and MVP Validation

- Objective: validate the in-vault and external storage models and produce enough evidence for a next-phase storage decision.
- Implements:
  - SC1.5, SC1.8
  - Stories 9, 16
  - FR1.14
  - Technical design sections: Failure and Recovery Strategy, Testing Strategy, Risks and Tradeoffs
- Notes: This stream closes the loop on MVP learning goals. It should capture ergonomic findings, not only pass/fail outcomes.

## Work Breakdown

### Stream 1: Obsidian Runtime and Panel UX

- [ ] Replace the placeholder panel content with a minimal interactive chat flow that accepts prompts, shows response state, and exposes a save-artifact action.
- [ ] Implement runtime assembly in `apps/provenance-obsidian-plugin` so the panel and commands can call engine workflows without ad hoc dependency provisioning.
- [ ] Add an Obsidian-backed active-note adapter that reads the current note title, path, and markdown content.
- [ ] Wire persisted settings into runtime creation and settings UI updates so mode and output path changes affect workflow execution.

### Stream 2: Engine Workflow and LLM Gateway Delivery

- [ ] Split or refine the current workflow boundary so generate-response behavior and save-artifact behavior are both explicit and testable.
- [ ] Implement a mock `LLMGateway` adapter that returns deterministic research-oriented output for local development and tests.
- [ ] Implement a Pi-backed `LLMGateway` adapter that satisfies the same engine-facing contract as mock mode.
- [ ] Add typed error handling for missing active note, failed generation, and invalid runtime configuration so the UI can surface meaningful failures.

### Stream 3: Artifact Persistence and Boundary Enforcement

- [ ] Implement artifact path derivation, markdown content assembly, and successful-write result reporting inside an app-facing artifact writer adapter.
- [ ] Enforce write-boundary checks against the configured output root before any filesystem mutation occurs.
- [ ] Define artifact metadata shape for source note reference, timestamp, and generation context using a consistent heading-plus-section markdown format.
- [ ] Add conflict-handling behavior for repeat saves from the same note using deterministic numeric suffixing that preserves prior artifacts.
- [ ] Add explicit blocked-write and failed-write test coverage so path safety is demonstrated semantically.

### Stream 4: Storage Evaluation and MVP Validation

- [ ] Validate an in-vault `.provenance/...` output configuration and record visibility, ergonomics, and indexing observations.
- [ ] Validate an external output directory configuration and record setup friction, path safety behavior, and browsing ergonomics.
- [ ] Optionally validate opening the machine-owned output directory as a separate Obsidian vault if the first two configurations leave the usability decision unclear. TODO: Confirm whether this third check is mandatory for MVP exit.
- [ ] Capture final MVP findings on storage model, Pi suitability, and workflow usefulness in a short implementation note or follow-up decision record.
- [ ] Run full repo validation with `bun run check` before considering the MVP implementation stream-complete.

## Dependency and Sequencing Strategy

- Prerequisites: Existing monorepo packages and placeholder plugin runtime are present; local access to an Obsidian test vault and at least one working mock LLM mode are needed before end-to-end testing.
- Sequencing notes: Complete Stream 1 and the mock-mode parts of Stream 2 first so there is a working interactive loop without external provider dependency. Start Stream 3 as soon as the save action contract is visible, because boundary enforcement is a core MVP property rather than a hardening afterthought. Run Stream 4 after Stream 3 is functional, with external and in-vault validation using the same workflow surface the user will actually exercise.
- Coordination risks: Pi integration could stall end-to-end delivery if it is treated as the only execution path; artifact save UX may drift if workflow boundaries stay implicit; storage evaluation may produce inconclusive results if the panel flow is not stable before manual validation begins.

## Validation Checkpoints

- Engine workflow tests pass with substituted `ActiveNoteReader`, `LLMGateway`, and `ArtifactWriter` services.
- Shared path tests prove in-bounds writes succeed and out-of-bounds writes are rejected.
- Plugin runtime typechecks with settings, panel, and adapter wiring in place.
- Mock mode supports an end-to-end manual flow: open panel, read active note, submit prompt, receive response, save artifact.
- Pi mode, if enabled, satisfies the same panel flow without changing engine workflow contracts.
- In-vault and external storage configurations are both exercised and their observations are recorded.
- `bun run check` passes from the repository root.

## Risks and Mitigations

- Risk: Pi integration adds more complexity than value early in implementation.
- Mitigation: Treat mock mode as the default development path and make Pi a contract-compatible adapter that can land after the end-to-end mock loop works.
- Risk: Path-prefix checks may be insufficient if path normalization or symlink behavior creates escape routes.
- Mitigation: Keep current boundary checks under test now and confirm whether canonical path resolution is needed before declaring storage safety complete.
- Risk: The panel UX may become a thin wrapper around implicit side effects, making testing and iteration harder.
- Mitigation: Keep runtime-edge code thin and preserve explicit workflow calls plus typed service seams.
- Risk: Storage comparison results may be anecdotal instead of actionable.
- Mitigation: Record the same observation categories for each storage mode: setup complexity, browsing ergonomics, visibility, and confidence in boundary separation.

## Progress Tracking

- Status: Not started
- Active stream: Stream 1: Obsidian Runtime and Panel UX
- Notes: Specification pack is approved and colocated under `.specs/plugin-mvp/`. Implementation has placeholder runtime and panel surfaces plus initial engine contracts, so execution can begin from runtime wiring and mock-mode end-to-end delivery.

## Further Notes

- The current codebase already contains useful scaffolding in `packages/engine`, `packages/shared`, and `apps/provenance-obsidian-plugin`, so the first implementation passes should extend existing seams instead of replacing them.
- Keep implementation slices vertical wherever possible: panel input, note read, gateway call, response render, save action, and guarded write should become demonstrable in sequence.
- Avoid treating storage evaluation as documentation-only work. The value comes from exercising the real workflow under each configuration.
- TODO: Confirm whether the MVP requires separate generate-only and save-artifact workflows in code, or whether one workflow plus an explicit save command boundary is sufficient.
- TODO: Confirm whether the separate LLM vault view must be validated for MVP completion or is only a fallback investigation if the first two storage modes leave the decision unresolved.
