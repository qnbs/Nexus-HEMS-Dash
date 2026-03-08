import { useState } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Thermometer, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Floorplan() {
  const { t } = useTranslation();
  const [lightsOn, setLightsOn] = useState(true);
  const [windowOpen, setWindowOpen] = useState(false);
  const [temp, setTemp] = useState(21.5);

  return (
    <div
      className="relative w-full h-full bg-slate-900/50 p-4"
      role="application"
      aria-label={t('dashboard.floorplan')}
    >
      {/* Simple SVG Floorplan */}
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full opacity-80"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Building layout with kitchen, bathroom, and living room"
      >
        <title>{t('dashboard.floorplan')}</title>
        <desc>
          {t('dashboard.automation')}
        </desc>
        {/* Walls */}
        <path
          d="M 50 50 L 750 50 L 750 350 L 50 350 Z"
          fill="none"
          stroke="#475569"
          strokeWidth="8"
        />
        <path d="M 350 50 L 350 350" fill="none" stroke="#475569" strokeWidth="8" />
        <path d="M 50 200 L 350 200" fill="none" stroke="#475569" strokeWidth="8" />

        {/* Windows */}
        <line
          x1="150"
          y1="50"
          x2="250"
          y2="50"
          stroke={windowOpen ? '#38bdf8' : '#94a3b8'}
          strokeWidth="12"
          className="transition-colors duration-500"
        />
        <line x1="500" y1="350" x2="600" y2="350" stroke="#94a3b8" strokeWidth="12" />

        {/* Doors */}
        <path
          d="M 350 150 Q 400 150 400 100"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="4"
          strokeDasharray="4 4"
        />
        <line x1="350" y1="150" x2="350" y2="100" stroke="#1e293b" strokeWidth="10" />

        {/* Rooms */}
        <text x="200" y="130" fill="#64748b" fontSize="24" textAnchor="middle" fontFamily="Inter">
          {t('floorplan.kitchen')}
        </text>
        <text x="200" y="280" fill="#64748b" fontSize="24" textAnchor="middle" fontFamily="Inter">
          {t('floorplan.bathroom')}
        </text>
        <text x="550" y="200" fill="#64748b" fontSize="24" textAnchor="middle" fontFamily="Inter">
          {t('floorplan.livingRoom')}
        </text>

        {/* Light overlay */}
        <motion.rect
          x="354"
          y="54"
          width="392"
          height="292"
          fill="#fef08a"
          initial={{ opacity: 0 }}
          animate={{ opacity: lightsOn ? 0.15 : 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none"
        />
      </svg>

      {/* Interactive Elements Overlay */}
      <div className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2">
        <button
          onClick={() => setLightsOn(!lightsOn)}
          className={`p-3 rounded-full backdrop-blur-md border transition-all focus-ring ${
            lightsOn
              ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300  neon-border-orange'
              : 'bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-muted)]'
          }`}
          aria-label={lightsOn ? t('floorplan.lights') + ' ' + t('common.active') : t('floorplan.lights')}
          aria-pressed={lightsOn}
        >
          <Lightbulb size={24} aria-hidden="true" />
        </button>
      </div>

      <div className="absolute top-12 left-1/4 transform -translate-x-1/2">
        <button
          onClick={() => setWindowOpen(!windowOpen)}
          className={`p-2 rounded-full backdrop-blur-md border transition-all focus-visible:focus-ring ${
            windowOpen
              ? 'bg-sky-400/20 border-sky-400/50 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'bg-slate-800/50 border-slate-700 text-slate-400'
          }`}
          aria-label={windowOpen ? t('floorplan.windowClose') : t('floorplan.windowOpen')}
          aria-pressed={windowOpen}
        >
          <Wind size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="absolute bottom-1/4 right-1/3">
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md border border-slate-700 px-3 py-2 rounded-xl">
          <Thermometer size={18} className="text-orange-400" aria-hidden="true" />
          <span className="font-mono text-lg">{temp.toFixed(1)}°C</span>
          <div className="flex flex-col ml-2">
            <button
              onClick={() => setTemp((v) => v + 0.5)}
              className="text-slate-400 hover:text-white leading-none"
              aria-label={t('floorplan.tempIncrease')}
            >
              +
            </button>
            <button
              onClick={() => setTemp((v) => v - 0.5)}
              className="text-slate-400 hover:text-white leading-none"
              aria-label={t('floorplan.tempDecrease')}
            >
              -
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
