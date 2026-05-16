import { relative } from 'node:path';
import type { Finding, MarkdownDocument, Policy, Severity } from './types.js';
import { firstHeadingLine, hasHeading } from './markdown.js';

const severityRank: Record<Severity, number> = { info: 0, warning: 1, error: 2 };

function finding(ruleId: string, severity: Severity, file: string, line: number, message: string, suggestion: string): Finding {
  return { ruleId, severity, file, line, message, suggestion };
}

function containsSafetyNote(doc: MarkdownDocument, line: number): boolean {
  const window = doc.lines.slice(Math.max(0, line - 4), Math.min(doc.lines.length, line + 4)).join('\n').toLowerCase();
  return /dry[- ]run|backup|confirm|approval|maintenance window|rollback|restore|scope/.test(window);
}

function variablesDefined(doc: MarkdownDocument): Set<string> {
  const defined = new Set<string>();
  for (const line of doc.lines) {
    const match = line.match(/^\s*[-*]?\s*`?([A-Z][A-Z0-9_]*)`?\s*[:=–-]\s+\S+/);
    if (match?.[1]) defined.add(match[1]);
  }
  return defined;
}

export function lintDocument(cwd: string, doc: MarkdownDocument, policy: Policy): Finding[] {
  const file = relative(cwd, doc.path) || doc.path;
  const findings: Finding[] = [];

  for (const required of policy.requiredHeadings) {
    if (!hasHeading(doc, [required])) {
      findings.push(finding('missing-heading', 'error', file, 1, `Missing required heading: ${required}.`, `Add a '${required}' section with concrete instructions.`));
    }
  }

  if (!policy.allowMissingOwner && !hasHeading(doc, policy.ownerHeadings)) {
    findings.push(finding('missing-owner', 'warning', file, 1, 'Runbook does not identify an owner or handoff contact.', 'Add an Owner, Owners, Contacts, or Handoff section.'));
  }
  if (!hasHeading(doc, policy.environmentHeadings)) {
    findings.push(finding('missing-environment', 'warning', file, 1, 'Runbook does not clearly state environment scope.', 'Add the target environment, systems, accounts, regions, and exclusions.'));
  }
  if (doc.codeFences.length > 0 && !hasHeading(doc, policy.validationHeadings)) {
    findings.push(finding('missing-validation', 'error', file, 1, 'Runbook contains commands but no validation section.', 'Add post-change checks that prove success or safe failure.'));
  }
  if (doc.codeFences.length > 0 && !hasHeading(doc, policy.rollbackHeadings)) {
    findings.push(finding('missing-rollback', 'error', file, 1, 'Runbook contains commands but no rollback section.', 'Add rollback, backout, or recovery steps.'));
  }

  for (const todo of doc.todos) {
    findings.push(finding('stale-placeholder', 'warning', file, todo.line, 'Placeholder text remains in the runbook.', 'Replace TODO/TBD/FIXME placeholders before operational use.'));
  }

  for (const banned of policy.bannedPhrases) {
    const phrase = banned.phrase.toLowerCase();
    doc.lines.forEach((line, index) => {
      if (line.toLowerCase().includes(phrase)) {
        findings.push(finding('banned-phrase', banned.severity, file, index + 1, `Avoid vague or unsafe phrase: ${banned.phrase}.`, banned.suggestion));
      }
    });
  }

  for (const fence of doc.codeFences) {
    const isShell = /^(sh|shell|bash|zsh|console|terminal)?$/i.test(fence.language);
    if (!isShell) continue;
    const commands = fence.content.split('\n');
    commands.forEach((command, offset) => {
      const line = fence.startLine + offset + 1;
      for (const risk of policy.commandRiskPatterns) {
        const re = new RegExp(risk.pattern, 'i');
        if (re.test(command)) {
          const severity = containsSafetyNote(doc, line) && severityRank[risk.severity] > severityRank.info ? 'warning' : risk.severity;
          findings.push(finding(risk.id, severity, file, line, risk.message, risk.suggestion));
        }
      }
    });
  }

  const defined = variablesDefined(doc);
  for (const [name, lines] of doc.variables) {
    if (!defined.has(name) && !policy.requiredVariableDefinitions.includes(name)) {
      findings.push(finding('undefined-variable', 'warning', file, lines[0] ?? 1, `Variable ${name} is used but not defined.`, 'Define the variable in prerequisites or replace it with a concrete value.'));
    }
  }
  for (const required of policy.requiredVariableDefinitions) {
    if (!defined.has(required)) {
      findings.push(finding('missing-variable-definition', 'warning', file, firstHeadingLine(doc, ['prerequisites', 'context']), `Required variable ${required} is not defined.`, 'Define the variable in the runbook before it is used.'));
    }
  }

  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || severityRank[b.severity] - severityRank[a.severity] || a.ruleId.localeCompare(b.ruleId));
}

export function shouldFail(findings: Finding[], failOn: Severity): boolean {
  return findings.some((item) => severityRank[item.severity] >= severityRank[failOn]);
}
