export type ThemeName = 'cyber-energy-dark' | 'solar-light' | 'night-mode';

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    muted: string;
    border: string;
    glow: string;
  };
}

export const neoEnergyPalette = {
  neonGreen: '#22ff88',
  electricBlue: '#00f0ff',
  powerOrange: '#ff8800',
  deepSpace: '#07111f',
  voidBlue: '#0c1f34',
  polarMist: '#eaf7ff',
  solarSand: '#fff3dc',
  midnight: '#030712',
} as const;

export const themeDefinitions: Record<ThemeName, ThemeDefinition> = {
  'cyber-energy-dark': {
    name: 'cyber-energy-dark',
    label: 'Cyber Energy Dark',
    colors: {
      primary: neoEnergyPalette.neonGreen,
      secondary: neoEnergyPalette.electricBlue,
      accent: neoEnergyPalette.powerOrange,
      background: '#06111d',
      surface: 'rgba(8, 24, 40, 0.72)',
      surfaceStrong: 'rgba(10, 32, 53, 0.88)',
      text: '#effffc',
      muted: '#9ec3cf',
      border: 'rgba(34, 255, 136, 0.18)',
      glow: 'rgba(34, 255, 136, 0.45)',
    },
  },
  'solar-light': {
    name: 'solar-light',
    label: 'Solar Light',
    colors: {
      primary: '#0bbf73',
      secondary: '#0084ff',
      accent: '#ff8800',
      background: '#fff7e8',
      surface: 'rgba(255, 255, 255, 0.72)',
      surfaceStrong: 'rgba(255, 248, 230, 0.94)',
      text: '#10243a',
      muted: '#5f7284',
      border: 'rgba(0, 132, 255, 0.18)',
      glow: 'rgba(255, 136, 0, 0.24)',
    },
  },
  'night-mode': {
    name: 'night-mode',
    label: 'Night Mode',
    colors: {
      primary: '#5dfdcf',
      secondary: '#4f83ff',
      accent: '#ff9b3d',
      background: '#02050d',
      surface: 'rgba(6, 11, 23, 0.78)',
      surfaceStrong: 'rgba(8, 14, 28, 0.94)',
      text: '#f4f8ff',
      muted: '#92a6c4',
      border: 'rgba(79, 131, 255, 0.16)',
      glow: 'rgba(79, 131, 255, 0.34)',
    },
  },
};

export const themeOrder: ThemeName[] = ['cyber-energy-dark', 'solar-light', 'night-mode'];
