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
    await completePhysicalCommandReplay(commandId, idempotencyKey, 'succeeded', 200, body);

    const second = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(second).toEqual({ kind: 'replay', statusCode: 200, body });
  });

  it('blocks re-dispatch after unknown outcome', async () => {
    const commandId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const idempotencyKey = 'ledger-key-2';
    const unknownBody = { ok: false, outcome: 'unknown' };

    await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    await markPhysicalCommandUnknown(commandId, idempotencyKey, 409, unknownBody);

    const retry = await beginPhysicalCommandReplay({ commandId, idempotencyKey });
    expect(retry.kind).toBe('unknown');
    if (retry.kind === 'unknown') {
      expect(retry.statusCode).toBe(409);
      expect(retry.body).toEqual(unknownBody);
    }

    const record = await getPhysicalCommandRecord(commandId);
    expect(record?.state).toBe('unknown');
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
