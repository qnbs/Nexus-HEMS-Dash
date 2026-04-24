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
  '*.{json,css,html,yml,yaml}': (files) => [`biome format --write ${files.join(' ')}`],
};
