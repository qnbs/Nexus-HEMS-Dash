import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Activity,
  Sun,
  Battery,
  Home,
  Car,
  Map,
  Sparkles,
  TrendingUp,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Key,
} from 'lucide-react';
import { useAppStore } from '../../store';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
  group: 'main' | 'tools' | 'system';
}

const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: <LayoutDashboard size={20} />, group: 'main' },
  { path: '/energy-flow', labelKey: 'nav.energyFlow', icon: <Activity size={20} />, group: 'main' },
  { path: '/production', labelKey: 'nav.production', icon: <Sun size={20} />, group: 'main' },
  { path: '/storage', labelKey: 'nav.storage', icon: <Battery size={20} />, group: 'main' },
  { path: '/consumption', labelKey: 'nav.consumption', icon: <Home size={20} />, group: 'main' },
  { path: '/ev', labelKey: 'nav.ev', icon: <Car size={20} />, group: 'main' },
  { path: '/floorplan', labelKey: 'nav.floorplan', icon: <Map size={20} />, group: 'main' },
  {
    path: '/ai-optimizer',
    labelKey: 'nav.aiOptimizer',
    icon: <Sparkles size={20} />,
    group: 'tools',
  },
  { path: '/tariffs', labelKey: 'nav.tariffs', icon: <TrendingUp size={20} />, group: 'tools' },
  { path: '/analytics', labelKey: 'nav.analytics', icon: <BarChart3 size={20} />, group: 'tools' },
  { path: '/settings', labelKey: 'nav.settings', icon: <Settings size={20} />, group: 'system' },
  { path: '/settings/ai', labelKey: 'nav.aiKeys', icon: <Key size={20} />, group: 'system' },
  { path: '/help', labelKey: 'nav.help', icon: <HelpCircle size={20} />, group: 'system' },
];

function SidebarComponent() {
  const { t } = useTranslation();
  const location = useLocation();
  const { connected } = useAppStore();

  const groups = {
    main: navItems.filter((i) => i.group === 'main'),
    tools: navItems.filter((i) => i.group === 'tools'),
    system: navItems.filter((i) => i.group === 'system'),
  };

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-3xl lg:flex"
      role="navigation"
      aria-label={t('nav.mainNavigation', 'Main navigation')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-5 py-5">
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Zap className="h-7 w-7 text-[color:var(--color-primary)] drop-shadow-[0_0_12px_var(--color-primary)]" />
        </motion.div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t('common.appName')}</h1>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`}
            />
            <span className="text-xs text-[color:var(--color-muted)]">
              {connected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Group */}
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
            {t('nav.groupEnergy', 'Energy')}
          </p>
          <ul className="space-y-1" role="list">
            {groups.main.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                        : 'text-[color:var(--color-muted)] hover:bg-white/5 hover:text-[color:var(--color-text)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive
                            ? 'text-[color:var(--color-primary)]'
                            : 'text-[color:var(--color-muted)] group-hover:text-[color:var(--color-text)]'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto h-2 w-2 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Tools Group */}
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
            {t('nav.groupTools', 'Tools')}
          </p>
          <ul className="space-y-1" role="list">
            {groups.tools.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                        : 'text-[color:var(--color-muted)] hover:bg-white/5 hover:text-[color:var(--color-text)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive
                            ? 'text-[color:var(--color-primary)]'
                            : 'text-[color:var(--color-muted)] group-hover:text-[color:var(--color-text)]'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto h-2 w-2 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* System Group */}
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
            {t('nav.groupSystem', 'System')}
          </p>
          <ul className="space-y-1" role="list">
            {groups.system.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                        : 'text-[color:var(--color-muted)] hover:bg-white/5 hover:text-[color:var(--color-text)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive
                            ? 'text-[color:var(--color-primary)]'
                            : 'text-[color:var(--color-muted)] group-hover:text-[color:var(--color-text)]'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto h-2 w-2 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[color:var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
          <span className="energy-pulse inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-primary)]" />
          <span>Nexus HEMS v2.3.0</span>
        </div>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
