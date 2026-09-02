import { describe, expect, it } from 'vitest';
import {
  formatTariffPrice,
  formatTariffPriceCompact,
  formatTariffPriceFull,
} from '../lib/format-tariff-price';

describe('formatTariffPrice', () => {
  const en = 'en-US';

  it('formats compact prices as cent/kWh', () => {
    expect(formatTariffPriceCompact(0.128, en)).toBe('12.8 ct/kWh');
    expect(formatTariffPrice(0.18, { style: 'compact', locale: en })).toEqual({
      value: '18.0',
      unit: 'ct/kWh',
    });
  });

  it('formats full prices as €/kWh with three decimals', () => {
    expect(formatTariffPriceFull(0.128, en)).toBe('0.128 €/kWh');
    expect(formatTariffPrice(0.18, { style: 'full', locale: en })).toEqual({
      value: '0.180',
      unit: '€/kWh',
    });
  });

  it('uses consistent cent conversion across compact surfaces', () => {
    const compact = formatTariffPriceCompact(0.128, en);
    expect(compact).toContain('ct/kWh');
    expect(compact).not.toContain('€');
  });
});
