/**
 * Optional Redis persistence for offline sync state (ADR-030).
 * Falls back to in-memory structures when REDIS_URL is unset or unavailable.
 */

import { isRedisRequiredForSync, isRedisSyncAuthoritative } from '../config/redis-sync.js';
import type { SettingsSyncCategory } from '../data/settings-sync-keys.js';
import type { IRedisClient } from './redis-client.js';
import { getOptionalRedisClient } from './redis-client.js';
import { APPLY_SETTINGS_BATCH_LUA } from './redis-sync-lua.js';

const SYNC_VERSION_KEY = 'nexus:sync:version';
/** Legacy JSON blob — migrated to {@link SYNC_SETTINGS_HASH_KEY} on read. */
const SYNC_SETTINGS_KEY = 'nexus:sync:settings';
const SYNC_SETTINGS_HASH_KEY = 'nexus:sync:settings:h';
/** Legacy JSON diff array — superseded by {@link SYNC_DIFF_STREAM_KEY}. */
const SYNC_DIFF_KEY = 'nexus:sync:diff';
const SYNC_DIFF_STREAM_KEY = 'nexus:sync:diff:stream';
const IDEMPOTENCY_HTTP_PREFIX = 'nexus:idempotency:http:';
const IDEMPOTENCY_WS_PREFIX = 'nexus:idempotency:ws:';

const IDEMPOTENCY_TTL_SEC = 300;
const MAX_DIFF_ENTRIES = 500;

export type HttpIdempotencyState = 'pending' | 'completed';

export interface IdempotencyRecord {
  state: HttpIdempotencyState;
  fingerprint: string;
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

export type HttpIdempotencyClaimResult =
  | { kind: 'proceed' }
  | { kind: 'replay'; statusCode: number; body: unknown }
  | { kind: 'conflict'; reason: string }
  | { kind: 'in_flight' };

export interface SyncDiffEntry {
  key: string;
  value: unknown;
  updatedAt: number;
  category: SettingsSyncCategory;
  version: number;
}

const SERVER_BOOT_VERSION = Date.now();

/** Serializes in-process settings batches (memory fallback has no Redis transactions). */
let settingsBatchTail: Promise<unknown> = Promise.resolve();

function withSettingsBatchMutex<T>(task: () => Promise<T>): Promise<T> {
  const next = settingsBatchTail.then(task, task);
  settingsBatchTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

// ─── In-memory fallback ───────────────────────────────────────────────

const memoryVersion = { value: SERVER_BOOT_VERSION };
const memorySettings = new Map<string, unknown>();
const memoryDiff: SyncDiffEntry[] = [];
const memoryIdempotency = new Map<string, IdempotencyRecord>();
const memoryWsKeys = new Map<string, number>();

function pruneMemoryIdempotency(): void {
  const now = Date.now();
  for (const [key, record] of memoryIdempotency) {
    if (record.expiresAt <= now) memoryIdempotency.delete(key);
  }
}

function pruneMemoryWsKeys(): void {
  const now = Date.now();
  for (const [key, expiresAt] of memoryWsKeys) {
    if (expiresAt <= now) memoryWsKeys.delete(key);
  }
}

async function redisClient(): Promise<IRedisClient | null> {
  return getOptionalRedisClient();
}

// ─── Sync version ─────────────────────────────────────────────────────

async function persistSyncVersionKey(redis: IRedisClient, value: number): Promise<void> {
  if (isRedisSyncAuthoritative()) {
    await redis.set(SYNC_VERSION_KEY, String(value));
    return;
  }
  await redis.set(SYNC_VERSION_KEY, String(value), 'EX', 86_400 * 30);
}

export async function getSyncVersion(): Promise<number> {
  const redis = await redisClient();
  if (redis) {
    const raw = await redis.get(SYNC_VERSION_KEY);
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        memoryVersion.value = parsed;
        return parsed;
      }
    }
    await persistSyncVersionKey(redis, memoryVersion.value);
    return memoryVersion.value;
  }
  return memoryVersion.value;
}

export async function bumpSyncVersion(): Promise<number> {
  const redis = await redisClient();
  if (redis) {
    const bumped = await redis.incr(SYNC_VERSION_KEY);
    memoryVersion.value = bumped;
    return bumped;
  }
  memoryVersion.value += 1;
  return memoryVersion.value;
}

/** Roll back version after a failed in-memory settings batch only (never decrement Redis). */
async function rollbackSyncVersionMemory(previous: number): Promise<void> {
  memoryVersion.value = previous;
}

// ─── Settings ─────────────────────────────────────────────────────────

function parseSettingsHashFields(fields: Record<string, string>): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(fields)) {
    try {
      snapshot[key] = JSON.parse(raw) as unknown;
    } catch {
      snapshot[key] = raw;
    }
  }
  return snapshot;
}

async function mergeLegacySettingsJson(
  redis: IRedisClient,
  snapshot: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const raw = await redis.get(SYNC_SETTINGS_KEY);
  if (!raw) return snapshot;
  try {
    const legacy = JSON.parse(raw) as Record<string, unknown>;
    for (const [key, value] of Object.entries(legacy)) {
      if (snapshot[key] === undefined) {
        await redis.hset(SYNC_SETTINGS_HASH_KEY, key, JSON.stringify(value));
        snapshot[key] = value;
      }
    }
    await redis.del(SYNC_SETTINGS_KEY);
  } catch {
    // keep partial hash snapshot
  }
  return snapshot;
}

export async function getServerSettingsSnapshot(): Promise<Record<string, unknown>> {
  const redis = await redisClient();
  if (redis) {
    const hash = await redis.hgetall(SYNC_SETTINGS_HASH_KEY);
    const snapshot = parseSettingsHashFields(hash);
    return mergeLegacySettingsJson(redis, snapshot);
  }
  return Object.fromEntries(memorySettings);
}

async function persistSettingsSnapshot(snapshot: Record<string, unknown>): Promise<void> {
  const redis = await redisClient();
  if (redis) {
    const existing = await redis.hgetall(SYNC_SETTINGS_HASH_KEY);
    const nextKeys = new Set(Object.keys(snapshot));
    for (const key of Object.keys(existing)) {
      if (!nextKeys.has(key)) {
        await redis.hdel(SYNC_SETTINGS_HASH_KEY, key);
      }
    }
    for (const [key, value] of Object.entries(snapshot)) {
      await redis.hset(SYNC_SETTINGS_HASH_KEY, key, JSON.stringify(value));
    }
    return;
  }
  memorySettings.clear();
  for (const [key, value] of Object.entries(snapshot)) {
    memorySettings.set(key, value);
  }
}

export async function setServerSetting(key: string, value: unknown): Promise<void> {
  const snapshot = await getServerSettingsSnapshot();
  snapshot[key] = value;
  await persistSettingsSnapshot(snapshot);
}

/** Atomic multi-key settings patch with a single version bump and diff append. */
export async function applySettingsBatch(
  entries: Array<{
    key: string;
    value: unknown;
    category: SettingsSyncCategory;
    updatedAt: number;
  }>,
): Promise<number> {
  return withSettingsBatchMutex(() => applySettingsBatchInner(entries));
}

async function applySettingsBatchInner(
  entries: Array<{
    key: string;
    value: unknown;
    category: SettingsSyncCategory;
    updatedAt: number;
  }>,
): Promise<number> {
  if (entries.length === 0) {
    return getSyncVersion();
  }

  const redis = await redisClient();
  if (redis) {
    try {
      const versionKey = await redis.get(SYNC_VERSION_KEY);
      if (!versionKey) {
        await persistSyncVersionKey(redis, memoryVersion.value);
      }
      const argv: string[] = [String(entries.length)];
      for (const entry of entries) {
        argv.push(entry.key, JSON.stringify(entry.value), entry.category, String(entry.updatedAt));
      }
      argv.push(String(MAX_DIFF_ENTRIES));
      const result = await redis.eval(
        APPLY_SETTINGS_BATCH_LUA,
        3,
        SYNC_VERSION_KEY,
        SYNC_SETTINGS_HASH_KEY,
        SYNC_DIFF_STREAM_KEY,
        ...argv,
      );
      const version = Number(result);
      if (!Number.isFinite(version)) {
        throw new Error('[sync-persistence] Redis settings batch returned invalid version');
      }
      memoryVersion.value = version;
      for (const entry of entries) {
        memorySettings.set(entry.key, entry.value);
      }
      return version;
    } catch (error) {
      if (isRedisRequiredForSync()) {
        throw error;
      }
      console.warn(
        '[sync-persistence] Redis settings batch failed; falling back to in-memory path:',
        (error as Error).message,
      );
    }
  }

  const priorVersion = await getSyncVersion();
  const priorSnapshot = await getServerSettingsSnapshot();
  const snapshot = { ...priorSnapshot };
  for (const entry of entries) {
    snapshot[entry.key] = entry.value;
  }

  const log = await readDiffLog();
  const version = await bumpSyncVersion();
  const nextLog = [...log];
  for (const entry of entries) {
    nextLog.push({
      key: entry.key,
      value: entry.value,
      updatedAt: entry.updatedAt,
      category: entry.category,
      version,
    });
  }

  try {
    await persistSettingsSnapshot(snapshot);
    await writeDiffLog(nextLog);
    return version;
  } catch (error) {
    await rollbackSyncVersionMemory(priorVersion);
    try {
      await persistSettingsSnapshot(priorSnapshot);
    } catch (restoreError) {
      console.error(
        '[sync-persistence] Failed to restore settings snapshot after batch error',
        restoreError,
      );
    }
    throw error;
  }
}

// ─── Diff log ─────────────────────────────────────────────────────────

function streamFieldsToEntry(fields: string[]): SyncDiffEntry | undefined {
  const map: Record<string, string> = {};
  for (let i = 0; i < fields.length - 1; i += 2) {
    const k = fields[i];
    const v = fields[i + 1];
    if (k !== undefined && v !== undefined) map[k] = v;
  }
  const version = Number(map.version);
  const updatedAt = Number(map.updatedAt);
  if (!map.key || !Number.isFinite(version) || !Number.isFinite(updatedAt)) return undefined;
  let value: unknown = map.value;
  if (map.value) {
    try {
      value = JSON.parse(map.value) as unknown;
    } catch {
      value = map.value;
    }
  }
  const category = map.category as SettingsSyncCategory;
  return { key: map.key, value, updatedAt, category, version };
}

async function readLegacyDiffLog(redis: IRedisClient): Promise<SyncDiffEntry[]> {
  const raw = await redis.get(SYNC_DIFF_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SyncDiffEntry[];
  } catch {
    return [];
  }
}

async function readDiffLogFromStream(redis: IRedisClient): Promise<SyncDiffEntry[]> {
  const rows = await redis.xrevrange(SYNC_DIFF_STREAM_KEY, '+', '-', 'COUNT', MAX_DIFF_ENTRIES);
  const entries: SyncDiffEntry[] = [];
  for (const row of rows) {
    const fields = row[1];
    const entry = streamFieldsToEntry(fields);
    if (entry) entries.push(entry);
  }
  return entries.reverse();
}

async function readDiffLog(): Promise<SyncDiffEntry[]> {
  const redis = await redisClient();
  if (redis) {
    const legacyEntries = await readLegacyDiffLog(redis);
    const streamEntries = await readDiffLogFromStream(redis);
    if (legacyEntries.length > 0 && streamEntries.length > 0) {
      await redis.del(SYNC_DIFF_KEY);
    }
    const combined =
      legacyEntries.length > 0 && streamEntries.length > 0
        ? [...legacyEntries, ...streamEntries]
        : streamEntries.length > 0
          ? streamEntries
          : legacyEntries;
    return combined.slice(-MAX_DIFF_ENTRIES);
  }
  return [...memoryDiff];
}

async function writeDiffLog(entries: SyncDiffEntry[]): Promise<void> {
  const trimmed = entries.slice(-MAX_DIFF_ENTRIES);
  const redis = await redisClient();
  if (redis) {
    await redis.set(SYNC_DIFF_KEY, JSON.stringify(trimmed), 'EX', 86_400 * 30);
    return;
  }
  memoryDiff.length = 0;
  memoryDiff.push(...trimmed);
}

export async function appendSyncDiffEntry(entry: SyncDiffEntry): Promise<void> {
  const log = await readDiffLog();
  log.push(entry);
  await writeDiffLog(log);
}

export interface SyncDiffResult {
  version: number;
  changes: SyncDiffEntry[];
  /** True when `since` is older than retained stream history (client must full-resync). */
  fullResyncRequired?: boolean;
}

export async function getSyncDiffSince(since: number): Promise<SyncDiffResult> {
  const version = await getSyncVersion();
  const normalizedSince = Number.isFinite(since) ? since : 0;
  const log = await readDiffLog();
  const changes = log.filter((entry) => entry.version > normalizedSince);
  if (log.length > 0) {
    const minVersion = Math.min(...log.map((e) => e.version));
    if (normalizedSince > 0 && normalizedSince < minVersion - 1) {
      return { version, changes: [], fullResyncRequired: true };
    }
  }
  return { version, changes };
}

// ─── HTTP idempotency ─────────────────────────────────────────────────

function parseIdempotencyRecord(raw: string): IdempotencyRecord | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<IdempotencyRecord>;
    if (!parsed.fingerprint || !parsed.expiresAt) return undefined;
    const state: HttpIdempotencyState = parsed.state === 'pending' ? 'pending' : 'completed';
    if (state === 'pending') {
      return {
        state: 'pending',
        fingerprint: parsed.fingerprint,
        statusCode: 0,
        body: null,
        expiresAt: parsed.expiresAt,
      };
    }
    if (typeof parsed.statusCode !== 'number') return undefined;
    return {
      state: 'completed',
      fingerprint: parsed.fingerprint,
      statusCode: parsed.statusCode,
      body: parsed.body,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return undefined;
  }
}

export async function getIdempotencyRecord(key: string): Promise<IdempotencyRecord | undefined> {
  const redis = await redisClient();
  if (redis) {
    const raw = await redis.get(`${IDEMPOTENCY_HTTP_PREFIX}${key}`);
    if (!raw) return undefined;
    const record = parseIdempotencyRecord(raw);
    if (!record) return undefined;
    if (record.expiresAt <= Date.now()) {
      await redis.del(`${IDEMPOTENCY_HTTP_PREFIX}${key}`);
      return undefined;
    }
    return record;
  }

  pruneMemoryIdempotency();
  const record = memoryIdempotency.get(key);
  if (!record || record.expiresAt <= Date.now()) {
    memoryIdempotency.delete(key);
    return undefined;
  }
  return record;
}

/** Atomic claim for HTTP idempotency (composite scope key + body fingerprint). */
export async function claimHttpIdempotency(
  scopeKey: string,
  fingerprint: string,
): Promise<HttpIdempotencyClaimResult> {
  const expiresAt = Date.now() + IDEMPOTENCY_TTL_SEC * 1000;
  const pending: IdempotencyRecord = {
    state: 'pending',
    fingerprint,
    statusCode: 0,
    body: null,
    expiresAt,
  };

  const redis = await redisClient();
  if (redis) {
    const redisKey = `${IDEMPOTENCY_HTTP_PREFIX}${scopeKey}`;
    const claimed = await redis.set(
      redisKey,
      JSON.stringify(pending),
      'EX',
      IDEMPOTENCY_TTL_SEC,
      'NX',
    );
    if (claimed === 'OK') return { kind: 'proceed' };

    const existing = await getIdempotencyRecord(scopeKey);
    if (!existing) return { kind: 'in_flight' };
    if (existing.state === 'pending') return { kind: 'in_flight' };
    if (existing.fingerprint !== fingerprint) {
      return { kind: 'conflict', reason: 'Idempotency key reused with different request body' };
    }
    return { kind: 'replay', statusCode: existing.statusCode, body: existing.body };
  }

  pruneMemoryIdempotency();
  const existing = memoryIdempotency.get(scopeKey);
  if (!existing || existing.expiresAt <= Date.now()) {
    memoryIdempotency.set(scopeKey, pending);
    return { kind: 'proceed' };
  }
  if (existing.state === 'pending') return { kind: 'in_flight' };
  if (existing.fingerprint !== fingerprint) {
    return { kind: 'conflict', reason: 'Idempotency key reused with different request body' };
  }
  return { kind: 'replay', statusCode: existing.statusCode, body: existing.body };
}

/** Drop a pending claim when the handler finishes with a non-success response. */
export async function abandonHttpIdempotency(scopeKey: string, fingerprint: string): Promise<void> {
  const existing = await getIdempotencyRecord(scopeKey);
  if (existing?.state !== 'pending' || existing.fingerprint !== fingerprint) {
    return;
  }

  const redis = await redisClient();
  if (redis) {
    await redis.del(`${IDEMPOTENCY_HTTP_PREFIX}${scopeKey}`);
    return;
  }
  memoryIdempotency.delete(scopeKey);
}

export async function completeHttpIdempotency(
  scopeKey: string,
  fingerprint: string,
  statusCode: number,
  body: unknown,
): Promise<void> {
  const record: IdempotencyRecord = {
    state: 'completed',
    fingerprint,
    statusCode,
    body,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_SEC * 1000,
  };

  const redis = await redisClient();
  if (redis) {
    await redis.set(
      `${IDEMPOTENCY_HTTP_PREFIX}${scopeKey}`,
      JSON.stringify(record),
      'EX',
      IDEMPOTENCY_TTL_SEC,
    );
    return;
  }

  pruneMemoryIdempotency();
  memoryIdempotency.set(scopeKey, record);
}

/** @deprecated Prefer claimHttpIdempotency + completeHttpIdempotency */
export async function setIdempotencyRecord(
  key: string,
  statusCode: number,
  body: unknown,
): Promise<void> {
  await completeHttpIdempotency(key, 'legacy', statusCode, body);
}

// ─── WS idempotency ───────────────────────────────────────────────────

export async function isWsIdempotencyReplay(key: string): Promise<boolean> {
  const redis = await redisClient();
  if (redis) {
    const hit = await redis.get(`${IDEMPOTENCY_WS_PREFIX}${key}`);
    return hit !== null;
  }

  pruneMemoryWsKeys();
  const expiresAt = memoryWsKeys.get(key);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    memoryWsKeys.delete(key);
    return false;
  }
  return true;
}

export async function markWsIdempotencyAccepted(key: string): Promise<void> {
  const redis = await redisClient();
  if (redis) {
    await redis.set(`${IDEMPOTENCY_WS_PREFIX}${key}`, '1', 'EX', IDEMPOTENCY_TTL_SEC);
    return;
  }

  pruneMemoryWsKeys();
  memoryWsKeys.set(key, Date.now() + IDEMPOTENCY_TTL_SEC * 1000);
}

// ─── Test helpers ─────────────────────────────────────────────────────

export function resetSyncPersistenceForTests(version = SERVER_BOOT_VERSION): void {
  memoryVersion.value = version;
  memorySettings.clear();
  memoryDiff.length = 0;
  memoryIdempotency.clear();
  memoryWsKeys.clear();
}
