import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import http from 'http';

// ─── Prometheus Metrics (server-side) ─────────────────────────────
interface ServerMetricSample {
  name: string;
  help: string;
  type: string;
  labels: Record<string, string>;
  value: number;
  timestamp: number;
}

const serverMetrics: Map<string, ServerMetricSample[]> = new Map();
const serverStartTime = Date.now();
const wsMessageCount = { inbound: 0, outbound: 0 };

function setMetric(
  name: string,
  help: string,
  type: string,
  value: number,
  labels: Record<string, string> = {},
): void {
  if (!serverMetrics.has(name)) {
    serverMetrics.set(name, []);
  }
  const arr = serverMetrics.get(name)!;
  const existingIdx = arr.findIndex(
    (s) =>
      Object.keys(labels).length === Object.keys(s.labels).length &&
      Object.entries(labels).every(([k, v]) => s.labels[k] === v),
  );
  const sample: ServerMetricSample = { name, help, type, labels, value, timestamp: Date.now() };
  if (existingIdx >= 0) arr[existingIdx] = sample;
  else arr.push(sample);
}

function formatMetricLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  return '{' + entries.map(([k, v]) => `${k}="${v}"`).join(',') + '}';
}

function renderPrometheusText(): string {
  const lines: string[] = [];
  for (const [, samples] of serverMetrics) {
    if (samples.length === 0) continue;
    const first = samples[0];
    lines.push(`# HELP ${first.name} ${first.help}`);
    lines.push(`# TYPE ${first.name} ${first.type}`);
    for (const s of samples) {
      lines.push(`${s.name}${formatMetricLabels(s.labels)} ${s.value} ${s.timestamp}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function updateServerMetrics(data: Record<string, number>): void {
  setMetric('hems_pv_power_watts', 'Current PV generation power in watts', 'gauge', data.pvPower, {
    inverter: 'primary',
  });
  setMetric(
    'hems_battery_power_watts',
    'Battery power (positive=charging, negative=discharging)',
    'gauge',
    data.batteryPower,
    { battery_id: 'main' },
  );
  setMetric(
    'hems_grid_power_watts',
    'Grid power (positive=import, negative=export)',
    'gauge',
    data.gridPower,
    { phase: 'total' },
  );
  setMetric(
    'hems_house_load_watts',
    'Total household consumption in watts',
    'gauge',
    data.houseLoad,
  );
  setMetric('hems_ev_charger_power_watts', 'EV charger power in watts', 'gauge', data.evPower, {
    charger_id: 'wallbox-1',
  });
  setMetric(
    'hems_heat_pump_power_watts',
    'Heat pump power consumption in watts',
    'gauge',
    data.heatPumpPower,
  );
  setMetric('hems_battery_soc_percent', 'Battery state of charge', 'gauge', data.batterySoC, {
    battery_id: 'main',
  });
  setMetric('hems_grid_voltage_volts', 'Grid voltage', 'gauge', data.gridVoltage, { phase: 'L1' });
  setMetric('hems_battery_voltage_volts', 'Battery voltage', 'gauge', data.batteryVoltage, {
    battery_id: 'main',
  });
  setMetric('hems_pv_yield_today_kwh', 'PV yield today in kWh', 'counter', data.pvYieldToday);
  setMetric(
    'hems_tariff_price_eur_per_kwh',
    'Current electricity tariff price',
    'gauge',
    data.priceCurrent,
    { provider: 'tibber' },
  );
  setMetric(
    'hems_uptime_seconds',
    'Dashboard uptime in seconds',
    'counter',
    (Date.now() - serverStartTime) / 1000,
  );
  setMetric(
    'hems_websocket_messages_total',
    'Total WebSocket messages received',
    'counter',
    wsMessageCount.inbound,
    { direction: 'inbound' },
  );
  setMetric(
    'hems_websocket_messages_total',
    'Total WebSocket messages received',
    'counter',
    wsMessageCount.outbound,
    { direction: 'outbound' },
  );
  setMetric(
    'hems_websocket_connections_active',
    'Number of active WebSocket connections',
    'gauge',
    0,
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // API routes FIRST
  app.get('/api/health', (_req, res) => {
    const adapters = ['victron-mqtt', 'modbus-sunspec', 'knx', 'ocpp', 'eebus'];
    res.json({
      status: 'ok',
      uptime: (Date.now() - serverStartTime) / 1000,
      adapters: adapters.map((a) => ({ id: a, status: 'connected' })),
      metrics: { totalSamples: serverMetrics.size },
    });
  });

  // ─── Prometheus scrape endpoint ───────────────────────────────────
  app.get('/metrics', (_req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(renderPrometheusText());
  });

  // ─── JSON metrics endpoint (for in-app dashboard) ────────────────
  app.get('/api/metrics/json', (_req, res) => {
    const families: Array<{
      name: string;
      help: string;
      type: string;
      samples: Array<{ labels: Record<string, string>; value: number; timestamp: number }>;
    }> = [];
    for (const [name, samples] of serverMetrics) {
      if (samples.length === 0) continue;
      families.push({
        name,
        help: samples[0].help,
        type: samples[0].type,
        samples: samples.map((s) => ({ labels: s.labels, value: s.value, timestamp: s.timestamp })),
      });
    }
    res.json({
      families,
      health: { uptime: (Date.now() - serverStartTime) / 1000, connections: wss.clients.size },
    });
  });

  // ─── Grafana Dashboard provisioning endpoint ─────────────────────
  app.get('/api/grafana/dashboard', (_req, res) => {
    res.json({
      dashboard: {
        id: null,
        uid: 'nexus-hems-overview',
        title: 'Nexus HEMS — Energy Overview',
        timezone: 'browser',
        refresh: '5s',
        time: { from: 'now-1h', to: 'now' },
        panels: [
          {
            title: 'PV Generation',
            type: 'timeseries',
            gridPos: { h: 8, w: 12, x: 0, y: 0 },
            targets: [{ expr: 'hems_pv_power_watts', legendFormat: 'PV Power' }],
            fieldConfig: {
              defaults: { unit: 'watt', color: { mode: 'fixed', fixedColor: 'yellow' } },
            },
          },
          {
            title: 'Grid Power',
            type: 'timeseries',
            gridPos: { h: 8, w: 12, x: 12, y: 0 },
            targets: [
              { expr: 'hems_grid_power_watts', legendFormat: 'Grid (+ import / - export)' },
            ],
            fieldConfig: { defaults: { unit: 'watt' } },
          },
          {
            title: 'Battery SoC',
            type: 'gauge',
            gridPos: { h: 8, w: 6, x: 0, y: 8 },
            targets: [{ expr: 'hems_battery_soc_percent' }],
            fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } },
          },
          {
            title: 'House Load',
            type: 'stat',
            gridPos: { h: 4, w: 6, x: 6, y: 8 },
            targets: [{ expr: 'hems_house_load_watts' }],
            fieldConfig: { defaults: { unit: 'watt' } },
          },
          {
            title: 'Electricity Price',
            type: 'timeseries',
            gridPos: { h: 8, w: 12, x: 12, y: 8 },
            targets: [{ expr: 'hems_tariff_price_eur_per_kwh', legendFormat: '{{provider}}' }],
            fieldConfig: { defaults: { unit: 'currencyEUR', decimals: 3 } },
          },
          {
            title: 'Adapter Status',
            type: 'table',
            gridPos: { h: 6, w: 24, x: 0, y: 16 },
            targets: [{ expr: 'hems_adapter_connected', format: 'table', instant: true }],
          },
        ],
        templating: {
          list: [
            {
              name: 'adapter',
              type: 'query',
              query: 'label_values(hems_adapter_connected, adapter)',
              refresh: 2,
              multi: true,
              includeAll: true,
            },
          ],
        },
      },
      overwrite: true,
    });
  });

  // Mock data generation for the dashboard
  const mockData = {
    gridPower: 0,
    pvPower: 2500,
    batteryPower: -500,
    houseLoad: 2000,
    batterySoC: 65,
    heatPumpPower: 800,
    evPower: 0,
    gridVoltage: 230,
    batteryVoltage: 51.2,
    pvYieldToday: 12.5,
    priceCurrent: 0.15,
  };

  // Update mock data periodically
  setInterval(() => {
    // Add some random noise to the data
    mockData.pvPower = Math.max(0, mockData.pvPower + (Math.random() * 200 - 100));
    mockData.houseLoad = Math.max(300, mockData.houseLoad + (Math.random() * 100 - 50));

    // Simple energy balance: Grid = House + Battery + EV + HeatPump - PV
    mockData.gridPower =
      mockData.houseLoad +
      mockData.batteryPower +
      mockData.evPower +
      mockData.heatPumpPower -
      mockData.pvPower;

    // Update Prometheus metrics
    updateServerMetrics(mockData);
    setMetric(
      'hems_websocket_connections_active',
      'Number of active WebSocket connections',
      'gauge',
      wss.clients.size,
    );

    // Broadcast to all connected clients
    const message = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
        wsMessageCount.outbound++;
      }
    });
  }, 2000);

  wss.on('connection', (ws) => {
    console.log('Client connected');
    // Send initial data
    ws.send(JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData }));

    ws.on('message', (message) => {
      wsMessageCount.inbound++;
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'SET_EV_POWER') {
          mockData.evPower = parsed.value;
        } else if (parsed.type === 'SET_HEAT_PUMP_POWER') {
          mockData.heatPumpPower = parsed.value;
        } else if (parsed.type === 'SET_BATTERY_POWER') {
          mockData.batteryPower = parsed.value;
        }
        // Broadcast update immediately
        mockData.gridPower =
          mockData.houseLoad +
          mockData.batteryPower +
          mockData.evPower +
          mockData.heatPumpPower -
          mockData.pvPower;
        const updateMsg = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
        wss.clients.forEach((c) => {
          if (c.readyState === 1) c.send(updateMsg);
        });
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
