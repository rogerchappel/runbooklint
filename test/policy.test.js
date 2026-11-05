import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { presetPolicy, runCheck } from '../dist/index.js';

test('agent handoff preset requires handoff-oriented sections and variables', () => {
  const policy = presetPolicy('agent-handoff');
  assert.ok(policy.requiredHeadings.includes('current state'));
  assert.ok(policy.requiredVariableDefinitions.includes('OWNER'));
  assert.ok(policy.requiredVariableDefinitions.includes('TARGET_ENV'));
});

test('unknown presets fail loudly', () => {
  assert.throws(() => presetPolicy('wat'), /Unknown preset/);
});

test('invalid custom command risk patterns return an actionable policy error', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'runbooklint-policy-'));
  try {
    writeFileSync(join(cwd, 'runbook.md'), '# Safe runbook\n');
    writeFileSync(join(cwd, '.runbooklint.json'), JSON.stringify({ commandRiskPatterns: [{
      id: 'broken', pattern: '[', severity: 'warning', message: 'test', suggestion: 'test'
    }] }));
    assert.throws(() => runCheck({ cwd, paths: ['runbook.md'], format: 'markdown', failOn: 'error' }),
      /Invalid policy commandRiskPatterns\[0\]\.pattern.*Invalid regular expression/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('valid custom command risk patterns remain supported', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'runbooklint-policy-'));
  try {
    writeFileSync(join(cwd, 'runbook.md'), '# Runbook\n\n## Procedure\n\n```sh\nsudo service app restart\n```\n');
    writeFileSync(join(cwd, '.runbooklint.json'), JSON.stringify({ commandRiskPatterns: [{
      id: 'custom-sudo', pattern: '\\bsudo\\b', severity: 'error', message: 'custom match', suggestion: 'review'
    }] }));
    const { result } = runCheck({ cwd, paths: ['runbook.md'], format: 'json', failOn: 'error' });
    assert.ok(result.findings.some((item) => item.ruleId === 'custom-sudo' && item.message === 'custom match'));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
