import type { MarkdownDocument } from './types.js';

function slugify(text: string): string {
  return text.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function parseMarkdown(path: string, content: string): MarkdownDocument {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  const codeFences = [];
  const checklistItems = [];
  const links = [];
  const variables = new Map<string, number[]>();
  const todos = [];
  let fence: { language: string; startLine: number; body: string[] } | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    const line = lines[index] ?? '';
    const fenceMatch = line.match(/^```\s*([^`]*)\s*$/);
    if (fenceMatch) {
      if (fence) {
        codeFences.push({ language: fence.language, content: fence.body.join('\n'), startLine: fence.startLine, endLine: lineNo });
        fence = undefined;
      } else {
        fence = { language: fenceMatch[1]?.trim() ?? '', startLine: lineNo, body: [] };
      }
      continue;
    }
    if (fence) {
      fence.body.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const text = heading[2] ?? '';
      headings.push({ level: (heading[1] ?? '').length, text, slug: slugify(text), line: lineNo });
    }

    const checklist = line.match(/^\s*[-*]\s+\[([ xX])]\s+(.+)$/);
    if (checklist) checklistItems.push({ checked: (checklist[1] ?? '').toLowerCase() === 'x', text: checklist[2] ?? '', line: lineNo });

    for (const match of line.matchAll(/\[([^\]]+)]\(([^)]+)\)/g)) {
      links.push({ text: match[1] ?? '', href: match[2] ?? '', line: lineNo });
    }

    for (const match of line.matchAll(/\{\{\s*([A-Z][A-Z0-9_]*)\s*}}|\$\{\s*([A-Z][A-Z0-9_]*)\s*}/g)) {
      const name = match[1] ?? match[2];
      if (!name) continue;
      variables.set(name, [...(variables.get(name) ?? []), lineNo]);
    }

    if (/\b(TODO|TBD|FIXME)\b/i.test(line)) todos.push({ text: line.trim(), line: lineNo });
  }

  if (fence) codeFences.push({ language: fence.language, content: fence.body.join('\n'), startLine: fence.startLine, endLine: lines.length });

  return { path, content, lines, headings, codeFences, checklistItems, links, variables, todos };
}

export function hasHeading(doc: MarkdownDocument, candidates: string[]): boolean {
  const wanted = new Set(candidates.map(slugify));
  return doc.headings.some((heading) => wanted.has(heading.slug));
}

export function firstHeadingLine(doc: MarkdownDocument, candidates: string[]): number {
  const wanted = new Set(candidates.map(slugify));
  return doc.headings.find((heading) => wanted.has(heading.slug))?.line ?? 1;
}

export function sectionText(doc: MarkdownDocument, candidate: string): string | undefined {
  const slug = slugify(candidate);
  const headingIndex = doc.headings.findIndex((heading) => heading.slug === slug);
  const heading = doc.headings[headingIndex];
  if (!heading) return undefined;
  const next = doc.headings.slice(headingIndex + 1).find((item) => item.level <= heading.level);
  return doc.lines.slice(heading.line, (next?.line ?? doc.lines.length + 1) - 1).join('\n').trim();
}
