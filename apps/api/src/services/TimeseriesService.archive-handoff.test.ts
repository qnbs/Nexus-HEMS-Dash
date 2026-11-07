/**
 * DATA-18: failure-atomic WAL archive handoff — injectable `node:fs` shims (ESM cannot vi.spyOn fs exports).
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WriteApi } from '@influxdata/influxdb-client';
import type { UnifiedEnergyDatapoint } from '@nexus-hems/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CopyFn = typeof import('node:fs').copyFileSync;
type WriteFn = typeof import('node:fs').writeFileSync;
type UnlinkFn = typeof import('node:fs').unlinkSync;

const fsFault = vi.hoisted(() => ({
  copyFileSync: null as null | CopyFn,
  writeFileSync: null as null | WriteFn,
  unlinkSync: null as null | UnlinkFn,
}));

const fsActual = vi.hoisted(() => ({
  copyFileSync: null as null | CopyFn,
  writeFileSync: null as null | WriteFn,
  unlinkSync: null as null | UnlinkFn,
  readFileSync: null as null | typeof import('node:fs').readFileSync,
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  fsActual.copyFileSync = actual.copyFileSync;
  fsActual.writeFileSync = actual.writeFileSync;
  fsActual.unlinkSync = actual.unlinkSync;
  fsActual.readFileSync = actual.readFileSync;
  return {
    ...actual,
    copyFileSync: ((...args: Parameters<CopyFn>) => {
      if (fsFault.copyFileSync) return fsFault.copyFileSync(...args);
      return actual.copyFileSync(...args);
    }) as CopyFn,
    writeFileSync: ((...args: Parameters<WriteFn>) => {
      if (fsFault.writeFileSync) return fsFault.writeFileSync(...args);
      return actual.writeFileSync(...args);
    }) as WriteFn,
    unlinkSync: ((...args: Parameters<UnlinkFn>) => {
      if (fsFault.unlinkSync) return fsFault.unlinkSync(...args);
      return actual.unlinkSync(...args);
    }) as UnlinkFn,
  };
});

import { TimeseriesService } from './TimeseriesService.js';

function samplePoint(n: number): UnifiedEnergyDatapoint {
  return {
    timestamp: 1_700_000_000_000 + n,
    deviceId: 'dev-1',
    protocol: 'victron-mqtt',
    metric: 'POWER_W',
    value: n,
    qualityIndicator: 'GOOD',
  };
}

describe('TimeseriesService failed recovery archive handoff (DATA-18)', () => {
  const dirs: string[] = [];

  beforeEach(() => {
    fsFault.copyFileSync = null;
    fsFault.writeFileSync = null;
    fsFault.unlinkSync = null;
  });

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

  it('preserves recovering snapshot when staging copy throws (ENOSPC-like)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-copy-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const payload = [samplePoint(11), samplePoint(12)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(recoveringPath, `${payload}\n`, 'utf8');
    const before = readFileSync(recoveringPath, 'utf8');

    fsFault.copyFileSync = (src, dest) => {
      if (String(dest).endsWith('.staging')) {
        throw Object.assign(new Error('no space left on device'), { code: 'ENOSPC' });
      }
      return fsActual.copyFileSync!(src, dest);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(recoveringPath)).toBe(true);
    expect(readFileSync(recoveringPath, 'utf8')).toBe(before);
    expect(readdirSync(dataDir).some((f) => /^wal\.ndjson\.failed-\d+$/.test(f))).toBe(false);
    expect(readdirSync(dataDir).some((f) => f.includes('.staging'))).toBe(false);

    await svc.destroy();
  });

  it('does not treat partial staging bytes as authoritative when copy aborts', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-partial-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const payload = [samplePoint(21), samplePoint(22)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(recoveringPath, `${payload}\n`, 'utf8');
    const before = readFileSync(recoveringPath, 'utf8');

    fsFault.copyFileSync = (src, dest) => {
      if (String(dest).endsWith('.staging')) {
        const buf = fsActual.readFileSync!(src);
        fsActual.writeFileSync!(dest, buf.subarray(0, Math.max(1, Math.floor(buf.length / 2))));
        throw new Error('partial copy IO error');
      }
      return fsActual.copyFileSync!(src, dest);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(recoveringPath)).toBe(true);
    expect(readFileSync(recoveringPath, 'utf8')).toBe(before);
    expect(readdirSync(dataDir).some((f) => /^wal\.ndjson\.failed-\d+$/.test(f))).toBe(false);

    await svc.destroy();
  });

  it('preserves recovering when progress cursor write fails after rename', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-progress-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    writeFileSync(recoveringPath, `${JSON.stringify(samplePoint(31))}\n`, 'utf8');

    fsFault.writeFileSync = (path, data, ...rest) => {
      const p = String(path);
      if (p.includes('wal.ndjson.failed-') && p.endsWith('.recovery-progress.json')) {
        throw new Error('progress cursor persist failed');
      }
      return fsActual.writeFileSync!(path, data, ...rest);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(recoveringPath)).toBe(true);
    expect(readdirSync(dataDir).some((f) => /^wal\.ndjson\.failed-\d+$/.test(f))).toBe(false);

    await svc.destroy();
  });

  it('keeps failed archive when unlink of recovering throws after successful handoff', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-unlink-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const lines = [samplePoint(41), samplePoint(42)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(walPath, `${lines}\n`, 'utf8');

    let unlinkFaultArmed = true;
    fsFault.unlinkSync = (path) => {
      if (unlinkFaultArmed && String(path) === recoveringPath) {
        throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      }
      return fsActual.unlinkSync!(path);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    const failedName = readdirSync(dataDir).find((f) => /^wal\.ndjson\.failed-\d+$/.test(f));
    expect(failedName).toBeTruthy();
    const failedPath = join(dataDir, failedName!);
    expect(readFileSync(failedPath, 'utf8').trim().split('\n').filter(Boolean).length).toBe(2);
    expect(existsSync(`${failedPath}.recovery-progress.json`)).toBe(true);

    unlinkFaultArmed = false;
    if (existsSync(recoveringPath)) {
      fsActual.unlinkSync!(recoveringPath);
    }

    const writeApi2 = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;
    const svc2 = new TimeseriesService({ dataDir, writeApi: writeApi2 });
    await svc2.recoverWAL();
    expect(writeApi2.writePoint).toHaveBeenCalledTimes(2);

    await svc.destroy();
    await svc2.destroy();
  });
});
