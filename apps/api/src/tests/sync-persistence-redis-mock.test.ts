import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IRedisClient } from '../services/redis-client.js';
import { resetRedisClientForTests, setRedisClientForTests } from '../services/redis-client.js';
import { APPLY_SETTINGS_BATCH_LUA } from '../services/redis-sync-lua.js';
import {
  applySettingsBatch,
  getServerSettingsSnapshot,
  getSyncDiffSince,
  resetSyncPersistenceForTests,
} from '../services/sync-persistence.js';

const SYNC_VERSION_KEY = 'nexus:sync:version';
const SYNC_SETTINGS_HASH_KEY = 'nexus:sync:settings:h';

function createMockRedis(): IRedisClient & { state: Map<string, string> } {
  const state = new Map<string, string>();
  const hash = new Map<string, Map<string, string>>();
  const stream: Array<{ fields: string[] }> = [];
  let version = 0;

  const client: IRedisClient & { state: Map<string, string> } = {
    state,
    ping: async () => 'PONG',
    set: async (key, value, _mode, _ttl, nx) => {
      if (nx === 'NX' && state.has(key)) return null;
      state.set(key, value);
      return 'OK';
    },
    get: async (key) => state.get(key) ?? null,
    getdel: async (key) => {
      const v = state.get(key);
      state.delete(key);
      return v ?? null;
    },
    del: async (...keys) => {
      let n = 0;
      for (const k of keys) {
        if (state.delete(k)) n++;
      }
      return n;
    },
    incr: async (key) => {
      const next = Number(state.get(key) ?? 0) + 1;
      state.set(key, String(next));
      version = next;
      return next;
    },
    hget: async (key, field) => hash.get(key)?.get(field) ?? null,
    hgetall: async (key) => {
      const m = hash.get(key);
      if (!m) return {};
      return Object.fromEntries(m);
    },
    hset: async (key, field, value) => {
      if (!hash.has(key)) hash.set(key, new Map());
      hash.get(key)?.set(field, value);
      return 1;
    },
    hdel: async (key, ...fields) => {
      const m = hash.get(key);
      if (!m) return 0;
      let n = 0;
      for (const f of fields) {
        if (m.delete(f)) n++;
      }
      return n;
    },
    eval: async (_script, numKeys, ...args) => {
      if (_script !== APPLY_SETTINGS_BATCH_LUA || numKeys !== 3) {
        throw new Error('unexpected script');
      }
      const argv = args.slice(3);
      const seed = argv[argv.length - 2];
      if (!state.has(SYNC_VERSION_KEY) && seed) {
        state.set(SYNC_VERSION_KEY, seed);
      }
      const prior = Number(state.get(SYNC_VERSION_KEY) ?? 0);
      version = prior + 1;
      state.set(SYNC_VERSION_KEY, String(version));
      const n = Number(argv[0]);
      let idx = 1;
      for (let i = 0; i < n; i++) {
        const k = argv[idx];
        const v = argv[idx + 1];
        const cat = argv[idx + 2];
        const ts = argv[idx + 3];
        if (!k || !v || !cat || !ts) throw new Error('bad argv');
        if (!hash.has(SYNC_SETTINGS_HASH_KEY)) hash.set(SYNC_SETTINGS_HASH_KEY, new Map());
        hash.get(SYNC_SETTINGS_HASH_KEY)?.set(k, v);
        stream.push({
          fields: [
            'key',
            k,
            'value',
            v,
            'category',
            cat,
            'updatedAt',
            ts,
            'version',
            String(version),
          ],
        });
        idx += 4;
      }
      return version;
    },
    xrevrange: async () =>
      [...stream]
        .reverse()
        .map((row, i) => [`${stream.length - 1 - i}`, row.fields] as [string, string[]]),
    xrange: async () => stream.map((row, i) => [`${i}`, row.fields] as [string, string[]]),
    on: () => client,
  };
  return client;
}

describe('sync-persistence (Redis mock)', () => {
  afterEach(() => {
    resetSyncPersistenceForTests(1);
    resetRedisClientForTests();
    vi.unstubAllEnvs();
  });

  it('applySettingsBatch uses atomic eval path and updates hash + diff stream', async () => {
    vi.stubEnv('REDIS_URL', 'redis://127.0.0.1:6379');
    const mock = createMockRedis();
    setRedisClientForTests(mock);
    resetSyncPersistenceForTests(0);

    const version = await applySettingsBatch([
      { key: 'theme', value: 'dark', category: 'userPreferences', updatedAt: 1000 },
    ]);
    expect(version).toBe(1);
    const snap = await getServerSettingsSnapshot();
    expect(snap.theme).toBe('dark');
  });

  it('getSyncDiffSince signals fullResyncRequired when since is older than retained history', async () => {
    vi.stubEnv('REDIS_URL', 'redis://127.0.0.1:6379');
    const mock = createMockRedis();
    setRedisClientForTests(mock);
    resetSyncPersistenceForTests(10);
    mock.state.set(SYNC_VERSION_KEY, '10');

    const v1 = await applySettingsBatch([
      { key: 'a', value: 1, category: 'userPreferences', updatedAt: 1 },
    ]);
    expect(v1).toBe(11);
    const diff = await getSyncDiffSince(1);
    expect(diff.fullResyncRequired).toBe(true);
    expect(diff.changes).toHaveLength(0);
  });
});
