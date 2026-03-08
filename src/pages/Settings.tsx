import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Save, Server, Shield, Zap, Database, Check } from 'lucide-react';

export function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          animate={{ rotate: [0, 90, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <SettingsIcon className="text-emerald-400" size={28} />
        </motion.div>
        <h1 className="text-3xl font-light tracking-tight fluid-text-4xl">Einstellungen</h1>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-8 space-lg">
        {/* System Configuration */}
        <motion.section 
          className="glass-panel-strong p-6 rounded-3xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4 fluid-text-xl">
            <Server size={20} className="text-blue-400" />
            Systemkonfiguration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-md">
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">Victron GX IP-Adresse</label>
              <input
                type="text"
                defaultValue="192.168.1.100"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">KNX IP-Router Adresse</label>
              <input
                type="text"
                defaultValue="192.168.1.101"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">Node-RED WebSocket Port</label>
              <input
                type="number"
                defaultValue="1880"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">
                Datenaktualisierungsrate (ms)
              </label>
              <input
                type="number"
                defaultValue="2000"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Energy Management */}
        <motion.section 
          className="glass-panel-strong p-6 rounded-3xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4 fluid-text-xl">
            <Zap size={20} className="text-yellow-400" />
            Energiemanagement & Tarife
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-md">
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">
                Dynamischer Tarifanbieter
              </label>
              <select className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300">
                <option value="tibber">Tibber</option>
                <option value="awattar">aWATTar</option>
                <option value="none">Keiner (Fixpreis)</option>
              </select>
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">
                API Token (Tarifanbieter)
              </label>
              <input
                type="password"
                defaultValue="••••••••••••••••"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">
                Preis-Schwellenwert für Ladung (€/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="0.15"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">
                Maximaler Netzbezug (kW) - §14a EnWG
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue="4.2"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Security & Privacy */}
        <motion.section 
          className="glass-panel-strong p-6 rounded-3xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4 fluid-text-xl">
            <Shield size={20} className="text-red-400" />
            Sicherheit & Datenschutz
          </h2>

          <div className="space-y-4 space-md">
            <motion.label 
              className="flex items-center gap-3 cursor-pointer hover-lift"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-700/60 bg-slate-900/60 text-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300"
              />
              <div>
                <div className="font-medium text-slate-200 fluid-text-sm">Lokale PKI (mTLS) erzwingen</div>
                <div className="text-sm text-slate-400 fluid-text-xs">
                  Erfordert gültige Client-Zertifikate für alle Verbindungen.
                </div>
              </div>
            </motion.label>
            <motion.label 
              className="flex items-center gap-3 cursor-pointer hover-lift"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-700/60 bg-slate-900/60 text-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300"
              />
              <div>
                <div className="font-medium text-slate-200 fluid-text-sm">Cloud-Telemetrie deaktivieren</div>
                <div className="text-sm text-slate-400 fluid-text-xs">
                  Verhindert das Senden von anonymisierten Nutzungsdaten an externe Server.
                </div>
              </div>
            </motion.label>
            <motion.label 
              className="flex items-center gap-3 cursor-pointer hover-lift"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-700/60 bg-slate-900/60 text-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300"
              />
              <div>
                <div className="font-medium text-slate-200 fluid-text-sm">
                  Zwei-Faktor-Authentifizierung (2FA)
                </div>
                <div className="text-sm text-slate-400 fluid-text-xs">
                  Zusätzliche Sicherheitsebene für den Zugriff auf das Dashboard.
                </div>
              </div>
            </motion.label>
          </div>
        </motion.section>

        {/* Database & Storage */}
        <motion.section 
          className="glass-panel-strong p-6 rounded-3xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4 fluid-text-xl">
            <Database size={20} className="text-purple-400" />
            Datenbank & Speicherung
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-md">
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">InfluxDB URL</label>
              <input
                type="text"
                defaultValue="http://192.168.1.102:8086"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">InfluxDB Token</label>
              <input
                type="password"
                defaultValue="••••••••••••••••"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <label className="text-sm font-medium text-slate-300 fluid-text-sm">Lokale Historie (Tage)</label>
              <input
                type="number"
                defaultValue="30"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
              <p className="text-xs text-slate-400 fluid-text-xxs">
                Speicherdauer in der lokalen IndexedDB (Dexie.js).
              </p>
            </motion.div>
          </div>
        </motion.section>

        <motion.div 
          className="flex justify-end pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.button
            type="submit"
            className="btn-primary flex items-center gap-2 px-8 py-3"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {saved ? <Check size={20} className="animate-bounce-slow" /> : <Save size={20} />}
            {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
