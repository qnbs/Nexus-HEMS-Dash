import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

/** Route → i18n label map for the mobile page title */
const headerRouteLabels: Record<string, string> = {
  '/': 'nav.home',
  '/energy-flow': 'nav.energyFlow',
  '/devices': 'nav.devicesOverview',
  '/optimization-ai': 'nav.aiOptimizer',
  '/tariffs': 'nav.tariffs',
  '/analytics': 'nav.analytics',
  '/monitoring': 'nav.monitoring',
  '/plugins': 'nav.plugins',
  '/settings': 'nav.settings',
  '/settings/ai': 'nav.aiKeys',
  '/help': 'nav.help',
};

/** Displays the current page name in the mobile header */
export function MobilePageTitle() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const labelKey = headerRouteLabels[pathname] ?? 'nav.home';

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={pathname}
        className="min-w-0 truncate font-semibold text-(--color-text) text-sm lg:hidden"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
      >
        {t(labelKey)}
      </motion.span>
    </AnimatePresence>
  );
}
