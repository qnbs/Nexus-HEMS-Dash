// lint-staged configuration (ESM — package.json has "type":"module")
//
// Type-checkers operate on the whole project, not individual files.
// Run `pnpm type-check` manually before committing — tsgo --noEmit is omitted
// here because it checks the full project (slow) and is better run explicitly.
export default {
  '*.{ts,tsx}': (files) => [
    `biome check --write ${files.join(' ')}`,
  ],
  'apps/web/src/**/*.tsx': (files) => [`eslint --fix --max-warnings 0 ${files.join(' ')}`],
  '*.{json,css,html,yml,yaml}': (files) => {
    // Biome's VCS integration excludes .github/ even though **/*.yml is in includes.
    // Filter those paths out to avoid "No files processed" exit-1 from biome format.
    const biomeFiles = files.filter((f) => !f.includes('/.github/'));
    return biomeFiles.length > 0 ? [`biome format --write ${biomeFiles.join(' ')}`] : [];
  },
};
