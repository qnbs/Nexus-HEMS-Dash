import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CloudSun, TrendingUp, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

import { useAppStore } from '../store';

interface ForecastDataPoint {
  time: string;
  pvForecast: number;
  price: number;
  co2Intensity: number;
  consumption: number;
}

interface WeatherForecast {
  timestamp: Date;
  temperature: number;
  cloudCover: number;
  pvPotential: number;
}

/**
 * Fetches weather forecast from Open-Meteo API
 */
async function fetchWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover,shortwave_radiation&forecast_days=7`,
    );
    const data = await response.json();

    return data.hourly.time.map((time: string, i: number) => ({
      timestamp: new Date(time),
      temperature: data.hourly.temperature_2m[i],
      cloudCover: data.hourly.cloudcover[i],
      pvPotential: data.hourly.shortwave_radiation[i] / 10, // Convert W/m² to kW
    }));
  } catch (error) {
    console.error('Weather forecast fetch error:', error);
    // Fallback simulation
    return Array.from({ length: 168 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 3600000),
      temperature: 15 + Math.sin(i / 6) * 10,
      cloudCover: 30 + Math.sin(i / 8) * 40,
      pvPotential: Math.max(0, Math.sin(((i % 24) / 24) * Math.PI * 2) * 8),
    }));
  }
}

export function PredictiveForecast() {
  const { t, i18n } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [totalSavings, setTotalSavings] = useState(0);
  const [co2Saved, setCo2Saved] = useState(0);

  useEffect(() => {
    const run = async () => {
      // Default location: Hamburg, Germany
      const lat = settings.location?.lat || 53.5511;
      const lon = settings.location?.lon || 9.9937;

      const weather = await fetchWeatherForecast(lat, lon);
      const hours = timeRange === '24h' ? 24 : 168;

      const data: ForecastDataPoint[] = weather.slice(0, hours).map((w) => {
        // Simulate tariff pricing (peak hours: 17-21)
        const hour = w.timestamp.getHours();
        const isPeak = hour >= 17 && hour <= 21;
        const basePrice = settings.gridPriceAvg || 0.25;
        const price = isPeak ? basePrice * 1.5 : basePrice * 0.8;

        // Estimate consumption pattern (higher during day and evening)
        const consumption = 1.5 + Math.sin((hour / 24) * Math.PI * 2) * 1.2;

        const dateLocale = i18n.language === 'de' ? 'de-DE' : 'en-US';

        return {
          time:
            timeRange === '24h'
              ? w.timestamp.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
              : w.timestamp.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric' }),
          pvForecast: w.pvPotential,
          price: price,
          co2Intensity: 300 + (100 - w.pvPotential * 5), // Lower CO2 when solar is high
          consumption: consumption,
        };
      });

      setForecastData(data);

      // Calculate total savings if optimizing with PV
      const savings = data.reduce((sum, d) => {
        const pvSurplus = Math.max(0, d.pvForecast - d.consumption);
        return sum + pvSurplus * d.price;
      }, 0);
      setTotalSavings(savings);

      // Calculate CO2 savings
      const co2 = data.reduce((sum, d) => {
        return sum + d.pvForecast * 0.5; // 500g CO2/kWh grid equivalent
      }, 0);
      setCo2Saved(co2);
    };
    run();
  }, [timeRange, settings.location, settings.gridPriceAvg, i18n.language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="fluid-text-xl font-semibold text-(--color-text)">
            <CloudSun className="mr-2 inline h-6 w-6 text-(--color-primary)" aria-hidden="true" />
            {t('forecast.title')}
          </h2>
          <p className="mt-1 text-sm text-(--color-muted)">{t('forecast.subtitle')}</p>
        </div>

        {/* Time Range Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              timeRange === '24h'
                ? 'bg-(--color-primary) font-bold text-(--color-background)'
                : 'bg-(--color-surface) text-(--color-muted) hover:bg-white/10'
            }`}
            aria-pressed={timeRange === '24h'}
            aria-label={t('forecast.hours24')}
          >
            {t('forecast.hours24')}
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              timeRange === '7d'
                ? 'bg-(--color-primary) font-bold text-(--color-background)'
                : 'bg-(--color-surface) text-(--color-muted) hover:bg-white/10'
            }`}
            aria-pressed={timeRange === '7d'}
            aria-label={t('forecast.days7')}
          >
            {t('forecast.days7')}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <span className="text-sm text-emerald-400">{t('forecast.potentialSavings')}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">€{totalSavings.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-400" aria-hidden="true" />
            <span className="text-sm text-green-400">{t('forecast.co2Saved')}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-300">{co2Saved.toFixed(1)} kg</p>
        </div>

        <div className="rounded-2xl bg-blue-500/10 p-4">
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <span className="text-sm text-blue-400">{t('forecast.avgPvGeneration')}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-300">
            {(forecastData.reduce((sum, d) => sum + d.pvForecast, 0) / forecastData.length).toFixed(
              1,
            )}{' '}
            kW
          </p>
        </div>
      </div>

      {/* Chart */}
      <div
        className="h-80"
        role="img"
        aria-label={t('chart.forecastAriaLabel', 'Energy production and price forecast chart')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
              label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
              label={{ value: '€/kWh', angle: 90, position: 'insideRight', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#e2e8f0',
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} iconType="line" />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="pvForecast"
              stroke="#fbbf24"
              fillOpacity={1}
              fill="url(#colorPv)"
              name={t('forecast.pvGeneration')}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name={t('forecast.tariffPrice')}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="consumption"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name={t('forecast.consumption')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best Action Recommendation */}
      <div className="mt-6 rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/10 p-4">
        <p className="text-sm font-medium text-(--color-primary)">{t('forecast.recommendation')}</p>
        <p className="mt-1 text-sm text-(--color-muted)">{t('forecast.recommendationText')}</p>
      </div>
    </motion.div>
  );
}
