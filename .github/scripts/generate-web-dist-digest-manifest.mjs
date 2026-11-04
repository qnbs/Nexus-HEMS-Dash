#!/usr/bin/env node
/**
 * Deterministic sha256 manifest for apps/web/dist (Pages provenance #392).
 * Writes digest-manifest.json into the dist directory.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {string} root
 * @returns {Promise<string[]>}
 */
async function listFilesRecursive(root) {
  const out = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFilesRecursive(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/**
 * @param {string} distDir absolute path to apps/web/dist
 */
export async function generateWebDistDigestManifest(distDir) {
  const manifestName = 'digest-manifest.json';
  const files = (await listFilesRecursive(distDir))
    .map((abs) => path.relative(distDir, abs).split(path.sep).join('/'))
    .filter((rel) => rel !== manifestName)
    .sort();

  /** @type {Record<string, string>} */
  const entries = {};
  for (const rel of files) {
    const abs = path.join(distDir, rel);
    const buf = await readFile(abs);
    const digest = createHash('sha256').update(buf).digest('hex');
    entries[rel] = `sha256:${digest}`;
  }

  const buildInfoPath = path.join(distDir, 'build-info.json');
  let gitSha = '';
  try {
    const raw = JSON.parse(await readFile(buildInfoPath, 'utf8'));
    if (typeof raw.gitSha === 'string') gitSha = raw.gitSha.trim();
  } catch {
    // build-info optional for local non-deploy builds
  }

  const manifest = {
    version: 1,
    gitSha,
    fileCount: files.length,
    entries,
  };

  const target = path.join(distDir, manifestName);
  await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

const distArg = process.argv[2];
if (distArg) {
  const distDir = path.resolve(distArg);
  await generateWebDistDigestManifest(distDir);
}
