/**
 * Enhanced AI Optimizer with Google Gemini 2.5 Integration
 */

import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../store';
import { buildOptimizerRecommendations } from '../lib/optimizer';

interface GeminiRecommendation {
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

async function callGeminiAPI(prompt: string, apiKey: string): Promise<GeminiRecommendation[]> {
  try {
    // Real Gemini API integration
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';

    // Parse response (expecting structured JSON)
    try {
      const recommendations = JSON.parse(text);
      return recommendations;
    } catch {
      // Fallback: parse as plain text
      return [
        {
          title: 'AI Optimization',
          description: text,
          impact: 'Potential cost savings',
          priority: 'medium',
        },
      ];
    }
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

export const EnhancedAIOptimizer = memo(function EnhancedAIOptimizer() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const settings = useAppStore((s) => s.settings);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [geminiRecommendations, setGeminiRecommendations] = useState<GeminiRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get basic recommendations (memoized)
  const basicRecommendations = useMemo(
    () => buildOptimizerRecommendations(energyData, settings),
    [energyData, settings],
  );

  const handleOptimizeNow = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env');
      }

      // Construct detailed prompt for Gemini
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
- Discharge Threshold: ${settings.dischargeThreshold}€/kWh
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

      const recommendations = await callGeminiAPI(prompt, apiKey);
      setGeminiRecommendations(recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[color:var(--color-text)]">
            <Sparkles className="h-6 w-6 text-[color:var(--color-primary)]" aria-hidden="true" />
            {t('ai.optimizerTitle', 'AI Energy Optimizer')}
            <span className="ml-2 rounded-full bg-[color:var(--color-primary)]/20 px-2 py-0.5 text-xs font-medium text-[color:var(--color-primary)]">
              Gemini 2.5
            </span>
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {t('ai.optimizerSubtitle', 'AI-powered recommendations for optimal energy management')}
          </p>
        </div>

        <button
          onClick={handleOptimizeNow}
          disabled={isOptimizing}
          className="btn-primary focus-ring flex items-center gap-2"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {t('ai.optimizing', 'Optimizing...')}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              {t('ai.optimizeNow', 'Optimize Now')}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Basic Recommendations (Always Visible) */}
      {!geminiRecommendations.length && (
        <div className="grid gap-4 sm:grid-cols-2">
          {basicRecommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-4 ${getSeverityStyles(rec.severity)}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{t(rec.title)}</span>
                {rec.live && <span className="pulse-badge">{t('common.live', 'LIVE')}</span>}
              </div>
              <p className="text-xs text-[color:var(--color-muted)]">{t(rec.description)}</p>
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
            className="space-y-4"
          >
            {geminiRecommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-5 ${getPriorityStyles(rec.priority)}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-[color:var(--color-text)]">{rec.title}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityBadge(rec.priority)}`}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p className="mb-3 text-sm text-[color:var(--color-muted)]">{rec.description}</p>
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
