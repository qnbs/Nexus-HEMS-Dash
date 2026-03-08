import type { EnergyData, OptimizerRecommendation, StoredSettings } from '../types';

export function buildOptimizerRecommendations(
  energyData: EnergyData,
  settings: StoredSettings,
): OptimizerRecommendation[] {
  const recommendations: OptimizerRecommendation[] = [];
  const pvSurplus = Math.max(
    0,
    energyData.pvPower - energyData.houseLoad - energyData.heatPumpPower - energyData.evPower,
  );

  if (energyData.priceCurrent <= settings.chargeThreshold) {
    recommendations.push({
      id: 'charge-window',
      severity: 'positive',
      titleKey: 'ai.batteryStrategy',
      descriptionKey: 'ai.statusCharge',
      value: `${energyData.priceCurrent.toFixed(3)} €/kWh`,
    });
  }

  if (pvSurplus > 1800) {
    recommendations.push({
      id: 'pv-surplus',
      severity: 'positive',
      titleKey: 'ai.evStrategy',
      descriptionKey: 'ai.statusOptimal',
      value: `${Math.round(pvSurplus)} W`,
    });
  }

  if (energyData.batterySoC > 65 && energyData.priceCurrent < settings.chargeThreshold + 0.03) {
    recommendations.push({
      id: 'sg-ready',
      severity: 'warning',
      titleKey: 'ai.heatPumpStrategy',
      descriptionKey: 'ai.statusHeatPump',
      value: 'SG Ready',
    });
  }

  if (energyData.gridPower / 1000 > settings.maxGridImportKw) {
    recommendations.push({
      id: 'grid-limit',
      severity: 'critical',
      titleKey: 'ai.nextBestAction',
      descriptionKey: 'ai.statusCaution',
      value: `${(energyData.gridPower / 1000).toFixed(1)} kW`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'balanced',
      severity: 'neutral',
      titleKey: 'ai.forecast',
      descriptionKey: 'dashboard.refreshed',
      value: `${energyData.priceCurrent.toFixed(3)} €/kWh`,
    });
  }

  return recommendations;
}
