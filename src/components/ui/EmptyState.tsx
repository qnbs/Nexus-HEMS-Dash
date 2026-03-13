import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface)">
        <Icon className="h-6 w-6 text-(--color-muted)" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--color-text)">{title}</p>
        {description && (
          <p className="max-w-xs text-xs leading-relaxed text-(--color-muted)">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
