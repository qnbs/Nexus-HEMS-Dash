import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { PluginOption } from 'vite';

export interface BuildInfoManifest {
  gitSha: string;
  buildTime: string;
  appVersion: string;
  basePath: string;
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
      const gitSha = (
        process.env.VITE_BUILD_SHA ??
        process.env.GIT_SHA ??
        process.env.GITHUB_SHA ??
        ''
      ).trim();
      const buildTime = (process.env.VITE_BUILD_TIME ?? process.env.BUILD_TIME_ISO ?? '').trim();
      if (process.env.CI === 'true' && gitSha.length === 0) {
        throw new Error('build-info.json requires VITE_BUILD_SHA, GIT_SHA, or GITHUB_SHA in CI');
      }
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
