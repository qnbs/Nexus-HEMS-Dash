import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, AlertCircle, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { VoiceController } from '../lib/voice-control';
import { useAppStore } from '../store';

let voiceController: VoiceController | null = null;

export const VoiceControlPanel = memo(function VoiceControlPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setTheme = useAppStore((s) => s.setTheme);
  const theme = useAppStore((s) => s.theme);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  const initVoiceController = () => {
    if (!voiceController) {
      voiceController = new VoiceController();

      // Register default commands
      voiceController.registerDefaultCommands({
        onNavigate: (page: string) => {
          navigate(page);
          setTranscript(t('voice.navigatedTo', { page }));
        },
        onToggleTheme: () => {
          const themes = [
            'energy-dark',
            'ocean-dark',
            'nature-green',
            'solar-light',
            'minimal-white',
          ] as const;
          type ThemeName = (typeof themes)[number];
          const currentIndex = themes.indexOf(theme as ThemeName);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          setTheme(nextTheme);
          setTranscript(t('voice.themeChanged', { theme: nextTheme }));
        },
        onToggleLanguage: () => {
          const nextLocale = locale === 'de' ? 'en' : 'de';
          setLocale(nextLocale);
          setTranscript(t('voice.languageChanged', { locale: nextLocale }));
        },
        onToggleEV: () => {
          setTranscript(t('voice.evToggled', 'EV charging toggled'));
        },
      });

      // Custom recognition handler to capture transcript
      if (voiceController['recognition']) {
        const recognition = voiceController['recognition'];
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.results.length - 1];
          const text = result[0].transcript;
          setTranscript(text);

          // Process command
          voiceController?.['processCommand'](text.toLowerCase());
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          setError(event.error);
          setIsListening(false);
        };
      }
    }
    return voiceController;
  };

  const toggleVoice = () => {
    try {
      const controller = initVoiceController();

      if (!controller) {
        setError(t('voice.notSupported'));
        return;
      }

      if (isListening) {
        controller.stop();
        setIsListening(false);
      } else {
        controller.start();
        setIsListening(true);
        setError(null);
        setTranscript('');
      }
    } catch (err) {
      setError(t('voice.initError'));
      console.error(err);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            {t('voice.title')}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t('voice.subtitle')}</p>
        </div>

        <button
          onClick={toggleVoice}
          className={`focus-ring flex h-14 w-14 items-center justify-center rounded-full transition-all ${
            isListening
              ? 'animate-pulse bg-[color:var(--color-primary)] text-slate-900 shadow-lg shadow-[color:var(--color-primary)]/50'
              : 'bg-[color:var(--color-surface)] text-[color:var(--color-muted)] hover:bg-white/10'
          }`}
          aria-label={isListening ? t('voice.stop') : t('voice.start')}
        >
          {isListening ? (
            <Mic className="h-6 w-6" aria-hidden="true" />
          ) : (
            <MicOff className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-2xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/10 p-4">
              <p className="text-sm font-medium text-[color:var(--color-primary)]">
                <span aria-hidden="true">🎤 </span>
                {t('voice.listening')}
              </p>
              {transcript && (
                <p className="mt-2 text-sm text-[color:var(--color-text)]">"{transcript}"</p>
              )}
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">{t('voice.error')}</p>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Fallback (offline mode) */}
      <div className="mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!textInput.trim()) return;
            const controller = initVoiceController();
            if (controller) {
              controller.processText(textInput.trim());
              setTranscript(textInput.trim());
            }
            setTextInput('');
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Keyboard
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('voice.textPlaceholder', 'Type a command...')}
              className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[color:var(--color-text)] outline-none transition-colors focus:border-[color:var(--color-primary)]/50 focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
              aria-label={t('voice.textPlaceholder', 'Type a command...')}
            />
          </div>
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="btn-secondary focus-ring rounded-xl px-4 py-2 text-sm"
          >
            {t('voice.send', 'Send')}
          </button>
        </form>
      </div>

      {/* Commands List */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-muted)]">
          {t('voice.commands')}
        </p>

        <div className="grid gap-2">
          {[
            {
              cmd: t('voice.cmdDashboard'),
              desc: t('voice.cmdDashboardDesc'),
            },
            {
              cmd: t('voice.cmdSettings'),
              desc: t('voice.cmdSettingsDesc'),
            },
            {
              cmd: t('voice.cmdHelp'),
              desc: t('voice.cmdHelpDesc'),
            },
            {
              cmd: t('voice.cmdTheme'),
              desc: t('voice.cmdThemeDesc'),
            },
            {
              cmd: t('voice.cmdLanguage'),
              desc: t('voice.cmdLanguageDesc'),
            },
            {
              cmd: t('voice.cmdEv'),
              desc: t('voice.cmdEvDesc'),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2"
            >
              <span className="text-sm font-mono text-[color:var(--color-text)]">{item.cmd}</span>
              <span className="text-xs text-[color:var(--color-muted)]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
