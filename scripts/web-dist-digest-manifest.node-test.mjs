import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateWebDistDigestManifest } from '../.github/scripts/generate-web-dist-digest-manifest.mjs';

test('generateWebDistDigestManifest covers dist files', async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'nexus-dist-'));
  try {
    await writeFile(
      path.join(tmpDir, 'build-info.json'),
      `${JSON.stringify({ gitSha: 'c'.repeat(40) })}\n`,
    );
    await mkdir(path.join(tmpDir, 'assets'), { recursive: true });
    await writeFile(path.join(tmpDir, 'index.html'), '<html></html>\n');
    await writeFile(path.join(tmpDir, 'assets', 'app.js'), 'console.log("x");\n');

    const manifest = await generateWebDistDigestManifest(tmpDir);
    assert.equal(manifest.fileCount, 3);
    assert.deepEqual(Object.keys(manifest.entries).sort(), [
      'assets/app.js',
      'build-info.json',
      'index.html',
    ]);

    const onDisk = JSON.parse(await readFile(path.join(tmpDir, 'digest-manifest.json'), 'utf8'));
    assert.match(onDisk.entries['index.html'], /^sha256:[a-f0-9]{64}$/);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});
