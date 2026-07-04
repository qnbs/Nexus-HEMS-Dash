import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/** Props for {@link AppShellHeaderLogo}. */
export interface AppShellHeaderLogoProps {
  /** Whether the backend WebSocket is connected. */
  connected: boolean;
}

/**
 * Mobile header logo with a live connection status indicator.
 */
export function AppShellHeaderLogo({ connected }: AppShellHeaderLogoProps) {
  const { t } = useTranslation();

  return (
    <Link
      to="/"
      className="focus-ring relative shrink-0 rounded-lg lg:hidden"
      aria-label={t('nav.home')}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}icon.svg`}
        alt=""
        className="h-7 w-7 rounded-lg"
        aria-hidden="true"
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      />
      <span
        className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-(--color-surface-strong) border-2 ${
          connected
            ? 'bg-(--color-neon-green) shadow-[0_0_6px_var(--color-neon-green)]'
            : 'bg-(--state-danger-bg) shadow-[0_0_6px_var(--state-danger-bg)]'
        }`}
        aria-hidden="true"
      />
    </Link>
  );
}
