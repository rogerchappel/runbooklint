# Example OSS Release Runbook

## Purpose

Release the package to npm.

## Scope

- OWNER: release captain
- TARGET_ENV: npm production registry

## Prerequisites

- [ ] CI passes on main.
- [ ] Changelog is updated.
- [ ] npm token is available in the local environment.

## Procedure

```sh
npm test
npm run build
npm pack --dry-run
npm publish --access public
```

## Validation

- Install the package in a temporary project.
- Confirm the GitHub release links to the published version.

## Rollback

- Deprecate the bad version on npm.
- Publish a corrected patch version.

## Owner

Release captain.
