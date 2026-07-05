import type { CommandDefinition } from './types';

const SCORE_EMPTY_BASE = 10;
const SCORE_EMPTY_FAVORITE = 50;
const SCORE_EMPTY_RECENT = 25;
const SCORE_EMPTY_CONTEXTUAL = 30;
const SCORE_EMPTY_AI = 35;

const SCORE_EXACT = 120;
const SCORE_PREFIX = 100;
const SCORE_INCLUDES = 60;
const SCORE_KEYWORD_EXACT = 50;
const SCORE_KEYWORD_PREFIX = 40;
const SCORE_KEYWORD_INCLUDES = 25;
const SCORE_ID_TAIL = 15;

const SCORE_BOOST_FAVORITE = 20;
const SCORE_BOOST_RECENT = 15;
const SCORE_BOOST_CONTEXTUAL = 25;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s\-_/]+/)
    .filter(Boolean);
}

function scoreEmptyQuery(
  cmd: CommandDefinition,
  boosts: { recent: boolean; favorite: boolean; contextual: boolean },
): number {
  let base = SCORE_EMPTY_BASE;
  if (boosts.favorite) base += SCORE_EMPTY_FAVORITE;
  if (boosts.recent) base += SCORE_EMPTY_RECENT;
  if (boosts.contextual) base += SCORE_EMPTY_CONTEXTUAL;
  if (cmd.source === 'ai') base += SCORE_EMPTY_AI;
  return base;
}

function scoreLabelMatch(labelNorm: string, q: string): number {
  if (labelNorm === q) return SCORE_EXACT;
  if (labelNorm.startsWith(q)) return SCORE_PREFIX;
  if (labelNorm.includes(q)) return SCORE_INCLUDES;
  return 0;
}

function scoreKeywordMatches(keywords: string[], q: string): number {
  let score = 0;
  for (const kw of keywords) {
    const kn = normalize(kw);
    if (kn === q) score += SCORE_KEYWORD_EXACT;
    else if (kn.startsWith(q)) score += SCORE_KEYWORD_PREFIX;
    else if (kn.includes(q)) score += SCORE_KEYWORD_INCLUDES;
  }
  return score;
}

function applyQueryBoosts(
  score: number,
  boosts: { recent: boolean; favorite: boolean; contextual: boolean },
): number {
  let next = score;
  if (boosts.favorite) next += SCORE_BOOST_FAVORITE;
  if (boosts.recent) next += SCORE_BOOST_RECENT;
  if (boosts.contextual) next += SCORE_BOOST_CONTEXTUAL;
  return next;
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
  if (!q) return scoreEmptyQuery(cmd, boosts);

  const labelNorm = normalize(label);
  let score = scoreLabelMatch(labelNorm, q);
  score += scoreKeywordMatches(cmd.keywords ?? [], q);

  const idTail = cmd.id.split('.').pop() ?? cmd.id;
  if (normalize(idTail).includes(q)) score += SCORE_ID_TAIL;

  // Do not surface unrelated commands via boosts when the query has no text match.
  if (score === 0) return 0;

  return applyQueryBoosts(score, boosts);
}

export function buildSearchTokens(label: string, keywords: string[] = []): string[] {
  return [...tokenize(label), ...keywords.flatMap((k) => tokenize(k))];
}
