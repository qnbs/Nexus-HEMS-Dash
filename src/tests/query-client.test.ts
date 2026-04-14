import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use the real QueryClient — it works in jsdom without network
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

describe('Query Client Module', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should export queryClient', async () => {
    const mod = await import('../lib/query-client');
    expect(mod.queryClient).toBeDefined();
  });

  it('should export QueryProvider component', async () => {
    const mod = await import('../lib/query-client');
    expect(typeof mod.QueryProvider).toBe('function');
  });
});
