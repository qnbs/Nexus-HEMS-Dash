import { Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Disclosure } from '../../ui/Disclosure';
import { HelpTabPanelShell } from '../HelpTabPanelShell';
import { HelpPerfTip } from './HelpPerfTip';

const PERF_TIP_KEYS = ['help.perf1', 'help.perf2', 'help.perf3', 'help.perf4'] as const;

export const HelpTroubleshootingPanel = () => {
  const { t } = useTranslation();

  return (
    <HelpTabPanelShell tabKey="troubleshooting">
      <div className="glass-panel-strong rounded-2xl p-6">
        <h2 className="mb-6 font-semibold text-xl">{t('help.troubleshootingTitle')}</h2>
        <div className="space-y-3">
          <Disclosure title={t('help.troubleConnection')} defaultOpen>
            <ul className="space-y-2">
              <li>1. {t('help.troubleConn1')}</li>
              <li>2. {t('help.troubleConn2')}</li>
              <li>3. {t('help.troubleConn3')}</li>
              <li>4. {t('help.troubleConn4')}</li>
            </ul>
          </Disclosure>
          <Disclosure title={t('help.troubleNoData')}>
            <ul className="space-y-2">
              <li>• {t('help.troubleData1')}</li>
              <li>• {t('help.troubleData2')}</li>
              <li>• {t('help.troubleData3')}</li>
              <li>• {t('help.troubleData4')}</li>
            </ul>
          </Disclosure>
          <Disclosure title={t('help.troublePwa')}>
            <ul className="space-y-2">
              <li>• {t('help.troublePwa1')}</li>
              <li>• {t('help.troublePwa2')}</li>
              <li>• {t('help.troublePwa3')}</li>
              <li>• {t('help.troublePwa4')}</li>
            </ul>
          </Disclosure>
          <Disclosure title={t('help.troubleKnx')}>
            <ul className="space-y-2">
              <li>• {t('help.troubleKnx1')}</li>
              <li>• {t('help.troubleKnx2')}</li>
              <li>• {t('help.troubleKnx3')}</li>
              <li>• {t('help.troubleKnx4')}</li>
            </ul>
          </Disclosure>
          <Disclosure title={t('help.troubleReadOnly')}>
            <ul className="space-y-2">
              <li>• {t('help.troubleReadOnly1')}</li>
              <li>• {t('help.troubleReadOnly2')}</li>
              <li>• {t('help.troubleReadOnly3')}</li>
            </ul>
          </Disclosure>
          <Disclosure title={t('help.troubleAi')}>
            <ul className="space-y-2">
              <li>• {t('help.troubleAi1')}</li>
              <li>• {t('help.troubleAi2')}</li>
              <li>• {t('help.troubleAi3')}</li>
              <li>• {t('help.troubleAi4')}</li>
            </ul>
          </Disclosure>
        </div>
      </div>

      <div className="glass-panel-strong rounded-2xl p-6">
        <h3 className="mb-4 flex items-center gap-2 font-medium text-lg">
          <Gauge size={20} className="text-indigo-400" />
          {t('help.perfTips')}
        </h3>
        <div className="space-y-3 text-(--color-muted) text-sm">
          {PERF_TIP_KEYS.map((key) => (
            <HelpPerfTip key={key} text={t(key)} />
          ))}
        </div>
      </div>
    </HelpTabPanelShell>
  );
};
