import type { CommandContext } from './types';

/** Minimum EV draw (W) — aligned with device-commands provider */
const EV_IDLE_POWER_W = 100;

/** Minimum battery charge power (W) — aligned with device-commands provider */
const BATTERY_CHARGING_POWER_W = 100;

export interface AiSuggestionSpec {
  id: string;
  labelKey: string;
  descriptionKey: string;
  /** i18n key for preview title / reasoning */
  previewTitleKey: string;
  previewImpactKey?: string;
  /** Existing registry command this suggestion mirrors (documentation / tests) */
  mirrorsCommandId?: string;
  when: (ctx: CommandContext) => boolean;
}

export const AI_SUGGESTION_SPECS: readonly AiSuggestionSpec[] = [
  {
    id: 'ai.suggest.optimizeSurplus',
    labelKey: 'command.aiSuggest.optimizeSurplus',
    descriptionKey: 'command.aiSuggest.optimizeSurplusDesc',
    previewTitleKey: 'command.aiSuggest.preview.optimizeSurplus',
    previewImpactKey: 'command.aiSuggest.preview.optimizeSurplusImpact',
    mirrorsCommandId: 'energy.optimizeSurplus',
    when: (ctx) => ctx.energy.pvPower > ctx.energy.houseLoad * 1.2 && ctx.energy.pvPower > 0.5,
  },
  {
    id: 'ai.suggest.startEvCharging',
    labelKey: 'command.aiSuggest.startEvCharging',
    descriptionKey: 'command.aiSuggest.startEvChargingDesc',
    previewTitleKey: 'command.aiSuggest.preview.startEvCharging',
    previewImpactKey: 'command.aiSuggest.preview.startEvChargingImpact',
    mirrorsCommandId: 'device.startEvCharging',
    when: (ctx) =>
      ctx.energy.evPower < EV_IDLE_POWER_W &&
      ctx.energy.pvPower > ctx.energy.houseLoad * 1.1 &&
      ctx.energy.pvPower > 0.5,
  },
  {
    id: 'ai.suggest.batteryForceCharge',
    labelKey: 'command.aiSuggest.batteryForceCharge',
    descriptionKey: 'command.aiSuggest.batteryForceChargeDesc',
    previewTitleKey: 'command.aiSuggest.preview.batteryForceCharge',
    previewImpactKey: 'command.aiSuggest.preview.batteryForceChargeImpact',
    mirrorsCommandId: 'device.batteryForceCharge',
    when: (ctx) =>
      ctx.energy.batterySoC < 90 &&
      ctx.energy.batteryPower < BATTERY_CHARGING_POWER_W &&
      ctx.energy.priceCurrent < ctx.chargeThreshold,
  },
  {
    id: 'ai.suggest.viewTariffs',
    labelKey: 'command.aiSuggest.viewTariffs',
    descriptionKey: 'command.aiSuggest.viewTariffsDesc',
    previewTitleKey: 'command.aiSuggest.preview.viewTariffs',
    mirrorsCommandId: 'energy.viewTariffs',
    when: (ctx) => ctx.energy.priceCurrent > ctx.chargeThreshold,
  },
  {
    id: 'ai.suggest.viewBattery',
    labelKey: 'command.aiSuggest.viewBattery',
    descriptionKey: 'command.aiSuggest.viewBatteryDesc',
    previewTitleKey: 'command.aiSuggest.preview.viewBattery',
    mirrorsCommandId: 'energy.viewBattery',
    when: (ctx) => ctx.energy.batterySoC < 20,
  },
  {
    id: 'ai.suggest.checkMonitoring',
    labelKey: 'command.aiSuggest.checkMonitoring',
    descriptionKey: 'command.aiSuggest.checkMonitoringDesc',
    previewTitleKey: 'command.aiSuggest.preview.checkMonitoring',
    mirrorsCommandId: 'nav-monitoring',
    when: (ctx) => {
      for (const [, status] of ctx.adapterStatuses) {
        if (status === 'error') return true;
      }
      return false;
    },
  },
] as const;

/** Rule-based suggestions (no LLM). Gated by experimentalFeatures in the provider. */
export function getVisibleAiSuggestionSpecs(ctx: CommandContext): AiSuggestionSpec[] {
  if (!ctx.experimentalFeatures) return [];
  return AI_SUGGESTION_SPECS.filter((spec) => spec.when(ctx));
}
