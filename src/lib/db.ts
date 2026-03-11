import Dexie, { type Table } from 'dexie';

import type { EnergyData, StoredSettings } from '../types';

export interface EnergySnapshot extends EnergyData {
  id?: number;
  timestamp: number;
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

class NexusDatabase extends Dexie {
  energySnapshots!: Table<EnergySnapshot, number>;
  sankeySnapshots!: Table<SankeySnapshot, number>;
  offlineActions!: Table<OfflineAction, number>;
  cacheMetadata!: Table<CacheMetadata, string>;
  errorLogs!: Table<ErrorLog, number>;
  settings!: Table<SettingsRecord, string>;
  aiKeys!: Table<AIKeyRecord, string>;

  constructor() {
    super('nexus-hems-dash');

    // Version 1: Original schema
    this.version(1).stores({
      energySnapshots: '++id, timestamp',
      settings: 'key',
    });

    // Version 2: Add advanced PWA features
    this.version(2).stores({
      energySnapshots: '++id, timestamp',
      sankeySnapshots: '++id, timestamp',
      offlineActions: '++id, timestamp, status, type',
      cacheMetadata: 'key, timestamp, expiresAt, type',
      errorLogs: '++id, timestamp, severity',
      settings: 'key',
    });

    // Version 3: Add encrypted AI key storage (BYOK)
    this.version(3).stores({
      energySnapshots: '++id, timestamp',
      sankeySnapshots: '++id, timestamp',
      offlineActions: '++id, timestamp, status, type',
      cacheMetadata: 'key, timestamp, expiresAt, type',
      errorLogs: '++id, timestamp, severity',
      settings: 'key',
      aiKeys: 'provider',
    });
  }
}

export const nexusDb = new NexusDatabase();

/**
 * Persist energy snapshot with automatic cleanup
 */
export async function persistSnapshot(snapshot: EnergyData) {
  await nexusDb.energySnapshots.add({ ...snapshot, timestamp: Date.now() });

  const count = await nexusDb.energySnapshots.count();
  if (count > 1000) {
    const oldest = await nexusDb.energySnapshots
      .orderBy('timestamp')
      .limit(count - 1000)
      .primaryKeys();
    await nexusDb.energySnapshots.bulkDelete(oldest);
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
  const byType = metadata.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

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
 * Log error for diagnostics
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

  // Keep only last 100 errors
  const count = await nexusDb.errorLogs.count();
  if (count > 100) {
    const oldest = await nexusDb.errorLogs
      .orderBy('timestamp')
      .limit(count - 100)
      .primaryKeys();
    await nexusDb.errorLogs.bulkDelete(oldest);
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
  ]);
}
