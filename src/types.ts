export type Severity = 'info' | 'warning' | 'error';

export interface Heading {
  level: number;
  text: string;
  slug: string;
  line: number;
}

export interface CodeFence {
  language: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ChecklistItem {
  checked: boolean;
  text: string;
  line: number;
}

export interface LinkRef {
  text: string;
  href: string;
  line: number;
}

export interface MarkdownDocument {
  path: string;
  content: string;
  lines: string[];
  headings: Heading[];
  codeFences: CodeFence[];
  checklistItems: ChecklistItem[];
  links: LinkRef[];
  variables: Map<string, number[]>;
  todos: Array<{ text: string; line: number }>;
}

export interface CommandRiskPattern {
  id: string;
  pattern: string;
  severity: Severity;
  message: string;
  suggestion: string;
}

export interface Policy {
  requiredHeadings: string[];
  ownerHeadings: string[];
  environmentHeadings: string[];
  validationHeadings: string[];
  rollbackHeadings: string[];
  commandRiskPatterns: CommandRiskPattern[];
  bannedPhrases: Array<{ phrase: string; severity: Severity; suggestion: string }>;
  requiredVariableDefinitions: string[];
  allowMissingOwner: boolean;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  message: string;
  suggestion: string;
}

export interface LintResult {
  files: string[];
  findings: Finding[];
  summary: Record<Severity, number> & { files: number; findings: number };
}

export interface CheckOptions {
  cwd: string;
  paths: string[];
  format: 'markdown' | 'json';
  failOn: Severity;
  output?: string;
  policyPath?: string;
}
