import type { ChargeWindow, WindowCategory } from '../types';
import { PRICE_AVG, PRICE_MIN, PRICE_SPREAD, PRICE_TIMELINE } from './constants';

function classify(avgPrice: number): WindowCategory {
  if (avgPrice < PRICE_MIN + PRICE_SPREAD * 0.2) return 'optimal';
  if (avgPrice < PRICE_MIN + PRICE_SPREAD * 0.5) return 'good';
  return 'acceptable';
}

/** Optimal charging windows (sorted by price) */
export const CHARGE_WINDOWS: ChargeWindow[] = (() => {
  const windows: ChargeWindow[] = [];
  let windowStart = -1;
  const threshold = PRICE_AVG * 0.85;

  for (let i = 0; i < PRICE_TIMELINE.length; i++) {
    const slot = PRICE_TIMELINE[i];
    if (!slot) continue;
    if (slot.price <= threshold && windowStart === -1) {
      windowStart = i;
    } else if ((slot.price > threshold || i === PRICE_TIMELINE.length - 1) && windowStart !== -1) {
      const slice = PRICE_TIMELINE.slice(windowStart, i);
      const avgPrice = slice.reduce((s, x) => s + x.price, 0) / slice.length;
      const avgRenewable = slice.reduce((s, x) => s + x.renewable, 0) / slice.length;
      const savingsVsAvg = (PRICE_AVG - avgPrice) * 20; // 20 kWh assumed
      const startSlot = PRICE_TIMELINE[windowStart];
      const endSlot = PRICE_TIMELINE[Math.min(i, PRICE_TIMELINE.length - 1)];
      windows.push({
        start: startSlot?.time ?? '',
        end: endSlot?.time ?? '',
        avgPrice,
        savings: Math.max(0, savingsVsAvg),
        duration: i - windowStart,
        category: classify(avgPrice),
        renewable: Math.round(avgRenewable),
      });
      windowStart = -1;
    }
  }
  return windows.sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 6);
})();
