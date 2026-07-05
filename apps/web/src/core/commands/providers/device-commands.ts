import { CarFront, Zap } from 'lucide-react';
import type { CommandDefinition } from '../types';
import { navigateAndClose } from './provider-utils';

export function createDeviceCommands(): CommandDefinition[] {
  return [
    {
      id: 'device.stopEvCharging',
      labelKey: 'command.stopEvCharging',
      descriptionKey: 'command.stopEvChargingDesc',
      icon: CarFront,
      category: 'device',
      risk: 'danger',
      blockedInReadOnly: true,
      keywords: ['ev', 'wallbox', 'stop', 'laden', 'charging'],
      source: 'core',
      when: (ctx) => ctx.energy.evPower > 0.1,
      preview: (ctx) => ({
        titleKey: 'command.preview.stopCharging',
        metrics: [
          { labelKey: 'command.preview.evPower', value: `${ctx.energy.evPower.toFixed(1)} kW` },
        ],
        impactKey: 'command.preview.stopChargingImpact',
      }),
      hardwareCommand: { type: 'STOP_CHARGING', value: true },
      execute: (ctx) => {
        ctx.actions.closePalette();
      },
    },
    {
      id: 'device.viewEvCharging',
      labelKey: 'command.viewEvCharging',
      icon: Zap,
      category: 'device',
      risk: 'safe',
      keywords: ['ev', 'wallbox', 'ocpp', 'laden'],
      source: 'core',
      when: (ctx) => ctx.energy.evPower > 0.1,
      execute: (ctx) => navigateAndClose(ctx, '/devices'),
    },
  ];
}
