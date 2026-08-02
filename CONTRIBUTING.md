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

Before tagging, maintainers should run `npm run release:check` and review the
release dry-run workflow. Pushing a `v*.*.*` tag verifies and packs the release
candidate once, publishes that verified tarball to npm with trusted-publishing
provenance, and only then creates the GitHub release with the same tarball.

The npm package name and version must be available before a tag is pushed.
Configure npm trusted publishing for this repository and the `release.yml`
workflow; the workflow does not use a long-lived npm token.
