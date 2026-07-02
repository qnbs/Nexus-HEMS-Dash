import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    maxWorkers: 2,
    testTimeout: 20_000,
    hookTimeout: 20_000,
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    exclude: ['node_modules', 'dist', 'e2e', 'tests/e2e', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/tests/', '*.config.ts', 'dist/'],
      thresholds: {
        statements: 70,
        branches: 63,
        functions: 62,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
