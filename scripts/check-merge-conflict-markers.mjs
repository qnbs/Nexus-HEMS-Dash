#!/usr/bin/env node
/**
 * Fails if Git merge conflict markers are committed in tracked source/docs paths.
 * Skips node_modules, dist, lockfiles, and this script's intentional examples.
 */
import { execSync } from 'node:child_process';
import { extname } from 'node:path';

const MARKERS = ['<<<<<<<', '=======', '>>>>>>>'];
const ALLOWED_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.md',
  '.yaml',
  '.yml',
  '.json',
  '.css',
  '.html',
  '.sh',
]);

const grep = execSync(
  `git grep -n -E '^<<<<<<<|^=======|^>>>>>>>' -- 'apps' 'packages' 'docs' 'scripts' '.github' || true`,
  { encoding: 'utf8' },
);

const hits = grep
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => {
    const file = line.split(':')[0] ?? '';
    const ext = extname(file);
    if (file.includes('check-merge-conflict-markers')) return false;
    return ALLOWED_EXT.has(ext);
  });

if (hits.length > 0) {
  console.error('Committed merge conflict markers found:\n');
  for (const hit of hits) {
    console.error(`  ${hit}`);
  }
  process.exit(1);
}

console.log('No merge conflict markers in source/docs paths.');
