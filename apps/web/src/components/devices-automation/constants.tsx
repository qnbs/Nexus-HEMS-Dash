import { Battery, Building2, Car, Filter, Sun, Thermometer } from 'lucide-react';
import type { ReactNode } from 'react';
import type { DeviceCategory, DeviceDefinition } from './types';

export const DEVICES: DeviceDefinition[] = [
  {
    id: 'pv',
    category: 'pv',
    icon: <Sun size={20} />,
    titleKey: 'devicesAuto.pvTitle',
    variant: 'success',
  },
  {
    id: 'storage',
    category: 'storage',
    icon: <Battery size={20} />,
    titleKey: 'devicesAuto.storageTitle',
    variant: 'primary',
  },
  {
    id: 'ev',
    category: 'ev',
    icon: <Car size={20} />,
    titleKey: 'devicesAuto.evTitle',
    variant: 'warning',
  },
  {
    id: 'heatpump',
    category: 'heatpump',
    icon: <Thermometer size={20} />,
    titleKey: 'devicesAuto.heatpumpTitle',
    variant: 'danger',
  },
  {
    id: 'building',
    category: 'building',
    icon: <Building2 size={20} />,
    titleKey: 'devicesAuto.buildingTitle',
    variant: 'neutral',
  },
];

export const CATEGORY_FILTERS: { key: DeviceCategory; labelKey: string; icon: ReactNode }[] = [
  { key: 'all', labelKey: 'devicesAuto.filterAll', icon: <Filter size={14} /> },
  { key: 'pv', labelKey: 'devicesAuto.filterPV', icon: <Sun size={14} /> },
  { key: 'storage', labelKey: 'devicesAuto.filterStorage', icon: <Battery size={14} /> },
  { key: 'ev', labelKey: 'devicesAuto.filterEV', icon: <Car size={14} /> },
  { key: 'heatpump', labelKey: 'devicesAuto.filterHeatpump', icon: <Thermometer size={14} /> },
  { key: 'building', labelKey: 'devicesAuto.filterBuilding', icon: <Building2 size={14} /> },
];
