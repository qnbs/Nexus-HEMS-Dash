import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TourStep {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  color: string;
}

interface PageTourProps {
  /** Unique tour ID — used as localStorage key */
  tourId: string;
  steps: TourStep[];
}

const STORAGE_PREFIX = 'nexus-tour-';

export function PageTour({ tourId, steps }: PageTourProps) {
  const { t } = useTranslation();
  const storageKey = `${STORAGE_PREFIX}${tourId}`;

  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(0);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // noop
    }
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible || steps.length === 0) return null;

  const current = steps[step]!;
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('tour.title', 'Guided Tour')}
            className="z-modal fixed inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-panel-strong w-full max-w-md overflow-hidden rounded-3xl border border-(--color-border)">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-(--color-border)/30 px-5 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-(--color-primary)">
                  <Sparkles size={16} />
                  {t('tour.title', 'Guided Tour')}
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="focus-ring rounded-lg p-1.5 text-(--color-muted) transition-colors hover:text-(--color-text)"
                  aria-label={t('common.close')}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="px-6 py-8 text-center"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative mx-auto mb-5 inline-flex">
                    <span
                      className="energy-pulse absolute -inset-3 rounded-3xl opacity-40"
                      style={{ backgroundColor: current.color }}
                      aria-hidden="true"
                    />
                    <div
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${current.color}20` }}
                    >
                      <Icon size={28} style={{ color: current.color }} />
                    </div>
                  </div>
                  <h3 className="fluid-text-lg mb-2 font-semibold text-(--color-text)">
                    {t(current.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-(--color-muted)">
                    {t(current.descKey)}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-(--color-border)/30 px-5 py-3">
                {/* Step dots */}
                <div className="flex gap-1.5" aria-label={`${step + 1} / ${steps.length}`}>
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === step ? 'w-4 bg-(--color-primary)' : 'w-1.5 bg-(--color-border)'
                      }`}
                    />
                  ))}
                </div>

                {/* Nav buttons */}
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={prev}
                      className="focus-ring inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-(--color-muted) transition-colors hover:text-(--color-text)"
                    >
                      <ChevronLeft size={14} />
                      {t('tour.prev', 'Zurück')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    className="focus-ring inline-flex items-center gap-1 rounded-xl bg-(--color-primary)/15 px-4 py-1.5 text-xs font-semibold text-(--color-primary) transition-colors hover:bg-(--color-primary)/25"
                  >
                    {isLast ? t('tour.finish', 'Verstanden') : t('tour.next', 'Weiter')}
                    {!isLast && <ChevronRight size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
