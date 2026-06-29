import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    pool: 'threads',
    maxWorkers: 2,
    testTimeout: 15_000,
    hookTimeout: 15_000,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/data/**'],
      // Measured baseline (v1.3.0); staged raise toward 55% per Testing-Coverage-Strategy.md
      thresholds: {
        statements: 33,
        branches: 30,
        functions: 38,
        lines: 33,
      },
    },
  },
});
