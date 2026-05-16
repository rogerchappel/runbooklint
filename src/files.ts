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
  return patterns.some((pattern) => {
    const clean = pattern.replace(/^\//, '').replace(/\/$/, '');
    if (!clean) return false;
    if (clean.includes('*')) {
      const re = new RegExp(`^${clean.split('*').map(escapeRegExp).join('.*')}$`);
      return re.test(normalized);
    }
    return normalized === clean || normalized.startsWith(`${clean}/`) || normalized.endsWith(`/${clean}`);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function collectMarkdownFiles(cwd: string, inputs: string[]): string[] {
  const patterns = readGitignore(cwd);
  const visited = new Set<string>();
  const out: string[] = [];
  const queue = inputs.length > 0 ? inputs : ['.'];

  function visit(abs: string): void {
    const rel = relative(cwd, abs) || '.';
    if (rel !== '.' && ignored(rel, patterns)) return;
    if (visited.has(abs)) return;
    visited.add(abs);

    const stats = statSync(abs);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(abs).sort((a, b) => a.localeCompare(b))) {
        if (entry === '.git' || entry === 'node_modules' || entry === 'dist') continue;
        visit(resolve(abs, entry));
      }
      return;
    }

    if (stats.isFile() && ['.md', '.markdown'].includes(extname(abs).toLowerCase())) out.push(abs);
  }

  for (const input of queue) visit(resolve(cwd, input));
  return out.sort((a, b) => relative(cwd, a).localeCompare(relative(cwd, b)));
}
