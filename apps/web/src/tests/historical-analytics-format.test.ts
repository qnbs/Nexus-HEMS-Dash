import { describe, expect, it } from 'vitest';
import type { TimeRange } from '../components/historical-analytics/types';
import { formatTimestamp } from '../components/historical-analytics/utils';

// Fixed local timestamp: 2024-03-15 14:30:00.
const TS = new Date(2024, 2, 15, 14, 30, 0).getTime();

describe('formatTimestamp', () => {
  it('formats 24h as HH:MM', () => {
    expect(formatTimestamp(TS, '24h')).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('formats 7d with an hour component', () => {
    expect(formatTimestamp(TS, '7d')).toMatch(/\d{2}/);
  });

  it('formats 30d as DD.MM', () => {
    expect(formatTimestamp(TS, '30d')).toMatch(/\d{2}\.\d{2}/);
  });

  it('formats 90d starting with a day', () => {
    expect(formatTimestamp(TS, '90d')).toMatch(/^\d{2}\./);
  });

  it('formats 365d ending with a 2-digit year', () => {
    expect(formatTimestamp(TS, '365d')).toMatch(/\d{2}$/);
  });

  it('produces distinct output across ranges', () => {
    const ranges: TimeRange[] = ['24h', '7d', '30d', '90d', '365d'];
    const outputs = new Set(ranges.map((r) => formatTimestamp(TS, r)));
    expect(outputs.size).toBeGreaterThan(1);
  });
});
