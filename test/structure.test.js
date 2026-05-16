import assert from 'node:assert/strict';
import test from 'node:test';
import { runCheck } from '../dist/index.js';

test('structural fixture reports document-shape findings', () => {
  const { result } = runCheck({ cwd: process.cwd(), paths: ['fixtures/structural-issues.md'], format: 'json', failOn: 'error' });
  const rules = new Set(result.findings.map((finding) => finding.ruleId));
  assert.ok(rules.has('empty-section'));
  assert.ok(rules.has('unchecked-task'));
  assert.ok(rules.has('duplicate-heading'));
  assert.ok(rules.has('broken-local-link'));
  assert.ok(rules.has('weak-procedure'));
});
