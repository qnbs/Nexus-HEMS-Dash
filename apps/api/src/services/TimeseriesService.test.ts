import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WriteApi } from '@influxdata/influxdb-client';
import type { UnifiedEnergyDatapoint } from '@nexus-hems/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeseriesService } from './TimeseriesService.js';

function samplePoint(n: number): UnifiedEnergyDatapoint {
  return {
    timestamp: 1_700_000_000_000 + n,
    deviceId: 'dev-1',
    protocol: 'mqtt',
    metric: 'power',
    value: n,
    qualityIndicator: 'GOOD',
  };
}

describe('TimeseriesService WAL recovery', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try {
        rmSync(d, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    dirs.length = 0;
  });

  it('does not delete WAL until recovery flush succeeds', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-ok-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const writePoint = vi.fn();
    let flushCalls = 0;
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {
        flushCalls += 1;
        if (flushCalls === 1) {
          throw new Error('influx down');
        }
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.onBatch([samplePoint(1)]);

    expect(flushCalls).toBe(1);
    expect(existsSync(walPath)).toBe(true);

    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalled();
    expect(flushCalls).toBeGreaterThanOrEqual(2);
    expect(existsSync(walPath)).toBe(false);
    expect(existsSync(`${walPath}.recovering`)).toBe(false);

    await svc.destroy();
  });

  it('on recovery failure, moves snapshot aside and re-stages rows to WAL', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.onBatch([samplePoint(1), samplePoint(2)]);

    await svc.recoverWAL();

    const failedSnap = readdirSync(dataDir).find((f) => f.startsWith('wal.ndjson.failed-'));
    expect(failedSnap).toBeTruthy();
    expect(existsSync(walPath)).toBe(true);
    const restaged = readFileSync(walPath, 'utf8').trim().split('\n').filter(Boolean);
    expect(restaged.length).toBe(2);

    await svc.destroy();
  });
});
