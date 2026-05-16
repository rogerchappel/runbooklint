import assert from 'node:assert/strict';
import test from 'node:test';
import { runCheck } from '../dist/index.js';

test('markdown reports are deterministic and grouped by severity', () => {
  const first = runCheck({ cwd: process.cwd(), paths: ['fixtures/risky-production.md'], format: 'markdown', failOn: 'error' }).output;
  const second = runCheck({ cwd: process.cwd(), paths: ['fixtures/risky-production.md'], format: 'markdown', failOn: 'error' }).output;
  assert.equal(first, second);
  assert.match(first, /^# RunbookLint Report/);
  assert.match(first, /## ERROR/);
  assert.match(first, /## WARNING/);
});

test('json reports include stable summary counts', () => {
  const { output } = runCheck({ cwd: process.cwd(), paths: ['fixtures/risky-production.md'], format: 'json', failOn: 'error' });
  const parsed = JSON.parse(output);
  assert.equal(parsed.files[0], 'fixtures/risky-production.md');
  assert.equal(parsed.summary.files, 1);
  assert.ok(parsed.summary.findings >= 1);
});
