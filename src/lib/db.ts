import Dexie, { type Table } from 'dexie';
import type { CommandAuditEntry } from '../core/command-safety';
import type { EnergyData, StoredSettings } from '../types';
import type { ShareLink } from './auth/auth-provider';
import type { EncryptedAdapterCredential } from './secure-store';

export interface EnergySnapshot extends EnergyData {
  id?: number;
  timestamp: number;
  /** Schema version that created this record (for forward-compat checks) */
  _schemaVersion?: number;
}

export interface SankeySnapshot {
  id?: number;
  timestamp: number;
  data: EnergyData;
  flows: Array<{ source: string; target: string; value: number }>;
}

export interface OfflineAction {
  id?: number;
  type: 'ev-control' | 'hp-control' | 'battery-control' | 'settings' | 'ai-optimize';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface CacheMetadata {
  key: string;
  url: string;
  timestamp: number;
  expiresAt: number;
  size: number;
  type: 'api' | 'image' | 'static';
}

export interface ErrorLog {
  id?: number;
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SettingsRecord {
  key: string;
  value: StoredSettings;
}

export interface AIKeyRecord {
  provider: string;
  encryptedKey: string;
  model: string;
  baseUrl: string;
  createdAt: number;
  lastUsed: number;
}

export interface AIForecastRecord {
  id?: number;
  metric: string;
  model: string;
  createdAt: number;
  horizonHours: number;
  accuracy: { mae: number; mape: number; rmse: number; r2: number };
  points: Array<{ timestamp: number; value: number; lower: number; upper: number }>;
  persistedToInflux: boolean;
}

/** Current schema version constant — bump when adding a new Dexie version */
export const DB_CURRENT_VERSION = 9;

/** Shared store definitions (DRY — single source of truth for the latest schema) */
const LATEST_STORES = {
  energySnapshots: '++id, timestamp',
  sankeySnapshots: '++id, timestamp',
  offlineActions: '++id, timestamp, status, type',
  cacheMetadata: 'key, timestamp, expiresAt, type',
  errorLogs: '++id, timestamp, severity',
  settings: 'key',
  aiKeys: 'provider',
  commandAudit: '++id, timestamp, commandType, status',
  adapterCredentials: 'adapterId',
  shareLinks: 'id, token, expiresAt, active',
  aiForecastHistory: '++id, metric, createdAt, model',
} as const;

export class NexusDatabase extends Dexie {
  energySnapshots!: Table<EnergySnapshot, number>;
  sankeySnapshots!: Table<SankeySnapshot, number>;
  offlineActions!: Table<OfflineAction, number>;
  cacheMetadata!: Table<CacheMetadata, string>;
  errorLogs!: Table<ErrorLog, number>;
  settings!: Table<SettingsRecord, string>;
  aiKeys!: Table<AIKeyRecord, string>;
  commandAudit!: Table<CommandAuditEntry, number>;
  adapterCredentials!: Table<EncryptedAdapterCredential, string>;
  shareLinks!: Table<ShareLink, string>;
  aiForecastHistory!: Table<AIForecastRecord, number>;

  constructor(dbName = 'nexus-hems-dash') {
    super(dbName);

    // ── Version 1: Original schema ──────────────────────────────────
    this.version(1).stores({
      energySnapshots: '++id, timestamp',
      settings: 'key',
    });

    // ── Version 2: Add advanced PWA features ────────────────────────
    this.version(2)
      .stores({
        energySnapshots: '++id, timestamp',
        sankeySnapshots: '++id, timestamp',
        offlineActions: '++id, timestamp, status, type',
        cacheMetadata: 'key, timestamp, expiresAt, type',
        errorLogs: '++id, timestamp, severity',
        settings: 'key',
      })
      .upgrade((tx) => {
        // Backfill _schemaVersion on existing snapshots
        return tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: EnergySnapshot) => {
            snap._schemaVersion ??= 1;
          });
      });

    // ── Version 3: Add encrypted AI key storage (BYOK) ─────────────
    this.version(3)
      .stores({
        energySnapshots: '++id, timestamp',
        sankeySnapshots: '++id, timestamp',
        offlineActions: '++id, timestamp, status, type',
        cacheMetadata: 'key, timestamp, expiresAt, type',
        errorLogs: '++id, timestamp, severity',
        settings: 'key',
        aiKeys: 'provider',
      })
      .upgrade((tx) => {
        return tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: EnergySnapshot) => {
            snap._schemaVersion = 3;
          });
      });

    // ── Version 4: Add command audit trail for safety logging ───────
    this.version(4)
      .stores({
        energySnapshots: '++id, timestamp',
        sankeySnapshots: '++id, timestamp',
        offlineActions: '++id, timestamp, status, type',
        cacheMetadata: 'key, timestamp, expiresAt, type',
        errorLogs: '++id, timestamp, severity',
        settings: 'key',
        aiKeys: 'provider',
        commandAudit: '++id, timestamp, commandType, status',
      })
      .upgrade((tx) => {
        return tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: EnergySnapshot) => {
            snap._schemaVersion = 4;
          });
      });

    // ── Version 5: Add encrypted adapter credential vault ──────────
    this.version(5)
      .stores({
        energySnapshots: '++id, timestamp',
        sankeySnapshots: '++id, timestamp',
        offlineActions: '++id, timestamp, status, type',
        cacheMetadata: 'key, timestamp, expiresAt, type',
        errorLogs: '++id, timestamp, severity',
        settings: 'key',
        aiKeys: 'provider',
        commandAudit: '++id, timestamp, commandType, status',
        adapterCredentials: 'adapterId',
      })
      .upgrade((tx) => {
        return tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: EnergySnapshot) => {
            snap._schemaVersion = 5;
          });
      });

    // ── Version 6: Add share links for time-limited QR sharing ─────
    this.version(6)
      .stores({
        energySnapshots: '++id, timestamp',
        sankeySnapshots: '++id, timestamp',
        offlineActions: '++id, timestamp, status, type',
        cacheMetadata: 'key, timestamp, expiresAt, type',
        errorLogs: '++id, timestamp, severity',
        settings: 'key',
        aiKeys: 'provider',
        commandAudit: '++id, timestamp, commandType, status',
        adapterCredentials: 'adapterId',
        shareLinks: 'id, token, expiresAt, active',
      })
      .upgrade((tx) => {
        return tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: EnergySnapshot) => {
            snap._schemaVersion = 6;
          });
      });

    // ── Version 7: Extended history retention (50k snapshots) ───────
    this.version(7)
      .stores({
        energySnapshots: '++id, timestamp',
        sankeySnapshots: '++id, timestamp',
        offlineActions: '++id, timestamp, status, type',
        cacheMetadata: 'key, timestamp, expiresAt, type',
        errorLogs: '++id, timestamp, severity',
        settings: 'key',
        aiKeys: 'provider',
        commandAudit: '++id, timestamp, commandType, status',
        adapterCredentials: 'adapterId',
        shareLinks: 'id, token, expiresAt, active',
      })
      .upgrade((tx) => {
        return tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: EnergySnapshot) => {
            snap._schemaVersion = 7;
          });
      });

    // ── Version 8: Migration-safe upgrade with data validation ──────
    // Ensures all existing records have required fields with safe defaults
    this.version(8)
      .stores(LATEST_STORES)
      .upgrade(async (tx) => {
        // Backfill energy snapshots with safe defaults for any missing fields
        await tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: Record<string, unknown>) => {
            snap._schemaVersion = 8;
            // Ensure all EnergyData fields exist with safe defaults
            snap.gridPower ??= 0;
            snap.pvPower ??= 0;
            snap.batteryPower ??= 0;
            snap.houseLoad ??= 0;
            snap.batterySoC ??= 0;
            snap.heatPumpPower ??= 0;
            snap.evPower ??= 0;
            snap.gridVoltage ??= 230;
            snap.batteryVoltage ??= 48;
            snap.pvYieldToday ??= 0;
            snap.priceCurrent ??= 0;
            snap.timestamp ??= Date.now();
          });

        // Ensure offline actions have valid status
        await tx
          .table('offlineActions')
          .toCollection()
          .modify((action: Record<string, unknown>) => {
            const validStatuses = ['pending', 'syncing', 'failed', 'completed'];
            if (!validStatuses.includes(action.status as string)) {
              action.status = 'failed';
            }
            action.retries ??= 0;
          });
      });

    // ── Version 9: AI forecast history table for persistence ────────
    this.version(9)
      .stores(LATEST_STORES)
      .upgrade(async (tx) => {
        await tx
          .table('energySnapshots')
          .toCollection()
          .modify((snap: Record<string, unknown>) => {
            snap._schemaVersion = 9;
          });
      });
  }
}

export const nexusDb = new NexusDatabase();

/**
 * Persist energy snapshot with automatic cleanup
 */
export async function persistSnapshot(snapshot: EnergyData) {
  await nexusDb.energySnapshots.add({ ...snapshot, timestamp: Date.now() });

  // Extended retention: 50 000 snapshots ≈ 30 days at 1 snapshot/min
  const MAX_SNAPSHOTS = 50_000;
  const count = await nexusDb.energySnapshots.count();
  if (count > MAX_SNAPSHOTS) {
    const oldest = await nexusDb.energySnapshots
      .orderBy('timestamp')
      .limit(count - MAX_SNAPSHOTS)
      .primaryKeys();
    await nexusDb.energySnapshots.bulkDelete(oldest);
  }
}

/**
 * Get the most recent persisted energy snapshot (used by OfflineBanner)
 */
export async function getLatestEnergySnapshot(): Promise<{
  data: EnergyData;
  timestamp: number;
  ageMinutes: number;
} | null> {
  try {
    const latest = await nexusDb.energySnapshots.orderBy('timestamp').reverse().first();
    if (!latest) return null;
    return {
      data: latest,
      timestamp: latest.timestamp,
      ageMinutes: Math.floor((Date.now() - latest.timestamp) / 1000 / 60),
    };
  } catch {
    return null;
  }
}

/**
 * Persist Sankey visualization snapshot
 */
export async function persistSankeySnapshot(
  data: EnergyData,
  flows: Array<{ source: string; target: string; value: number }>,
) {
  await nexusDb.sankeySnapshots.add({
    timestamp: Date.now(),
    data,
    flows,
  });

  const count = await nexusDb.sankeySnapshots.count();
  if (count > 100) {
    const oldest = await nexusDb.sankeySnapshots
      .orderBy('timestamp')
      .limit(count - 100)
      .primaryKeys();
    await nexusDb.sankeySnapshots.bulkDelete(oldest);
  }
}

/**
 * Queue offline action for later sync
 */
export async function queueOfflineAction(
  type: OfflineAction['type'],
  payload: Record<string, unknown>,
): Promise<number> {
  const id = await nexusDb.offlineActions.add({
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
  });
  return id as number;
}

/**
 * Get pending offline actions
 */
export async function getPendingActions(): Promise<OfflineAction[]> {
  return nexusDb.offlineActions
    .where('status')
    .equals('pending')
    .or('status')
    .equals('failed')
    .and((action) => action.retries < 3)
    .toArray();
}

/**
 * Update offline action status
 */
export async function updateActionStatus(
  id: number,
  status: OfflineAction['status'],
  error?: string,
) {
  const action = await nexusDb.offlineActions.get(id);
  if (action) {
    await nexusDb.offlineActions.update(id, {
      status,
      error,
      retries: status === 'failed' ? action.retries + 1 : action.retries,
    });
  }
}

/**
 * Clear completed actions older than 7 days
 */
export async function cleanupCompletedActions() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await nexusDb.offlineActions
    .where('status')
    .equals('completed')
    .and((action) => action.timestamp < sevenDaysAgo)
    .delete();
}

/**
 * Store cache metadata for monitoring
 */
export async function storeCacheMetadata(
  key: string,
  url: string,
  size: number,
  type: CacheMetadata['type'],
  ttl: number = 24 * 60 * 60 * 1000, // 24 hours default
) {
  await nexusDb.cacheMetadata.put({
    key,
    url,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
    size,
    type,
  });
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const metadata = await nexusDb.cacheMetadata.toArray();
  const now = Date.now();

  const totalSize = metadata.reduce((sum, item) => sum + item.size, 0);
  const expired = metadata.filter((item) => item.expiresAt < now).length;
  const byType = metadata.reduce<Partial<Record<string, number>>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalSize,
    totalEntries: metadata.length,
    expired,
    byType,
  };
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache() {
  const now = Date.now();
  await nexusDb.cacheMetadata.where('expiresAt').below(now).delete();
}

/**
 * Log error for diagnostics.
 * LOW-03: Enforces max 100 entries AND a 7-day TTL to prevent unbounded growth.
 */
export async function logError(
  error: Error,
  componentStack?: string,
  severity: ErrorLog['severity'] = 'medium',
) {
  await nexusDb.errorLogs.add({
    timestamp: Date.now(),
    message: error.message,
    stack: error.stack,
    componentStack,
    userAgent: navigator.userAgent,
    url: window.location.href,
    severity,
  });

  // Enforce 100-entry cap
  const count = await nexusDb.errorLogs.count();
  if (count > 100) {
    const oldest = await nexusDb.errorLogs
      .orderBy('timestamp')
      .limit(count - 100)
      .primaryKeys();
    await nexusDb.errorLogs.bulkDelete(oldest);
  }

  // LOW-03: Enforce 7-day TTL — delete entries older than 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const expired = await nexusDb.errorLogs.where('timestamp').below(sevenDaysAgo).primaryKeys();
  if (expired.length > 0) {
    await nexusDb.errorLogs.bulkDelete(expired);
  }
}

/**
 * Get recent errors for diagnostics
 */
export async function getRecentErrors(limit: number = 20): Promise<ErrorLog[]> {
  return nexusDb.errorLogs.orderBy('timestamp').reverse().limit(limit).toArray();
}

/**
 * Persist settings
 */
export async function persistSettings(settings: StoredSettings) {
  await nexusDb.settings.put({ key: 'ui-settings', value: settings });
}

/**
 * Get database size estimate
 */
export async function getDatabaseSize(): Promise<number> {
  if ('estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Clear all database data (for reset)
 */
export async function clearAllData() {
  await Promise.all([
    nexusDb.energySnapshots.clear(),
    nexusDb.sankeySnapshots.clear(),
    nexusDb.offlineActions.clear(),
    nexusDb.cacheMetadata.clear(),
    nexusDb.errorLogs.clear(),
    nexusDb.shareLinks.clear(),
  ]);
}

// ─── Share Link Persistence ─────────────────────────────────────────

/**
 * Save a share link to IndexedDB (for offline-first providers like Keycloak)
 */
export async function persistShareLink(link: ShareLink): Promise<void> {
  await nexusDb.shareLinks.put(link);
}

/**
 * Get all active, non-expired share links
 */
export async function getActiveShareLinks(): Promise<ShareLink[]> {
  const now = Date.now();
  return nexusDb.shareLinks
    .where('active')
    .equals(1) // Dexie boolean indexing
    .and((link) => link.expiresAt > now)
    .toArray();
}

/**
 * Validate a share token against the local DB
 */
export async function validateLocalShareToken(
  token: string,
): Promise<{ valid: boolean; permissions?: 'view' | 'control'; expiresAt?: number }> {
  const link = await nexusDb.shareLinks.where('token').equals(token).first();
  if (!link || !link.active) return { valid: false };
  if (link.expiresAt < Date.now()) return { valid: false };
  if (link.maxUses > 0 && link.useCount >= link.maxUses) return { valid: false };

  // Increment use count
  await nexusDb.shareLinks.update(link.id, { useCount: link.useCount + 1 });

  return { valid: true, permissions: link.permissions, expiresAt: link.expiresAt };
}

/**
 * Revoke a share link by ID
 */
export async function revokeLocalShareLink(linkId: string): Promise<void> {
  await nexusDb.shareLinks.update(linkId, { active: false });
}

/**
 * Clean expired share links
 */
export async function cleanExpiredShareLinks(): Promise<void> {
  const now = Date.now();
  await nexusDb.shareLinks.where('expiresAt').below(now).delete();
}

// ─── Migration Health & Backup ──────────────────────────────────────

export interface MigrationHealthResult {
  ok: boolean;
  currentVersion: number;
  expectedVersion: number;
  tableCounts: Record<string, number>;
  errors: string[];
}

/**
 * Verify all tables exist and are accessible after a migration.
 * Call this at app startup to detect migration corruption early.
 */
export async function checkMigrationHealth(
  db: NexusDatabase = nexusDb,
): Promise<MigrationHealthResult> {
  const errors: string[] = [];
  const tableCounts: Record<string, number> = {};
  const expectedTables = Object.keys(LATEST_STORES);

  for (const tableName of expectedTables) {
    try {
      const table = db.table(tableName);
      tableCounts[tableName] = await table.count();
    } catch (e) {
      errors.push(
        `Table "${tableName}" inaccessible: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const currentVersion = db.verno;
  return {
    ok: errors.length === 0 && currentVersion === DB_CURRENT_VERSION,
    currentVersion,
    expectedVersion: DB_CURRENT_VERSION,
    tableCounts,
    errors,
  };
}

export interface DatabaseBackup {
  version: number;
  timestamp: number;
  tables: Record<string, unknown[]>;
}

/**
 * Export all database tables as a JSON-serialisable object.
 * Useful for pre-migration backup or diagnostics.
 */
export async function exportDatabaseBackup(db: NexusDatabase = nexusDb): Promise<DatabaseBackup> {
  const tables: Record<string, unknown[]> = {};
  for (const tableName of Object.keys(LATEST_STORES)) {
    try {
      tables[tableName] = await db.table(tableName).toArray();
    } catch {
      tables[tableName] = [];
    }
  }
  return {
    version: db.verno,
    timestamp: Date.now(),
    tables,
  };
}

/**
 * Restore database from a backup object (e.g. after failed migration).
 * Clears existing data before inserting backup data.
 */
export async function restoreDatabaseBackup(
  backup: DatabaseBackup,
  db: NexusDatabase = nexusDb,
): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = backup.tables[table.name];
      if (rows && rows.length > 0) {
        await table.bulkAdd(rows);
      }
    }
  });
}
