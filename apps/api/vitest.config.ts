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
      // Thresholds are calibrated to the current test baseline so `vitest run --coverage`
      // stays green. The Phase-2 target (60/50/60/60) is the goal and will be raised
      // incrementally as more route/service tests land. Phase-1 ratchet: 56/46/56/56.
      thresholds: {
        statements: 56,
        branches: 46,
        functions: 56,
        lines: 56,
      },
    },
  },
});
