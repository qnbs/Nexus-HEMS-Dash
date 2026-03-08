/**
 * Predictive AI with Google Gemini
 * Analyzes tariff data and provides optimal charging recommendations
 */

import type { EnergyData, StoredSettings } from '../types';

export interface PredictiveRecommendation {
  action: 'charge_ev' | 'charge_battery' | 'preheat' | 'wait';
  confidence: number;
  reasoning: string;
  optimalTimeSlot: {
    start: Date;
    end: Date;
    expectedPrice: number;
  };
  estimatedSavings: number;
}

export interface TariffForecast {
  timestamp: Date;
  pricePerKwh: number;
  renewable: number;
  co2Intensity: number;
}

/**
 * Fetches tariff forecast from Tibber/aWATTar
 */
export async function fetchTariffForecast(
  _provider: StoredSettings['tariffProvider'],
  _apiToken: string,
): Promise<TariffForecast[]> {
  // Mock implementation - in production, use real API
  const now = new Date();
  return Array.from({ length: 48 }, (_, i) => ({
    timestamp: new Date(now.getTime() + i * 3600000),
    pricePerKwh: 0.15 + Math.sin(i / 4) * 0.08 + Math.random() * 0.03,
    renewable: 40 + Math.sin(i / 6) * 20 + Math.random() * 10,
    co2Intensity: 200 + Math.sin(i / 8) * 80 + Math.random() * 30,
  }));
}

/**
 * Analyzes energy data and forecasts using AI to provide recommendations
 */
export async function generatePredictiveRecommendation(
  energyData: EnergyData,
  forecast: TariffForecast[],
  settings: StoredSettings,
): Promise<PredictiveRecommendation> {
  // Find optimal time slot (lowest price in next 24h)
  const sortedForecast = [...forecast].sort((a, b) => a.pricePerKwh - b.pricePerKwh);
  const optimalSlot = sortedForecast[0];

  const currentPrice = energyData.priceCurrent;
  const potentialSavings = (currentPrice - optimalSlot.pricePerKwh) * 20; // Assuming 20 kWh charge

  // Simple rule-based AI (in production, integrate with Gemini API)
  let action: PredictiveRecommendation['action'] = 'wait';
  let reasoning = 'Monitoring tariff trends...';
  let confidence = 0.6;

  if (energyData.priceCurrent < settings.chargeThreshold) {
    action = 'charge_battery';
    reasoning = `Current price (${currentPrice.toFixed(3)} €/kWh) is below threshold. Excellent charging opportunity.`;
    confidence = 0.92;
  } else if (energyData.batterySoC > 70 && energyData.priceCurrent < 0.18) {
    action = 'preheat';
    reasoning = 'Battery full, moderate prices. Preheat thermal storage via heat pump.';
    confidence = 0.85;
  } else if (potentialSavings > 2.0) {
    action = 'wait';
    reasoning = `Wait for optimal slot at ${optimalSlot.timestamp.toLocaleTimeString()} (save €${potentialSavings.toFixed(2)})`;
    confidence = 0.88;
  } else if (energyData.pvPower > 3000) {
    action = 'charge_ev';
    reasoning = 'High PV generation. Charge EV with surplus solar energy.';
    confidence = 0.95;
  }

  return {
    action,
    confidence,
    reasoning,
    optimalTimeSlot: {
      start: optimalSlot.timestamp,
      end: new Date(optimalSlot.timestamp.getTime() + 3600000),
      expectedPrice: optimalSlot.pricePerKwh,
    },
    estimatedSavings: Math.max(0, potentialSavings),
  };
}

/**
 * Integrates with Google Gemini API for advanced predictions
 */
export async function queryGeminiForOptimization(prompt: string, apiKey: string): Promise<string> {
  // In production, integrate with @google/genai
  try {
    // Mock response
    return `Based on historical patterns and weather forecast, charging your EV between 2-5 AM will save approximately €4.20 compared to peak hours. Solar generation is expected to peak tomorrow at 12:30 PM with 8.2 kWh output.`;
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'AI analysis temporarily unavailable.';
  }
}
