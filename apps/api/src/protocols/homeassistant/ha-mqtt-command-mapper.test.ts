import { describe, expect, it } from 'vitest';
import {
  haMqttSupportsCommand,
  mapProtocolCommandToMqttService,
  mqttServiceTopic,
} from './ha-mqtt-command-mapper.js';

const entities = {
  wallboxCurrentEntityId: 'number.wallbox_max_current',
  wallboxSwitchEntityId: 'switch.wallbox_charging',
  heatPumpModeEntityId: 'climate.heat_pump',
  mainsVoltage: 230,
};

describe('ha-mqtt-command-mapper', () => {
  it('supports EV and heat-pump MQTT commands', () => {
    expect(haMqttSupportsCommand('SET_EV_POWER')).toBe(true);
    expect(haMqttSupportsCommand('SET_BATTERY_POWER')).toBe(false);
  });

  it('maps SET_EV_CURRENT to number/set_value', () => {
    const result = mapProtocolCommandToMqttService({ type: 'SET_EV_CURRENT', value: 16 }, entities);
    expect(result).toEqual({
      domain: 'number',
      service: 'set_value',
      payload: { entity_id: 'number.wallbox_max_current', value: 16 },
    });
  });

  it('converts SET_EV_POWER watts to amps using mains voltage', () => {
    const result = mapProtocolCommandToMqttService({ type: 'SET_EV_POWER', value: 6900 }, entities);
    expect(result).toMatchObject({
      domain: 'number',
      service: 'set_value',
      payload: { entity_id: 'number.wallbox_max_current', value: 30 },
    });
  });

  it('builds homeassistant MQTT service topic', () => {
    const call = {
      domain: 'switch',
      service: 'turn_on',
      payload: { entity_id: 'switch.wallbox_charging' },
    };
    expect(mqttServiceTopic('homeassistant', call)).toBe('homeassistant/switch/turn_on');
  });

  it('returns error when wallbox entities are missing', () => {
    const result = mapProtocolCommandToMqttService(
      { type: 'START_CHARGING', value: true },
      { ...entities, wallboxSwitchEntityId: undefined },
    );
    expect(result).toEqual({ error: 'HA_WALLBOX_SWITCH_ENTITY not configured' });
  });
});
