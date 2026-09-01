import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AiRecommendationSection,
  MetricsOverviewSection,
  MiniSankeySection,
  QuickActionsBar,
} from '../components/command-hub';
import { PageHeader } from '../components/layout/PageHeader';
import { useEnergyContext } from '../core/EnergyContext';
import { resolveConnectionPresentation } from '../lib/adapter-mode';
import { useAppStoreShallow } from '../store';

function CommandHubComponent() {
  const { t } = useTranslation();
  const { connected } = useEnergyContext();
  const adapterMode = useAppStoreShallow((s) => s.adapterMode);
  const connectionPresentation = resolveConnectionPresentation(connected, adapterMode);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('commandHub.title')}
        subtitle={t('commandHub.subtitle')}
        icon={<Home size={22} aria-hidden="true" />}
        actions={
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider ${
              connectionPresentation === 'connected'
                ? 'bg-emerald-500/15 text-emerald-400'
                : connectionPresentation === 'simulation'
                  ? 'border border-(--color-border) bg-(--color-surface-strong) text-(--color-muted)'
                  : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connectionPresentation === 'connected'
                  ? 'energy-pulse bg-emerald-400'
                  : connectionPresentation === 'simulation'
                    ? 'bg-(--color-primary)'
                    : 'bg-rose-400'
              }`}
              aria-hidden="true"
            />
            {connectionPresentation === 'connected'
              ? t('common.live')
              : connectionPresentation === 'simulation'
                ? t('mode.simulationBadge')
                : t('common.disconnected')}
          </span>
        }
      />

      <MetricsOverviewSection />
      <MiniSankeySection />
      <AiRecommendationSection />
      <QuickActionsBar />
    </div>
  );
}

export const CommandHub = CommandHubComponent;
export default CommandHub;
