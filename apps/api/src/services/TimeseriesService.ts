/**
 * TimeseriesService — Writes UnifiedEnergyDatapoint batches to InfluxDB v2.
 *
 * Features:
 *  - Subscribes to the EventBus for all adapter batches
 *  - Converts UnifiedEnergyDatapoint → InfluxDB Points
 *  - WAL (Write-Ahead Log) when InfluxDB writes fail or client is unavailable
 *  - Recovery on startup: replays WAL to InfluxDB with retries; **never** treats WAL append as remote success
 */

import {
  appendFileSync,
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InfluxDB, Point, type WriteApi } from '@influxdata/influxdb-client';
import type { EventBusSubscriber, UnifiedEnergyDatapoint } from '@nexus-hems/shared-types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WAL_BATCH_SIZE = 200;
const MAX_RETRY_ATTEMPTS = 5;

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

/** Result of attempting a remote Influx write + flush. */
export type InfluxFlushResult = 'flushed' | 'remote_failed';

export interface TimeseriesServiceDeps {
  /** Override data directory (default: env NEXUS_HEMS_DATA_DIR or apps/api/data). */
  dataDir?: string;
  /** Inject a WriteApi (e.g. mock) for tests; when set, skips real InfluxDB client construction. */
  writeApi?: WriteApi | null;
  /** When not using injected writeApi, set false to start in WAL-only mode without connecting. */
  connectInflux?: boolean;
  /** Per-batch retry count during `recoverWAL` only (default: MAX_RETRY_ATTEMPTS). */
  maxWalRecoveryAttempts?: number;
}

export class TimeseriesService implements EventBusSubscriber {
  private readonly writeApi: WriteApi | null;
  private influxConnected = false;
  private readonly dataDir: string;
  private readonly walPath: string;
  private readonly maxWalRecoveryAttempts: number;

  constructor(deps?: TimeseriesServiceDeps) {
    this.dataDir = deps?.dataDir ?? getEnv('NEXUS_HEMS_DATA_DIR', join(__dirname, '../../data'));
    this.walPath = join(this.dataDir, 'wal.ndjson');
    this.maxWalRecoveryAttempts = deps?.maxWalRecoveryAttempts ?? MAX_RETRY_ATTEMPTS;

    if (deps?.writeApi !== undefined) {
      this.writeApi = deps.writeApi;
      this.influxConnected = deps.writeApi !== null;
      return;
    }

    const url = getEnv('INFLUXDB_URL', 'http://influxdb:8086');
    const token = getEnv('INFLUXDB_TOKEN', 'nexus-hems-influx-token');
    const org = getEnv('INFLUXDB_ORG', 'nexus-hems');
    const bucket = getEnv('INFLUXDB_BUCKET', 'nexus-hems');
    const shouldConnect = deps?.connectInflux !== false;

    if (!shouldConnect) {
      this.writeApi = null;
      this.influxConnected = false;
      return;
    }

    try {
      const client = new InfluxDB({ url, token });
      this.writeApi = client.getWriteApi(org, bucket, 'ms');
      this.influxConnected = true;
    } catch (err) {
      console.warn('[TimeseriesService] InfluxDB init failed — WAL mode only:', err);
      this.writeApi = null;
    }
  }

  /** Called by EventBus on each flush cycle. */
  async onBatch(datapoints: UnifiedEnergyDatapoint[]): Promise<void> {
    if (datapoints.length === 0) return;

    if (this.writeApi && this.influxConnected) {
      const result = await this.tryFlushToInflux(datapoints);
      if (result === 'flushed') {
        return;
      }
      console.error('[TimeseriesService] InfluxDB write error — falling back to WAL');
      this.influxConnected = false;
      await this.writeToWAL(datapoints);
    } else {
      await this.writeToWAL(datapoints);
    }
  }

  /**
   * Replay WAL to InfluxDB. Uses a **rename-then-replay** pattern so concurrent
   * `onBatch` WAL appends go to a fresh file. Never calls `onBatch`; never counts
   * WAL staging as successful remote persistence.
   */
  async recoverWAL(): Promise<void> {
    if (!this.writeApi) {
      console.warn('[TimeseriesService] WAL recovery skipped — no WriteApi');
      return;
    }

    if (!existsSync(this.walPath)) return;

    const recoveringPath = `${this.walPath}.recovering`;
    try {
      renameSync(this.walPath, recoveringPath);
    } catch (err) {
      console.warn('[TimeseriesService] WAL rename for recovery failed:', err);
      return;
    }

    const raw = readFileSync(recoveringPath, 'utf8').trim();
    if (!raw) {
      try {
        unlinkSync(recoveringPath);
      } catch {
        // ignore
      }
      return;
    }

    const lines = raw.split('\n').filter(Boolean);
    console.log(`[TimeseriesService] Recovering ${lines.length} WAL entries…`);

    const parsed: UnifiedEnergyDatapoint[] = [];
    for (const line of lines) {
      try {
        parsed.push(JSON.parse(line) as UnifiedEnergyDatapoint);
      } catch {
        // Skip corrupt WAL lines
      }
    }

    if (parsed.length === 0) {
      try {
        unlinkSync(recoveringPath);
      } catch {
        // ignore
      }
      return;
    }

    for (let start = 0; start < parsed.length; start += WAL_BATCH_SIZE) {
      const batch = parsed.slice(start, start + WAL_BATCH_SIZE);
      let attempt = 0;
      let flushed = false;

      while (attempt < this.maxWalRecoveryAttempts && !flushed) {
        flushed = (await this.tryFlushToInflux(batch)) === 'flushed';
        if (flushed) break;
        const delayMs = Math.min(1000 * 2 ** attempt, 30_000);
        await new Promise((r) => setTimeout(r, delayMs));
        attempt++;
      }

      if (!flushed) {
        const remaining = parsed.slice(start);
        await this.writePointsToRecoveringBackup(remaining);
        const failedPath = `${this.walPath}.failed-${Date.now()}`;
        try {
          renameSync(recoveringPath, failedPath);
        } catch (err) {
          console.error('[TimeseriesService] Could not move failed recovery WAL:', err);
        }
        console.error(
          `[TimeseriesService] WAL recovery failed after retries — ${remaining.length} row(s) re-staged to WAL; snapshot at ${failedPath}`,
        );
        return;
      }
    }

    try {
      unlinkSync(recoveringPath);
    } catch {
      // ignore
    }
    this.influxConnected = true;
    console.log('[TimeseriesService] WAL recovery complete.');
  }

  /** Bytes of primary WAL file if present (for health metrics). */
  getWalBacklogBytes(): number {
    try {
      return statSync(this.walPath).size;
    } catch {
      return 0;
    }
  }

  /** Graceful shutdown. */
  async destroy(): Promise<void> {
    if (this.writeApi) {
      try {
        await this.writeApi.close();
      } catch {
        // ignore close errors
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Flush datapoints to Influx only. Does not write WAL on failure.
   */
  private async tryFlushToInflux(datapoints: UnifiedEnergyDatapoint[]): Promise<InfluxFlushResult> {
    if (!this.writeApi || datapoints.length === 0) return 'remote_failed';
    try {
      for (const dp of datapoints) {
        const point = new Point(dp.metric)
          .tag('device_id', dp.deviceId)
          .tag('protocol', dp.protocol)
          .tag('quality', dp.qualityIndicator)
          .floatField('value', dp.value)
          .timestamp(dp.timestamp);
        this.writeApi.writePoint(point);
      }
      await this.writeApi.flush();
      return 'flushed';
    } catch (err) {
      console.error('[TimeseriesService] Influx flush error:', err);
      return 'remote_failed';
    }
  }

  private async writeToWAL(datapoints: UnifiedEnergyDatapoint[]): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const lines = `${datapoints.map((dp) => JSON.stringify(dp)).join('\n')}\n`;
    appendFileSync(this.walPath, lines, 'utf8');
  }

  /** Re-stage remaining points to live WAL after failed recovery (best-effort). */
  private async writePointsToRecoveringBackup(datapoints: UnifiedEnergyDatapoint[]): Promise<void> {
    if (datapoints.length === 0) return;
    await this.writeToWAL(datapoints);
  }
}
