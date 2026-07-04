import {
  isCoreProvidersBootstrapped,
  markCoreProvidersBootstrapped,
  registerCommand,
} from '../command-registry';
import { createEnergyCommands } from './energy-commands';
import { createNavigationCommands } from './navigation-commands';
import { createSettingsCommands } from './settings-commands';
import { createSystemCommands } from './system-commands';

/** Register built-in command providers once at module load. */
export function registerCoreCommands(): void {
  if (isCoreProvidersBootstrapped()) return;

  const all = [
    ...createNavigationCommands(),
    ...createSettingsCommands(),
    ...createEnergyCommands(),
    ...createSystemCommands(),
  ];

  for (const cmd of all) {
    registerCommand(cmd);
  }

  markCoreProvidersBootstrapped();
}

// Auto-register on import (App bootstrap)
registerCoreCommands();
