import { HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

/** Standalone Help page title block (hidden when embedded in Settings). */
export const HelpPageHeader = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      className="mb-8 flex items-center justify-between gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-primary)/10">
          <HelpCircle className="text-(--color-primary)" size={22} />
        </div>
        <div>
          <h1 className="fluid-text-2xl font-semibold tracking-tight">{t('help.title')}</h1>
          <p className="text-(--color-muted) text-sm">{t('help.subtitle')}</p>
        </div>
      </div>
    </motion.div>
  );
};
