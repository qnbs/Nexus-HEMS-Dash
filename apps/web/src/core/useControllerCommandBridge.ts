/**
 * useControllerCommandBridge — runs ControllerPipeline on an interval and dispatches outputs.
 *
 * Mount once in App.tsx alongside useAdapterBridge. Respects per-controller enable flags
 * on controllerPipeline and skips dispatch when read-only mode is active.
 */

import { useEffect, useRef } from 'react';
import { isReadOnlyModeActive } from '../lib/adapter-mode';
import { useAppStore } from '../store';
import { dispatchControllerOutputs } from './controller-command-bridge';
import { controllerPipeline } from './energy-controllers';
import { useEnergyStoreBase } from './useEnergyStore';

const CONTROLLER_LOOP_MS = 5_000;

function legacyEnergyFromStore(): import('../types').EnergyData {
  const unified = useEnergyStoreBase.getState().unified;
  const appEnergy = useAppStore.getState().energyData;
  return {
    gridPower: unified.grid.powerW ?? appEnergy.gridPower,
    pvPower: unified.pv.totalPowerW ?? appEnergy.pvPower,
    batteryPower: unified.battery.powerW ?? appEnergy.batteryPower,
    houseLoad: unified.load.totalPowerW ?? appEnergy.houseLoad,
    batterySoC: unified.battery.socPercent ?? appEnergy.batterySoC,
    heatPumpPower: unified.load.heatPumpPowerW ?? appEnergy.heatPumpPower,
    evPower: unified.load.evPowerW ?? appEnergy.evPower,
    gridVoltage: unified.grid.voltageV ?? appEnergy.gridVoltage,
    batteryVoltage: unified.battery.voltageV ?? appEnergy.batteryVoltage,
    pvYieldToday: unified.pv.yieldTodayKWh ?? appEnergy.pvYieldToday,
    priceCurrent: unified.tariff?.currentPriceEurKWh ?? appEnergy.priceCurrent,
    ...(appEnergy.evSocPercent !== undefined ? { evSocPercent: appEnergy.evSocPercent } : {}),
    ...(appEnergy.evMaxDischargePowerW !== undefined
      ? { evMaxDischargePowerW: appEnergy.evMaxDischargePowerW }
      : {}),
    ...(appEnergy.evDisabledBy14a !== undefined
      ? { evDisabledBy14a: appEnergy.evDisabledBy14a }
      : {}),
  };
}

export function useControllerCommandBridge(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isReadOnlyModeActive()) return;

      const settings = useAppStore.getState().settings;
      const data = legacyEnergyFromStore();
      const output = controllerPipeline.run(data, settings);
      void dispatchControllerOutputs(output);
    }, CONTROLLER_LOOP_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
