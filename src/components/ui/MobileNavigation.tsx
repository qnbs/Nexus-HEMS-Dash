import { motion } from 'motion/react';
import { Home, Activity, Boxes, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function MobileNavigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      icon: <Home className="h-5 w-5" />,
      label: t('nav.dashboard', 'Dashboard'),
      path: '/',
    },
    {
      id: 'flow',
      icon: <Activity className="h-5 w-5" />,
      label: t('nav.flow', 'Energy Flow'),
      path: '/#flow',
    },
    {
      id: 'devices',
      icon: <Boxes className="h-5 w-5" />,
      label: t('nav.devices', 'Devices'),
      path: '/#devices',
    },
    {
      id: 'optimizer',
      icon: <Sparkles className="h-5 w-5" />,
      label: t('nav.optimizer', 'AI Optimizer'),
      path: '/#optimizer',
    },
  ];

  const handleNavigation = (path: string) => {
    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    if (path.includes('#')) {
      const hash = path.split('#')[1];
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(hash);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {/* Glass background */}
      <div className="absolute inset-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-3xl" />

      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.hash === item.path.split('#')[1];

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className="relative flex flex-col items-center gap-1"
            >
              {/* Icon container */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  isActive
                    ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]'
                    : 'text-[color:var(--color-muted)]'
                }`}
              >
                {item.icon}
              </div>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-1 h-1 w-8 rounded-full bg-[color:var(--color-primary)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-[color:var(--color-primary)]' : 'text-[color:var(--color-muted)]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
