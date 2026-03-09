export type ThemeName =
  | 'cyber-energy-dark'
  | 'solar-light'
  | 'night-mode'
  | 'cyber-energy'
  | 'minimal-white';

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  isDark: boolean;
  previewColors: [string, string, string];
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
    isDark: true,
    previewColors: ['#22ff88', '#00f0ff', '#06111d'],
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
  'cyber-energy': {
    name: 'cyber-energy',
    label: 'Cyber Energy',
    isDark: true,
    previewColors: ['#ff2d78', '#a855f7', '#0a0618'],
    colors: {
      primary: '#ff2d78',
      secondary: '#a855f7',
      accent: '#facc15',
      background: '#0a0618',
      surface: 'rgba(16, 8, 36, 0.75)',
      surfaceStrong: 'rgba(22, 12, 48, 0.9)',
      text: '#f8f0ff',
      muted: '#b49cd0',
      border: 'rgba(255, 45, 120, 0.2)',
      glow: 'rgba(168, 85, 247, 0.45)',
    },
  },
  'solar-light': {
    name: 'solar-light',
    label: 'Solar Light',
    isDark: false,
    previewColors: ['#0bbf73', '#0084ff', '#fff7e8'],
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
  'minimal-white': {
    name: 'minimal-white',
    label: 'Minimal White',
    isDark: false,
    previewColors: ['#111827', '#6366f1', '#ffffff'],
    colors: {
      primary: '#111827',
      secondary: '#6366f1',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: 'rgba(249, 250, 251, 0.8)',
      surfaceStrong: 'rgba(243, 244, 246, 0.95)',
      text: '#111827',
      muted: '#6b7280',
      border: 'rgba(209, 213, 219, 0.5)',
      glow: 'rgba(99, 102, 241, 0.15)',
    },
  },
  'night-mode': {
    name: 'night-mode',
    label: 'Night Mode',
    isDark: true,
    previewColors: ['#5dfdcf', '#4f83ff', '#02050d'],
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

export const themeOrder: ThemeName[] = [
  'cyber-energy-dark',
  'cyber-energy',
  'solar-light',
  'minimal-white',
  'night-mode',
];
