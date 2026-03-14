import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
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
  Zap,
  Key,
  Monitor,
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
  { path: '/monitoring', labelKey: 'nav.monitoring', icon: <Monitor size={20} />, group: 'tools' },
  { path: '/settings', labelKey: 'nav.settings', icon: <Settings size={20} />, group: 'system' },
  { path: '/settings/ai', labelKey: 'nav.aiKeys', icon: <Key size={20} />, group: 'system' },
  { path: '/help', labelKey: 'nav.help', icon: <HelpCircle size={20} />, group: 'system' },
];

function SidebarComponent() {
  const { t } = useTranslation();
  const { connected } = useAppStore();

  const groups = {
    main: navItems.filter((i) => i.group === 'main'),
    tools: navItems.filter((i) => i.group === 'tools'),
    system: navItems.filter((i) => i.group === 'system'),
  };

  return (
    <motion.nav
      className="z-fixed fixed top-0 left-0 hidden h-screen w-64 flex-col border-r border-(--color-border) bg-(--color-surface) backdrop-blur-3xl lg:flex"
      aria-label={t('nav.mainNavigation', 'Main navigation')}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-(--color-border) px-5 py-5">
        <motion.div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/10"
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Zap className="h-5 w-5 text-(--color-primary)" aria-hidden="true" />
        </motion.div>
        <div>
          <h1 className="fluid-text-lg font-semibold tracking-tight">{t('common.appName')}</h1>
          <div
            className="flex items-center gap-1.5"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]'}`}
              aria-hidden="true"
            />
            <span className="text-xs text-(--color-muted)">
              {connected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {/* Main Group */}
        <div>
          <h2
            id="nav-group-energy"
            className="mb-2 px-3 text-xs font-semibold tracking-widest text-(--color-muted) uppercase"
          >
            {t('nav.groupEnergy', 'Energy')}
          </h2>
          <ul className="space-y-0.5" role="list" aria-labelledby="nav-group-energy">
            {groups.main.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'sidebar-link-active bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                        : 'text-(--color-muted) hover:bg-white/5 hover:text-(--color-text)'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive
                            ? 'text-(--color-primary)'
                            : 'text-(--color-muted) group-hover:text-(--color-text)'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
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
          <h2
            id="nav-group-tools"
            className="mb-2 px-3 text-xs font-semibold tracking-widest text-(--color-muted) uppercase"
          >
            {t('nav.groupTools', 'Tools')}
          </h2>
          <ul className="space-y-0.5" role="list" aria-labelledby="nav-group-tools">
            {groups.tools.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'sidebar-link-active bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                        : 'text-(--color-muted) hover:bg-white/5 hover:text-(--color-text)'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive
                            ? 'text-(--color-primary)'
                            : 'text-(--color-muted) group-hover:text-(--color-text)'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
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
          <h2
            id="nav-group-system"
            className="mb-2 px-3 text-xs font-semibold tracking-widest text-(--color-muted) uppercase"
          >
            {t('nav.groupSystem', 'System')}
          </h2>
          <ul className="space-y-0.5" role="list" aria-labelledby="nav-group-system">
            {groups.system.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'sidebar-link-active bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                        : 'text-(--color-muted) hover:bg-white/5 hover:text-(--color-text)'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive
                            ? 'text-(--color-primary)'
                            : 'text-(--color-muted) group-hover:text-(--color-text)'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
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
      <div className="border-t border-(--color-border) px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-(--color-muted)">
          <span className="energy-pulse inline-block h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
          <span>Nexus HEMS v4.2.0</span>
        </div>
      </div>
    </motion.nav>
  );
}

export const Sidebar = SidebarComponent;
