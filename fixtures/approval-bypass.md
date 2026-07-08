# Emergency Cache Purge

## Purpose

Clear a stale cache entry during an approved maintenance window.

## Scope

TARGET_ENV: staging

## Prerequisites

- OWNER: platform-on-call
- Confirm the maintenance ticket and reviewer are assigned.

## Procedure

```bash
deployctl cache purge --target "$TARGET_ENV" --skip approval
```

## Validation

Run the read-only cache status check and confirm the stale key is gone.

## Rollback

Restore the saved cache snapshot if the purge affects unrelated keys.
