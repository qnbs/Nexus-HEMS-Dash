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
  getPhysicalCommandRecord,
  markPhysicalCommandUnknown,
  resetPhysicalCommandLedgerForTests,
} from '../services/physical-command-ledger.js';
import { resetRedisClientForTests, setRedisClientForTests } from '../services/redis-client.js';

const IDEM_ALIAS_PREFIX = 'nexus:physical-cmd:idem:';

const redisUrl = process.env.PHYSICAL_CMD_LEDGER_REDIS_URL;
const hasRedisUrl = Boolean(redisUrl);

describe.skipIf(!hasRedisUrl)('physical-command-ledger (Redis integration)', () => {
  let redis: Redis;
  let redisReplica: Redis;

  beforeAll(async () => {
    redis = new Redis(redisUrl as string, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
    });
    redisReplica = new Redis(redisUrl as string, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
    });
    await Promise.all([redis.ping(), redisReplica.ping()]);
    setRedisClientForTests(redis);
  });

  afterAll(async () => {
    try {
      await Promise.all([redis?.quit(), redisReplica?.quit()]);
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

  it('complete from two independent clients: at most one terminal write, no stale key', async () => {
    const commandId = '22222222-2222-4222-8222-222222222222';
    const idempotencyKey = 'idem-ci-dual-complete';

    setRedisClientForTests(redis);
    const first = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(first.kind).toBe('proceed');

    setRedisClientForTests(redis);
    const good = completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, {
      winner: 'A',
    });
    setRedisClientForTests(redisReplica);
    const bad = completePhysicalCommandReplay(commandId, 'stale-idem-key', 'succeeded', 200, {
      winner: 'B',
    });
    await Promise.all([good, bad]);

    setRedisClientForTests(redisReplica);
    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('succeeded');
    expect(record?.body).toEqual({ winner: 'A' });

    const retry = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(retry.kind).toBe('replay');
  });

  it('abandon on one client does not wipe terminal state written on the other', async () => {
    const commandId = '33333333-3333-4333-8333-333333333333';
    const idempotencyKey = 'idem-ci-dual-abandon';

    setRedisClientForTests(redis);
    await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    setRedisClientForTests(redisReplica);
    await completePhysicalCommandReplay(commandId, idempotencyKey, 'failed', 502, {
      error: 'adapter',
    });

    setRedisClientForTests(redis);
    await abandonPhysicalCommandPending(commandId);

    setRedisClientForTests(redisReplica);
    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('failed');
    expect(record?.statusCode).toBe(502);
  });

  it('concurrent complete race from two clients leaves a single terminal record', async () => {
    const commandId = '44444444-4444-4444-8444-444444444444';
    const idempotencyKey = 'idem-ci-concurrent-complete';

    setRedisClientForTests(redis);
    await beginPhysicalCommandReplay({ commandId, idempotencyKey });

    setRedisClientForTests(redis);
    const c1 = completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, {
      lane: 1,
    });
    setRedisClientForTests(redisReplica);
    const c2 = completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, {
      lane: 2,
    });
    await Promise.all([c1, c2]);

    setRedisClientForTests(redis);
    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('succeeded');
    const body = record?.body as { lane?: number };
    expect([1, 2]).toContain(body.lane);
  });

  it('does not complete when idempotency alias was repointed to another commandId', async () => {
    const commandId = '55555555-5555-4555-8555-555555555555';
    const idempotencyKey = 'idem-ci-alias-poison';
    setRedisClientForTests(redis);
    await beginPhysicalCommandReplay({ commandId, idempotencyKey });

    await redis.set(
      `${IDEM_ALIAS_PREFIX}${idempotencyKey}`,
      '66666666-6666-4666-8666-666666666666',
    );

    setRedisClientForTests(redisReplica);
    await completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, {
      poisoned: true,
    });

    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('pending');
  });

  it('does not mark unknown when alias ownership diverged', async () => {
    const commandId = '77777777-7777-4777-8777-777777777777';
    const idempotencyKey = 'idem-ci-unknown-alias';
    setRedisClientForTests(redis);
    await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    await redis.set(
      `${IDEM_ALIAS_PREFIX}${idempotencyKey}`,
      '88888888-8888-4888-8888-888888888888',
    );

    setRedisClientForTests(redisReplica);
    await markPhysicalCommandUnknown(commandId, idempotencyKey, 409, { outcome: 'unknown' });

    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('pending');
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
