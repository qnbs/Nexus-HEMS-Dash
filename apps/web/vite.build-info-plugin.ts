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
      const gitSha = (process.env.VITE_BUILD_SHA ?? '').trim();
      const buildTime = (process.env.VITE_BUILD_TIME ?? '').trim();
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
