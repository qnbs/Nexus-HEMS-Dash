import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Comlink from 'comlink';
import type { AIWorkerAPI } from '../workers/worker-types';
import type { TariffProvider } from './predictive-ai';

// Singleton AI worker for query hooks — shared across all usePriceForecast calls
let _aiWorker: Comlink.Remote<AIWorkerAPI> | null = null;
function getAIWorkerProxy(): Comlink.Remote<AIWorkerAPI> {
  if (!_aiWorker) {
    const w = new Worker(new URL('../workers/ai-worker.ts', import.meta.url), {
      type: 'module',
    });
    _aiWorker = Comlink.wrap<AIWorkerAPI>(w);
  }
  return _aiWorker;
}

/**
 * Hook to fetch tariff price forecast for the next 24 hours.
 * Price history generation + forecast analysis run in the AI Web Worker.
 */
export function usePriceForecast(provider: TariffProvider = 'tibber') {
  return useQuery({
    queryKey: ['price-forecast', provider],
    queryFn: async () => {
      const api = getAIWorkerProxy();
      const prices = await api.computePriceHistory(24);
      const forecast = await api.computeForecast(prices);
      return {
        prices: prices.map((p) => ({ ...p, timestamp: new Date(p.timestamp) })),
        forecast,
      };
    },
    staleTime: 1000 * 60 * 15, // 15 min — tariff data changes infrequently
    gcTime: 1000 * 60 * 60, // 1 h cache — avoid refetch on tab switch
    retry: 3,
  });
}

/**
 * Hook to fetch weather forecast data for PV prediction
 */
export function useWeatherForecast(lat: number = 52.52, lon: number = 13.405) {
  return useQuery({
    queryKey: ['weather-forecast', lat, lon],
    queryFn: async () => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,direct_radiation,diffuse_radiation&forecast_days=3&timezone=auto`,
      );
      if (!response.ok) throw new Error('Weather API failed');
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 h — weather forecasts are slow-changing
    gcTime: 1000 * 60 * 60 * 2, // 2 h cache — reduces API calls
    retry: 2,
  });
}

/**
 * Hook to cache energy data for offline mode
 */
export function useCacheEnergyData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { timestamp: number; energyData: unknown }) => {
      // Store in TanStack Query cache
      queryClient.setQueryData(['energy-snapshot', data.timestamp], data.energyData);
      return data;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['latest-energy-snapshot'] });
    },
  });
}

/**
 * Hook to get latest cached energy snapshot
 */
export function useLatestEnergySnapshot() {
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryCache();

  return useQuery({
    queryKey: ['latest-energy-snapshot'],
    queryFn: () => {
      // Find most recent energy snapshot
      const snapshots = cache
        .findAll({ queryKey: ['energy-snapshot'] })
        .filter((query) => query.state.data)
        .sort((a, b) => {
          const timestampA = (a.queryKey[1] as number) || 0;
          const timestampB = (b.queryKey[1] as number) || 0;
          return timestampB - timestampA;
        });

      if (snapshots.length === 0) return null;

      const latest = snapshots[0];
      const timestamp = latest.queryKey[1] as number;
      const age = Date.now() - timestamp;

      return {
        data: latest.state.data,
        timestamp,
        age,
        ageMinutes: Math.floor(age / 1000 / 60),
      };
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 5, // Limit cache to 5 minutes to prevent snapshot accumulation
  });
}
