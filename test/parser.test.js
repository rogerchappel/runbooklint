import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseMarkdown } from '../dist/index.js';

test('parser extracts headings, fences, checklists, links and variables', () => {
  const content = `${readFileSync('fixtures/clean-release.md', 'utf8')}\nSee [docs](https://example.com).\nUse {{TARGET_ENV}}.\n`;
  const doc = parseMarkdown('fixtures/clean-release.md', content);
  assert.equal(doc.headings[0].text, 'Release Runbook');
  assert.equal(doc.codeFences.length, 1);
  assert.equal(doc.checklistItems.length, 2);
  assert.equal(doc.links.length, 1);
  assert.ok(doc.variables.has('TARGET_ENV'));
});
