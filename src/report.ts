import type { Finding, LintResult, Severity } from './types.js';

const severities: Severity[] = ['error', 'warning', 'info'];

function inlineCode(value: string): string {
  const runs = value.match(/`+/g) ?? [];
  const fence = '`'.repeat(Math.max(1, ...runs.map((run) => run.length + 1)));
  const padding = value.startsWith('`') || value.endsWith('`') || value.startsWith(' ') || value.endsWith(' ') ? ' ' : '';
  return `${fence}${padding}${value}${padding}${fence}`;
}

function markdownText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/([`*_{}\[\]()<>#+\-.!|])/g, '\\$1')
    .replace(/\r?\n/g, '<br>');
}

export function summarize(files: string[], findings: Finding[]): LintResult['summary'] {
  return {
    files: files.length,
    findings: findings.length,
    error: findings.filter((item) => item.severity === 'error').length,
    warning: findings.filter((item) => item.severity === 'warning').length,
    info: findings.filter((item) => item.severity === 'info').length
  };
}

export function renderJson(result: LintResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function renderMarkdown(result: LintResult): string {
  const lines = ['# RunbookLint Report', ''];
  lines.push(`Files checked: ${result.summary.files}`);
  lines.push(`Findings: ${result.summary.findings}`);
  lines.push(`Errors: ${result.summary.error}`);
  lines.push(`Warnings: ${result.summary.warning}`);
  lines.push(`Info: ${result.summary.info}`);
  lines.push('');

  if (result.findings.length === 0) {
    lines.push('No findings.');
    return `${lines.join('\n')}\n`;
  }

  for (const severity of severities) {
    const group = result.findings.filter((item) => item.severity === severity);
    if (group.length === 0) continue;
    lines.push(`## ${severity.toUpperCase()}`);
    lines.push('');
    for (const item of group) {
      lines.push(`- ${inlineCode(item.ruleId)} ${inlineCode(`${item.file}:${item.line}`)} — ${markdownText(item.message)}`);
      lines.push(`  - Fix: ${markdownText(item.suggestion)}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
