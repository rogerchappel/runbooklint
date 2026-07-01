# RunbookLint

RunbookLint is a local-first Markdown linter for operational runbooks. It turns release, incident, support, and agent handoff docs into checkable procedures by flagging missing safety sections, risky commands, undefined placeholders, and vague operational language.

It never executes commands and never calls hosted APIs.

## Quickstart

```sh
npm install
npm run build
node dist/cli.js check fixtures/clean-release.md
```

After publishing, install the CLI globally and run the same check from any
repository:

```sh
npm install -g runbooklint
runbooklint check docs --fail-on warning
```

Initialize a project policy:

```sh
node dist/cli.js init --preset oss-release
```

Check a directory and fail CI on warnings or errors:

```sh
node dist/cli.js check docs --format json --fail-on warning
```

## CLI

```sh
runbooklint check [paths...] [--format markdown|json] [--fail-on info|warning|error] [--output file] [--policy file]
runbooklint init [--preset oss-release|incident|agent-handoff] [--print] [--force]
```

### Reports

Markdown is the default report format. JSON is stable and deterministic for automation.

```sh
node dist/cli.js check fixtures --format markdown --output reports/runbooklint.md
node dist/cli.js check fixtures --format json --output reports/runbooklint.json
```

## What it checks

- Required sections such as purpose, scope, prerequisites, procedure, validation, and rollback.
- Owner or handoff contacts.
- Environment scope.
- Shell code fences containing dangerous patterns such as `rm -rf`, `sudo`, `curl | bash`, force pushes, and production-impacting commands.
- TODO/TBD/FIXME placeholders.
- Undefined `{{VARIABLE}}` and `${VARIABLE}` placeholders.
- Banned vague phrases configured by policy.

## Policy configuration

RunbookLint loads `.runbooklint.json` from the current directory unless `--policy` is supplied. See [docs/POLICY.md](docs/POLICY.md) for the full policy reference.

```json
{
  "requiredHeadings": ["purpose", "scope", "prerequisites", "procedure", "validation", "rollback"],
  "ownerHeadings": ["owner", "contacts"],
  "environmentHeadings": ["scope", "environment"],
  "requiredVariableDefinitions": ["OWNER", "TARGET_ENV"],
  "allowMissingOwner": false
}
```

Generate preset policies with:

```sh
node dist/cli.js init --preset oss-release --print
node dist/cli.js init --preset incident --print
node dist/cli.js init --preset agent-handoff --print
```

## CI usage

```yaml
- run: npm ci
- run: npm test
- run: npm run check
- run: npm run build
- run: node dist/cli.js check docs --fail-on warning
```

## Safety model

RunbookLint is conservative. It parses Markdown and reports likely issues; it does not execute runbook commands, mutate infrastructure, evaluate shell expansions, or contact external services. Treat findings as review prompts, not a replacement for human operational judgment.

## Limitations

- Markdown parsing is intentionally lightweight and optimized for runbooks, not every CommonMark edge case.
- Risk rules are pattern-based and can produce false positives or false negatives.
- `.gitignore` support covers common deterministic path ignores, not every advanced gitignore feature.
- Inline suppressions and SARIF output are planned but not yet implemented.

## Development

```sh
npm install
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

`release:check` exercises the compiled CLI, fixture tests, smoke script, and
dry-run package contents so the release candidate is reviewable before tagging.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md). Please do not include secrets or private incident data in bug reports.

## License

MIT
