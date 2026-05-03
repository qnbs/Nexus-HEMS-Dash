import { describe, expect, it } from 'vitest';
import { sampleIndexedSeriesIfNeeded } from '../lib/chart-series-guard';

describe('sampleIndexedSeriesIfNeeded', () => {
  it('returns short series unchanged', () => {
    const rows = [
      { hour: '00:00', pv: 1 },
      { hour: '01:00', pv: 2 },
    ];
    expect(sampleIndexedSeriesIfNeeded(rows, { yKey: 'pv', threshold: 10, outputSize: 5 })).toBe(
      rows,
    );
  });

  it('downsamples long synthetic hourly series', () => {
    const rows = Array.from({ length: 400 }, (_, i) => ({
      hour: `${String(i % 24).padStart(2, '0')}:00`,
      idx: i,
      pv: Math.sin(i / 40) * 1000,
    }));
    const out = sampleIndexedSeriesIfNeeded(rows, {
      indexKey: 'idx',
      yKey: 'pv',
      threshold: 300,
      outputSize: 120,
    });
    expect(out.length).toBe(120);
    expect(out[0]).not.toHaveProperty('ts');
    expect(out[0]).toHaveProperty('idx');
    expect(out.every((r) => typeof r.pv === 'number')).toBe(true);
  });
});
