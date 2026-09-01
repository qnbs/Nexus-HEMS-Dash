/**
 * Background Sync Service
 * Handles offline action queue synchronization
 * Features: exponential backoff, max retries, online/offline detection
 */

import { getAuthHeader, isAuthTokenValid } from './auth-token';
import {
  cleanupCompletedActions,
  getPendingActions,
  type OfflineAction,
  updateActionStatus,
} from './db';
import { detectSyncConflict, fetchServerSyncVersion, recordServerSyncVersion } from './sync-client';
import { markSyncConflict } from './sync-conflict';

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 2000;
/** Hardware control commands older than this are never replayed (offline-sync design §4.1). */
export const OFFLINE_HARDWARE_COMMAND_TTL_MS = 5 * 60 * 1000;

const HARDWARE_COMMAND_TYPES = new Set<OfflineAction['type']>([
  'ev-control',
  'hp-control',
  'battery-control',
]);

function isHardwareCommand(type: OfflineAction['type']): boolean {
  return HARDWARE_COMMAND_TYPES.has(type);
}

function isCommandExpired(action: OfflineAction): boolean {
  return (
    isHardwareCommand(action.type) &&
    Date.now() - action.timestamp > OFFLINE_HARDWARE_COMMAND_TTL_MS
  );
}

function getActionRetryCount(action: OfflineAction): number {
  return (action as unknown as { retryCount?: number }).retryCount ?? 0;
}

class BackgroundSyncService {
  private isSyncing = false;
  private syncInterval: number | null = null;
  private retryTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
  private onlineHandler: (() => void) | null = null;

  /**
   * Initialize background sync
   */
  init() {
    // Register service worker sync if available
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready
        .then((registration) => {
          return registration.sync.register('sync-offline-actions');
        })
        .catch((error) => {
          if (import.meta.env.DEV)
            console.warn('[BackgroundSync] Service Worker sync not available:', error);
          this.startPeriodicSync();
        });
    } else {
      this.startPeriodicSync();
    }

    // Listen for online/offline events
    this.onlineHandler = () => {
      if (import.meta.env.DEV) console.log('[BackgroundSync] Network online, syncing...');
      void this.probeSyncConflict();
      this.syncPendingActions();
    };
    window.addEventListener('online', this.onlineHandler);

    // Cleanup old completed actions every hour
    setInterval(
      () => {
        cleanupCompletedActions().catch(console.error);
      },
      60 * 60 * 1000,
    );

    // Initial sync if online
    if (navigator.onLine) {
      void this.probeSyncConflict();
      this.syncPendingActions();
    }
  }

  /** Detect server-side version drift even when the offline queue is empty. */
  private async probeSyncConflict(): Promise<void> {
    if (!navigator.onLine || !isAuthTokenValid()) return;
    const hasConflict = await detectSyncConflict();
    if (hasConflict) {
      await markSyncConflict('settings');
    }
  }

  /**
   * Start periodic sync (fallback)
   */
  private startPeriodicSync() {
    this.syncInterval = window.setInterval(
      () => {
        if (navigator.onLine) {
          this.syncPendingActions();
        }
      },
      3 * 60 * 1000, // Every 3 minutes
    );
  }

  /**
   * Sync all pending actions with retry support
   */
  async syncPendingActions(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;

    try {
      const actions = await getPendingActions();
      if (actions.length === 0) return;

      if (!this.ensureAuthForReplay()) return;

      const hasConflict = await this.checkAndLogConflict();
      if (hasConflict) {
        await this.recordLatestServerVersion(true);
        return;
      }

      if (import.meta.env.DEV) {
        console.log(`[BackgroundSync] Syncing ${actions.length} pending actions`);
      }

      for (const action of actions) {
        await this.processPendingAction(action);
      }

      await this.recordLatestServerVersion(hasConflict);
    } catch (error) {
      console.error('[BackgroundSync] Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private ensureAuthForReplay(): boolean {
    if (isAuthTokenValid()) return true;
    if (import.meta.env.DEV) {
      console.warn('[BackgroundSync] Auth token missing or expired — skipping replay');
    }
    return false;
  }

  private async checkAndLogConflict(): Promise<boolean> {
    const hasConflict = await detectSyncConflict();
    if (hasConflict) {
      await markSyncConflict('settings');
      if (import.meta.env.DEV) {
        console.warn(
          '[BackgroundSync] Server sync version advanced — conflict reconciliation deferred',
        );
      }
    }
    return hasConflict;
  }

  private async recordLatestServerVersion(hasConflict: boolean): Promise<void> {
    const serverVersion = await fetchServerSyncVersion();
    if (serverVersion !== null) {
      await recordServerSyncVersion(serverVersion, 'settings', hasConflict);
    }
  }

  private async processPendingAction(action: OfflineAction): Promise<void> {
    if (isCommandExpired(action)) {
      await updateActionStatus(action.id!, 'failed', 'Command expired (TTL exceeded)');
      return;
    }

    const retryCount = getActionRetryCount(action);
    if (retryCount >= MAX_RETRIES) {
      if (import.meta.env.DEV) {
        console.warn(`[BackgroundSync] Action ${action.id} exceeded max retries, marking failed`);
      }
      await updateActionStatus(action.id!, 'failed', 'Max retries exceeded');
      return;
    }

    try {
      await updateActionStatus(action.id!, 'syncing');
      await this.executeAction(action);
      await updateActionStatus(action.id!, 'completed');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        '[BackgroundSync] Action',
        action.id,
        'failed (attempt',
        retryCount + 1,
        '):',
        errMsg,
      );

      const delay = BASE_RETRY_DELAY_MS * 2 ** retryCount + Math.floor(Math.random() * 1000);
      await updateActionStatus(action.id!, 'failed', errMsg);

      if (retryCount + 1 < MAX_RETRIES) {
        const timeout = setTimeout(() => {
          this.retryTimeouts.delete(action.id!);
          this.syncPendingActions();
        }, delay);
        this.retryTimeouts.set(action.id!, timeout);
      }
    }
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus(): Promise<{
    pendingCount: number;
    isSyncing: boolean;
    isOnline: boolean;
  }> {
    const actions = await getPendingActions();
    return {
      pendingCount: actions.length,
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
    };
  }

  /**
   * Execute a specific action.
   * HIGH-05: All requests include Authorization header. Actions are rejected if
   * no auth token is available — never dispatch control commands unauthenticated.
   * X-Idempotency-Key is sent on every retry so the server can deduplicate
   * duplicate deliveries caused by network failures or background-sync retries.
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const authHeaders = getAuthHeader();

    if (!authHeaders) {
      throw new Error('No auth token available — cannot sync action. User must be authenticated.');
    }

    const idempotencyKey = (action as unknown as { idempotencyKey?: string }).idempotencyKey;
    const idempotencyHeader: Record<string, string> = idempotencyKey
      ? { 'X-Idempotency-Key': idempotencyKey }
      : {};

    const commonHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...idempotencyHeader,
    };

    switch (action.type) {
      case 'ev-control':
        await fetch(`${baseUrl}/api/ev/control`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(action.payload),
        });
        break;

      case 'hp-control':
        await fetch(`${baseUrl}/api/heatpump/control`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(action.payload),
        });
        break;

      case 'battery-control':
        await fetch(`${baseUrl}/api/battery/control`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(action.payload),
        });
        break;

      case 'settings':
        await fetch(`${baseUrl}/api/settings`, {
          method: 'PUT',
          headers: commonHeaders,
          body: JSON.stringify(action.payload),
        });
        break;

      case 'ai-optimize':
        await fetch(`${baseUrl}/api/ai/optimize`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(action.payload),
        });
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.isSyncing = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    // Clear all pending retry timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
  }
}

export const backgroundSyncService = new BackgroundSyncService();
