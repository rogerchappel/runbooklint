import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { collectMarkdownFiles } from './files.js';
import { parseMarkdown } from './markdown.js';
import { loadPolicy } from './policy.js';
import { lintDocument, shouldFail } from './rules.js';
import { renderJson, renderMarkdown, summarize } from './report.js';
import type { CheckOptions, LintResult } from './types.js';

export { defaultPolicy, loadPolicy, presetPolicy } from './policy.js';
export { parseMarkdown } from './markdown.js';
export { lintDocument, shouldFail } from './rules.js';
export type { CheckOptions, Finding, LintResult, MarkdownDocument, Policy, Severity } from './types.js';

export function runCheck(options: CheckOptions): { result: LintResult; output: string; failed: boolean } {
  const policy = loadPolicy(options.cwd, options.policyPath);
  const files = collectMarkdownFiles(options.cwd, options.paths);
  const findings = files.flatMap((file) => lintDocument(options.cwd, parseMarkdown(file, readFileSync(file, 'utf8')), policy));
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId));
  const relFiles = files.map((file) => relative(options.cwd, file));
  const result: LintResult = { files: relFiles, findings, summary: summarize(relFiles, findings) };
  const output = options.format === 'json' ? renderJson(result) : renderMarkdown(result);
  if (options.output) writeFileSync(options.output, output, 'utf8');
  return { result, output, failed: shouldFail(findings, options.failOn) };
}
