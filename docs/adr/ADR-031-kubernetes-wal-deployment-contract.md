# ADR-031: Kubernetes WAL Deployment Contract

- **Status:** Accepted
- **Date:** 2026-11-09
- **Deciders:** @qnbs
- **Related:** #452, #447, ADR-030, DATA-18

## Context

The API `TimeseriesService` persists a local NDJSON WAL under `NEXUS_HEMS_DATA_DIR` when InfluxDB
is unavailable. Default Helm values mount an `emptyDir` at `/data/nexus-hems` — WAL survives
process restarts inside the pod but **not** pod reschedules. Optional `server.walPersistence`
provisions a PVC for cross-restart snapshot retention.

Helm previously required `walPersistence.enabled` when `replicaCount.server > 1`, which implied
a **single ReadWriteOnce PVC shared across replicas** — unsafe and operationally invalid on most
clusters.

## Decision

### Deployment profiles

| Profile | `replicaCount.server` | `walPersistence` | `redisUrl` | WAL durability |
|--------|----------------------|-------------------|------------|----------------|
| Dev / mock (chart default) | 1 | `false` (emptyDir) | optional | Pod lifetime |
| Edge live (single writer) | 1 | `true` (PVC) | recommended | Survives pod restart on same volume |
| API HA (no shared WAL) | >1 | **must be `false`** | **required** | Per-pod emptyDir only |

### Helm guards

1. `replicaCount.server > 1` → `server.redisUrl` required (ADR-030 offline sync).
2. `replicaCount.server > 1` **and** `walPersistence.enabled` → `helm template` **fails** (RWO
   cannot be safely shared; no multi-writer claim).
3. `walPersistence.enabled` → `existingClaim` or `create: true` required.

### Health / observability

`/api/health` exposes `walStorageClass` (`ephemeral` | `pvc`) and an ephemeral durability notice.
This does **not** certify power-loss fsync guarantees (see `TimeseriesService` header).

### Out of scope (follow-up)

- StatefulSet-per-pod WAL PVCs or leader-elected single writer with Redis/lease fencing.
- Cross-node RWO attachment during rolling updates (`maxSurge: 1` overlap still needs ops runbook).

## Consequences

- Operators enable PVC only with **one** server replica, or accept ephemeral WAL per pod when
  running HA API pods.
- CI runs `scripts/verify-helm-wal-contract.mjs` beside existing Helm lint/template gates.
