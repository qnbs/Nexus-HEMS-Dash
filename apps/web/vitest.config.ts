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
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/tests/', '*.config.ts', 'dist/'],
      // Thresholds calibrated to the current test baseline. Phase-1 ratchet to
      // 55/45/55/56; final target 58/48/58/58 will be reached incrementally.
      thresholds: {
        statements: 55,
        branches: 45,
        functions: 55,
        lines: 56,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
