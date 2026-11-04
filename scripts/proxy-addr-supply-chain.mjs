import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIN_PROXY_ADDR = '2.0.8';

/**
 * @param {string} lockfileText
 * @returns {string | null}
 */
export function maxResolvedProxyAddrVersion(lockfileText) {
  const versions = [...lockfileText.matchAll(/^\s*proxy-addr@([\d.]+):/gm)].map((m) => m[1]);
  if (versions.length === 0) return null;
  return versions.sort(compareSemver).at(-1) ?? null;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

/**
 * @param {string} version
 * @param {string} minimum
 */
export function semverAtLeast(version, minimum) {
  return compareSemver(version, minimum) >= 0;
}

/**
 * @param {string} repoRoot
 */
export function readProxyAddrSupplyChainFromRepo(repoRoot = process.cwd()) {
  const packageJson = JSON.parse(
    readFileSync(join(repoRoot, 'package.json'), 'utf8'),
  );
  const lockfileText = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');
  const override = packageJson?.pnpm?.overrides?.['proxy-addr'];
  const lockVersion = maxResolvedProxyAddrVersion(lockfileText);
  return { override, lockVersion };
}

/**
 * @param {{ override: unknown; lockVersion: string | null }} chain
 */
export function assertProxyAddrSupplyChain(chain) {
  if (typeof chain.override !== 'string' || !chain.override.includes(MIN_PROXY_ADDR)) {
    throw new Error(
      `expected pnpm.overrides["proxy-addr"] to pin >=${MIN_PROXY_ADDR}, got ${String(chain.override)}`,
    );
  }
  if (!chain.lockVersion || !semverAtLeast(chain.lockVersion, MIN_PROXY_ADDR)) {
    throw new Error(
      `expected lockfile proxy-addr >=${MIN_PROXY_ADDR}, got ${chain.lockVersion ?? 'missing'}`,
    );
  }
}
