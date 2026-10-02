import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../package.json');

function readPackageVersion(): string {
  try {
    const raw = readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const API_APP_VERSION = readPackageVersion();

/** Optional CI/git metadata (not required in dev). */
export function resolveBuildMetadata(env: NodeJS.ProcessEnv = process.env): {
  version: string;
  gitSha?: string;
  buildTime?: string;
} {
  const gitSha = env.GIT_SHA?.trim() || env.GITHUB_SHA?.trim();
  const buildTime = env.BUILD_TIME_ISO?.trim();
  return {
    version: API_APP_VERSION,
    ...(gitSha ? { gitSha: gitSha.slice(0, 12) } : {}),
    ...(buildTime ? { buildTime } : {}),
  };
}
