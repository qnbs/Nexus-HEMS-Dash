import { type HTMLMotionProps, motion } from 'motion/react';
import type { MouseEvent, ReactNode } from 'react';

interface NeonCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  glow?: boolean;
  pulse?: boolean;
  hover?: boolean;
  spotlight?: boolean;
}

const variantStyles = {
  default: {
    border: 'border-(--color-border)',
    bg: 'bg-(--color-surface)',
    glow: 'shadow-2xl',
  },
  primary: {
    border: 'border-(--color-primary)/30',
    bg: 'bg-(--color-primary)/5',
    glow: 'shadow-[0_0_30px_rgba(34,255,136,0.3)]',
  },
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
  },
  warning: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/5',
    glow: 'shadow-[0_0_30px_rgba(255,136,0,0.3)]',
  },
  danger: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
  },
};

function handleSpotlightMove(e: MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty(
    '--spotlight-x',
    `${((e.clientX - rect.left) / rect.width) * 100}%`,
  );
  e.currentTarget.style.setProperty(
    '--spotlight-y',
    `${((e.clientY - rect.top) / rect.height) * 100}%`,
  );
}

export function NeonCard({
  children,
  variant = 'default',
  glow = false,
  pulse = false,
  hover = true,
  spotlight = false,
  className = '',
  ...props
}: NeonCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={`gradient-border rounded-3xl border backdrop-blur-3xl ${styles.border} ${styles.bg} ${glow ? styles.glow : ''} ${pulse ? 'animate-pulse-slow' : ''} ${spotlight ? 'spotlight' : ''} ${className} `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...(hover && {
        whileHover: {
          scale: 1.015,
          transition: { duration: 0.25, type: 'spring', stiffness: 400, damping: 25 },
        },
      })}
      onMouseMove={spotlight ? handleSpotlightMove : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function NeonCardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`border-(--color-border) border-b p-6 ${className}`}>{children}</div>;
}

export function NeonCardBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function NeonCardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`border-(--color-border) border-t p-6 ${className}`}>{children}</div>;
}
