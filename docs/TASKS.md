# RunbookLint Task Plan

## MVP build tasks

- [x] Create a deterministic Markdown parser for headings, links, checklists, code fences, variables, and TODOs.
- [x] Add a project-local policy loader for `.runbooklint.json`.
- [x] Implement `runbooklint init` with useful presets.
- [x] Implement `runbooklint check` for files and directories.
- [x] Emit stable Markdown and JSON reports.
- [x] Add safety rules for missing sections, risky commands, weak rollback and validation coverage, undefined variables, and stale placeholders.
- [x] Add fixture-backed tests and smoke scripts.
- [x] Document quick start, policy configuration, CI use, safety model, and limitations.

## Post-MVP candidates

- [ ] Add SARIF output for GitHub code scanning.
- [ ] Support inline rule suppression comments.
- [ ] Add policy schema export.
- [ ] Add examples for Kubernetes, Terraform, and database maintenance runbooks.
- [ ] Publish package once API and reports have settled.
