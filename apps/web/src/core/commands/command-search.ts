import type { CommandDefinition } from './types';

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s\-_/]+/)
    .filter(Boolean);
}

/**
 * Lightweight fuzzy scorer — no external deps, target <5ms @500 commands.
 */
export function scoreCommand(
  cmd: CommandDefinition,
  label: string,
  query: string,
  boosts: { recent: boolean; favorite: boolean; contextual: boolean },
): number {
  const q = normalize(query.trim());
  if (!q) {
    let base = 10;
    if (boosts.favorite) base += 50;
    if (boosts.recent) base += 25;
    if (boosts.contextual) base += 30;
    return base;
  }

  const labelNorm = normalize(label);
  let score = 0;

  if (labelNorm === q) score += 120;
  else if (labelNorm.startsWith(q)) score += 100;
  else if (labelNorm.includes(q)) score += 60;

  const keywords = cmd.keywords ?? [];
  for (const kw of keywords) {
    const kn = normalize(kw);
    if (kn === q) score += 50;
    else if (kn.startsWith(q)) score += 40;
    else if (kn.includes(q)) score += 25;
  }

  const idTail = cmd.id.split('.').pop() ?? cmd.id;
  if (normalize(idTail).includes(q)) score += 15;

  // Do not surface unrelated commands via boosts when the query has no text match.
  if (q && score === 0) return 0;

  if (boosts.favorite) score += 20;
  if (boosts.recent) score += 15;
  if (boosts.contextual) score += 25;

  return score;
}

export function buildSearchTokens(label: string, keywords: string[] = []): string[] {
  return [...tokenize(label), ...keywords.flatMap((k) => tokenize(k))];
}
