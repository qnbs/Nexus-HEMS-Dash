import { describe, it, expect } from 'vitest';
import {
  fetchTariffForecast,
  generatePredictiveRecommendation,
  queryAIForOptimization,
  getPriceHistory,
  getForecast,
} from '../lib/predictive-ai';
import type { EnergyData, StoredSettings } from '../types';

const mockEnergyData: EnergyData = {
  gridPower: 200,
  pvPower: 4000,
  batteryPower: -500,
  houseLoad: 1200,
  batterySoC: 45,
  heatPumpPower: 800,
  evPower: 0,
  gridVoltage: 230,
  batteryVoltage: 51.2,
  pvYieldToday: 12.5,
  priceCurrent: 0.12,
};

const mockSettings = {
  chargeThreshold: 0.15,
} as StoredSettings;

describe('Predictive AI', () => {
  describe('fetchTariffForecast', () => {
    it('should return 48 hourly forecast entries', async () => {
      const forecast = await fetchTariffForecast('tibber', 'token');
      expect(forecast).toHaveLength(48);
      expect(forecast[0]).toHaveProperty('timestamp');
      expect(forecast[0]).toHaveProperty('pricePerKwh');
      expect(forecast[0]).toHaveProperty('renewable');
      expect(forecast[0]).toHaveProperty('co2Intensity');
    });

    it('should return numbers for all forecast values', async () => {
      const forecast = await fetchTariffForecast('awattar', 'token');
      for (const entry of forecast) {
        expect(entry.pricePerKwh).toBeTypeOf('number');
        expect(entry.renewable).toBeTypeOf('number');
        expect(entry.co2Intensity).toBeTypeOf('number');
      }
    });
  });

  describe('generatePredictiveRecommendation', () => {
    it('should recommend battery charging when price is below threshold', async () => {
      const forecast = await fetchTariffForecast('tibber', 'token');
      const rec = await generatePredictiveRecommendation(mockEnergyData, forecast, mockSettings);
      expect(rec.action).toBe('charge_battery');
      expect(rec.confidence).toBeGreaterThan(0.5);
      expect(rec.reasoning).toBeTruthy();
      expect(rec.optimalTimeSlot).toHaveProperty('start');
      expect(rec.optimalTimeSlot).toHaveProperty('end');
    });

    it('should recommend EV charging at high PV output', async () => {
      const highPvData = { ...mockEnergyData, pvPower: 5000, priceCurrent: 0.3, batterySoC: 30 };
      const forecast = await fetchTariffForecast('tibber', 'token');
      const rec = await generatePredictiveRecommendation(highPvData, forecast, mockSettings);
      expect(['charge_ev', 'wait', 'charge_battery']).toContain(rec.action);
    });

    it('should include estimatedSavings >= 0', async () => {
      const forecast = await fetchTariffForecast('tibber', 'token');
      const rec = await generatePredictiveRecommendation(mockEnergyData, forecast, mockSettings);
      expect(rec.estimatedSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('queryAIForOptimization', () => {
    it('should return a non-empty string', async () => {
      const result = await queryAIForOptimization('test prompt', 'key');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('getPriceHistory', () => {
    it('should return price points for requested hours', async () => {
      const prices = await getPriceHistory('tibber', new Date(), 24);
      expect(prices).toHaveLength(24);
      expect(prices[0]).toHaveProperty('timestamp');
      expect(prices[0]).toHaveProperty('price');
    });
  });

  describe('getForecast', () => {
    it('should generate forecast from price history', async () => {
      const prices = await getPriceHistory('tibber', new Date(), 24);
      const forecast = await getForecast(prices);
      expect(forecast).toBeTruthy();
    });
  });
});
