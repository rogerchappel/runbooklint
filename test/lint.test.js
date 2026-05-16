import assert from 'node:assert/strict';
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
