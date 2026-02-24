import { useWebSocket } from '../useWebSocket';
import { useAppStore } from '../store';
import { Activity, Battery, Home, Sun, Thermometer, Zap } from 'lucide-react';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { Floorplan } from '../components/Floorplan';
import { ControlPanel } from '../components/ControlPanel';

export function Dashboard() {
  const { sendCommand } = useWebSocket();
  const { energyData } = useAppStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Energy Flow (Sankey) */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Activity size={20} className="text-slate-400" />
          Echtzeit-Energiefluss
        </h2>
        <div className="flex-1 min-h-[400px] relative">
          <SankeyDiagram data={energyData} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
        <MetricCard
          icon={<Sun className="text-yellow-400" />}
          label="PV-Erzeugung"
          value={`${(energyData.pvPower / 1000).toFixed(2)} kW`}
          subValue={`${energyData.pvYieldToday.toFixed(1)} kWh heute`}
        />
        <MetricCard
          icon={
            <Battery className={energyData.batterySoC > 20 ? 'text-emerald-400' : 'text-red-400'} />
          }
          label="Batteriespeicher"
          value={`${energyData.batterySoC.toFixed(1)} %`}
          subValue={`${(energyData.batteryPower / 1000).toFixed(2)} kW`}
        />
        <MetricCard
          icon={<Home className="text-blue-400" />}
          label="Hausverbrauch"
          value={`${(energyData.houseLoad / 1000).toFixed(2)} kW`}
          subValue="Inkl. Grundlast"
        />
        <MetricCard
          icon={<Zap className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'} />}
          label="Netzbezug"
          value={`${(energyData.gridPower / 1000).toFixed(2)} kW`}
          subValue={energyData.gridPower > 0 ? 'Bezug' : 'Einspeisung'}
        />
      </div>

      {/* Floorplan & KNX Integration */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Home size={20} className="text-slate-400" />
          Gebäudeautomation (KNX)
        </h2>
        <div className="h-[300px] w-full bg-slate-800/50 rounded-xl overflow-hidden border border-white/5">
          <Floorplan />
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Thermometer size={20} className="text-slate-400" />
          Steuerung & Optimierung
        </h2>
        <ControlPanel sendCommand={sendCommand} data={energyData} />
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">{icon}</div>
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <div>
        <div className="text-2xl font-light tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{subValue}</div>
      </div>
    </div>
  );
}
