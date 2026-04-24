import {
  Activity,
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  Monitor,
  MoreHorizontal,
  Settings,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

function MobileNavigationComponent() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreSheetRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap for the more sheet
  useEffect(() => {
    if (!moreOpen) {
      moreButtonRef.current?.focus();
      return;
    }
    const sheet = moreSheetRef.current;
    if (!sheet) return;
    const closeBtn = sheet.querySelector<HTMLElement>('[aria-label]');
    closeBtn?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = sheet.querySelectorAll<HTMLElement>('button:not([disabled])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    sheet.addEventListener('keydown', handleKeyDown);
    return () => sheet.removeEventListener('keydown', handleKeyDown);
  }, [moreOpen]);

  const primaryItems: NavItem[] = [
    {
      id: 'home',
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: t('nav.home', 'Home'),
      path: '/',
    },
    {
      id: 'energy-flow',
      icon: <Activity className="h-5 w-5" />,
      label: t('nav.energyFlow', 'Flow'),
      path: '/energy-flow',
    },
    {
      id: 'devices',
      icon: <Zap className="h-5 w-5" />,
      label: t('nav.devicesOverview', 'Devices'),
      path: '/devices',
    },
    {
      id: 'tariffs',
      icon: <TrendingUp className="h-5 w-5" />,
      label: t('nav.tariffs', 'Tariffs'),
      path: '/tariffs',
    },
  ];

  const moreItems: NavItem[] = [
    {
      id: 'optimization-ai',
      icon: <Sparkles className="h-5 w-5" />,
      label: t('nav.aiOptimizer', 'AI'),
      path: '/optimization-ai',
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      label: t('nav.analytics', 'Analytics'),
      path: '/analytics',
    },
    {
      id: 'monitoring',
      icon: <Monitor className="h-5 w-5" />,
      label: t('nav.monitoring', 'Monitoring'),
      path: '/monitoring',
    },
    {
      id: 'settings',
      icon: <Settings className="h-5 w-5" />,
      label: t('nav.settings', 'Settings'),
      path: '/settings',
    },
    {
      id: 'help',
      icon: <HelpCircle className="h-5 w-5" />,
      label: t('nav.help', 'Help'),
      path: '/help',
    },
  ];

  const handleNavigation = (path: string) => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    navigate(path);
    setMoreOpen(false);
  };

  /** Check if any of the "more" pages is currently active */
  const isMorePageActive = moreItems.some((item) => location.pathname.startsWith(item.path));

  return (
    <>
      {/* More Pages Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop — covers the page but stops above the navbar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-modal-backdrop bg-black/60 backdrop-blur-sm lg:hidden"
            />
            {/* Sheet */}
            <motion.div
              ref={moreSheetRef}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 z-modal rounded-t-3xl border-(--color-border) border-t bg-(--color-surface) p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.3)] backdrop-blur-3xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.allPages', 'All Pages')}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-(--color-text) text-sm">
                  {t('nav.allPages', 'All Pages')}
                </span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="focus-ring rounded-full p-1.5 text-(--color-muted) transition-colors hover:bg-white/10 hover:text-(--color-text)"
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {moreItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`focus-ring flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors ${
                        isActive
                          ? 'bg-(--color-primary)/15 text-(--color-primary)'
                          : 'text-(--color-muted) active:bg-(--color-surface-strong)'
                      }`}
                    >
                      {item.icon}
                      <span className="max-w-full truncate font-medium text-[10px] leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-fixed lg:hidden"
        aria-label={t('mobile.navigation', 'Mobile Navigation')}
      >
        <div className="absolute inset-0 border-(--color-border) border-t bg-(--color-surface) backdrop-blur-3xl">
          <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-(--color-primary)/20 to-transparent" />
        </div>
        <div className="relative flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {primaryItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`focus-ring relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors active:scale-95 ${
                  isActive ? 'text-(--color-primary)' : 'text-(--color-muted)'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <div className="flex h-8 w-8 items-center justify-center">{item.icon}</div>
                <span className="font-medium text-[10px]">{item.label}</span>
              </button>
            );
          })}
          {/* More button */}
          <button
            type="button"
            ref={moreButtonRef}
            onClick={() => setMoreOpen(!moreOpen)}
            className={`focus-ring relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors active:scale-95 ${
              moreOpen || isMorePageActive ? 'text-(--color-primary)' : 'text-(--color-muted)'
            }`}
            aria-expanded={moreOpen}
            aria-label={t('accessibility.moreNavPages', 'More pages')}
            data-testid="mobile-more-btn"
          >
            <div className="flex h-8 w-8 items-center justify-center">
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="font-medium text-[10px]">{t('nav.more', 'More')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export const MobileNavigation = MobileNavigationComponent;
