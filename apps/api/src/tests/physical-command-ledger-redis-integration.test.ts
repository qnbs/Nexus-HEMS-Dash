/**
 * Redis-backed integration tests for the physical-command Lua claim path.
 * Skipped unless PHYSICAL_CMD_LEDGER_REDIS_URL is set (CI service container).
 */

import Redis from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  abandonPhysicalCommandPending,
  beginPhysicalCommandReplay,
  completePhysicalCommandReplay,
  resetPhysicalCommandLedgerForTests,
} from '../services/physical-command-ledger.js';
import { resetRedisClientForTests, setRedisClientForTests } from '../services/redis-client.js';

const IDEM_ALIAS_PREFIX = 'nexus:physical-cmd:idem:';

const redisUrl = process.env.PHYSICAL_CMD_LEDGER_REDIS_URL;
const hasRedisUrl = Boolean(redisUrl);

describe.skipIf(!hasRedisUrl)('physical-command-ledger (Redis integration)', () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(redisUrl as string, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
    });
    await redis.ping();
    setRedisClientForTests(redis);
  });

  afterAll(async () => {
    try {
      await redis?.quit();
    } catch {
      // ignore quit races
    }
    resetRedisClientForTests();
  });

  beforeEach(async () => {
    resetPhysicalCommandLedgerForTests();
    await redis.flushdb();
  });

  it('grants at most one proceed for concurrent claims on the same idempotency key', async () => {
    const commandIdA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const commandIdB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const idempotencyKey = 'idem-ci-concurrent-race';

    const [r1, r2] = await Promise.all([
      beginPhysicalCommandReplay({ commandId: commandIdA, idempotencyKey }),
      beginPhysicalCommandReplay({ commandId: commandIdB, idempotencyKey }),
    ]);

    const proceeds = [r1, r2].filter((r) => r.kind === 'proceed');
    const inFlights = [r1, r2].filter((r) => r.kind === 'in_flight');

    expect(proceeds).toHaveLength(1);
    expect(inFlights).toHaveLength(1);
  });

  it('replays terminal outcome and blocks a second commandId for the same idempotency key', async () => {
    const commandId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const idempotencyKey = 'idem-ci-replay';

    const first = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(first.kind).toBe('proceed');

    await completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, { ok: true });

    const second = await beginPhysicalCommandReplay({
      commandId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      idempotencyKey,
    });
    expect(second).toEqual({ kind: 'replay', statusCode: 200, body: { ok: true } });
  });

  it('allows a new proceed after abandon clears the pending alias', async () => {
    const commandIdA = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    const commandIdB = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const idempotencyKey = 'idem-ci-abandon';

    const first = await beginPhysicalCommandReplay({ commandId: commandIdA, idempotencyKey });
    expect(first.kind).toBe('proceed');

    await abandonPhysicalCommandPending(commandIdA);

    const second = await beginPhysicalCommandReplay({ commandId: commandIdB, idempotencyKey });
    expect(second.kind).toBe('proceed');
  });

  it('surfaces Redis WRONGTYPE on alias key instead of issuing proceed', async () => {
    const commandId = '11111111-1111-4111-8111-111111111111';
    const idempotencyKey = 'idem-ci-wrong-type';
    await redis.hset(`${IDEM_ALIAS_PREFIX}${idempotencyKey}`, 'x', 'y');

    await expect(beginPhysicalCommandReplay({ commandId, idempotencyKey })).rejects.toThrow(
      /WRONGTYPE|wrong kind/i,
    );
  });
});
