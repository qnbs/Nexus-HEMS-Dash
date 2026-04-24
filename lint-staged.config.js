// lint-staged configuration (ESM — package.json has "type":"module")
//
// Type-checkers operate on the whole project, not individual files.
// Using the function form lets us pass staged file paths to formatters/linters
// while calling tsgo --noEmit without arguments so it reads tsconfig.json.
export default {
  '*.{ts,tsx}': (files) => [
    `biome check --write ${files.join(' ')}`,
    'tsgo --noEmit',
  ],
  'src/**/*.tsx': (files) => [`eslint --fix --max-warnings 0 ${files.join(' ')}`],
  '*.{json,css,html,yml,yaml}': (files) => {
    // Biome's VCS integration excludes .github/ even though **/*.yml is in includes.
    // Filter those paths out to avoid "No files processed" exit-1 from biome format.
    const biomeFiles = files.filter((f) => !f.includes('/.github/'));
    return biomeFiles.length > 0 ? [`biome format --write ${biomeFiles.join(' ')}`] : [];
  },
};
