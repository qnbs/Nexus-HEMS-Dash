import { describe, expect, it } from 'vitest';
import { calculateCo2Savings } from '../lib/pdf-report';

describe('CO₂ Savings Calculation', () => {
  it('should calculate CO₂ savings with UBA 2024 factor (380 g/kWh)', () => {
    // 1000 kWh * 380 g/kWh = 380000 g = 380 kg
    expect(calculateCo2Savings(1000)).toBe(380);
  });

  it('should return 0 for 0 kWh', () => {
    expect(calculateCo2Savings(0)).toBe(0);
  });

  it('should handle fractional kWh values', () => {
    // 10.5 kWh * 380 / 1000 = 3.99 kg
    expect(calculateCo2Savings(10.5)).toBeCloseTo(3.99, 2);
  });

  it('should scale linearly', () => {
    const single = calculateCo2Savings(100);
    const double = calculateCo2Savings(200);
    expect(double).toBeCloseTo(single * 2, 5);
  });
});
