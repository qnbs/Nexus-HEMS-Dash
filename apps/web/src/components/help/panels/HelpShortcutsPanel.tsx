import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpTabPanelShell } from '../HelpTabPanelShell';

export const HelpShortcutsPanel = () => {
  const { t } = useTranslation();

  return (
    <HelpTabPanelShell tabKey="shortcuts">
      <div className="glass-panel-strong rounded-2xl p-6">
        <h2 className="mb-6 font-semibold text-xl">{t('help.keyboardShortcuts')}</h2>
        <div className="space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="mb-3 font-semibold text-(--color-muted) text-sm uppercase tracking-widest">
              {t('help.shortcutNav')}
            </h3>
            <div className="space-y-2">
              {[
                { keys: ['⌘', 'K'], desc: t('help.shortcutCmdK') },
                { keys: ['⌘', '/'], desc: t('help.shortcutSearch') },
                { keys: ['Esc'], desc: t('help.shortcutClose') },
              ].map((s) => (
                <div
                  key={s.desc}
                  className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-surface) p-3"
                >
                  <span className="text-sm">{s.desc}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-md border border-(--color-border) bg-(--color-surface-strong) px-2 py-1 font-mono text-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="mb-3 font-semibold text-(--color-muted) text-sm uppercase tracking-widest">
              {t('help.shortcutActions')}
            </h3>
            <div className="space-y-2">
              {[
                { keys: ['⌘', 'S'], desc: t('help.shortcutSave') },
                { keys: ['⌘', 'E'], desc: t('help.shortcutExport') },
                { keys: ['⌘', 'L'], desc: t('help.shortcutLang') },
              ].map((s) => (
                <div
                  key={s.desc}
                  className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-surface) p-3"
                >
                  <span className="text-sm">{s.desc}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-md border border-(--color-border) bg-(--color-surface-strong) px-2 py-1 font-mono text-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-(--color-primary)" />
            <p className="text-(--color-muted) text-xs">{t('help.shortcutNote')}</p>
          </div>
        </div>
      </div>
    </HelpTabPanelShell>
  );
};
