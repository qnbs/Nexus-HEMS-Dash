/**
 * Background Sync Service
 * Handles offline action queue synchronization
 * Features: exponential backoff, max retries, online/offline detection
 */

import {
  getPendingActions,
  updateActionStatus,
  cleanupCompletedActions,
  type OfflineAction,
} from './db';

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 2000;

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
          console.warn('[BackgroundSync] Service Worker sync not available:', error);
          this.startPeriodicSync();
        });
    } else {
      this.startPeriodicSync();
    }

    // Listen for online/offline events
    this.onlineHandler = () => {
      console.log('[BackgroundSync] Network online, syncing...');
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
      this.syncPendingActions();
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

      console.log(`[BackgroundSync] Syncing ${actions.length} pending actions`);

      for (const action of actions) {
        const retryCount = (action as unknown as { retryCount?: number }).retryCount ?? 0;
        if (retryCount >= MAX_RETRIES) {
          console.warn(`[BackgroundSync] Action ${action.id} exceeded max retries, marking failed`);
          await updateActionStatus(action.id!, 'failed', 'Max retries exceeded');
          continue;
        }

        try {
          await updateActionStatus(action.id!, 'syncing');
          await this.executeAction(action);
          await updateActionStatus(action.id!, 'completed');
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `[BackgroundSync] Action ${action.id} failed (attempt ${retryCount + 1}):`,
            errMsg,
          );

          // Exponential backoff retry
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
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
    } catch (error) {
      console.error('[BackgroundSync] Sync failed:', error);
    } finally {
      this.isSyncing = false;
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
   * Execute a specific action
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    const baseUrl = import.meta.env.PROD ? 'https://your-api.example.com' : 'http://localhost:3000';

    switch (action.type) {
      case 'ev-control':
        await fetch(`${baseUrl}/api/ev/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
        break;

      case 'hp-control':
        await fetch(`${baseUrl}/api/heatpump/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
        break;

      case 'battery-control':
        await fetch(`${baseUrl}/api/battery/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
        break;

      case 'settings':
        await fetch(`${baseUrl}/api/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
        break;

      case 'ai-optimize':
        await fetch(`${baseUrl}/api/ai/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
