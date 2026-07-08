# RunbookLint Skill

Use this skill when an agent needs to inspect operational Markdown before a human or automation follows it.

## When To Use

- Release, incident, support, or agent-handoff runbooks need a local safety pass.
- A PR adds shell commands, rollback steps, or owner handoff instructions.
- You need fixture-backed evidence that a runbook has prerequisites, validation, and recovery coverage.

## Inputs

- One or more Markdown files or directories.
- Optional `.runbooklint.json` policy with required headings, command risk patterns, and variable definitions.
- Optional preset from `runbooklint init --preset oss-release|incident|agent-handoff`.

## Side Effects

RunbookLint reads requested files and optional policy files. It does not execute commands in runbooks, call external services, mutate source files by default, or send telemetry.

## Approval Boundaries

Treat warnings about destructive commands, approval bypasses, force pushes, production scope, and missing rollback as human-review gates. Do not perform the documented operation unless the user explicitly approves that separate action.

## Workflow

1. Run `runbooklint check <path> --format markdown`.
2. Use `--format json` in CI or when another agent needs stable machine output.
3. Set `--fail-on warning` for release and production runbooks.
4. Fix missing headings, undefined variables, risky commands, and stale placeholders.
5. Re-run `npm run smoke` or `runbooklint check fixtures --fail-on error` before claiming the runbook is ready.

## Example

```bash
runbooklint check docs/RUNBOOK.md --fail-on warning
runbooklint check docs --format json --out reports/runbooklint.json
```

## Verification

For repository changes, run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh`.
