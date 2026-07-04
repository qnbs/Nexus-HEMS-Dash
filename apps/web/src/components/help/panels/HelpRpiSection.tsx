import { Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpChecklist } from './HelpChecklist';
import { HelpNumberedSteps } from './HelpNumberedSteps';
import { HelpSectionShell } from './HelpSectionShell';

const RPI_HARDWARE = [
  'rpiModel',
  'rpiPower',
  'rpiStorage',
  'rpiNetwork',
  'rpiHat',
  'rpiCan',
] as const;
const RPI_SETUP = [
  'rpiSetup1',
  'rpiSetup2',
  'rpiSetup3',
  'rpiSetup4',
  'rpiSetup5',
  'rpiSetup6',
  'rpiSetup7',
] as const;
const RPI_PERF = ['rpiPerf1', 'rpiPerf2', 'rpiPerf3', 'rpiPerf4', 'rpiPerf5'] as const;

const RPI_VS_GX_ROWS = [
  ['rpiVsGxCost', 'rpiVsGxCostRpi', 'rpiVsGxCostCerbo'],
  ['rpiVsGxVeBus', 'rpiVsGxVeBusRpi', 'rpiVsGxVeBusCerbo'],
  ['rpiVsGxReliability', 'rpiVsGxReliabilityRpi', 'rpiVsGxReliabilityCerbo'],
  ['rpiVsGxSupport', 'rpiVsGxSupportRpi', 'rpiVsGxSupportCerbo'],
  ['rpiVsGxNodeRed', 'rpiVsGxNodeRedBoth', 'rpiVsGxNodeRedBoth'],
  ['rpiVsGxIdeal', 'rpiVsGxIdealRpi', 'rpiVsGxIdealCerbo'],
] as const;

export const HelpRpiSection = () => {
  const { t } = useTranslation();

  return (
    <HelpSectionShell
      icon={Cpu}
      iconClassName="bg-green-500/15 text-green-400"
      title={t('help.rpiTitle')}
    >
      <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">{t('help.rpiIntro')}</p>
      <h4 className="mb-2 font-medium text-sm">{t('help.rpiRecommended')}</h4>
      <HelpChecklist keys={[...RPI_HARDWARE]} iconClassName="text-green-400" />
      <h4 className="mb-2 font-medium text-sm">{t('help.rpiSetup')}</h4>
      <HelpNumberedSteps keys={[...RPI_SETUP]} badgeClassName="bg-green-500/15 text-green-400" />
      <h4 className="mb-2 font-medium text-sm">{t('help.rpiPerformance')}</h4>
      <RpiPerfList />
      <h4 className="mb-2 font-medium text-sm">{t('help.rpiVsGx')}</h4>
      <RpiComparisonTable />
    </HelpSectionShell>
  );
};

const RpiPerfList = () => {
  const { t } = useTranslation();

  return (
    <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
      {RPI_PERF.map((k) => (
        <li key={k}>• {t(`help.${k}`)}</li>
      ))}
    </ul>
  );
};

const RpiComparisonTable = () => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-(--color-border) border-b">
            <th className="py-2 pr-4 text-left font-medium text-(--color-muted)"> </th>
            <th className="px-4 py-2 text-left font-medium text-green-400">
              {t('help.rpiVsGxRpi')}
            </th>
            <th className="px-4 py-2 text-left font-medium text-blue-400">
              {t('help.rpiVsGxCerbo')}
            </th>
          </tr>
        </thead>
        <tbody className="text-(--color-muted)">
          {RPI_VS_GX_ROWS.map(([label, rpi, cerbo]) => (
            <tr key={label} className="border-(--color-border)/50 border-b">
              <td className="py-2 pr-4 font-medium">{t(`help.${label}`)}</td>
              <td className="px-4 py-2">{t(`help.${rpi}`)}</td>
              <td className="px-4 py-2">{t(`help.${cerbo}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
