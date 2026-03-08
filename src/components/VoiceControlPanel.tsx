import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { VoiceController } from '../lib/voice-control';
import { useAppStore } from '../store';

let voiceController: VoiceController | null = null;

export function VoiceControlPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTheme, theme, locale, setLocale } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const initVoiceController = () => {
    if (!voiceController) {
      voiceController = new VoiceController();

      // Register default commands
      voiceController.registerDefaultCommands({
        onNavigate: (page: string) => {
          navigate(page);
          setTranscript(`Navigation: ${page}`);
        },
        onToggleTheme: () => {
          const themes = ['cyber-energy-dark', 'solar-light', 'night-mode'] as const;
          type ThemeName = (typeof themes)[number];
          const currentIndex = themes.indexOf(theme as ThemeName);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          setTheme(nextTheme);
          setTranscript(`Theme: ${nextTheme}`);
        },
        onToggleLanguage: () => {
          const nextLocale = locale === 'de' ? 'en' : 'de';
          setLocale(nextLocale);
          setTranscript(`Language: ${nextLocale}`);
        },
        onToggleEV: () => {
          setTranscript('EV charging toggled');
        },
      });

      // Custom recognition handler to capture transcript
      if (voiceController['recognition']) {
        const recognition = voiceController['recognition'];
        recognition.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          const text = result[0].transcript;
          setTranscript(text);

          // Process command
          voiceController?.['processCommand'](text.toLowerCase());
        };

        recognition.onerror = (event) => {
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
        setError('Voice control not supported in this browser');
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
      setError('Voice control initialization failed');
      console.error(err);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            {t('voice.title', 'Voice Control')}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {t('voice.subtitle', 'Control dashboard with voice commands')}
          </p>
        </div>

        <button
          onClick={toggleVoice}
          className={`focus-ring flex h-14 w-14 items-center justify-center rounded-full transition-all ${
            isListening
              ? 'animate-pulse bg-[color:var(--color-primary)] text-slate-900 shadow-lg shadow-[color:var(--color-primary)]/50'
              : 'bg-slate-800/50 text-[color:var(--color-muted)] hover:bg-slate-700/50'
          }`}
          aria-label={
            isListening ? t('voice.stop', 'Stop listening') : t('voice.start', 'Start listening')
          }
        >
          {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
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
                🎤 {t('voice.listening', 'Listening...')}
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
                <p className="text-sm font-medium text-red-400">
                  {t('voice.error', 'Voice control error')}
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commands List */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-muted)]">
          {t('voice.commands', 'Available Commands')}
        </p>

        <div className="grid gap-2">
          {[
            {
              cmd: t('voice.cmdDashboard', 'Dashboard'),
              desc: t('voice.cmdDashboardDesc', 'Go to dashboard'),
            },
            {
              cmd: t('voice.cmdSettings', 'Einstellungen / Settings'),
              desc: t('voice.cmdSettingsDesc', 'Open settings'),
            },
            {
              cmd: t('voice.cmdHelp', 'Hilfe / Help'),
              desc: t('voice.cmdHelpDesc', 'Open help'),
            },
            {
              cmd: t('voice.cmdTheme', 'Theme wechseln'),
              desc: t('voice.cmdThemeDesc', 'Switch theme'),
            },
            {
              cmd: t('voice.cmdLanguage', 'Sprache wechseln'),
              desc: t('voice.cmdLanguageDesc', 'Switch language'),
            },
            {
              cmd: t('voice.cmdEv', 'Auto laden'),
              desc: t('voice.cmdEvDesc', 'Toggle EV charging'),
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
}
