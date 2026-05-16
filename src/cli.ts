#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { presetPolicy } from './policy.js';
import { runCheck } from './index.js';
import type { Severity } from './types.js';

function usage(): string {
  return `RunbookLint\n\nUsage:\n  runbooklint check [paths...] [--format markdown|json] [--fail-on info|warning|error] [--output file] [--policy file]\n  runbooklint init [--preset oss-release|incident|agent-handoff] [--print] [--force]\n  runbooklint --help\n`;
}

function take(args: string[], flag: string, fallback?: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  args.splice(index, 2);
  return value;
}

function has(args: string[], flag: string): boolean {
  const index = args.indexOf(flag);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
}

function assertSeverity(value: string | undefined): Severity {
  if (value === 'info' || value === 'warning' || value === 'error') return value;
  throw new Error(`Invalid severity: ${value}`);
}

function main(argv: string[]): number {
  const args = [...argv];
  if (args.length === 0 || has(args, '--help') || has(args, '-h')) {
    process.stdout.write(usage());
    return 0;
  }

  const command = args.shift();
  if (command === 'init') {
    const preset = take(args, '--preset', 'oss-release') ?? 'oss-release';
    const print = has(args, '--print');
    const force = has(args, '--force');
    if (args.length > 0) throw new Error(`Unknown init arguments: ${args.join(' ')}`);
    const policy = presetPolicy(preset);
    const body = `${JSON.stringify(policy, null, 2)}\n`;
    if (print) {
      process.stdout.write(body);
      return 0;
    }
    const path = resolve(process.cwd(), '.runbooklint.json');
    if (existsSync(path) && !force) throw new Error('.runbooklint.json already exists; pass --force to overwrite');
    writeFileSync(path, body, 'utf8');
    process.stdout.write(`Created .runbooklint.json with ${preset} preset\n`);
    return 0;
  }

  if (command === 'check') {
    const format = take(args, '--format', 'markdown');
    if (format !== 'markdown' && format !== 'json') throw new Error(`Invalid format: ${format}`);
    const failOn = assertSeverity(take(args, '--fail-on', 'error'));
    const output = take(args, '--output');
    const policyPath = take(args, '--policy');
    const { output: rendered, failed } = runCheck({ cwd: process.cwd(), paths: args, format, failOn, output, policyPath });
    if (!output) process.stdout.write(rendered);
    return failed ? 1 : 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${usage()}`);
  process.exitCode = 2;
}
