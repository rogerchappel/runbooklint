import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { collectMarkdownFiles } from '../dist/files.js';

function withFixture(run) {
  const cwd = mkdtempSync(join(tmpdir(), 'runbooklint-files-'));
  try {
    mkdirSync(join(cwd, 'ignored-docs'));
    writeFileSync(join(cwd, '.gitignore'), 'ignored-docs/\nignored.md\n');
    writeFileSync(join(cwd, 'included.md'), '# Included\n');
    writeFileSync(join(cwd, 'ignored.md'), '# Ignored\n');
    writeFileSync(join(cwd, 'ignored-docs', 'runbook.md'), '# Explicit directory\n');
    run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test('explicit ignored Markdown files are collected', () => {
  withFixture((cwd) => {
    assert.deepEqual(collectMarkdownFiles(cwd, ['ignored.md']), [join(cwd, 'ignored.md')]);
  });
});

test('explicit ignored directories are traversed', () => {
  withFixture((cwd) => {
    assert.deepEqual(collectMarkdownFiles(cwd, ['ignored-docs']), [join(cwd, 'ignored-docs', 'runbook.md')]);
  });
});

test('default discovery continues to respect gitignore', () => {
  withFixture((cwd) => {
    assert.deepEqual(collectMarkdownFiles(cwd, []), [join(cwd, 'included.md')]);
  });
});

test('explicit inputs without Markdown files fail loudly', () => {
  withFixture((cwd) => {
    assert.throws(
      () => collectMarkdownFiles(cwd, ['.gitignore']),
      /No Markdown files found for explicit path/,
    );
  });
});
