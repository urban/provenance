# Agent Checklist

Execution rule: complete tasks in order. Do not start the next task until the current task is checked off and its verification step passes.

## Plugin MVP Task Checklist

Source: `.specs/plugin-mvp/tasks.md`

- [x] PMVP-T1 — Replace the placeholder panel with a minimal interactive prompt-and-response flow
- [x] PMVP-T2 — Assemble the plugin runtime once and expose workflow access to commands and views
- [x] PMVP-T3 — Add an Obsidian-backed active-note adapter
- [x] PMVP-T4 — Thread persisted settings into runtime creation and live panel behavior
- [ ] PMVP-T5 — Separate generate-response behavior from save-artifact behavior in the engine
- [ ] PMVP-T6 — Implement deterministic mock generation mode
- [ ] PMVP-T7 — Implement Pi-backed generation mode behind the shared gateway contract
- [ ] PMVP-T8 — Surface typed workflow failures to the UI
- [ ] PMVP-T9 — Implement artifact writing from generated response to markdown file
- [ ] PMVP-T10 — Enforce guarded write boundaries before filesystem mutation
- [ ] PMVP-T11 — Finalize artifact metadata and naming policy for repeat saves
- [ ] PMVP-T12 — Add semantic tests for allowed, blocked, and failed artifact saves
- [ ] PMVP-T13 — Validate the in-vault machine-owned storage path with the real panel flow
- [ ] PMVP-T14 — Validate the external output directory with the real panel flow
- [ ] PMVP-T15 — Record the MVP storage and integration decision with final repo validation
