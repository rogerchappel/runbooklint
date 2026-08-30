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

test('parser preserves balanced destination parentheses and removes optional link titles', () => {
  const doc = parseMarkdown('links.md', '[guide](docs/guide.md "Guide title")\n[advanced](docs/guide_(advanced).md)');

  assert.deepEqual(doc.links, [
    { text: 'guide', href: 'docs/guide.md', line: 1 },
    { text: 'advanced', href: 'docs/guide_(advanced).md', line: 2 },
  ]);
});

test('parser extracts tilde fences with info strings and matching close delimiters', () => {
  const content = '# Procedure\n~~~bash session=production\necho ready\n~~~\ntext\n~~~~zsh\necho done\n~~~\n~~~~~\n';
  const doc = parseMarkdown('tilde-fences.md', content);

  assert.deepEqual(doc.codeFences, [
    { language: 'bash', content: 'echo ready', startLine: 2, endLine: 4 },
    { language: 'zsh', content: 'echo done\n~~~', startLine: 6, endLine: 9 },
  ]);
});
