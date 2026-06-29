/**
 * Protocol Adapter Registry — Backend
 *
 * Instantiates and starts all configured protocol adapters based on
 * the ADAPTER_MODE environment variable and device-map.json.
 *
 * ADAPTER_MODE=mock (default) → No real hardware adapters started (safe for CI/demo)
 * ADAPTER_MODE=live + ALLOW_LIVE_HARDWARE=true → Modbus + MQTT adapters from device-map.json
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IProtocolAdapter } from '@nexus-hems/shared-types';
import {
  getEffectiveAdapterMode,
  isLiveHardwareAllowed,
  logAdapterModeStartup,
} from '../config/adapter-mode.js';
import type { EventBus } from '../core/EventBus.js';
import { type DeviceConfig, ModbusAdapter } from './modbus/ModbusAdapter.js';
import { MqttAdapter } from './mqtt/MqttAdapter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEVICE_MAP_PATH = join(__dirname, '../data/device-map.json');

const activeAdapters: IProtocolAdapter[] = [];

export type AdapterStatus = 'starting' | 'healthy' | 'unhealthy' | 'failed' | 'stopped';

export interface AdapterRunState {
  id: string;
  protocol: string;
  status: AdapterStatus;
  error?: string | undefined;
  startedAt?: number | undefined;
  lastCheckAt?: number | undefined;
}

const adapterStates = new Map<string, AdapterRunState>();

function setState(
  id: string,
  protocol: string,
  status: AdapterStatus,
  error?: string,
): AdapterRunState {
  const existing = adapterStates.get(id);
  const state: AdapterRunState = {
    ...existing,
    id,
    protocol,
    status,
    error,
    lastCheckAt: Date.now(),
  };
  adapterStates.set(id, state);
  return state;
}

/**
 * Start all protocol adapters and connect them to the EventBus.
 * Called once on server startup.
 */
export async function startProtocolAdapters(eventBus: EventBus): Promise<void> {
  logAdapterModeStartup();

  if (!isLiveHardwareAllowed()) {
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
    setState(device.deviceId, device.protocol, 'starting');

    // Connect and pipe data stream to EventBus
    adapter
      .connect()
      .then(() => {
        setState(device.deviceId, device.protocol, 'healthy');
        pipeAdapterToEventBus(adapter, eventBus);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setState(device.deviceId, device.protocol, 'failed', message);
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
    setState(mqttAdapter.id, mqttAdapter.protocol, 'starting');

    mqttAdapter
      .connect()
      .then(() => {
        setState(mqttAdapter.id, mqttAdapter.protocol, 'healthy');
        pipeAdapterToEventBus(mqttAdapter, eventBus);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setState(mqttAdapter.id, mqttAdapter.protocol, 'failed', message);
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
  for (const adapter of activeAdapters) {
    setState(adapter.id, adapter.protocol, 'stopped');
  }
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

/**
 * Return the current run-state snapshot for all configured adapters.
 */
export function getAdapterRunStates(): AdapterRunState[] {
  return Array.from(adapterStates.values());
}

export interface AdapterHealthSummary {
  mode: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  adapters: AdapterRunState[];
}

/**
 * Pure health computation from a mode string and adapter states.
 *
 * - mock mode         → healthy (no hardware expected)
 * - live mode, no adapters configured → unhealthy (silent degradation)
 * - any failed adapter → unhealthy
 * - all healthy        → healthy
 */
export function computeAdapterHealth(
  mode: string,
  adapters: AdapterRunState[],
): AdapterHealthSummary {
  if (mode === 'mock') {
    return { mode, overall: 'healthy', adapters };
  }

  if (adapters.length === 0) {
    return { mode, overall: 'unhealthy', adapters };
  }

  const failed = adapters.some((a) => a.status === 'failed');
  if (failed) {
    return { mode, overall: 'unhealthy', adapters };
  }

  const allHealthy = adapters.every((a) => a.status === 'healthy');
  return { mode, overall: allHealthy ? 'healthy' : 'degraded', adapters };
}

/**
 * Compute overall health from configured adapter states and the current env.
 */
export function getAdapterHealthSummary(): AdapterHealthSummary {
  const mode = getEffectiveAdapterMode();
  const adapters = getAdapterRunStates();
  return computeAdapterHealth(mode, adapters);
}
