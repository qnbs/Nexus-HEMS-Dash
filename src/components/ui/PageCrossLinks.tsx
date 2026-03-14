// ─── PageCrossLinks — Contextual navigation footer for every feature page ───
// Shows: related pages, settings shortcuts, setup progress, and help links.

import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lightbulb,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { PAGE_REGISTRY, PAGE_RELATIONS, SETUP_STEPS, type PageId } from '../../lib/page-relations';
import { useAppStore } from '../../store';

// ─── Path → PageId resolver ────────────────────────────────────────────────
function pathToPageId(pathname: string): PageId | null {
  const clean = pathname.replace(/\/$/, '') || '/';
  for (const [id, meta] of Object.entries(PAGE_REGISTRY)) {
    if (meta.path === clean) return id as PageId;
  }
  return null;
}

// ─── Setup Progress Ring ────────────────────────────────────────────────────
function SetupProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="3"
        opacity={0.3}
      />
      <motion.circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={pct >= 100 ? '#22ff88' : '#00f0ff'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        transform="rotate(-90 22 22)"
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-(--color-text) text-[11px] font-semibold"
      >
        {completed}/{total}
      </text>
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function PageCrossLinks() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const settings = useAppStore((s) => s.settings);

  const pageId = pathToPageId(pathname);
  if (!pageId || !PAGE_RELATIONS[pageId]) return null;

  const relations = PAGE_RELATIONS[pageId];
  const relatedPages = relations.related.map((id) => PAGE_REGISTRY[id]).filter(Boolean);
  const settingsLinks = relations.settingsLinks;
  const setupReqs = relations.setupRequirements;
  const helpTab = relations.helpTab;

  // Calculate setup progress
  const settingsObj = settings as unknown as Record<string, unknown>;
  const completedSteps = SETUP_STEPS.filter((step) => step.checkFn(settingsObj)).length;
  const totalSteps = SETUP_STEPS.length;

  // Don't render for settings/help/ai-settings (they are the targets)
  if (pageId === 'settings' || pageId === 'help' || pageId === 'ai-settings') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-8 space-y-6"
      role="complementary"
      aria-label={t('crossLinks.sectionLabel')}
    >
      {/* ─── Related Pages ─────────────────────────────────────────── */}
      {relatedPages.length > 0 && (
        <section className="glass-panel-strong rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb size={16} className="text-(--color-primary)" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-(--color-text)">
              {t('crossLinks.relatedTitle')}
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {relatedPages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.id}
                  to={page.path}
                  className="focus-ring group flex items-center gap-3 rounded-xl border border-(--color-border)/30 bg-white/5 p-3 transition-all hover:border-(--color-primary)/40 hover:bg-white/10"
                >
                  <div className="rounded-lg border border-(--color-border)/20 bg-white/5 p-2">
                    <Icon
                      size={16}
                      className="text-(--color-primary) transition-transform group-hover:scale-110"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-text)">
                      {t(page.i18nKey)}
                    </p>
                    <p className="truncate text-[10px] text-(--color-muted)">
                      {t(`crossLinks.desc.${page.id}`)}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-(--color-muted) opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Quick Settings & Setup ────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Settings Shortcuts */}
        {(settingsLinks.length > 0 || setupReqs.length > 0) && (
          <section className="rounded-2xl border border-(--color-border) bg-(--color-surface)/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ExternalLink size={14} className="text-(--color-muted)" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-(--color-text)">
                {t('crossLinks.quickSettings')}
              </h3>
            </div>
            <div className="space-y-2">
              {settingsLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.tab}
                    to={`/settings?tab=${link.tab}`}
                    className="focus-ring flex items-center gap-3 rounded-lg border border-(--color-border)/20 bg-white/3 p-2.5 text-sm transition-colors hover:bg-white/8"
                  >
                    <Icon
                      size={14}
                      className="shrink-0 text-(--color-primary)"
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-(--color-text)">{t(link.i18nKey)}</span>
                    <ArrowRight
                      size={12}
                      className="shrink-0 text-(--color-muted)"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
              {setupReqs.map((req) => (
                <Link
                  key={req.settingsTab + req.i18nKey}
                  to={`/settings?tab=${req.settingsTab}`}
                  className="focus-ring flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-sm transition-colors hover:bg-amber-500/10"
                >
                  <Circle size={12} className="shrink-0 text-amber-400" aria-hidden="true" />
                  <span className="flex-1 text-amber-300/80">{t(req.i18nKey)}</span>
                  <ArrowRight size={12} className="shrink-0 text-amber-400/60" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Setup Progress + Help */}
        <section className="rounded-2xl border border-(--color-border) bg-(--color-surface)/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-(--color-text)">
              {t('crossLinks.setupProgress')}
            </h3>
          </div>

          {/* Progress Overview */}
          <div className="mb-4 flex items-center gap-4">
            <SetupProgress completed={completedSteps} total={totalSteps} />
            <div>
              <p className="text-sm font-medium text-(--color-text)">
                {t('crossLinks.stepsCompleted', {
                  count: completedSteps,
                  total: totalSteps,
                })}
              </p>
              <p className="text-[11px] text-(--color-muted)">
                {completedSteps >= totalSteps
                  ? t('crossLinks.setupComplete')
                  : t('crossLinks.setupIncomplete')}
              </p>
            </div>
          </div>

          {/* Setup Checklist (compact) */}
          <div className="mb-4 space-y-1.5">
            {SETUP_STEPS.slice(0, 4).map((step) => {
              const done = step.checkFn(settingsObj);
              const StepIcon = step.icon;
              return (
                <Link
                  key={step.id}
                  to={`/settings?tab=${step.settingsTab}`}
                  className="focus-ring flex items-center gap-2.5 rounded-lg p-1.5 text-xs transition-colors hover:bg-white/5"
                >
                  {done ? (
                    <CheckCircle2
                      size={13}
                      className="shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      size={13}
                      className="shrink-0 text-(--color-muted)"
                      aria-hidden="true"
                    />
                  )}
                  <StepIcon
                    size={12}
                    className="shrink-0 text-(--color-muted)"
                    aria-hidden="true"
                  />
                  <span
                    className={done ? 'text-(--color-muted) line-through' : 'text-(--color-text)'}
                  >
                    {t(step.i18nKey)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Help Link */}
          {helpTab && (
            <Link
              to={`/help`}
              className="focus-ring mt-2 flex items-center gap-2 rounded-lg border border-(--color-border)/20 bg-white/3 p-2.5 text-sm transition-colors hover:bg-white/8"
            >
              <HelpCircle
                size={14}
                className="shrink-0 text-(--color-primary)"
                aria-hidden="true"
              />
              <span className="flex-1 text-(--color-text)">{t('crossLinks.viewHelp')}</span>
              <ArrowRight size={12} className="shrink-0 text-(--color-muted)" aria-hidden="true" />
            </Link>
          )}
        </section>
      </div>
    </motion.div>
  );
}
