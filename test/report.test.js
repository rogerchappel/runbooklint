import assert from 'node:assert/strict';
import test from 'node:test';
import { runCheck } from '../dist/index.js';
import { renderJson, renderMarkdown } from '../dist/report.js';

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

test('markdown reports contain dynamic finding fields without changing structure', () => {
  const result = {
    files: ['odd`name.md'],
    findings: [{
      ruleId: 'policy`rule',
      severity: 'error',
      file: 'odd`name.md',
      line: 7,
      message: 'message\n## INJECTED *heading* [link](https://example.com)',
      suggestion: 'fix\n- injected item `now`'
    }],
    summary: { files: 1, findings: 1, error: 1, warning: 0, info: 0 }
  };

  const markdown = renderMarkdown(result);
  assert.match(markdown, /`policy`rule`/);
  assert.match(markdown, /`odd`name\.md:7`/);
  assert.equal(markdown.match(/^## /gm)?.length, 1);
  assert.equal(markdown.match(/^- /gm)?.length, 1);
  assert.doesNotMatch(markdown, /^## INJECTED/m);
  assert.doesNotMatch(markdown, /^- injected item/m);
  assert.match(markdown, /message<br>\\#\\# INJECTED/);
  assert.match(markdown, /Fix: fix<br>\\- injected item/);

  assert.equal(renderJson(result), `${JSON.stringify(result, null, 2)}\n`);
});
