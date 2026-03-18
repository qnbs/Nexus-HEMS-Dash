import { type ReactNode, forwardRef } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export interface ControlPanelProps {
  /** Panel title shown in the sticky header */
  title: ReactNode;
  /** Optional actions rendered at the right side of the header */
  headerActions?: ReactNode;
  /** Whether to show a close button in the header */
  onClose?: () => void;
  /** Close button aria-label for accessibility */
  closeLabel?: string;
  /** Panel body content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full-control container (Level 2 in card hierarchy).
 *
 * Used for settings, configuration, and detailed views.
 * Built on the `control-panel` CSS utility class from the design system.
 * Uses `glass-panel-strong` effect with a sticky header and scrollable body.
 *
 * @example
 * ```tsx
 * <ControlPanel title="Adapter Configuration" onClose={() => setOpen(false)}>
 *   <p>Form fields, toggles, charts…</p>
 * </ControlPanel>
 * ```
 */
export const ControlPanel = forwardRef<HTMLDivElement, ControlPanelProps>(function ControlPanel(
  { title, headerActions, onClose, closeLabel = 'Close', children, className = '' },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={`control-panel ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="control-panel-header">
        <h2 className="fluid-text-lg truncate font-semibold text-(--color-text)">{title}</h2>
        <div className="flex items-center gap-2">
          {headerActions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-(--color-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-text)"
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="control-panel-body">{children}</div>
    </motion.div>
  );
});

/** Horizontal separator between sections inside a ControlPanel body */
export function ControlPanelDivider() {
  return <div className="section-divider my-4" role="separator" />;
}

/** Section group with an optional heading inside a ControlPanel */
export function ControlPanelSection({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      {title && <h3 className="eyebrow text-(--color-muted)">{title}</h3>}
      {children}
    </section>
  );
}
