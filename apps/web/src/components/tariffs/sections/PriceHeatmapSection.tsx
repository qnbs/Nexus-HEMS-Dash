import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { sectionAnim } from '../constants';
import { HEATMAP_DATA } from '../data/heatmap';
import { getHeatmapBg } from '../utils';

export function PriceHeatmapSection() {
  const { t } = useTranslation();
  return (
    <motion.section
      className="glass-panel-strong hover-lift p-6"
      {...sectionAnim}
      transition={{ ...sectionAnim.transition, delay: 0.2 }}
    >
      <h2 className="fluid-text-lg mb-1 font-semibold text-(--color-text)">
        <Calendar className="mr-2 inline h-5 w-5 text-(--color-primary)" aria-hidden="true" />
        {t('tariffs.heatmapTitle')}
      </h2>
      <p className="mb-4 text-(--color-muted) text-sm">{t('tariffs.heatmapDesc')}</p>

      <div className="overflow-x-auto">
        <table className="block min-w-175" aria-label={t('tariffs.heatmapAria')}>
          <thead className="block">
            <tr className="mb-1 flex">
              <th scope="col" className="w-16 shrink-0 font-normal" aria-label={t('tariffs.day')} />
              {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                <th
                  key={`hour-label-${h}`}
                  scope="col"
                  className="flex-1 text-center font-normal text-(--color-muted) text-[9px]"
                  aria-label={`${String(h).padStart(2, '0')}:00`}
                >
                  {h % 3 === 0 ? `${String(h).padStart(2, '0')}` : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="block">
            {HEATMAP_DATA.map((row) => (
              <tr key={row.date} className="mb-0.5 flex items-center">
                <th
                  scope="row"
                  className="w-16 shrink-0 pr-2 text-right font-normal text-(--color-muted) text-[10px]"
                >
                  {row.day} {row.date}
                </th>
                {row.hours
                  .map((price, h) => ({ price, h }))
                  .map(({ price, h }) => (
                    <td
                      key={`${row.date}-${h}`}
                      className="mx-px h-5 flex-1 rounded-sm transition-all hover:scale-110 hover:ring-1 hover:ring-white/30"
                      style={{ backgroundColor: getHeatmapBg(price) }}
                      title={`${row.day} ${String(h).padStart(2, '0')}:00 — ${(price * 100).toFixed(1)} ct/kWh`}
                    />
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 text-(--color-muted) text-[10px]">
          <span>{t('tariffs.cheap')}</span>
          <div className="flex gap-0.5">
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--price-low) 60%, transparent)' }}
            />
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--price-low) 30%, transparent)' }}
            />
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--price-mid) 40%, transparent)' }}
            />
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--price-elevated) 45%, transparent)',
              }}
            />
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--price-high) 55%, transparent)',
              }}
            />
          </div>
          <span>{t('tariffs.expensive')}</span>
        </div>
      </div>
    </motion.section>
  );
}
