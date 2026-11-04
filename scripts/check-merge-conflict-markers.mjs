#!/usr/bin/env node
/**
 * Fails if Git merge conflict markers are committed in tracked source/docs paths.
 */
import { execSync } from 'node:child_process';
import { extname } from 'node:path';
import { parseGitGrepHits } from './merge-conflict-marker-scan.mjs';

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

function allowFile(file) {
  const ext = extname(file);
  if (file.includes('check-merge-conflict-markers')) return false;
  if (file.includes('merge-conflict-marker-scan')) return false;
  if (file.includes('merge-conflict-marker-scan.test')) return false;
  return ALLOWED_EXT.has(ext);
}

const grep = execSync(
  `git grep -n -E '^<<<<<<<|^=======|^>>>>>>>|^\\|\\|\\|\\|\\|\\|\\|' -- 'apps' 'packages' 'docs' 'scripts' '.github' 'package.json' 'pnpm-workspace.yaml' 'turbo.json' 'biome.json' 'commitlint.config.js' 'eslint.config.js' || true`,
  { encoding: 'utf8' },
);

const hits = parseGitGrepHits(grep, allowFile);

if (hits.length > 0) {
  console.error('Committed merge conflict markers found:\n');
  for (const hit of hits) {
    console.error(`  ${hit}`);
  }
  process.exit(1);
}

console.log('No merge conflict markers in source/docs paths.');
