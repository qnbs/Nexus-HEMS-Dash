import { useState, type FormEvent } from 'react';
import { Settings as SettingsIcon, Save, Server, Shield, Zap, Database } from 'lucide-react';

export function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-emerald-400" size={28} />
        <h1 className="text-3xl font-light tracking-tight">Einstellungen</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* System Configuration */}
        <section className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <Server size={20} className="text-blue-400" />
            Systemkonfiguration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Victron GX IP-Adresse</label>
              <input
                type="text"
                defaultValue="192.168.1.100"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">KNX IP-Router Adresse</label>
              <input
                type="text"
                defaultValue="192.168.1.101"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Node-RED WebSocket Port</label>
              <input
                type="number"
                defaultValue="1880"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Datenaktualisierungsrate (ms)
              </label>
              <input
                type="number"
                defaultValue="2000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </section>

        {/* Energy Management */}
        <section className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <Zap size={20} className="text-yellow-400" />
            Energiemanagement & Tarife
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Dynamischer Tarifanbieter
              </label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50">
                <option value="tibber">Tibber</option>
                <option value="awattar">aWATTar</option>
                <option value="none">Keiner (Fixpreis)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                API Token (Tarifanbieter)
              </label>
              <input
                type="password"
                defaultValue="••••••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Preis-Schwellenwert für Ladung (€/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="0.15"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Maximaler Netzbezug (kW) - §14a EnWG
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue="4.2"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <Shield size={20} className="text-red-400" />
            Sicherheit & Datenschutz
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <div>
                <div className="font-medium text-slate-200">Lokale PKI (mTLS) erzwingen</div>
                <div className="text-sm text-slate-400">
                  Erfordert gültige Client-Zertifikate für alle Verbindungen.
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <div>
                <div className="font-medium text-slate-200">Cloud-Telemetrie deaktivieren</div>
                <div className="text-sm text-slate-400">
                  Verhindert das Senden von anonymisierten Nutzungsdaten an externe Server.
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <div>
                <div className="font-medium text-slate-200">
                  Zwei-Faktor-Authentifizierung (2FA)
                </div>
                <div className="text-sm text-slate-400">
                  Zusätzliche Sicherheitsebene für den Zugriff auf das Dashboard.
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Database & Storage */}
        <section className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <Database size={20} className="text-purple-400" />
            Datenbank & Speicherung
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">InfluxDB URL</label>
              <input
                type="text"
                defaultValue="http://192.168.1.102:8086"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">InfluxDB Token</label>
              <input
                type="password"
                defaultValue="••••••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Lokale Historie (Tage)</label>
              <input
                type="number"
                defaultValue="30"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-xs text-slate-400">
                Speicherdauer in der lokalen IndexedDB (Dexie.js).
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Save size={20} />
            {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
