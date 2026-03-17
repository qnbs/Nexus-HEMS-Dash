import { describe, it, expect } from 'vitest';
import {
  PAGE_REGISTRY,
  PAGE_RELATIONS,
  type PageId,
  type SettingsTabId,
} from '../lib/page-relations';

const ALL_PAGE_IDS: PageId[] = [
  'home',
  'energy-flow',
  'production',
  'storage',
  'consumption',
  'ev',
  'floorplan',
  'ai-optimizer',
  'tariffs',
  'analytics',
  'historical-analytics',
  'monitoring',
  'controllers',
  'plugins',
  'hardware',
  'settings',
  'ai-settings',
  'help',
];

const VALID_GROUPS = ['energy', 'tools', 'system'];

const VALID_SETTINGS_TABS: SettingsTabId[] = [
  'appearance',
  'system',
  'energy',
  'controllers',
  'security',
  'storage',
  'notifications',
  'advanced',
  'ai',
];

describe('PAGE_REGISTRY', () => {
  it('should define all 18 pages', () => {
    const ids = Object.keys(PAGE_REGISTRY);
    expect(ids).toHaveLength(18);
    for (const id of ALL_PAGE_IDS) {
      expect(PAGE_REGISTRY[id]).toBeDefined();
    }
  });

  it('should have unique paths', () => {
    const paths = Object.values(PAGE_REGISTRY).map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('should have valid groups', () => {
    for (const page of Object.values(PAGE_REGISTRY)) {
      expect(VALID_GROUPS).toContain(page.group);
    }
  });

  it('should have i18n keys for all pages', () => {
    for (const page of Object.values(PAGE_REGISTRY)) {
      expect(page.i18nKey).toMatch(/^nav\./);
    }
  });

  it('should have icon components', () => {
    for (const page of Object.values(PAGE_REGISTRY)) {
      // Lucide icons are either functions or forwardRef objects
      expect(['function', 'object']).toContain(typeof page.icon);
      expect(page.icon).toBeTruthy();
    }
  });

  it('home should be at root path', () => {
    expect(PAGE_REGISTRY.home.path).toBe('/');
  });

  it('settings/ai should be a sub-route', () => {
    expect(PAGE_REGISTRY['ai-settings'].path).toBe('/settings/ai');
  });
});

describe('PAGE_RELATIONS', () => {
  it('should define relations for all pages', () => {
    for (const id of ALL_PAGE_IDS) {
      expect(PAGE_RELATIONS[id]).toBeDefined();
    }
  });

  it('should only reference valid page IDs in related arrays', () => {
    for (const [pageId, relation] of Object.entries(PAGE_RELATIONS)) {
      for (const relatedId of relation.related) {
        expect(ALL_PAGE_IDS).toContain(relatedId);
        // Should not reference itself
        expect(relatedId).not.toBe(pageId);
      }
    }
  });

  it('should only reference valid settings tabs', () => {
    for (const relation of Object.values(PAGE_RELATIONS)) {
      for (const link of relation.settingsLinks) {
        expect(VALID_SETTINGS_TABS).toContain(link.tab);
      }
      for (const req of relation.setupRequirements) {
        expect(VALID_SETTINGS_TABS).toContain(req.settingsTab);
      }
    }
  });

  it('settings links should have i18n keys and icons', () => {
    for (const relation of Object.values(PAGE_RELATIONS)) {
      for (const link of relation.settingsLinks) {
        expect(link.i18nKey).toMatch(/^crossLinks\./);
        expect(['function', 'object']).toContain(typeof link.icon);
      }
    }
  });

  it('home should relate to energy-flow and production', () => {
    expect(PAGE_RELATIONS.home.related).toContain('energy-flow');
    expect(PAGE_RELATIONS.home.related).toContain('production');
  });

  it('energy pages should have setup requirements', () => {
    const energyPages: PageId[] = ['home', 'energy-flow', 'production', 'storage'];
    for (const id of energyPages) {
      expect(PAGE_RELATIONS[id].setupRequirements.length).toBeGreaterThan(0);
    }
  });
});
