# RunbookLint Orchestration

RunbookLint is intentionally local-first. The CLI never executes shell commands from a runbook and never calls external services.

## Command flow

1. Resolve CLI arguments and locate the current working directory.
2. Load `.runbooklint.json` when present, then merge it with default policy.
3. Expand input paths into a deterministic Markdown file list.
4. Parse each Markdown document into a lightweight AST.
5. Evaluate policy rules against parsed structure and raw text.
6. Sort findings by file, line, severity, and rule id.
7. Render Markdown or JSON output.
8. Exit non-zero only when a finding meets or exceeds `--fail-on`.

## Quality gates

- `npm test` runs fixture-backed unit tests.
- `npm run check` type-checks the source.
- `npm run build` emits the distributable CLI.
- `npm run smoke` runs the built CLI against checked-in fixtures and writes reports.
- `bash scripts/validate.sh` runs repository-wide checks.

## Release posture

Publishing is manual. CI verifies pull requests and main branch pushes, but no workflow publishes to npm automatically.
