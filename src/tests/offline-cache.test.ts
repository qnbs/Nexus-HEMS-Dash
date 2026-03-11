import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  cacheEnergySnapshot,
  getLatestEnergySnapshot,
  cacheSankeyData,
  getLatestSankeyData,
  cacheTariffData,
  getLatestTariffData,
  getStorageStats,
  clearOfflineCache,
} from '../lib/offline-cache';

describe('Offline Cache (IndexedDB)', () => {
  beforeEach(async () => {
    await db.energySnapshots.clear();
    await db.sankeySnapshots.clear();
    await db.tariffData.clear();
    await db.userPreferences.clear();
  });

  describe('Energy Snapshots', () => {
    it('should cache and retrieve an energy snapshot', async () => {
      const mockData = { pvPower: 3500, gridPower: -200 };
      await cacheEnergySnapshot(mockData);

      const latest = await getLatestEnergySnapshot();
      expect(latest).not.toBeNull();
      expect(latest!.data).toEqual(mockData);
      expect(latest!.ageMinutes).toBeTypeOf('number');
    });

    it('should return null when no snapshots exist', async () => {
      const latest = await getLatestEnergySnapshot();
      expect(latest).toBeNull();
    });

    it('should return the most recent snapshot', async () => {
      await cacheEnergySnapshot({ pvPower: 1000 });
      await new Promise((r) => setTimeout(r, 10));
      await cacheEnergySnapshot({ pvPower: 2000 });

      const latest = await getLatestEnergySnapshot();
      expect((latest!.data as { pvPower: number }).pvPower).toBe(2000);
    });
  });

  describe('Sankey Data', () => {
    it('should cache and retrieve Sankey data', async () => {
      const nodes = [{ name: 'PV' }, { name: 'Grid' }];
      const links = [{ source: 0, target: 1, value: 500 }];
      await cacheSankeyData(nodes, links);

      const latest = await getLatestSankeyData();
      expect(latest).not.toBeNull();
      expect(latest!.nodes).toEqual(nodes);
      expect(latest!.links).toEqual(links);
    });

    it('should return null when no Sankey data exists', async () => {
      const latest = await getLatestSankeyData();
      expect(latest).toBeNull();
    });
  });

  describe('Tariff Data', () => {
    it('should cache and retrieve tariff data', async () => {
      const tariff = [{ timestamp: Date.now(), price: 0.15 }];
      await cacheTariffData('tibber', tariff, 60);

      const cached = await getLatestTariffData('tibber');
      expect(cached).not.toBeNull();
      expect(cached!.data).toEqual(tariff);
    });

    it('should return null for unknown provider', async () => {
      const cached = await getLatestTariffData('tibber');
      expect(cached).toBeNull();
    });
  });

  describe('Storage Stats', () => {
    it('should report zero counts when empty', async () => {
      const stats = await getStorageStats();
      expect(stats.energySnapshots).toBe(0);
      expect(stats.sankeySnapshots).toBe(0);
      expect(stats.tariffEntries).toBe(0);
    });

    it('should count entries after caching', async () => {
      await cacheEnergySnapshot({ pvPower: 100 });
      await cacheSankeyData([{ name: 'PV' }], []);
      const stats = await getStorageStats();
      expect(stats.energySnapshots).toBe(1);
      expect(stats.sankeySnapshots).toBe(1);
    });
  });

  describe('Clear Cache', () => {
    it('should clear all cached data', async () => {
      await cacheEnergySnapshot({ pvPower: 100 });
      await cacheSankeyData([{ name: 'PV' }], []);
      await clearOfflineCache();
      const stats = await getStorageStats();
      expect(stats.energySnapshots).toBe(0);
      expect(stats.sankeySnapshots).toBe(0);
    });
  });

  describe('Database schema', () => {
    it('should have all required tables', () => {
      expect(db.energySnapshots).toBeDefined();
      expect(db.sankeySnapshots).toBeDefined();
      expect(db.tariffData).toBeDefined();
      expect(db.userPreferences).toBeDefined();
    });
  });
});
