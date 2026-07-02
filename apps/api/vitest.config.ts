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
      // Staged raise: v1.6.1 measured ~47% statements / 55% functions (P1-05); target 55% statements
      thresholds: {
        statements: 47,
        branches: 38,
        functions: 55,
        lines: 48,
      },
    },
  },
});
