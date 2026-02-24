import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useWebSocket } from './useWebSocket';
import { useAppStore } from './store';
import { Zap, LayoutDashboard, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';

export default function App() {
  const { connected, energyData } = useAppStore();

  // Initialize WebSocket connection
  useWebSocket();

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30">
        {/* Background atmosphere */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
                  <Zap className="text-emerald-400" size={28} />
                  Nexus-HEMS Dash
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Intelligenter Orchestrator für dezentrale Energie
                </p>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-2 ml-8 bg-slate-800/50 p-1.5 rounded-2xl border border-white/10">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`
                  }
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </NavLink>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`
                  }
                >
                  <SettingsIcon size={18} />
                  Einstellungen
                </NavLink>
                <NavLink
                  to="/help"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`
                  }
                >
                  <HelpCircle size={18} />
                  Hilfe
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`}
                />
                <span className="hidden sm:inline">{connected ? 'Verbunden' : 'Getrennt'}</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-emerald-400">
                {energyData.priceCurrent.toFixed(2)} €/kWh
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-2 mb-8 bg-slate-800/50 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`
              }
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`
              }
            >
              <SettingsIcon size={18} />
              Einstellungen
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`
              }
            >
              <HelpCircle size={18} />
              Hilfe
            </NavLink>
          </nav>

          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
