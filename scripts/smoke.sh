#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build >/dev/null
mkdir -p reports
node dist/cli.js check fixtures/clean-release.md --format markdown --output reports/clean.md
node dist/cli.js check fixtures/clean-release.md --format json --output reports/clean.json
if node dist/cli.js check fixtures/risky-production.md --format json --fail-on warning --output reports/risky.json; then
  echo "Expected risky fixture to fail with --fail-on warning" >&2
  exit 1
fi
node dist/cli.js init --preset agent-handoff --print >/tmp/runbooklint-policy.json
node -e "JSON.parse(require('node:fs').readFileSync('/tmp/runbooklint-policy.json','utf8'))"
test -s reports/clean.md
test -s reports/clean.json
test -s reports/risky.json
printf 'Smoke checks passed.\n'
