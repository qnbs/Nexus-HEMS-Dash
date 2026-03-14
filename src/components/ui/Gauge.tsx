import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface GaugeProps {
  value: number; // 0-100
  max?: number;
  label: string;
  unit: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animate?: boolean;
}

const colorMap = {
  primary: {
    stroke: 'url(#gradient-primary)',
    glow: 'drop-shadow(0 0 8px var(--color-primary))',
  },
  success: {
    stroke: 'url(#gradient-success)',
    glow: 'drop-shadow(0 0 8px #10b981)',
  },
  warning: {
    stroke: 'url(#gradient-warning)',
    glow: 'drop-shadow(0 0 8px #f59e0b)',
  },
  danger: {
    stroke: 'url(#gradient-danger)',
    glow: 'drop-shadow(0 0 8px #ef4444)',
  },
};

const sizeMap = {
  sm: { size: 80, strokeWidth: 6, fontSize: 14 },
  md: { size: 120, strokeWidth: 8, fontSize: 18 },
  lg: { size: 160, strokeWidth: 10, fontSize: 24 },
};

export function Gauge({
  value,
  max = 100,
  label,
  unit,
  color = 'primary',
  size = 'md',
  showValue = true,
  animate = true,
}: GaugeProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const { size: gaugeSize, strokeWidth, fontSize } = sizeMap[size];
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - percentage);

  useEffect(() => {
    if (animate) {
      const duration = 1000;
      const steps = 60;
      const stepValue = value / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setDisplayValue(stepValue * currentStep);
        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayValue(value);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <svg width={gaugeSize} height={gaugeSize} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#22ff88" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff8800" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={gaugeSize / 2}
          cy={gaugeSize / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          cx={gaugeSize / 2}
          cy={gaugeSize / 2}
          r={radius}
          fill="none"
          stroke={colorMap[color].stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{ filter: colorMap[color].glow }}
        />

        {/* Center value */}
        {showValue && (
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="rotate-90"
            transform={`rotate(90 ${gaugeSize / 2} ${gaugeSize / 2})`}
            fill="var(--color-text)"
            fontSize={fontSize}
            fontWeight="bold"
          >
            {Math.round(displayValue)}
          </text>
        )}
      </svg>

      <div className="text-center">
        <p className="text-xs font-medium tracking-wide text-(--color-muted) uppercase">{label}</p>
        {showValue && (
          <p className="mt-1 text-sm text-(--color-text)">
            {displayValue.toFixed(1)} {unit}
          </p>
        )}
      </div>
    </div>
  );
}
