/**
 * Protocol Adapter Registry — Backend
 *
 * Instantiates and starts all configured protocol adapters based on
 * the ADAPTER_MODE environment variable and device-map.json.
 *
 * ADAPTER_MODE=mock  → No real hardware adapters started (safe for CI/demo)
 * ADAPTER_MODE=live  → Modbus + MQTT adapters started from device-map.json
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IProtocolAdapter } from '@nexus-hems/shared-types';
import type { EventBus } from '../core/EventBus.js';
import { type DeviceConfig, ModbusAdapter } from './modbus/ModbusAdapter.js';
import { MqttAdapter } from './mqtt/MqttAdapter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEVICE_MAP_PATH = join(__dirname, '../data/device-map.json');

const activeAdapters: IProtocolAdapter[] = [];

/**
 * Start all protocol adapters and connect them to the EventBus.
 * Called once on server startup.
 */
export async function startProtocolAdapters(eventBus: EventBus): Promise<void> {
  const mode = process.env.ADAPTER_MODE ?? 'live';

  if (mode === 'mock') {
    console.log('[Adapters] ADAPTER_MODE=mock — skipping hardware adapter startup.');
    return;
  }

  // -------------------------------------------------------------------------
  // Modbus Adapters (from device-map.json)
  // -------------------------------------------------------------------------
  let deviceMap: DeviceConfig[] = [];
  try {
    const raw = readFileSync(DEVICE_MAP_PATH, 'utf8');
    deviceMap = JSON.parse(raw) as DeviceConfig[];
  } catch (err) {
    console.warn(
      '[Adapters] device-map.json not found or invalid — no Modbus adapters started:',
      err,
    );
  }

  for (const device of deviceMap) {
    if (device.protocol !== 'modbus-sunspec') continue;

    const adapter = new ModbusAdapter(device);
    activeAdapters.push(adapter);

    // Connect and pipe data stream to EventBus
    adapter
      .connect()
      .then(() => {
        pipeAdapterToEventBus(adapter, eventBus);
      })
      .catch((err: unknown) => {
        console.error('[Adapters] Failed to start ModbusAdapter:', device.deviceId, err);
      });
  }

  // -------------------------------------------------------------------------
  // MQTT Adapter (Victron Venus OS / generic MQTT brokers)
  // -------------------------------------------------------------------------
  const mqttBrokerUrl = process.env.MQTT_BROKER_URL;
  if (mqttBrokerUrl) {
    const mqttAdapter = new MqttAdapter({
      id: 'victron-mqtt-01',
      protocol: 'victron-mqtt',
      brokerUrl: mqttBrokerUrl,
      topicPatterns: [
        {
          pattern: 'N/+/system/+/Dc/Battery/Power',
          metric: 'POWER_W',
          deviceIdExtract: 'topic[1]',
        },
        {
          pattern: 'N/+/system/+/Dc/Battery/Soc',
          metric: 'SOC_PERCENT',
          deviceIdExtract: 'topic[1]',
        },
        {
          pattern: 'N/+/vebus/+/Ac/Out/P',
          metric: 'POWER_W',
          deviceIdExtract: 'topic[1]',
        },
      ],
    });
    activeAdapters.push(mqttAdapter);

    mqttAdapter
      .connect()
      .then(() => {
        pipeAdapterToEventBus(mqttAdapter, eventBus);
      })
      .catch((err: unknown) => {
        console.error('[Adapters] Failed to start MqttAdapter:', err);
      });
  }

  console.log(`[Adapters] Started ${activeAdapters.length} adapter(s).`);
}

/**
 * Gracefully disconnect all active adapters.
 * Called on SIGTERM / SIGINT.
 */
export async function stopProtocolAdapters(): Promise<void> {
  await Promise.allSettled(activeAdapters.map((a) => a.disconnect()));
  activeAdapters.length = 0;
}

/**
 * Pipe the async data stream from an adapter into the EventBus.
 * Runs in the background — errors are logged but do not crash the server.
 */
function pipeAdapterToEventBus(adapter: IProtocolAdapter, eventBus: EventBus): void {
  (async () => {
    for await (const datapoint of adapter.getDataStream()) {
      eventBus.emit(datapoint);
    }
  })().catch((err: unknown) => {
    console.error('[Adapters] Data stream error for adapter:', adapter.id, err);
  });
}
