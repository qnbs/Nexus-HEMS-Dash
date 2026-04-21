// ESLint — React-only rules (Biome handles all TS/JS linting + formatting)
// Only rules with no Biome equivalent are enforced here.
// See docs/Toolchain-Architecture.md for the full toolchain reference.
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'coverage', 'storybook-static'] },
  {
    files: ['src/**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-compiler': reactCompiler,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-compiler/react-compiler': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
