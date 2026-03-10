export type ThemeName =
  | 'energy-dark'
  | 'solar-light'
  | 'ocean-dark'
  | 'nature-green'
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
  'energy-dark': {
    name: 'energy-dark',
    label: 'Energy Dark',
    isDark: true,
    previewColors: ['#22ff88', '#00d4e0', '#0a1520'],
    colors: {
      primary: '#22ff88',
      secondary: '#00d4e0',
      accent: '#ff8800',
      background: '#0a1520',
      surface: 'rgba(12, 28, 44, 0.72)',
      surfaceStrong: 'rgba(14, 34, 54, 0.88)',
      text: '#e8f4f0',
      muted: '#8daab8',
      border: 'rgba(34, 255, 136, 0.14)',
      glow: 'rgba(34, 255, 136, 0.25)',
    },
  },
  'solar-light': {
    name: 'solar-light',
    label: 'Solar Light',
    isDark: false,
    previewColors: ['#0bbf73', '#0084ff', '#fef9ef'],
    colors: {
      primary: '#0bbf73',
      secondary: '#0084ff',
      accent: '#ff8800',
      background: '#fef9ef',
      surface: 'rgba(255, 255, 255, 0.75)',
      surfaceStrong: 'rgba(255, 250, 235, 0.94)',
      text: '#1a2a3a',
      muted: '#5f7284',
      border: 'rgba(0, 132, 255, 0.14)',
      glow: 'rgba(255, 136, 0, 0.18)',
    },
  },
  'ocean-dark': {
    name: 'ocean-dark',
    label: 'Ocean Deep',
    isDark: true,
    previewColors: ['#38bdf8', '#818cf8', '#0c1222'],
    colors: {
      primary: '#38bdf8',
      secondary: '#818cf8',
      accent: '#fb923c',
      background: '#0c1222',
      surface: 'rgba(14, 22, 42, 0.76)',
      surfaceStrong: 'rgba(18, 28, 52, 0.9)',
      text: '#e2eaf4',
      muted: '#8896b0',
      border: 'rgba(56, 189, 248, 0.14)',
      glow: 'rgba(56, 189, 248, 0.2)',
    },
  },
  'nature-green': {
    name: 'nature-green',
    label: 'Forest',
    isDark: true,
    previewColors: ['#4ade80', '#a3e635', '#0f1a12'],
    colors: {
      primary: '#4ade80',
      secondary: '#a3e635',
      accent: '#fbbf24',
      background: '#0f1a12',
      surface: 'rgba(16, 30, 18, 0.76)',
      surfaceStrong: 'rgba(20, 38, 22, 0.9)',
      text: '#e4f0e6',
      muted: '#8aaa8e',
      border: 'rgba(74, 222, 128, 0.14)',
      glow: 'rgba(74, 222, 128, 0.2)',
    },
  },
  'minimal-white': {
    name: 'minimal-white',
    label: 'Minimal',
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
      glow: 'rgba(99, 102, 241, 0.12)',
    },
  },
};

export const themeOrder: ThemeName[] = [
  'energy-dark',
  'ocean-dark',
  'nature-green',
  'solar-light',
  'minimal-white',
];
