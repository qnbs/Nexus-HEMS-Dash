import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
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
  Shield,
  WifiOff,
  Download,
  Keyboard,
  Monitor,
  Globe,
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
  Github,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type HelpTab =
  | 'getting-started'
  | 'integration'
  | 'features'
  | 'lexicon'
  | 'faq'
  | 'shortcuts'
  | 'troubleshooting'
  | 'about';

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
      <button
        onClick={() => setOpen(!open)}
        className="focus-ring flex w-full cursor-pointer items-center justify-between p-4 text-left text-sm font-medium text-(--color-text) transition-colors hover:bg-white/5"
        aria-expanded={open}
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-(--color-muted)" />
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
            <div className="px-4 pb-4 text-sm leading-relaxed text-(--color-muted)">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  link?: string;
}) {
  const content = (
    <motion.div
      className={`glass-panel rounded-xl border border-(--color-border) p-5 transition-all hover:border-(--color-primary)/30 ${link ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-(--color-muted)">{description}</p>
      {link && (
        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-(--color-primary)">
          <ExternalLink size={10} aria-hidden="true" />
          Öffnen
        </span>
      )}
    </motion.div>
  );

  if (link) {
    return (
      <Link to={link} className="focus-ring block rounded-xl">
        {content}
      </Link>
    );
  }
  return content;
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
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div
        className="mb-8 flex items-center justify-between gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-primary)/10">
            <HelpCircle className="text-(--color-primary)" size={22} />
          </div>
          <div>
            <h1 className="fluid-text-2xl text-2xl font-semibold tracking-tight">
              {t('help.title')}
            </h1>
            <p className="text-sm text-(--color-muted)">{t('help.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('help.searchPlaceholder')}
          aria-label={t('help.searchPlaceholder')}
          className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) py-3 pr-4 pl-11 text-sm text-(--color-text) transition-all placeholder:text-(--color-muted) focus:border-(--color-primary)/70 focus:ring-2 focus:ring-(--color-primary)/20 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="w-full shrink-0 lg:w-56">
          <div
            className="scrollbar-hide flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            role="tablist"
            aria-label={t('help.title')}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`help-tabpanel-${tab.key}`}
                id={`help-tab-${tab.key}`}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${
                  activeTab === tab.key
                    ? 'bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                    : 'text-(--color-muted) hover:bg-white/5 hover:text-(--color-text)'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="fluid-text-xl mb-4 text-xl font-semibold">
                    {t('help.welcomeTitle')}
                  </h2>
                  <p className="mb-6 leading-relaxed text-(--color-muted)">
                    {t('help.welcomeIntro')}
                  </p>

                  {/* Quick Start Steps */}
                  <h3 className="fluid-text-lg mb-4 text-lg font-medium">{t('help.quickStart')}</h3>
                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: t('help.step1Title'),
                        desc: t('help.step1Desc'),
                        icon: <Server size={18} />,
                        link: '/settings?tab=system',
                      },
                      {
                        step: 2,
                        title: t('help.step2Title'),
                        desc: t('help.step2Desc'),
                        icon: <Zap size={18} />,
                        link: '/settings?tab=energy',
                      },
                      {
                        step: 3,
                        title: t('help.step3Title'),
                        desc: t('help.step3Desc'),
                        icon: <Activity size={18} />,
                        link: '/monitoring',
                      },
                      {
                        step: 4,
                        title: t('help.step4Title'),
                        desc: t('help.step4Desc'),
                        icon: <Sparkles size={18} />,
                        link: '/settings/ai',
                      },
                      {
                        step: 5,
                        title: t('help.step5Title'),
                        desc: t('help.step5Desc'),
                        icon: <Download size={18} />,
                        link: '/',
                      },
                    ].map((item) => (
                      <Link
                        key={item.step}
                        to={item.link}
                        className="focus-ring flex gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-primary)/40 hover:bg-white/5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--color-primary)/15 text-sm font-bold text-(--color-primary)">
                          {item.step}
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-(--color-primary)">{item.icon}</span>
                            <h4 className="text-sm font-medium">{item.title}</h4>
                          </div>
                          <p className="text-xs leading-relaxed text-(--color-muted)">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* System Requirements */}
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h3 className="fluid-text-lg mb-4 text-lg font-medium">
                    {t('help.requirements')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Monitor size={16} className="text-blue-400" />
                        <h4 className="text-sm font-medium">{t('help.hardware')}</h4>
                      </div>
                      <ul className="space-y-1.5 text-xs text-(--color-muted)">
                        <li>• Victron Cerbo GX / MK2 / Venus OS</li>
                        <li>• Raspberry Pi 4/5 ({t('help.optional')})</li>
                        <li>• KNX IP Router ({t('help.optional')})</li>
                        <li>• Node-RED {t('help.onCerbo')}</li>
                        <li>• WiFi / Ethernet</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Globe size={16} className="text-cyan-400" />
                        <h4 className="text-sm font-medium">{t('help.software')}</h4>
                      </div>
                      <ul className="space-y-1.5 text-xs text-(--color-muted)">
                        <li>• {t('help.modernBrowser')}</li>
                        <li>• {t('help.pwaSupport')}</li>
                        <li>
                          • Tibber / aWATTar {t('help.account')} ({t('help.optional')})
                        </li>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="fluid-text-xl mb-2 text-xl font-semibold">
                    {t('help.integrationGuideTitle')}
                  </h2>
                  <p className="text-sm leading-relaxed text-(--color-muted)">
                    {t('help.integrationGuideIntro')}
                  </p>
                </div>

                {/* Cerbo GX / MK2 */}
                <div className="glass-panel-strong rounded-2xl p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                      <Server size={20} className="text-blue-400" />
                    </div>
                    <h3 className="fluid-text-lg text-lg font-semibold">
                      {t('help.cerboGxTitle')}
                    </h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-(--color-muted)">
                    {t('help.cerboGxIntro')}
                  </p>

                  {/* Specs */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.cerboGxSpecs')}</h4>
                  <ul className="mb-4 ml-4 space-y-1.5 text-xs text-(--color-muted)">
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
                  <h4 className="mb-2 text-sm font-medium">{t('help.cerboGxInterfaces')}</h4>
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
                        className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2.5 text-xs text-(--color-muted)"
                      >
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>

                  {/* Setup Steps */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.cerboGxSetup')}</h4>
                  <ol className="mb-4 space-y-2 text-xs text-(--color-muted)">
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
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/15 text-[10px] font-bold text-(--color-primary)">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                    <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
                    <p className="text-xs text-(--color-muted)">{t('help.cerboGxNote')}</p>
                  </div>
                </div>

                {/* Raspberry Pi */}
                <div className="glass-panel-strong rounded-2xl p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
                      <Cpu size={20} className="text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.rpiTitle')}</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-(--color-muted)">
                    {t('help.rpiIntro')}
                  </p>

                  {/* Recommended Hardware */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.rpiRecommended')}</h4>
                  <ul className="mb-4 ml-4 space-y-1.5 text-xs text-(--color-muted)">
                    {['rpiModel', 'rpiPower', 'rpiStorage', 'rpiNetwork', 'rpiHat', 'rpiCan'].map(
                      (k) => (
                        <li key={k} className="flex gap-2">
                          <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-green-400" />
                          {t(`help.${k}`)}
                        </li>
                      ),
                    )}
                  </ul>

                  {/* Installation Steps */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.rpiSetup')}</h4>
                  <ol className="mb-4 space-y-2 text-xs text-(--color-muted)">
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
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-[10px] font-bold text-green-400">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Performance Tips */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.rpiPerformance')}</h4>
                  <ul className="mb-4 ml-4 space-y-1.5 text-xs text-(--color-muted)">
                    {['rpiPerf1', 'rpiPerf2', 'rpiPerf3', 'rpiPerf4', 'rpiPerf5'].map((k) => (
                      <li key={k}>• {t(`help.${k}`)}</li>
                    ))}
                  </ul>

                  {/* Comparison Table */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.rpiVsGx')}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--color-border)">
                          <th className="py-2 pr-4 text-left font-medium text-(--color-muted)">
                            {' '}
                          </th>
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
                          [
                            'rpiVsGxReliability',
                            'rpiVsGxReliabilityRpi',
                            'rpiVsGxReliabilityCerbo',
                          ],
                          ['rpiVsGxSupport', 'rpiVsGxSupportRpi', 'rpiVsGxSupportCerbo'],
                          ['rpiVsGxNodeRed', 'rpiVsGxNodeRedBoth', 'rpiVsGxNodeRedBoth'],
                          ['rpiVsGxIdeal', 'rpiVsGxIdealRpi', 'rpiVsGxIdealCerbo'],
                        ].map(([label, rpi, cerbo]) => (
                          <tr key={label} className="border-b border-(--color-border)/50">
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
                    <h3 className="text-lg font-semibold">{t('help.venusTitle')}</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-(--color-muted)">
                    {t('help.venusIntro')}
                  </p>

                  {/* Architecture */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.venusArchitecture')}</h4>
                  <ol className="mb-4 space-y-2 text-xs text-(--color-muted)">
                    {['venusArch1', 'venusArch2', 'venusArch3', 'venusArch4', 'venusArch5'].map(
                      (k, i) => (
                        <li key={k} className="flex gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px] font-bold text-purple-400">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{t(`help.${k}`)}</span>
                        </li>
                      ),
                    )}
                  </ol>

                  {/* D-Bus Paths */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.venusDbusTitle')}</h4>
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
                        className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 font-mono text-xs text-(--color-muted)"
                      >
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>

                  {/* Node-RED Flow */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.venusNodeRed')}</h4>
                  <p className="mb-3 text-xs leading-relaxed text-(--color-muted)">
                    {t('help.venusNodeRedDesc')}
                  </p>
                  <h4 className="mb-2 text-sm font-medium">{t('help.venusNodeRedFlows')}</h4>
                  <ul className="mb-4 ml-4 space-y-1.5 text-xs text-(--color-muted)">
                    {['venusFlow1', 'venusFlow2', 'venusFlow3', 'venusFlow4', 'venusFlow5'].map(
                      (k) => (
                        <li key={k}>• {t(`help.${k}`)}</li>
                      ),
                    )}
                  </ul>

                  {/* MQTT Topics */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.venusMqttTopics')}</h4>
                  <div className="space-y-1.5">
                    {['venusMqtt1', 'venusMqtt2', 'venusMqtt3', 'venusMqtt4', 'venusMqtt5'].map(
                      (k) => (
                        <div
                          key={k}
                          className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 font-mono text-xs text-(--color-muted)"
                        >
                          {t(`help.${k}`)}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* KNX Integration */}
                <div className="glass-panel-strong rounded-2xl p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                      <Lightbulb size={20} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('help.knxTitle')}</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-(--color-muted)">
                    {t('help.knxIntro')}
                  </p>

                  {/* Architecture */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.knxArchitecture')}</h4>
                  <ol className="mb-4 space-y-2 text-xs text-(--color-muted)">
                    {['knxArch1', 'knxArch2', 'knxArch3', 'knxArch4'].map((k, i) => (
                      <li key={k} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-400">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{t(`help.${k}`)}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Group Addresses */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.knxGroupAddresses')}</h4>
                  <div className="mb-4 space-y-1.5">
                    {['knxGA1', 'knxGA2', 'knxGA3', 'knxGA4', 'knxGA5'].map((k) => (
                      <div
                        key={k}
                        className="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 font-mono text-xs text-(--color-muted)"
                      >
                        {t(`help.${k}`)}
                      </div>
                    ))}
                  </div>

                  {/* Best Practices */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.knxBestPractices')}</h4>
                  <ul className="ml-4 space-y-1.5 text-xs text-(--color-muted)">
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
                    <h3 className="text-lg font-semibold">{t('help.highEndTitle')}</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-(--color-muted)">
                    {t('help.highEndIntro')}
                  </p>

                  {/* Hardware */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.highEndHardware')}</h4>
                  <ul className="mb-4 ml-4 space-y-1.5 text-xs text-(--color-muted)">
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
                  <h4 className="mb-2 text-sm font-medium">{t('help.highEndSoftware')}</h4>
                  <ul className="mb-4 ml-4 space-y-1.5 text-xs text-(--color-muted)">
                    {['highEndSW1', 'highEndSW2', 'highEndSW3', 'highEndSW4', 'highEndSW5'].map(
                      (k) => (
                        <li key={k} className="flex gap-2">
                          <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-purple-400" />
                          {t(`help.${k}`)}
                        </li>
                      ),
                    )}
                  </ul>

                  {/* Network */}
                  <h4 className="mb-2 text-sm font-medium">{t('help.highEndNetwork')}</h4>
                  <ul className="ml-4 space-y-1.5 text-xs text-(--color-muted)">
                    {[
                      'highEndNet1',
                      'highEndNet2',
                      'highEndNet3',
                      'highEndNet4',
                      'highEndNet5',
                    ].map((k) => (
                      <li key={k} className="flex gap-2">
                        <Shield size={12} className="mt-0.5 shrink-0 text-cyan-400" />
                        {t(`help.${k}`)}
                      </li>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="mb-6 text-xl font-semibold">{t('help.allFeatures')}</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FeatureCard
                      icon={<Activity size={20} className="text-emerald-400" />}
                      title={t('help.featureSankey')}
                      description={t('help.featureSankeyDesc')}
                      color="bg-emerald-500/15"
                      link="/energy-flow"
                    />
                    <FeatureCard
                      icon={<Map size={20} className="text-blue-400" />}
                      title={t('help.featureFloorplan')}
                      description={t('help.featureFloorplanDesc')}
                      color="bg-blue-500/15"
                      link="/floorplan"
                    />
                    <FeatureCard
                      icon={<Sparkles size={20} className="text-purple-400" />}
                      title={t('help.featureAI')}
                      description={t('help.featureAIDesc')}
                      color="bg-purple-500/15"
                      link="/ai-optimizer"
                    />
                    <FeatureCard
                      icon={<Car size={20} className="text-amber-400" />}
                      title={t('help.featureEV')}
                      description={t('help.featureEVDesc')}
                      color="bg-amber-500/15"
                      link="/ev"
                    />
                    <FeatureCard
                      icon={<TrendingUp size={20} className="text-rose-400" />}
                      title={t('help.featureTariffs')}
                      description={t('help.featureTariffsDesc')}
                      color="bg-rose-500/15"
                      link="/tariffs"
                    />
                    <FeatureCard
                      icon={<Sun size={20} className="text-yellow-400" />}
                      title={t('help.featureForecast')}
                      description={t('help.featureForecastDesc')}
                      color="bg-yellow-500/15"
                      link="/production"
                    />
                    <FeatureCard
                      icon={<Battery size={20} className="text-green-400" />}
                      title={t('help.featureBattery')}
                      description={t('help.featureBatteryDesc')}
                      color="bg-green-500/15"
                      link="/storage"
                    />
                    <FeatureCard
                      icon={<BarChart3 size={20} className="text-indigo-400" />}
                      title={t('help.featureAnalytics')}
                      description={t('help.featureAnalyticsDesc')}
                      color="bg-indigo-500/15"
                      link="/analytics"
                    />
                    <FeatureCard
                      icon={<Home size={20} className="text-teal-400" />}
                      title={t('help.featureHA')}
                      description={t('help.featureHADesc')}
                      color="bg-teal-500/15"
                      link="/consumption"
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h3 className="mb-4 text-lg font-medium">{t('help.protocols')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Modbus TCP',
                      'MQTT',
                      'KNX/IP',
                      'WebSocket',
                      'OCPP 2.1',
                      'SunSpec',
                      'EEBus',
                      'SG Ready',
                      'VE.Bus',
                      'Tibber API',
                      'aWATTar API',
                      'Open-Meteo API',
                    ].map((proto) => (
                      <span
                        key={proto}
                        className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-xs font-medium"
                      >
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="mb-6 text-xl font-semibold">{t('help.glossaryTitle')}</h2>
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
                      <div key={i} className="border-b border-(--color-border) pb-4 last:border-0">
                        <dt className="text-sm font-medium text-(--color-primary)">{item.term}</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-(--color-muted)">
                          {item.desc}
                        </dd>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="mb-6 text-xl font-semibold">{t('help.faqTitle')}</h2>

                  {/* General */}
                  <h3 className="mb-3 text-sm font-semibold tracking-widest text-(--color-muted) uppercase">
                    {t('help.faqGeneral')}
                  </h3>
                  <div className="mb-6 space-y-3">
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
                  <h3 className="mb-3 text-sm font-semibold tracking-widest text-(--color-muted) uppercase">
                    {t('help.faqEnergySection')}
                  </h3>
                  <div className="mb-6 space-y-3">
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
                  <h3 className="mb-3 text-sm font-semibold tracking-widest text-(--color-muted) uppercase">
                    {t('help.faqSecuritySection')}
                  </h3>
                  <div className="mb-6 space-y-3">
                    <AccordionItem title={t('help.faqSecurity')}>
                      {t('help.faqSecurityAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqDataStorage')}>
                      {t('help.faqDataStorageAnswer')}
                    </AccordionItem>
                  </div>

                  {/* Technical */}
                  <h3 className="mb-3 text-sm font-semibold tracking-widest text-(--color-muted) uppercase">
                    {t('help.faqTechnical')}
                  </h3>
                  <div className="space-y-3">
                    <AccordionItem title={t('help.faqBrowsers')}>
                      {t('help.faqBrowsersAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqMobile')}>
                      {t('help.faqMobileAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqApi')}>{t('help.faqApiAnswer')}</AccordionItem>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="mb-6 text-xl font-semibold">{t('help.keyboardShortcuts')}</h2>
                  <div className="space-y-6">
                    {/* Navigation */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold tracking-widest text-(--color-muted) uppercase">
                        {t('help.shortcutNav')}
                      </h3>
                      <div className="space-y-2">
                        {[
                          { keys: ['⌘', 'K'], desc: t('help.shortcutCmdK') },
                          { keys: ['⌘', '/'], desc: t('help.shortcutSearch') },
                          { keys: ['Esc'], desc: t('help.shortcutClose') },
                        ].map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-surface) p-3"
                          >
                            <span className="text-sm">{s.desc}</span>
                            <div className="flex items-center gap-1">
                              {s.keys.map((k, j) => (
                                <kbd
                                  key={j}
                                  className="rounded-md border border-(--color-border) bg-(--color-surface-strong) px-2 py-1 font-mono text-xs"
                                >
                                  {k}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold tracking-widest text-(--color-muted) uppercase">
                        {t('help.shortcutActions')}
                      </h3>
                      <div className="space-y-2">
                        {[
                          { keys: ['⌘', 'S'], desc: t('help.shortcutSave') },
                          { keys: ['⌘', 'E'], desc: t('help.shortcutExport') },
                          { keys: ['⌘', 'L'], desc: t('help.shortcutLang') },
                        ].map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-surface) p-3"
                          >
                            <span className="text-sm">{s.desc}</span>
                            <div className="flex items-center gap-1">
                              {s.keys.map((k, j) => (
                                <kbd
                                  key={j}
                                  className="rounded-md border border-(--color-border) bg-(--color-surface-strong) px-2 py-1 font-mono text-xs"
                                >
                                  {k}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Platform */}
                    <div className="flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                      <Info size={16} className="mt-0.5 shrink-0 text-(--color-primary)" />
                      <p className="text-xs text-(--color-muted)">{t('help.shortcutNote')}</p>
                    </div>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h2 className="mb-6 text-xl font-semibold">{t('help.troubleshootingTitle')}</h2>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                    <Gauge size={20} className="text-indigo-400" />
                    {t('help.perfTips')}
                  </h3>
                  <div className="space-y-3 text-sm text-(--color-muted)">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-(--color-primary)">•</span>
                      <p>{t('help.perf1')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-(--color-primary)">•</span>
                      <p>{t('help.perf2')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-(--color-primary)">•</span>
                      <p>{t('help.perf3')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-(--color-primary)">•</span>
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
                <div className="glass-panel-strong rounded-2xl p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/15">
                      <Zap size={32} className="text-(--color-primary)" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('common.appName')}</h2>
                      <p className="text-sm text-(--color-muted)">{t('help.versionFull')}</p>
                    </div>
                  </div>

                  <p className="mb-6 leading-relaxed text-(--color-muted)">{t('help.aboutDesc')}</p>

                  {/* GitHub Repository */}
                  <a
                    href="https://github.com/qnbs/Nexus-HEMS-Dash"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring mb-6 inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-(--color-primary)/40 hover:bg-(--color-primary)/10 hover:text-(--color-primary)"
                  >
                    <Github size={18} aria-hidden="true" />
                    <span>GitHub Repository</span>
                    <ExternalLink size={14} className="text-(--color-muted)" aria-hidden="true" />
                  </a>

                  {/* Tech Stack */}
                  <div className="border-t border-(--color-border) pt-6">
                    <h3 className="mb-4 font-medium">{t('help.techStack')}</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { category: 'Frontend', items: 'React 19, TypeScript, Vite, Tailwind CSS' },
                        { category: 'State', items: 'Zustand, React Query, Dexie.js' },
                        {
                          category: t('help.visualization'),
                          items: 'D3.js Sankey, Recharts, Framer Motion',
                        },
                        { category: 'Backend', items: 'Node.js, Express, WebSockets, MQTT' },
                        { category: 'AI', items: 'Google Gemini 3.1, OpenAI, Anthropic' },
                        { category: 'PWA', items: 'Workbox, Service Worker, Background Sync' },
                        {
                          category: t('help.protocols'),
                          items: 'Modbus, MQTT, KNX/IP, OCPP, EEBus',
                        },
                        {
                          category: t('help.testing'),
                          items: 'Vitest, Playwright, axe-core (a11y)',
                        },
                      ].map((tech) => (
                        <div
                          key={tech.category}
                          className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
                        >
                          <p className="mb-1 text-xs font-semibold tracking-wider text-(--color-primary) uppercase">
                            {tech.category}
                          </p>
                          <p className="text-xs text-(--color-muted)">{tech.items}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div className="mt-6 border-t border-(--color-border) pt-6">
                    <h3 className="mb-3 font-medium">{t('help.a11yTitle')}</h3>
                    <p className="text-sm leading-relaxed text-(--color-muted)">
                      {t('help.a11yDesc')}
                    </p>
                  </div>

                  {/* License */}
                  <div className="mt-6 border-t border-(--color-border) pt-6">
                    <h3 className="mb-3 font-medium">{t('help.license')}</h3>
                    <p className="text-sm leading-relaxed text-(--color-muted)">
                      {t('help.licenseDesc')}
                    </p>
                  </div>

                  {/* Credits */}
                  <div className="mt-6 border-t border-(--color-border) pt-6">
                    <h3 className="mb-3 font-medium">{t('help.credits')}</h3>
                    <div className="space-y-1 text-sm text-(--color-muted)">
                      <p>• Victron Energy — Cerbo GX, VE.Bus, Venus OS</p>
                      <p>• KNX Association — KNX/IP building automation standard</p>
                      <p>• Tibber & aWATTar — Dynamic electricity tariff APIs</p>
                      <p>• D3.js — Data-driven visualization library</p>
                      <p>• Google — Gemini 3.1 AI model</p>
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
