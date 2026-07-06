import { Wifi, WifiOff } from 'lucide-react';
import type { AdapterItem } from './types';

export function AdapterRow({
  adapter,
  isConnected,
  latencyMs,
  contrib,
}: {
  adapter: AdapterItem;
  isConnected: boolean;
  latencyMs: number;
  contrib?: boolean;
}) {
  const iconBg = contrib
    ? isConnected
      ? 'bg-emerald-500/15 text-emerald-400'
      : 'bg-white/5 text-(--color-muted)'
    : isConnected
      ? 'bg-emerald-500/15 text-emerald-400'
      : 'bg-red-500/15 text-red-400';
  const statusIcon = isConnected ? (
    <Wifi size={14} className="text-emerald-400" />
  ) : (
    <WifiOff size={14} className={contrib ? 'text-(--color-muted)' : 'text-red-400'} />
  );

  return (
    <div className="group flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
        {adapter.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-(--color-text) text-sm">{adapter.name}</span>
          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-(--color-muted) text-[9px]">
            {adapter.protocol}
          </span>
          {contrib && (
            <span className="shrink-0 rounded bg-(--color-primary)/10 px-1.5 py-0.5 text-(--color-primary) text-[9px]">
              contrib
            </span>
          )}
        </div>
        <p className="truncate text-(--color-muted) text-[10px]">{adapter.desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {latencyMs > 0 && (
          <span className="font-mono text-(--color-muted) text-[10px]">
            {latencyMs.toFixed(0)}ms
          </span>
        )}
        {statusIcon}
      </div>
    </div>
  );
}
