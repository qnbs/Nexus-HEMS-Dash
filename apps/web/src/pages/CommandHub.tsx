import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AiRecommendationSection,
  MetricsOverviewSection,
  MiniSankeySection,
  QuickActionsBar,
} from '../components/command-hub';
import { DemoBadge } from '../components/DemoBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { useEnergyContext } from '../core/EnergyContext';

function CommandHubComponent() {
  const { t } = useTranslation();
  const { connected } = useEnergyContext();
  const isDemo = !connected;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('commandHub.title')}
        subtitle={t('commandHub.subtitle')}
        icon={<Home size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider ${
                connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? 'energy-pulse bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              {connected ? t('common.live') : t('common.demoMode')}
            </span>
          </div>
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
