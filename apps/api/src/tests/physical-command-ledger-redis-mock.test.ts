import { afterEach, describe, expect, it } from 'vitest';
import {
  beginPhysicalCommandReplay,
  resetPhysicalCommandLedgerForTests,
} from '../services/physical-command-ledger.js';
import { BEGIN_PHYSICAL_COMMAND_REPLAY_LUA } from '../services/physical-command-ledger-lua.js';
import type { IRedisClient } from '../services/redis-client.js';
import { resetRedisClientForTests, setRedisClientForTests } from '../services/redis-client.js';

const COMMAND_PREFIX = 'nexus:physical-cmd:';
const IDEM_ALIAS_PREFIX = 'nexus:physical-cmd:idem:';

/**
 * Minimal Redis mock with string store + Lua used by beginPhysicalCommandReplay (atomic claim).
 */
function createLedgerRedisMock(): IRedisClient & { state: Map<string, string> } {
  const state = new Map<string, string>();
  const hash = new Map<string, Map<string, string>>();
  const stream: Array<{ fields: string[] }> = [];

  const client: IRedisClient & { state: Map<string, string> } = {
    state,
    ping: async () => 'PONG',
    set: async (key, value, _mode, ttl, nx) => {
      if (nx === 'NX' && state.has(key)) return null;
      state.set(key, value);
      void ttl;
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
    eval: async (script, numKeys, ...args) => {
      if (script !== BEGIN_PHYSICAL_COMMAND_REPLAY_LUA || numKeys !== 2) {
        throw new Error('unexpected script');
      }
      const recordKey = args[0];
      const aliasKey = args[1];
      const payload = args[2];
      const ttlStr = args[3];
      const commandId = args[4];
      if (!recordKey || !aliasKey || !payload || !ttlStr || !commandId) {
        throw new Error('bad argv');
      }
      const ttl = Number(ttlStr);
      if (!Number.isFinite(ttl) || ttl <= 0) return 3;
      if (state.has(aliasKey)) return 2;
      if (state.has(recordKey)) return 1;
      try {
        state.set(recordKey, payload);
        state.set(aliasKey, commandId);
      } catch {
        state.delete(recordKey);
        state.delete(aliasKey);
        return 3;
      }
      return 0;
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

describe('physical-command-ledger (Redis mock)', () => {
  afterEach(() => {
    resetPhysicalCommandLedgerForTests();
    resetRedisClientForTests();
  });

  it('atomically writes alias and pending record on proceed', async () => {
    const mock = createLedgerRedisMock();
    setRedisClientForTests(mock);

    const commandId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const idempotencyKey = 'redis-ledger-atomic-1';

    const first = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(first.kind).toBe('proceed');

    const recordRaw = mock.state.get(`${COMMAND_PREFIX}${commandId}`);
    expect(recordRaw).toBeTruthy();
    const alias = mock.state.get(`${IDEM_ALIAS_PREFIX}${idempotencyKey}`);
    expect(alias).toBe(commandId);
  });

  it('blocks a second commandId for the same idempotency key while pending (Redis path)', async () => {
    const mock = createLedgerRedisMock();
    setRedisClientForTests(mock);

    const commandIdA = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    const commandIdB = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const idempotencyKey = 'redis-ledger-alias-block';

    const first = await beginPhysicalCommandReplay({ commandId: commandIdA, idempotencyKey });
    expect(first.kind).toBe('proceed');

    const second = await beginPhysicalCommandReplay({ commandId: commandIdB, idempotencyKey });
    expect(second.kind).toBe('in_flight');
    expect(mock.state.get(`${IDEM_ALIAS_PREFIX}${idempotencyKey}`)).toBe(commandIdA);
    expect(mock.state.get(`${COMMAND_PREFIX}${commandIdB}`)).toBeUndefined();
  });

  it('returns in_flight when the same commandId is claimed twice (Redis path)', async () => {
    const mock = createLedgerRedisMock();
    setRedisClientForTests(mock);

    const commandId = '99999999-9999-4999-8999-999999999999';
    const idempotencyKey = 'redis-ledger-double-same-id';

    const a = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(a.kind).toBe('proceed');

    const b = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(b.kind).toBe('in_flight');
  });

  it('returns in_flight when eval claims success but keys are not readable (verification)', async () => {
    const brokenEvalClient = createLedgerRedisMock();
    brokenEvalClient.eval = async () => 0;
    brokenEvalClient.get = async () => null;
    setRedisClientForTests(brokenEvalClient);

    const r = await beginPhysicalCommandReplay({
      commandId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      idempotencyKey: 'verify-mismatch',
    });
    expect(r.kind).toBe('in_flight');
  });

  it('returns in_flight when command key is held but record JSON is missing (race)', async () => {
    const mock = createLedgerRedisMock();
    const origEval = mock.eval.bind(mock);
    mock.eval = async (...args: Parameters<IRedisClient['eval']>) => {
      const result = await origEval(...args);
      return result === 0 ? 1 : result;
    };
    setRedisClientForTests(mock);

    const r = await beginPhysicalCommandReplay({
      commandId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      idempotencyKey: 'race-no-record',
    });
    expect(r.kind).toBe('in_flight');
  });

  it('returns in_flight when Lua reports SET failure (code 3)', async () => {
    const mock = createLedgerRedisMock();
    mock.eval = async () => 3;
    setRedisClientForTests(mock);

    const r = await beginPhysicalCommandReplay({
      commandId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      idempotencyKey: 'lua-fail',
    });
    expect(r.kind).toBe('in_flight');
  });
});
