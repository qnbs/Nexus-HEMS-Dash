import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  TrendingUp,
  MoreHorizontal,
  Sun,
  Battery,
  Home,
  Car,
  Map,
  BarChart3,
  HelpCircle,
  Monitor,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

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
      // Restore focus to trigger button on close
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
      id: 'ai-optimizer',
      icon: <Sparkles className="h-5 w-5" />,
      label: t('nav.aiOptimizer', 'AI'),
      path: '/ai-optimizer',
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
      id: 'production',
      icon: <Sun className="h-5 w-5" />,
      label: t('nav.production', 'Production'),
      path: '/production',
    },
    {
      id: 'storage',
      icon: <Battery className="h-5 w-5" />,
      label: t('nav.storage', 'Storage'),
      path: '/storage',
    },
    {
      id: 'consumption',
      icon: <Home className="h-5 w-5" />,
      label: t('nav.consumption', 'Consumption'),
      path: '/consumption',
    },
    { id: 'ev', icon: <Car className="h-5 w-5" />, label: t('nav.ev', 'EV'), path: '/ev' },
    {
      id: 'floorplan',
      icon: <Map className="h-5 w-5" />,
      label: t('nav.floorplan', 'Floorplan'),
      path: '/floorplan',
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

  return (
    <>
      {/* More Pages Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              ref={moreSheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 bottom-16 left-0 z-40 rounded-t-3xl border-t border-(--color-border) bg-(--color-surface) p-4 backdrop-blur-3xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.allPages', 'All Pages')}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-(--color-text)">
                  {t('nav.allPages', 'All Pages')}
                </span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="focus-ring rounded-full p-1.5 hover:bg-white/10"
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {moreItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`focus-ring flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors ${
                      location.pathname === item.path
                        ? 'bg-(--color-primary)/15 text-(--color-primary)'
                        : 'text-(--color-muted) hover:bg-(--color-surface-strong)'
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] leading-tight font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-50 lg:hidden"
        aria-label={t('mobile.navigation', 'Mobile Navigation')}
      >
        <div className="absolute inset-0 border-t border-(--color-border) bg-(--color-surface) backdrop-blur-3xl">
          <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-(--color-primary)/20 to-transparent" />
        </div>
        <div className="relative flex items-center justify-around px-2 py-2">
          {primaryItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className="focus-ring relative flex flex-col items-center gap-0.5 px-3 py-1"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                whileTap={{ scale: 0.92 }}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                    isActive
                      ? 'bg-(--color-primary)/20 text-(--color-primary)'
                      : 'text-(--color-muted)'
                  }`}
                >
                  {item.icon}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-0.5 h-1 w-8 rounded-full bg-(--color-primary)"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? 'text-(--color-primary)' : 'text-(--color-muted)'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
          {/* More button */}
          <motion.button
            ref={moreButtonRef}
            onClick={() => setMoreOpen(!moreOpen)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1"
            aria-expanded={moreOpen}
            aria-label={t('accessibility.moreNavPages', 'More pages')}
            whileTap={{ scale: 0.92 }}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${moreOpen ? 'bg-(--color-primary)/20 text-(--color-primary)' : 'text-(--color-muted)'}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span
              className={`text-[10px] font-medium ${moreOpen ? 'text-(--color-primary)' : 'text-(--color-muted)'}`}
            >
              {t('nav.more', 'More')}
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}

export const MobileNavigation = MobileNavigationComponent;
