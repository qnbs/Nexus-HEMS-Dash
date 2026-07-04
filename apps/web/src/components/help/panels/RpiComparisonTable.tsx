import { useTranslation } from 'react-i18next';

const RPI_VS_GX_ROWS = [
  ['rpiVsGxCost', 'rpiVsGxCostRpi', 'rpiVsGxCostCerbo'],
  ['rpiVsGxVeBus', 'rpiVsGxVeBusRpi', 'rpiVsGxVeBusCerbo'],
  ['rpiVsGxReliability', 'rpiVsGxReliabilityRpi', 'rpiVsGxReliabilityCerbo'],
  ['rpiVsGxSupport', 'rpiVsGxSupportRpi', 'rpiVsGxSupportCerbo'],
  ['rpiVsGxNodeRed', 'rpiVsGxNodeRedBoth', 'rpiVsGxNodeRedBoth'],
  ['rpiVsGxIdeal', 'rpiVsGxIdealRpi', 'rpiVsGxIdealCerbo'],
] as const;

/** Raspberry Pi vs Cerbo GX comparison table in the integration guide. */
export const RpiComparisonTable = () => {
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
