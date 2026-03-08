import Dexie, { type Table } from 'dexie';

import type { EnergyData, StoredSettings } from '../types';

export interface EnergySnapshot extends EnergyData {
  id?: number;
  timestamp: number;
}

export interface SettingsRecord {
  key: string;
  value: StoredSettings;
}

class NexusDatabase extends Dexie {
  energySnapshots!: Table<EnergySnapshot, number>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super('nexus-hems-dash');
    this.version(1).stores({
      energySnapshots: '++id, timestamp',
      settings: 'key',
    });
  }
}

export const nexusDb = new NexusDatabase();

export async function persistSnapshot(snapshot: EnergyData) {
  await nexusDb.energySnapshots.add({ ...snapshot, timestamp: Date.now() });

  const count = await nexusDb.energySnapshots.count();
  if (count > 720) {
    const oldest = await nexusDb.energySnapshots
      .orderBy('timestamp')
      .limit(count - 720)
      .primaryKeys();
    await nexusDb.energySnapshots.bulkDelete(oldest);
  }
}

export async function persistSettings(settings: StoredSettings) {
  await nexusDb.settings.put({ key: 'ui-settings', value: settings });
}
