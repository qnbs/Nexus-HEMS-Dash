import { motion } from 'motion/react';
import { Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { themeDefinitions, themeOrder, type ThemeName } from '../design-tokens';
import { useAppStore } from '../store';
import { resolveTheme, type ThemePreference } from '../lib/theme';

function ThemePreviewDot({
  def,
  isActive,
  onClick,
}: {
  def: (typeof themeDefinitions)[ThemeName];
  isActive: boolean;
  onClick: () => void;
}) {
  const [c1, c2, c3] = def.previewColors;
  return (
    <motion.button
      onClick={onClick}
      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-ring"
      style={{
        borderColor: isActive ? def.colors.primary : 'transparent',
        background: c3,
      }}
      whileHover={{ scale: 1.18 }}
      whileTap={{ scale: 0.92 }}
      aria-label={def.label}
      aria-pressed={isActive}
      title={def.label}
    >
      {/* two‑color inner dots */}
      <span
        className="absolute h-2 w-2 rounded-full"
        style={{ background: c1, top: 5, left: 5 }}
      />
      <span
        className="absolute h-2 w-2 rounded-full"
        style={{ background: c2, bottom: 5, right: 5 }}
      />
      {isActive && (
        <motion.span
          layoutId="theme-active-ring"
          className="absolute inset-[-3px] rounded-full border-2"
          style={{ borderColor: def.colors.primary }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const themePreference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setTheme = useAppStore((state) => state.setTheme);

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference);
    const resolvedTheme = resolveTheme(preference);
    setTheme(resolvedTheme);
  };

  const isSystem = themePreference === 'system';

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-2 py-1 backdrop-blur-3xl"
      role="group"
      aria-label={t('common.theme')}
    >
      {/* System preference button */}
      <motion.button
        onClick={() => handleThemeChange('system')}
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-ring"
        style={{
          borderColor: isSystem ? 'var(--color-primary)' : 'transparent',
        }}
        whileHover={{ scale: 1.18 }}
        whileTap={{ scale: 0.92 }}
        aria-label={t('common.systemTheme')}
        aria-pressed={isSystem}
        title={t('common.systemTheme')}
      >
        <Monitor className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
        {isSystem && (
          <motion.span
            layoutId="theme-active-ring"
            className="absolute inset-[-3px] rounded-full border-2 border-[color:var(--color-primary)]"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.button>

      <span className="mx-0.5 h-4 w-px bg-[color:var(--color-border)]" aria-hidden="true" />

      {/* Theme dots */}
      {themeOrder.map((entry) => (
        <ThemePreviewDot
          key={entry}
          def={themeDefinitions[entry]}
          isActive={!isSystem && theme === entry}
          onClick={() => handleThemeChange(entry)}
        />
      ))}
    </div>
  );
}
