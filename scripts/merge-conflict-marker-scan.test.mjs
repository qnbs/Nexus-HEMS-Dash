import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  findConflictMarkerLines,
  parseGitGrepHits,
} from './merge-conflict-marker-scan.mjs';
import {
  buildInfoManifestUrl,
  manifestUrlAllowed,
  pagesBaseUrl,
  parseBuildInfoManifest,
  shaMatchesManifest,
} from './pages-build-provenance.mjs';

describe('merge-conflict-marker-scan', () => {
  it('detects conflict marker lines in fixture text', () => {
    const sample = ['normal', '<<<<<<< HEAD', '=======', '>>>>>>> branch'].join('\n');
    const hits = findConflictMarkerLines(sample);
    assert.equal(hits.length, 3);
  });

  it('ignores separator lines that are not conflict markers', () => {
    const sample = ['# ======= section =======', '---'].join('\n');
    assert.equal(findConflictMarkerLines(sample).length, 0);
  });

  it('filters git grep output by allowed extensions', () => {
    const grep = [
      'apps/web/foo.ts:1:<<<<<<< HEAD',
      'apps/web/foo.lock:1:<<<<<<< HEAD',
      'scripts/check-merge-conflict-markers.mjs:1:<<<<<<< HEAD',
    ].join('\n');
    const hits = parseGitGrepHits(grep, (file) => file.endsWith('.ts'));
    assert.deepEqual(hits, ['apps/web/foo.ts:1:<<<<<<< HEAD']);
  });
});

describe('pages-build-provenance', () => {
  const page = 'https://qnbs.github.io/Nexus-HEMS-Dash/';

  it('builds manifest URL under Pages base path', () => {
    assert.equal(
      buildInfoManifestUrl(page),
      'https://qnbs.github.io/Nexus-HEMS-Dash/build-info.json',
    );
    assert.equal(pagesBaseUrl(page), 'https://qnbs.github.io/Nexus-HEMS-Dash/');
  });

  it('rejects foreign manifest hosts', () => {
    assert.equal(
      manifestUrlAllowed(page, 'https://evil.example/build-info.json'),
      false,
    );
    assert.equal(
      manifestUrlAllowed(page, 'https://qnbs.github.io/Nexus-HEMS-Dash/build-info.json'),
      true,
    );
  });

  it('matches full and short git SHAs', () => {
    const full = 'abcdef1234567890abcdef1234567890abcd1234';
    const other = 'abcdef1234567890aaaa00000000000000000000';
    assert.equal(shaMatchesManifest(full, full), true);
    assert.equal(shaMatchesManifest(full, 'abcdef123456'), true);
    assert.equal(shaMatchesManifest(full, other), false);
    assert.equal(shaMatchesManifest(full, '0000000000000000000000000000000000000000'), false);
  });

  it('detects diff3 base marker lines', () => {
    const sample = ['||||||| merged common ancestors', 'ok'].join('\n');
    assert.equal(findConflictMarkerLines(sample).length, 1);
  });

  it('parses build-info manifest JSON', () => {
    const parsed = parseBuildInfoManifest({
      gitSha: 'abc',
      buildTime: '2026-01-01T00:00:00Z',
      basePath: '/Nexus-HEMS-Dash/',
    });
    assert.ok(parsed);
    assert.equal(parsed.gitSha, 'abc');
  });
});
