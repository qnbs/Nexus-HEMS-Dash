import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        className="glass-panel-strong max-w-md rounded-3xl p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
          <AlertTriangle size={32} className="text-orange-400" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">404</h1>
        <p className="mb-6 text-[color:var(--color-muted)]">
          {t('error.pageNotFound', 'Page not found')}
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 focus-ring"
        >
          <Home size={18} />
          {t('error.goHome', 'Go to Dashboard')}
        </Link>
      </motion.div>
    </div>
  );
}
