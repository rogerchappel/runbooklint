import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runCheck } from '../dist/index.js';

test('clean fixture has no error findings', () => {
  const { result, failed } = runCheck({ cwd: process.cwd(), paths: ['fixtures/clean-release.md'], format: 'json', failOn: 'error' });
  assert.equal(failed, false);
  assert.equal(result.summary.error, 0);
});

test('risky fixture reports destructive and network shell risks', () => {
  const { result, failed } = runCheck({ cwd: process.cwd(), paths: ['fixtures/risky-production.md'], format: 'json', failOn: 'warning' });
  const rules = result.findings.map((finding) => finding.ruleId);
  assert.equal(failed, true);
  assert.ok(rules.includes('dangerous-delete'));
  assert.ok(rules.includes('network-pipe-shell'));
  assert.ok(rules.includes('privileged-command'));
});

test('missing rollback fixture reports rollback coverage gap', () => {
  const { result } = runCheck({ cwd: process.cwd(), paths: ['fixtures/missing-rollback.md'], format: 'markdown', failOn: 'error' });
  assert.ok(result.findings.some((finding) => finding.ruleId === 'missing-heading' && finding.message.includes('rollback')));
});

test('approval bypass wording is flagged in shell procedures', () => {
  const { result } = runCheck({ cwd: process.cwd(), paths: ['fixtures/approval-bypass.md'], format: 'json', failOn: 'error' });
  assert.ok(result.findings.some((finding) => finding.ruleId === 'approval-bypass'));
});

test('tilde shell fences receive destructive-command checks and fail the CLI threshold', () => {
  const { result, failed } = runCheck({ cwd: process.cwd(), paths: ['fixtures/risky-tilde-fence.md'], format: 'json', failOn: 'warning' });
  const finding = result.findings.find((item) => item.ruleId === 'dangerous-delete');
  assert.equal(failed, true);
  assert.equal(finding?.line, 15);

  const cli = spawnSync(process.execPath, ['dist/cli.js', 'check', 'fixtures/risky-tilde-fence.md', '--format', 'json', '--fail-on', 'warning'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(cli.status, 1, cli.stderr);
  assert.ok(JSON.parse(cli.stdout).findings.some((item) => item.ruleId === 'dangerous-delete' && item.line === 15));
});

test('CLI creates output parent directories and overwrites an existing report', () => {
  const directory = mkdtempSync(join(tmpdir(), 'runbooklint-output-'));
  const report = join(directory, 'reports', 'nested', 'runbooklint.json');

  try {
    const args = ['dist/cli.js', 'check', 'fixtures/clean-release.md', '--format', 'json', '--output', report];
    const first = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' });
    assert.equal(first.status, 0, first.stderr);
    assert.equal(JSON.parse(readFileSync(report, 'utf8')).summary.error, 0);

    writeFileSync(report, 'stale report');
    const second = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(JSON.parse(readFileSync(report, 'utf8')).summary.error, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('library rejects an output path that aliases an explicit Markdown input', () => {
  const source = join(process.cwd(), 'fixtures', 'clean-release.md');
  assert.throws(
    () => runCheck({ cwd: process.cwd(), paths: ['fixtures/clean-release.md'], format: 'json', failOn: 'error', output: source }),
    /Output path aliases an explicitly selected Markdown input/,
  );
});

test('CLI never overwrites an explicit source through a relative output alias', () => {
  const directory = mkdtempSync(join(tmpdir(), 'runbooklint-collision-'));
  const source = join(directory, 'source.md');
  const content = readFileSync('fixtures/clean-release.md', 'utf8');
  writeFileSync(source, content);

  try {
    const cli = spawnSync(process.execPath, [join(process.cwd(), 'dist/cli.js'), 'check', './source.md', '--format', 'json', '--output', source], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(cli.status, 2);
    assert.match(cli.stderr, /Output path aliases an explicitly selected Markdown input/);
    assert.equal(readFileSync(source, 'utf8'), content);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('repeated directory checks do not lint their own Markdown report', () => {
  const directory = mkdtempSync(join(tmpdir(), 'runbooklint-repeat-'));
  writeFileSync(join(directory, 'runbook.md'), readFileSync('fixtures/clean-release.md', 'utf8'));
  writeFileSync(join(directory, 'report-copy.md'), readFileSync('fixtures/clean-release.md', 'utf8'));

  try {
    const report = join(directory, 'report.md');
    const options = { cwd: directory, paths: ['.'], format: 'markdown', failOn: 'error', output: './report.md' };
    assert.deepEqual(runCheck(options).result.files, ['report-copy.md', 'runbook.md']);
    assert.deepEqual(runCheck(options).result.files, ['report-copy.md', 'runbook.md']);
    assert.ok(readFileSync(report, 'utf8').startsWith('# RunbookLint Report'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('local link checks accept titles and balanced parentheses but report missing targets', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'runbooklint-links-'));
  mkdirSync(join(cwd, 'docs'));
  writeFileSync(join(cwd, 'docs', 'guide.md'), 'guide');
  writeFileSync(join(cwd, 'docs', 'guide_(advanced).md'), 'advanced');
  writeFileSync(join(cwd, 'docs', 'release guide.md'), 'release');
  writeFileSync(join(cwd, 'runbook.md'), '[guide](docs/guide.md "Guide title")\n[advanced](docs/guide_(advanced).md)\n[release](<docs/release guide.md>)\n[missing](<docs/missing guide.md>)\n');

  const { result } = runCheck({ cwd, paths: ['runbook.md'], format: 'json', failOn: 'warning' });
  const broken = result.findings.filter((finding) => finding.ruleId === 'broken-local-link');
  assert.deepEqual(broken.map(({ line, message }) => ({ line, message })), [
    { line: 4, message: 'Local link target does not exist: docs/missing guide.md.' },
  ]);
});
