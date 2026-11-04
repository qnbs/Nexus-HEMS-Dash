import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { PluginOption } from 'vite';

export interface BuildInfoManifest {
  gitSha: string;
  buildTime: string;
  appVersion: string;
  basePath: string;
}

const FULL_SHA = /^[0-9a-f]{40}$/i;

/** Env flag set only for the CI job that produces the Pages-promoted `build` artifact. */
export const NEXUS_DEPLOYABLE_PAGES_BUILD_ENV = 'NEXUS_DEPLOYABLE_PAGES_BUILD';

export function resolveBuildInfoFieldsFromEnv(): Pick<BuildInfoManifest, 'gitSha' | 'buildTime'> {
  const gitSha = (
    process.env.VITE_BUILD_SHA ??
    process.env.GIT_SHA ??
    process.env.GITHUB_SHA ??
    ''
  ).trim();
  const buildTime = (process.env.VITE_BUILD_TIME ?? process.env.BUILD_TIME_ISO ?? '').trim();

  if (process.env[NEXUS_DEPLOYABLE_PAGES_BUILD_ENV] === 'true') {
    if (!FULL_SHA.test(gitSha)) {
      throw new Error(
        `${NEXUS_DEPLOYABLE_PAGES_BUILD_ENV}=true requires a full 40-character git SHA (VITE_BUILD_SHA, GIT_SHA, or GITHUB_SHA)`,
      );
    }
  }

  return { gitSha, buildTime };
}

/** Writes immutable `build-info.json` into the web dist for Pages provenance checks. */
export function buildInfoManifestPlugin(options: {
  basePath: string;
  appVersion: string;
}): PluginOption {
  let outDir = 'dist';

  return {
    name: 'nexus-build-info-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const { gitSha, buildTime } = resolveBuildInfoFieldsFromEnv();
      const manifest: BuildInfoManifest = {
        gitSha,
        buildTime,
        appVersion: options.appVersion,
        basePath: options.basePath,
      };
      const target = path.resolve(outDir, 'build-info.json');
      writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    },
  };
}
