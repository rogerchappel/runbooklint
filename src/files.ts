import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

function readGitignore(cwd: string): string[] {
  const path = resolve(cwd, '.gitignore');
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function ignored(rel: string, patterns: string[]): boolean {
  const normalized = rel.replace(/\\/g, '/');
  let result = false;
  for (const pattern of patterns) {
    const negated = pattern.startsWith('!');
    const value = negated ? pattern.slice(1) : pattern;
    const anchored = value.startsWith('/');
    const clean = value.replace(/^\//, '').replace(/\/$/, '');
    if (!clean) continue;
    const pathPattern = clean.includes('/');
    const source = clean.split('*').map(escapeRegExp).join('[^/]*');
    const re = anchored || pathPattern
      ? new RegExp(`^${source}(?:/.*)?$`)
      : new RegExp(`(?:^|/)${source}(?:/.*)?$`);
    if (re.test(normalized)) result = !negated;
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function collectMarkdownFiles(cwd: string, inputs: string[]): string[] {
  const patterns = readGitignore(cwd);
  const visited = new Set<string>();
  const out: string[] = [];
  const explicit = inputs.length > 0;
  const queue = explicit ? inputs : ['.'];

  function visit(abs: string, respectGitignore: boolean): void {
    const rel = relative(cwd, abs) || '.';
    if (respectGitignore && rel !== '.' && ignored(rel, patterns)) return;
    if (visited.has(abs)) return;
    visited.add(abs);

    const stats = statSync(abs);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(abs).sort((a, b) => a.localeCompare(b))) {
        if (entry === '.git' || entry === 'node_modules' || entry === 'dist') continue;
        visit(resolve(abs, entry), respectGitignore);
      }
      return;
    }

    if (stats.isFile() && ['.md', '.markdown'].includes(extname(abs).toLowerCase())) out.push(abs);
  }

  for (const input of queue) visit(resolve(cwd, input), !explicit);
  if (explicit && out.length === 0) {
    throw new Error(`No Markdown files found for explicit path${inputs.length === 1 ? '' : 's'}: ${inputs.join(', ')}`);
  }
  return out.sort((a, b) => relative(cwd, a).localeCompare(relative(cwd, b)));
}
