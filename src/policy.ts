import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Policy } from './types.js';

export const defaultPolicy: Policy = {
  requiredHeadings: ['purpose', 'scope', 'prerequisites', 'procedure', 'validation', 'rollback'],
  ownerHeadings: ['owner', 'owners', 'handoff', 'contacts'],
  environmentHeadings: ['environment', 'scope', 'target environment'],
  validationHeadings: ['validation', 'verify', 'verification', 'checks'],
  rollbackHeadings: ['rollback', 'recovery', 'backout'],
  requiredVariableDefinitions: [],
  allowMissingOwner: false,
  bannedPhrases: [
    { phrase: 'just run', severity: 'warning', suggestion: 'Replace casual execution language with explicit safety context.' },
    { phrase: 'probably', severity: 'info', suggestion: 'Use precise confidence and verification language.' },
    { phrase: 'todo', severity: 'warning', suggestion: 'Resolve TODO placeholders before relying on this runbook.' },
    { phrase: 'tbd', severity: 'warning', suggestion: 'Replace TBD placeholders with concrete instructions.' }
  ],
  commandRiskPatterns: [
    {
      id: 'dangerous-delete',
      pattern: String.raw`\brm\s+(-[rfv]*[rfv][rfv]*|--recursive|--force)` ,
      severity: 'error',
      message: 'Destructive delete command needs explicit safety notes.',
      suggestion: 'Add target scope, backup/restore notes, and dry-run or confirmation steps.'
    },
    {
      id: 'privileged-command',
      pattern: String.raw`\bsudo\b`,
      severity: 'warning',
      message: 'Privileged command needs authorization and scope.',
      suggestion: 'Document who may run it and which hosts or environments are in scope.'
    },
    {
      id: 'network-pipe-shell',
      pattern: String.raw`\b(curl|wget)\b.*\|\s*(sh|bash)\b`,
      severity: 'error',
      message: 'Piping downloaded content into a shell is high risk.',
      suggestion: 'Pin and verify downloaded artifacts before execution.'
    },
    {
      id: 'force-push',
      pattern: String.raw`\bgit\s+push\b.*\s--force(?:-with-lease)?\b`,
      severity: 'warning',
      message: 'Force push command needs coordination notes.',
      suggestion: 'Add branch, reviewer, and recovery expectations.'
    },
    {
      id: 'production-touch',
      pattern: String.raw`\b(prod|production)\b`,
      severity: 'info',
      message: 'Production command should have validation and rollback coverage.',
      suggestion: 'Ensure the runbook clearly states environment scope, validation, and rollback.'
    }
  ]
};

export function loadPolicy(cwd: string, policyPath?: string): Policy {
  const candidates = policyPath ? [resolve(cwd, policyPath)] : [join(cwd, '.runbooklint.json')];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) return structuredClone(defaultPolicy);

  const parsed = JSON.parse(readFileSync(found, 'utf8')) as Partial<Policy>;
  return {
    ...structuredClone(defaultPolicy),
    ...parsed,
    commandRiskPatterns: parsed.commandRiskPatterns ?? defaultPolicy.commandRiskPatterns,
    bannedPhrases: parsed.bannedPhrases ?? defaultPolicy.bannedPhrases,
    requiredHeadings: parsed.requiredHeadings ?? defaultPolicy.requiredHeadings,
    ownerHeadings: parsed.ownerHeadings ?? defaultPolicy.ownerHeadings,
    environmentHeadings: parsed.environmentHeadings ?? defaultPolicy.environmentHeadings,
    validationHeadings: parsed.validationHeadings ?? defaultPolicy.validationHeadings,
    rollbackHeadings: parsed.rollbackHeadings ?? defaultPolicy.rollbackHeadings,
    requiredVariableDefinitions: parsed.requiredVariableDefinitions ?? defaultPolicy.requiredVariableDefinitions
  };
}

export function presetPolicy(name: string): Policy {
  const base = structuredClone(defaultPolicy);
  if (name === 'agent-handoff') {
    base.requiredHeadings = ['context', 'owner', 'current state', 'next steps', 'validation', 'rollback'];
    base.requiredVariableDefinitions = ['OWNER', 'TARGET_ENV'];
    return base;
  }
  if (name === 'incident') {
    base.requiredHeadings = ['summary', 'severity', 'owner', 'impact', 'mitigation', 'validation', 'rollback'];
    return base;
  }
  if (name === 'oss-release') return base;
  throw new Error(`Unknown preset: ${name}`);
}
