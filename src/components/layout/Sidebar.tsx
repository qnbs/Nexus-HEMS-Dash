import { memo } from 'react';
import { NavLink } from 'react-router-dom';
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
    <nav
      className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-(--color-border) bg-(--color-surface) backdrop-blur-3xl lg:flex"
      aria-label={t('nav.mainNavigation', 'Main navigation')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-(--color-border) px-5 py-5">
        <Zap className="h-6 w-6 text-(--color-primary)" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold fluid-text-lg tracking-tight">
            {t('common.appName')}
          </h1>
          <div
            className="flex items-center gap-1.5"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`}
              aria-hidden="true"
            />
            <span className="text-xs text-(--color-muted)">
              {connected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Group */}
        <div>
          <p
            id="nav-group-energy"
            className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-(--color-muted)"
          >
            {t('nav.groupEnergy', 'Energy')}
          </p>
          <ul className="space-y-1" role="list" aria-labelledby="nav-group-energy">
            {groups.main.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
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
          <p
            id="nav-group-tools"
            className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-(--color-muted)"
          >
            {t('nav.groupTools', 'Tools')}
          </p>
          <ul className="space-y-1" role="list" aria-labelledby="nav-group-tools">
            {groups.tools.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
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
          <p
            id="nav-group-system"
            className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-(--color-muted)"
          >
            {t('nav.groupSystem', 'System')}
          </p>
          <ul className="space-y-1" role="list" aria-labelledby="nav-group-system">
            {groups.system.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
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
          <span>Nexus HEMS v2.3.0</span>
        </div>
      </div>
    </nav>
  );
}

export const Sidebar = memo(SidebarComponent);
