import {
  CheckCircle2,
  Cpu,
  HardDrive,
  Info,
  Lightbulb,
  Network,
  Server,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpTabPanelShell } from '../HelpTabPanelShell';

export const HelpIntegrationPanel = () => {
  const { t } = useTranslation();

  return (
    <HelpTabPanelShell tabKey="integration">
      {/* Intro */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <h2 className="fluid-text-xl mb-2 font-semibold">{t('help.integrationGuideTitle')}</h2>
        <p className="text-(--color-muted) text-sm leading-relaxed">
          {t('help.integrationGuideIntro')}
        </p>
      </div>

      {/* Cerbo GX / MK2 */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
            <Server size={20} className="text-blue-400" />
          </div>
          <h3 className="fluid-text-lg font-semibold">{t('help.cerboGxTitle')}</h3>
        </div>
        <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">
          {t('help.cerboGxIntro')}
        </p>

        {/* Specs */}
        <h4 className="mb-2 font-medium text-sm">{t('help.cerboGxSpecs')}</h4>
        <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {[
            'cerboGxSpec1',
            'cerboGxSpec2',
            'cerboGxSpec3',
            'cerboGxSpec4',
            'cerboGxSpec5',
            'cerboGxSpec6',
          ].map((k) => (
            <li key={k} className="flex gap-2">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
              {t(`help.${k}`)}
            </li>
          ))}
        </ul>

        {/* Interfaces */}
        <h4 className="mb-2 font-medium text-sm">{t('help.cerboGxInterfaces')}</h4>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            'cerboGxInt1',
            'cerboGxInt2',
            'cerboGxInt3',
            'cerboGxInt4',
            'cerboGxInt5',
            'cerboGxInt6',
          ].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2.5 text-(--color-muted) text-xs"
            >
              {t(`help.${k}`)}
            </div>
          ))}
        </div>

        {/* Setup Steps */}
        <h4 className="mb-2 font-medium text-sm">{t('help.cerboGxSetup')}</h4>
        <ol className="mb-4 space-y-2 text-(--color-muted) text-xs">
          {[
            'cerboGxSetup1',
            'cerboGxSetup2',
            'cerboGxSetup3',
            'cerboGxSetup4',
            'cerboGxSetup5',
            'cerboGxSetup6',
            'cerboGxSetup7',
          ].map((k, i) => (
            <li key={k} className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/15 font-bold text-(--color-primary) text-[10px]">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t(`help.${k}`)}</span>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
          <p className="text-(--color-muted) text-xs">{t('help.cerboGxNote')}</p>
        </div>
      </div>

      {/* Raspberry Pi */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
            <Cpu size={20} className="text-green-400" />
          </div>
          <h3 className="font-semibold text-lg">{t('help.rpiTitle')}</h3>
        </div>
        <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">{t('help.rpiIntro')}</p>

        {/* Recommended Hardware */}
        <h4 className="mb-2 font-medium text-sm">{t('help.rpiRecommended')}</h4>
        <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {['rpiModel', 'rpiPower', 'rpiStorage', 'rpiNetwork', 'rpiHat', 'rpiCan'].map((k) => (
            <li key={k} className="flex gap-2">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-green-400" />
              {t(`help.${k}`)}
            </li>
          ))}
        </ul>

        {/* Installation Steps */}
        <h4 className="mb-2 font-medium text-sm">{t('help.rpiSetup')}</h4>
        <ol className="mb-4 space-y-2 text-(--color-muted) text-xs">
          {[
            'rpiSetup1',
            'rpiSetup2',
            'rpiSetup3',
            'rpiSetup4',
            'rpiSetup5',
            'rpiSetup6',
            'rpiSetup7',
          ].map((k, i) => (
            <li key={k} className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 font-bold text-[10px] text-green-400">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t(`help.${k}`)}</span>
            </li>
          ))}
        </ol>

        {/* Performance Tips */}
        <h4 className="mb-2 font-medium text-sm">{t('help.rpiPerformance')}</h4>
        <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {['rpiPerf1', 'rpiPerf2', 'rpiPerf3', 'rpiPerf4', 'rpiPerf5'].map((k) => (
            <li key={k}>• {t(`help.${k}`)}</li>
          ))}
        </ul>

        {/* Comparison Table */}
        <h4 className="mb-2 font-medium text-sm">{t('help.rpiVsGx')}</h4>
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
              {[
                ['rpiVsGxCost', 'rpiVsGxCostRpi', 'rpiVsGxCostCerbo'],
                ['rpiVsGxVeBus', 'rpiVsGxVeBusRpi', 'rpiVsGxVeBusCerbo'],
                ['rpiVsGxReliability', 'rpiVsGxReliabilityRpi', 'rpiVsGxReliabilityCerbo'],
                ['rpiVsGxSupport', 'rpiVsGxSupportRpi', 'rpiVsGxSupportCerbo'],
                ['rpiVsGxNodeRed', 'rpiVsGxNodeRedBoth', 'rpiVsGxNodeRedBoth'],
                ['rpiVsGxIdeal', 'rpiVsGxIdealRpi', 'rpiVsGxIdealCerbo'],
              ].map(([label, rpi, cerbo]) => (
                <tr key={label} className="border-(--color-border)/50 border-b">
                  <td className="py-2 pr-4 font-medium">{t(`help.${label}`)}</td>
                  <td className="px-4 py-2">{t(`help.${rpi}`)}</td>
                  <td className="px-4 py-2">{t(`help.${cerbo}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Venus OS & Node-RED Architecture */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
            <Network size={20} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg">{t('help.venusTitle')}</h3>
        </div>
        <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">{t('help.venusIntro')}</p>

        {/* Architecture */}
        <h4 className="mb-2 font-medium text-sm">{t('help.venusArchitecture')}</h4>
        <ol className="mb-4 space-y-2 text-(--color-muted) text-xs">
          {['venusArch1', 'venusArch2', 'venusArch3', 'venusArch4', 'venusArch5'].map((k, i) => (
            <li key={k} className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/15 font-bold text-[10px] text-purple-400">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t(`help.${k}`)}</span>
            </li>
          ))}
        </ol>

        {/* D-Bus Paths */}
        <h4 className="mb-2 font-medium text-sm">{t('help.venusDbusTitle')}</h4>
        <div className="mb-4 space-y-1.5">
          {[
            'venusDbus1',
            'venusDbus2',
            'venusDbus3',
            'venusDbus4',
            'venusDbus5',
            'venusDbus6',
            'venusDbus7',
          ].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 font-mono text-(--color-muted) text-xs"
            >
              {t(`help.${k}`)}
            </div>
          ))}
        </div>

        {/* Node-RED Flow */}
        <h4 className="mb-2 font-medium text-sm">{t('help.venusNodeRed')}</h4>
        <p className="mb-3 text-(--color-muted) text-xs leading-relaxed">
          {t('help.venusNodeRedDesc')}
        </p>
        <h4 className="mb-2 font-medium text-sm">{t('help.venusNodeRedFlows')}</h4>
        <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {['venusFlow1', 'venusFlow2', 'venusFlow3', 'venusFlow4', 'venusFlow5'].map((k) => (
            <li key={k}>• {t(`help.${k}`)}</li>
          ))}
        </ul>

        {/* MQTT Topics */}
        <h4 className="mb-2 font-medium text-sm">{t('help.venusMqttTopics')}</h4>
        <div className="space-y-1.5">
          {['venusMqtt1', 'venusMqtt2', 'venusMqtt3', 'venusMqtt4', 'venusMqtt5'].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 font-mono text-(--color-muted) text-xs"
            >
              {t(`help.${k}`)}
            </div>
          ))}
        </div>
      </div>

      {/* KNX Integration */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Lightbulb size={20} className="text-amber-400" />
          </div>
          <h3 className="font-semibold text-lg">{t('help.knxTitle')}</h3>
        </div>
        <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">{t('help.knxIntro')}</p>

        {/* Architecture */}
        <h4 className="mb-2 font-medium text-sm">{t('help.knxArchitecture')}</h4>
        <ol className="mb-4 space-y-2 text-(--color-muted) text-xs">
          {['knxArch1', 'knxArch2', 'knxArch3', 'knxArch4'].map((k, i) => (
            <li key={k} className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-bold text-[10px] text-amber-400">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t(`help.${k}`)}</span>
            </li>
          ))}
        </ol>

        {/* Group Addresses */}
        <h4 className="mb-2 font-medium text-sm">{t('help.knxGroupAddresses')}</h4>
        <div className="mb-4 space-y-1.5">
          {['knxGA1', 'knxGA2', 'knxGA3', 'knxGA4', 'knxGA5'].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 font-mono text-(--color-muted) text-xs"
            >
              {t(`help.${k}`)}
            </div>
          ))}
        </div>

        {/* Best Practices */}
        <h4 className="mb-2 font-medium text-sm">{t('help.knxBestPractices')}</h4>
        <ul className="ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {['knxBP1', 'knxBP2', 'knxBP3', 'knxBP4', 'knxBP5'].map((k) => (
            <li key={k}>• {t(`help.${k}`)}</li>
          ))}
        </ul>
      </div>

      {/* High-End Configuration */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
            <HardDrive size={20} className="text-rose-400" />
          </div>
          <h3 className="font-semibold text-lg">{t('help.highEndTitle')}</h3>
        </div>
        <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">
          {t('help.highEndIntro')}
        </p>

        {/* Hardware */}
        <h4 className="mb-2 font-medium text-sm">{t('help.highEndHardware')}</h4>
        <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {[
            'highEndHW1',
            'highEndHW2',
            'highEndHW3',
            'highEndHW4',
            'highEndHW5',
            'highEndHW6',
            'highEndHW7',
            'highEndHW8',
            'highEndHW9',
          ].map((k) => (
            <li key={k} className="flex gap-2">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-rose-400" />
              {t(`help.${k}`)}
            </li>
          ))}
        </ul>

        {/* Software */}
        <h4 className="mb-2 font-medium text-sm">{t('help.highEndSoftware')}</h4>
        <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {['highEndSW1', 'highEndSW2', 'highEndSW3', 'highEndSW4', 'highEndSW5'].map((k) => (
            <li key={k} className="flex gap-2">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-purple-400" />
              {t(`help.${k}`)}
            </li>
          ))}
        </ul>

        {/* Network */}
        <h4 className="mb-2 font-medium text-sm">{t('help.highEndNetwork')}</h4>
        <ul className="ml-4 space-y-1.5 text-(--color-muted) text-xs">
          {['highEndNet1', 'highEndNet2', 'highEndNet3', 'highEndNet4', 'highEndNet5'].map((k) => (
            <li key={k} className="flex gap-2">
              <Shield size={12} className="mt-0.5 shrink-0 text-cyan-400" />
              {t(`help.${k}`)}
            </li>
          ))}
        </ul>
      </div>
    </HelpTabPanelShell>
  );
};
