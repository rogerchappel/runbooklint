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
  const doc = parseMarkdown('links.md', '[guide](docs/guide.md "Guide title")\n[advanced](docs/guide_(advanced).md)\n[release](<docs/release guide.md> "Release guide")');

  assert.deepEqual(doc.links, [
    { text: 'guide', href: 'docs/guide.md', line: 1 },
    { text: 'advanced', href: 'docs/guide_(advanced).md', line: 2 },
    { text: 'release', href: 'docs/release guide.md', line: 3 },
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

test('Markdown constructs inside backtick and tilde fences are captured, not parsed as document content', () => {
  const content = '# Real heading\n```md\n# Fake heading\n[bad](missing.md)\nTODO {{FAKE_VAR}}\n- [ ] fake task\n```\n~~~md\n## Also fake\n[bad](other.md) FIXME ${ALSO_FAKE}\n- [x] fake tilde task\n~~~\n';
  const doc = parseMarkdown('fenced-content.md', content);

  assert.deepEqual(doc.headings.map(({ text }) => text), ['Real heading']);
  assert.deepEqual(doc.links, []);
  assert.deepEqual(doc.todos, []);
  assert.deepEqual(doc.checklistItems, []);
  assert.deepEqual([...doc.variables.keys()], []);
  assert.deepEqual(doc.codeFences.map(({ content: body }) => body), [
    '# Fake heading\n[bad](missing.md)\nTODO {{FAKE_VAR}}\n- [ ] fake task',
    '## Also fake\n[bad](other.md) FIXME ${ALSO_FAKE}\n- [x] fake tilde task',
  ]);
});
