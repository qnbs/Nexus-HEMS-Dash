#!/usr/bin/env node
/**
 * Pure helpers for GitHub Pages build SHA verification (FUP-SMOKE-01).
 */

/**
 * @param {string} pageUrl
 * @returns {string}
 */
export function pagesBaseUrl(pageUrl) {
  const trimmed = pageUrl.trim().replace(/\/+$/, '');
  return `${trimmed}/`;
}

/**
 * @param {string} pageUrl
 * @returns {string}
 */
export function buildInfoManifestUrl(pageUrl) {
  return `${pagesBaseUrl(pageUrl)}build-info.json`;
}

/**
 * @param {string} expectedSha full 40-char git sha
 * @param {string} manifestGitSha value from build-info.json
 * @returns {boolean}
 */
export function shaMatchesManifest(expectedSha, manifestGitSha) {
  const expected = expectedSha.trim().toLowerCase();
  const found = manifestGitSha.trim().toLowerCase();
  if (!expected || !found) return false;
  if (expected.length !== 40) return false;

  if (found.length === 40) {
    return found === expected;
  }

  // Short manifest SHA only (Help/About-style prefix); never accept distinct full SHAs that share 12 chars.
  if (found.length >= 12 && found.length < 40 && expected.startsWith(found)) {
    return true;
  }

  return false;
}

/**
 * @param {string} pageUrl
 * @param {string} manifestUrl
 * @returns {boolean}
 */
export function manifestUrlAllowed(pageUrl, manifestUrl) {
  const base = pagesBaseUrl(pageUrl);
  if (!manifestUrl.startsWith(base)) return false;
  if (!manifestUrl.endsWith('build-info.json')) return false;
  return true;
}

/**
 * @param {unknown} body
 * @returns {{ gitSha: string; buildTime?: string; appVersion?: string; basePath?: string } | null}
 */
export function parseBuildInfoManifest(body) {
  if (typeof body !== 'object' || body === null) return null;
  const record = /** @type {Record<string, unknown>} */ (body);
  const gitSha = record.gitSha;
  if (typeof gitSha !== 'string') return null;
  return {
    gitSha,
    buildTime: typeof record.buildTime === 'string' ? record.buildTime : undefined,
    appVersion: typeof record.appVersion === 'string' ? record.appVersion : undefined,
    basePath: typeof record.basePath === 'string' ? record.basePath : undefined,
  };
}
