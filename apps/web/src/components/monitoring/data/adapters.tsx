import { Gauge, Radio, Server, Shield, Wifi, Zap } from 'lucide-react';

/** Static core-adapter definitions rendered in the adapter-health panel. */
export function buildCoreAdapters(t: (key: string) => string) {
  return [
    {
      name: 'Victron MQTT',
      protocol: 'MQTT/WS',
      id: 'victron-mqtt',
      icon: <Radio size={14} />,
      desc: t('monitoring.adapterVictronDesc'),
    },
    {
      name: 'Modbus SunSpec',
      protocol: 'Modbus TCP',
      id: 'modbus-sunspec',
      icon: <Zap size={14} />,
      desc: t('monitoring.adapterModbusDesc'),
    },
    {
      name: 'KNX/IP',
      protocol: 'KNXnet/IP',
      id: 'knx',
      icon: <Server size={14} />,
      desc: t('monitoring.adapterKnxDesc'),
    },
    {
      name: 'OCPP 2.1',
      protocol: 'OCPP/WS',
      id: 'ocpp',
      icon: <Zap size={14} />,
      desc: t('monitoring.adapterOcppDesc'),
    },
    {
      name: 'EEBUS',
      protocol: 'SPINE/SHIP',
      id: 'eebus',
      icon: <Shield size={14} />,
      desc: t('monitoring.adapterEebusDesc'),
    },
  ];
}

/** Static contrib-adapter definitions rendered in the adapter-health panel. */
export function buildContribAdapters(t: (key: string) => string) {
  return [
    {
      name: t('monitoring.contribHomeAssistantMqtt'),
      protocol: 'MQTT/WS',
      id: 'homeassistant-mqtt',
      icon: <Server size={14} />,
      desc: t('monitoring.contribHomeAssistantMqttDesc'),
    },
    {
      name: t('monitoring.contribMatterThread'),
      protocol: 'Matter/WS',
      id: 'matter-thread',
      icon: <Radio size={14} />,
      desc: t('monitoring.contribMatterThreadDesc'),
    },
    {
      name: t('monitoring.contribZigbee2mqtt'),
      protocol: 'MQTT/WS',
      id: 'zigbee2mqtt',
      icon: <Wifi size={14} />,
      desc: t('monitoring.contribZigbee2mqttDesc'),
    },
    {
      name: t('monitoring.contribShellyRest'),
      protocol: 'HTTP/REST',
      id: 'shelly-rest',
      icon: <Gauge size={14} />,
      desc: t('monitoring.contribShellyRestDesc'),
    },
  ];
}
