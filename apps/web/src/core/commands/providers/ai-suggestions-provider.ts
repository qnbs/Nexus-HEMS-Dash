import { Sparkles } from 'lucide-react';
import { BATTERY_FORCE_CHARGE_W } from '../../../lib/battery-control';
import { type AiSuggestionSpec, getVisibleAiSuggestionSpecs } from '../ai-suggestions-engine';
import type { CommandDefinition, CommandProvider } from '../types';
import { navigateAndClose } from './provider-utils';

function buildPreview(spec: AiSuggestionSpec) {
  return () => ({
    titleKey: spec.previewTitleKey,
    ...(spec.previewImpactKey !== undefined ? { impactKey: spec.previewImpactKey } : {}),
  });
}

function buildSuggestionCommand(spec: AiSuggestionSpec): CommandDefinition {
  const base = {
    id: spec.id,
    labelKey: spec.labelKey,
    descriptionKey: spec.descriptionKey,
    icon: Sparkles,
    category: 'ai' as const,
    risk: 'safe' as const,
    keywords: ['ai', 'suggest', 'recommend', 'ki', 'empfehlung'],
    source: 'ai' as const,
    when: spec.when,
    preview: buildPreview(spec),
  };

  switch (spec.id) {
    case 'ai.suggest.optimizeSurplus':
      return {
        ...base,
        execute: (ctx) => {
          if (ctx.actions.onOptimize) ctx.actions.onOptimize();
          else ctx.navigate('/optimization-ai');
          ctx.actions.closePalette();
        },
      };
    case 'ai.suggest.startEvCharging':
      return {
        ...base,
        risk: 'moderate',
        blockedInReadOnly: true,
        hardwareCommand: { type: 'START_CHARGING', value: true },
        execute: (ctx) => {
          ctx.actions.closePalette();
        },
      };
    case 'ai.suggest.batteryForceCharge':
      return {
        ...base,
        risk: 'moderate',
        blockedInReadOnly: true,
        hardwareCommand: { type: 'SET_BATTERY_POWER', value: BATTERY_FORCE_CHARGE_W },
        execute: (ctx) => {
          ctx.actions.closePalette();
        },
      };
    case 'ai.suggest.viewTariffs':
      return {
        ...base,
        execute: (ctx) => navigateAndClose(ctx, '/tariffs'),
      };
    case 'ai.suggest.viewBattery':
      return {
        ...base,
        execute: (ctx) => navigateAndClose(ctx, '/energy-flow'),
      };
    case 'ai.suggest.checkMonitoring':
      return {
        ...base,
        execute: (ctx) => navigateAndClose(ctx, '/monitoring'),
      };
    default:
      return {
        ...base,
        execute: (ctx) => ctx.actions.closePalette(),
      };
  }
}

export const aiSuggestionsProvider: CommandProvider = {
  id: 'ai-suggestions',
  priority: 150,
  getCommands: (ctx) => getVisibleAiSuggestionSpecs(ctx).map(buildSuggestionCommand),
};
