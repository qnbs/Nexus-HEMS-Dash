/**
 * Enhanced AI Optimizer with BYOK multi-provider support
 */

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAppStore } from '../store';
import { buildOptimizerRecommendations } from '../lib/optimizer';
import { callAI } from '../core/aiClient';
import { getActiveProvider } from '../lib/ai-keys';

interface GeminiRecommendation {
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export const EnhancedAIOptimizer = memo(function EnhancedAIOptimizer() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const settings = useAppStore((s) => s.settings);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [geminiRecommendations, setGeminiRecommendations] = useState<GeminiRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);

  // Check if a provider is configured
  useEffect(() => {
    void getActiveProvider().then((p) => setHasProvider(p !== null));
  }, []);

  // Get basic recommendations (memoized)
  const basicRecommendations = useMemo(
    () => buildOptimizerRecommendations(energyData, settings),
    [energyData, settings],
  );

  const handleOptimizeNow = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const prompt = `You are an AI energy optimization expert for a Home Energy Management System (HEMS).

Current System State:
- PV Generation: ${energyData.pvPower}W
- Battery SoC: ${energyData.batterySoC}%
- Battery Power: ${energyData.batteryPower}W
- House Load: ${energyData.houseLoad}W
- Grid Power: ${energyData.gridPower}W (${energyData.gridPower > 0 ? 'importing' : 'exporting'})
- Current Tariff Price: ${energyData.priceCurrent}€/kWh
- Heat Pump Status: ${energyData.heatPumpPower}W
- EV Charging: ${energyData.evPower}W

Settings:
- Charge Threshold: ${settings.chargeThreshold}€/kWh
- Max Grid Import: ${settings.maxGridImportKw}kW
- Tariff Provider: ${settings.tariffProvider}

Analyze the current situation and provide 3-5 actionable optimization recommendations to:
1. Minimize electricity costs
2. Maximize self-consumption
3. Reduce CO₂ emissions
4. Optimize battery usage
5. Smart EV charging strategy

Return ONLY a valid JSON array with this structure:
[
  {
    "title": "Short actionable title",
    "description": "Detailed explanation (2-3 sentences)",
    "impact": "Expected cost/CO2 savings",
    "priority": "high" | "medium" | "low"
  }
]`;

      const result = await callAI({ prompt });

      try {
        const recommendations = JSON.parse(result.text);
        setGeminiRecommendations(recommendations);
      } catch {
        setGeminiRecommendations([
          {
            title: 'AI Optimization',
            description: result.text,
            impact: 'Potential cost savings',
            priority: 'medium',
          },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Optimization failed';
      if (msg === 'NO_PROVIDER' || msg === 'KEY_EXPIRED') {
        setError(t('aiSettings.noKeys', 'No API keys configured yet. Add a provider below.'));
        setHasProvider(false);
      } else {
        setError(msg);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[color:var(--color-text)]">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[color:var(--color-primary)] shrink-0" aria-hidden="true" />
            <span className="truncate">{t('ai.optimizerTitle', 'AI Energy Optimizer')}</span>
            <span className="shrink-0 rounded-full bg-[color:var(--color-primary)]/20 px-2 py-0.5 text-xs font-medium text-[color:var(--color-primary)]">
              BYOK
            </span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[color:var(--color-muted)]">
            {t('ai.optimizerSubtitle', 'AI-powered recommendations for optimal energy management')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/settings/ai"
            className="btn-secondary focus-ring flex items-center gap-2 rounded-full px-3 py-2 text-sm"
          >
            <Key className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('aiSettings.title', 'AI Provider Keys')}</span>
          </Link>
          <button
            onClick={handleOptimizeNow}
            disabled={isOptimizing || hasProvider === false}
            className="btn-primary focus-ring flex items-center gap-2 text-sm"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" aria-hidden="true" />
                <span className="hidden xs:inline">{t('ai.optimizing', 'Optimizing...')}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="hidden xs:inline">{t('ai.optimizeNow', 'Optimize Now')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4" role="alert">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Basic Recommendations (Always Visible) */}
      {!geminiRecommendations.length && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {basicRecommendations.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-3 sm:p-4 ${getSeverityStyles(rec.severity)}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-medium truncate">{t(rec.titleKey)}</span>
                <span className="text-xs font-mono text-[color:var(--color-muted)] shrink-0">{rec.value}</span>
              </div>
              <p className="text-xs text-[color:var(--color-muted)]">{t(rec.descriptionKey)}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Gemini AI Recommendations */}
      <AnimatePresence mode="wait">
        {geminiRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 sm:space-y-4"
          >
            {geminiRecommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-4 sm:p-5 ${getPriorityStyles(rec.priority)}`}
              >
                <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-[color:var(--color-text)]">{rec.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${getPriorityBadge(rec.priority)}`}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p className="mb-2 sm:mb-3 text-xs sm:text-sm text-[color:var(--color-muted)]">{rec.description}</p>
                <div className="flex items-center gap-2 text-xs text-[color:var(--color-primary)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {rec.impact}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'positive':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'warning':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'critical':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    default:
      return 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 text-[color:var(--color-text)]';
  }
}

function getPriorityStyles(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-red-500/30 bg-red-500/5';
    case 'medium':
      return 'border-orange-500/30 bg-orange-500/5';
    case 'low':
      return 'border-blue-500/30 bg-blue-500/5';
    default:
      return 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50';
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500/20 text-red-400';
    case 'medium':
      return 'bg-orange-500/20 text-orange-400';
    case 'low':
      return 'bg-blue-500/20 text-blue-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
}
