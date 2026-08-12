# Cache Cleanup Runbook

## Purpose
Clean an application cache.

## Scope
Local development cache only.

## Prerequisites
Confirm the target directory.

## Procedure

~~~bash session=local
rm -rf ./cache
~~~

## Validation
Confirm the application recreates its cache.

## Rollback
Restore the cache from backup if required.

## Owner
Platform team.
