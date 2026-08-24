import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('documented CI lint target exits successfully', () => {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['run', 'docs:check'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    0,
    `npm run docs:check failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
});

test('shipped skill JSON example uses the supported output option', () => {
  const skill = readFileSync('SKILL.md', 'utf8');
  const command = skill
    .split('\n')
    .find((line) => line.startsWith('runbooklint check docs --format json'));

  assert.ok(command, 'SKILL.md must include the JSON report example');

  const directory = mkdtempSync(join(tmpdir(), 'runbooklint-skill-example-'));
  const report = join(directory, 'runbooklint.json');

  try {
    const args = command.trim().split(/\s+/).slice(1);
    args[1] = 'fixtures/clean-release.md';
    args[args.indexOf('--output') + 1] = report;

    const result = spawnSync(process.execPath, ['dist/cli.js', ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    assert.equal(
      result.status,
      0,
      `SKILL.md JSON example failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.doesNotThrow(() => JSON.parse(readFileSync(report, 'utf8')));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
