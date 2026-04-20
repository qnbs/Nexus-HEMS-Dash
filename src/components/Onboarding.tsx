import {
  ArrowRight,
  Battery,
  Brain,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Home,
  Rocket,
  Sun,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
      className={`focus-ring relative flex items-center gap-4 rounded-2xl border-2 px-5 py-3.5 transition-all duration-300 ${
        active
          ? 'border-(--color-primary) bg-(--color-primary)/10 shadow-[0_0_24px_#38bdf820]'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={active}
    >
      <span className="text-2xl" aria-hidden="true">
        {flag}
      </span>
      <span className="text-sm font-medium text-white sm:text-base">{label}</span>
      {active && (
        <motion.div
          layoutId="lang-check"
          className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-(--color-primary) text-(--color-bg)"
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
      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:gap-4 sm:p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-(--color-muted)">{desc}</p>
      </div>
    </motion.div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={t('accessibility.progressStep', { current: current + 1, total })}
    >
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${
            i === current
              ? 'w-6 bg-(--color-primary) sm:w-8'
              : i < current
                ? 'w-1.5 bg-(--color-primary)/50 sm:w-2'
                : 'w-1.5 bg-white/20 sm:w-2'
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

  const handleLanguageChange = (code: LocaleCode) => {
    setLocale(code);
    void i18n.changeLanguage(code);
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    setOnboardingCompleted(true);
  };

  const skip = () => {
    setOnboardingCompleted(true);
  };

  // Escape key dismisses the onboarding dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOnboardingCompleted(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOnboardingCompleted]);

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
    <div
      className="z-priority fixed inset-0 overflow-y-auto bg-(--color-bg)"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.welcome')}
    >
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-(--color-primary)/5 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-(--color-secondary)/5 blur-[100px]" />
        <div className="absolute top-1/4 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-(--color-accent)/3 blur-[80px]" />
      </div>

      <div className="flex min-h-full items-center justify-center px-4 py-6 sm:py-10">
        <motion.div
          className="relative z-10 flex w-full max-w-lg flex-col items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <motion.div
            className="mb-4 flex items-center gap-3 sm:mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--color-primary)/20 bg-(--color-primary)/10 sm:h-12 sm:w-12">
              <Zap className="h-5 w-5 text-(--color-primary) sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="fluid-text-lg font-bold tracking-tight text-white">Nexus HEMS</h1>
              <p className="text-xs text-(--color-muted)">Dashboard</p>
            </div>
          </motion.div>

          {/* Card */}
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6 md:p-8">
            {/* Step indicator */}
            <div className="mb-5 flex items-center justify-between sm:mb-6">
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <span className="text-xs text-(--color-muted)">
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
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-(--color-primary) to-(--color-secondary) shadow-[0_0_40px_#38bdf830] sm:mb-4 sm:h-16 sm:w-16"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      <Globe className="h-7 w-7 text-(--color-bg) sm:h-8 sm:w-8" />
                    </motion.div>
                    <h2 className="fluid-text-xl font-bold text-white">
                      {t('onboarding.welcome')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                      {t('onboarding.welcomeDesc')}
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-(--color-muted)">
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
                    <p className="mt-2 text-xs text-(--color-muted)">{t('onboarding.langHint')}</p>
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
                  className="space-y-4 sm:space-y-5"
                >
                  <div className="text-center">
                    <motion.div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-(--color-primary) to-(--color-secondary) shadow-[0_0_40px_#38bdf830] sm:mb-4 sm:h-16 sm:w-16"
                      initial={{ rotate: -10 }}
                      animate={{ rotate: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    >
                      <Zap className="h-7 w-7 text-(--color-bg) sm:h-8 sm:w-8" />
                    </motion.div>
                    <h2 className="fluid-text-lg font-bold text-white">
                      {t('onboarding.energyFlow')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                      {t('onboarding.energyFlowDesc')}
                    </p>
                  </div>

                  {/* Illustrative mini Sankey */}
                  <div className="rounded-2xl border border-white/10 bg-(--color-surface)/60 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center gap-1">
                        <Sun className="h-5 w-5 text-amber-400 sm:h-6 sm:w-6" />
                        <span className="text-[10px] text-(--color-muted)">PV</span>
                      </div>
                      <motion.div
                        className="mx-2 h-0.5 flex-1 rounded-full bg-gradient-to-r from-amber-400 via-(--color-primary) to-(--color-secondary) sm:mx-3"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                        style={{ transformOrigin: 'left' }}
                      />
                      <div className="flex flex-col items-center gap-1">
                        <Home className="h-5 w-5 text-(--color-primary) sm:h-6 sm:w-6" />
                        <span className="text-[10px] text-(--color-muted)">Home</span>
                      </div>
                      <motion.div
                        className="mx-2 h-0.5 flex-1 rounded-full bg-gradient-to-r from-(--color-primary) to-(--color-secondary) sm:mx-3"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                        style={{ transformOrigin: 'left' }}
                      />
                      <div className="flex flex-col items-center gap-1">
                        <Battery className="h-5 w-5 text-(--color-secondary) sm:h-6 sm:w-6" />
                        <span className="text-[10px] text-(--color-muted)">Battery</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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
                      color="bg-indigo-500/20 text-indigo-400"
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
                  className="space-y-4 sm:space-y-5"
                >
                  <div className="text-center">
                    <motion.div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-(--color-accent) to-(--color-primary) shadow-[0_0_40px_#fb923c30] sm:mb-4 sm:h-16 sm:w-16"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      <Car className="h-7 w-7 text-(--color-bg) sm:h-8 sm:w-8" />
                    </motion.div>
                    <h2 className="fluid-text-lg font-bold text-white">
                      {t('onboarding.smartControl')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                      {t('onboarding.smartControlDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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
                      color="bg-sky-500/20 text-sky-400"
                      delay={0.2}
                    />
                  </div>

                  {/* Mini price chart illustration */}
                  <div className="rounded-2xl border border-white/10 bg-(--color-surface)/60 p-3 sm:p-4">
                    <p className="mb-2 text-xs font-medium text-(--color-muted)">
                      {t('onboarding.dynamicTariff')}
                    </p>
                    <div className="flex h-10 items-end gap-0.5 sm:h-12 sm:gap-1">
                      {[
                        0.18, 0.22, 0.15, 0.12, 0.08, 0.06, 0.05, 0.09, 0.14, 0.19, 0.25, 0.28,
                        0.24, 0.2, 0.16, 0.12, 0.1, 0.14, 0.22, 0.3, 0.35, 0.28, 0.22, 0.18,
                      ].map((v, i) => (
                        <motion.div
                          key={i}
                          className={`flex-1 rounded-t ${v < 0.12 ? 'bg-(--color-primary)' : v < 0.22 ? 'bg-(--color-secondary)' : 'bg-(--color-accent)'}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${(v / 0.35) * 100}%` }}
                          transition={{ delay: 0.05 * i, duration: 0.4 }}
                        />
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] text-(--color-muted)">
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
                  className="space-y-4 sm:space-y-5"
                >
                  <div className="text-center">
                    <motion.div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-(--color-secondary) to-(--color-primary) shadow-[0_0_40px_#818cf830] sm:mb-4 sm:h-16 sm:w-16"
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    >
                      <Brain className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                    </motion.div>
                    <h2 className="fluid-text-lg font-bold text-white">
                      {t('onboarding.aiOptimizer')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                      {t('onboarding.aiOptimizerDesc')}
                    </p>
                  </div>

                  {/* AI visualization */}
                  <div className="rounded-2xl border border-white/10 bg-(--color-surface)/60 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <Brain className="h-4 w-4 text-(--color-secondary)" />
                      <span className="text-xs font-medium text-white">
                        {t('onboarding.aiRecommendations')}
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
                        className="mb-2 flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 last:mb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: tip.delay, duration: 0.4 }}
                      >
                        <span className="shrink-0 text-base" aria-hidden="true">
                          {tip.icon}
                        </span>
                        <span className="min-w-0 text-xs text-(--color-muted)">{tip.text}</span>
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
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-(--color-primary) to-(--color-secondary) shadow-[0_0_60px_#38bdf840] sm:mb-4 sm:h-20 sm:w-20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    >
                      <Rocket className="h-8 w-8 text-(--color-bg) sm:h-10 sm:w-10" />
                    </motion.div>
                    <h2 className="fluid-text-xl font-bold text-white">{t('onboarding.allSet')}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                      {t('onboarding.allSetDesc')}
                    </p>
                  </div>

                  {/* Summary check marks */}
                  <div className="space-y-2">
                    {[
                      {
                        icon: Globe,
                        text: t('onboarding.checkLanguage'),
                      },
                      {
                        icon: Zap,
                        text: t('onboarding.checkEnergyFlow'),
                      },
                      {
                        icon: Car,
                        text: t('onboarding.checkControl'),
                      },
                      {
                        icon: Brain,
                        text: t('onboarding.checkAi'),
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/5 px-3 py-2.5 sm:px-4 sm:py-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i + 0.3, duration: 0.4 }}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/20">
                          <Check className="h-3.5 w-3.5 text-(--color-primary)" strokeWidth={3} />
                        </div>
                        <span className="min-w-0 text-sm text-white">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between sm:mt-8">
              <div>
                {step > 0 ? (
                  <motion.button
                    onClick={goBack}
                    className="focus-ring flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-(--color-muted) transition-colors hover:border-white/20 hover:text-white sm:px-4 sm:py-2.5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('onboarding.back')}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={skip}
                    className="focus-ring rounded-lg px-3 py-2 text-sm text-(--color-muted) transition-colors hover:text-white"
                    whileHover={{ scale: 1.02 }}
                    aria-label={t('accessibility.skipOnboarding')}
                  >
                    {t('onboarding.skip')}
                  </motion.button>
                )}
              </div>

              <div>
                {step < TOTAL_STEPS - 1 ? (
                  <motion.button
                    onClick={goNext}
                    className="focus-ring flex items-center gap-2 rounded-xl bg-gradient-to-r from-(--color-primary) to-(--color-secondary) px-5 py-2 text-sm font-semibold text-(--color-bg) shadow-[0_0_20px_#38bdf830] transition-shadow hover:shadow-[0_0_30px_#38bdf850] sm:px-6 sm:py-2.5"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t('onboarding.next')}
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={finish}
                    className="focus-ring flex items-center gap-2 rounded-xl bg-gradient-to-r from-(--color-primary) to-(--color-secondary) px-6 py-2.5 text-sm font-bold text-(--color-bg) shadow-[0_0_30px_#38bdf840] transition-shadow hover:shadow-[0_0_40px_#38bdf860] sm:px-8 sm:py-3"
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
              className="mt-4 text-xs text-(--color-muted) transition-colors hover:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              aria-label={t('accessibility.skipOnboarding')}
            >
              {t('onboarding.skip')}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
