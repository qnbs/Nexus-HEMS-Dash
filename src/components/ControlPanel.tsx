import { useActionState } from 'react';
import { Battery, Car, Thermometer } from 'lucide-react';

import { CommandType, EnergyData, EvState, HpState } from '../types';

export function ControlPanel({
  sendCommand,
  data,
}: {
  sendCommand: (type: CommandType, value: number) => void;
  data: EnergyData;
}) {
  // Mock action for EV charging
  const [evState, evAction, isEvPending] = useActionState(
    async (state: EvState, formData: FormData) => {
      const mode = formData.get('evMode');
      const power =
        mode === 'fast' ? 11000 : mode === 'pv' ? Math.max(0, data.pvPower - data.houseLoad) : 0;

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      sendCommand('SET_EV_POWER', power);

      return { mode, power, message: 'Ladestrategie aktualisiert' };
    },
    { mode: 'off', power: 0, message: '' },
  );

  // Mock action for Heat Pump SG Ready
  const [hpState, hpAction, isHpPending] = useActionState(
    async (state: HpState, formData: FormData) => {
      const mode = formData.get('hpMode');
      // SG Ready Modes: 1=Sperre(0W), 2=Normal(800W), 3=Empfehlung(1500W), 4=Befehl(2500W)
      let power = 800;
      if (mode === '1') power = 0;
      if (mode === '3') power = 1500;
      if (mode === '4') power = 2500;

      await new Promise((resolve) => setTimeout(resolve, 600));
      sendCommand('SET_HEAT_PUMP_POWER', power);

      return { mode, power, message: 'SG Ready Status gesetzt' };
    },
    { mode: '2', power: 800, message: '' },
  );

  return (
    <div className="space-y-6">
      {/* EV Charging Control */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Car size={18} className="text-purple-400" />
            Wallbox Ladestrategie
          </h3>
          <span className="text-sm font-mono text-slate-400">
            {(data.evPower / 1000).toFixed(1)} kW
          </span>
        </div>

        <form action={evAction} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <label
              className={`cursor-pointer text-center py-2 px-3 rounded-lg border transition-colors ${evState.mode === 'off' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/50'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="off"
                className="hidden"
                defaultChecked={evState.mode === 'off'}
              />
              <span className="text-sm">Aus</span>
            </label>
            <label
              className={`cursor-pointer text-center py-2 px-3 rounded-lg border transition-colors ${evState.mode === 'pv' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/50'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="pv"
                className="hidden"
                defaultChecked={evState.mode === 'pv'}
              />
              <span className="text-sm">PV-Überschuss</span>
            </label>
            <label
              className={`cursor-pointer text-center py-2 px-3 rounded-lg border transition-colors ${evState.mode === 'fast' ? 'bg-purple-900/40 border-purple-500/50 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/50'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="fast"
                className="hidden"
                defaultChecked={evState.mode === 'fast'}
              />
              <span className="text-sm">Schnell (11kW)</span>
            </label>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-emerald-400 opacity-80">{evState.message}</span>
            <button
              type="submit"
              disabled={isEvPending}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
            >
              {isEvPending ? 'Speichere...' : 'Anwenden'}
            </button>
          </div>
        </form>
      </div>

      {/* Heat Pump SG Ready */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Thermometer size={18} className="text-orange-400" />
            Wärmepumpe (SG Ready)
          </h3>
          <span className="text-sm font-mono text-slate-400">
            {(data.heatPumpPower / 1000).toFixed(1)} kW
          </span>
        </div>

        <form action={hpAction} className="space-y-3">
          <select
            name="hpMode"
            defaultValue={hpState.mode}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
          >
            <option value="1">Modus 1: EVU-Sperre (0 kW)</option>
            <option value="2">Modus 2: Normalbetrieb</option>
            <option value="3">Modus 3: Empfehlung (Erhöhte Temp)</option>
            <option value="4">Modus 4: Anlaufbefehl (Max. Leistung)</option>
          </select>
          <div className="flex justify-between items-center">
            <span className="text-xs text-emerald-400 opacity-80">{hpState.message}</span>
            <button
              type="submit"
              disabled={isHpPending}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
            >
              {isHpPending ? 'Speichere...' : 'Anwenden'}
            </button>
          </div>
        </form>
      </div>

      {/* Battery Strategy */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center gap-2">
            <Battery size={18} className="text-emerald-400" />
            Batterie-Management
          </h3>
        </div>
        <div className="text-sm text-slate-400 mb-3">
          Aktueller Modus: <span className="text-emerald-300">Self-consumption</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => sendCommand('SET_BATTERY_POWER', -3000)}
            className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            Laden erzwingen
          </button>
          <button
            onClick={() => sendCommand('SET_BATTERY_POWER', 0)}
            className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            Auto
          </button>
        </div>
      </div>
    </div>
  );
}
