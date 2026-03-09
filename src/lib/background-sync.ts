/**
 * Background Sync Service
 * Handles offline action queue synchronization
 */

import {
  getPendingActions,
  updateActionStatus,
  cleanupCompletedActions,
  type OfflineAction,
} from './db';

class BackgroundSyncService {
  private isSyncing = false;
  private syncInterval: number | null = null;

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
          // Fallback to periodic sync
          this.startPeriodicSync();
        });
    } else {
      // Fallback to periodic sync
      this.startPeriodicSync();
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[BackgroundSync] Network online, syncing...');
      this.syncPendingActions();
    });

    // Cleanup old completed actions every hour
    setInterval(
      () => {
        cleanupCompletedActions().catch(console.error);
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Start periodic sync (fallback)
   */
  private startPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = window.setInterval(
      () => {
        if (navigator.onLine) {
          this.syncPendingActions();
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;

    try {
      const actions = await getPendingActions();
      console.log(`[BackgroundSync] Syncing ${actions.length} pending actions`);

      for (const action of actions) {
        try {
          await updateActionStatus(action.id!, 'syncing');
          await this.executeAction(action);
          await updateActionStatus(action.id!, 'completed');
        } catch (error) {
          console.error('[BackgroundSync] Action failed:', error);
          await updateActionStatus(
            action.id!,
            'failed',
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      }
    } catch (error) {
      console.error('[BackgroundSync] Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
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
    window.removeEventListener('online', this.syncPendingActions);
  }
}

export const backgroundSyncService = new BackgroundSyncService();
