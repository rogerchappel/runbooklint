# Contributing

Thanks for improving RunbookLint. The project values small, reviewable changes with deterministic behavior.

## Local setup

```sh
npm install
npm test
npm run check
npm run build
npm run smoke
```

Run the full validation gate before opening a pull request:

```sh
bash scripts/validate.sh
```

## Development guidelines

- Keep the CLI local-first. Do not add network calls to the lint path.
- Never execute commands found in runbooks.
- Prefer deterministic sorting for files, findings, and report output.
- Add or update fixtures for every rule change.
- Include clear fix suggestions with new findings.
- Keep policy changes backward-compatible when possible.

## Pull requests

A good pull request includes:

- A concise problem statement.
- Tests or fixtures proving the behavior.
- Updated README or docs when user-facing behavior changes.
- Notes about false-positive or false-negative tradeoffs for new rules.

## Release process

Releases are manual. Maintainers should run `npm run release:check`, inspect the package with `npm pack --dry-run`, then publish intentionally.
