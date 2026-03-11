import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import MonitoringPanel from '../components/MonitoringPanel';

export default function MonitoringPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 min-w-0">
      <PageHeader
        title={t('monitoring.pageTitle', 'Monitoring')}
        subtitle={t('monitoring.pageDescription', 'Prometheus & Grafana system monitoring')}
      />
      <MonitoringPanel />
    </div>
  );
}
