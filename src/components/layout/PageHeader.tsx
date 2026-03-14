import { memo } from 'react';
import { motion } from 'motion/react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

function PageHeaderComponent({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <motion.div
      className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/10 text-(--color-primary)"
            aria-hidden="true"
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {icon}
          </motion.div>
        )}
        <div>
          <h1 className="fluid-text-2xl text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="fluid-text-sm mt-0.5 text-sm text-(--color-muted)">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export const PageHeader = memo(PageHeaderComponent);
