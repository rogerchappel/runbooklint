# Release Runbook

## Purpose

Ship a tagged npm package safely.

## Scope

TARGET_ENV: production
OWNER: release captain

## Prerequisites

- OWNER: release captain
- TARGET_ENV: production
- [x] CI is green
- [x] Changelog reviewed

## Procedure

Dry-run before publishing and confirm the exact package name.

```sh
npm test
npm pack --dry-run
npm publish --access public
```

## Validation

- Confirm the package appears on npm.
- Install the published version in a temporary project.

## Rollback

- Deprecate the broken version with a clear message.
- Publish a patch release from the previous known-good commit.

## Owner

Release captain owns this procedure.
