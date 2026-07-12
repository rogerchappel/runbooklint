#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'dist/cli.js',
  'dist/index.js',
  'dist/index.d.ts',
  'docs/POLICY.md',
  'examples/release-runbook.md',
  'fixtures/clean-release.md',
  'scripts/smoke.sh',
  'SKILL.md',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md'
];

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit']
});

const [packResult] = JSON.parse(output);
const included = new Set(packResult.files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !included.has(file));

if (missing.length > 0) {
  console.error(`Package dry-run is missing expected files: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`Verified ${requiredFiles.length} release files in ${packResult.filename}.`);
