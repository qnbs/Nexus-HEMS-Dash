/**
 * Physical-command idempotency ledger (FUP-IDEM-01).
 * Tracks pending / succeeded / failed / unknown per `commandId` so offline
 * replays and transport retries cannot double-actuate hardware after dispatch.
 */

import type { PhysicalCommandState } from '@nexus-hems/shared-types';
import {
  ABANDON_PHYSICAL_COMMAND_PENDING_LUA,
  BEGIN_PHYSICAL_COMMAND_REPLAY_LUA,
  COMPLETE_PHYSICAL_COMMAND_REPLAY_LUA,
} from './physical-command-ledger-lua.js';
import { getOptionalRedisClient } from './redis-client.js';

const COMMAND_PREFIX = 'nexus:physical-cmd:';
const IDEM_ALIAS_PREFIX = 'nexus:physical-cmd:idem:';
/** Terminal success/failure and in-flight pending claims. */
const LEDGER_TTL_SEC = 300;
/** Unknown outcomes must not expire before operator review. */
const UNKNOWN_TTL_SEC = 24 * 60 * 60;

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

function ttlSecondsForState(state: PhysicalCommandState): number {
  return state === 'unknown' ? UNKNOWN_TTL_SEC : LEDGER_TTL_SEC;
}

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
    if (record?.idempotencyKey) {
      memoryIdemAlias.delete(record.idempotencyKey);
    }
    return undefined;
  }
  return record;
}

async function writeRecord(record: PhysicalCommandRecord): Promise<void> {
  const payload = JSON.stringify(record);
  const ttlSec = ttlSecondsForState(record.state);
  const redis = await getOptionalRedisClient();
  if (redis) {
    await redis.set(`${COMMAND_PREFIX}${record.commandId}`, payload, 'EX', ttlSec);
    await redis.set(`${IDEM_ALIAS_PREFIX}${record.idempotencyKey}`, record.commandId, 'EX', ttlSec);
    return;
  }

  pruneMemory();
  memoryByCommandId.set(record.commandId, record);
  memoryIdemAlias.set(record.idempotencyKey, record.commandId);
}

async function resolveIdempotencyAlias(
  idempotencyKey: string,
): Promise<BeginPhysicalCommandResult | null> {
  const redis = await getOptionalRedisClient();
  if (redis) {
    const aliasCommandId = await redis.get(`${IDEM_ALIAS_PREFIX}${idempotencyKey}`);
    if (!aliasCommandId) return null;
    const aliasRecord = await readRecord(aliasCommandId);
    if (aliasRecord) return classifyExisting(aliasRecord);
    await redis.del(`${IDEM_ALIAS_PREFIX}${idempotencyKey}`);
    return null;
  }

  pruneMemory();
  const aliasCommandId = memoryIdemAlias.get(idempotencyKey);
  if (!aliasCommandId) return null;
  const aliasRecord = memoryByCommandId.get(aliasCommandId);
  if (aliasRecord && aliasRecord.expiresAt > Date.now()) {
    return classifyExisting(aliasRecord);
  }
  memoryIdemAlias.delete(idempotencyKey);
  return null;
}

async function beginPhysicalCommandReplayRedis(
  redis: NonNullable<Awaited<ReturnType<typeof getOptionalRedisClient>>>,
  params: { commandId: string; idempotencyKey: string; pending: PhysicalCommandRecord },
): Promise<BeginPhysicalCommandResult> {
  const { commandId, idempotencyKey, pending } = params;
  const recordKey = `${COMMAND_PREFIX}${commandId}`;
  const aliasKey = `${IDEM_ALIAS_PREFIX}${idempotencyKey}`;
  const pendingJson = JSON.stringify(pending);
  const claimResult = await redis.eval(
    BEGIN_PHYSICAL_COMMAND_REPLAY_LUA,
    2,
    recordKey,
    aliasKey,
    pendingJson,
    String(LEDGER_TTL_SEC),
    commandId,
  );
  const code = typeof claimResult === 'number' ? claimResult : Number(claimResult);
  if (code === 0) {
    const verified = await redis.get(recordKey);
    if (verified === pendingJson && (await redis.get(aliasKey)) === commandId) {
      return { kind: 'proceed' };
    }
    return { kind: 'in_flight' };
  }
  if (code === 1) {
    const raced = await readRecord(commandId);
    return raced ? classifyExisting(raced) : { kind: 'in_flight' };
  }
  if (code === 2) {
    const racedAlias = await resolveIdempotencyAlias(idempotencyKey);
    if (racedAlias) return racedAlias;
    const raced = await readRecord(commandId);
    return raced ? classifyExisting(raced) : { kind: 'in_flight' };
  }
  if (code === 3) {
    return { kind: 'in_flight' };
  }
  throw new Error(`[physical-command-ledger] unexpected eval return: ${String(claimResult)}`);
}

export async function beginPhysicalCommandReplay(params: {
  commandId: string;
  idempotencyKey: string;
}): Promise<BeginPhysicalCommandResult> {
  const { commandId, idempotencyKey } = params;
  const pendingExpiresAt = Date.now() + LEDGER_TTL_SEC * 1000;

  const viaAlias = await resolveIdempotencyAlias(idempotencyKey);
  if (viaAlias) return viaAlias;

  const existing = await readRecord(commandId);
  if (existing) return classifyExisting(existing);

  const pending: PhysicalCommandRecord = {
    state: 'pending',
    commandId,
    idempotencyKey,
    statusCode: 0,
    body: null,
    expiresAt: pendingExpiresAt,
  };

  const redis = await getOptionalRedisClient();
  if (redis) {
    return beginPhysicalCommandReplayRedis(redis, { commandId, idempotencyKey, pending });
  }

  pruneMemory();
  if (memoryIdemAlias.has(idempotencyKey)) {
    const racedAlias = await resolveIdempotencyAlias(idempotencyKey);
    if (racedAlias) return racedAlias;
  }
  memoryIdemAlias.set(idempotencyKey, commandId);

  if (!memoryByCommandId.has(commandId)) {
    memoryByCommandId.set(commandId, pending);
    return { kind: 'proceed' };
  }
  memoryIdemAlias.delete(idempotencyKey);
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
  const ttlSec = ttlSecondsForState(terminalState);
  const record: PhysicalCommandRecord = {
    state: terminalState,
    commandId,
    idempotencyKey,
    statusCode,
    body,
    expiresAt: Date.now() + ttlSec * 1000,
  };

  const redis = await getOptionalRedisClient();
  if (redis) {
    const recordKey = `${COMMAND_PREFIX}${commandId}`;
    const aliasKey = `${IDEM_ALIAS_PREFIX}${idempotencyKey}`;
    const pendingRaw = await redis.get(recordKey);
    if (!pendingRaw) return;
    const current = parseRecord(pendingRaw);
    if (current?.state !== 'pending' || current.idempotencyKey !== idempotencyKey) {
      return;
    }
    const terminalJson = JSON.stringify(record);
    await redis.eval(
      COMPLETE_PHYSICAL_COMMAND_REPLAY_LUA,
      2,
      recordKey,
      aliasKey,
      terminalJson,
      pendingRaw,
      String(ttlSec),
    );
    return;
  }

  const memoryCurrent = await readRecord(commandId);
  if (
    memoryCurrent &&
    (memoryCurrent.state !== 'pending' || memoryCurrent.idempotencyKey !== idempotencyKey)
  ) {
    return;
  }
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
    expiresAt: Date.now() + UNKNOWN_TTL_SEC * 1000,
  };
  await writeRecord(record);
}

/** Drop a pending claim when validation fails before hardware dispatch. */
export async function abandonPhysicalCommandPending(commandId: string): Promise<void> {
  const redis = await getOptionalRedisClient();
  if (redis) {
    const recordKey = `${COMMAND_PREFIX}${commandId}`;
    const pendingRaw = await redis.get(recordKey);
    if (!pendingRaw) return;
    const existing = parseRecord(pendingRaw);
    if (existing?.state !== 'pending') return;
    const aliasKey = `${IDEM_ALIAS_PREFIX}${existing.idempotencyKey}`;
    await redis.eval(ABANDON_PHYSICAL_COMMAND_PENDING_LUA, 2, recordKey, aliasKey, pendingRaw);
    return;
  }

  const existing = await readRecord(commandId);
  if (existing?.state !== 'pending') return;
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
