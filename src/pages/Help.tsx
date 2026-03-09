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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type HelpTab = 'getting-started' | 'features' | 'lexicon' | 'faq' | 'shortcuts' | 'troubleshooting' | 'about';

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
    { key: 'getting-started', icon: <BookOpen size={18} />, label: t('help.gettingStarted', 'Getting Started') },
    { key: 'features', icon: <Lightbulb size={18} />, label: t('help.features', 'Features') },
    { key: 'lexicon', icon: <FileText size={18} />, label: t('help.glossaryTitle') },
    { key: 'faq', icon: <MessageCircleQuestion size={18} />, label: t('help.faq') },
    { key: 'shortcuts', icon: <Keyboard size={18} />, label: t('help.shortcuts', 'Shortcuts') },
    { key: 'troubleshooting', icon: <RefreshCw size={18} />, label: t('help.troubleshooting', 'Troubleshooting') },
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
            <p className="text-sm text-[color:var(--color-muted)]">{t('help.subtitle', 'Everything you need to know about Nexus HEMS')}</p>
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
          placeholder={t('help.searchPlaceholder', 'Search documentation...')}
          aria-label={t('help.searchPlaceholder', 'Search documentation...')}
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
                  <h2 className="text-xl font-semibold mb-4">{t('help.welcomeTitle', 'Welcome to Nexus HEMS')}</h2>
                  <p className="text-[color:var(--color-muted)] leading-relaxed mb-6">{t('help.welcomeIntro', 'Nexus-HEMS Dash is the central control point for your Home Energy Management System. Monitor real-time energy flows, control your smart home devices, optimize EV charging and heat pump operation with AI-powered recommendations, and leverage dynamic electricity tariffs for maximum savings.')}</p>

                  {/* Quick Start Steps */}
                  <h3 className="text-lg font-medium mb-4">{t('help.quickStart', 'Quick Start Guide')}</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: t('help.step1Title', 'Connect your devices'), desc: t('help.step1Desc', 'Go to Settings → System and enter the IP addresses for your Victron Cerbo GX, KNX IP router, and Node-RED WebSocket server.'), icon: <Server size={18} /> },
                      { step: 2, title: t('help.step2Title', 'Configure energy parameters'), desc: t('help.step2Desc', 'Set up your tariff provider (Tibber/aWATTar), charge threshold, and §14a EnWG grid import limit under Settings → Energy.'), icon: <Zap size={18} /> },
                      { step: 3, title: t('help.step3Title', 'Monitor your energy flow'), desc: t('help.step3Desc', 'The Dashboard shows a real-time Sankey diagram visualizing energy flows between PV, grid, battery, and consumers. Data refreshes every 2 seconds via WebSocket.'), icon: <Activity size={18} /> },
                      { step: 4, title: t('help.step4Title', 'Optimize with AI'), desc: t('help.step4Desc', 'Enable the AI Optimizer to get real-time recommendations for EV charging, battery strategy, and heat pump operation based on weather forecasts and tariff predictions.'), icon: <Sparkles size={18} /> },
                      { step: 5, title: t('help.step5Title', 'Install as PWA'), desc: t('help.step5Desc', 'Install Nexus HEMS as a Progressive Web App for native-like performance, offline access, and push notifications.'), icon: <Download size={18} /> },
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
                  <h3 className="text-lg font-medium mb-4">{t('help.requirements', 'System Requirements')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor size={16} className="text-blue-400" />
                        <h4 className="font-medium text-sm">{t('help.hardware', 'Hardware')}</h4>
                      </div>
                      <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5">
                        <li>• Victron Cerbo GX / Venus OS</li>
                        <li>• KNX IP Router ({t('help.optional', 'optional')})</li>
                        <li>• Node-RED {t('help.onCerbo', 'on Cerbo GX or separate')}</li>
                        <li>• WiFi / Ethernet</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={16} className="text-cyan-400" />
                        <h4 className="font-medium text-sm">{t('help.software', 'Software')}</h4>
                      </div>
                      <ul className="text-xs text-[color:var(--color-muted)] space-y-1.5">
                        <li>• {t('help.modernBrowser', 'Modern browser (Chrome, Firefox, Safari, Edge)')}</li>
                        <li>• {t('help.pwaSupport', 'PWA support for offline mode')}</li>
                        <li>• Tibber / aWATTar {t('help.account', 'account')} ({t('help.optional', 'optional')})</li>
                        <li>• AI API Key ({t('help.optional', 'optional')})</li>
                      </ul>
                    </div>
                  </div>
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
                  <h2 className="text-xl font-semibold mb-6">{t('help.allFeatures', 'All Features')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FeatureCard
                      icon={<Activity size={20} className="text-emerald-400" />}
                      title={t('help.featureSankey', 'Real-time Sankey Diagram')}
                      description={t('help.featureSankeyDesc', 'D3.js-powered visualization of energy flows between PV, grid, battery, and consumers. Updates every 2 seconds via WebSocket.')}
                      color="bg-emerald-500/15"
                    />
                    <FeatureCard
                      icon={<Map size={20} className="text-blue-400" />}
                      title={t('help.featureFloorplan', 'Interactive KNX Floorplan')}
                      description={t('help.featureFloorplanDesc', 'Control lights, windows, and climate via an interactive floor plan. Commands are sent via Node-RED to your KNX bus.')}
                      color="bg-blue-500/15"
                    />
                    <FeatureCard
                      icon={<Sparkles size={20} className="text-purple-400" />}
                      title={t('help.featureAI', 'AI Optimizer')}
                      description={t('help.featureAIDesc', 'Gemini 2.5-powered recommendations for EV, battery, and heat pump strategy based on tariffs, weather, and consumption patterns.')}
                      color="bg-purple-500/15"
                    />
                    <FeatureCard
                      icon={<Car size={20} className="text-amber-400" />}
                      title={t('help.featureEV', 'EV Charging Control')}
                      description={t('help.featureEVDesc', 'Smart wallbox control with PV surplus, low-price, and scheduled charging modes. §14a EnWG compliant.')}
                      color="bg-amber-500/15"
                    />
                    <FeatureCard
                      icon={<TrendingUp size={20} className="text-rose-400" />}
                      title={t('help.featureTariffs', 'Dynamic Tariffs')}
                      description={t('help.featureTariffsDesc', 'Real-time integration with Tibber and aWATTar. Automatic optimization of consumption to low-price windows.')}
                      color="bg-rose-500/15"
                    />
                    <FeatureCard
                      icon={<Sun size={20} className="text-yellow-400" />}
                      title={t('help.featureForecast', 'Weather-based PV Forecast')}
                      description={t('help.featureForecastDesc', 'Predictive PV generation and consumption forecasts based on weather data. 24h and 7-day outlooks.')}
                      color="bg-yellow-500/15"
                    />
                    <FeatureCard
                      icon={<Battery size={20} className="text-green-400" />}
                      title={t('help.featureBattery', 'Battery Management')}
                      description={t('help.featureBatteryDesc', 'Monitor SoC, voltage, and power. Configure charging strategies: self-consumption, force charge, or auto mode.')}
                      color="bg-green-500/15"
                    />
                    <FeatureCard
                      icon={<BarChart3 size={20} className="text-indigo-400" />}
                      title={t('help.featureAnalytics', 'Analytics & Reports')}
                      description={t('help.featureAnalyticsDesc', 'Monthly PDF reports with cost analysis, CO₂ balance, and energy statistics. Export and share dashboards.')}
                      color="bg-indigo-500/15"
                    />
                    <FeatureCard
                      icon={<Home size={20} className="text-teal-400" />}
                      title={t('help.featureHA', 'Home Assistant / MQTT')}
                      description={t('help.featureHADesc', 'Bidirectional MQTT integration with Home Assistant. Auto-discovery for all connected devices.')}
                      color="bg-teal-500/15"
                    />
                    <FeatureCard
                      icon={<Mic size={20} className="text-pink-400" />}
                      title={t('help.featureVoice', 'Voice Control')}
                      description={t('help.featureVoiceDesc', 'Hands-free dashboard control with speech recognition. Navigate, change themes, and control devices by voice.')}
                      color="bg-pink-500/15"
                    />
                    <FeatureCard
                      icon={<WifiOff size={20} className="text-orange-400" />}
                      title={t('help.featureOffline', 'Offline Mode')}
                      description={t('help.featureOfflineDesc', 'Full PWA support with service worker caching, IndexedDB persistence, and background sync. Works without internet.')}
                      color="bg-orange-500/15"
                    />
                    <FeatureCard
                      icon={<Shield size={20} className="text-red-400" />}
                      title={t('help.featureSecurity', 'Security')}
                      description={t('help.featureSecurityDesc', 'mTLS, AES-GCM 256-bit encryption for API keys, 2FA, and local-first data storage. No cloud dependency.')}
                      color="bg-red-500/15"
                    />
                  </div>
                </div>

                {/* Supported Protocols */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4">{t('help.protocols', 'Supported Protocols & Standards')}</h3>
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
                      { term: t('help.glossMppt', 'MPPT (Maximum Power Point Tracking)'), desc: t('help.glossMpptDesc', 'An algorithm used by solar charge controllers and inverters to extract maximum power from PV panels under varying conditions.') },
                      { term: t('help.glossEms', 'EMS (Energy Management System)'), desc: t('help.glossEmsDesc', 'Software and hardware that monitors, controls, and optimizes energy consumption and production in a building or facility.') },
                      { term: t('help.glossFeedIn', 'Feed-in Tariff (Einspeisevergütung)'), desc: t('help.glossFeedInDesc', 'A policy mechanism designed to accelerate investment in renewable energy technologies by offering long-term contracts to renewable energy producers.') },
                      { term: t('help.glossSector', 'Sector Coupling (Sektorenkopplung)'), desc: t('help.glossSectorDesc', 'The integration of the energy-consuming sectors – electricity, heating, and transport – via power-to-heat, power-to-gas, and direct electrification.') },
                      { term: t('help.glossModbus', 'Modbus TCP'), desc: t('help.glossModbusDesc', 'A communication protocol for industrial devices. Used to read data from Victron inverters and other energy equipment via TCP/IP.') },
                      { term: t('help.glossOcpp', 'OCPP (Open Charge Point Protocol)'), desc: t('help.glossOcppDesc', 'An open communication protocol between EV charging stations and a central management system. Version 2.1 supports smart charging.') },
                      { term: t('help.glossPwa', 'PWA (Progressive Web App)'), desc: t('help.glossPwaDesc', 'A type of application software that uses web technologies but delivers native app-like experiences including offline mode, push notifications, and home screen installation.') },
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
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqGeneral', 'General')}</h3>
                  <div className="space-y-3 mb-6">
                    <AccordionItem title={t('help.faqWhatIs', 'What is Nexus HEMS?')} defaultOpen>
                      {t('help.faqWhatIsAnswer', 'Nexus HEMS is a real-time Home Energy Management System dashboard. It visualizes energy flows between solar panels, battery storage, the power grid, and household consumers. It integrates with Victron Cerbo GX, KNX building automation, and dynamic electricity tariff providers.')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqPowerOutage')}>
                      {t('help.faqPowerOutageAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqOffline', 'Does the app work offline?')}>
                      {t('help.faqOfflineAnswer', 'Yes. As a PWA, the app caches all assets and recent data locally. You can view the last known energy state, browse settings, and queue control commands that will be synced when connectivity is restored.')}
                    </AccordionItem>
                  </div>

                  {/* Energy & Tariffs */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqEnergySection', 'Energy & Tariffs')}</h3>
                  <div className="space-y-3 mb-6">
                    <AccordionItem title={t('help.faqEnwg')}>
                      {t('help.faqEnwgAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqTariff', 'How do dynamic tariffs work?')}>
                      {t('help.faqTariffAnswer', 'Dynamic tariffs change hourly based on wholesale electricity market prices. Nexus HEMS fetches prices from your provider (Tibber or aWATTar) and automatically shifts flexible loads (EV charging, heat pump, battery) to low-price windows to maximize savings.')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqSgReady', 'What is SG Ready and how does it work?')}>
                      {t('help.faqSgReadyAnswer', 'SG Ready is a standard for heat pumps that define 4 operating modes: Mode 1 (lockout), Mode 2 (normal), Mode 3 (recommended increased consumption), and Mode 4 (forced start). Nexus HEMS automatically sets the optimal mode based on PV surplus, electricity price, and weather forecasts.')}
                    </AccordionItem>
                  </div>

                  {/* Security */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqSecuritySection', 'Security & Privacy')}</h3>
                  <div className="space-y-3 mb-6">
                    <AccordionItem title={t('help.faqSecurity')}>
                      {t('help.faqSecurityAnswer')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqDataStorage', 'Where is my data stored?')}>
                      {t('help.faqDataStorageAnswer', 'All data is stored locally in your browser using IndexedDB (Dexie.js). API keys are encrypted with AES-GCM 256-bit before storage. No data is sent to external servers unless you explicitly configure a cloud integration like InfluxDB.')}
                    </AccordionItem>
                  </div>

                  {/* Technical */}
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.faqTechnical', 'Technical')}</h3>
                  <div className="space-y-3">
                    <AccordionItem title={t('help.faqBrowsers', 'Which browsers are supported?')}>
                      {t('help.faqBrowsersAnswer', 'Nexus HEMS supports all modern browsers: Chrome 90+, Firefox 90+, Safari 15+, and Edge 90+. For the best experience with PWA features, we recommend Chrome or Edge.')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqMobile', 'Is there a mobile app?')}>
                      {t('help.faqMobileAnswer', 'Nexus HEMS is a Progressive Web App (PWA). You can install it from your browser to your home screen for a native app-like experience. It works on both iOS and Android with responsive layouts optimized for all screen sizes.')}
                    </AccordionItem>
                    <AccordionItem title={t('help.faqApi', 'Can I integrate custom APIs?')}>
                      {t('help.faqApiAnswer', 'Yes. The adapter architecture supports custom integrations. Built-in adapters exist for Victron MQTT, KNX/IP, Modbus SunSpec, OCPP 2.1, and EEBus. You can extend the system by adding new adapters in the core/adapters directory.')}
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
                  <h2 className="text-xl font-semibold mb-6">{t('help.keyboardShortcuts', 'Keyboard Shortcuts')}</h2>
                  <div className="space-y-6">
                    {/* Navigation */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.shortcutNav', 'Navigation')}</h3>
                      <div className="space-y-2">
                        {[
                          { keys: ['⌘', 'K'], desc: t('help.shortcutCmdK', 'Open command palette') },
                          { keys: ['⌘', '/'], desc: t('help.shortcutSearch', 'Focus search') },
                          { keys: ['Esc'], desc: t('help.shortcutClose', 'Close dialog / go back') },
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
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">{t('help.shortcutActions', 'Actions')}</h3>
                      <div className="space-y-2">
                        {[
                          { keys: ['⌘', 'S'], desc: t('help.shortcutSave', 'Save settings') },
                          { keys: ['⌘', 'E'], desc: t('help.shortcutExport', 'Export report') },
                          { keys: ['⌘', 'L'], desc: t('help.shortcutLang', 'Toggle language') },
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
                        {t('help.shortcutNote', 'On Windows/Linux, use Ctrl instead of ⌘. All shortcuts are also available through the command palette (⌘K).')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Voice Commands */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mic size={20} className="text-pink-400" />
                    {t('help.voiceCommands', 'Voice Commands')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { cmd: t('voice.exampleTheme'), desc: t('voice.cmdThemeDesc') },
                      { cmd: t('voice.exampleEv'), desc: t('voice.cmdEvDesc') },
                      { cmd: t('voice.exampleStatus'), desc: t('help.showStatus', 'Display current energy status') },
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
                  <h2 className="text-xl font-semibold mb-6">{t('help.troubleshootingTitle', 'Troubleshooting')}</h2>
                  <div className="space-y-3">
                    <AccordionItem title={t('help.troubleConnection', 'Dashboard shows "Disconnected"')} defaultOpen>
                      <ul className="space-y-2">
                        <li>1. {t('help.troubleConn1', 'Check that your Victron Cerbo GX is powered on and connected to the network')}</li>
                        <li>2. {t('help.troubleConn2', 'Verify the IP address in Settings → System matches your Cerbo GX')}</li>
                        <li>3. {t('help.troubleConn3', 'Ensure Node-RED is running and the WebSocket port is correct (default: 1880)')}</li>
                        <li>4. {t('help.troubleConn4', 'Check that your browser allows WebSocket connections')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troubleNoData', 'No energy data showing')} >
                      <ul className="space-y-2">
                        <li>• {t('help.troubleData1', 'The Victron system may be in standby mode (no PV generation at night)')}</li>
                        <li>• {t('help.troubleData2', 'Check the data refresh rate in Settings (default: 2000ms)')}</li>
                        <li>• {t('help.troubleData3', 'Clear browser cache and reload the page')}</li>
                        <li>• {t('help.troubleData4', 'Check Node-RED flow for errors')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troublePwa', 'PWA not installing')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troublePwa1', 'PWA installation requires HTTPS (except on localhost)')}</li>
                        <li>• {t('help.troublePwa2', 'Make sure the manifest.json is valid and accessible')}</li>
                        <li>• {t('help.troublePwa3', 'On iOS, use Safari and tap "Add to Home Screen" from the share menu')}</li>
                        <li>• {t('help.troublePwa4', 'Clear the browser cache and try again')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troubleKnx', 'KNX devices not responding')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troubleKnx1', 'Verify your KNX IP router address in Settings')}</li>
                        <li>• {t('help.troubleKnx2', 'Check that the KNX bus has power')}</li>
                        <li>• {t('help.troubleKnx3', 'Ensure group addresses match your ETS project configuration')}</li>
                        <li>• {t('help.troubleKnx4', 'Test connections via ETS diagnostics first')}</li>
                      </ul>
                    </AccordionItem>
                    <AccordionItem title={t('help.troubleAi', 'AI Optimizer not responding')}>
                      <ul className="space-y-2">
                        <li>• {t('help.troubleAi1', 'Check that your AI API key is configured under Settings → AI Keys')}</li>
                        <li>• {t('help.troubleAi2', 'Verify your API key has sufficient quota')}</li>
                        <li>• {t('help.troubleAi3', 'AI features require an internet connection')}</li>
                        <li>• {t('help.troubleAi4', 'Try regenerating your API key in the provider\'s dashboard')}</li>
                      </ul>
                    </AccordionItem>
                  </div>
                </div>

                {/* Performance Tips */}
                <div className="glass-panel-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Gauge size={20} className="text-indigo-400" />
                    {t('help.perfTips', 'Performance Tips')}
                  </h3>
                  <div className="space-y-3 text-sm text-[color:var(--color-muted)]">
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf1', 'Use the PWA installation for better performance and offline caching')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf2', 'Enable Performance Mode in Settings → Advanced to reduce animations on low-power devices')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf3', 'Reduce the data refresh rate if running on mobile data or slow connections')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[color:var(--color-primary)] mt-0.5">•</span>
                      <p>{t('help.perf4', 'Periodically clear the local cache in Settings → Storage to free up IndexedDB space')}</p>
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
                      <p className="text-[color:var(--color-muted)] text-sm">{t('help.versionFull', 'Version 3.1.0 — Build 2026.03')}</p>
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
                        { category: t('help.visualization', 'Visualization'), items: 'D3.js Sankey, Recharts, Framer Motion' },
                        { category: 'Backend', items: 'Node.js, Express, WebSockets, MQTT' },
                        { category: 'AI', items: 'Google Gemini 2.5, OpenAI, Anthropic' },
                        { category: 'PWA', items: 'Workbox, Service Worker, Background Sync' },
                        { category: t('help.protocols', 'Protocols'), items: 'Modbus, MQTT, KNX/IP, OCPP, EEBus' },
                        { category: t('help.testing', 'Testing'), items: 'Vitest, Playwright, axe-core (a11y)' },
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
                    <h3 className="font-medium mb-3">{t('help.a11yTitle', 'Accessibility')}</h3>
                    <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{t('help.a11yDesc', 'Nexus HEMS follows WCAG 2.2 AA standards with full keyboard navigation, ARIA labels, screen reader support, skip links, focus indicators, and proper color contrast ratios. Tested with axe-core and Playwright a11y tests.')}</p>
                  </div>

                  {/* License */}
                  <div className="border-t border-[color:var(--color-border)] pt-6 mt-6">
                    <h3 className="font-medium mb-3">{t('help.license')}</h3>
                    <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{t('help.licenseDesc')}</p>
                  </div>

                  {/* Credits */}
                  <div className="border-t border-[color:var(--color-border)] pt-6 mt-6">
                    <h3 className="font-medium mb-3">{t('help.credits', 'Credits & Acknowledgments')}</h3>
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
