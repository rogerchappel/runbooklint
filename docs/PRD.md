# RunbookLint PRD

Status: in-progress

## Summary

A local Markdown runbook checker that turns operational docs into testable procedures: commands, prerequisites, rollback steps, danger labels, and owner handoffs. 🧭

## Source attribution

Created during the 2026-05-16 twice-daily OSS factory run because the unbuilt ready/backlog pool had fewer than five candidates. Inspired by recurring gaps in incident runbooks, README-driven operations, and agent handoff docs; renamed/reframed as a deterministic local lint tool rather than copying any specific project.

## Target users

- Developers maintaining deployment, incident, or support runbooks.
- Agents preparing handoffs that humans must trust.
- OSS maintainers documenting release and recovery procedures.

## Problem

Runbooks rot quietly. They miss prerequisites, hide destructive commands, forget validation and rollback, or mix vague prose with commands that no one can safely execute under pressure.

## Goals

- Parse Markdown runbooks offline.
- Detect missing sections, risky shell snippets, undefined variables, weak rollback/verification coverage, and stale TODO placeholders.
- Emit stable Markdown and JSON reports with severities and fix suggestions.
- Support a project-local `.runbooklint.json` policy.
- Include useful defaults for OSS release, incident, and agent handoff runbooks.

## Non-goals

- Executing commands.
- Calling external services or LLMs.
- Replacing human incident review.

## V1 CLI

```bash
runbooklint check docs/RUNBOOK.md
runbooklint check docs --format json --fail-on warning
runbooklint init --preset oss-release
```

## Functional requirements

1. Walk Markdown files deterministically and respect `.gitignore` by default.
2. Parse headings, code fences, checklist items, links, variable placeholders, and danger phrases.
3. Flag missing prerequisites, validation, rollback, owners, environment scope, and command safety notes.
4. Support configurable required headings, banned phrases, command risk patterns, and severity thresholds.
5. Emit stable Markdown/JSON reports and non-zero exits based on `--fail-on`.
6. Ship fixture-backed tests for clean, risky, missing-rollback, and agent-handoff runbooks.

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- `bash scripts/validate.sh` passes when present.
- Real CLI smoke lints checked-in fixtures and writes Markdown/JSON reports.
- README covers quick start, policy config, examples, safety model, CI usage, and limitations.
- Public GitHub repo `rogerchappel/runbooklint` has useful description and topics.
