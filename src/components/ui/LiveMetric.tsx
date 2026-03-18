import { useState } from 'react';

/** Formatting presets for common energy units */
export type LiveMetricFormat = 'power' | 'energy' | 'percent' | 'currency' | 'custom';

export interface LiveMetricProps {
  /** Numeric value to display */
  value: number;
  /** Unit label appended after the number (e.g. "kW", "%", "€/kWh") */
  unit?: string;
  /** Number of decimal places (default: auto-detected by format) */
  precision?: number;
  /** Predefined format for common energy metrics */
  format?: LiveMetricFormat;
  /** Size override — uses fluid-text-* classes */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to animate pulse when the value changes */
  pulse?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeClass: Record<NonNullable<LiveMetricProps['size']>, string> = {
  sm: 'fluid-text-lg',
  md: 'fluid-text-2xl',
  lg: 'fluid-text-3xl',
  xl: 'fluid-text-4xl',
};

const defaultPrecision: Record<LiveMetricFormat, number> = {
  power: 3,
  energy: 1,
  percent: 0,
  currency: 3,
  custom: 2,
};

/**
 * Real-time numeric readout with monospace tabular figures.
 *
 * Uses the `live-metric` CSS utility from the design system.
 * Automatically pulses when the value changes (opt-in via `pulse` prop).
 * Font is `font-mono` + `tabular-nums` for stable digit width — no layout shifts.
 *
 * @example
 * ```tsx
 * <LiveMetric value={3.247} unit="kW" format="power" />
 * <LiveMetric value={78} unit="%" format="percent" size="lg" />
 * ```
 */
export function LiveMetric({
  value,
  unit,
  precision,
  format = 'custom',
  size = 'md',
  pulse = true,
  className = '',
}: LiveMetricProps) {
  const decimals = precision ?? defaultPrecision[format];
  const formatted = value.toFixed(decimals);

  const [prevValue, setPrevValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);

  // Derive state from props — supported React pattern (setState during render)
  if (pulse && prevValue !== value) {
    setPrevValue(value);
    setAnimKey((k) => k + 1);
  }

  return (
    <span
      key={pulse ? animKey : undefined}
      className={`live-metric ${sizeClass[size]} ${className}`}
      data-changing={pulse ? 'true' : undefined}
      aria-live="polite"
      aria-atomic="true"
    >
      {formatted}
      {unit && (
        <span className="ml-1 text-[0.6em] font-normal tracking-wide text-(--color-muted)">
          {unit}
        </span>
      )}
    </span>
  );
}
