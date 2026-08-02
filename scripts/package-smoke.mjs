#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

const smokeRoot = mkdtempSync(join(tmpdir(), 'runbooklint-package-smoke-'));

try {
  const output = execFileSync(
    'npm',
    ['pack', '--json', '--pack-destination', smokeRoot],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  );
  const [packResult] = JSON.parse(output);
  const included = new Set(packResult.files.map((file) => file.path));
  const missing = requiredFiles.filter((file) => !included.has(file));

  if (missing.length > 0) {
    throw new Error(`Package is missing expected files: ${missing.join(', ')}`);
  }

  const installRoot = join(smokeRoot, 'install');
  const tarball = join(smokeRoot, packResult.filename);
  execFileSync(
    'npm',
    ['install', '--prefix', installRoot, '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    { stdio: 'inherit' }
  );

  const executable = join(
    installRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'runbooklint.cmd' : 'runbooklint'
  );
  const fixture = join(installRoot, 'node_modules', 'runbooklint', 'fixtures', 'clean-release.md');
  execFileSync(executable, ['check', fixture, '--fail-on', 'warning'], { stdio: 'inherit' });

  console.log(
    `Verified ${requiredFiles.length} release files and the installed CLI in ${packResult.filename}.`
  );
} finally {
  rmSync(smokeRoot, { recursive: true, force: true });
}
