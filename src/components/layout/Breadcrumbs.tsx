import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const routeLabels: Record<string, string> = {
  '/': 'nav.home',
  '/energy-flow': 'nav.energyFlow',
  '/production': 'nav.production',
  '/storage': 'nav.storage',
  '/consumption': 'nav.consumption',
  '/ev': 'nav.ev',
  '/floorplan': 'nav.floorplan',
  '/ai-optimizer': 'nav.aiOptimizer',
  '/tariffs': 'nav.tariffs',
  '/analytics': 'nav.analytics',
  '/monitoring': 'nav.monitoring',
  '/settings': 'nav.settings',
  '/settings/ai': 'nav.aiKeys',
  '/help': 'nav.help',
};

function BreadcrumbsComponent() {
  const { t } = useTranslation();
  const location = useLocation();

  if (location.pathname === '/') return null;

  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav
      aria-label={t('nav.breadcrumbs', 'Breadcrumbs')}
      className="mb-4 flex items-center gap-1.5 text-sm text-(--color-muted)"
    >
      <Link
        to="/"
        className="focus-ring inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:text-(--color-text)"
      >
        <Home size={14} aria-hidden="true" />
        <span>{t('nav.home', 'Home')}</span>
      </Link>

      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const labelKey = routeLabels[path] || segment;

        return (
          <span key={path} className="inline-flex items-center gap-1.5">
            <ChevronRight size={14} aria-hidden="true" className="text-(--color-border)" />
            {isLast ? (
              <span
                className="rounded-md px-1.5 py-0.5 font-medium text-(--color-text)"
                aria-current="page"
              >
                {t(labelKey, segment)}
              </span>
            ) : (
              <Link
                to={path}
                className="focus-ring rounded-md px-1.5 py-0.5 transition-colors hover:text-(--color-text)"
              >
                {t(labelKey, segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export const Breadcrumbs = BreadcrumbsComponent;
