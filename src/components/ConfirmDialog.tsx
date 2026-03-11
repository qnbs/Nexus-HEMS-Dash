/**
 * Confirmation Dialog Component
 * Used for critical user actions requiring confirmation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    confirmButton: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    confirmButton: 'bg-[color:var(--color-primary)] hover:opacity-90 text-slate-900',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const styles = variantStyles[variant];
  const Icon = styles.icon;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + auto-focus
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the first focusable element inside the dialog
    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();
    return () => {
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const trapFocus = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Enter' && !loading && e.target === dialogRef.current) {
        Promise.resolve(onConfirm())
          .then(() => onClose())
          .catch((error: unknown) =>
            console.error('[ConfirmDialog] Confirmation action failed:', error),
          );
        return;
      }
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose, loading, onConfirm],
  );

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('[ConfirmDialog] Confirmation action failed:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            {/* Dialog */}
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-message"
              onKeyDown={trapFocus}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2
                    id="confirm-dialog-title"
                    className="text-lg font-semibold text-[color:var(--color-text)]"
                  >
                    {title}
                  </h2>
                  <div
                    id="confirm-dialog-message"
                    className="mt-2 text-sm text-[color:var(--color-muted)]"
                  >
                    {message}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="btn-secondary focus-ring px-4 py-2"
                  type="button"
                >
                  {cancelText || t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`focus-ring rounded-xl px-4 py-2 font-medium transition-colors disabled:opacity-50 ${styles.confirmButton}`}
                  type="button"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('common.processing', 'Processing...')}
                    </span>
                  ) : (
                    confirmText || t('common.confirm', 'Confirm')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing confirmation dialogs
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose'>>({
    onConfirm: () => {},
    title: '',
    message: '',
  });

  const openDialog = (props: Omit<ConfirmDialogProps, 'isOpen' | 'onClose'>) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    openDialog,
    closeDialog,
    dialogProps: {
      ...dialogProps,
      isOpen,
      onClose: closeDialog,
    },
  };
}
