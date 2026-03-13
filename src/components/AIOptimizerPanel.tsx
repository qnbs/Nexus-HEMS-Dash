import { useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, TriangleAlert, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buildOptimizerRecommendations } from '../lib/optimizer';
import { useAppStore } from '../store';

const severityStyles = {
  positive: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100',
  warning: 'border-orange-400/35 bg-orange-400/10 text-orange-50',
  critical: 'border-red-400/35 bg-red-400/10 text-red-50',
  neutral: 'border-sky-400/30 bg-sky-400/10 text-sky-50',
} as const;

const severityIcons = {
  positive: TrendingUp,
  warning: BrainCircuit,
  critical: TriangleAlert,
  neutral: Zap,
} as const;

export const AIOptimizerPanel = memo(function AIOptimizerPanel() {
  const { t } = useTranslation();
  const energyData = useAppStore((state) => state.energyData);
  const settings = useAppStore((state) => state.settings);
  const recommendations = useMemo(
    () => buildOptimizerRecommendations(energyData, settings),
    [energyData, settings],
  );

  return (
    <div className="glass-panel grid gap-3 sm:gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{t('dashboard.optimizer')}</p>
          <h3 className="mt-2 text-lg fluid-text-lg sm:text-xl font-semibold text-(--color-text)">
            {t('dashboard.optimizerSubtitle')}
          </h3>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-white/5 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-(--color-primary)">
          <BrainCircuit className="h-4 w-4" aria-hidden="true" />
          {t('common.live')}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {recommendations.map((recommendation, index) => {
          const Icon = severityIcons[recommendation.severity];

          return (
            <motion.article
              key={recommendation.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
              className={`rounded-2xl sm:rounded-3xl border p-3 sm:p-4 ${severityStyles[recommendation.severity]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                    {t(recommendation.titleKey)}
                  </p>
                  <h4 className="mt-2 text-base fluid-text-base font-semibold">
                    {t(recommendation.descriptionKey)}
                  </h4>
                </div>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-medium opacity-80">{recommendation.value}</p>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
});
