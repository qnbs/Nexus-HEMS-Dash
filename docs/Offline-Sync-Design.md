# Offline Sync Design — Nexus-HEMS-Dash

> **Status:** Active — Implementation roadmap through v1.2.0
> **Created:** 2026-04-25
> **Owner:** @qnbs

This document describes the offline-first synchronization architecture, conflict resolution strategy,
and replay safety mechanisms for Nexus-HEMS-Dash.

---

## 1. Current State

`apps/web/src/lib/offline-cache.ts` — Dexie v3 schema, 4 tables:
- `energySnapshots` — last 1000 energy data points (auto-trimmed)
- `sankeySnapshots` — last Sankey layout
- `tariffData` — cached price arrays (provider + TTL)
- `userPreferences` — key/value pairs

`apps/web/src/lib/background-sync.ts` — Action queue with:
- Exponential backoff (2s → 30s cap, 5 retries)
- Service Worker background sync registration
- `HIGH-05` fix: Auth header on every fetch
- Online/offline event listeners

**Known Gaps (v1.1.x):**
| Gap | Impact |
|-----|--------|
| No `lastSyncVersion` tracking | Lost-update bug if server state changes while client offline |
| No conflict detection | Optimistic updates may overwrite newer server state |
| Failed actions never auto-recovered (marked `failed`, no escalation) | Manual UI intervention required |
| No idempotency keys on commands | Duplicate execution possible on network retry |
| No server-wins reconciliation for config changes | Settings divergence after reconnect |

---

## 2. Conflict Resolution Strategy

**Chosen model: Tiered by data type**

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| Hardware commands (EV, battery, heat pump) | Server-wins + idempotency key | Safety-critical; server validates physical constraints |
| User settings/preferences | Last-write-wins (client timestamp) | Non-safety, user intent should prevail |
| Tariff cache | Always discard local on reconnect | Server is source of truth for pricing |
| Energy snapshots (read-only) | Append-only; no conflict possible | Historical data, never mutated |

---

## 3. Implementation: `lastSyncVersion`

### 3.1 Schema Extension (offline-cache.ts)

Add `lastSyncVersion` to `CachedUserPreferences` and a new `syncState` table:

```typescript
export interface SyncState {
  id?: number;
  key: 'global';
  serverVersion: number;   // monotonic server counter / server timestamp
  clientSyncedAt: number;  // wall-clock milliseconds
  conflictsDetected: number;
  conflictsResolved: number;
}
```

Dexie schema v4 migration:

```typescript
this.version(4).stores({
  energySnapshots: '++id, timestamp, createdAt',
  sankeySnapshots: '++id, timestamp, createdAt',
  tariffData: '++id, provider, timestamp, expiresAt',
  userPreferences: '++id, &key, updatedAt',
  syncState: '++id, &key',            // ← new
}).upgrade(async (trans) => {
  // Seed initial syncState record
  await trans.table('syncState').add({
    key: 'global',
    serverVersion: 0,
    clientSyncedAt: 0,
    conflictsDetected: 0,
    conflictsResolved: 0,
  });
});
```

### 3.2 Background Sync: Idempotency Keys

Every action dispatched to the queue receives a UUID `idempotencyKey`:

```typescript
export interface OfflineAction {
  id?: number;
  type: string;
  payload: string;           // JSON
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  idempotencyKey: string;    // ← new: crypto.randomUUID() on action creation
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
}
```

The server checks `X-Idempotency-Key` header and returns `200 OK` with cached result for
duplicate requests within 5 minutes — preventing double execution on retry.

### 3.3 Conflict Detection

On reconnect, the sync service fetches the server's current `syncVersion`:

```typescript
async checkServerVersion(): Promise<number> {
  const resp = await fetch('/api/sync/version', { headers: this.getAuthHeader() ?? {} });
  if (!resp.ok) return -1;
  const { version } = await resp.json() as { version: number };
  return version;
}

async detectConflicts(): Promise<boolean> {
  const state = await db.syncState.where('key').equals('global').first();
  const serverVersion = await this.checkServerVersion();
  if (serverVersion < 0) return false; // cannot determine
  return serverVersion > (state?.serverVersion ?? 0);
}
```

### 3.4 Reconciliation Protocol

```
Client reconnects → fetch serverVersion
├─ serverVersion > localSyncedVersion?
│   ├─ YES → Conflict path:
│   │   ├─ Fetch diff from /api/sync/diff?since=<localSyncedVersion>
│   │   ├─ For each changed key in diff:
│   │   │   ├─ userPreferences → compare client.updatedAt vs server.updatedAt
│   │   │   │   ├─ client newer → push to server (Last-Write-Wins)
│   │   │   │   └─ server newer → overwrite local (Server-Wins)
│   │   │   └─ deviceSettings → Server-Wins always
│   │   └─ Update localSyncVersion = serverVersion, increment conflictsDetected
│   └─ NO → No conflict, proceed with action replay
├─ Replay pending actions (with idempotency keys)
└─ Update clientSyncedAt
```

---

## 4. Replay Safety

### 4.1 Command Re-execution Prevention

Hardware commands in the offline queue are tagged as `oneshot = true`:
- Once a command reaches `completed` or after TTL expiry (default: 5 minutes), it is **never** replayed
- The `idempotencyKey` on `X-Idempotency-Key` header provides server-side deduplication
- Commands older than 5 minutes are auto-expired (not retried) with status `expired`

### 4.2 Auth Token Liveness

Before replaying any action, background sync checks if the stored token is still valid
(expiry check from JWT payload). Expired token → prompt user to re-authenticate before sync.

```typescript
private isTokenValid(): boolean {
  const token = localStorage.getItem('nexus-hems-auth-token');
  if (!token) return false;
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    return !!payload.exp && payload.exp * 1000 > Date.now() + 30_000; // 30s buffer
  } catch {
    return false;
  }
}
```

---

## 5. User-Facing Conflict UI

When conflicts are detected and cannot be auto-resolved:

1. `OfflineBanner` shows "X Änderungen konnten nicht synchronisiert werden" with a `Details` link
2. Conflict modal shows:
   - Local value (with timestamp)
   - Server value (with timestamp)
   - Two buttons: "Meine Version behalten" / "Server-Version übernehmen"
3. Unresolved conflicts are tracked in `syncState.conflictsDetected`

i18n keys needed:
- `offline.conflictsDetected` → "{{ count }} Sync-Konflikte erkannt"
- `offline.viewConflicts` → "Details anzeigen"
- `offline.keepLocal` → "Meine Version behalten"
- `offline.acceptServer` → "Server-Version übernehmen"

---

## 6. Implementation Roadmap

| Item | Phase | Effort | Status |
|------|-------|--------|--------|
| `SyncState` Dexie table (schema v4) | 2 | 1h | 🔲 Planned |
| `idempotencyKey` on OfflineAction | 2 | 30min | 🔲 Planned |
| `X-Idempotency-Key` header in `executeAction()` | 2 | 30min | 🔲 Planned |
| `isTokenValid()` pre-replay check | 2 | 30min | 🔲 Planned |
| Server `/api/sync/version` endpoint | 2 | 1h | 🔲 Planned |
| Conflict detection + reconciliation | 2 | 3h | 🔲 Planned |
| Command TTL expiry (5min oneshot) | 2 | 1h | 🔲 Planned |
| Conflict UI modal + i18n keys | 2 | 2h | 🔲 Planned |
| Playwright E2E: offline conflict scenario | 2 | 2h | 🔲 Planned |
| Vitest: reconciliation logic unit tests | 2 | 1h | 🔲 Planned |

**Total estimated effort: ~12h** — can be parallelised across sync-backend (server-side) and
sync-frontend (Dexie + background-sync) tracks.

---

## 7. Further Considerations

1. **CRDTs**: For future multi-user/multi-device use (ADR-009), consider Yjs or Automerge
   for richer CRDT-based conflict resolution instead of Last-Write-Wins.
2. **IndexedDB storage limits**: On mobile (~50MB origin quota), implement aggressive `energySnapshots`
   trimming at 500 entries instead of 1000 when `navigator.storage.estimate()` reports <20MB free.
3. **Encryption at rest**: `userPreferences` in offline-cache are unencrypted. For sensitive
   settings (device IPs, credentials), route through the AES-GCM vault in `secure-store.ts`.
4. **PWA background sync API**: Service Worker background sync fires when app is in background.
   Ensure idempotency keys prevent double-execution when foreground sync and SW sync race.
