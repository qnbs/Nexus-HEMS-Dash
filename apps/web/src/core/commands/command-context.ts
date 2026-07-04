import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { isLiveSafetyMode } from '../../lib/adapter-mode';
import { resolveReadOnlyModeActive } from '../../lib/use-read-only-mode';
import { useAppStoreShallow } from '../../store';
import { useEnergyStoreBase } from '../useEnergyStore';
import type { AuthScope, CommandContext, CommandPalettePreferences } from './types';

export interface UseCommandContextOptions {
  onOptimize?: () => void;
  onExportReport?: () => void;
  closePalette: () => void;
  recordUsage: (commandId: string) => void;
  toggleFavorite: (commandId: string) => void;
}

/** Default scope in dev/anonymous mode — full palette navigation is read-safe. */
function resolveAuthScope(): AuthScope {
  return 'readwrite';
}

/**
 * Build the read-only command context snapshot for registry providers.
 */
export function useCommandContext(options: UseCommandContextOptions): CommandContext {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    locale,
    theme,
    energyData,
    adapterMode,
    backendReadOnly,
    tariffProvider,
    chargeThreshold,
  } = useAppStoreShallow((s) => ({
    locale: s.locale,
    theme: s.theme,
    energyData: s.energyData,
    adapterMode: s.adapterMode,
    backendReadOnly: s.backendReadOnly,
    tariffProvider: s.settings.tariffProvider,
    chargeThreshold: s.settings.chargeThreshold,
  }));

  const adapterStatusKey = useEnergyStoreBase((s) =>
    Object.entries(s.adapters)
      .map(([id, entry]) => `${id}:${entry.status}`)
      .sort()
      .join('|'),
  );

  const adapterStatuses = useMemo(() => {
    const state = useEnergyStoreBase.getState();
    const map = new Map<string, import('../adapters/EnergyAdapter').AdapterStatus>();
    for (const [id, entry] of Object.entries(state.adapters)) {
      map.set(id, entry.status);
    }
    return map;
  }, [adapterStatusKey]);

  return useMemo(
    () => ({
      route: { pathname: location.pathname, search: location.search },
      locale,
      theme,
      energy: {
        pvPower: energyData.pvPower,
        batterySoC: energyData.batterySoC,
        gridPower: energyData.gridPower,
        houseLoad: energyData.houseLoad,
        priceCurrent: energyData.priceCurrent,
        evPower: energyData.evPower,
      },
      adapterStatuses,
      tariffProvider,
      chargeThreshold,
      isReadOnly: resolveReadOnlyModeActive(backendReadOnly),
      isLiveMode: isLiveSafetyMode(adapterMode),
      authScope: resolveAuthScope(),
      navigate,
      t,
      actions: {
        closePalette: options.closePalette,
        recordUsage: options.recordUsage,
        toggleFavorite: options.toggleFavorite,
        ...(options.onOptimize !== undefined ? { onOptimize: options.onOptimize } : {}),
        ...(options.onExportReport !== undefined ? { onExportReport: options.onExportReport } : {}),
      },
    }),
    [
      location.pathname,
      location.search,
      locale,
      theme,
      energyData,
      adapterStatuses,
      tariffProvider,
      chargeThreshold,
      backendReadOnly,
      adapterMode,
      navigate,
      t,
      options.onOptimize,
      options.onExportReport,
      options.closePalette,
      options.recordUsage,
      options.toggleFavorite,
    ],
  );
}

export function getRecentCommandIds(prefs: CommandPalettePreferences): string[] {
  return prefs.recent
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .map((r) => r.id);
}

export function getContextualCommandIds(ctx: CommandContext): string[] {
  const ids: string[] = [];
  const { energy, chargeThreshold } = ctx;

  if (energy.pvPower > energy.houseLoad * 1.2 && energy.pvPower > 0.5) {
    ids.push('energy.optimizeSurplus');
  }
  if (energy.batterySoC < 20) {
    ids.push('energy.viewBattery');
  }
  if (energy.priceCurrent > chargeThreshold) {
    ids.push('energy.viewTariffs');
  }
  if (ctx.adapterStatuses.size > 0) {
    for (const [, status] of ctx.adapterStatuses) {
      if (status === 'error') {
        ids.push('nav-monitoring');
        break;
      }
    }
  }

  return ids;
}
