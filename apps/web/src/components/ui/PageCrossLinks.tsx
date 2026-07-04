// ─── PageCrossLinks — Contextual navigation footer for every feature page ───
// Shows: related pages, settings shortcuts, setup progress, and help links.

import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { PAGE_REGISTRY, PAGE_RELATIONS, type PageId, SETUP_STEPS } from '../../lib/page-relations';
import { useAppStoreShallow } from '../../store';
import { QuickSettingsSection } from './cross-links/QuickSettingsSection';
import { RelatedPagesSection } from './cross-links/RelatedPagesSection';
import { SetupProgressSection } from './cross-links/SetupProgressSection';

const pathToPageId = (pathname: string): PageId | null => {
  const clean = pathname.replace(/\/$/, '') || '/';
  for (const [id, meta] of Object.entries(PAGE_REGISTRY)) {
    if (meta.path === clean) return id as PageId;
  }
  return null;
};

/** Contextual related pages, settings shortcuts, and setup progress footer. */
export const PageCrossLinks = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const settings = useAppStoreShallow((s) => s.settings);

  const pageId = pathToPageId(pathname);
  if (!pageId || !PAGE_RELATIONS[pageId]) return null;

  const relations = PAGE_RELATIONS[pageId];
  const relatedPages = relations.related.map((id) => PAGE_REGISTRY[id]).filter(Boolean);
  const settingsObj = settings as unknown as Record<string, unknown>;
  const completedSteps = SETUP_STEPS.filter((step) => step.checkFn(settingsObj)).length;
  const totalSteps = SETUP_STEPS.length;

  if (pageId === 'settings' || pageId === 'help' || pageId === 'ai-settings') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-8 space-y-6"
      role="complementary"
      aria-label={t('crossLinks.sectionLabel')}
    >
      <RelatedPagesSection relatedPages={relatedPages} />

      <div className="grid gap-4 md:grid-cols-2">
        <QuickSettingsSection
          settingsLinks={relations.settingsLinks}
          setupReqs={relations.setupRequirements}
        />
        <SetupProgressSection
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          settingsObj={settingsObj}
          helpTab={relations.helpTab}
        />
      </div>
    </motion.div>
  );
};
