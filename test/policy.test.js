import assert from 'node:assert/strict';
import test from 'node:test';
import { presetPolicy } from '../dist/index.js';

test('agent handoff preset requires handoff-oriented sections and variables', () => {
  const policy = presetPolicy('agent-handoff');
  assert.ok(policy.requiredHeadings.includes('current state'));
  assert.ok(policy.requiredVariableDefinitions.includes('OWNER'));
  assert.ok(policy.requiredVariableDefinitions.includes('TARGET_ENV'));
});

test('unknown presets fail loudly', () => {
  assert.throws(() => presetPolicy('wat'), /Unknown preset/);
});
