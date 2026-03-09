import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPriceHistory, getForecast, type TariffProvider } from './predictive-ai';

/**
 * Hook to fetch tariff price forecast for the next 24 hours
 */
export function usePriceForecast(provider: TariffProvider = 'tibber') {
  return useQuery({
    queryKey: ['price-forecast', provider],
    queryFn: async () => {
      const now = new Date();
      const prices = await getPriceHistory(provider, now, 24);
      const forecast = await getForecast(prices);
      return { prices, forecast };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
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
    staleTime: 1000 * 60 * 60, // 1 hour
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
  });
}
