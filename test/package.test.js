import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const repoRoot = new URL('..', import.meta.url);

test('clean checkout build and package provide the declared CLI command', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const [command, cliPath] = Object.entries(packageJson.bin)[0] ?? [];
  assert.equal(command, 'runbooklint', 'package.json declares the runbooklint command');

  const cleanRoot = await mkdtemp(join(tmpdir(), 'runbooklint-clean-checkout-'));
  const sourceRoot = join(cleanRoot, 'source');
  const archive = join(cleanRoot, 'source.tar');
  try {
    await mkdir(sourceRoot);
    execFileSync('git', ['archive', '--format=tar', `--output=${archive}`, 'HEAD'], { cwd: repoRoot });
    execFileSync('tar', ['-xf', archive, '-C', sourceRoot]);
    await assert.rejects(access(join(sourceRoot, cliPath)), { code: 'ENOENT' });
    execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: sourceRoot, stdio: 'inherit' });
    execFileSync('npm', ['run', 'build'], { cwd: sourceRoot, stdio: 'inherit' });
    await access(join(sourceRoot, cliPath));
    execFileSync('node', [join(sourceRoot, cliPath), 'check', join(sourceRoot, 'fixtures/clean-release.md'), '--fail-on', 'warning'], { stdio: 'inherit' });
    const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json'], { cwd: sourceRoot, encoding: 'utf8' }));
    assert.ok(packed.files.some(({ path }) => path === cliPath), `packed artifact contains ${cliPath}`);
  } finally {
    await rm(cleanRoot, { recursive: true, force: true });
  }
});
