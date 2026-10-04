/**
 * Physical-command idempotency ledger (FUP-IDEM-01).
 * Tracks pending / succeeded / failed / unknown per `commandId` so offline
 * replays and transport retries cannot double-actuate hardware after dispatch.
 */

import type { PhysicalCommandState } from '@nexus-hems/shared-types';
import { getOptionalRedisClient } from './redis-client.js';

const COMMAND_PREFIX = 'nexus:physical-cmd:';
const IDEM_ALIAS_PREFIX = 'nexus:physical-cmd:idem:';
const LEDGER_TTL_SEC = 300;

export interface PhysicalCommandRecord {
  state: PhysicalCommandState;
  commandId: string;
  idempotencyKey: string;
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

export type BeginPhysicalCommandResult =
  | { kind: 'proceed' }
  | { kind: 'replay'; statusCode: number; body: unknown }
  | { kind: 'unknown'; statusCode: number; body: unknown; commandId: string }
  | { kind: 'in_flight' };

const memoryByCommandId = new Map<string, PhysicalCommandRecord>();
const memoryIdemAlias = new Map<string, string>();

function pruneMemory(): void {
  const now = Date.now();
  for (const [commandId, record] of memoryByCommandId) {
    if (record.expiresAt <= now) {
      memoryByCommandId.delete(commandId);
      memoryIdemAlias.delete(record.idempotencyKey);
    }
  }
}

function parseRecord(raw: string): PhysicalCommandRecord | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<PhysicalCommandRecord>;
    if (
      !parsed.commandId ||
      !parsed.idempotencyKey ||
      typeof parsed.statusCode !== 'number' ||
      typeof parsed.expiresAt !== 'number' ||
      (parsed.state !== 'pending' &&
        parsed.state !== 'unknown' &&
        parsed.state !== 'succeeded' &&
        parsed.state !== 'failed')
    ) {
      return undefined;
    }
    return {
      state: parsed.state,
      commandId: parsed.commandId,
      idempotencyKey: parsed.idempotencyKey,
      statusCode: parsed.statusCode,
      body: parsed.body ?? null,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return undefined;
  }
}

function classifyExisting(record: PhysicalCommandRecord): BeginPhysicalCommandResult {
  if (record.state === 'pending') return { kind: 'in_flight' };
  if (record.state === 'unknown') {
    return {
      kind: 'unknown',
      statusCode: record.statusCode,
      body: record.body,
      commandId: record.commandId,
    };
  }
  return { kind: 'replay', statusCode: record.statusCode, body: record.body };
}

async function readRecord(commandId: string): Promise<PhysicalCommandRecord | undefined> {
  const redis = await getOptionalRedisClient();
  if (redis) {
    const raw = await redis.get(`${COMMAND_PREFIX}${commandId}`);
    if (!raw) return undefined;
    const record = parseRecord(raw);
    if (!record || record.expiresAt <= Date.now()) {
      await redis.del(`${COMMAND_PREFIX}${commandId}`);
      if (record?.idempotencyKey) {
        await redis.del(`${IDEM_ALIAS_PREFIX}${record.idempotencyKey}`);
      }
      return undefined;
    }
    return record;
  }

  pruneMemory();
  const record = memoryByCommandId.get(commandId);
  if (!record || record.expiresAt <= Date.now()) {
    memoryByCommandId.delete(commandId);
    return undefined;
  }
  return record;
}

async function writeRecord(record: PhysicalCommandRecord): Promise<void> {
  const payload = JSON.stringify(record);
  const redis = await getOptionalRedisClient();
  if (redis) {
    await redis.set(`${COMMAND_PREFIX}${record.commandId}`, payload, 'EX', LEDGER_TTL_SEC);
    await redis.set(
      `${IDEM_ALIAS_PREFIX}${record.idempotencyKey}`,
      record.commandId,
      'EX',
      LEDGER_TTL_SEC,
    );
    return;
  }

  pruneMemory();
  memoryByCommandId.set(record.commandId, record);
  memoryIdemAlias.set(record.idempotencyKey, record.commandId);
}

async function lookupIdempotencyAlias(idempotencyKey: string): Promise<string | undefined> {
  const redis = await getOptionalRedisClient();
  if (redis) {
    const alias = await redis.get(`${IDEM_ALIAS_PREFIX}${idempotencyKey}`);
    return alias ?? undefined;
  }
  return memoryIdemAlias.get(idempotencyKey);
}

export async function beginPhysicalCommandReplay(params: {
  commandId: string;
  idempotencyKey: string;
}): Promise<BeginPhysicalCommandResult> {
  const { commandId, idempotencyKey } = params;
  const expiresAt = Date.now() + LEDGER_TTL_SEC * 1000;

  const aliasCommandId = await lookupIdempotencyAlias(idempotencyKey);
  if (aliasCommandId) {
    const aliasRecord = await readRecord(aliasCommandId);
    if (aliasRecord) return classifyExisting(aliasRecord);
  }

  const existing = await readRecord(commandId);
  if (existing) return classifyExisting(existing);

  const pending: PhysicalCommandRecord = {
    state: 'pending',
    commandId,
    idempotencyKey,
    statusCode: 0,
    body: null,
    expiresAt,
  };

  const redis = await getOptionalRedisClient();
  if (redis) {
    const claimed = await redis.set(
      `${COMMAND_PREFIX}${commandId}`,
      JSON.stringify(pending),
      'EX',
      LEDGER_TTL_SEC,
      'NX',
    );
    if (claimed === 'OK') {
      await redis.set(
        `${IDEM_ALIAS_PREFIX}${idempotencyKey}`,
        commandId,
        'EX',
        LEDGER_TTL_SEC,
        'NX',
      );
      return { kind: 'proceed' };
    }
    const raced = await readRecord(commandId);
    if (!raced) return { kind: 'proceed' };
    return classifyExisting(raced);
  }

  pruneMemory();
  if (!memoryByCommandId.has(commandId)) {
    memoryByCommandId.set(commandId, pending);
    memoryIdemAlias.set(idempotencyKey, commandId);
    return { kind: 'proceed' };
  }
  const raced = memoryByCommandId.get(commandId);
  return raced ? classifyExisting(raced) : { kind: 'proceed' };
}

export async function completePhysicalCommandReplay(
  commandId: string,
  idempotencyKey: string,
  terminalState: 'succeeded' | 'failed',
  statusCode: number,
  body: unknown,
): Promise<void> {
  const record: PhysicalCommandRecord = {
    state: terminalState,
    commandId,
    idempotencyKey,
    statusCode,
    body,
    expiresAt: Date.now() + LEDGER_TTL_SEC * 1000,
  };
  await writeRecord(record);
}

export async function markPhysicalCommandUnknown(
  commandId: string,
  idempotencyKey: string,
  statusCode: number,
  body: unknown,
): Promise<void> {
  const record: PhysicalCommandRecord = {
    state: 'unknown',
    commandId,
    idempotencyKey,
    statusCode,
    body,
    expiresAt: Date.now() + LEDGER_TTL_SEC * 1000,
  };
  await writeRecord(record);
}

/** Drop a pending claim when validation fails before hardware dispatch. */
export async function abandonPhysicalCommandPending(commandId: string): Promise<void> {
  const existing = await readRecord(commandId);
  if (existing?.state !== 'pending') return;

  const redis = await getOptionalRedisClient();
  if (redis) {
    await redis.del(`${COMMAND_PREFIX}${commandId}`);
    await redis.del(`${IDEM_ALIAS_PREFIX}${existing.idempotencyKey}`);
    return;
  }
  memoryByCommandId.delete(commandId);
  memoryIdemAlias.delete(existing.idempotencyKey);
}

export async function getPhysicalCommandRecord(
  commandId: string,
): Promise<PhysicalCommandRecord | undefined> {
  return readRecord(commandId);
}

export function resetPhysicalCommandLedgerForTests(): void {
  memoryByCommandId.clear();
  memoryIdemAlias.clear();
}
