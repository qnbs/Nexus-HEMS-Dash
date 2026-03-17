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
  Cpu,
  Puzzle,
  HardDrive,
  Settings,
  Clock,
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
      id: 'historical-analytics',
      icon: <Clock className="h-5 w-5" />,
      label: t('nav.historicalAnalytics', 'History'),
      path: '/historical-analytics',
    },
    {
      id: 'monitoring',
      icon: <Monitor className="h-5 w-5" />,
      label: t('nav.monitoring', 'Monitoring'),
      path: '/monitoring',
    },
    {
      id: 'controllers',
      icon: <Cpu className="h-5 w-5" />,
      label: t('nav.controllers', 'Controllers'),
      path: '/controllers',
    },
    {
      id: 'plugins',
      icon: <Puzzle className="h-5 w-5" />,
      label: t('nav.plugins', 'Plugins'),
      path: '/plugins',
    },
    {
      id: 'hardware',
      icon: <HardDrive className="h-5 w-5" />,
      label: t('nav.hardware', 'Hardware'),
      path: '/hardware',
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
              className="z-modal-backdrop fixed inset-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            {/* Sheet */}
            <motion.div
              ref={moreSheetRef}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="z-modal fixed right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 rounded-t-3xl border-t border-(--color-border) bg-(--color-surface) p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.3)] backdrop-blur-3xl lg:hidden"
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
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`focus-ring flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors ${
                        isActive
                          ? 'bg-(--color-primary)/15 text-(--color-primary)'
                          : 'text-(--color-muted) active:bg-(--color-surface-strong)'
                      }`}
                    >
                      {item.icon}
                      <span className="max-w-full truncate text-[10px] leading-tight font-medium">
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
        className="z-fixed fixed right-0 bottom-0 left-0 lg:hidden"
        aria-label={t('mobile.navigation', 'Mobile Navigation')}
      >
        <div className="absolute inset-0 border-t border-(--color-border) bg-(--color-surface) backdrop-blur-3xl">
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
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`focus-ring relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors active:scale-95 ${
                  isActive ? 'text-(--color-primary)' : 'text-(--color-muted)'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <div className="flex h-8 w-8 items-center justify-center">{item.icon}</div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          {/* More button */}
          <button
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
            <span className="text-[10px] font-medium">{t('nav.more', 'More')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export const MobileNavigation = MobileNavigationComponent;
