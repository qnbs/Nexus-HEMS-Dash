import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { useAppStore } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { PredictiveForecast } from '../components/PredictiveForecast';
import { ExportAndSharing } from '../components/ExportAndSharing';

function AnalyticsPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.analytics', 'Analytics')}
        subtitle={t('analytics.subtitle', 'Reports, forecasts & data export')}
        icon={<BarChart3 size={22} />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t('forecast.potentialSavings'), value: '€47.20', color: 'text-emerald-400' },
          { label: t('forecast.co2Saved'), value: '12.4 kg', color: 'text-cyan-400' },
          { label: t('forecast.avgPvGeneration'), value: '4.2 kW', color: 'text-yellow-400' },
          { label: t('metrics.autonomy'), value: '68%', color: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="metric-card rounded-3xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <p className="text-xs text-[color:var(--color-muted)]">{stat.label}</p>
            <p className={`mt-1 text-2xl font-light ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <PredictiveForecast />
      </motion.div>

      {/* Export & Sharing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ExportAndSharing />
      </motion.div>
    </div>
  );
}

export default memo(AnalyticsPageComponent);
