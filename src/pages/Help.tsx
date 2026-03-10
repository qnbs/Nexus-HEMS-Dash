import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  BookOpen,
  Info,
  MessageCircleQuestion,
  FileText,
  Zap,
  Activity,
  Sun,
  Battery,
  Home,
  Car,
  Map,
  Sparkles,
  TrendingUp,
  BarChart3,
  Settings,
  Shield,
  Wifi,
  WifiOff,
  Download,
  Keyboard,
  Monitor,
  Smartphone,
  Mic,
  Globe,
  ExternalLink,
  ChevronDown,
  Search,
  Server,
  Gauge,
  Lightbulb,
  RefreshCw,
  Cpu,
  Cable,
  Network,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type HelpTab = 'getting-started' | 'integration' | 'features' | 'lexicon' | 'faq' | 'shortcuts' | 'troubleshooting' | 'about';

function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between p-4 font-medium text-sm text-[color:var(--color-text)] hover:bg-white/5 transition-colors text-left focus-ring"
        aria-expanded={open}
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-[color:var(--color-muted)]" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 pb-4 text-sm text-[color:var(--color-muted)] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <motion.div
      className="glass-panel p-5 rounded-xl border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/30 transition-all"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3 ${color}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">{description}</p>
    </motion.div>
  );
}

export function Help() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<HelpTab>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { key: HelpTab; icon: React.ReactNode; label: string }[] = [
    { key: 'getting-started', icon: <BookOpen size={18} />, label: t('help.gettingStarted') },
    { key: 'integration', icon: <Cable size={18} />, label: t('help.integrationGuide') },
    { key: 'features', icon: <Lightbulb size={18} />, label: t('help.features') },
    { key: 'lexicon', icon: <FileText size={18} />, label: t('help.glossaryTitle') },
    { key: 'faq', icon: <MessageCircleQuestion size={18} />, label: t('help.faq') },
    { key: 'shortcuts', icon: <Keyboard size={18} />, label: t('help.shortcuts') },
    { key: 'troubleshooting', icon: <RefreshCw size={18} />, label: t('help.troubleshooting') },
    { key: 'about', icon: <Info size={18} />, label: t('help.about') },
  ];

  return (
    <motion.div
      className="max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div
        className="flex items-center justify-between gap-3 mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary)]/10">
            <HelpCircle className="text-[color:var(--color-primary)]" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight fluid-text-2xl">{t('help.title')}</h1>
            <p className="text-sm text-[color:var(--color-muted)]">{t('help.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('help.searchPlaceholder')}
          aria-label={t('help.searchPlaceholder')}
          className="w-full bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[color:var(--color-text)] focus:outline-none focus:border-[color:var(--color-primary)]/70 focus:ring-2 focus:ring-[color:var(--color-primary)]/20 transition-all placeholder:text-[color:var(--color-muted)]"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="w-full lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0" role="tablist" aria-label={t('help.title')}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`help-tabpanel-${tab.key}`}
                id={`help-tab-${tab.key}`}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                    : 'text-[color:var(--color-muted)] hover:bg-white/5 hover:text-[color:var(--color-text)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* === GETTING STARTED === */}
            {activeTab === 'getting-started' && (
              <motion.div
                key="getting-started"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-getting-started"
                aria-labelledby="help-tab-getting-started"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-4">{t('help.welcomeTitle')}</h2>
                  <p className="text-[color:var(--color-muted)] leading-relaxed mb-6">{t('help.welcomeIntro')}</p>

                  {/* Quick Start Steps */}
                  <h3 className="text-lg font-medium mb-4">{t('help.quickStart')}</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: t('help.step1Title'), desc: t('help.step1Desc'), icon: <Server size={18} /> },
                      { step: 2, title: t('help.step2Title'), desc: t('help.step2Desc'), icon: <Zap size={18} /> },
                      { step: 3, title: t('help.step3Title'), desc: t('help.step3Desc'), icon: <Activity size={18} /> },
                      { step: 4, title: t('help.step4Title'), desc: t('help.step4Desc'), icon: <Sparkles size={18} /> },
                      { step: 5, title: t('help.step5Title'), desc: t('help.step5Desc'), icon: <Download size={18} /> },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4 p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] font-bold text-sm">
                          {item.step}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[color:var(--color-primary)]">{item.icon}</span>
                            <h4 className="font-medium text-sm">{item.title}</h4>
                          </div>
                          <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Requirements */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4">{t('help.requirements')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor size={16} className="text-blue-400" />
                        <h4 className="font-medium text-sm">{t('help.hardware')}</h4>
                      </div>
                      <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5">
                        <li>• Victron Cerbo GX / MK2 / Venus OS</li>
                        <li>• Raspberry Pi 4/5 ({t('help.optional')})</li>
                        <li>• KNX IP Router ({t('help.optional')})</li>
                        <li>• Node-RED {t('help.onCerbo')}</li>
                        <li>• WiFi / Ethernet</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={16} className="text-cyan-400" />
                        <h4 className="font-medium text-sm">{t('help.software')}</h4>
                      </div>
                      <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5">
                        <li>• {t('help.modernBrowser')}</li>
                        <li>• {t('help.pwaSupport')}</li>
                        <li>• Tibber / aWATTar {t('help.account')} ({t('help.optional')})</li>
                        <li>• AI API Key ({t('help.optional')})</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === INTEGRATION GUIDE === */}
            {activeTab === 'integration' && (
              <motion.div
                key="integration"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-integration"
                aria-labelledby="help-tab-integration"
              >
                {/* Intro */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-2">{t('help.integrationGuideTitle')}</h2>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{t('help.integrationGuideIntro')}</p>
                </div>

                {/* Cerbo GX / MK2 */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                      <Server size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.cerboGxTitle')}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed mb-4">{t('help.cerboGxIntro')}</p>

                  {/* Specs */}
                  <h4 className="font-medium text-sm mb-2">{t('help.cerboGxSpecs')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 mb-4 ml-4">
                    {['cerboGxSpec1','cerboGxSpec2','cerboGxSpec3','cerboGxSpec4','cerboGxSpec5','cerboGxSpec6'].map(k => (
                      <li key={k} className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />{t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* Interfaces */}
                  <h4 className="font-medium text-sm mb-2">{t('help.cerboGxInterfaces')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {['cerboGxInt1','cerboGxInt2','cerboGxInt3','cerboGxInt4','cerboGxInt5','cerboGxInt6'].map(k => (
                      <div key={k} className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2.5 text-xs text-[color:var(--color-muted)]">
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>

                  {/* Setup Steps */}
                  <h4 className="font-medium text-sm mb-2">{t('help.cerboGxSetup')}</h4>
                  <ol className="text-xs text-[color:var(--color-muted)] space-y-2 mb-4">
                    {['cerboGxSetup1','cerboGxSetup2','cerboGxSetup3','cerboGxSetup4','cerboGxSetup5','cerboGxSetup6','cerboGxSetup7'].map((k, i) => (
                      <li key={k} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] text-[10px] font-bold">{i + 1}</span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2">
                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-[color:var(--color-muted)]">{t('help.cerboGxNote')}</p>
                  </div>
                </div>

                {/* Raspberry Pi */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
                      <Cpu size={20} className="text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.rpiTitle')}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed mb-4">{t('help.rpiIntro')}</p>

                  {/* Recommended Hardware */}
                  <h4 className="font-medium text-sm mb-2">{t('help.rpiRecommended')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 mb-4 ml-4">
                    {['rpiModel','rpiPower','rpiStorage','rpiNetwork','rpiHat','rpiCan'].map(k => (
                      <li key={k} className="flex gap-2"><CheckCircle2 size={12} className="text-green-400 shrink-0 mt-0.5" />{t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* Installation Steps */}
                  <h4 className="font-medium text-sm mb-2">{t('help.rpiSetup')}</h4>
                  <ol className="text-xs text-[color:var(--color-muted)] space-y-2 mb-4">
                    {['rpiSetup1','rpiSetup2','rpiSetup3','rpiSetup4','rpiSetup5','rpiSetup6','rpiSetup7'].map((k, i) => (
                      <li key={k} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">{i + 1}</span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Performance Tips */}
                  <h4 className="font-medium text-sm mb-2">{t('help.rpiPerformance')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 mb-4 ml-4">
                    {['rpiPerf1','rpiPerf2','rpiPerf3','rpiPerf4','rpiPerf5'].map(k => (
                      <li key={k}>• {t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* Comparison Table */}
                  <h4 className="font-medium text-sm mb-2">{t('help.rpiVsGx')}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[color:var(--color-border)]">
                          <th className="text-left py-2 pr-4 text-[color:var(--color-muted)] font-medium"> </th>
                          <th className="text-left py-2 px-4 text-green-400 font-medium">{t('help.rpiVsGxRpi')}</th>
                          <th className="text-left py-2 px-4 text-blue-400 font-medium">{t('help.rpiVsGxCerbo')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-[color:var(--color-muted)]">
                        {[
                          ['rpiVsGxCost', 'rpiVsGxCostRpi', 'rpiVsGxCostCerbo'],
                          ['rpiVsGxVeBus', 'rpiVsGxVeBusRpi', 'rpiVsGxVeBusCerbo'],
                          ['rpiVsGxReliability', 'rpiVsGxReliabilityRpi', 'rpiVsGxReliabilityCerbo'],
                          ['rpiVsGxSupport', 'rpiVsGxSupportRpi', 'rpiVsGxSupportCerbo'],
                          ['rpiVsGxNodeRed', 'rpiVsGxNodeRedBoth', 'rpiVsGxNodeRedBoth'],
                          ['rpiVsGxIdeal', 'rpiVsGxIdealRpi', 'rpiVsGxIdealCerbo'],
                        ].map(([label, rpi, cerbo]) => (
                          <tr key={label} className="border-b border-[color:var(--color-border)]/50">
                            <td className="py-2 pr-4 font-medium">{t(`help.${label}`)}</td>
                            <td className="py-2 px-4">{t(`help.${rpi}`)}</td>
                            <td className="py-2 px-4">{t(`help.${cerbo}`)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Venus OS & Node-RED Architecture */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
                      <Network size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.venusTitle')}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed mb-4">{t('help.venusIntro')}</p>

                  {/* Architecture */}
                  <h4 className="font-medium text-sm mb-2">{t('help.venusArchitecture')}</h4>
                  <ol className="text-xs text-[color:var(--color-muted)] space-y-2 mb-4">
                    {['venusArch1','venusArch2','venusArch3','venusArch4','venusArch5'].map((k, i) => (
                      <li key={k} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold">{i + 1}</span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  {/* D-Bus Paths */}
                  <h4 className="font-medium text-sm mb-2">{t('help.venusDbusTitle')}</h4>
                  <div className="space-y-1.5 mb-4">
                    {['venusDbus1','venusDbus2','venusDbus3','venusDbus4','venusDbus5','venusDbus6','venusDbus7'].map(k => (
                      <div key={k} className="rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border)] p-2 text-xs font-mono text-[color:var(--color-muted)]">
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>

                  {/* Node-RED Flow */}
                  <h4 className="font-medium text-sm mb-2">{t('help.venusNodeRed')}</h4>
                  <p className="text-xs text-[color:var(--color-muted)] leading-relaxed mb-3">{t('help.venusNodeRedDesc')}</p>
                  <h4 className="font-medium text-sm mb-2">{t('help.venusNodeRedFlows')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 mb-4 ml-4">
                    {['venusFlow1','venusFlow2','venusFlow3','venusFlow4','venusFlow5'].map(k => (
                      <li key={k}>• {t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* MQTT Topics */}
                  <h4 className="font-medium text-sm mb-2">{t('help.venusMqttTopics')}</h4>
                  <div className="space-y-1.5">
                    {['venusMqtt1','venusMqtt2','venusMqtt3','venusMqtt4','venusMqtt5'].map(k => (
                      <div key={k} className="rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border)] p-2 text-xs font-mono text-[color:var(--color-muted)]">
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* KNX Integration */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                      <Lightbulb size={20} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.knxTitle')}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed mb-4">{t('help.knxIntro')}</p>

                  {/* Architecture */}
                  <h4 className="font-medium text-sm mb-2">{t('help.knxArchitecture')}</h4>
                  <ol className="text-xs text-[color:var(--color-muted)] space-y-2 mb-4">
                    {['knxArch1','knxArch2','knxArch3','knxArch4'].map((k, i) => (
                      <li key={k} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">{i + 1}</span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Group Addresses */}
                  <h4 className="font-medium text-sm mb-2">{t('help.knxGroupAddresses')}</h4>
                  <div className="space-y-1.5 mb-4">
                    {['knxGA1','knxGA2','knxGA3','knxGA4','knxGA5'].map(k => (
                      <div key={k} className="rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border)] p-2 text-xs font-mono text-[color:var(--color-muted)]">
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>

                  {/* Best Practices */}
                  <h4 className="font-medium text-sm mb-2">{t('help.knxBestPractices')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 ml-4">
                    {['knxBP1','knxBP2','knxBP3','knxBP4','knxBP5'].map(k => (
                      <li key={k}>• {t(`help.${k}`)}</li>
                    ))}
                  </ul>
                </div>

                {/* High-End Configuration */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                      <HardDrive size={20} className="text-rose-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.highEndTitle')}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed mb-4">{t('help.highEndIntro')}</p>

                  {/* Hardware */}
                  <h4 className="font-medium text-sm mb-2">{t('help.highEndHardware')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 mb-4 ml-4">
                    {['highEndHW1','highEndHW2','highEndHW3','highEndHW4','highEndHW5','highEndHW6','highEndHW7','highEndHW8','highEndHW9'].map(k => (
                      <li key={k} className="flex gap-2"><CheckCircle2 size={12} className="text-rose-400 shrink-0 mt-0.5" />{t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* Software */}
                  <h4 className="font-medium text-sm mb-2">{t('help.highEndSoftware')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 mb-4 ml-4">
                    {['highEndSW1','highEndSW2','highEndSW3','highEndSW4','highEndSW5'].map(k => (
                      <li key={k} className="flex gap-2"><CheckCircle2 size={12} className="text-purple-400 shrink-0 mt-0.5" />{t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* Network */}
                  <h4 className="font-medium text-sm mb-2">{t('help.highEndNetwork')}</h4>
                  <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5 ml-4">
                    {['highEndNet1','highEndNet2','highEndNet3','highEndNet4','highEndNet5'].map(k => (
                      <li key={k} className="flex gap-2"><Shield size={12} className="text-cyan-400 shrink-0 mt-0.5" />{t(`help.${k}`)}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* === FEATURES === */}
            {activeTab === 'features' && (
              <motion.div
                key="features"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-features"
                aria-labelledby="help-tab-features"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6">{t('help.allFeatures')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FeatureCard
                      icon={<Activity size={20} className="text-emerald-400" />}
                      title={t('help.featureSankey')}
                      description={t('help.featureSankeyDesc')}
                      color="bg-emerald-500/15"
                    />
                    <FeatureCard
                      icon={<Map size={20} className="text-blue-400" />}
                      title={t('help.featureFloorplan')}
                      description={t('help.featureFloorplanDesc')}
                      color="bg-blue-500/15"
                    />
                    <FeatureCard
                      icon={<Sparkles size={20} className="text-purple-400" />}
                      title={t('help.featureAI')}
                      description={t('help.featureAIDesc')}
                      color="bg-purple-500/15"
                    />
                    <FeatureCard
                      icon={<Car size={20} className="text-amber-400" />}
                      title={t('help.featureEV')}
                      description={t('help.featureEVDesc')}
                      color="bg-amber-500/15"
                    />
                    <FeatureCard
                      icon={<TrendingUp size={20} className="text-rose-400" />}
                      title={t('help.featureTariffs')}
                      description={t('help.featureTariffsDesc')}
                      color="bg-rose-500/15"
                    />
                    <FeatureCard
                      icon={<Sun size={20} className="text-yellow-400" />}
                      title={t('help.featureForecast')}
                      description={t('help.featureForecastDesc')}
                      color="bg-yellow-500/15"
                    />
                    <FeatureCard
                      icon={<Battery size={20} className="text-green-400" />}
                      title={t('help.featureBattery')}
                      description={t('help.featureBatteryDesc')}
                      color="bg-green-500/15"
                    />
                    <FeatureCard
                      icon={<BarChart3 size={20} className="text-indigo-400" />}
                      title={t('help.featureAnalytics')}
                      description={t('help.featureAnalyticsDesc')}
                      color="bg-indigo-500/15"
                    />
                    <FeatureCard
                      icon={<Home size={20} className="text-teal-400" />}
                      title={t('help.featureHA')}
                      description={t('help.featureHADesc')}
                      color="bg-teal-500/15"
                    />
                    <FeatureCard
                      icon={<Mic size={20} className="text-pink-400" />}
                      title={t('help.featureVoice')}
                      description={t('help.featureVoiceDesc')}
                      color="bg-pink-500/15"
                    />
                    <FeatureCard
                      icon={<WifiOff size={20} className="text-orange-400" />}
                      title={t('help.featureOffline')}
                      description={t('help.featureOfflineDesc')}
                      color="bg-orange-500/15"
                    />
                    <FeatureCard
                      icon={<Shield size={20} className="text-red-400" />}
                      title={t('help.featureSecurity')}
                      description={t('help.featureSecurityDesc')}
                      color="bg-red-500/15"
                    />
                  </div>
                </div>

                {/* Supported Protocols */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4">{t('help.protocols')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Modbus TCP', 'MQTT', 'KNX/IP', 'WebSocket', 'OCPP 2.1', 'SunSpec', 'EEBus', 'SG Ready', 'VE.Bus', 'Tibber API', 'aWATTar API', 'Open-Meteo API'].map((proto) => (
                      <span key={proto} className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-medium">
                        {proto}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* === GLOSSARY === */}
            {activeTab === 'lexicon' && (
              <motion.div
                key="lexicon"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-lexicon"
                aria-labelledby="help-tab-lexicon"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6">{t('help.glossaryTitle')}</h2>
                  <dl className="space-y-4">
                    {[
                      { term: t('help.hems'), desc: t('help.hemsDesc') },
                      { term: t('help.ess'), desc: t('help.essDesc') },
                      { term: t('help.sgReady'), desc: t('help.sgReadyDesc') },
                      { term: t('help.enwg'), desc: t('help.enwgDesc') },
                      { term: t('help.knx'), desc: t('help.knxDesc') },
                      { term: t('help.soc'), desc: t('help.socDesc') },
                      { term: t('help.glossMppt'), desc: t('help.glossMpptDesc') },
                      { term: t('help.glossEms'), desc: t('help.glossEmsDesc') },
                      { term: t('help.glossFeedIn'), desc: t('help.glossFeedInDesc') },
                      { term: t('help.glossSector'), desc: t('help.glossSectorDesc') },
                      { term: t('help.glossModbus'), desc: t('help.glossModbusDesc') },
                      { term: t('help.glossOcpp'), desc: t('help.glossOcppDesc') },
                      { term: t('help.glossPwa'), desc: t('help.glossPwaDesc') },
                      { term: t('help.glossVenusOs'), desc: t('help.glossVenusOsDesc') },
                      { term: t('help.glossDbus'), desc: t('help.glossDbusDesc') },
                      { term: t('help.glossNodeRed'), desc: t('help.glossNodeRedDesc') },
                      { term: t('help.glossCerboGx'), desc: t('help.glossCerboGxDesc') },
                      { term: t('help.glossV2x'), desc: t('help.glossV2xDesc') },
                    ].map((item, i) => (
                      <div key={i} className="border-b border-[color:var(--color-border)] pb-4 last:border-0">
                        <dt className="font-medium text-[color:var(--color-primary)] text-sm">{item.term}</dt>
                        <dd className="text-sm text-[color:var(--color-muted)] mt-1 leading-relaxed">{item.desc}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            )}

            {/* === FAQ === */}
            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-faq"
                aria-labelledby="help-tab-faq"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6">{t('help.faqTitle')}</h2>

                  {/* General */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqGeneral')}</h3>
                  <div className="space-y-3 mb-6">
                    <AccordionItem title={t('help.faqWhatIs')} defaultOpen>
                      {t('help.faqWhatIsAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqPowerOutage')}>
                      {t('help.faqPowerOutageAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqOffline')}>
                      {t('help.faqOfflineAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqCerboVsRpi')}>
                      {t('help.faqCerboVsRpiAnswer')}
                    </AccordionItem>
                  </div>

                  {/* Energy & Tariffs */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqEnergySection')}</h3>
                  <div className="space-y-3 mb-6">
                    <AccordionItem title={t('help.faqEnwg')}>
                      {t('help.faqEnwgAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqTariff')}>
                      {t('help.faqTariffAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqSgReady')}>
                      {t('help.faqSgReadyAnswer')}
                    </AccordionItem>
                  </div>

                  {/* Security */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqSecuritySection')}</h3>
                  <div className="space-y-3 mb-6">
                    <AccordionItem title={t('help.faqSecurity')}>
                      {t('help.faqSecurityAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqDataStorage')}>
                      {t('help.faqDataStorageAnswer')}
                    </AccordionItem>
                  </div>

                  {/* Technical */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqTechnical')}</h3>
                  <div className="space-y-3">
                    <AccordionItem title={t('help.faqBrowsers')}>
                      {t('help.faqBrowsersAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqMobile')}>
                      {t('help.faqMobileAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqApi')}>
                      {t('help.faqApiAnswer')}
                    </AccordionItem>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === KEYBOARD SHORTCUTS === */}
            {activeTab === 'shortcuts' && (
              <motion.div
                key="shortcuts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-shortcuts"
                aria-labelledby="help-tab-shortcuts"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6">{t('help.keyboardShortcuts')}</h2>
                  <div className="space-y-6">
                    {/* Navigation */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.shortcutNav')}</h3>
                      <div className="space-y-2">
                        {[
                          { keys: ['⌘', 'K'], desc: t('help.shortcutCmdK') },
                          { keys: ['⌘', '/'], desc: t('help.shortcutSearch') },
                          { keys: ['Esc'], desc: t('help.shortcutClose') },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border)]">
                            <span className="text-sm">{s.desc}</span>
                            <div className="flex items-center gap-1">
                              {s.keys.map((k, j) => (
                                <kbd key={j} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-2 py-1 text-xs font-mono">{k}</kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.shortcutActions')}</h3>
                      <div className="space-y-2">
                        {[
                          { keys: ['⌘', 'S'], desc: t('help.shortcutSave') },
                          { keys: ['⌘', 'E'], desc: t('help.shortcutExport') },
                          { keys: ['⌘', 'L'], desc: t('help.shortcutLang') },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border)]">
                            <span className="text-sm">{s.desc}</span>
                            <div className="flex items-center gap-1">
                              {s.keys.map((k, j) => (
                                <kbd key={j} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-2 py-1 text-xs font-mono">{k}</kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Platform */}
                    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 flex items-start gap-3">
                      <Info size={16} className="text-[color:var(--color-primary)] shrink-0 mt-0.5" />
                      <p className="text-xs text-[color:var(--color-muted)]">
                        {t('help.shortcutNote')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Voice Commands */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mic size={20} className="text-pink-400" />
                    {t('help.voiceCommands')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { cmd: t('voice.exampleTheme'), desc: t('voice.cmdThemeDesc') },
                      { cmd: t('voice.exampleEv'), desc: t('voice.cmdEvDesc') },
                      { cmd: t('voice.exampleStatus'), desc: t('help.showStatus') },
                      { cmd: `"${t('voice.cmdDashboard')}"`, desc: t('voice.cmdDashboardDesc') },
                      { cmd: `"${t('voice.cmdSettings')}"`, desc: t('voice.cmdSettingsDesc') },
                      { cmd: `"${t('voice.cmdHelp')}"`, desc: t('voice.cmdHelpDesc') },
                    ].map((vc, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[color:var(--color-surface)] border border-[color:var(--color-border)]">
                        <Mic size={14} className="text-pink-400 shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-mono text-[color:var(--color-primary)]">{vc.cmd}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{vc.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* === TROUBLESHOOTING === */}
            {activeTab === 'troubleshooting' && (
              <motion.div
                key="troubleshooting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-troubleshooting"
                aria-labelledby="help-tab-troubleshooting"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6">{t('help.troubleshootingTitle')}</h2>
                  <div className="space-y-3">
                    <AccordionItem title={t('help.troubleConnection')} defaultOpen>
                      <ul className="space-y-2">
                        <li>1. {t('help.troubleConn1')}</li>
                        <li>2. {t('help.troubleConn2')}</li>
                        <li>3. {t('help.troubleConn3')}</li>
                        <li>4. {t('help.troubleConn4')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troubleNoData')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troubleData1')}</li>
                        <li>• {t('help.troubleData2')}</li>
                        <li>• {t('help.troubleData3')}</li>
                        <li>• {t('help.troubleData4')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troublePwa')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troublePwa1')}</li>
                        <li>• {t('help.troublePwa2')}</li>
                        <li>• {t('help.troublePwa3')}</li>
                        <li>• {t('help.troublePwa4')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troubleKnx')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troubleKnx1')}</li>
                        <li>• {t('help.troubleKnx2')}</li>
                        <li>• {t('help.troubleKnx3')}</li>
                        <li>• {t('help.troubleKnx4')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troubleAi')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troubleAi1')}</li>
                        <li>• {t('help.troubleAi2')}</li>
                        <li>• {t('help.troubleAi3')}</li>
                        <li>• {t('help.troubleAi4')}</li>
                      </ul>
                    </AccordionItem>
                  </div>
                </div>

                {/* Performance Tips */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Gauge size={20} className="text-indigo-400" />
                    {t('help.perfTips')}
                  </h3>
                  <div className="space-y-3 text-sm text-[color:var(--color-muted)]">
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf1')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf2')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf3')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf4')}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === ABOUT === */}
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="help-tabpanel-about"
                aria-labelledby="help-tab-about"
              >
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[color:var(--color-primary)]/15 rounded-2xl flex items-center justify-center border border-[color:var(--color-primary)]/30">
                      <Zap size={32} className="text-[color:var(--color-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('common.appName')}</h2>
                      <p className="text-[color:var(--color-muted)] text-sm">{t('help.versionFull')}</p>
                    </div>
                  </div>

                  <p className="text-[color:var(--color-muted)] leading-relaxed mb-6">{t('help.aboutDesc')}</p>

                  {/* Tech Stack */}
                  <div className="border-t border-[color:var(--color-border)] pt-6">
                    <h3 className="font-medium mb-4">{t('help.techStack')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { category: 'Frontend', items: 'React 19, TypeScript, Vite, Tailwind CSS' },
                        { category: 'State', items: 'Zustand, React Query, Dexie.js' },
                        { category: t('help.visualization'), items: 'D3.js Sankey, Recharts, Framer Motion' },
                        { category: 'Backend', items: 'Node.js, Express, WebSockets, MQTT' },
                        { category: 'AI', items: 'Google Gemini 2.5, OpenAI, Anthropic' },
                        { category: 'PWA', items: 'Workbox, Service Worker, Background Sync' },
                        { category: t('help.protocols'), items: 'Modbus, MQTT, KNX/IP, OCPP, EEBus' },
                        { category: t('help.testing'), items: 'Vitest, Playwright, axe-core (a11y)' },
                      ].map((tech) => (
                        <div key={tech.category} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-primary)] mb-1">{tech.category}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{tech.items}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div className="border-t border-[color:var(--color-border)] pt-6 mt-6">
                    <h3 className="font-medium mb-3">{t('help.a11yTitle')}</h3>
                    <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{t('help.a11yDesc')}</p>
                  </div>

                  {/* License */}
                  <div className="border-t border-[color:var(--color-border)] pt-6 mt-6">
                    <h3 className="font-medium mb-3">{t('help.license')}</h3>
                    <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{t('help.licenseDesc')}</p>
                  </div>

                  {/* Credits */}
                  <div className="border-t border-[color:var(--color-border)] pt-6 mt-6">
                    <h3 className="font-medium mb-3">{t('help.credits')}</h3>
                    <div className="text-sm text-[color:var(--color-muted)] space-y-1">
                      <p>• Victron Energy — Cerbo GX, VE.Bus, Venus OS</p>
                      <p>• KNX Association — KNX/IP building automation standard</p>
                      <p>• Tibber & aWATTar — Dynamic electricity tariff APIs</p>
                      <p>• D3.js — Data-driven visualization library</p>
                      <p>• Google — Gemini 2.5 AI model</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
