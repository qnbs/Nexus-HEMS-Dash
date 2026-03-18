import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Zap,
  Battery,
  Sun,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Flame,
  Car,
  Leaf,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '../components/layout/PageHeader';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { FloatingActionBar } from '../components/ui/FloatingActionBar';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTour, type TourStep } from '../components/ui/PageTour';
import { DemoBadge } from '../components/DemoBadge';
import {
  WizardStepper,
  WizardContent,
  useWizard,
  type WizardStepDef,
} from '../components/ui/WizardStepper';
import { useAppStoreShallow } from '../store';
import { useEnergyContext } from '../core/EnergyContext';
import { buildOptimizerRecommendations, runMpcOptimization } from '../lib/optimizer';
import {
  fetchTariffForecast,
  generatePredictiveRecommendation,
  type TariffForecast,
  type PredictiveRecommendation,
} from '../lib/predictive-ai';
import type { OptimizerRecommendation } from '../types';

// ─── Severity styling helper ─────────────────────────────────────────

const SEVERITY_STYLES: Record<
  OptimizerRecommendation['severity'],
  { bg: string; text: string; icon: typeof Zap }
> = {
  positive: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: CheckCircle2 },
  warning: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Clock },
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', icon: Zap },
  neutral: { bg: 'bg-sky-500/15', text: 'text-sky-400', icon: BarChart3 },
};

const ACTION_ICONS: Record<string, typeof Zap> = {
  charge_ev: Car,
  charge_battery: Battery,
  preheat: Flame,
  wait: Clock,
};

// ─── Tour steps ──────────────────────────────────────────────────────
const TOUR_STEPS: TourStep[] = [
  {
    icon: BarChart3,
    titleKey: 'tour.optimization.analyseTitle',
    descKey: 'tour.optimization.analyseDesc',
    color: '#00f0ff',
  },
  {
    icon: BrainCircuit,
    titleKey: 'tour.optimization.aiTitle',
    descKey: 'tour.optimization.aiDesc',
    color: '#a855f6',
  },
  {
    icon: CheckCircle2,
    titleKey: 'tour.optimization.confirmTitle',
    descKey: 'tour.optimization.confirmDesc',
    color: '#22ff88',
  },
];

// ─── Component ───────────────────────────────────────────────────────

export default function OptimizationAI() {
  const { t } = useTranslation();
  const { data: energyData, connected } = useEnergyContext();
  const settings = useAppStoreShallow((s) => s.settings);
  const isDemo = !connected;

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Analysis results (populated in Step 1)
  const [forecast, setForecast] = useState<TariffForecast[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizerRecommendation[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<PredictiveRecommendation | null>(null);
  const [applied, setApplied] = useState(false);

  const wizard = useWizard(3);

  const steps: WizardStepDef[] = [
    { id: 'analyse', label: t('optimizationWizard.step1Title'), icon: <BarChart3 size={14} /> },
    {
      id: 'suggestions',
      label: t('optimizationWizard.step2Title'),
      icon: <BrainCircuit size={14} />,
    },
    { id: 'confirm', label: t('optimizationWizard.step3Title'), icon: <CheckCircle2 size={14} /> },
  ];

  // ── Step 1: Run analysis ───────────────────────────────────────────
  async function runAnalysis() {
    setLoading(true);
    setApplied(false);

    try {
      // Fetch tariff forecast
      const tariffData = await fetchTariffForecast(
        settings.tariffProvider,
        '', // API key managed via encrypted Dexie store
      );
      setForecast(tariffData);

      // Run MPC optimizer
      runMpcOptimization(energyData, settings);

      // Build rule-based + MPC recommendations
      const recs = buildOptimizerRecommendations(energyData, settings);
      setRecommendations(recs);

      // Generate predictive AI recommendation
      const aiRec = await generatePredictiveRecommendation(energyData, tariffData, settings);
      setAiRecommendation(aiRec);
    } catch {
      // Use whatever recommendations we already have
      const recs = buildOptimizerRecommendations(energyData, settings);
      setRecommendations(recs);
    } finally {
      setLoading(false);
    }
  }

  // ── Wizard navigation ──────────────────────────────────────────────
  function handleStart() {
    setWizardOpen(true);
    setStep(0);
    void runAnalysis();
  }

  function handleNext() {
    if (wizard.isLastStep(step)) {
      // Apply optimizations
      setApplied(true);
      // In production this would dispatch real commands via adapters
      setTimeout(() => setWizardOpen(false), 1800);
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleClose() {
    setWizardOpen(false);
    setStep(0);
  }

  // ── Chart data from forecast ───────────────────────────────────────
  const chartData = forecast.slice(0, 24).map((f) => ({
    time: f.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: Number((f.pricePerKwh * 100).toFixed(1)),
    renewable: Math.round(f.renewable),
  }));

  const hasData = energyData.pvPower > 0 || energyData.houseLoad > 0 || energyData.gridPower !== 0;

  return (
    <div className="flex flex-col gap-6">
      <PageTour tourId="optimization-ai" steps={TOUR_STEPS} />

      <div className="flex items-center gap-3">
        <PageHeader
          title={t('optimizationWizard.pageTitle')}
          subtitle={t('optimizationWizard.pageSubtitle')}
          icon={<Sparkles size={22} />}
        />
        {isDemo && <DemoBadge />}
        <HelpTooltip
          content={t(
            'tour.optimization.help',
            'KI-gestützter 3-Schritt-Assistent: Tarife analysieren, Empfehlungen prüfen, mit einem Klick anwenden.',
          )}
        />
      </div>

      {!hasData && !wizardOpen && (
        <EmptyState
          icon={Sparkles}
          title={t('empty.noEnergyData', 'Keine Energiedaten verfügbar')}
          description={t(
            'tour.optimization.emptyDesc',
            'Verbinden Sie einen Adapter, um den Optimierungsassistenten nutzen zu können.',
          )}
          pulse
        />
      )}

      {/* ── Overview cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: <Sun size={20} />,
            label: t('optimizationWizard.currentPv'),
            value: `${(energyData.pvPower / 1000).toFixed(1)} kW`,
            color: 'text-amber-400',
          },
          {
            icon: <Battery size={20} />,
            label: t('optimizationWizard.batterySoC'),
            value: `${Math.round(energyData.batterySoC)}%`,
            color: 'text-emerald-400',
          },
          {
            icon: <TrendingDown size={20} />,
            label: t('optimizationWizard.currentPrice'),
            value: `${energyData.priceCurrent.toFixed(3)} €/kWh`,
            color: 'text-sky-400',
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            className="glass-panel flex items-center gap-4 rounded-2xl p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`${card.color} rounded-xl bg-current/10 p-2.5`}>{card.icon}</div>
            <div>
              <p className="text-xs text-(--color-muted)">{card.label}</p>
              <p className="fluid-text-lg font-semibold tabular-nums">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Wizard dialog ──────────────────────────────────────── */}
      {wizardOpen && (
        <motion.section
          className="glass-panel-strong rounded-3xl p-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          aria-label={t('optimizationWizard.pageTitle')}
        >
          {/* Stepper */}
          <div className="mb-6">
            <WizardStepper
              steps={steps}
              currentStep={step}
              onStepClick={(i) => i < step && setStep(i)}
            />
          </div>

          {/* Step content */}
          <WizardContent currentStep={step}>
            {/* ── Step 1: Analyse ── */}
            <div className="flex flex-col gap-5">
              <h2 className="fluid-text-xl font-semibold">
                {t('optimizationWizard.analyseTitle')}
              </h2>

              {loading ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 py-12"
                  role="status"
                >
                  <Loader2
                    size={28}
                    className="animate-spin text-(--color-primary)"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-(--color-muted)">{t('ai.analyzing')}</p>
                </div>
              ) : (
                <>
                  {/* Tariff forecast chart */}
                  {chartData.length > 0 && (
                    <div className="glass-panel rounded-2xl p-4">
                      <h3 className="mb-3 text-sm font-medium text-(--color-muted)">
                        {t('forecast.tariffForecast')}
                      </h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0.3}
                              />
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                          />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--color-surface-strong)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="var(--color-primary)"
                            fill="url(#priceGrad)"
                            name={t('forecast.tariffPrice')}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Renewable % bar chart */}
                  {chartData.length > 0 && (
                    <div className="glass-panel rounded-2xl p-4">
                      <h3 className="mb-3 text-sm font-medium text-(--color-muted)">
                        {t('optimizationWizard.renewableShare')}
                      </h3>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--color-surface-strong)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                            }}
                          />
                          <Bar
                            dataKey="renewable"
                            fill="var(--color-accent)"
                            radius={[4, 4, 0, 0]}
                            name="%"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Step 2: AI Suggestions ── */}
            <div className="flex flex-col gap-5">
              <h2 className="fluid-text-xl font-semibold">
                {t('optimizationWizard.suggestionsTitle')}
              </h2>

              {/* Predictive AI recommendation */}
              {aiRecommendation && (
                <motion.div
                  className="neon-border-blue glass-panel-strong flex flex-col gap-3 rounded-2xl p-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-(--color-primary)" aria-hidden="true" />
                    <span className="text-sm font-semibold text-(--color-primary)">
                      {t('ai.aiPowered')}
                    </span>
                    <span className="ml-auto rounded-full bg-(--color-primary)/15 px-2.5 py-0.5 text-xs font-medium text-(--color-primary)">
                      {Math.round(aiRecommendation.confidence * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {(() => {
                      const ActionIcon = ACTION_ICONS[aiRecommendation.action] ?? Zap;
                      return (
                        <ActionIcon
                          size={22}
                          className="text-(--color-accent)"
                          aria-hidden="true"
                        />
                      );
                    })()}
                    <div>
                      <p className="text-sm font-medium">
                        {t(`optimizationWizard.action_${aiRecommendation.action}`)}
                      </p>
                      <p className="text-xs text-(--color-muted)">{aiRecommendation.reasoning}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1 text-xs text-(--color-muted)">
                    <span className="flex items-center gap-1">
                      <Clock size={12} aria-hidden="true" />
                      {aiRecommendation.optimalTimeSlot.start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      –
                      {aiRecommendation.optimalTimeSlot.end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Leaf size={12} aria-hidden="true" />
                      {t('optimizationWizard.estSavings')}: €
                      {aiRecommendation.estimatedSavings.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* MPC + rule-based recommendations */}
              <div className="grid gap-3 sm:grid-cols-2">
                {recommendations.map((rec, i) => {
                  const style = SEVERITY_STYLES[rec.severity];
                  const Icon = style.icon;
                  return (
                    <motion.div
                      key={rec.id}
                      className="glass-panel flex items-start gap-3 rounded-2xl p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className={`${style.bg} rounded-lg p-2`}>
                        <Icon size={16} className={style.text} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{t(rec.titleKey)}</p>
                        <p className="text-xs text-(--color-muted)">{t(rec.descriptionKey)}</p>
                        <span className="mt-1 inline-block rounded bg-(--color-primary)/10 px-2 py-0.5 text-xs font-semibold text-(--color-primary) tabular-nums">
                          {rec.value}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Step 3: Confirm & Apply ── */}
            <div className="flex flex-col gap-5">
              <h2 className="fluid-text-xl font-semibold">
                {t('optimizationWizard.confirmTitle')}
              </h2>

              {applied ? (
                <motion.div
                  className="flex flex-col items-center gap-3 py-10"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <CheckCircle2 size={48} className="text-emerald-400" />
                  <p className="fluid-text-lg font-semibold">{t('optimizationWizard.applied')}</p>
                  <p className="text-sm text-(--color-muted)">
                    {t('optimizationWizard.appliedDesc')}
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Summary list */}
                  <div className="glass-panel divide-y divide-(--color-border)/30 rounded-2xl">
                    {aiRecommendation && (
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm">
                          {t(`optimizationWizard.action_${aiRecommendation.action}`)}
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          {Math.round(aiRecommendation.confidence * 100)}%{' '}
                          {t('optimizationWizard.confidence')}
                        </span>
                      </div>
                    )}
                    {recommendations.slice(0, 4).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm">{t(rec.titleKey)}</span>
                        <span className="text-xs font-semibold text-(--color-primary) tabular-nums">
                          {rec.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {aiRecommendation && (
                    <p className="text-center text-xs text-(--color-muted)">
                      {t('optimizationWizard.estSavings')}:{' '}
                      <strong className="text-(--color-primary)">
                        €{aiRecommendation.estimatedSavings.toFixed(2)}
                      </strong>
                    </p>
                  )}
                </>
              )}
            </div>
          </WizardContent>

          {/* Navigation buttons */}
          {!applied && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={wizard.canGoBack(step) ? handleBack : handleClose}
                className="focus-ring flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-(--color-muted) transition-colors hover:text-(--color-text)"
              >
                <ArrowLeft size={16} />
                {wizard.canGoBack(step)
                  ? t('optimizationWizard.back')
                  : t('optimizationWizard.cancel')}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="focus-ring flex items-center gap-1.5 rounded-xl bg-(--color-primary) px-5 py-2 text-sm font-semibold text-(--color-background) transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {wizard.isLastStep(step) ? (
                  <>
                    <CheckCircle2 size={16} />
                    {t('optimizationWizard.apply')}
                  </>
                ) : (
                  <>
                    {t('optimizationWizard.next')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.section>
      )}

      <PageCrossLinks />

      {/* ── Floating "Optimize Now" button ────────────────────── */}
      <FloatingActionBar
        open={!wizardOpen}
        ariaLabel={t('optimizationWizard.pageTitle')}
        primaryAction={
          <button
            type="button"
            onClick={handleStart}
            className="focus-ring flex items-center gap-2 rounded-full bg-(--color-primary) px-5 py-2.5 text-sm font-semibold text-(--color-background) transition-opacity hover:opacity-90"
          >
            <Sparkles size={16} />
            {t('ai.optimizeNow')}
          </button>
        }
      />
    </div>
  );
}
