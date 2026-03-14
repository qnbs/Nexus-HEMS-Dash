import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import MonitoringPanel from '../components/MonitoringPanel';

export default function MonitoringPage() {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-4 p-4 sm:space-y-6 sm:p-6">
      <PageHeader
        title={t('monitoring.pageTitle', 'Monitoring')}
        subtitle={t('monitoring.pageDescription', 'Prometheus & Grafana system monitoring')}
      />
      <MonitoringPanel />
    </div>
  );
}
