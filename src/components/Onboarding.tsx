import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Sun,
  Battery,
  Car,
  Home,
  Brain,
  ChevronRight,
  ChevronLeft,
  Globe,
  Rocket,
  ArrowRight,
  Check,
} from 'lucide-react';

import { useAppStore } from '../store';
import type { LocaleCode } from '../types';

const TOTAL_STEPS = 5;

function LanguageOption({
  code,
  label,
  flag,
  active,
  onSelect,
}: {
  code: LocaleCode;
  label: string;
  flag: string;
  active: boolean;
  onSelect: (code: LocaleCode) => void;
}) {
  return (
    <motion.button
      onClick={() => onSelect(code)}
      className={`relative flex items-center gap-4 rounded-2xl border-2 px-6 py-4 transition-all duration-300 focus-ring ${
        active
          ? 'border-[#22ff88] bg-[#22ff88]/10 shadow-[0_0_24px_#22ff8820]'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={active}
    >
      <span className="text-3xl" aria-hidden="true">
        {flag}
      </span>
      <span className="text-base font-medium text-white">{label}</span>
      {active && (
        <motion.div
          layoutId="lang-check"
          className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#22ff88] text-[#0f172a]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  delay,
}: {
  icon: typeof Sun;
  title: string;
  desc: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-[#94a3b8] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-8 bg-[#22ff88]'
              : i < current
                ? 'w-2 bg-[#22ff88]/50'
                : 'w-2 bg-white/20'
          }`}
          layout
        />
      ))}
    </div>
  );
}

export function Onboarding() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);

  const handleLanguageChange = useCallback(
    (code: LocaleCode) => {
      setLocale(code);
      void i18n.changeLanguage(code);
    },
    [setLocale, i18n],
  );

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    setOnboardingCompleted(true);
  };

  const skip = () => {
    setOnboardingCompleted(true);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    next();
  };
  const goBack = () => {
    setDirection(-1);
    back();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0f1e]">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-[#22ff88]/5 blur-[120px]" />
        <div className="absolute -bottom-1/3 -right-1/4 h-[600px] w-[600px] rounded-full bg-[#00e0ff]/5 blur-[100px]" />
        <div className="absolute top-1/4 right-1/3 h-[400px] w-[400px] rounded-full bg-[#ff8800]/3 blur-[80px]" />
      </div>

      <motion.div
        className="relative z-10 mx-4 flex w-full max-w-lg flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="mb-8 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22ff88]/10 border border-[#22ff88]/20">
            <Zap className="h-6 w-6 text-[#22ff88]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Nexus HEMS</h1>
            <p className="text-xs text-[#64748b]">Dashboard</p>
          </div>
        </motion.div>

        {/* Card */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-between">
            <StepIndicator current={step} total={TOTAL_STEPS} />
            <span className="text-xs text-[#64748b]">
              {t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}
            </span>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#22ff88] to-[#00e0ff] shadow-[0_0_40px_#22ff8830]"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <Globe className="h-8 w-8 text-[#0f172a]" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">{t('onboarding.welcome')}</h2>
                  <p className="mt-2 text-sm text-[#94a3b8] leading-relaxed">
                    {t('onboarding.welcomeDesc')}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-[#94a3b8]">
                    {t('onboarding.chooseLanguage')}
                  </p>
                  <div className="grid gap-3">
                    <LanguageOption
                      code="de"
                      label="Deutsch"
                      flag="🇩🇪"
                      active={locale === 'de'}
                      onSelect={handleLanguageChange}
                    />
                    <LanguageOption
                      code="en"
                      label="English"
                      flag="🇬🇧"
                      active={locale === 'en'}
                      onSelect={handleLanguageChange}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#64748b]">{t('onboarding.langHint')}</p>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#22ff88] to-[#00e0ff] shadow-[0_0_40px_#22ff8830]"
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  >
                    <Zap className="h-8 w-8 text-[#0f172a]" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">{t('onboarding.energyFlow')}</h2>
                  <p className="mt-2 text-sm text-[#94a3b8] leading-relaxed">
                    {t('onboarding.energyFlowDesc')}
                  </p>
                </div>

                {/* Illustrative mini Sankey */}
                <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-1">
                      <Sun className="h-6 w-6 text-amber-400" />
                      <span className="text-[10px] text-[#94a3b8]">PV</span>
                    </div>
                    <motion.div
                      className="h-0.5 flex-1 mx-3 rounded-full bg-gradient-to-r from-amber-400 via-[#22ff88] to-[#00e0ff]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      style={{ transformOrigin: 'left' }}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <Home className="h-6 w-6 text-[#22ff88]" />
                      <span className="text-[10px] text-[#94a3b8]">Home</span>
                    </div>
                    <motion.div
                      className="h-0.5 flex-1 mx-3 rounded-full bg-gradient-to-r from-[#22ff88] to-[#00e0ff]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                      style={{ transformOrigin: 'left' }}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <Battery className="h-6 w-6 text-[#00e0ff]" />
                      <span className="text-[10px] text-[#94a3b8]">Battery</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FeatureCard
                    icon={Sun}
                    title={t('onboarding.featurePv')}
                    desc={t('onboarding.featurePvDesc')}
                    color="bg-amber-500/20 text-amber-400"
                    delay={0.1}
                  />
                  <FeatureCard
                    icon={Battery}
                    title={t('onboarding.featureBattery')}
                    desc={t('onboarding.featureBatteryDesc')}
                    color="bg-cyan-500/20 text-cyan-400"
                    delay={0.2}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8800] to-[#22ff88] shadow-[0_0_40px_#ff880030]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <Car className="h-8 w-8 text-[#0f172a]" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">{t('onboarding.smartControl')}</h2>
                  <p className="mt-2 text-sm text-[#94a3b8] leading-relaxed">
                    {t('onboarding.smartControlDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FeatureCard
                    icon={Car}
                    title={t('onboarding.featureEv')}
                    desc={t('onboarding.featureEvDesc')}
                    color="bg-orange-500/20 text-orange-400"
                    delay={0.1}
                  />
                  <FeatureCard
                    icon={Home}
                    title={t('onboarding.featureKnx')}
                    desc={t('onboarding.featureKnxDesc')}
                    color="bg-emerald-500/20 text-emerald-400"
                    delay={0.2}
                  />
                </div>

                {/* Mini price chart illustration */}
                <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-4">
                  <p className="mb-2 text-xs font-medium text-[#94a3b8]">
                    {locale === 'de' ? 'Dynamischer Stromtarif' : 'Dynamic Electricity Tariff'}
                  </p>
                  <div className="flex items-end gap-1 h-12">
                    {[
                      0.18, 0.22, 0.15, 0.12, 0.08, 0.06, 0.05, 0.09, 0.14, 0.19, 0.25, 0.28, 0.24,
                      0.2, 0.16, 0.12, 0.1, 0.14, 0.22, 0.3, 0.35, 0.28, 0.22, 0.18,
                    ].map((v, i) => (
                      <motion.div
                        key={i}
                        className={`flex-1 rounded-t ${v < 0.12 ? 'bg-[#22ff88]' : v < 0.22 ? 'bg-[#00e0ff]' : 'bg-[#ff8800]'}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / 0.35) * 100}%` }}
                        transition={{ delay: 0.05 * i, duration: 0.4 }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-[#64748b]">
                    <span>0h</span>
                    <span>6h</span>
                    <span>12h</span>
                    <span>18h</span>
                    <span>24h</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#00e0ff] shadow-[0_0_40px_#a855f730]"
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  >
                    <Brain className="h-8 w-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">{t('onboarding.aiOptimizer')}</h2>
                  <p className="mt-2 text-sm text-[#94a3b8] leading-relaxed">
                    {t('onboarding.aiOptimizerDesc')}
                  </p>
                </div>

                {/* AI visualization */}
                <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="h-4 w-4 text-[#a855f7]" />
                    <span className="text-xs font-medium text-white">
                      {locale === 'de' ? 'KI-Empfehlungen' : 'AI Recommendations'}
                    </span>
                  </div>
                  {[
                    {
                      text: t('onboarding.tipConnect'),
                      icon: '🔌',
                      delay: 0.1,
                    },
                    {
                      text: t('onboarding.tipTariff'),
                      icon: '💰',
                      delay: 0.3,
                    },
                    {
                      text: t('onboarding.tipAi'),
                      icon: '🧠',
                      delay: 0.5,
                    },
                  ].map((tip, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 mb-2 last:mb-0"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: tip.delay, duration: 0.4 }}
                    >
                      <span className="text-base" aria-hidden="true">
                        {tip.icon}
                      </span>
                      <span className="text-xs text-[#94a3b8]">{tip.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#22ff88] to-[#00e0ff] shadow-[0_0_60px_#22ff8840]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    <Rocket className="h-10 w-10 text-[#0f172a]" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">{t('onboarding.allSet')}</h2>
                  <p className="mt-2 text-sm text-[#94a3b8] leading-relaxed">
                    {t('onboarding.allSetDesc')}
                  </p>
                </div>

                {/* Summary check marks */}
                <div className="space-y-2">
                  {[
                    {
                      icon: Globe,
                      text: locale === 'de' ? 'Sprache konfiguriert' : 'Language configured',
                    },
                    {
                      icon: Zap,
                      text:
                        locale === 'de'
                          ? 'Echtzeit-Energiefluss bereit'
                          : 'Real-time energy flow ready',
                    },
                    {
                      icon: Car,
                      text:
                        locale === 'de'
                          ? 'Steuerungsfunktionen verfügbar'
                          : 'Control features available',
                    },
                    {
                      icon: Brain,
                      text:
                        locale === 'de' ? 'KI-Optimierung vorbereitet' : 'AI optimization prepared',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-[#22ff88]/20 bg-[#22ff88]/5 px-4 py-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i + 0.3, duration: 0.4 }}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22ff88]/20">
                        <Check className="h-3.5 w-3.5 text-[#22ff88]" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-white">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {step > 0 ? (
                <motion.button
                  onClick={goBack}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:border-white/20 transition-colors focus-ring"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('onboarding.back')}
                </motion.button>
              ) : (
                <motion.button
                  onClick={skip}
                  className="text-sm text-[#64748b] hover:text-white transition-colors focus-ring rounded-lg px-3 py-2"
                  whileHover={{ scale: 1.02 }}
                >
                  {t('onboarding.skip')}
                </motion.button>
              )}
            </div>

            <div>
              {step < TOTAL_STEPS - 1 ? (
                <motion.button
                  onClick={goNext}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#22ff88] to-[#00e0ff] px-6 py-2.5 text-sm font-semibold text-[#0f172a] shadow-[0_0_20px_#22ff8830] hover:shadow-[0_0_30px_#22ff8850] transition-shadow focus-ring"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t('onboarding.next')}
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={finish}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#22ff88] to-[#00e0ff] px-8 py-3 text-sm font-bold text-[#0f172a] shadow-[0_0_30px_#22ff8840] hover:shadow-[0_0_40px_#22ff8860] transition-shadow focus-ring"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t('onboarding.getStarted')}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Skip link at bottom */}
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <motion.button
            onClick={skip}
            className="mt-4 text-xs text-[#64748b] hover:text-white transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('onboarding.skip')}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
