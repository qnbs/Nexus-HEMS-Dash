# Performance Optimization Plan — Nexus-HEMS-Dash

> **Status:** Active
> **Last Updated:** 2026-04-25
> **Horizon:** Q2–Q3 2026

This document covers all planned and implemented performance optimizations, their rationale,
implementation strategy, and metrics targets.

---

## Performance Baseline (2026-04-25)

| Metric | Current | Target |
|--------|---------|--------|
| `useEnergyStore.mergeData()` latency | unmeasured | <50 ms at 1000 updates/min |
| Ring buffer memory (all adapters) | ~5 MB (1k × 10 adapters) | ~1 MB (adaptive sizing) |
| Dexie 7-day history query | seconds (raw scan) | <200 ms (aggregate) |
| Chart render (1000 data points) | >16 ms (dropped frames) | <16 ms (LTTB sampled) |
| Sankey layout computation | ~80 ms (main thread, old) | ~20 ms (Web Worker) |
| App initial load (Lighthouse) | ≥85 Performance | maintain ≥85 |

---

## P1: Dexie Tiered Downsampling (ADR-005)

**File:** `apps/web/src/lib/downsampling-service.ts`
**Status:** Implemented (Phase 2)
**Gap closed:** G-04

### Problem

Dexie `energyAggregates` table schema exists (v10) but no background service populates it.
7-day history charts scan all ~604 800 raw 1-second snapshots → multi-second query time.

### Solution

Background service started 90 s after app load:

```typescript
export function startDownsamplingService(): void {
  // Delay first run to avoid startup contention
  setTimeout(() => runDownsamplingCycle(), 90_000);

  // Then run every 5 minutes
  const handle = setInterval(() => runDownsamplingCycle(), 5 * 60_000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => clearInterval(handle));
}

async function runDownsamplingCycle(): Promise<void> {
  await downsampleRawTo15m();
  await downsample15mTo1h();
}
```

### Bucket algorithm

```typescript
async function downsampleRawTo15m(): Promise<void> {
  const BUCKET_MS = 15 * 60_000;
  const cutoff = Date.now() - BUCKET_MS; // only process completed buckets

  const raws = await db.energySnapshots
    .where('timestamp')
    .below(cutoff)
    .toArray();

  // Group by bucket
  const buckets = new Map<number, EnergySnapshot[]>();
  for (const snap of raws) {
    const bucket = Math.floor(snap.timestamp / BUCKET_MS) * BUCKET_MS;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(snap);
  }

  // Average and write
  for (const [bucketTs, snaps] of buckets) {
    const existing = await db.energyAggregates
      .where('[resolution+bucketTs]')
      .equals(['15m', bucketTs])
      .first();
    if (existing) continue; // idempotent — skip if already aggregated

    const avg = computeAverage(snaps);
    await db.energyAggregates.put({
      resolution: '15m',
      bucketTs,
      sampleCount: snaps.length,
      ...avg,
    });
  }
}
```

### Performance impact

| Query | Before | After |
|-------|--------|-------|
| 24h chart | ~86 400 rows | ~96 rows (15m) |
| 7-day chart | ~604 800 rows | ~672 rows (15m) |
| 30-day chart | ~2.6M rows | ~720 rows (1h) |

---

## P2: Ring-Buffer Adaptive Sizing (ADR-006)

**File:** `apps/web/src/core/useEnergyStore.ts`
**Status:** Implemented (Phase 2)
**Gap closed:** G-09

### Problem

Fixed 1 000-item ring buffer for all adapter types wastes memory on low-frequency adapters
(KNX emits events, not continuous data) while under-serving high-frequency adapters (OCPP V2X).

### Solution

```typescript
export const RING_BUFFER_SIZES: Record<string, number> = {
  'ocpp-21': 500,
  'victron-mqtt': 200,
  'eebus': 200,
  'modbus-sunspec': 150,
  'knx': 100,
  'homeassistant-mqtt': 200,
  'zigbee2mqtt': 150,
  'shelly-rest': 100,
  'matter-thread': 100,
  'default': 100,
};
```

Memory reduction: **~5 MB → ~1 MB** (80% reduction for 10-adapter setup)

---

## P3: LTTB Chart Downsampling (chart-sampling.ts)

**File:** `apps/web/src/lib/chart-sampling.ts`
**Status:** Implemented (Phase 2)
**Gap closed:** G-10

### Problem

Recharts renders all data points. With 1 000+ points (7-day chart at 15-min resolution), each
frame re-renders ~1 000 SVG path segments → >16 ms per frame → dropped frames on mobile.

### Solution: LTTB Algorithm

Largest-Triangle-Three-Buckets (LTTB) — visually lossless downsampling:
- Preserves visual shape of the time series
- O(n) time, constant memory
- Target: ≤300 points for charts (imperceptible quality loss)

```typescript
export interface DataPoint {
  ts: number;
  [key: string]: number;
}

/**
 * Downsample a time series using the LTTB algorithm.
 * @param data   Input series sorted by ts (ascending)
 * @param threshold   Maximum output points (default: 300)
 */
export function lttbSample<T extends DataPoint>(data: T[], threshold = 300): T[] {
  if (data.length <= threshold) return data;

  const sampled: T[] = [data[0]];
  const bucketSize = (data.length - 2) / (threshold - 2);

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
    const nextBucketStart = bucketEnd;
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length);

    // Average point of next bucket
    let avgX = 0;
    let avgY = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += data[j].ts;
      avgY += data[j].pvPower ?? 0; // primary metric for triangle area
    }
    const count = nextBucketEnd - nextBucketStart;
    avgX /= count;
    avgY /= count;

    // Find point in current bucket with largest triangle area
    let maxArea = -1;
    let maxIdx = bucketStart;
    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (data[a].ts - avgX) * (data[j].pvPower ?? 0 - data[a].pvPower ?? 0) -
          (data[a].ts - data[j].ts) * (avgY - data[a].pvPower ?? 0),
      ) * 0.5;
      if (area > maxArea) { maxArea = area; maxIdx = j; }
    }

    sampled.push(data[maxIdx]);
    a = maxIdx;
  }

  sampled.push(data[data.length - 1]);
  return sampled;
}
```

### Integration points

- `apps/web/src/pages/Analytics.tsx` — history charts
- `apps/web/src/pages/OptimizationAI.tsx` — forecast charts

Apply LTTB when `data.length > 500`:
```typescript
const chartData = data.length > 500 ? lttbSample(data, 300) : data;
```

---

## P4: D3 Sankey Web Worker (Already Implemented)

**Status:** ✅ Already done — `apps/web/src/workers/sankey-worker.ts`

The Sankey layout computation runs in a Comlink-wrapped Web Worker. Main thread only handles
D3 SVG DOM updates. No further optimization needed unless switching to WebGL renderer.

### Optional Future: WebGL Renderer (Identified, Not Planned)

For 50+ flow connections (industrial HEMS with many devices), d3-force + WebGL via `regl` could
provide smoother animation. Not needed for current typical use case (≤15 flows).

---

## P5: REST Polling Adapter Worker

**File:** `apps/web/src/workers/adapter-worker.ts`
**Status:** To verify / create (Phase 2)
**Gap:** G-17 (mentioned in instructions as planned but not confirmed in discovery)

### Problem

REST-polling adapters (e.g., `ShellyRESTAdapter`, `ModbusSunSpecAdapter`) perform HTTP polling
on the main thread. At 1–2 Hz polling of multiple adapters, this blocks React renders.

### Solution

Isolated Web Worker per polling adapter:

```typescript
// adapter-worker.ts — runs in Worker thread
export async function pollEndpoint(
  url: string,
  headers: Record<string, string>,
): Promise<unknown> {
  // SSRF protection: URL validated against allowlist
  assertAllowedUrl(url);
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

SSRF allowlist:
```typescript
const ALLOWED_ORIGINS = new Set([
  'http://localhost',
  'http://192.168.',
  'http://10.',
  'http://172.16.',
  // ... local network ranges only
]);
```

---

## Monitoring & Measurement

### Prometheus Metrics

Performance metrics exposed at `/metrics`:

```
nexus_hems_store_merge_duration_ms   — useEnergyStore.mergeData() latency histogram
nexus_hems_ring_buffer_size          — current ring buffer size per adapter
nexus_hems_dexie_query_duration_ms   — Dexie query latency histogram
nexus_hems_chart_render_duration_ms  — Recharts render duration (client-side via PerformanceObserver)
```

### CI Performance Gate

`perf-benchmark.yml` measures:
- Bundle size (warn if +5%)
- Build time (warn if >120 s)
- Merge latency (must be <50 ms at 1000 updates/min)

---

## Not Planned (Out of Scope)

| Feature | Reason deferred |
|---------|----------------|
| WebGL Sankey renderer | Not needed for current flow count (≤15 flows) |
| react-window for chart virtualization | LTTB sampling sufficient; react-window adds complexity |
| Web Workers for Dexie (Comlink) | IndexedDB runs in background thread already |
| Server-side rendering | SPA pattern fits HEMS dashboard; SSR adds complexity without benefit |
