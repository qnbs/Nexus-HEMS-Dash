import { afterEach, describe, expect, it } from 'vitest';
import {
  beginPhysicalCommandReplay,
  completePhysicalCommandReplay,
  getPhysicalCommandRecord,
  markPhysicalCommandUnknown,
  resetPhysicalCommandLedgerForTests,
} from '../services/physical-command-ledger.js';

describe('physical-command-ledger', () => {
  afterEach(() => {
    resetPhysicalCommandLedgerForTests();
  });

  it('allows a single proceed then replays terminal success', async () => {
    const commandId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const idempotencyKey = 'ledger-key-1';

    const first = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(first.kind).toBe('proceed');

    const body = { ok: true, outcome: 'succeeded' };
    expect(
      await completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, body),
    ).toBe('committed');

    const second = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(second).toEqual({ kind: 'replay', statusCode: 200, body });
  });

  it('blocks re-dispatch after unknown outcome', async () => {
    const commandId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const idempotencyKey = 'ledger-key-2';
    const unknownBody = { ok: false, outcome: 'unknown' };

    await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(await markPhysicalCommandUnknown(commandId, idempotencyKey, 409, unknownBody)).toBe(
      'committed',
    );

    const retry = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(retry.kind).toBe('unknown');
    if (retry.kind === 'unknown') {
      expect(retry.statusCode).toBe(409);
      expect(retry.body).toEqual(unknownBody);
    }

    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('unknown');
  });

  it('blocks a second commandId for the same idempotency key while pending', async () => {
    const commandIdA = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    const commandIdB = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const idempotencyKey = 'ledger-key-alias-race';

    const first = await beginPhysicalCommandReplay({ commandId: commandIdA, idempotencyKey });
    expect(first.kind).toBe('proceed');

    const second = await beginPhysicalCommandReplay({ commandId: commandIdB, idempotencyKey });
    expect(second.kind).toBe('in_flight');
  });

  it('ignores completion when idempotencyKey does not match the pending claim', async () => {
    const commandId = '11111111-1111-4111-8111-111111111111';
    const idempotencyKey = 'ledger-key-stale-complete';

    await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(
      await completePhysicalCommandReplay(commandId, 'other-key', 'succeeded', 200, {
        ok: true,
        stale: true,
      }),
    ).toBe('rejected_cas');

    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('pending');
    expect(record?.idempotencyKey).toBe(idempotencyKey);
  });

  it('rejects complete/unknown without a matching pending claim (memory)', async () => {
    const commandId = '99999999-9999-4999-8999-999999999999';
    const idempotencyKey = 'no-claim';
    expect(
      await completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, {}),
    ).toBe('rejected_no_pending');
    expect(await markPhysicalCommandUnknown(commandId, idempotencyKey, 409, {})).toBe(
      'rejected_no_pending',
    );
    expect(await getPhysicalCommandRecord(commandId)).toBeUndefined();
  });

  it('resolves idempotency alias to the canonical commandId record', async () => {
    const commandId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const idempotencyKey = 'ledger-key-3';

    await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    await completePhysicalCommandReplay(commandId, idempotencyKey, 'failed', 502, {
      error: 'adapter down',
    });

    const viaAlias = await beginPhysicalCommandReplay({
      commandId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      idempotencyKey,
    });
    expect(viaAlias.kind).toBe('replay');
  });
});
