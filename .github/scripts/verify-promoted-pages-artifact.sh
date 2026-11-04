#!/usr/bin/env bash
# Validate CI-promoted Pages artifact before upload (gitSha + full dist digest manifest).
set -euo pipefail

dist_root="${1:-apps/web/dist}"
expected_sha="${2:?expected full git commit SHA required}"

if ! [[ "${expected_sha}" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "::error::expected_sha must be a full 40-character git commit SHA"
  exit 1
fi

build_info="${dist_root}/build-info.json"
manifest_path="${dist_root}/digest-manifest.json"

if [ ! -f "${build_info}" ]; then
  echo "::error::missing ${build_info}"
  exit 1
fi

manifest_git_sha="$(python3 -c "
import json, sys
from pathlib import Path
data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
sha = data.get('gitSha')
if not isinstance(sha, str) or not sha.strip():
    raise SystemExit('missing gitSha')
print(sha.strip())
" "${build_info}")"

expected_lower="$(printf '%s' "${expected_sha}" | tr '[:upper:]' '[:lower:]')"
manifest_lower="$(printf '%s' "${manifest_git_sha}" | tr '[:upper:]' '[:lower:]')"

if [ "${#manifest_lower}" -ne 40 ] || [ "${manifest_lower}" != "${expected_lower}" ]; then
  echo "::error::build-info.json gitSha ${manifest_git_sha} must exactly match ${expected_sha}"
  exit 1
fi

if [ ! -f "${manifest_path}" ]; then
  echo "::error::missing ${manifest_path} — run generate-web-dist-digest-manifest.mjs in CI Build"
  exit 1
fi

export DIST_ROOT="${dist_root}"
export MANIFEST_PATH="${manifest_path}"

node --input-type=module <<'NODE'
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distRoot = process.env.DIST_ROOT;
const manifestPath = process.env.MANIFEST_PATH;
const raw = JSON.parse(await readFile(manifestPath, 'utf8'));
if (raw.version !== 1 || typeof raw.entries !== 'object' || raw.entries === null) {
  throw new Error('invalid digest-manifest.json shape');
}

async function listFiles(root) {
  const out = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const manifestName = 'digest-manifest.json';
const files = (await listFiles(distRoot))
  .map((abs) => path.relative(distRoot, abs).split(path.sep).join('/'))
  .filter((rel) => rel !== manifestName)
  .sort();

for (const rel of files) {
  const expected = raw.entries[rel];
  if (typeof expected !== 'string' || !expected.startsWith('sha256:')) {
    throw new Error(`manifest missing entry for ${rel}`);
  }
  const buf = await readFile(path.join(distRoot, rel));
  const digest = `sha256:${createHash('sha256').update(buf).digest('hex')}`;
  if (digest !== expected) {
    throw new Error(`digest mismatch for ${rel}`);
  }
}

const manifestKeys = Object.keys(raw.entries).sort();
if (files.join('\0') !== manifestKeys.join('\0')) {
  throw new Error('digest-manifest.json file set does not match dist tree');
}

console.log(`Verified ${files.length} dist files against digest-manifest.json`);
NODE

sha256sum "${build_info}" "${manifest_path}" | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
echo "file_count=$(find "${dist_root}" -type f | wc -l | tr -d ' ')" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
